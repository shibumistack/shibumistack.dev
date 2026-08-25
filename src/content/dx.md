# create-shibumi design and acceptance

This document describes CLI behavior, generated files, and release checks.

## Product rule

Shibumi writes files into a project. Generated apps run on their chosen libraries without a Shibumi runtime.

The package supports one deploy target, a Linux VPS running `shibumi-server`. It offers three starting points:

- a Bun, Hono, Zod, and Alpine app plus Drizzle and SQLite (recommended)
- an Astro blog with posts, RSS, sitemap, and SEO meta
- a static site from any framework's build output or plain files

Nanostores joins only when separate browser components need shared state.

## Create

```sh
bun create shibumi@latest my-app
```

The CLI asks only what changes generated files:

```text
Project name?

  ./quiet-bamboo

What are you shipping?

● Bun full-stack app (recommended)
    Hono, Alpine, and SQLite with migrations and backups
  Blog
    Astro: posts, RSS, sitemap, SEO meta, llms.txt
  Static site
    Any framework's build output: dist/, public/, _site/, or plain files

Deploy to a VPS now?

● Yes
  Later
```

Three stops, and the third one is the offer to deploy. Everything else that used to be a question is a default, a line in the setup plan, or an opt-in command.

## Adopt an existing project

`bun create shibumi .` vendors the Ship client into the project that is already in the directory instead of scaffolding a new one. It detects the built site directory from framework signals (`astro` to `dist`, `@11ty/eleventy` to `_site`, `next` to `out`, `vite` to `dist`), then from a build directory on disk, then from `public/`. The detected value is the default in a select with a free-text fallback.

SPA fallback stays off unless `--spa` is passed, so there is no question about it. Adopting refuses rather than guessing when deployment files already exist, when a `start` script says the project is a server app, or when `index.html` sits at the project root with no directory to serve.

Project creation must be atomic. It writes into a temporary sibling directory, runs generation checks, then renames the directory into place. Cancellation or failure leaves the destination absent. An existing path is never overwritten.

Git initialization is optional. The CLI never stages or commits user files.

## Static output

Static publishing uses an artifact contract instead of framework adapters. The user supplies an optional build command and a relative output directory such as `dist`, `public`, `build`, or `out`.

Before packaging, Shibumi verifies that:

- the path stays inside the project root
- the directory exists after the build
- the directory is not empty
- `index.html` exists
- symlinks do not escape the output directory

Normal file routing and `404.html` are the default. SPA fallback requires an explicit choice.

The deployment image contains only the verified output and a pinned static server. Health checks request `/`.

## Blog

The blog template is Astro configured for the parts a blog needs immediately: Markdown posts, RSS, a sitemap, SEO meta tags, and an `llms.txt` for agents. It builds to `dist/` and ships through the static path, so its `ship:setup` command arrives pinned to `--output-dir dist --build-script build --no-spa`.

Blog sits at the top level of the menu. An earlier design nested it under a "start from?" follow-up behind Static site, which buried the template most people asking for a blog were looking for.

## SQLite full stack

The full-stack project contains:

```text
agents.md
package.json
tsconfig.json
Dockerfile
compose.yaml
scripts/ship.ts
src/app.ts
src/server.ts
public/
test/app.test.ts
```

The generated server uses Bun and Hono. Zod validates environment values and request input. Alpine handles behavior close to the HTML. Response headers include the security baseline used by the templates. The process handles shutdown and exposes `/healthz`.

The build produces `dist/server.js`, and the container starts that file. A packed-fixture test must catch source paths that were not copied into the image.

On top of that it adds Drizzle and `bun:sqlite`. Runtime data lives under persistent `/data`, outside the image.

SQLite setup enables:

```text
journal_mode = WAL
foreign_keys = ON
busy_timeout = <bounded milliseconds>
```

The project owns schema and SQL migrations. Tests create a fresh database, apply every migration, and run representative queries.

Deployment takes a SQLite backup before applying new migrations. Backups have a size and count limit, and the project includes an explicit restore command.

Image rollback changes application code, not database state. Generated docs must say this plainly. Destructive migrations require a reviewed backup and restore plan; normal migrations should remain compatible with the previous app image during the rollback window.

