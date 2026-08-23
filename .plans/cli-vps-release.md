# create-shibumi VPS-first release plan

The site copy is the contract; this plan closes the gap between it and the prototype. Nothing on the site gets walked back. Adversarially reviewed 2026-08-23 (codex/gpt-5.6-sol); findings folded in below.

## What we're promising

### Commands
- `bun create shibumi@latest my-app`, then `cd my-app && bun dev`. v1 (site)
- `bunx create-shibumi` works equivalently. v1 (package quality, not site copy)
- Strict flags: `--yes`, `--no-git`, `--no-install`, `--help`, `--version`, plus non-interactive answers (`--template`, `--output-dir`, `--build-script`, `--spa`) so packed tests can scaffold without prompts; unknown flags rejected. v1 (package quality)
- Generated package scripts: `dev`, `dev:app`, `start`, `build`, `test`, `check`, `ship`, `ship:setup`, `ship:update`, `ship:status`, `ship:logs` with the exact command strings on /dx. Static template gets its own published exact script table (no app server). v1
- `bun ship` flow and flags (`--rebuild`, `--rollback`, `-y`; read-only `ship:status`/`ship:logs`). v1, carried by the released owned Ship client; CLI vendors it, never rewrites it.
- `bun run shibumi add <name>` extension installer with dry-run preview and conflict stop, shipping with auth and email extensions. v1 (owner decision 2026-08-23). Uploads is a named 0.2 fast-follow.
- `shibumi migrate --from next`. later

### Templates
- Exactly three starting points: static output, Bun web app, SQLite full stack. v1
- Interactive flow: "What are you shipping?" then "Deploy to a VPS now?" (Yes / Later). v1
- Static: optional build step, verified relative output dir (`dist`, `public`, `build`, `out`, `_site`, or custom), any framework. Validation: path inside project root, exists after build, non-empty, `index.html` present, symlinks contained. Build always runs on the user's machine (their toolchain: Ruby for Jekyll, Node for Gatsby; a bun build stage cannot); the image has no build stage and contains only verified output plus the pinned static runtime (scratch + pinned BusyBox httpd, the shibumistack.dev pattern). `httpd.conf` gains `E404:/404.html` only when the file exists. Explicit SPA fallback switches to a tiny Bun static-server image because BusyBox httpd cannot serve index.html with status 200 on unknown paths. Health checks `/`. v1. Build step is a package-script name, never a free shell string; onboarding creates a minimal package.json when the project has none (Jekyll). Verified by simulation 2026-08-23: Jekyll, Gatsby, and 11ty outputs all built locally and served from the scratch image. Static packaging logic lives in the Ship client so create-shibumi projects and existing framework projects (via `/install/ship`) share one implementation.
- Bun web: Hono, plain HTML/CSS, Alpine (pinned version, self-hosted, never an unpinned CDN `@3.x.x` script), Zod env and request validation, enumerated security headers (exact set and values fixed in the template contract and asserted on success, error, API, and static responses), CSRF stance per site docs (v1 templates ship no unauthenticated mutation endpoints; DB examples live in tests), graceful shutdown, `/healthz`, tests, `bun build src/server.ts --outdir dist --target bun` producing `dist/server.js`, container starts that file. File layout per /dx incl. agents.md, Dockerfile, compose.yaml, scripts/ship.ts. v1
- SQLite full stack: web template plus Drizzle and bun:sqlite under persistent `/data` outside the image; WAL, foreign_keys ON, bounded busy_timeout; tracked SQL migrations; fresh-DB migration test with representative queries; pre-migration backup and explicit restore with concrete numbers in the contract (retention count, size guard, backup method, checksum, failure atomicity), not adjectives; docs state image rollback does not touch database state. v1
- `shibumi-server.json`: written by `ship:setup`, which create runs at the end when "Deploy now" = Yes (owner decision 2026-08-23). "Later" leaves no server config; test both outcomes. v1
- Creation is atomic: temp sibling directory, verify, rename into place; failure or cancellation leaves destination absent; never overwrites an existing path. "Deploy now" = Yes runs as an explicit post-create phase with its own cancellation semantics, after the rename; it may touch SSH config and server state, never half-written projects. v1
- Git init optional; CLI never stages or commits. v1
- Nanostores absent until shared browser state exists. v1 by omission
- Blog, SPA, AI, framework-specific templates. later. The Astro `blog` template shipped 2026-08-23 (contract below, id `blog`); further framework templates follow the same pattern.

