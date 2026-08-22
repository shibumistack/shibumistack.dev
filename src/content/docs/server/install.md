# Install shibumi-server

Install once on a Linux VPS or homelab server as the user who will own deployments.

## Host requirements

- Linux
- Git
- Caddy
- rootless Podman
- Podman Compose through `podman compose` or `podman-compose`
- systemd user session

Bun is installed by the bootstrap when missing. macOS and Windows users should SSH into the Linux server first. Setup never asks a website for SSH or sudo credentials.

## Run the installer

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
```

The installer checks every host requirement before it writes config. It verifies a working Compose frontend and stores the available command for each app. It stages an exact npm release with lockfile-pinned production dependencies and lifecycle scripts disabled. Both launchers are installed:

```text
~/.local/bin/shis
~/.local/bin/shibumi-server
```

`shis` is the short command used by docs. `shibumi-server` remains compatible.

## Files written

```text
~/.config/shibumi-server/config.json
~/.config/shibumi-server/secrets.env
~/.config/systemd/user/shibumi-server.service
~/.local/share/shibumi-server/releases/<version>/
~/.local/share/shibumi-server/current
```

Configuration and secret files use mode `0600`. Service startup uses the pinned local release, not an unpinned network command.

## Verify installation

```sh
shis --version
systemctl --user status shibumi-server
```

Fresh installation has no app yet. From your local project root, continue with [Connect project to server](/docs/server/ship). Local setup registers the app through SSH. [`shis add`](/docs/server/add-app) remains available for server operators and automation.

## Update

User-run `shis` commands check npm for a newer stable release with a short timeout and suggest:

```sh
shis update
```

Update validates one stable version, installs that exact release, and reuses idempotent initialization. Machine config, secrets, app checkouts, and running apps survive. Registry timeouts or errors never block commands, and `shis serve` performs no update check.
