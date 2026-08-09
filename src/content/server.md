# shibumi-server

`shibumi-server` deploys the exact commit from a signed GitHub push, using rootless Podman behind Caddy. You keep every file.

No dashboard or hidden deploy platform.

## A deployment

```text
git push origin main
  received  GitHub push; delivery ID is new
  verified  HMAC, repository, branch, and full commit SHA
  ready     memory and disk preflight passed
  built     rootless Podman under a bounded deadline
  tested    configured test command passed
  healthy   loopback app is ready for Caddy
```

The receiver rejects malformed headers before reading the body, verifies GitHub's `X-Hub-Signature-256` over the raw body, and suppresses replayed `X-GitHub-Delivery` IDs. It fetches the exact signed commit rather than using ambiguous `git pull` behavior.

One deployment runs per app. A different concurrent delivery receives `409 Conflict` and is not queued. Failed preflight, fetch, build, or test stages never run `compose up`.

## The host gets a vote

The default preflight requires 2 GiB of available memory and 4 GiB of free space on the checkout filesystem. Builds have a deadline and process-group cancellation. The systemd service limits memory, swap, CPU, and task count; application services define their own Compose limits.

HMAC authentication prevents a forged hook from authorizing a deployment. Caddy, the firewall, or an upstream provider must still handle rate limiting and volumetric abuse before traffic reaches Bun.

## Dogfooding with MCPVault

I also maintain [MCPVault](https://github.com/bitbonsai/mcpvault), the open-source MCP bridge for Obsidian. Its Astro website had become more machinery than the job needed.

With Astro 7, the Cloudflare dependency changed and the upgrade meant leaving Pages for Workers. Workers wasn't a direction I wanted, so I chose a Shibumi rebuild on my own VPS.

`shibumi-server` will handle the deploys. An early build exposed the VPS's limits and led directly to memory and disk preflight, build cancellation, and service ceilings. The migration is now a real test of the stack.

## Pinned installation

The v0.1 installer and app registration are implemented. Release `0.1.0` is awaiting package publication. Once published, run the explicit-version flow on the VPS:

```sh
bunx shibumi-server@0.1.0 init
bunx shibumi-server@0.1.0 add example.com \
  --repository owner/repository \
  --checkout /srv/shibumi/apps/example-com \
  --port 9100 \
  -- bun test
```

`init` copies that exact release to the host and writes mode-restricted config, secrets, and a resource-limited systemd user service. Restarts execute the pinned local copy, never an unpinned download. `add` validates the complete app config and creates a unique per-app HMAC secret without editing Caddy or GitHub.

## Status

The receiver, replay protection, pinned installer, app registration, resource guards, Podman pipeline, health check, unit suite, and disposable real-Podman fixture exist now. Package publication, durable delivery state across restarts, and health-check rollback come next.

Source: <https://github.com/bitbonsai/shibumi-server>
