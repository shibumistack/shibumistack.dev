# shibumi-server

`shibumi-server` is a small Bun service that deploys your app to your VPS or homelab server.

No dashboard or cloud deploy service.

> **Released now:** VPS and homelab deployment through `shibumi-server`. Other deployment targets remain planned.

## A deployment

```clack
git push origin main
渋み  shis (shibumi-server)
Received GitHub push
Verified webhook, repo, branch, and commit
Checked memory and disk
Validated Compose configuration
Built with rootless Podman
Replaced container and passed health check
Kept two rollback images and cleaned older ones
Deployment complete
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

## Prepare a server

You need a Linux VPS or homelab server reachable through SSH. Setup uses Bun, Git, rootless Podman, Podman Compose, Caddy, and systemd, checking the host before it changes server configuration.

The recommended app flow starts from your local project and installs the server component through confirmed SSH when needed. You can also prepare the server directly:

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
```

It stages the resolved release with lockfile-pinned production dependencies, then adds the `shibumi-server` command to `~/.local/bin`. The service keeps using that exact release until you upgrade it. User-run commands check for newer releases and suggest `shibumi-server update`. Update installs the exact stable release reported by npm while preserving config and secrets. Registry problems never block local work.

`shibumi-server uninstall` removes the service and installed code while preserving config and secrets. Add `--purge` to remove those too after confirmation. App checkouts, containers, Caddy, and GitHub settings stay untouched.

## Connect from your project

Run one installer from your local project root:

```sh
curl -fsSL https://shibumistack.dev/install/ship.sh | sh
```

It infers the domain, repository, branch, Compose file, service, and health path. After you confirm an SSH target, it installs or upgrades `shibumi-server` when needed, registers the app, configures and tests the GitHub webhook, then writes owned project source.

DNS and webhook delivery may depend on external changes. If either is not ready, setup keeps the owned files and prints the exact next action. Resume with:

```sh
bun run ship:setup
```

`shis add sub.example.com` remains available for server operators and automation. Use `--dry-run` to follow the same detection, prompts, port selection, and validation without writing config or secrets, invoking sudo, or changing Caddy or systemd. A real add ends with the exact local installer command instead of sending you through a webpage.

## Push with one command

Self-hosted projects own a small ship script:

```sh
bun run ship
```

The local installer handles first setup through confirmed SSH. The server checks DNS, prepares Caddy, and returns commit-safe `shibumi-server.json`. GitHub CLI creates and tests the webhook without printing or storing its secret.

Later runs check Git state, run project tests and type checks, push, then follow deployment status over SSH. Existing domains keep their current upstream until the first Shibumi deployment is healthy and you confirm Caddy cutover.

Run `bun run ship:setup` whenever you want to review or change deployment setup. For an existing project, [add the owned ship workflow](/ship.md).

## Install on your server

`shibumi-server` requires Linux with Bun, Git, rootless Podman, a working `podman compose` or `podman-compose` frontend, Caddy, and systemd. If you're using macOS or Windows, SSH into your Linux VPS or homelab server first, then run this command there:

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
```

The website only copies the command. It never connects to your server or asks for SSH credentials.

Source: <https://github.com/bitbonsai/shibumi-server>
