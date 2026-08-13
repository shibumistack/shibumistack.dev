<div align="center">
  <img src="public/og.png" width="128" alt="Shibumi Stack">
  <h1>shibumistack.dev</h1>
</div>

> Refined simplicity for shipping web apps.

Shibumi Stack is a small web stack for apps you can understand and keep: Bun, Hono, Zod, Drizzle, SQLite, Alpine, and Nanostores.

Clear seams. No hidden runtime.

## Run locally

```sh
bun install
bun dev
```

Open <http://localhost:9001>.

## Useful commands

```sh
bun start        # run server
bun test         # run route tests
bun check        # TypeScript check
bun run ship     # set up when needed, check, push if needed, and deploy
bun run ship:setup # review or change deploy setup without pushing
```

## Project structure

- `src/layout.html` is the document shell.
- `src/pages/` contains page bodies plus optional page CSS and JS.
- `src/parts/` contains shared fragments such as nav, footer, and metadata.
- `src/icons/` contains SVG icons inlined with `{{icon(name)}}`.
- `src/content/` contains Markdown alternates and Markdown-only pages.
- `public/main.js` is the shared browser entrypoint.
- Static assets live in `public/`.

## Routing

- `/` maps to the `index` page.
- One-segment routes such as `/brand`, `/server`, `/ship`, and `/building` are discovered
  from `src/pages/{page}.html` and optional `src/content/{page}.md`.
- `/docs` and nested `/docs/*` routes use a shared documentation shell with Markdown sources under `src/content/docs/`; `/docs/decisions` retains original technical-decision content.
- Markdown-only pages such as `/dx` serve Markdown directly.
- Requests with `Accept: text/markdown` receive Markdown when a page has a
  Markdown alternate.
- Direct Markdown links such as `/docs.md` and `/README.md` are served inline as
  plain text.

## Stack

- **Bun**: runtime, test runner, package manager
- **Hono**: routes, middleware, and static serving
- **Zod**: planned validation at input boundaries
- **Drizzle**: planned schema, queries, and migrations
- **SQLite**: planned local durable storage
- **Alpine**: planned component-local interactivity
- **Nanostores**: planned shared browser state

## Related projects

- [`shibumi-server`](https://shibumistack.dev/server) is the experimental, open-source webhook deploy service for rootless Podman behind Caddy. It refuses builds without configured memory/disk headroom and bounds build time and resources. Its public repository contains code and generic templates only; instance configuration and secrets stay on the VPS.

## Status

Coming soon: <https://shibumistack.dev>
