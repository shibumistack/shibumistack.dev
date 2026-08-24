# Extensions

Extensions copy feature code into a Shibumi project. The project owns the copied routes, migrations, tests, and configuration.

## Command

```sh
bun shi add <name>
```

Before writing, the command lists new files, edits, dependencies, environment variables, migrations, and `agents.md` changes; `--dry-run` stops after the preview and writes nothing. Existing files stop the install; move them aside and re-run. Running the same install twice must not duplicate code.

Extensions are removable: `bun shi remove <name>` deletes the installed code and reverses the edits. Tables are never dropped by tooling. `shibumi` is the long form of the same script: `bun shibumi add auth` and `bun run shibumi add auth` behave identically.

## What an extension contains

An extension may include:

- source files with fixed target paths
- exact edits to existing project files
- npm dependencies (none of the bundled extensions need any)
- environment variable names, never values
- a database migration, numbered into the project's migration stream at install time
- an editable config file (`src/config/<name>.yaml`) for tunable limits
- fixture tests
- a named guide such as `agents/auth.md`

Example manifest fragment:

```json
{
  "name": "auth",
  "requires": "database",
  "env": ["APP_ORIGIN"],
  "hooks": [
    {
      "file": "src/app.ts",
      "find": "import { Hono } from \"hono\";",
      "insert": "import { authRoutes } from \"./routes/auth\";"
    }
  ],
  "rootSection": "## Auth extension\n..."
}
```

## Available extensions

### Auth

Cookie sessions with password and login-link sign-in. `Bun.password` hashing, sha256-hashed session and login tokens, CSRF-protected mutations, rate limiting, a bot honeypot, and `users`, `sessions`, and `login_tokens` tables installed through the project's single migration stream. Requires the full-stack database; other paths are refused.

### Email

A Resend-backed send helper over plain fetch, environment validation, HTML-escaping template rendering, webhook signature verification, and a fixture that proves template variables and delivery handling. No tables.

### Uploads

Authenticated file uploads. Type is decided by magic-byte sniffing (PNG, JPEG, GIF, WebP, PDF), never the client filename or `Content-Type`. Files are stored content-addressed (sha256) on the persistent volume with per-user and per-request size limits, a per-user quota, and an upload rate limit (all in `src/config/uploads.yaml`, default 5 MiB per file); serving is owner-scoped and forced to download. Needs auth and the full-stack database. No tables are dropped on removal.

### Admin

A minimal server-rendered panel at `/admin` for listing and deleting users (with session and upload counts). Access is gated by an `ADMIN_EMAILS` allowlist; auth reserves those addresses from self-service registration so the admin account cannot be claimed by an attacker. No client JS beyond a self-hosted confirm script, no new tables. Needs auth and the full-stack database.

List installed and available extensions with:

```sh
bun shi list
```

## File edits

A hook must name the file, the exact text it expects, and the text it will insert after that anchor (or the exact replacement for it). If the expected source is missing, changed, or appears more than once, installation stops without guessing.

```json
{
  "hooks": [
    {
      "file": "src/db/index.ts",
      "find": "export const db = drizzle(sqlite, { schema });",
      "replace": "export const db = drizzle(sqlite, { schema: { ...schema, ...authSchema } });"
    }
  ]
}
```

## Agent guidance

An extension keeps its instructions in a named file and merges a marked section into root `agents.md`. Removing the extension identifies its section by those markers and excises it only when the content still matches what was installed.

## Package checks

Packed CLI tests install each bundled extension into fixture projects scaffolded from the tarball, run their tests and checks, and prove removal restores the scaffold byte for byte. Installation touches no network, runs no lifecycle scripts, and refuses paths outside the project root, including through symlinks.

## Config

An extension with tunable limits ships a YAML file at `src/config/<name>.yaml`, with comments and human units. The code imports it, so `bun build` bundles the values into the image: the running config always matches the commit that built it, with no server-side drift. Change a limit by editing the file and running `bun ship`. A loader validates every value at startup and refuses to boot on a bad one, so a typo fails the health check instead of silently disabling a limit. Deployment-specific values (secrets, admin emails, sender addresses) stay in environment variables, never in the committed config.

## Package layout

```text
manifest.json
migration.sql
agents/
  feature.md
files/
  src/
    config/
      feature.yaml
    ...
```

Bundled extensions ship inside the versioned `create-shibumi` package, embedded in the vendored `scripts/shibumi.ts` and covered by its checksum.
