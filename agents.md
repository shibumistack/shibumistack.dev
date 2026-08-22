# Agent Notes

## Project

This repo is the current public site for Shibumi Stack at `shibumistack.dev`.
It is also the first dogfood artifact for the product idea: a small, Bun-first
web stack built around Hono, Zod, Drizzle, SQLite, Alpine, and Nanostores.

An unreleased scaffolder prototype lives under `shibumi-cli/`; the public `create-shibumi` repository and npm package remain placeholders without an executable. Do not present CLI as released. First release is scoped to three paths: framework-agnostic static output, a Bun/Hono/Alpine web app, and a Bun/Hono/Alpine/Drizzle/SQLite full-stack app. VPS deployment through `shibumi-server` is the only initial target; other providers and extensions remain planned. The experimental `shibumi-server` implementation lives in the separate public `shibumi-server` repository.

## Stack

- Runtime and package manager: Bun.
- Development renderer: Hono in `src/app.ts`.
- Static build: `scripts/build.ts` renders known routes and copies `public/` to `dist/`.
- Templates: `src/layout.html`, page bodies in `src/pages/`, and fragments in
  `src/parts/`.
- Shared assets: `public/`.
- Markdown alternates and Markdown-only page content: `src/content/`.
- Tests: Bun test runner in `test/app.test.ts`.
- Deployment: prebuilt scratch image with BusyBox `httpd` serving `dist/` on container port `3000`; host Caddy routes loopback traffic.

Planned stack pieces in the product docs are Bun, Hono, Zod, Drizzle, SQLite,
Alpine, and Nanostores. This site currently uses Bun and Hono directly; SQLite,
Drizzle, Alpine, Nanostores, and Zod are product roadmap/documentation content,
not active dependencies here.

## Commands

```sh
bun install
bun dev        # Ship wrapper starts hot reload on configured app port (currently http://localhost:9002/)
bun start      # run dynamic development server
bun run build  # render deterministic static output to dist/
bun test       # route and artifact tests
bun check      # TypeScript check without emitting files
bun ship       # build static image, upload, push, and follow deployment
```

There is no lint script.

## Routing

`serve.ts` exports the Bun server config:

- Port: validated `SHIBUMI_PORT`, then `PORT`, then `9001`. `bun dev` supplies the configured Ship app port.
- Fetch handler: `app.fetch` from `src/app.ts`.

`src/app.ts` owns rendering behavior used by development, tests, and the static build:

- `/` maps to the `index` page.
- One-segment lowercase routes such as `/brand` and `/building` are resolved
  from `src/pages/{page}.html`, `src/pages/{page}/index.html`,
  `src/content/{page}.md`, or `src/content/{page}/index.md`.
- `/docs` and nested `/docs/*` routes use `src/pages/docs/index.html`, CSS, and JS as a shared shell around allowlisted Markdown files under `src/content/docs/`. `/docs/decisions` renders original `src/content/docs.md` content.
- When both HTML and Markdown exist, HTML is served by default and Markdown is
  served only when the request prefers `Accept: text/markdown`.
- Markdown-only pages such as `/dx` serve Markdown directly.
- Direct Markdown routes such as `/index.md`, `/docs.md`, `/dx.md`, and
  `/CONTRIBUTING.md` return `text/plain` with inline disposition. Page docs
  resolve from `src/content/{name}.md`; `README.md` and `CONTRIBUTING.md`
  resolve from the repo root.
- Unknown routes render `src/pages/404.html` with status `404`.
- Remaining paths are served statically from `public/`.

Production uses generated `dist/`. HTML routes use directory `index.html` files, direct Markdown files remain available, `httpd.conf` defines text MIME types and custom 404 handling, and installer endpoints contain executable static snapshots.

The generic resolver intentionally supports only `/`, one safe route segment,
optional folder-style `index` files, and direct top-level `.md` files. Docs use
one explicit allowlisted nested-route resolver. No arbitrary nested paths,
route params, loaders, or per-file code.

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
- `src/content/forms.md`: hosted and self-hosted Shibumi Forms product page, mirrored by `/forms`.
- `src/content/server.md`: public architecture and security model for `shibumi-server`.
- `src/content/ship.md`: existing-project ship setup, mirrored by the non-nav `/ship` page. Files under `public/ship/v*.ts` are immutable owned-source snapshots; publish a new versioned path and update `/ship` instead of changing an existing version. `/install/ship` redirects to latest immutable `public/ship/install-v*.ts` snapshot, which validates project root and existing owned source before adding dependencies, package commands, and starting Clack setup.
- `README.md` and `CONTRIBUTING.md`: repo docs, served inline from root.
- `public/llms.txt`: crawler/agent-facing summary.

