# Shibumi Stack

Simple apps, whole stack.

Generate a Bun app, blog, or static site as source you own. Run it locally, then deploy it to your Linux server. [Follow the quick start](/docs). Bun 1.4.4+ required; no VPS needed to try it.

Every generated project gives you source you own, a deploy script, and an `agents.md` with the house rules. Full-stack includes app tests and container files. Blog and static generate their container files during `bun ship:setup`.

Shibumi (渋み) is a Japanese idea associated with quiet, understated beauty. Here it means fewer layers and code you can inspect.

## What Shibumi does

A small website can turn into a framework project before you've written the first page. Shibumi starts with Hono routes, HTML, and SQLite with Drizzle when you need a database. Alpine handles browser behavior; Nanostores handles state shared across components.

Two tools handle creation and deployment: `create-shibumi` generates the project, and `shibumi-server` runs it on your Linux server.

## Guidance for coding agents

Generated projects include a root `agents.md`. It records route locations, data rules, available checks, and files that need extra care.

An extension adds a named file such as `agents/auth.md` and merges its rules into the root guide. The instructions grow with the code installed in the project.

## CLI

`create-shibumi` offers three starting points:

1. **Bun full-stack app** (recommended): Hono, Alpine, Zod, and SQLite with Drizzle, migrations, persistent data, backup, and restore.
2. **Blog**: the shibumistack.dev engine — Bun + Hono markdown posts, RSS, sitemap, SEO meta, and an `llms.txt`.
3. **Static site**: publish a verified build directory such as `./dist`, `public`, `_site`, `build`, or `out` from any framework.

```sh
bun create shibumi@latest my-app
```

All three deploy to a Linux VPS or homelab through `shibumi-server`. Other providers can wait until their generated projects pass the same artifact and deployment tests.

Already have a project? `bun create shibumi .` detects its build directory and adds the deploy script and container files. Your application source stays in place.

## VPS deployment

[shibumi-server](https://server.shibumistack.dev) runs registered apps in rootless Podman on your Linux VPS or homelab. It verifies the repository, commit, image labels and platform before replacement, then checks the new container's health. Startup or health failure triggers restoration of the previous image.

Run the installer on your Linux server, not your development computer. Prepare Git, rootless Podman, a Compose frontend, Caddy and systemd first; the bootstrap installs Bun if it is missing.

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
```

From the generated project's root, run `bun ship:setup`. It detects the Compose service and health path and registers the app over SSH, avoiding mismatched manual registration settings.

`bun ship` builds committed code with Docker on your computer, uploads the image through SSH, then pushes Git and asks the server to deploy that commit. Caddy retries the loopback upstream for up to 20 seconds during replacement. Recovery can take longer and interrupt requests. The default rollback window is 12 hours; image rollback does not undo database changes. Server costs depend on the provider and the apps you run.

Project code stays in Git. SSH targets stay on your computer. Webhook secrets and machine paths stay on the server.

## Forms

[Shibumi Forms](/forms.md) gives a static page an HTML form endpoint. Hosted pre-alpha is running at <https://forms.shibumistack.dev>, and the [self-hosted source](https://github.com/bitbonsai/shibumi-forms) uses Bun, Hono, and SQLite.

## Extensions

From a generated full-stack project, install auth, email, uploads, or admin as source:

```sh
bun shi add auth
```

The installer previews file writes, stops on conflicts, and adds the feature's dependencies. Each extension includes `agents/<name>.md` with instructions for its routes, configuration and tests. Auth and uploads add APIs; you build the login and upload screens your app needs.

## Links

- [Documentation](/docs/index.md)
- [Roadmap](/building.md)
- [Brand assets](/brand.md)
- [Contributing](/CONTRIBUTING.md)
- [License](/LICENSE)
