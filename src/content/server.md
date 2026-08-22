# shibumi-server

`shibumi-server` deploys application images to a Linux VPS or homelab server. `bun ship` builds the image on your computer and uploads it through SSH.

> **Released now:** VPS and homelab deployment. Other deploy providers remain planned.

## One deployment

```clack
bun ship
1 commit ready to push
test passed
check passed
Built and uploaded a1b2c3d (45 MiB, 7818747847bb)
Deployment complete
Shipped in 15 seconds
https://example.com
```

Ship builds committed `HEAD` for the server's Linux platform, uploads the tagged image, then pushes Git. In the recommended mode it asks the server over SSH to deploy that exact commit.

The running app stays up while the server checks the commit, checkout, image labels, platform, and Compose config. It then replaces the container and checks the configured loopback health endpoint. Caddy retries the upstream for up to 20 seconds during that restart. The server retains one previous image for up to 12 hours.

A deployment request must match the webhook secret, repository, branch, and full commit. Replayed requests do not deploy. Each app runs one deployment at a time. Invalid config, failed tests, or a mismatched image stops before replacement.

### Checks run by the server

1. Verify the webhook, repository, branch, and commit.
2. Check free memory and disk space.
3. Validate Compose config.
4. Verify the uploaded image and run the app's optional test command in a temporary container.
5. Replace the container, check health, retain one rollback image for up to 12 hours, and remove old tags.

App tests are optional. Configure `bun test` only when the project has tests of its own.

## Resource limits

Client builds keep build CPU and memory off the production host. The server still checks available memory and disk before each deployment. Prebuilt apps require 512 MiB of available memory by default. A fallback server build requires 2 GiB. Operators can change both values per app.

Caddy or the host firewall must rate-limit public requests before they reach the loopback webhook service.

## What MCPVault exposed

I maintain [MCPVault](https://github.com/bitbonsai/mcpvault), an MCP bridge for Obsidian. I moved its Astro site toward Shibumi after Astro 7 changed the Cloudflare path from Pages to Workers.

The first VPS build exhausted available memory before health checks ran. That failure led to memory and disk preflight, build deadlines, systemd ceilings, and the current local-image upload flow.

## Prepare a server

Use a Linux VPS or homelab server reachable over SSH. Installation requires Git, rootless Podman, a Compose frontend, Caddy, and systemd. The bootstrap installs Bun when it is missing.

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
```

The installer stages one npm release with lockfile-pinned production dependencies and installs `shis` and `shibumi-server` in `~/.local/bin`. The service starts from that local release. It does not fetch code during restart.

Interactive commands check npm with a short timeout and suggest `shis update` when a newer stable release exists. Registry failures do not block local commands. `shis serve` skips the check.

`shis uninstall` removes the service and installed releases but keeps config, secrets, app checkouts, containers, Caddy, and GitHub settings. `--purge` removes config and secrets after a stronger confirmation.

## Connect a project

Run this installer from the local Git project root:

```sh
curl -fsSL https://shibumistack.dev/install/ship.sh | sh
```

It reads the domain, repository, branch, tracked Compose file, service, and health path. After SSH confirmation, it installs or updates the server component when needed, registers the app, configures the selected trigger, and writes owned project files.

If DNS or webhook delivery is not ready, setup keeps those files and prints the next action. Resume with:

```sh
bun ship:setup
```

Server operators can register directly with `shis add sub.example.com`. `--dry-run` follows DNS detection, prompts, port selection, and validation without writing config or secrets, invoking sudo, or changing Caddy and systemd.

## Ship from the project

```sh
bun ship
```

Setup recommends explicit Ship-triggered deployment. GitHub CLI can instead enable deploy-on-push. Switching modes only changes the matching webhook and committed trigger setting; webhook secrets remain on the server.

A normal run checks Git, runs project tests and type checks, creates a build context from committed `HEAD`, and builds for the configured Linux platform. Ship labels the image with app, repository, commit, Git tree, and platform identity. It uploads through SSH before pushing Git. The server resolves the commit tree itself and rejects an image when any identity value differs.

Docker layer cache remains enabled. Use `bun ship --rebuild` to pass `--no-cache`. After a server update, `shis caddy-refresh <app-id>` adds the 20-second retry budget to an existing managed route without replacing its other Caddy settings. Existing domains keep their old upstream until the first Shibumi deployment passes health and you approve Caddy cutover.

Before deployment, Ship checks the mutable latest pointer against immutable reviewed source. It may run that source for the current deployment, then save it to tracked `scripts/ship.ts` only after success. Network errors keep the current client. Local edits are never overwritten.

Use `bun ship:setup` to review or change setup. Existing project instructions live on the [Ship page](/ship.md).

## Install requirements

`shibumi-server` requires Linux, Bun, Git, rootless Podman, `podman compose` or `podman-compose`, Caddy, and systemd. macOS and Windows users must SSH into the Linux host before running:

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
```

The website copies this command. It never connects to a server or asks for SSH credentials.

Source: <https://github.com/bitbonsai/shibumi-server>
