# Shibumi Stack Docs

The public package is still being built. These notes document the product decisions first: what Shibumi will generate, why the stack is small, and where the seams stay visible.

## What Exists Now

This site is the first Shibumi artifact. It is built with Bun and Hono, serves static HTML, and exposes source-shaped Markdown for pages that benefit from it.

The scaffolder, templates, and extensions are next. Until those ship, the docs are intentionally about decisions rather than package APIs.

## The Five Pieces

- **Bun**: runtime, package manager, test runner, and build tool.
- **Hono**: the route layer that can run locally, on edge platforms, or behind a Bun server.
- **Drizzle**: typed schema, queries, and migrations without hiding SQL.
- **Alpine**: small browser behavior without a client app by default.
- **Zod**: validation at the edges where data enters the app.

## Design Decisions

### Shibumi Is Glue, Not a Framework

Shibumi chooses files, conventions, and deploy config. The generated app is plain source code, not a runtime hidden behind a new abstraction.

### The First Package Is a Scaffolder

`create-shibumi` will ask what kind of app you are building, write the files, and then get out of the way.

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

## Extensions

Extensions are how Shibumi grows without becoming a framework. Official extensions are maintained with the core project. Community extensions can be submitted to the registry and installed with the same flow once they pass the checks.

An extension is not just a dependency. It is an install plan: source files, metadata, agent guidance, migrations, dependencies, environment variables, and tests that prove the generated app still works.

### Manifest

The registry needs structured metadata: name, version, description, author, license, source repo, compatibility, categories, supported themes, supported deploy targets, and whether the extension is official or community.

### Files

The payload is copied source: routes, libraries, components, styles, config, migrations, fixtures, and tests. Every file declares its target path and conflict behavior so installs can be reviewed before they run.

### Prompts

Some extensions need choices. Auth may ask for cookie session or OAuth. Email may ask for Resend or SMTP. Uploads may ask for local disk or S3. The answers become generated config, not hidden state.

### Agents

Each extension carries an `agents.md` fragment explaining the conventions it adds: where sessions live, how routes are protected, which helpers to use, and what files agents should avoid editing casually.

### Checks

Submissions should prove they install. The registry can install an extension into fixture apps, run tests, check formatting, verify declared files, and reject packages that require undeclared network access or install scripts.

```json
{
  "name": "auth",
  "title": "Auth",
  "type": "official",
  "compatibility": {
    "shibumi": ">=0.1.0",
    "themes": ["full-stack"],
    "deploy": ["self-hosted", "fly", "cloudflare", "vercel"]
  },
  "files": [{ "from": "files/src/lib/session.ts", "to": "src/lib/session.ts" }],
  "agents": ["agents.md"],
  "env": ["SESSION_SECRET"],
  "checks": ["bun test"]
}
```

## Deploy Targets

The app shape should stay familiar across deploy targets. Only the adapter, config file, and data driver should change.

| Target | Shape |
| --- | --- |
| Self-hosted | Bun and Docker, SQLite on a volume, Caddy for HTTPS |
| Fly.io | Bun runtime, Docker path, persistent volume support |
| Cloudflare | Workers or Pages, Hono adapter, D1 |
| Vercel | Serverless adapter, Turso or another external database |
| Static CDN | Pre-built output with no runtime |

## Working Plan

The longer working plan lives at [`/dx.md`](/dx.md).
