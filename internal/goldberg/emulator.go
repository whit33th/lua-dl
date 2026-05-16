package goldberg

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/bodgit/sevenzip"

	"github.com/hoangvu12/lua-dl/internal/steamshortcut"
	"github.com/hoangvu12/lua-dl/internal/ui"
)

const (
	gbeRepo  = "Detanup01/gbe_fork"
	gbeAsset = "emu-win-release.7z"
)

type ghAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

type ghRelease struct {
	TagName string    `json:"tag_name"`
	Assets  []ghAsset `json:"assets"`
}

func apply(ctx context.Context, appID uint32, gameDir string) error {
	ui.Step("scanning game binaries for Steam interfaces")
	ifaces, err := scanInterfaces(gameDir)
	if err != nil {
		return fmt.Errorf("scan: %w", err)
	}

	dlls, err := findSteamAPIDLLs(gameDir)
	if err != nil {
		return fmt.Errorf("find dlls: %w", err)
	}
	if len(dlls) == 0 {
		return fmt.Errorf("no steam_api.dll or steam_api64.dll found in game directory")
	}

	ui.Step("fetching Goldberg emulator (gbe_fork)")
	gbeDir, err := fetchGBE(ctx, gameDir)
	if err != nil {
		return fmt.Errorf("fetch gbe: %w", err)
	}

	for _, dllPath := range dlls {
		if err := applyToLocation(gbeDir, dllPath, appID, ifaces); err != nil {
			return fmt.Errorf("apply to %s: %w", filepath.Base(filepath.Dir(dllPath)), err)
		}
	}
	if err := applyUnityRootCopies(gbeDir, gameDir, appID, dlls); err != nil {
		return fmt.Errorf("apply Unity root copies: %w", err)
	}
	if err := writeColdClientFallback(gbeDir, gameDir, appID); err == nil {
		ui.Step("Wrote Goldberg fallback launcher")
	}

	ui.LastStep(fmt.Sprintf("applied to %d location(s) · %d interface(s) detected",
		len(dlls), len(ifaces)))
	return nil
}

// fetchGBE downloads (and caches) the gbe_fork Windows release, returning
// the directory that contains the extracted steam_api*.dll files.
func fetchGBE(ctx context.Context, gameDir string) (string, error) {
	rel, err := latestRelease(ctx)
	if err != nil {
		return "", fmt.Errorf("github: %w", err)
	}

	cacheBase := filepath.Join(filepath.Dir(gameDir), ".lua-dl", "gbe")
	cacheDir := filepath.Join(cacheBase, rel.TagName)
	if cacheComplete(cacheDir) {
		return cacheDir, nil
	}
	_ = os.RemoveAll(cacheDir)

	var assetURL string
	for _, a := range rel.Assets {
		if a.Name == gbeAsset {
			assetURL = a.BrowserDownloadURL
			break
		}
	}
	if assetURL == "" {
		return "", fmt.Errorf("asset %s not found in release %s", gbeAsset, rel.TagName)
	}

	if err := os.MkdirAll(cacheDir, 0o755); err != nil {
		return "", err
	}

	err = downloadAndExtract(ctx, assetURL, cacheDir)
	if err == nil {
		return cacheDir, nil
	}

	return "", err
}
func downloadAndExtract(ctx context.Context, assetURL, cacheDir string) error {
	archivePath := filepath.Join(cacheDir, gbeAsset)
	if err := downloadFile(ctx, assetURL, archivePath); err != nil {
		_ = os.Remove(archivePath)
		return fmt.Errorf("download: %w", err)
	}
	if err := extractDLLs(archivePath, cacheDir); err != nil {
		return fmt.Errorf("extract: %w", err)
	}
	_ = os.Remove(archivePath)
	return nil
}

func allDLLsCached(dir string) bool {
	for _, name := range []string{"steam_api.dll", "steam_api64.dll"} {
		if _, err := os.Stat(filepath.Join(dir, name)); err != nil {
			return false
		}
	}
	return true
}

