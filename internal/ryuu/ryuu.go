// Package ryuu speaks to generator.ryuu.lol.
//
// Two endpoints:
//
//	/resellerlua?appid=N&auth_code=...     → {appid}.lua (text)
//	/secure_download?appid=N&auth_code=... → STORED zip containing
//	    {appid}.lua + all {depotId}_{manifestId}.manifest files for the app
//
// The zip is fetched once per appid, parsed in-memory, and cached for the
// duration of the process. One fetch gives us every manifest for the app
// (including DLCs), so every depot after the first pays zero network cost.
//
// All entries inside the zip are STORED, so a ~60-line EOCD walker is enough.
package ryuu

import (
	"context"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
)

const baseURL = "https://generator.ryuu.lol"

// obfuscatedAuthCode is injected at build time by the release workflow via
//
//	-ldflags "-X github.com/hoangvu12/lua-dl/internal/ryuu.obfuscatedAuthCode=<hex>"
//
// It holds the auth code XOR'd with authXORKey and hex-encoded, so the
// literal value never appears as a plaintext string in the binary. Empty in
// local dev builds — set the RYUU_AUTH_CODE env var to override at runtime.
var obfuscatedAuthCode string

// authXORKey is the XOR pad used to obfuscate the injected auth code. It is
// not a secret — the goal is only to keep the auth code itself out of plain
// strings scans of the binary.
const authXORKey = "lua-dl/v1/ryuu-auth-xor-key"

var (
	authCodeOnce sync.Once
	authCodeVal  string
)

func authCode() string {
	authCodeOnce.Do(func() {
		if v := os.Getenv("RYUU_AUTH_CODE"); v != "" {
			authCodeVal = v
			return
		}
		if obfuscatedAuthCode == "" {
			return
		}
		raw, err := hex.DecodeString(obfuscatedAuthCode)
		if err != nil {
			return
		}
		out := make([]byte, len(raw))
		for i := range raw {
			out[i] = raw[i] ^ authXORKey[i%len(authXORKey)]
		}
		authCodeVal = string(out)
	})
	return authCodeVal
}

type Bundle struct {
	Files map[string][]byte // filename → raw bytes
}

var (
	bundleCache   = make(map[uint32]*bundleFuture)
	bundleCacheMu sync.Mutex
)

type bundleFuture struct {
	once   sync.Once
	bundle *Bundle
	err    error
	done   chan struct{}
}

var addAppidRe = regexp.MustCompile(`(?i)addappid\s*\(`)

// FetchLua downloads just the {appid}.lua text.
func FetchLua(ctx context.Context, appID uint32) (string, error) {
	url := fmt.Sprintf("%s/resellerlua?appid=%d&auth_code=%s", baseURL, appID, authCode())
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return "", err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return "", fmt.Errorf("ryuu resellerlua: HTTP %d", res.StatusCode)
	}
	b, err := io.ReadAll(res.Body)
	if err != nil {
		return "", err
	}
	text := string(b)
	if !addAppidRe.MatchString(text) {
		return "", errors.New("ryuu resellerlua: not a lua script")
	}
	return text, nil
}

// FetchBundle downloads and parses the STORED zip for an app, caching the
// result for the process lifetime.
func FetchBundle(ctx context.Context, appID uint32) (*Bundle, error) {
	bundleCacheMu.Lock()
	fut, ok := bundleCache[appID]
	if !ok {
		fut = &bundleFuture{done: make(chan struct{})}
		bundleCache[appID] = fut
	}
	bundleCacheMu.Unlock()

	fut.once.Do(func() {
		defer close(fut.done)
		url := fmt.Sprintf("%s/secure_download?appid=%d&auth_code=%s", baseURL, appID, authCode())
		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			fut.err = err
			return
		}
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			fut.err = err
			return
		}
		defer res.Body.Close()
		if res.StatusCode != 200 {
			fut.err = fmt.Errorf("ryuu secure_download: HTTP %d", res.StatusCode)
			return
		}
		data, err := io.ReadAll(res.Body)
		if err != nil {
			fut.err = err
			return
		}
		b, err := parseStoredZip(data)
		if err != nil {
			fut.err = err
			return
		}
		fut.bundle = b
	})

	<-fut.done
	if fut.err != nil {
		// On failure, evict from cache so a retry can happen.
		bundleCacheMu.Lock()
		if bundleCache[appID] == fut {
			delete(bundleCache, appID)
		}
		bundleCacheMu.Unlock()
		return nil, fut.err
	}
	return fut.bundle, nil
}