### blog template contract (template id `blog`, shipped 2026-08-23)
- Standard static-path contract: pinned deps, committed bun.lock, pack-safe `gitignore` (node_modules/, dist/, .astro/), agents.md six sections, ship scripts with `ship:setup --static --output-dir dist --build-script build`, no Dockerfile/compose (ship generates).
- Design: Nue-blog structure (name-only hairline header, one ~650px column, whole-block post links of date/title/excerpt, no cards or boxes, content-as-demo with real posts and zero template meta-copy) skinned with shibumi.css tokens (paper/ink palette, persimmon accent, serif h1-h3). CSS stays one small file, @layer + native nesting, semantic selectors.
- Content collection schema enforces SEO: title max 60, description 50-160 (drives meta + RSS), date, optional ogImage falling back to a static `public/og-default.png`. No generated OG images in v1.
- RSS via pinned @astrojs/rss at `/rss.xml` with head autodiscovery link; sitemap via pinned @astrojs/sitemap plus `public/robots.txt` with the Sitemap line; BaseHead component emits title, description, canonical, og:*, twitter:card, article:published_time; optional JSON-LD BlogPosting.
- Agentic surface: generated `/llms.txt` endpoint (H1, blockquote summary, per-post links to markdown alternates) and a `[id].md.ts` endpoint emitting every post as plain markdown at `posts/<id>.md`; each post's HTML head links `rel="alternate" type="text/markdown"`.
- Gotchas: `site` must be set in astro.config.mjs before first ship (sitemap/RSS/canonicals need it; agents.md checks-before-commit item); keep `build.format: "directory"` so BusyBox httpd serves clean URLs; `.md` MIME already mapped in ship v42's httpd.conf; `.xml:application/xml` mapping ships with the next ship revision (v43 batch) so RSS/sitemap serve with the right content type.
- Selector: "Static site" gains a "Start from" follow-up (Plain files default, Astro templates listed) backed by real template ids so `--template blog` works non-interactively. Shipped 2026-08-23 with clack 1.7 (0.7 dropped keystrokes under agent-driven ptys).

### Deploy
- VPS or homelab only, via shibumi-server; Cloudflare, Vercel, Fly.io deferred until they pass the same tests. v1
- shibumi-server behaviors (install script, `add`, `--dry-run`, Caddy retry window, image retention, pre-replacement validation, trust boundaries) are released server-side promises; the CLI release gates on a compatibility check against the current server release, evidenced by dogfood logs, not re-asserted from this repo.
- No Shibumi runtime dependency in generated apps. v1
- Hardened container contract: `.dockerignore`, secret-exclusion test (no `.env`, keys, `.git`, backups in image), non-root user, image filesystem inspected in acceptance. v1

### Extensions (v1: installer + auth + email)
- Installer: `bun run shibumi add <name>` via an owned, vendored `scripts/shibumi.ts` (ship.ts pattern; keeps the no-runtime-dependency promise; bundle delivery mechanism pinned and checksummed, defined in workstream 6). Dry-run preview of every write and exact edit; hooks use unique source matches and stop on changed text; removal supported; agents.md section merge. Ships only after fixture/repeat/conflict/removal tests pass (site promise).
- Single-database rule (owner decision 2026-08-23): extensions never create their own database; they add tables to app.db through the project's one migration stream. Manifests carry migration content, and the installer writes it as the next filename in sequence at install time (fixed names would collide or trip the high-water guard). Extensions add their own Drizzle schema file (`src/db/schema-<ext>.ts`) wired into `src/db/index.ts` by an install hook. Removal deletes code, never tables; the agents fragment documents leftover tables and the manual drop.
- Auth: cookie sessions, password + magic-link login. Hardened beyond the prototype: `Bun.password` hashing, users/sessions tables via an installed migration (targets the full-stack path; installer refuses paths without a database), CSRF on mutation forms, login rate limit, tests. v1
- Email: transactional send via Resend; single lib file, env var names, agents fragment, pinned dep, no tables. v1
- Uploads: named site promise, no prototype code, largest security surface (multipart, validation, /data storage, safe serving). 0.2 fast-follow with a dated slot.
- Payments, admin, public registry, npm-scoped registry. later

### agents.md fragments
- Every generated project has a root `agents.md`: commands, route/template locations, trust boundaries and validation rules, database path and migration process, files Ship generates, checks required before commit. v1
- Extensions add `agents/<extension>.md` and merge a named section into the root file. v1, with the installer

## What we have

Prototype at `shibumi-cli/` in this repo. Working demo, not the promised product.

