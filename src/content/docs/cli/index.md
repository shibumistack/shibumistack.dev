# create-shibumi CLI

`create-shibumi` creates a static site, a Bun web app, or a Bun full-stack app. All three deploy to a Linux VPS through `shibumi-server`.

## Create a project

```sh
bun create shibumi@latest my-app
```

The CLI asks what you are shipping:

1. **Static site** for any framework or plain files. A follow-up asks where to start: plain files, or the Astro blog template with RSS, sitemap, OG meta, and markdown alternates for agents. Build command and output directory are configured later by `bun ship:setup`.
2. **Bun web app** with Hono, plain HTML and CSS, Alpine for browser behavior, Zod at trust boundaries, tests, and `/healthz`.
3. **Bun full-stack app** with the web starter plus Drizzle and SQLite on a persistent volume.

VPS deployment is the supported target. Provider choices stay out until generated fixtures prove each build and deploy path.

## Shared project contract

Generated projects import their libraries directly. Each applicable project includes:

- route or artifact tests and TypeScript checks
- root `agents.md` guidance
- current reviewed `scripts/ship.ts`
- loopback-only Compose configuration, resource limits, and a health check
- package commands for development, setup, status, logs, rollback, and shipping

Project creation initializes Git only when selected. It never stages or commits user files. Existing paths are never overwritten silently, and failed creation leaves the destination absent or unchanged.

## Static sites

Static publishing depends on an artifact contract rather than a framework adapter:

- output path must be relative and remain inside project root
- build must produce `index.html`
- missing or empty output fails before packaging
- normal file and `404.html` handling is default
- SPA fallback is explicit, never inferred

Shibumi packages the verified directory in a small static image and checks `/` before deployment. A framework's source `public/` directory does not count unless it is also the completed output.

## Bun web

Bun web projects include:

- Bun and Hono server
- plain owned templates and CSS
- Alpine for local DOM behavior
- Zod for environment and request validation
- secure response headers and graceful shutdown
- bundled `dist/server.js` runtime

Nanostores remains optional until independent client islands need shared state. Alpine already covers local and simple global browser state.

## Full-stack SQLite

A full-stack project stores its database under persistent `/data` and enables WAL mode, foreign keys, and a bounded busy timeout. It includes tracked migrations, a fresh-database migration test, pre-migration backup, backup retention, and an explicit restore command.

> **Important:** Image rollback does not reverse a database migration. Generated guidance requires backward-compatible migrations and a reviewed restore path before destructive schema changes.

The project includes database infrastructure and tested queries without an unauthenticated demo mutation endpoint.

## Release acceptance

Tests run against the packed npm artifact, not repository source. Every starting point passes its applicable matrix:

```sh
bun install --frozen-lockfile
bun test
bun run check
bun run build
```

Static output must package only the configured artifact. Bun containers must start on the assigned loopback port and pass their health URL. Full-stack deployment must preserve SQLite data across container replacement and prove backup and restore behavior.

Release checks use a disposable VPS fixture for setup, exact image upload, deployment, health, status, logs, and rollback.

## Extensions

Bun web and full-stack projects include the versioned extension command. Add bundled auth, email, or uploads source with:

```sh
bun run shibumi add auth
```

The command previews writes, stops on conflicts, records a named guide under `agents/`, and does not duplicate files when repeated. Auth and uploads need the full-stack database; uploads also needs auth installed first.

## Deferred

Cloudflare, Vercel, Fly.io, background jobs, payments, admin, and a public extension registry remain planned. They stay out until fixture projects can install, build, run, and deploy them without special cases.

Working server commands are documented in [Server commands](/docs/reference/server-commands).
