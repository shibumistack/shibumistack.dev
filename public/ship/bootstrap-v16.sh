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
terminal_device=
terminal_state=

cleanup() {
  if [ -n "$terminal_device" ] && [ -n "$terminal_state" ]; then
    stty "$terminal_state" <"$terminal_device" 2>/dev/null || true
  fi
  rm -f "$temporary"
}
trap cleanup EXIT
trap 'exit 130' HUP INT TERM

terminal=$(ps -o tty= -p $$ | tr -d ' ')
case "$terminal" in
  ''|'?'|'??') ;;
  *)
    terminal_device="/dev/$terminal"
    if [ -r "$terminal_device" ]; then
      terminal_state=$(stty -g <"$terminal_device" 2>/dev/null || true)
    else
      terminal_device=
    fi
    ;;
esac

curl -fsSL https://shibumistack.dev/ship/install-v23.ts -o "$temporary"

if [ -n "$terminal_device" ]; then
  bun "$temporary" "$@" <"$terminal_device"
else
  bun "$temporary" "$@"
fi
