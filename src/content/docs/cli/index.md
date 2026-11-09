# create-shibumi CLI

Every template runs locally with Bun and deploys to a Linux VPS through `shibumi-server`. Start with the [quick start](/docs) for a working local app, then return here for flags and project details.

Requires **Bun 1.4.4 or newer** and Git. Check `bun --version` and use `bun upgrade` if needed. The CLI refuses an older runtime before creating files, including when printing the extension installer. Full-stack and blog use Bun's native `bun check`, not a separate TypeScript compiler dependency.

## Create a project

Three questions, then the project exists:

```clack
bun create shibumi@latest my-app
渋み  shibumi
success|Project name?
answer|quiet-bamboo
success|What are you shipping?
answer|Bun full-stack app (recommended)
success|Deploy to a VPS now?
answer|Later
result|Created quiet-bamboo
success|Template copied
success|Git initialized; nothing committed, the first commit is yours
success|Dependencies installed
success|Deploy script added (scripts/ship.ts)
info|Next: cd quiet-bamboo, bun dev, and bun ship:setup when you're ready
outro|Docs: https://shibumistack.dev/docs
```

Answering **Yes** to the deploy question runs `bun ship:setup` in the same session. Interactive setup offers to commit generated files and ship; stopping or declining leaves the next command printed in the terminal. **Later** defers setup.

Automation skips the questions:

```sh
bun create shibumi@latest my-app --template full-stack --yes
```

`--template` takes `full-stack`, `blog`, or `static`. `--no-git` and `--no-install` skip those steps. VPS deployment only <span class="dim">(for now)</span>; provider choices stay out until generated fixtures prove each build and deploy path.

## Add deployment to an existing project

A dot instead of a name adopts the current directory. Instead of scaffolding, the deploy script is copied in next to your own files. Your existing files are left as they are, with one exception: `package.json` gains the `ship*` scripts and a `@clack/prompts` dev dependency, since the deploy script imports it.

```clack
bun create shibumi .
渋み  shibumi
info|Existing project found (Astro detected)
success|Add deploy tooling to this project?
answer|Yes
success|Built site directory?
answer|dist/ (detected)
success|Wrote scripts/ship.ts, package.json, Dockerfile, compose.yaml, .dockerignore
success|Added scripts: ship, ship:setup, ship:update, ship:status, ship:logs, ship:webhook
result|Installed @clack/prompts
success|Deploy to a VPS now?
answer|Later
info|Deployments serve dist/. Review the generated Dockerfile and compose.yaml.
outro|Docs: https://shibumistack.dev/docs
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
- **`index.html` sits at the project root with no directory to serve.** The table above found nothing, so the site is a flat pile of files at the root. A static image serves one directory and never packages a whole checkout, so move the site down a level with `mkdir public && git mv index.html public/`, then adopt again. A project with a detected build directory adopts normally, root `index.html` or not.

Without a build script, the output directory has to be committed already, so the shipped image matches the exact commit the server verifies.

## Shared project contract

Generated projects import their libraries directly. Each applicable project includes:

- root `agents.md` guidance and reviewed `scripts/ship.ts`
- package commands for development, setup, status, logs and shipping
- loopback-only Compose configuration, resource limits and a health check, either included or generated during setup

Full-stack includes an app test suite and TypeScript checking. Blog includes TypeScript checking and a static build. The plain-file static starter needs neither a compiler nor an app test suite. All three use the shared Ship client for deployment and rollback.

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

The blog template runs on the same engine as this site — a Bun + Hono markdown renderer — with the parts a blog needs on day one: posts in Markdown, RSS, a sitemap, SEO meta tags, and an `llms.txt` for agents. It builds to `dist/` and ships through the same static path, so `bun ship:setup` arrives pre-configured.

## Full-stack SQLite

A full-stack project stores its database under persistent `/data` and enables WAL mode, foreign keys, and a bounded busy timeout. It includes tracked migrations, a fresh-database migration test, pre-migration backup, backup retention, and an explicit restore command.

> **Important:** Image rollback does not reverse a database migration. Generated guidance requires backward-compatible migrations and a reviewed restore path before destructive schema changes.

The demo counter is deliberately public: one shared row, clamped by a database constraint and rate-limited. Other mutations that touch user data need authentication. Auth and uploads extensions add APIs; they do not generate login or upload pages.

## Release acceptance

Packed-artifact checks install the CLI outside its source checkout and run the commands each template actually declares. `bun test` in the CLI checkout does not deploy to a server.

| Template | Installation | Local checks | Build |
| --- | --- | --- | --- |
| Full-stack | `bun install --frozen-lockfile` | `bun test`, `bun run check` | `bun run build` |
| Blog | `bun install --frozen-lockfile` | `bun run check` | `bun run build` |
| Static | `bun install --frozen-lockfile` | Plain files; verified by artifact and live checks | None |

The separate opt-in live matrix scaffolds every current template from a Bun-packed artifact and runs each journey twice against a disposable VPS app. It covers setup, image upload, HTTPS browser checks, redeployment, health-failure recovery and rollback to the expected commit. Full-stack also checks sessions, SQLite values and uploaded bytes across replacement; blog checks posts, feeds, metadata and draft exclusion; static checks nested pages, assets and 404s.

These checks require an explicitly disposable registration and keep their reports outside the checkout. They are not a claim that every interactive prompt, every extension or every VPS architecture has been tested.

## Extensions

Full-stack projects include the versioned extension command. Add bundled auth, email, or uploads source with:

```sh
bun shi add auth
```

The command previews writes, stops on conflicts, records a named guide under `agents/`, and does not duplicate files when repeated. Auth and uploads need the full-stack database; uploads also needs auth installed first.

## Deferred

Cloudflare, Vercel, Fly.io, background jobs, payments, and a public extension registry remain planned. They stay out until fixture projects can install, build, run, and deploy them without special cases.

Working server commands are documented in [Server commands](/docs/reference/server-commands).
