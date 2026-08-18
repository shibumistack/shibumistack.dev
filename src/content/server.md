# shibumi-server

`shibumi-server` runs verified application images on your VPS or homelab server. Builds happen on your computer.

No dashboard or cloud deploy service.

> **Released now:** VPS and homelab deployment through `shibumi-server`. Other deployment targets remain planned.

## A deployment

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

`bun ship` builds the server's Linux image from committed code on your computer and uploads it through SSH before pushing Git. Recommended mode asks the server over SSH to deploy exact commit. Your current app keeps running while `shibumi-server` verifies commit, checkout, uploaded image, and Compose setup. If those checks pass, it replaces the old container, checks the new one's health behind Caddy, keeps one previous image for quick rollback, and removes older ones.

The webhook must match the secret, repository, branch, and full commit. Bad or repeated requests do not deploy. Only one deploy runs per app. Invalid configuration or a failed build stops before startup.

### What these checks mean

Every deploy runs the same checks. You do not need to write tests for them.

1. Verify the webhook, repository, branch, and commit.
2. Check free memory and disk space.
3. Validate the Compose configuration.
4. Verify the uploaded image and run any optional app tests in a temporary container.
5. Replace the old container, check the new one's local health endpoint, keep the previous successful image for rollback, and remove older images.

App tests are optional. Add a command such as `bun test` only when the project has its own test suite.

## Built for small servers

Images build on your computer, so running apps do not compete with production builds. Before deployment, `shibumi-server` still checks free memory and disk space. Prebuilt apps require 512 MiB of available memory by default; fallback server builds require 2 GiB. Both can be tuned per app.

Caddy or the host firewall handles rate limits before requests reach `shibumi-server`.

## Dogfooding with MCPVault

I also maintain [MCPVault](https://github.com/bitbonsai/mcpvault), the open-source MCP bridge for Obsidian. Its Astro website had become more machinery than the site needed. Astro 7 moved its Cloudflare deploy from Pages to Workers, adding another adapter and more platform-specific complexity, so I'm rebuilding it with Shibumi on a tiny VPS.

The first build exhausted the server's memory. That failure led to resource checks, bounded fallback builds, and the current local-build flow.

## Prepare a server

You need a Linux VPS or homelab server reachable through SSH. Setup uses Bun, Git, rootless Podman, Podman Compose, Caddy, and systemd, checking the host before it changes server configuration.

The recommended app flow starts from your local project and installs the server component through confirmed SSH when needed. You can also prepare the server directly:

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
```

It stages the resolved release with lockfile-pinned production dependencies, then installs compatible `shis` and `shibumi-server` commands in `~/.local/bin`. The service keeps using that exact release. User-run commands check npm for a newer stable release and suggest `shis update`; `serve` performs no registry check. Update installs one exact version while preserving config and secrets. Timeouts and registry failures never block local work.

`shibumi-server uninstall` removes the service and installed code while preserving config and secrets. Add `--purge` to remove those too after confirmation. App checkouts, containers, Caddy, and GitHub settings stay untouched.

## Connect from your project

Run one installer from your local project root:

```sh
curl -fsSL https://shibumistack.dev/install/ship.sh | sh
```

It infers the domain, repository, branch, Compose file, service, and health path. After you confirm an SSH target, it installs or upgrades `shibumi-server` when needed, enables prebuilt images, registers the app, configures and tests the GitHub webhook, then writes owned project source. Local shipping recommends Colima and supports another Docker-compatible engine with Docker Compose and Buildx.

DNS and webhook delivery may depend on external changes. If either is not ready, setup keeps the owned files and prints the exact next action. Resume with:

```sh
bun ship:setup
```

`shis add sub.example.com` remains available for server operators and automation. Use `--dry-run` to follow the same detection, prompts, port selection, and validation without writing config or secrets, invoking sudo, or changing Caddy or systemd. A real add ends with the exact local installer command instead of sending you through a webpage.

## Ship with one command

Self-hosted projects own a small ship script:

```sh
bun ship
```

The local installer handles first setup through confirmed SSH. The server checks DNS, prepares Caddy, and returns commit-safe `shibumi-server.json`. Setup recommends explicit `bun ship` deployment and can enable deploy-on-push through GitHub CLI. Rerun `bun ship:setup` to switch; the matching webhook is enabled or disabled without printing or storing its secret.

Later runs check Git state, run project tests and type checks, create a build context from committed `HEAD`, and build for the server's Linux platform on your computer. Ship labels the image with app, repository, commit, Git tree, and platform identity, then uploads it through SSH. Only after upload succeeds does it push Git and follow deployment status over SSH. The server resolves the commit tree independently and rejects any mismatched image.

Docker layer cache stays enabled. `bun ship --rebuild` performs a no-cache build. Existing domains keep their current upstream until the first Shibumi deployment is healthy and you confirm Caddy cutover.

Before each deployment, Ship checks whether reviewed client source is newer. It can run that immutable version immediately, then saves it to tracked `scripts/ship.ts` only after deployment succeeds. Network errors keep the current version and owned local edits are never overwritten.

Run `bun ship:setup` whenever you want to review or change deployment setup. For an existing project, [add the owned ship workflow](/ship.md).

## Install on your server

`shibumi-server` requires Linux with Bun, Git, rootless Podman, a working `podman compose` or `podman-compose` frontend, Caddy, and systemd. If you're using macOS or Windows, SSH into your Linux VPS or homelab server first, then run this command there:

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
```

The website only copies the command. It never connects to your server or asks for SSH credentials.

Source: <https://github.com/bitbonsai/shibumi-server>