- One ~370-line `src/index.ts` plus `src/utils.ts`. Clack plus Chalk. `package.json` is already `create-shibumi@0.1.0`, has a bin, and is not `private`: publishable from the wrong repo by accident today.
- Four templates: bare, blog, ssr, static. Wrong set vs the three contracted paths; blog is deferred; templates omit agents.md and scripts/ship.ts (deploy config generated separately).
- Deploy prompt offers self-hosted, Cloudflare, Vercel, Fly.io, Static CDN. Contradicts VPS-only release.
- Vendored `src/templates/ship.ts` pins `CURRENT_SOURCE = ship/v21.ts`; site publishes v41. No sync assertion.
- Every Bun template's final image omits `src/` while its `start` script runs `src/*`: all generated self-hosted images are broken at runtime. Compose already binds `127.0.0.1`, defines health checks, and declares limits, but nothing verifies they are effective at runtime.
- Templates already use the promised `bun build src/server.ts --outdir dist --target bun`; the gap is containers running source instead of `dist/server.js`, plus no output verification.
- SSR template already carries Drizzle, `bun:sqlite`, schema, an SQL migration, and CRUD code, as unsafe fragments: it exposes unauthenticated POST/DELETE demo endpoints without CSRF and writes a shared `data/app.db` (also breaking test isolation). Nothing meets the persistence/backup/restore contract.
- No static-output validation exists in utils: no containment, emptiness, `index.html`, or symlink checks.
- Scaffolds directly into the destination with `mkdirSync`; failure leaves partial output. Git init runs `git add -A` plus an automatic commit. `execSync` with interpolated shell strings.
- Generated scripts: `ship:update` and `ship:logs` exist; `check` and `ship:status` are missing; others drift from the /dx table.
- Loose args: no `--help`/`--version`/`--no-git`/`--no-install`; unknown flags ignored.
- Extension installer (auth, email, images) mutates immediately, no dry run. `optimize` command is unpromised; drop.
- CLI tests cover helpers only; templates carry route/CRUD/artifact tests but they are weak and not isolated (shared DB, hard-coded fixture paths, 3 known execSync failures in static build tests).
- External state (verify at workstream start, not assumed): public `shibumistack/create-shibumi` repo = npm placeholder, published `0.0.1` has no executable; shibumi-server and Ship v41 released.

## Gap: promise vs reality

- `bun create shibumi@latest` / `bunx create-shibumi`: MISSING (placeholder 0.0.1, no executable).
- Three contracted starting points: MISSING (wrong template set).
- Static verification pipeline plus pinned static-server image: MISSING entirely.
- Bun web contract: PARTIAL. Build command and some structure exist; broken container runtime, no enumerated headers, shutdown, `/healthz`, pinned Alpine, or packed-fixture test.
- SQLite full stack: PARTIAL as unsafe fragments (see above); persistence, backup, restore, rollback docs MISSING.
- Interactive flow and VPS-only output: MISSING (five-provider selector).
- Root agents.md at creation: MISSING.
- Atomic creation: MISSING. No-staging promise: VIOLATED (auto-commit).
- Strict flags and non-interactive interface: MISSING.
- Exact script set: PARTIAL (`check`, `ship:status` missing; drift elsewhere).
- Current Ship client plus sync assertion: MISSING (v21 vs v41).
- Bun engine, pinned deps, bundled/zero runtime deps for bunx consumers: MISSING (Node engine, caret ranges, lockfile does not govern bunx installs).
- Packed-tarball acceptance, VPS dogfood, publish guards: MISSING.
- Deploy-side promises: carried by released shibumi-server/Ship; verify compatibility during dogfood.

## v1 scope (ship this)

`create-shibumi@0.1.0` on npm via `bun create shibumi@latest my-app` and `bunx create-shibumi my-app`.

- Three paths matching the contracts above exactly. VPS-only deploy through shibumi-server. Extension installer with auth and email per the extension contract.
- Every project: root agents.md, Dockerfile plus `.dockerignore`, compose.yaml (loopback bind, health check, restart policy, resource limits, `/data` only for full stack), scripts/ship.ts vendored at an exact recorded Ship version with byte-identity assertion, tests, check script, Bun engine with a declared minimum version.
- CLI itself: zero or bundled runtime dependencies so bunx installs are reproducible; atomic scaffold; Git init without staging; argument arrays only; build steps invoked as package-script names.
- Supported hosts declared and tested (macOS arm64, Linux amd64/arm64); unsupported hosts rejected with a tested message.
- Source lives in the public `shibumistack/create-shibumi` repo; this website repo keeps no package source after migration.

Non-goals for 0.1.0: provider adapters and static-provider bakeoff; blog/SPA/AI/framework templates; uploads/payments/admin extensions; extension registry; Nanostores; native shibumi-server static mode; migrate-from-next; `optimize`; webhooks beyond GitHub.

