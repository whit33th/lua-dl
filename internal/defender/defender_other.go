//go:build !windows

package defender

import "errors"

func IsBlockedError(_ error) bool { return false }

func AddExclusion(_ string) error { return errors.New("not supported") }
