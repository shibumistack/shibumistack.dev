# create-shibumi CLI

All three templates deploy to a Linux VPS through `shibumi-server`.

## Create a project

```sh
bun create shibumi@latest my-app
```

Three questions, then the project exists:

```text
┌  渋み shibumi
│
◆  Project name?
│  quiet-bamboo
│
◆  What are you shipping?
│  ● Bun full-stack app (recommended)
│      Hono, Alpine, and SQLite with migrations and backups
│  ○ Blog
│      with RSS, sitemap, SEO
│  ○ Static site
│      Any framework's build output: dist/, public/, _site/, or plain files
│
◆  Deploy to a VPS now?
│  ○ Yes / ● Later
│
◇  Created quiet-bamboo
│
◆  Template copied
│
◆  Git initialized; nothing committed, the first commit is yours
│
◆  Dependencies installed
│
◆  Deploy script added (scripts/ship.ts)
│
│  next  cd quiet-bamboo
│        bun dev           start the dev server (ctrl+c stops it)
│        bun ship:setup    connect your VPS when you're ready
│
└  Docs: https://shibumistack.dev/docs
```

Answering **Yes** to the deploy question runs `bun ship:setup` in the same session, so the project's first deploy happens before you leave the terminal. **Later** prints the command instead.

Automation skips the questions:

```sh
bun create shibumi@latest my-app --template full-stack --yes
```

`--template` takes `full-stack`, `blog`, or `static`. `--no-git` and `--no-install` skip those steps. VPS deployment is the supported target; provider choices stay out until generated fixtures prove each build and deploy path.

## Add deployment to an existing project

A dot instead of a name adopts the current directory. Instead of scaffolding, the deploy script is copied in next to your own files. Your existing files are left as they are, with one exception: `package.json` gains the `ship*` scripts and a `@clack/prompts` dev dependency, since the deploy script imports it.

```sh
bun create shibumi .
```

```text
┌  渋み shibumi
│
●  Existing project found (Astro detected)
│
◆  Add deploy tooling to this project?
│  ● Yes / ○ No
│
◆  Built site directory?
│  ● dist/ (detected)
│  ○ Somewhere else
│
◆  Wrote scripts/ship.ts, package.json, Dockerfile, compose.yaml, .dockerignore
│
◆  Added scripts: ship, ship:setup, ship:update, ship:status, ship:logs, ship:webhook
│
◇  Installed @clack/prompts
│
◆  Deploy to a VPS now?
│  ○ Yes / ● Later
│
│  next  bun ship:setup    connect your VPS when you're ready
│
│  Deployments serve dist/. Review the generated Dockerfile and compose.yaml.
│
└  Docs: https://shibumistack.dev/docs
```

The build directory is detected from your dependencies and config files, with the framework signal winning over a directory that happens to be on disk:

| Signal | Directory |
| --- | --- |
| `astro` or `astro.config.*` | `dist` |
| `@11ty/eleventy` or `eleventy.config.*` | `_site` |
| `next` or `next.config.*` | `out` |
| `vite` or `vite.config.*` | `dist` |
| a `dist`, `_site`, `out`, or `build` directory | that one |
| a `public` directory | `public` |

A dependency or a config file counts as the same signal. Astro and Eleventy both pull Vite in, so a bare Vite match loses to either of them.

Pick **Somewhere else** to type a path the table missed. `--spa` makes unknown paths serve `index.html`; without it, unknown paths 404, which is what a content site wants.

Adopting refuses in three cases rather than guessing:

- **Deployment files already exist.** A `Dockerfile` or `compose.yaml` that Shibumi did not write may build or run something other than your site, so adopting stops and asks you to remove or rename them.
- **The project is a server app.** A `start` script means something runs inside the container, and that is `bun ship:setup`'s job: it asks server or static and writes the matching files. To ship a static build from a project that also has a `start` script, run `bun ship:setup --static --output-dir <dir>`.
- **`index.html` sits at the project root with no directory to serve.** This is the case where the table above found nothing at all and the site is a flat pile of files at the root. A static image serves one directory and never packages a whole checkout, so move the site down a level with `mkdir public && git mv index.html public/`, then adopt again. A project with a detected build directory adopts normally, root `index.html` or not.

Without a build script, the output directory has to be committed already, so the shipped image matches the exact commit the server verifies.

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

## Blog

The blog template is Astro with the parts a blog needs on day one: posts in Markdown, RSS, a sitemap, SEO meta tags, and an `llms.txt` for agents. It builds to `dist/` and ships through the same static path as any other framework's output, so `bun ship:setup` arrives pre-configured.

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

Full-stack projects include the versioned extension command. Add bundled auth, email, or uploads source with:

```sh
bun shi add auth
```

The command previews writes, stops on conflicts, records a named guide under `agents/`, and does not duplicate files when repeated. Auth and uploads need the full-stack database; uploads also needs auth installed first.

## Deferred

Cloudflare, Vercel, Fly.io, background jobs, payments, admin, and a public extension registry remain planned. They stay out until fixture projects can install, build, run, and deploy them without special cases.

Working server commands are documented in [Server commands](/docs/reference/server-commands).
