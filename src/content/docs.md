# Shibumi Stack Docs

These notes record durable product decisions: what Shibumi generates, why each piece exists, and where ownership boundaries stay visible.

## What Exists Now

[`shibumi-server`](/docs/server) deploys apps to Linux VPS and homelab hosts through signed GitHub webhooks, rootless Podman, Compose, Caddy, and systemd. [Ship tooling](/docs/server/ship) adds committed deployment config and project-owned source to an existing Bun repository.

This site is another Shibumi artifact. It uses Bun and Hono, serves static HTML, and exposes source-shaped Markdown where useful.

`create-shibumi`, app templates, and extensions remain under construction. Documentation marks planned behavior rather than presenting it as released.

## The Seven Pieces

- **Bun**: runtime, package manager, test runner, and build tool.
- **Hono**: routes and middleware that run locally, on edge platforms, or behind Bun.
- **Zod**: validate input where it enters the app.
- **Drizzle**: schema, queries, and migrations. SQL stays visible.
- **SQLite**: local durable storage with no separate service in development or on a self-hosted deploy.
- **Alpine**: small browser behavior close to the HTML.
- **Nanostores**: shared browser state when Alpine's local state is not enough.

## Design Decisions

### Shibumi Is Glue, Not a Framework

Shibumi chooses files, conventions, and deploy config. The generated app is plain source code, not a runtime hidden behind a new abstraction.

### App Creation Starts With a Scaffolder

`create-shibumi` will ask what kind of app you are building, write owned source files, and then get out of the way.

```sh
bun create shibumi@latest my-app
cd my-app
bun dev
```

### Extensions Copy Source

Auth, email, uploads, payments, and admin should be added explicitly. If an extension creates tables or routes, those files live in the app where they can be changed or deleted.

### Conventions Should Be Legible To Tools

Generated projects will include an `agents.md` file. Extensions can append local guidance so coding agents know where sessions, routes, forms, and tests belong.

### CSRF Belongs In Core

Security defaults should not be something you remember after the app is live. The base template should include the helper every app needs.

## Server Decisions

`shibumi-server` is operations tooling around generated or existing apps. It does not require every piece in the application stack.

### Trust Starts At The Webhook Boundary

Caddy terminates public HTTPS. The receiver listens only on loopback, verifies GitHub HMAC signatures, limits payload size, rejects repository or branch mismatches, and deploys the exact full commit SHA from the signed push. Delivery UUIDs use a bounded replay cache.

### Deployment Runs Without Root

A dedicated user runs the receiver, Git checkout, builds, tests, and app containers. Rootless Podman isolates containers. systemd sets ceilings for the receiver and its direct children. Compose remains visible and app-owned, including per-app resource limits.

Caddy is the narrow privileged exception. A root-owned helper accepts schema-validated operations rather than arbitrary config or shell input. It backs up config, writes atomically, validates, reloads, and restores the backup on failure.

### Cutover Must Preserve The Running App

The existing app remains active while Shibumi checks resources, synchronizes a clean checkout, validates Compose, builds, and runs optional app tests. Cutover occurs only after those stages pass. If startup or health checks fail, Shibumi restores the previously running image and verifies its health.

### History And Rollback Stay Bounded

Deployment history stores limited operational metadata in mode-`0600` JSONL. It excludes secrets, payloads, signatures, and request headers. Rollback accepts a unique commit prefix, resolves the full SHA, verifies it belongs to the configured branch, and uses the same deployment pipeline.

### Projects Own Their Deployment Contract

`shibumi-server.json` is committed with safe app settings. `scripts/ship.ts` belongs to the project and is never overwritten after installation. SSH targets remain in local Git config. Webhook secrets remain server-side or exist briefly in memory during explicit handoff.

## Extensions

Extensions preserve the same ownership rule: they copy reviewed source and guidance into the app instead of adding a hidden runtime. Manifest structure, hooks, checks, and community registry design remain an RFC. See [Extensions](/extensions) for the current proposal.

## Deploy Targets

The app shape should stay familiar across deploy targets. Adapter, deployment config, and data driver may change without hiding application source.

| Target | Status | Shape |
| --- | --- | --- |
| VPS or homelab | Released | Bun app, rootless Podman and Compose, persistent volumes, Caddy, systemd |
| Fly.io | Planned | Bun runtime, container path, persistent volume support |
| Cloudflare | Planned | Workers or Pages, Hono adapter, D1 |
| Vercel | Planned | Serverless adapter, Turso or another external database |
| Static CDN | Planned | Pre-built output with no runtime |

## Working Plan

The longer working plan lives at [`/dx.md`](/dx.md).
