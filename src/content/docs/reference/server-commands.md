# Server command reference

The installer adds `shis`. `shibumi-server` remains an alias.

## Setup

```usage
shis                              Guided installation
shis setup                        Guided installation
shis init                         Install only, for automation
shis update                       Install latest stable release
shis uninstall [--purge] [--yes]
```

## Apps

```usage
shis list
shis add <domain> [--dry-run] [--yes]
shis remove <domain|app-id> [--yes]
shis set-repository <domain|app-id> <repository> [--yes]
```

`remove` deletes Shibumi config, the webhook secret, deployment status and history, the managed Caddy route, the per-app environment store, and the app containers. Its outro names what stayed: the checkout, volumes, images, and the GitHub webhook. Removing the last app stops the service.

`add` on a checkout path whose Git origin points at a different repository offers to move that checkout to `<checkout>.bak` and clone the requested repository fresh. `--yes` accepts the move; the offer is refused only when `<checkout>.bak` already exists.

`set-repository` repoints an app that is already registered. The old checkout moves to `<checkout>.bak`, the new repository is cloned in its place, and the Compose file path is re-detected in the new tree rather than carried over. Caddy and the app registration are otherwise untouched. Failed detection restores the original checkout from `.bak`.

Explicit add requires repository, absolute checkout, and port:

```usage
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

## Deployments

```usage
shis status <app-id> [--commit <full-sha>] [--json]
shis history <app-id> [--json]
shis logs <app-id>
shis rollback <app-id> [--yes]
shis caddy-cutover <app-id>
shis caddy-refresh <app-id>
```

Rollback restores the one previous successful image retained for the app for up to 12 hours and verifies health without rebuilding. `caddy-refresh` adds current retry buffering to an existing managed route without replacing its other Caddy settings.

## Project setup data

```usage
shis client-config <app-id> [--server-hostname <host>]
shis webhook-secret <app-id>
```

`client-config` prints commit-safe JSON. `webhook-secret` prints secret JSON only for explicit SSH handoff.

## Service commands

```usage
shis check --config <path>
shis serve --config <path>
```

`serve` is systemd entrypoint and skips npm update checks.