// parseStoredZip is a minimal ZIP reader that assumes STORED (method 0)
// entries, which is what ryuu.lol emits. Scans the EOCD record to find the
// central directory, then walks it to locate each file's local header + data.
func parseStoredZip(buf []byte) (*Bundle, error) {
	const (
		eocdSig uint32 = 0x06054b50
		cdSig   uint32 = 0x02014b50
		lfhSig  uint32 = 0x04034b50
	)
	if len(buf) < 22 {
		return nil, errors.New("ryuu zip: too small")
	}

	// EOCD is within the last 65557 bytes (max comment 65535 + 22 header).
	eocdOff := -1
	searchStart := len(buf) - 65557
	if searchStart < 0 {
		searchStart = 0
	}
	for i := len(buf) - 22; i >= searchStart; i-- {
		if binary.LittleEndian.Uint32(buf[i:]) == eocdSig {
			eocdOff = i
			break
		}
	}
	if eocdOff < 0 {
		return nil, errors.New("ryuu zip: EOCD not found")
	}

	entryCount := int(binary.LittleEndian.Uint16(buf[eocdOff+10:]))
	cdOff := int(binary.LittleEndian.Uint32(buf[eocdOff+16:]))

	files := make(map[string][]byte, entryCount)
	p := cdOff
	for i := 0; i < entryCount; i++ {
		if p+46 > len(buf) || binary.LittleEndian.Uint32(buf[p:]) != cdSig {
			return nil, fmt.Errorf("ryuu zip: bad CD sig at %d", p)
		}
		method := binary.LittleEndian.Uint16(buf[p+10:])
		compSize := int(binary.LittleEndian.Uint32(buf[p+20:]))
		uncompSize := int(binary.LittleEndian.Uint32(buf[p+24:]))
		nameLen := int(binary.LittleEndian.Uint16(buf[p+28:]))
		extraLen := int(binary.LittleEndian.Uint16(buf[p+30:]))
		commentLen := int(binary.LittleEndian.Uint16(buf[p+32:]))
		localOff := int(binary.LittleEndian.Uint32(buf[p+42:]))
		name := string(buf[p+46 : p+46+nameLen])
		p += 46 + nameLen + extraLen + commentLen

		if method != 0 {
			return nil, fmt.Errorf("ryuu zip: %s uses method %d, only STORED supported", name, method)
		}
		if compSize != uncompSize {
			return nil, fmt.Errorf("ryuu zip: %s size mismatch", name)
		}
		if localOff+30 > len(buf) || binary.LittleEndian.Uint32(buf[localOff:]) != lfhSig {
			return nil, fmt.Errorf("ryuu zip: bad local header for %s", name)
		}
		lfhNameLen := int(binary.LittleEndian.Uint16(buf[localOff+26:]))
		lfhExtraLen := int(binary.LittleEndian.Uint16(buf[localOff+28:]))
		dataStart := localOff + 30 + lfhNameLen + lfhExtraLen
		if dataStart+compSize > len(buf) {
			return nil, fmt.Errorf("ryuu zip: %s data out of bounds", name)
		}
		// Normalize slashes so callers don't care about host OS.
		key := strings.ReplaceAll(name, "\\", "/")
		files[key] = buf[dataStart : dataStart+compSize]
	}
	return &Bundle{Files: files}, nil
}
