# Roadmap

This page separates working software from plans.

## Available now

- [Shibumi Forms](/forms.md), hosted pre-alpha and self-hosted source
- [`shibumi-server`](https://server.shibumistack.dev) for Linux VPS and homelab deployment
- [Ship](/ship.md), the project-owned client for setup, status, logs, deployment, and rollback
- [`create-shibumi`](/docs/cli.md) for static output, Bun web, and SQLite full-stack projects
- [Extensions](/extensions.md) for bundled auth, email, and uploads source

## CLI

`create-shibumi` offers three starting points:

- framework-agnostic static output
- a Bun, Hono, Zod, and Alpine web app
- the web app plus Drizzle and SQLite

Each generated project includes tests or artifact checks, a root `agents.md`, current Ship source, and VPS deployment through `shibumi-server`.

## Release checks

Packed-package tests create every starting point in a temporary directory. Generated projects must install, test, typecheck, build, and run without paths back into the CLI repository.

Static output must contain `index.html` and stay inside the project root. Bun apps must bind to the assigned loopback port and pass their health check. SQLite data must survive container replacement, and backup and restore must work before migrations run in deployment tests.

## Later work

Other deploy providers remain unsupported. Payments, admin, and background jobs can follow as copied source after their installers pass conflict, migration, removal, and fixture tests.

## Stack rules

### Data

Full-stack projects use Drizzle with SQLite under persistent `/data`. WAL mode, foreign keys, migrations, backup, and restore belong in the generated project.

### Browser state

Alpine handles behavior inside a component. Add Nanostores when separate components need the same state.

### Security

Validation belongs at request and environment boundaries. Form mutations need CSRF protection. Generated deployment config binds app ports to loopback.

### Extensions

Extensions copy files into the project. A feature that adds tables or routes also brings migrations, tests, and a named `agents/*.md` guide.

### Server

[`shibumi-server`](https://server.shibumistack.dev) accepts exact commit-tagged images over SSH, verifies signed GitHub pushes, checks host capacity, validates Compose and image identity, starts the replacement, and checks health. It retains one rollback image for up to 12 hours. Public source stays in Git; server secrets and machine paths do not.
