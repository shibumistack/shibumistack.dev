# Install shibumi-server

Install once on a Linux VPS or homelab server as the user who will own deployments.

## Requirements

- Linux
- Git
- Caddy
- rootless Podman
- systemd user session

Bun is installed by the bootstrap when missing. macOS and Windows users should SSH into the Linux server first. Setup never asks a website for SSH or sudo credentials.

## Run installer

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
```

Setup checks host requirements before changing configuration. It stages an exact npm release with lockfile-pinned production dependencies and lifecycle scripts disabled. Both launchers are installed:

```text
~/.local/bin/shis
~/.local/bin/shibumi-server
```

`shis` is the short command used by docs. `shibumi-server` remains compatible.

## What installation writes

```text
~/.config/shibumi-server/config.json
~/.config/shibumi-server/secrets.env
~/.config/systemd/user/shibumi-server.service
~/.local/share/shibumi-server/releases/<version>/
~/.local/share/shibumi-server/current
```

Configuration and secret files use mode `0600`. Service startup uses the pinned local release, not an unpinned network command.

## Verify

```sh
shis --version
systemctl --user status shibumi-server
```

Fresh installation has no app yet. Continue with [Add an app](/docs/server/add-app).
