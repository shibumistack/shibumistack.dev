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

Status stores the latest result for each app. [History](/docs/server/history-rollback) keeps up to 100 records.

## Update

```sh
shis update
```

Interactive commands check npm with a short timeout and suggest an update when a stable release exists. Registry failures do not block the command. Update installs that exact version, keeps machine config and secrets, moves the local release symlink, and reloads the service.

## Remove app

```sh
shis remove example.com
```

Removes Shibumi config, webhook secret, deployment status, deployment history, managed Caddy route, per-app environment store, and app containers. Preserves checkout, volumes, images, and GitHub webhook, and the outro names each of those so nothing preserved is a surprise later. `--yes` skips confirmation but never bypasses sudo. Removing the last app stops the service.

## Repoint an app's repository

```sh
shis set-repository example.com github:owner/new-repository
```

Moves the existing checkout to `<checkout>.bak`, clones the new repository in its place, and updates the registration. Caddy is untouched and the app is not re-registered. The Compose file path is re-detected in the new repository rather than reused: `set-repository` exists to swap in an unrelated repository, so assuming its layout matches the old one is not safe. If detection fails partway, the original checkout is restored from `.bak` and the registration is left as it was. The command refuses when `<checkout>.bak` already exists.

`shis add` makes the same offer when the checkout path exists but its Git origin points at a different repository: move it to `.bak` and clone fresh, instead of a dead-end error.

## Uninstall

```sh
shis uninstall
```

Asks for confirmation, then removes service, launchers, and installed releases. Preserves config, secrets, app checkouts, containers, Caddy routes, and GitHub settings. Automation can pass `--yes`.

```sh
shis uninstall --purge
```

Purge uses a stronger confirmation and also removes config and webhook secrets. Automation must pass `--purge --yes` explicitly.

## Refresh Caddy buffering

```sh
shis caddy-refresh <app-id>
```

After a server update, this command adds the current restart retry budget to an existing managed route. It preserves the route's other Caddy settings and fails closed when the managed directive cannot be identified safely.

## Service logs

```sh
journalctl --user -u shibumi-server -f
```

Service logs include stage starts and deployment result. Raw webhook payloads and secrets are not logged.
