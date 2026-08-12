# Server operations

## List apps

```run
shis list
渋み  shis (shibumi-server)
info|example.com  (example-com)
answer|Repository  github:owner/example
answer|Upstream    127.0.0.1:9100
answer|Checkout    /home/deploy/shibumi/example-com
answer|Caddy       managed
outro|1 app registered
```

Shows domain, app ID, repository, loopback upstream, checkout, and Caddy ownership.

## Latest status

```run
shis status example-com
渋み  shis (shibumi-server)
success|55a26db5c43a  succeeded
info|Stage shipped
outro|https://example.com
```

Machine-readable status:

```sh
shis status example-com --commit <full-sha> --json
```

Status is latest atomic snapshot per app. Use [history](/docs/server/history-rollback) for durable recent records.

## Update

```sh
shis update
```

User-run commands check npm with short timeout and suggest update when stable release exists. Registry failures never block local work. Update installs exact reported version, preserves machine config and secrets, moves local release symlink, and reloads service.

## Remove app

```sh
shis remove example.com
```

Removes Shibumi config, webhook secret, deployment status, deployment history, managed Caddy route, and app containers. Preserves checkout, volumes, images, and GitHub webhook. `--yes` skips confirmation but never bypasses sudo.

## Uninstall

```sh
shis uninstall
```

Asks for confirmation, then removes service, launchers, and installed releases. Preserves config, secrets, app checkouts, containers, Caddy routes, and GitHub settings. Automation can pass `--yes`.

```sh
shis uninstall --purge
```

Purge uses a stronger confirmation and also removes config and webhook secrets. Automation must pass `--purge --yes` explicitly.

## Service logs

```sh
journalctl --user -u shibumi-server -f
```

Service logs include stage starts and deployment result. Raw webhook payloads and secrets are not logged.
