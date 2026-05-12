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
bun check   # TypeScript check
```

## How the site is shaped

- `src/layout.html` is the document shell.
- `src/pages/` contains page bodies plus optional page CSS and JS.
- `src/parts/` contains shared fragments such as nav, footer, and metadata.
- `src/icons/` contains SVG icons inlined with `{{icon(name)}}`.
- `public/main.js` is the shared browser entrypoint.
- Static files and public Markdown live in `public/`.

## Routing

- `/` maps to the `index` page.
- One-segment routes such as `/brand`, `/docs`, and `/building` are discovered
  from `src/pages/{page}.html` and optional `public/{page}.md`.
- Markdown-only pages such as `/dx` serve Markdown directly.
- Requests with `Accept: text/markdown` receive Markdown when a page has a
  Markdown alternate.
- Direct Markdown links such as `/README.md` are served inline as plain text.

## Stack

- **Bun**: runtime, test runner, package manager
- **Hono**: routes, middleware, and static serving
- **Drizzle**: planned schema, queries, and migrations
- **Alpine**: planned client-side interactivity
- **Zod**: planned validation and type inference

## Status

Coming soon — <https://shibumistack.dev>
