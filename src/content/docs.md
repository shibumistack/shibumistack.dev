# Shibumi Stack docs

This page records product choices that should survive implementation changes.

## What works now

`create-shibumi` creates a SQLite full-stack app, an Astro blog, or a static site. All three include VPS deployment, and `bun create shibumi .` adds that deployment to a project that already exists.

[`shibumi-server`](/docs/server) deploys apps to Linux VPS and homelab hosts with rootless Podman, Caddy, and systemd. [Ship](/docs/server/ship) adds committed deployment config and owned TypeScript to an existing Bun project.

[Shibumi Forms](/forms.md) is a standalone service: any static site can accept form submissions through plain HTML, built with Shibumi or not. Hosted pre-alpha and self-hosted source are available.

This website runs on Bun and Hono, builds static HTML, and publishes Markdown versions for agents.

## Stack pieces

- **Bun** runs packages, tests, builds, and the server.
- **Hono** handles routes and middleware.
- **Zod** validates environment values and request input.
- **Drizzle** defines schema, queries, and migrations.
- **SQLite** stores app data without a separate database service.
- **Alpine** handles behavior inside HTML components.
- **Nanostores** is optional shared browser state.

A project uses only the pieces it needs. Static output, for example, has no server or database runtime.

## Product choices

### Generate files, not a runtime

Shibumi writes source, tests, and deployment config into the project. The generated app imports Bun, Hono, and other chosen tools directly.

### Offer three starting points

`create-shibumi` asks what the user is shipping:

```sh
bun create shibumi@latest my-app
cd my-app
bun dev
```

Full-stack projects add Hono, Alpine, Zod, Drizzle, persistent SQLite, migrations, backup, and restore. The blog is Astro with posts, RSS, a sitemap, and SEO meta. Static projects provide a build command and output directory.

### Copy extension code

An extension that adds auth, email, uploads, payments, or admin also copies its routes, config, migrations, tests, and agent instructions. The app can edit or delete those files.

### Record project rules for agents

Generated projects include root `agents.md`. An extension can keep its own guide under `agents/<name>.md` and merge a discoverable section into the root file.

### Put security in generated code

Request validation, secure headers, CSRF checks, loopback port binding, and secret-safe config belong in each relevant generated project. They are not optional polish.

## Server choices

### Verify requests before deployment

Caddy terminates HTTPS. The receiver listens on loopback, limits request size, verifies GitHub HMAC signatures, and matches repository, branch, and full commit SHA. A bounded replay cache tracks delivery UUIDs.

### Run deployment without root

A dedicated user owns the receiver, checkout, tests, and rootless containers. systemd limits the receiver and direct child processes. Compose remains in the project and sets app-specific limits.

Caddy changes use a root-owned helper. The helper accepts validated JSON for a small set of operations, writes atomically, validates full config, reloads, and restores its backup when validation or reload fails.

### Delay cutover until checks pass

The current app stays up while the server checks resources, syncs the exact commit, validates Compose, verifies the image, and runs optional app tests. Container replacement begins after those checks. Failed startup or health restores the previous image.

### Bound logs and rollback data

Deployment history stores at most 100 JSONL records per app in a mode-`0600` file. Records exclude secrets, payloads, signatures, and request headers. The server retains one previous image for up to 12 hours.

### Keep config in the right place

Commit `shibumi-server.json` and `scripts/ship.ts`. Keep SSH targets in local config. Keep machine paths and webhook secrets on the server.

## Extensions

Bundled extensions copy reviewed source, tests, migrations, config, and a named agent guide into the app. See [Extensions](/docs/cli/extensions) for commands and package layout.

## Deploy providers

| Target | Status | Planned output |
| --- | --- | --- |
| VPS or homelab | Released | Bun app, rootless Podman, Compose, persistent volumes, Caddy, systemd |
| Static output on VPS | Released | Verified output directory in a pinned static image |
| Fly.io | Planned | Container plus persistent volume where needed |
| Cloudflare | Planned | Workers or Pages with D1 where needed |
| Vercel | Planned | Serverless adapter and external database where needed |

## Working plan

The current CLI and extension plan is available as Markdown at [`/dx.md`](/dx.md).
