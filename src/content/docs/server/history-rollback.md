# History and rollback

## Read recent history

```run
shis history example-com
渋み  shis (shibumi-server)
success|2026-08-12T09:03:07Z  webhook  succeeded  55a26db5c43a  42182ms
success|2026-08-12T08:44:19Z  rollback  succeeded  4e5f3223b71d  38914ms
warn|2026-08-12T08:31:02Z  webhook  failed  a15c9e2d773f  health  27546ms
outro|3 recent records
```

Machine-readable form:

```sh
shis history example-com --json
```

Each app keeps latest 100 records in mode-`0600` JSONL. Records contain timestamp, app ID, full commit, operation kind, result, verified GitHub delivery ID, failed stage, and duration when available.

History never stores webhook payloads, signatures, secrets, or request headers.

## Restore the previous image

```sh
shis rollback example-com
```

Shibumi selects the one previous successful image retained for the app for up to 12 hours, retags it under the Compose image name, recreates the service without building, and verifies health. Successful rollback rotates retention, making the replaced image available for the next rollback. Failed startup or health restores the current image.

Use `--yes` only for confirmed automation:

```sh
shis rollback example-com --yes
```

Receiver pauses during rollback and restarts afterward, preventing webhook deployment from racing operator action.
