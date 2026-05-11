<div align="center">
  <img src="public/og.png" width="128" alt="Shibumi Stack">
  <h1>shibumistack.dev</h1>
</div>

> Refined simplicity for shipping web apps.

Shibumi Stack is a small, opinionated path for building durable web apps with Bun, Hono, Drizzle, Alpine, and Zod.

Small pieces chosen with care. Clear seams. No hidden runtime. Built to age well.

## Run locally

```sh
bun install
bun dev
```

Open <http://localhost:9001>.

## Useful commands

```sh
bun start   # run server
bun test    # run route tests
bun check   # alias for tests
```

## Pages

- `/` serves the homepage.
- `/brand` serves brand guidelines.
- Requests with `Accept: text/markdown` receive Markdown for supported pages.
- Static files live in `public/`.

## Stack

- **Bun**: runtime, test runner, package manager
- **Hono**: routes and middleware
- **Drizzle**: planned schema, queries, and migrations
- **Alpine**: planned client-side interactivity
- **Zod**: planned validation and type inference

## Status

Coming soon — <https://shibumistack.dev>