func cacheComplete(dir string) bool {
	if !allDLLsCached(dir) {
		return false
	}
	for _, name := range []string{"steamclient_loader_64.exe", "steamclient_loader.exe", "steamclient64.dll"} {
		if _, err := os.Stat(filepath.Join(dir, name)); err == nil {
			return true
		}
	}
	return false
}

func latestRelease(ctx context.Context) (*ghRelease, error) {
	req, err := http.NewRequestWithContext(ctx, "GET",
		"https://api.github.com/repos/"+gbeRepo+"/releases/latest", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("GitHub API: HTTP %d", resp.StatusCode)
	}
	var rel ghRelease
	if err := json.NewDecoder(resp.Body).Decode(&rel); err != nil {
		return nil, err
	}
	return &rel, nil
}

func downloadFile(ctx context.Context, url, destPath string) error {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	f, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer f.Close()

	var total uint64
	if resp.ContentLength > 0 {
		total = uint64(resp.ContentLength)
	}
	pr := ui.NewProgressReader(resp.Body, total, gbeAsset)
	_, err = io.Copy(f, pr)
	pr.Done()
	return err
}

// extractDLLs pulls the useful Windows release files out of the 7z archive
// into destDir. It takes the first match for each basename regardless of path depth.
func extractDLLs(archivePath, destDir string) error {
	r, err := sevenzip.OpenReader(archivePath)
	if err != nil {
		return err
	}
	defer r.Close()

	// false = not yet extracted, absence = not wanted
	needed := map[string]bool{
		"steam_api.dll":   false,
		"steam_api64.dll": false,
	}
	optional := map[string]bool{
		"steamclient.dll":           false,
		"steamclient64.dll":         false,
		"steamclient_loader.exe":    false,
		"steamclient_loader_32.exe": false,
		"steamclient_loader_64.exe": false,
		"coldclientloader.ini":      false,
	}

	for _, f := range r.File {
		if f.FileInfo().IsDir() {
			continue
		}
		name := strings.ToLower(filepath.Base(filepath.FromSlash(f.Name)))
		done, want := needed[name]
		if !want {
			done, want = optional[name]
		}
		if !want || done {
			continue
		}

		rc, err := f.Open()
		if err != nil {
			return fmt.Errorf("open %s in archive: %w", f.Name, err)
		}
		outf, err := os.Create(filepath.Join(destDir, name))
		if err != nil {
			rc.Close()
			return err
		}
		_, copyErr := io.Copy(outf, rc)
		outf.Close()
		rc.Close()
		if copyErr != nil {
			return copyErr
		}
		if _, ok := needed[name]; ok {
			needed[name] = true
		} else {
			optional[name] = true
		}
	}

	for name, found := range needed {
		if !found {
			return fmt.Errorf("%s not found in archive", name)
		}
	}
	return nil
}

// applyToLocation backs up the original DLL, replaces it with Goldberg's
// version, and writes steam_settings/ config files next to it.
func applyToLocation(gbeDir, dllPath string, appID uint32, ifaces []string) error {
	dllName, err := emulatorDLLName(dllPath)
	if err != nil {
		return err
	}
	srcDLL := filepath.Join(gbeDir, dllName)
	if _, err := os.Stat(srcDLL); err != nil {
		return fmt.Errorf("goldberg %s not found in cache", dllName)
	}

	// Backup original
	backupPath := dllPath + ".bak"
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		if err := os.Rename(dllPath, backupPath); err != nil {
			return fmt.Errorf("backup original: %w", err)
		}
	} else if err != nil {
		return fmt.Errorf("check backup: %w", err)
	}

	if err := copyFile(srcDLL, dllPath); err != nil {
		return fmt.Errorf("copy emulator dll: %w", err)
	}

	settingsDir := filepath.Join(filepath.Dir(dllPath), "steam_settings")
	if err := os.MkdirAll(settingsDir, 0o755); err != nil {
		return err
	}

	if err := os.WriteFile(
		filepath.Join(settingsDir, "steam_appid.txt"),
		[]byte(fmt.Sprintf("%d\n", appID)),
		0o644,
	); err != nil {
		return err
	}

	if len(ifaces) > 0 {
		if err := os.WriteFile(
			filepath.Join(settingsDir, "steam_interfaces.txt"),
			[]byte(strings.Join(ifaces, "\n")+"\n"),
			0o644,
		); err != nil {
			return err
		}
	}

	writeDefaultConfigs(settingsDir)
	writePersona(settingsDir)
	return nil
}

