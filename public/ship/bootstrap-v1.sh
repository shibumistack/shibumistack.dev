#!/bin/sh
set -eu

command -v bun >/dev/null 2>&1 || {
  printf '%s\n' 'shibumi ship installer failed: Bun is required.' >&2
  printf '%s\n' 'Next: install Bun from https://bun.sh, then rerun this command.' >&2
  exit 1
}
command -v curl >/dev/null 2>&1 || {
  printf '%s\n' 'shibumi ship installer failed: curl is required.' >&2
  exit 1
}

temporary=$(mktemp "${TMPDIR:-/tmp}/shibumi-ship.XXXXXX")
trap 'rm -f "$temporary"' EXIT HUP INT TERM
curl -fsSL https://shibumistack.dev/ship/install-v9.ts -o "$temporary"

if (: </dev/tty) 2>/dev/null; then
  bun "$temporary" </dev/tty
else
  bun "$temporary"
fi
