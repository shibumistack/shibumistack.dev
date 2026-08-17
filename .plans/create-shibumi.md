# create-shibumi plan

## Goal

Make `bun create shibumi@latest` generate small owned projects with one verified local development path and explicit deployment choices. Provider support must deploy locally built output without requiring Git integration or provider-side builds.

## Current examples

### shibumistack.dev: static-capable

Current Bun/Hono process renders files and Markdown at request time, but content is repository-owned and enumerable. It can build all known routes into `dist/`.

Static conversion needs:

- HTML for page, docs, blog, and direct Markdown routes
- copied public assets and immutable ship-client snapshots
- redirect rules for installer endpoints
- 404 page, headers, canonical URLs, and sitemap checks

This is best first dogfood project for static output and provider comparison.

### MCPVault: hybrid

Pages are static-capable. Runtime routes remain:

- newsletter subscribe and unsubscribe through Resend
- npm download statistics
- generated client asset route

MCPVault is not currently a pure static site. It could later use provider functions, but current Bun/Hono deployment is simpler and keeps one runtime model.

### Vibetoolbox: stateful

Generated pages and assets are static-capable. Runtime behavior requires SQLite:

- `POST /api/select`
- `GET /i/:slug`
- hit counters and stored selections

Keep it on Shibumi server until a deliberate D1, KV, or hosted database design earns migration cost.

## Product model

Template and deployment are separate choices.

### Initial templates

1. `minimal`: Bun + Hono server
2. `static`: local build to plain `dist/`
3. `fullstack`: SQLite + Drizzle + Zod, only after minimal and static pass release checks

### Deployment choices

Static template:

- Files only
- Netlify
- Cloudflare
- Vercel
- Shibumi server

Minimal and fullstack templates for first release:

- Shibumi server
- Configure later

Provider functions stay out of first release. This avoids claiming one runtime adapter works identically across incompatible platforms.

## Static contract

Every static project exposes:

```sh
bun dev
bun run build
bun preview
```

`bun run build` writes complete deployable output to `dist/`. Build must not require network access unless project explicitly fetches remote content.

Generated `dist/` includes:

- HTML routes
- fingerprinted or stable static assets
- `404.html`
- sitemap and robots files when configured
- provider-neutral redirect and header manifest used to generate provider files

Provider deployment never changes application source or rebuilds remotely by default.

## Local deployment commands

Keep build and upload visible as separate package scripts:

```sh
bun run build
bun deploy
```

`deploy` uploads existing `dist/`. It validates that output exists and records source commit and build metadata in `dist/.shibumi-build.json`. A stale artifact must fail with an exact next action instead of uploading unrelated output.

Provider CLI stays a direct project dev dependency. Generated config remains small and owned.

## Provider comparison

Dogfood one identical `shibumistack.dev` static artifact on preview domains. Disable provider Git builds. Upload same locally generated `dist/` to each provider.

### Candidates

#### Netlify

Expected strengths:

- direct `dist/` deployment
- simple redirects and headers
- deploy previews and production promotion
- conventional static-host model

Main question: whether CLI site linking and auth remain clear enough for agents and local automation.

#### Cloudflare

Expected strengths:

- existing DNS and edge network fit
- static asset hosting with redirects and headers
- natural future path to Workers for explicit dynamic routes

Main question: whether Pages versus Workers static assets creates avoidable product ambiguity. Pick one current Cloudflare path and document it precisely.

#### Vercel

Expected strengths:

- polished CLI and preview URLs
- straightforward static hosting

Main question: whether prebuilt deployment and generated `.vercel/output` add more provider coupling than value for plain static sites.

### Measurements

Record for each provider:

- first authentication steps
- config files and line count
- direct dependencies added
- commands from build through production URL
- whether provider rebuilds source
- upload and activation duration
- redirect, custom 404, headers, and cache behavior
- preview and rollback behavior
- custom domain and DNS steps
- non-interactive and agent usability
- free-tier limits relevant to small sites
- provider-specific concepts user must learn

### Selection rule

Default static provider should need least provider-specific code while preserving local artifact ownership. Keep other passing adapters available without presenting every provider as equivalent.

Working hypothesis:

1. Netlify is likely simplest pure-static default.
2. Cloudflare is likely best when DNS already lives there or future Workers routes matter.
3. Vercel remains optional if prebuilt upload stays transparent.

Treat this as hypothesis until bakeoff results exist.

## Shibumi server static deployment

### First release

Use existing verified image pipeline:

1. Build static output in local multi-stage Docker build from committed source.
2. Copy `dist/` into a small static runtime image.
3. Upload image before Git push.
4. Verify app, repository, revision, Git tree, tag, and platform.
5. Deploy behind host Caddy with existing health and rollback behavior.

This reuses proven security and rollback boundaries. Runtime container overhead is small but nonzero.

### Later native mode

Consider `deploymentMode: "static"` only after scaffolder release:

```text
committed source -> local dist archive -> verified SSH upload -> atomic release directory -> Caddy file_server
```

Native mode requires bounded archive extraction, exact commit identity, atomic symlink or directory swap, Caddy helper changes, retention, rollback, mode restrictions, and cleanup tests. Do not shortcut those boundaries to remove one small container.

## create-shibumi implementation order

### Phase 1: package foundation

- create public `shibumistack/create-shibumi` repository
- replace npm placeholder package with executable artifact
- use Clack native interface and Shibumi branding
- parse `--template`, `--deploy`, `--yes`, `--no-git`, `--no-install`, `--help`, and `--version`
- use argument arrays, never shell command strings
- initialize Git only when selected; never stage or commit
- create through temporary sibling directory, then rename after success
- generate root `agents.md`

### Phase 2: static vertical slice

- implement `static` template
- implement `dev`, `build`, and `preview`
- emit deterministic `dist/`
- add artifact metadata and stale-output validation
- verify generated project with install, test, typecheck, build, preview, and HTTP checks

### Phase 3: provider bakeoff

- add static build target to `shibumistack.dev`
- deploy same artifact to Netlify, Cloudflare, and Vercel preview domains
- record results in this plan
- select default and minimum adapter contract

### Phase 4: static adapters

- generate only selected provider config and direct CLI dependency
- add dry-run or preview command where provider supports it
- integration-test packed `create-shibumi` tarball for every exposed provider
- verify no remote rebuild occurs in default local-deploy flow

### Phase 5: server templates

- implement `minimal` template with Shibumi server deployment
- add reviewed owned ship client snapshot
- implement `fullstack` only after SQLite migrations, runtime dependencies, Alpine usage, and tests are real

### Phase 6: release

- run `npm pack --dry-run` and inspect package contents
- scaffold every supported template and target from packed tarball
- dogfood one generated static site and one generated server app
- publish `create-shibumi@0.1.0`
- update website status and commands

## Release acceptance

```sh
bun create shibumi@latest example --template static --deploy files --yes
cd example
bun test
bun check
bun run build
bun preview
```

Must produce:

- clean generated source
- no hidden Shibumi runtime dependency
- no automatic Git commit
- deterministic `dist/`
- working direct navigation and 404 behavior
- exact `Next:` action on failure

Provider acceptance adds successful local artifact upload and live preview verification. Shibumi server acceptance adds exact image identity, webhook deployment, loopback binding, health check, retention, and rollback.

## Deferred

- provider functions and databases
- Cloudflare D1 or KV adaptation
- native static mode in shibumi-server
- extension registry and updates
- migration tools
- ##### SPA and AI templates