## Workstreams

Dependency order. Acceptance runs in the public repo from workstream 2 onward.

1. Package foundation (shibumi-cli, this repo)
   - Set `"private": true` immediately; it stays until the publish workstream's guards exist.
   - Split into `src/cli.ts`, `src/args.ts`, `src/create.ts`; strict parser incl. non-interactive answers; golden fixtures for every success/error/cancel/non-TTY message and exit code.
   - Atomic create incl. failure boundaries: install failure, git failure, SIGINT/SIGTERM, rename failure, concurrent creators, cleanup-permission errors. Destination absent in every case.
   - Git init without staging; `Bun.spawn` argument arrays everywhere; delete provider selector, bare/blog/ssr templates, `optimize`, and the prototype extension installer from the create surface (extensions return as the owned script in workstream 6).
   - Accept: `bun test` covers parsing, cancellation, dirty destination, every atomicity boundary; no shell-string exec; golden output fixtures pass.

2. Repo migration plus Ship pin (create-shibumi, site)
   - Move reviewed foundation to public `shibumistack/create-shibumi` now, before templates, so paths, CI, metadata, and review history are stable for release. Strip package source from this repo. LICENSE, README, AGENTS.md.
   - Vendor Ship at an exact immutable URL plus recorded checksum (v41 or the then-current version, recorded, not floating); `scripts/sync-ship.ts` plus byte-identity test. Deliberate upgrades re-run template acceptance.
   - Accept: CI green in public repo; sync assertion fails on any mismatch.

3. Bun web template
   - Full /dx layout; Zod env/request validation; enumerated header set asserted on success/error/API/static responses; pinned self-hosted Alpine; graceful shutdown; `/healthz`; no unauthenticated mutation endpoints; root agents.md with all six sections; exact script set; Dockerfile runs `bun dist/server.js`; hardened image (non-root, `.dockerignore`, secret-exclusion).
   - Accept: fixture passes install/test/check/build; container builds and serves `/healthz` on loopback; acceptance inspects runtime bindings, mounts, restart policy, and limits (not just Compose text); image filesystem contains only intended files; packed-fixture test fails on any missing path.

4. Static path (ship-owned packaging plus thin template)
   - Extend the Ship client with a static mode (owner decision 2026-08-23, validated by Jekyll/Gatsby/11ty simulation): `ship:setup` asks static vs server; static asks build script (optional), output dir, SPA choice; verification (inside-root, exists, non-empty, index.html, symlink containment) runs before every image build; generated Dockerfile copies only verified output into scratch + pinned BusyBox httpd (or the Bun static-server image when SPA chosen); `httpd.conf` `E404` only when `404.html` exists; minimal package.json created for script-less projects.
   - Publish the extended Ship as a new immutable `public/ship/vN.ts` on the site; update `scripts/ship.lock.json` in create-shibumi and re-run `bun sync:ship`.
   - create-shibumi static template becomes thin: sample content, agents.md variant, published exact static script table, ship static mode preconfigured.
   - Accept: fixtures for dist/public/build/out/_site plus a valid custom dir; a package.json-less fixture (Jekyll-shaped); rejections for absolute path, escape, empty dir, missing index.html, failed build script, escaping symlink; positive file-routing and URL-traversal tests; contained symlink passes; 404.html honored only when present; SPA fallback only when chosen and serving 200; image contains nothing but output + runtime.

5. SQLite full-stack template
   - Web template plus Drizzle/bun:sqlite at `/data`; WAL, foreign_keys, busy_timeout; tracked migrations; concrete backup contract (method, retention count, size guard, checksum, locking, failure atomicity) and explicit restore command; a versioned pre-deploy hook defines the ordering backup, then migration, then container replacement, and rollback is tested end to end against that ordering; rollback semantics in generated docs.
   - Accept: fixture proves migration, persistence across container replacement, backup, restore, and the full hook ordering; compose mounts `/data` persistently and nothing else.

6. Extension installer plus auth and email
   - Owned `scripts/shibumi.ts` vendored into templates (ship.ts pattern): `add <name>` with dry-run preview, unique-match hooks that stop on changed text, removal, agents.md section merge. Define and pin the bundle delivery mechanism (checksummed, versioned, no runtime dependency).
   - Auth extension hardened per contract above; email extension per contract. Homepage `bun run shibumi add auth` must execute exactly as printed; add the `shibumi` script to the generated /dx script tables and site fixtures.
   - Accept: fixture, repeat-install, conflict, and removal tests pass per extension; auth refused on non-database paths with exact message; dry run writes nothing.

