package onlinefix

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/nwaples/rardecode/v2"

	"github.com/hoangvu12/lua-dl/internal/defender"
	"github.com/hoangvu12/lua-dl/internal/ui"
)

// apply runs the download+extract pipeline for a picked game: extract its
// upload-folder slug, warm the cookie jar on the folder listing, list the
// Fix Repair subdirectory, download each .rar in it, and extract them over
// gameDir using the rar-v5 password "online-fix.me". The Fix Repair archives
// use an in-place layout so a simple extract-over-root is all we need.
func apply(ctx context.Context, client *http.Client, pageURL, gameDir string) error {
	slug, err := extractUploadSlug(ctx, client, pageURL)
	if err != nil {
		return err
	}

	// The uploads origin sets an `online_fix_auth` cookie on the first
	// contact with the game folder listing; we need that cookie on the
	// follow-up Fix Repair listing and file GETs, so warm the jar here.
	folderURL := uploadsBase + "/uploads/" + slug + "/"
	if _, err := fetchString(ctx, client, folderURL, pageURL); err != nil {
		return err
	}

	fixListURL := folderURL + "Fix%20Repair/"
	rars, err := listRARs(ctx, client, fixListURL, pageURL)
	if err != nil {
		return err
	}
	if len(rars) == 0 {
		return errors.New("Fix Repair folder is empty for this game")
	}

	tmpRoot, err := os.MkdirTemp("", "lua-dl-fix-*")
	if err != nil {
		return err
	}
	defer os.RemoveAll(tmpRoot)

	for _, name := range rars {
		rarURL := fixListURL + url.PathEscape(name)
		if err := downloadRAR(ctx, client, rarURL, pageURL, filepath.Join(tmpRoot, name), name); err != nil {
			return fmt.Errorf("download %s: %w", name, err)
		}
	}

	ui.Step("adding Defender exclusion for Online-Fix files · click Yes in the popup")
	if err := defender.AddExclusion(gameDir); err != nil {
		return fmt.Errorf("auto-fix failed — add this folder to Defender exclusions manually and retry:\n     %s", gameDir)
	}

	primary := filepath.Join(tmpRoot, primaryRAR(rars))
	ui.Step(fmt.Sprintf("extracting %s", filepath.Base(primary)))
	n, err := extractOver(primary, gameDir)
	if err != nil {
		if defender.IsBlockedError(err) {
			n, err = retryAfterDefenderExclusion(primary, gameDir)
			if err == nil {
				ui.LastStep(fmt.Sprintf("applied %d %s", n, ui.Plural(n, "file", "files")))
				return nil
			}
		}
		return fmt.Errorf("extract: %w", err)
	}
	if missing := missingOnlineFixLoaders(gameDir); len(missing) > 0 {
		ui.Step(fmt.Sprintf("Online-Fix files missing after extract (%s) · click Yes in the popup to fix", strings.Join(missing, ", ")))
		n, err = retryAfterDefenderExclusion(primary, gameDir)
		if err != nil {
			return err
		}
	}
	ui.LastStep(fmt.Sprintf("applied %d %s", n, ui.Plural(n, "file", "files")))
	return nil
}
func missingOnlineFixLoaders(gameDir string) []string {
	// Defender can quarantine a just-written DLL shortly after extraction
	// returns, so require the files to stay present for a short window.
	var missing []string
	for i := 0; i < 6; i++ {
		missing = currentMissingOnlineFixLoaders(gameDir)
		if len(missing) > 0 {
			return missing
		}
		time.Sleep(500 * time.Millisecond)
	}
	return nil
}

func currentMissingOnlineFixLoaders(gameDir string) []string {
	var missing []string
	for _, name := range []string{"OnlineFix64.dll", "winmm.dll"} {
		if _, err := os.Stat(filepath.Join(gameDir, name)); errors.Is(err, os.ErrNotExist) {
			missing = append(missing, name)
		}
	}
	return missing
}

func retryAfterDefenderExclusion(primary, gameDir string) (int, error) {
	if exclErr := defender.AddExclusion(gameDir); exclErr != nil {
		return 0, fmt.Errorf("auto-fix failed — add this folder to Defender exclusions manually and retry:\n     %s", gameDir)
	}
	ui.Step("exclusion added · extracting Online-Fix again")
	n, err := extractOver(primary, gameDir)
	if err != nil {
		return n, fmt.Errorf("extract after exclusion: %w", err)
	}
	if missing := missingOnlineFixLoaders(gameDir); len(missing) > 0 {
		return n, fmt.Errorf("Online-Fix files are still missing after exclusion: %s", strings.Join(missing, ", "))
	}
	return n, nil
}