func writeDefaultConfigs(settingsDir string) {
	_ = os.WriteFile(filepath.Join(settingsDir, "configs.app.ini"), []byte("[app::dlcs]\nunlock_all=1\n"), 0o644)
	_ = os.WriteFile(filepath.Join(settingsDir, "configs.main.ini"), []byte("[main::general]\nnew_app_ticket=1\ngc_token=1\n"), 0o644)
}

func applyUnityRootCopies(gbeDir, gameDir string, appID uint32, dlls []string) error {
	roots, err := unityRoots(gameDir)
	if err != nil || len(roots) == 0 {
		return err
	}
	for _, root := range roots {
		arch := ""
		for _, dllPath := range dlls {
			rel, err := filepath.Rel(root, dllPath)
			if err == nil && !strings.HasPrefix(rel, "..") {
				arch, _ = peArch(dllPath)
				break
			}
		}
		if arch == "" {
			arch = "x64"
		}
		srcName := "steam_api.dll"
		if arch == "x64" {
			srcName = "steam_api64.dll"
		}
		if err := copyFile(filepath.Join(gbeDir, srcName), filepath.Join(root, "steam_api.dll")); err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(root, "steam_appid.txt"), []byte(fmt.Sprintf("%d\n", appID)), 0o644); err != nil {
			return err
		}
	}
	return nil
}

func unityRoots(gameDir string) ([]string, error) {
	seen := map[string]bool{}
	var roots []string
	err := filepath.WalkDir(gameDir, func(path string, d os.DirEntry, err error) error {
		if err != nil || !d.IsDir() {
			return err
		}
		if strings.HasSuffix(strings.ToLower(d.Name()), "_data") {
			root := filepath.Dir(path)
			if !seen[root] {
				seen[root] = true
				roots = append(roots, root)
			}
		}
		return nil
	})
	return roots, err
}

func writeColdClientFallback(gbeDir, gameDir string, appID uint32) error {
	exe, err := mainExe(gameDir)
	if err != nil {
		return err
	}
	arch, err := peArch(exe)
	if err != nil {
		return err
	}
	loader := "steamclient_loader.exe"
	if arch == "x64" {
		loader = firstExisting(gbeDir, "steamclient_loader_64.exe", "steamclient_loader.exe")
	} else {
		loader = firstExisting(gbeDir, "steamclient_loader_32.exe", "steamclient_loader.exe")
	}
	if loader == "" {
		return fmt.Errorf("ColdClientLoader not in cached release")
	}
	loaderSrc := filepath.Join(gbeDir, loader)
	loaderDst := filepath.Join(gameDir, loader)
	if err := copyFile(loaderSrc, loaderDst); err != nil {
		return err
	}

	steamclient := "steamclient.dll"
	if arch == "x64" {
		steamclient = "steamclient64.dll"
	}
	if _, err := os.Stat(filepath.Join(gbeDir, steamclient)); err == nil {
		if err := copyFile(filepath.Join(gbeDir, steamclient), filepath.Join(gameDir, steamclient)); err != nil {
			return err
		}
	}

	ini := fmt.Sprintf("[SteamClient]\nExe=%s\nExeRunDir=.\nExeCommandLine=\nAppId=%d\nSteamClientDll=%s\n", filepath.Base(exe), appID, steamclient)
	if err := os.WriteFile(filepath.Join(gameDir, "ColdClientLoader.ini"), []byte(ini), 0o644); err != nil {
		return err
	}
	bat := fmt.Sprintf("@echo off\r\ncd /d %%~dp0\r\n\"%%~dp0%s\"\r\n", loader)
	return os.WriteFile(filepath.Join(gameDir, "launch-goldberg-loader.bat"), []byte(bat), 0o644)
}

