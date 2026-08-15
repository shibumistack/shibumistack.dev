# Server command reference

Installed command is `shis`. `shibumi-server` remains compatible alias.

## Setup

```text
shis                              Guided installation
shis setup                        Guided installation
shis init                         Install only, for automation
shis update                       Install latest stable release
shis uninstall [--purge] [--yes]
```

## Apps

```text
shis list
shis add <domain> [--dry-run]
shis remove <domain|app-id> [--yes]
```

Explicit add requires repository, absolute checkout, and port:

```text
shis add <domain> \
  --repository <github:owner/repo|GitHub URL> \
  --checkout <absolute-path> \
  --port <port> \
  [--ref <refs/heads/main>] \
  [--compose-file <path>] \
  [--compose-command <podman|podman-compose>] \
  [--service <name>] \
  [--health-path </healthz>] \
  [--dry-run] \
  [-- <test-command...>]
```

## Deployment operations

```text
shis status <app-id> [--commit <full-sha>] [--json]
shis history <app-id> [--json]
shis logs <app-id>
shis rollback <app-id> [--yes]
shis caddy-cutover <app-id>
```

Rollback restores the one previous successful image retained for the app and verifies health without rebuilding.

## Client handoff

```text
shis client-config <app-id> [--server-hostname <host>]
shis webhook-secret <app-id>
```

`client-config` prints commit-safe JSON. `webhook-secret` prints secret JSON only for explicit SSH handoff.

## Service internals

```text
shis check --config <path>
shis serve --config <path>
```

`serve` is systemd entrypoint and skips npm update checks.