func missingOnlineFixLoaders(gameDir string) []string {
	// Defender can quarantine a just-written DLL shortly after extraction
	// returns, so require the files to stay present for a short window.
	var missing []string
	for i := 0; i < 6; i++ {
		missing = currentMissingOnlineFixLoaders(gameDir)
		if len(missing) > 0 {
			return missing
		}
		time.Sleep(500 * time.Millisecond)
	}
	return nil
}

func currentMissingOnlineFixLoaders(gameDir string) []string {
	var missing []string
	for _, name := range []string{"OnlineFix64.dll", "winmm.dll"} {
		if _, err := os.Stat(filepath.Join(gameDir, name)); errors.Is(err, os.ErrNotExist) {
			missing = append(missing, name)
		}
	}
	return missing
}

var uploadSlugRE = regexp.MustCompile(`uploads\.online-fix\.me:2053/uploads/([^/"]+)/`)

func extractUploadSlug(ctx context.Context, client *http.Client, pageURL string) (string, error) {
	html, err := fetchString(ctx, client, pageURL, siteURL+"/")
	if err != nil {
		return "", err
	}
	m := uploadSlugRE.FindStringSubmatch(html)
	if m == nil {
		return "", errors.New("no uploads.online-fix.me link on game page")
	}
	slug, err := url.PathUnescape(m[1])
	if err != nil {
		return "", err
	}
	return slug, nil
}

// rarHrefRE picks .rar entries out of nginx autoindex HTML. Each file shows
// up as `<a href="name">name</a>  date  size` on its own line.
var rarHrefRE = regexp.MustCompile(`<a href="([^"]+\.rar)">`)

func listRARs(ctx context.Context, client *http.Client, listURL, referer string) ([]string, error) {
	body, err := fetchString(ctx, client, listURL, referer)
	if err != nil {
		return nil, err
	}
	var out []string
	for _, m := range rarHrefRE.FindAllStringSubmatch(body, -1) {
		name, err := url.PathUnescape(m[1])
		if err != nil {
			name = m[1]
		}
		out = append(out, filepath.Base(filepath.FromSlash(name)))
	}
	return out, nil
}

func downloadRAR(ctx context.Context, client *http.Client, url, referer, dst, displayName string) error {
	res, err := get(ctx, client, url, referer)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		if res.StatusCode == http.StatusUnauthorized || res.StatusCode == http.StatusForbidden {
			return fmt.Errorf("online-fix download is unavailable or closed for this game (HTTP %d)", res.StatusCode)
		}
		return fmt.Errorf("GET %s: HTTP %d", url, res.StatusCode)
	}
	f, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer f.Close()

	// Content-Length lets the bar show a percentage. If the server omits it
	// (rare for static .rar) the bar still shows bytes/rate, just no total.
	var total uint64
	if cl := res.Header.Get("Content-Length"); cl != "" {
		if n, err := strconv.ParseUint(cl, 10, 64); err == nil {
			total = n
		}
	}
	pr := ui.NewProgressReader(res.Body, total, "downloading "+displayName)
	defer pr.Done()
	_, err = io.Copy(f, pr)
	return err
}

// primaryRAR picks which .rar in the download dir is the entry point for
// rardecode — for single-volume archives there's only one; for multi-volume
// the first is `.part1.rar` or `.part01.rar` and rardecode auto-follows the
// siblings once it's given the first.
func primaryRAR(names []string) string {
	for _, n := range names {
		ln := strings.ToLower(n)
		if strings.Contains(ln, ".part1.") || strings.Contains(ln, ".part01.") {
			return n
		}
	}
	return names[0]
}

func extractOver(rarPath, gameDir string) (int, error) {
	r, err := rardecode.OpenReader(rarPath, rardecode.Password(rarPassword))
	if err != nil {
		return 0, err
	}
	defer r.Close()
	var n int
	for {
		hdr, err := r.Next()
		if errors.Is(err, io.EOF) {
			return n, nil
		}
		if err != nil {
			return n, err
		}
		dst := filepath.Join(gameDir, filepath.FromSlash(hdr.Name))
		if !insideDir(gameDir, dst) {
			return n, fmt.Errorf("refusing to extract outside game directory: %s", hdr.Name)
		}
		if hdr.IsDir {
			if err := os.MkdirAll(dst, 0o755); err != nil {
				return n, err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
			return n, err
		}
		f, err := os.Create(dst)
		if err != nil {
			return n, err
		}
		if _, err := io.Copy(f, r); err != nil {
			f.Close()
			return n, err
		}
		if err := f.Close(); err != nil {
			return n, err
		}
		n++
	}
}

func insideDir(root, path string) bool {
	rootAbs, err := filepath.Abs(root)
	if err != nil {
		return false
	}
	pathAbs, err := filepath.Abs(path)
	if err != nil {
		return false
	}
	rel, err := filepath.Rel(rootAbs, pathAbs)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}