The generated project does not expose a public demo write endpoint. Database examples belong in tests until the user chooses an authentication model.

## Browser state

Alpine already provides local component state and a global store. Adding Nanostores to every app would duplicate that job.

Use Nanostores when independent client islands share state or when state must live outside Alpine components. Until a generated app has that need, leave the dependency out.

## Generated commands

Bun apps expose:

```json
{
  "scripts": {
    "dev": "bun scripts/ship.ts --dev",
    "dev:app": "bun --watch src/server.ts",
    "start": "bun dist/server.js",
    "build": "bun build src/server.ts --outdir dist --target bun",
    "test": "bun test",
    "check": "tsc --noEmit",
    "ship": "bun scripts/ship.ts",
    "ship:setup": "bun scripts/ship.ts --setup",
    "ship:update": "bun scripts/ship.ts --update",
    "ship:status": "bun scripts/ship.ts --status",
    "ship:logs": "bun scripts/ship.ts --logs",
    "ship:webhook": "bun scripts/ship.ts --webhook",
    "ship:env": "bun scripts/ship.ts --env",
    "shibumi": "bun scripts/shibumi.ts",
    "shi": "bun scripts/shibumi.ts"
  }
}
```

The full-stack path adds `db:migrate`, `db:backup`, `db:restore`, and `db:status`. The `shibumi` script is the extension installer, with `shi` as its short alias: `bun shi add auth`, with `--dry-run` previewing every write.

`ship:webhook` is the opt-in for push-to-deploy and exists in every template. Setup never installs a webhook: with the default `bun ship` trigger it buys nothing, and it costs a GitHub sign-in plus an `admin:repo_hook` grant. `bun ship:webhook` pays that cost when asked, and `bun ship:webhook --off` reverses both the hook and the trigger.

Static projects get equivalent artifact, preview, and Ship commands without a Bun app server.

## Agent instructions

Every project gets root `agents.md` with facts that tools need:

- commands that actually exist
- route and template locations
- trust boundaries and validation rules
- database path and migration process
- files generated by Ship
- checks required before commit

An extension can add `agents/<extension>.md` and merge a named section into the root file. Keeping the named source makes later review and removal possible.

## Extensions

Bundled extensions copy source, migrations, tests, dependencies, environment variable names, and agent instructions into the app.

Installation needs a dry run. It must show every file write and exact edit before changing the project. Hooks use unique source matches and stop when the expected text has changed.

Auth, email, and uploads ship only when fixture installation, repeated installation, conflicts, and removal pass.

## VPS deployment

[`shibumi-server`](https://server.shibumistack.dev) is the supported deployment target. Generated projects own `Dockerfile`, `compose.yaml`, `shibumi-server.json`, and `scripts/ship.ts`.

`bun ship`:

1. requires a clean configured branch
2. runs project checks
3. builds committed `HEAD` for the server's Linux platform
4. labels the image with repository, app, commit, Git tree, and platform
5. uploads the exact image through SSH
6. pushes Git
7. requests deployment of that commit
8. follows status until success or failure

The server validates capacity, commit, Compose config, image identity, optional app tests, and health. Caddy retries the loopback upstream for up to 20 seconds during replacement. One previous image remains available for rollback for up to 12 hours.

## Release tests

Acceptance runs against the packed npm tarball, not source imports from the CLI repository.

For each starting point:

1. create a temporary project non-interactively
2. check for unresolved placeholders and paths outside the fixture
3. install with the lockfile
4. run applicable tests, typecheck, build, and artifact validation
5. build the container
6. start on an assigned loopback port
7. pass the configured health request
8. verify generated Ship source matches the current immutable version

The SQLite fixture must also prove migration, persistence across container replacement, backup, and restore.

One disposable VPS app per starting point must complete setup, upload, deployment, status, logs, and rollback before `create-shibumi@0.1.0` is published.

## Deferred work

Cloudflare, Vercel, Fly.io, framework-specific starts, background jobs, payments, admin, a public extension registry, and migration assistants remain unsupported.

Each addition needs packed-fixture and deployment coverage before release.