When changing page copy, keep the HTML page and its related Markdown page in
sync unless the difference is deliberate.

## Frontend

`public/shibumi.css` is the canonical shared design layer for all three Shibumi
sites (this repo, `../shibumi-server`, `../shibumi-forms`): palette tokens (both
`--paper`/`--ink` and `--bg`/`--text` naming schemes plus `--fs-*` aliases),
typescale, body + noise texture, serif headings, header/nav/mark, stack
popovers, theme toggle, footer, eyebrows, and the copy-button glow. Edit it
here only; the other repos vendor a copy and re-pull it with their
`scripts/sync-shibumi-css.sh`. Never edit a vendored copy.

`public/shared.css` holds shibumistack.dev-specific styles layered after the
canonical file. Page-specific styles such as
`src/pages/docs.css` and `src/pages/server.css` are inlined by the renderer.
Optional page CSS files in `src/pages/` are inlined as
page-local `<style data-page>` blocks by the renderer.

`public/main.js` is the shared client entrypoint. It handles:

- Light/dark theme initialization and toggle via `localStorage`.
- Internal link interception and View Transitions when supported.
- Swapping `<main>`, page-local style/script, nav current state, and footer.
- Install dialog open/close behavior.
- Copy buttons for install commands.

Keep JavaScript small and framework-free unless the project direction changes.
The product roadmap mentions Alpine, but this site currently does not use it.

### Terminal simulation system

The animated terminals on the homepage and `/server` share one visual and motion
language. Common styles belong in `public/shared.css`; page CSS should only own
terminal layout that is specific to that page.

- Use `.terminal-label` for neutral stages: quiet brown background with orange text.
- Use exactly one solid green `.terminal-label-success` per terminal simulation, reserved for its final outcome such as `done` or `shipped`. An intermediate confirmation may use `.terminal-label-confirmed` for green text on the quiet brown background. Inline checks may use `.terminal-ok`; neither adds another solid green label.
- Use `.terminal-label-action` for the next command and `.terminal-label-info` for informational links.
- Use `.terminal-ok` for green checks and successful output. Keep red reserved for a real failure.
- Type commands at a randomized 40 to 70 ms per character, averaging 55 ms. Reveal output rows every 500 ms. A staged check appears 300 ms after its row, with the next row 200 ms later.
- Start an above-the-fold terminal after 600 ms. Start below-the-fold terminals with `IntersectionObserver`.
- Every animated terminal gets a `refresh-cw` replay button in its top-right corner. Hide it while motion runs, reveal it when the terminal finishes, and hide it again immediately when replay starts.
- A replay must invalidate outstanding timers before resetting text and row classes. The current scripts use a generation counter for this.
- Under `prefers-reduced-motion`, show the complete terminal immediately and hide the replay control.

## Design Intent

The brand direction is restrained and editorial:

- Warm off-white/light and warm near-black/dark palettes (paper `#f5f0e4`/`#1b130f`, orange `#e95f19`/`#ff8648`).
- Persimmon/terracotta accent used sparingly.
- Type-led layout with calm spacing.
- Avoid loud marketing patterns, heavy animation, gradients, large decorative illustrations, and unnecessary cards.

Typography rules (hard):

- Typescale in rem only: 12 tiny (`--text-xs`), 14 small (`--text-sm`), 16 UI/nav (`--text-md`), 18 body (`--text-base`), 21 (`--text-lg`), 25 (`--text-xl`), ~31 (`--text-2xl`). Never below 12px, never off-scale values (no 13px, ever).
- Body is system-ui sans; serif (`--font-serif`) only for `h1`/`h2`/`h3` and the 渋み name-meaning aside.
- Mono stack must lead with `ui-monospace`; `SFMono-Regular` is a single-weight face and silently breaks `font-weight`.
- Eyebrow labels: 1rem mono, weight 300, 0.14em tracking, accent color (canonical `.eyebrow`).
- Content links: underline at 30% accent at rest, 100% on hover, `0.18em` offset.

Cross-site conventions:

