# Shibumi Stack

Simple apps, whole stack: build any web app without React, build pipelines, or 600 MB of `node_modules`. A CLI writes each one from curated parts, and one VPS or your homelab runs them all.

Every generated project keeps its source, tests, and deployment config in your repository.

Shibumi (渋み) is a Japanese idea associated with quiet, understated beauty. Here it means fewer layers and code you can inspect.

## What Shibumi does

The whole stack fits in your head, and in your agent's context window.
Routes are Hono routes. Data uses SQLite and Drizzle when the app needs a database. Browser behavior starts with Alpine. Nanostores joins only when state must cross components.
## Guidance for coding agents

Generated projects include a root `agents.md`. It records route locations, data rules, available checks, and files that need extra care.

An extension adds a named file such as `agents/auth.md` and merges its rules into the root guide. The instructions grow with the code installed in the project.

## CLI

`create-shibumi` offers three starting points:

1. **Bun full-stack app** (recommended): Hono, Alpine, Zod, and SQLite with Drizzle, migrations, persistent data, backup, and restore.
2. **Blog**: Astro with Markdown posts, RSS, sitemap, SEO meta, and an `llms.txt`.
3. **Static site**: publish a verified build directory such as `./dist`, `public`, `_site`, `build`, or `out` from any framework.

```sh
bun create shibumi@latest my-app
```

All three deploy to a Linux VPS or homelab through `shibumi-server`. Other providers can wait until their generated projects pass the same artifact and deployment tests.

Already have a project? `bun create shibumi .` detects its build directory and adds the same deployment path without scaffolding anything.

## VPS deployment

[shibumi-server](https://server.shibumistack.dev) verifies the repository, branch, commit, image labels, platform, and health endpoint before it replaces a running container.

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
shibumi-server add example.com
```

`bun ship` builds committed code on your computer, uploads the exact image through SSH, then pushes Git and asks the server to deploy that commit. Caddy retries the loopback upstream for up to 20 seconds during replacement. The server retains one previous image for up to 12 hours.

Project code stays in Git. SSH targets stay on your computer. Webhook secrets and machine paths stay on the server.

## Forms

[Shibumi Forms](/forms.md) gives a static page an HTML form endpoint. Hosted pre-alpha is running at <https://forms.shibumistack.dev>, and the [self-hosted source](https://github.com/bitbonsai/shibumi-forms) uses Bun, Hono, and SQLite.

## Extensions

From a generated project, install auth, email, or uploads as source:

```sh
bun shi add auth
```

The installer previews file writes and stops on conflicts.

## Links

- [Documentation](/docs/index.md)
- [Roadmap](/building.md)
- [Brand assets](/brand.md)
- [Contributing](/CONTRIBUTING.md)
- [License](/LICENSE)