func firstExisting(dir string, names ...string) string {
	for _, name := range names {
		if _, err := os.Stat(filepath.Join(dir, name)); err == nil {
			return name
		}
	}
	return ""
}

func mainExe(gameDir string) (string, error) {
	base := strings.TrimSuffix(filepath.Base(gameDir), string(filepath.Separator))
	preferred := filepath.Join(gameDir, base+".exe")
	if _, err := os.Stat(preferred); err == nil {
		return preferred, nil
	}
	var found string
	err := filepath.WalkDir(gameDir, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() || found != "" {
			return err
		}
		if strings.EqualFold(filepath.Ext(d.Name()), ".exe") {
			found = path
		}
		return nil
	})
	if err != nil {
		return "", err
	}
	if found == "" {
		return "", fmt.Errorf("no exe found")
	}
	return found, nil
}

func emulatorDLLName(dllPath string) (string, error) {
	base := strings.ToLower(filepath.Base(dllPath))
	if base == "steam_api64.dll" {
		return base, nil
	}
	arch, err := peArch(dllPath)
	if err != nil {
		return "", fmt.Errorf("detect dll architecture: %w", err)
	}
	if arch == "x64" {
		return "steam_api64.dll", nil
	}
	return "steam_api.dll", nil
}

func peArch(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	var dos [64]byte
	if _, err := io.ReadFull(f, dos[:]); err != nil {
		return "", err
	}
	peOffset := int64(binary.LittleEndian.Uint32(dos[0x3c:]))
	if peOffset <= 0 {
		return "", fmt.Errorf("invalid PE header offset")
	}
	if _, err := f.Seek(peOffset, io.SeekStart); err != nil {
		return "", err
	}
	var hdr [6]byte
	if _, err := io.ReadFull(f, hdr[:]); err != nil {
		return "", err
	}
	if string(hdr[:4]) != "PE\x00\x00" {
		return "", fmt.Errorf("missing PE signature")
	}
	switch binary.LittleEndian.Uint16(hdr[4:]) {
	case 0x8664:
		return "x64", nil
	case 0x14c:
		return "x86", nil
	default:
		return "", fmt.Errorf("unsupported PE machine 0x%x", binary.LittleEndian.Uint16(hdr[4:]))
	}
}

// writePersona populates account_name.txt, user_steam_id.txt, and
// language.txt from the user's real Steam install so Goldberg-cracked
// games show the user's actual persona/ID/language instead of the
// generic Goldberg defaults. Best-effort: skips silently when Steam
// isn't installed or no account is logged in.
func writePersona(settingsDir string) {
	steamPath, ok := steamshortcut.FindSteam()
	if !ok {
		return
	}
	if a, err := steamshortcut.MostRecentAccount(steamPath); err == nil {
		if a.Persona != "" {
			_ = os.WriteFile(filepath.Join(settingsDir, "account_name.txt"),
				[]byte(a.Persona+"\n"), 0o644)
		}
		if a.SteamID64 != 0 {
			_ = os.WriteFile(filepath.Join(settingsDir, "user_steam_id.txt"),
				[]byte(fmt.Sprintf("%d\n", a.SteamID64)), 0o644)
		}
	}
	_ = os.WriteFile(filepath.Join(settingsDir, "language.txt"),
		[]byte(steamshortcut.SteamLanguage()+"\n"), 0o644)
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}