- Nav grammar on every site: local pages first, the "Shibumi Stack" popover last among text links, then CTA + GitHub + theme toggle.
- One `theme-color` meta per page, updated by JS whenever the theme is applied. Never use `media="(prefers-color-scheme)"` theme-color variants; they track the system preference and fight the manual toggle.
- Install/create commands live inline on the page with a copy button, never gated behind a dialog alone.
- Copy for landing pages reads like explaining to a dev friend: prose over feature grids, /unslop applied, no €-price in the hero dek (price lands in the Ship section).

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
- The `/server` HTML page and Markdown alternate expose the deploy/security model.

If adding routes or Markdown negotiation behavior, add focused route tests in
`test/app.test.ts`.

## Gotchas

- Theme choice is per-origin `localStorage`, so a visitor's light/dark pick does not follow them between shibumistack.dev and the server/forms subdomains. Sharing it would need a cookie on `.shibumistack.dev`.
- After editing `public/shibumi.css`, re-run the sync scripts in `../shibumi-server` and `../shibumi-forms` (or `cp` directly); vendored copies drift silently otherwise.

- Framework-heavy VPS builds can exhaust small hosts before health checks run. Keep `shibumi-server` memory/disk preflight, build timeout, systemd ceilings, and per-app Compose limits intact; use the tiny fixture rather than a heavy production app for VPS dogfooding.
- Native `<details>` close jumps because the browser hides content before CSS can collapse it. Keep the explicit height animation in `src/pages/server.js`.
- `shibumi-server` installation requires Linux, Bun, Git, rootless Podman, Caddy, and systemd. The Bash bootstrap installs Bun when missing, then starts interactive setup. Its public endpoint stays pinned to a reviewed release script, while that script resolves the latest npm package. macOS and Windows visitors must copy the command to a Linux server over SSH; never imply local installation, browser-driven remote installation, or SSH credential collection.
- `shibumi-server add <domain> --dry-run` follows the real DNS and Caddy detection, prompts, port selection, and validation but writes no config or secrets, never invokes sudo, and leaves Caddy and systemd unchanged. Real Caddy changes use a constrained root helper only after the user confirms and sudo handles its own password. Existing domains preserve their current upstream until a healthy first deployment and explicit cutover. Managed new/rewrite sites use `/etc/caddy/sites.d/<app-id>.caddy`; existing-domain preserve/cutover routes use `/etc/caddy/sites.d/<app-id>.routes`. Verify with `<app-id>.*`, never assume `.caddy`.
- `bun ship` auto-detects missing setup, keeps SSH targets in mode-`0600` `~/.config/shibumi/config.json` versus committed `shibumi-server.json`, checks and pushes Git, triggers exact deployment over SSH by default, then polls mode-restricted status. `bun ship:setup` switches between recommended explicit shipping and deploy-on-push. GitHub CLI enables, disables, or repairs only matching webhook without exposing its secret.
- Direct `git push` does not deploy in recommended ship-trigger mode. Deploy-on-push requires server builds or another image producer; strict prebuilt apps should use `bun ship` so exact image reaches server before commit trigger.
- `bun build` invokes Bun bundler, not package script. Use `bun run build`; non-reserved scripts use shorthand such as `bun dev`, `bun preview`, `bun deploy`, and `bun ship`.
- Ship-client updates require immutable `public/ship/vN.ts` snapshots. `bun ship` may run reviewed latest source temporarily, then replace tracked `scripts/ship.ts` only after successful deployment; leave update unstaged for review.
- User-run commands check npm for newer releases and suggest `shibumi-server update`; registry failures must never block local work. Explicit update validates one stable version, installs that exact npm release through Bun, and preserves config and secrets. The `serve` process skips network checks.
- `shibumi-server uninstall` preserves config, secrets, app checkouts, containers, Caddy, and GitHub settings. Only `--purge` removes config and secrets, after confirmation; automation must pass `--purge --yes` explicitly.

## Implementation Caveats

- `wantsMarkdown()` is intentionally conservative: Markdown is served only when
  `text/markdown` has positive quality and is at least as preferred as
  `text/html`.
- The footer year comes from `package.json` so repeated static builds remain byte-identical.
- Brand assets under `public/brand/` include binary images and SVGs. Do not
  regenerate or modify them casually when making content or route changes.
- `.DS_Store` files are present in the tree; avoid touching unrelated metadata
  churn unless explicitly cleaning the repo.
