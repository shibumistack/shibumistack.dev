# Agent Notes

## Project

This repo is the current public site for Shibumi Stack at `shibumistack.dev`.
It is also the first dogfood artifact for the product idea: a small, Bun-first
web stack built around Hono, Drizzle, Alpine, and Zod.

The package/scaffolder does not exist in this repo yet. The site documents the
decisions, roadmap, brand, and planned DX for `create-shibumi`.

## Stack

- Runtime and package manager: Bun.
- HTTP app: Hono in `src/app.ts`.
- Static serving: `hono/bun` `serveStatic` from `public/`.
- Templates: `src/layout.html`, page bodies in `src/pages/`, and fragments in
  `src/parts/`.
- Shared assets: `public/`.
- Markdown alternates and Markdown-only page content: `src/content/`.
- Tests: Bun test runner in `test/app.test.ts`.
- Deployment: Bun server on port `9001`, with Docker and `compose.yaml`.

Planned stack pieces in the product docs are Bun, Hono, Drizzle, Alpine, and
Zod. This site currently uses Bun and Hono directly; Drizzle, Alpine, and Zod
are product roadmap/documentation content, not active dependencies here.

## Commands

```sh
bun install
bun dev      # hot reload server on http://localhost:9001
bun start    # run server
bun test     # route tests
bun check    # TypeScript check without emitting files
```

There is no lint or build script at the moment.

## Routing

`serve.ts` exports the Bun server config:

- Port: `9001`.
- Fetch handler: `app.fetch` from `src/app.ts`.

`src/app.ts` owns all dynamic behavior:

- `/` maps to the `index` page.
- One-segment lowercase routes such as `/brand`, `/docs`, and `/building` are
  resolved from `src/pages/{page}.html`, `src/pages/{page}/index.html`,
  `src/content/{page}.md`, or `src/content/{page}/index.md`.
- When both HTML and Markdown exist, HTML is served by default and Markdown is
  served only when the request prefers `Accept: text/markdown`.
- Markdown-only pages such as `/dx` serve Markdown directly.
- Direct Markdown routes such as `/index.md`, `/docs.md`, `/dx.md`, and
  `/CONTRIBUTING.md` return `text/plain` with inline disposition. Page docs
  resolve from `src/content/{name}.md`; `README.md` and `CONTRIBUTING.md`
  resolve from the repo root.
- Unknown routes render `src/pages/404.html` with status `404`.
- Remaining paths are served statically from `public/`.

The resolver is intentionally not a framework router: it supports only `/`,
one safe route segment, optional folder-style `index` files, and direct
top-level `.md` files. It does not support nested routes, route params, loaders,
or per-file code.

`src/layout.html` contains structural insert markers:

- `<!-- insert:nav -->` inserts `src/parts/nav.html`.
- `<!-- insert:page -->` inserts the current page body from `src/pages/`.
- `<!-- insert:footer -->` inserts `src/parts/footer.html` and
  `src/parts/install-dialog.html`.
- `<!-- insert:meta -->` inserts `src/parts/meta.html` when page metadata is
  provided.
- `<!-- insert:page-style -->` and `<!-- insert:page-script -->` insert optional
  `src/pages/{page}.css` and `src/pages/{page}.js`.

Templates use explicit `{{name}}` placeholders. `src/app.ts` only reads files
and performs small string replacements; there is no template engine.
Any safe `*.html` file in `src/parts/` is considered a part.

Inline SVG icons live in `src/icons/` and are read through the typed `icon()`
helper in `src/app.ts`. Part files reference them with `{{icon(name)}}`. Any
safe `*.svg` file in `src/icons/` is considered an icon. Keep the icon token
test passing so missing SVG files fail in tests.

## Content

The Markdown content files are not incidental duplicates. They are part of the
site contract for humans, agents, and direct source-shaped docs:

- `src/content/index.md`: homepage source copy.
- `src/content/docs.md`: product and architecture decisions.
- `src/content/building.md`: roadmap.
- `src/content/brand.md`: brand guidance.
- `src/content/dx.md`: long-form DX plan.
- `README.md` and `CONTRIBUTING.md`: repo docs, served inline from root.
- `public/llms.txt`: crawler/agent-facing summary.

When changing page copy, keep the HTML page and its related Markdown page in
sync unless the difference is deliberate.

## Frontend

Shared styles live in `public/shared.css`. Docs-specific styles live in
`src/pages/docs.css`. Optional page CSS files in `src/pages/` are inlined as
page-local `<style data-page>` blocks by the renderer.

`public/main.js` is the shared client entrypoint. It handles:

- Light/dark theme initialization and toggle via `localStorage`.
- Internal link interception and View Transitions when supported.
- Swapping `<main>`, page-local style/script, nav current state, and footer.
- Install dialog open/close behavior.
- Copy buttons for install commands.

Keep JavaScript small and framework-free unless the project direction changes.
The product roadmap mentions Alpine, but this site currently does not use it.

## Design Intent

The brand direction is restrained and editorial:

- Warm off-white/light and warm near-black/dark palettes.
- Persimmon/terracotta accent used sparingly.
- Type-led layout with calm spacing.
- Avoid loud marketing patterns, heavy animation, gradients, large decorative illustrations, and unnecessary cards.

The strongest source for design decisions is `.plans/design.md`. The existing
site has evolved beyond some early "single-column only" notes, but the core
principle still applies: quiet, readable, deliberate.

## Product Direction

Useful planning references:

- `.plans/dx.md` and `src/content/dx.md`: CLI, templates, extensions, deploy
  targets, and AI-native `agents.md` fragments.
- `.plans/vps-deploy-guide.md`: intended self-hosted/VPS deploy documentation.
- `.plans/design.md`: visual and copy constraints.

The intended future product is `create-shibumi`, a scaffolder that generates
plain owned source and lets extensions copy code into the app, including local
`agents.md` guidance. Shibumi should feel like opinionated glue, not a hidden
runtime framework.

## Testing Notes

Route tests are deliberately small and assert:

- HTML homepage default.
- Markdown negotiation behavior.
- HTML preference when the browser-style Accept header prefers HTML.
- A discovered HTML page with a Markdown alternate.
- A Markdown-only discovered page.
- One direct Markdown/plain-text route.
- Unknown route 404 handling.
- Discovered icon files resolve to SVG files and unknown icon names are rejected.

If adding routes or Markdown negotiation behavior, add focused route tests in
`test/app.test.ts`.

## Implementation Caveats

- `wantsMarkdown()` is intentionally conservative: Markdown is served only when
  `text/markdown` has positive quality and is at least as preferred as
  `text/html`.
- The footer year is generated at request time from `new Date().getFullYear()`.
- Brand assets under `public/brand/` include binary images and SVGs. Do not
  regenerate or modify them casually when making content or route changes.
- `.DS_Store` files are present in the tree; avoid touching unrelated metadata
  churn unless explicitly cleaning the repo.
