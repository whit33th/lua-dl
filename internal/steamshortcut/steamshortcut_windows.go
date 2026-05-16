package steamshortcut

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

func FindSteam() (string, bool) {
	for _, dir := range []string{
		os.Getenv("ProgramFiles(x86)"),
		os.Getenv("ProgramFiles"),
	} {
		if dir == "" {
			continue
		}
		steam := filepath.Join(dir, "Steam")
		if _, err := os.Stat(filepath.Join(steam, "config", "loginusers.vdf")); err == nil {
			return steam, true
		}
	}
	return "", false
}

func MostRecentAccount(steamPath string) (Account, error) {
	data, err := os.ReadFile(filepath.Join(steamPath, "config", "loginusers.vdf"))
	if err != nil {
		return Account{}, err
	}
	return parseLoginUsers(string(data)), nil
}

func SteamLanguage() string {
	return "english"
}

func parseLoginUsers(vdf string) Account {
	var account Account
	var currentID uint64
	var currentPersona string
	var currentRecent bool

	for _, line := range strings.Split(vdf, "\n") {
		fields := vdfFields(line)
		if len(fields) == 1 {
			if id, err := strconv.ParseUint(fields[0], 10, 64); err == nil {
				currentID = id
				currentPersona = ""
				currentRecent = false
			}
			continue
		}
		if len(fields) < 2 || currentID == 0 {
			continue
		}
		switch strings.ToLower(fields[0]) {
		case "personaname":
			currentPersona = fields[1]
		case "mostrecent":
			currentRecent = fields[1] == "1"
		}
		if currentRecent {
			account = Account{Persona: currentPersona, SteamID64: currentID}
		}
	}
	return account
}

func vdfFields(line string) []string {
	var fields []string
	for rest := line; ; {
		start := strings.IndexByte(rest, '"')
		if start < 0 {
			break
		}
		rest = rest[start:]
		var s string
		if err := json.Unmarshal([]byte(rest[:strings.IndexByte(rest[1:], '"')+2]), &s); err != nil {
			break
		}
		fields = append(fields, s)
		rest = rest[strings.IndexByte(rest[1:], '"')+2:]
	}
	return fields
}
