# my-shibumi-app

Built with [Shibumi Stack](https://shibumistack.dev) — Bun, Hono, Drizzle, Alpine, Zod.

## Getting started

```sh
bun install
bun run db:migrate
bun dev
```

## Stack

- **Bun** — runtime, package manager, test runner
- **Hono** — route layer
- **Drizzle** — schema, queries, migrations
- **Alpine** — client-side interactivity
- **Zod** — validation

## Commands

```sh
bun dev              # dev server with hot reload
bun test             # run tests
bun run db:generate  # generate migration from schema
bun run db:migrate   # apply migrations
bun run db:studio    # open Drizzle Studio
```
