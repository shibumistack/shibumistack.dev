# shibumi-server

`shibumi-server` is a small Bun service that deploys your app to your VPS or homelab server.

No dashboard or cloud deploy service.

## A deployment

```text
git push origin main
  received  GitHub push
  verified  webhook, repo, branch, and commit
  checked   memory and disk
  config    Compose validated
  built     rootless Podman
  replaced  old container
  healthy   ready behind Caddy
  cleaned   old images (keeping last 2 for rollbacks)
  shipped   Deployment complete
            https://example.com
```

GitHub sends a signed webhook when you push. Your current app keeps running while `shibumi-server` verifies the push, checks the host, validates the setup, and builds the new image. If those steps pass, it replaces the old container, checks the new one's health behind Caddy, keeps the previous two images for quick rollbacks, and removes older ones.

The webhook must match the secret, repository, branch, and full commit. Bad or repeated requests do not deploy. Only one deploy runs per app. Invalid configuration or a failed build stops before startup.

### What these checks mean

Every deploy runs the same checks. You do not need to write tests for them.

1. Verify the webhook, repository, branch, and commit.
2. Check free memory and disk space.
3. Validate the Compose configuration.
4. Build the image and run any optional app tests in a temporary container.
5. Replace the old container, check the new one's local health endpoint, keep the previous two successful images for rollbacks, and remove older images.

App tests are optional. Add a command such as `bun test` only when the project has its own test suite.

## Built for small servers

Before building, `shibumi-server` checks free memory and disk space. A build that runs too long is stopped. The defaults require 2 GiB of available memory and 4 GiB of free space.

Caddy or the host firewall handles rate limits before requests reach `shibumi-server`.

## Dogfooding with MCPVault

I also maintain [MCPVault](https://github.com/bitbonsai/mcpvault), the open-source MCP bridge for Obsidian. Its Astro website had become more machinery than the site needed. Astro 7 moved its Cloudflare deploy from Pages to Workers, adding another adapter and more platform-specific complexity, so I'm rebuilding it with Shibumi on a tiny VPS.

The first build exhausted the server's memory. That failure led directly to pre-build memory and disk checks, plus a timeout for builds that run too long.

## Install once on your server

Start with a Linux VPS or homelab server. Setup uses Bun, Git, rootless Podman, Caddy, and systemd, checking the host before it changes server configuration:

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
```

It installs the resolved release locally and adds the `shibumi-server` command to `~/.local/bin`. The service keeps using that exact release until you upgrade it. User-run commands check for newer releases and suggest `shibumi-server update`. Update installs the exact stable release reported by npm while preserving config and secrets. Registry problems never block local work.

`shibumi-server uninstall` removes the service and installed code while preserving config and secrets. Add `--purge` to remove those too after confirmation. App checkouts, containers, Caddy, and GitHub settings stay untouched.

## Adding apps is a breeze

Use the installed command with a domain:

```sh
shibumi-server add sub.example.com
```

It checks DNS and existing Caddy routes, asks for the repository and deployment directory, assigns an available local port, then previews the complete setup before changing anything.

Preview the same prompts, port selection, and validation without changing the system:

```sh
shibumi-server add sub.example.com --dry-run
```

The preview prints the app ID, checkout, webhook URL, secret variable, and Caddy upstream without writing config or secrets, invoking sudo, or changing Caddy or systemd. A real add prepares the checkout and asks sudo only when its constrained helper saves, validates, and reloads Caddy. GitHub setup stays on your project machine through `bun run ship`. Repeat the command for every app or domain.

Automation can pass the repository as `github:owner/repo`, plus the checkout and port, as flags to skip the prompts. Domain-derived app IDs escape literal hyphens so dashed labels cannot collide with dots.

## Push with one command

Self-hosted projects own a small ship script:

```sh
bun run ship
```

First run detects missing setup, explains what stays local, then opens the server flow through confirmed SSH. The server checks DNS, prepares Caddy, and returns commit-safe `shibumi-server.json`. GitHub CLI creates the webhook without printing or storing its secret.

Later runs check Git state, run project tests and type checks, push, then follow deployment status over SSH. Existing domains keep their current upstream until the first Shibumi deployment is healthy and you confirm Caddy cutover.

Run `bun run ship:setup` whenever you want to review or change deployment setup.

## Install on your server

`shibumi-server` requires Linux with Bun, Git, rootless Podman, Caddy, and systemd. If you're using macOS or Windows, SSH into your Linux VPS or homelab server first, then run this command there:

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
```

The website only copies the command. It never connects to your server or asks for SSH credentials.

Source: <https://github.com/bitbonsai/shibumi-server>
