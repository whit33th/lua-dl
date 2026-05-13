//go:build windows

package goldberg

import (
	"github.com/hoangvu12/lua-dl/internal/defender"
)

// isDefenderError returns true when Windows Defender quarantined a file
// (ERROR_VIRUS_INFECTED = 0xE1 = 225).
//
// Two checks: syscall.Errno unwrapping (works for direct os.* calls) plus
// a string fallback for libs like bodgit/sevenzip that don't propagate %w.
func isDefenderError(err error) bool {
	return defender.IsBlockedError(err)
}

// addDefenderExclusion pops a UAC dialog asking for admin permission, then
// adds path to Windows Defender's exclusion list. Blocks until the user
// accepts or denies.
func addDefenderExclusion(path string) error {
	return defender.AddExclusion(path)
}
