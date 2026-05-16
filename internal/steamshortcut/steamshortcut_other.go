//go:build !windows

package steamshortcut

func FindSteam() (string, bool) {
	return "", false
}

func MostRecentAccount(string) (Account, error) {
	return Account{}, nil
}

func SteamLanguage() string {
	return "english"
}
