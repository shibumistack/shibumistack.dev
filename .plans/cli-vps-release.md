# create-shibumi VPS-first release

## Release boundary

Publish three complete starts with one deployment target:

```sh
bun create shibumi@latest my-app
cd my-app
bun dev
bun ship:setup
bun ship
```

First release includes:

- framework-agnostic static output from a verified relative directory such as `dist`, `public`, `build`, or `out`
- Bun, Hono, Zod, and Alpine web starter
- web starter plus Drizzle and SQLite full-stack starter
- route, artifact, migration, and TypeScript checks where applicable
- root `agents.md`
- VPS deployment only through `shibumi-server`
- loopback-only Compose, health checks, resource limits, and persistent `/data` for SQLite
- current reviewed owned Ship client
- Git initialization when selected, without staging or committing

Deferred:

- Cloudflare, Vercel, Fly.io, and other provider adapters
- blog, SPA, AI, and framework-specific templates
- auth, email, uploads, jobs, payments, admin, and extension registry
- Nanostores until generated UI has real shared client state

## Starter contracts

### Static output

Ask for optional build command, relative output directory, and normal file routing or explicit SPA fallback. Reject absolute paths, root escapes, missing directories, empty output, and artifacts without `index.html`. Package only verified output in the pinned static runtime and check `/` before cutover.

### Bun web

Generate owned Hono routes, plain HTML and CSS, Alpine behavior, Zod boundary validation, secure headers, graceful shutdown, `/healthz`, tests, and a bundled `dist/server.js` runtime.

### SQLite full stack

Add Drizzle and `bun:sqlite` under persistent `/data`. Enable WAL, foreign keys, and bounded busy timeout. Include tracked migrations, fresh-database migration test, pre-migration backup, bounded backup retention, and explicit restore command. Document that image rollback does not reverse schema or data changes. Generate no unauthenticated demo mutation endpoint.

## Current prototype audit

Prototype lives under `shibumistack.dev/shibumi-cli`; public `shibumistack/create-shibumi` repository still contains only npm placeholder files. Current npm `0.0.1` has no executable.

Blockers:

1. Move reviewed source into public `shibumistack/create-shibumi` repository. Keep website free of package source after migration.
2. Replace stale vendored Ship v21 with current immutable client and add sync assertion so package cannot drift.
3. Replace provider selector with VPS or later. Remove generated Cloudflare, Vercel, and Fly.io config.
4. Replace unproved template set with static, web, and full-stack contracts above.
5. Fix generated container runtime. Current Dockerfile copies `dist/` but runs package `start`, which points to missing `src/server.ts`.
6. Generate project name consistently in package metadata, README, Compose project, and output copy.
7. Implement strict argument parsing for `--yes`, `--no-git`, `--no-install`, `--help`, and `--version`; reject unknown flags and invalid values.
8. Use argument arrays, never shell command strings.
9. Create into temporary sibling directory, verify output, then rename atomically. Failure or cancellation must leave destination absent.
10. Never stage or commit generated files. Current prototype creates an automatic initial commit.
11. Generate root `agents.md`; current templates promise it but omit it.
12. Add `check`, `ship:status`, and current Ship commands to generated packages.
13. Pin compatible dependencies and declare Bun engine instead of Node engine.
14. Add package typecheck and executable CLI tests. Current tests cover helpers but not parsing, cancellation, partial failure, or packed execution.
15. Remove hard-coded local image fixture paths from tests.
16. Implement and test static artifact validation and SQLite backup, migration, persistence, and restore lifecycle.

## Package shape

```text
src/
  cli.ts
  args.ts
  create.ts
  templates/static/
  templates/web/
  templates/full-stack/
  templates/ship.ts
scripts/
  sync-ship.ts
  verify-packed.ts
test/
  args.test.ts
  create.test.ts
  packed.test.ts
package.json
README.md
LICENSE
AGENTS.md
```

Keep Clack native output and Shibumi branding. Avoid Chalk unless Clack cannot express one required state.

## Shared generated project contract

```text
my-app/
  agents.md
  package.json
  bun.lock
  Dockerfile
  compose.yaml
  shibumi-server.json       # after setup
  scripts/ship.ts
  src/                      # Bun starters
  public/ or dist/          # static contract
  test/
```

Bun package scripts:

```json
{
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
  "ship:logs": "bun scripts/ship.ts --logs"
}
```

## Acceptance

Run against packed tarball, not repository source:

1. `npm pack --dry-run` contains only declared package files.
2. Each starter scaffolds non-interactively into its own temporary fixture.
3. Generated projects contain no unresolved placeholders or paths outside fixture.
4. Applicable install, test, check, build, artifact, and migration commands pass.
5. Static image serves only configured output, supports `404.html`, and enables SPA fallback only when selected.
6. Bun containers start on assigned loopback port and configured health URL returns success.
7. Full-stack data survives container replacement; backup and restore tests pass.
8. Compose validates with loopback binding, restart policy, health check, resource limits, and persistent data only where needed.
9. Generated Ship source matches current reviewed immutable client.
10. Dirty destination, cancellation, invalid flags, missing Git, and failed install leave existing paths unchanged and print exact next action.
11. Dogfood one fixture per starter through setup, exact image upload, deployment, health, status, logs, and rollback on disposable VPS apps.
12. Publish `create-shibumi@0.1.0`, verify `bun create shibumi@latest`, then update website from preview to released.