7. Packed verification
   - `scripts/verify-packed.ts`: `npm pack`, install tarball into temp dir, scaffold all three paths non-interactively via the answer flags, assert no placeholders or repo paths, run each fixture's full acceptance from the tarball on a machine without the checkout. Extension add/remove cycle included per fixture.
   - Accept: entire suite green from tarball; tarball digest recorded.

8. Dogfood and release
   - Disposable VPS apps per path on both `linux/amd64` and `linux/arm64`, under the server's actual rootless Podman runtime: setup, exact image upload, deploy, health, status, logs, rollback. shibumistack.dev static conversion is the first static dogfood target. Bun skew test: declared minimum and current Bun locally vs floating container Bun.
   - Site gate before publish: /docs, /dx, /ship, /server, llms.txt, homepage `index.md`, roadmap, and extension copy checked against the release candidate; command/script tables must match generated output exactly (fixture-backed).
   - Publish under a prerelease dist-tag via npm trusted publishing (verified owner, no legacy tokens, post-publish provenance attestation check); run the cold clean-machine matrix against the registry; promote the verified digest to `latest`; tag the repo; verify `bun create shibumi@latest` and `bunx create-shibumi` cold; flip remaining "preview" wording.

## Release checklist (condensed gates)

1. `private` flag removed only in the publish commit; publish blocked unless repo URL, tagged clean commit, package owner, and dist-tag all match.
2. `files` allowlist reviewed via `npm pack --dry-run`; tarball digest recorded; zero/bundled runtime deps verified.
3. Packed acceptance green on clean machine; failure paths (existing destination, mid-prompt cancel, unknown flag, missing git, offline default install vs offline `--no-install`) leave destination untouched.
4. Dogfood matrix green (3 paths x 2 arches, Podman, rollback).
5. Site gate green (all listed files, fixture-backed command tables).
6. Prerelease dist-tag verified cold, then promoted to `latest`; post-publish scaffold from registry diffed against release fixture.
7. Security gates (section below) all green; any HIGH finding blocks, no exceptions.

## Security gates (hard blocks, owner decision 2026-08-23: no security hole ships, ever)

1. Every publish (0.1.0 and after) is preceded by an independent adversarial security review of the packed artifact and one generated fixture per path plus each extension, by a model that did not write the code. Any HIGH finding blocks release. No severity downgrades to make a date.
2. No unauthenticated mutation endpoint in any template or extension, enforced by an automated test that walks every generated route.
3. Every generated image: non-root user, secret-exclusion test (`.env`, keys, `.git`, backups absent), path-traversal tests against the static server, loopback-only binding verified at runtime.
4. Installer hooks and build steps never execute user-supplied shell strings; enforced by grep-level CI check for `execSync`/shell interpolation in the shipped surface.
5. Auth extension additionally gets its own dedicated review (session fixation, CSRF, timing, rate limit, magic-link token entropy and expiry) before workstream 7.
6. A gate failure reopens the owning workstream; the release has no "ship now, patch later" path for security findings.

## Resolved questions (owner, 2026-08-23)

1. Extensions ship in v1: installer + auth + email. Uploads is a 0.2 fast-follow.
2. `shibumi-server.json`: create runs `ship:setup` at the end when "Deploy now" = Yes; `ship:setup` writes the file.
3. Static path semantics: `create-shibumi` static scaffolds a new minimal static project only. Existing framework projects (Astro/Vite/Next output) onboard via the released `/install/ship` flow. No existing-project mode in the CLI; the static template's build-step prompt covers frameworks added to a fresh project later.

## Risks

1. Site copy drifts ahead of the package again. Mitigation: fixture-backed site gate in workstream 7; command/script table edits require matching fixture changes.
2. Vendored Ship staleness (v21 vs v41 happened). Mitigation: checksum-pinned vendor plus byte-identity CI assertion; release blocks on it.
3. SQLite backup/restore/rollback fails in real deploys, risking user data. Mitigation: concrete numbered contract, versioned pre-deploy hook, end-to-end dogfood before publish.
4. Accidental or hijacked publish. Mitigation: `private: true` until guarded publish commit; trusted publishing; prerelease dist-tag before `latest`; digest verification.
5. Scope creep from the deferred list. Mitigation: explicit non-goals; deferred prototype code deleted from shipped surface, not flagged off.
6. Auth extension ships a security hole (it is the headline command). Mitigation: hardening contract above is release-blocking; auth gets its own adversarial review before workstream 7; installer refuses database-less paths.
