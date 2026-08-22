<div align="center">
  <img src="public/og.png" width="128" alt="Shibumi Stack">
  <h1>shibumistack.dev</h1>
</div>

> Generate web projects with source, tests, agent instructions, and deployment config in the repository.

Shibumi Stack uses Bun, Hono, Zod, Drizzle, SQLite, Alpine, and optional Nanostores.

## Run locally

```sh
bun install
bun dev
```

Open URL printed by `bun dev` (currently <http://localhost:9002/> from `shibumi-server.json`).

## Useful commands

```sh
bun start        # run dynamic development server
bun run build    # render complete static site to dist/
bun test         # run route and static artifact tests
bun check        # TypeScript check
bun ship         # build static image, upload, push if needed, and deploy
bun ship -y      # prompt-free agent run; Bun needs no -- separator
bun ship:setup   # review or change deploy setup without pushing
bun ship:update  # update only owned ship client source
```

## Project structure

- `src/layout.html` is the document shell.
- `src/pages/` contains page bodies plus optional page CSS and JS.
- `src/parts/` contains shared fragments such as nav, footer, and metadata.
- `src/icons/` contains SVG icons inlined with `{{icon(name)}}`.
- `src/content/` contains Markdown alternates and Markdown-only pages.
- `public/main.js` is the shared browser entrypoint.
- Static assets live in `public/`.
- `bun run build` renders every known route and copies assets to `dist/`.

## Routing

- `/` maps to the `index` page.
- One-segment routes such as `/brand`, `/forms`, `/server`, `/ship`, and `/building` are discovered
  from `src/pages/{page}.html` and optional `src/content/{page}.md`.
- `/docs` and nested `/docs/*` routes use a shared documentation shell with Markdown sources under `src/content/docs/`; `/docs/decisions` retains original technical-decision content.
- Markdown-only pages such as `/dx` serve Markdown directly.
- Development rendering supports `Accept: text/markdown`; static production exposes the same sources through explicit Markdown paths.
- Direct Markdown links such as `/docs.md` and `/README.md` are served inline as plain text.

## Deployment

Local prebuilt shipping uses Colima with Docker CLI, Docker Compose, and Buildx:

```sh
brew install colima docker docker-compose docker-buildx
colima start
docker info
docker compose version
docker buildx version
```

`bun ship` checks these tools before tests or confirmation. When Docker config names an unavailable credential helper, Ship offers to remove only stale helper references after saving a mode-`0600` backup. Declining prints manual recovery steps.

Production runs a scratch container containing only a static BusyBox binary and generated `dist/`. Host Caddy owns HTTPS, compression, headers, and public routing. Shibumi retains image identity, health checks, and rollback without shipping Bun or application dependencies in the runtime image.

## Stack

- **Bun**: development runtime, build tool, test runner, package manager
- **Hono**: routes, middleware, and static serving
- **Zod**: planned validation at input boundaries
- **Drizzle**: planned schema, queries, and migrations
- **SQLite**: planned local durable storage
- **Alpine**: planned component-local interactivity
- **Nanostores**: planned shared browser state

## Related projects

- [`Shibumi Forms`](https://shibumistack.dev/forms) is open-source form collection for static sites. Hosted pre-alpha and self-hosted source are available.
- [`shibumi-server`](https://shibumistack.dev/server) is the released, open-source webhook deploy service for rootless Podman behind Caddy. It builds exact commit images locally, uploads them through SSH, and checks server memory/disk headroom before cutover. Its public repository contains code and generic templates only; instance configuration and secrets stay on the VPS.

## Status

`create-shibumi`, bundled extensions, Forms, Server, and Ship are available: <https://shibumistack.dev>
