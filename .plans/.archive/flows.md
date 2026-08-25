# Flow simplification

STATUS 2026-08-25: steps 0-5 DONE and merged. create-shibumi main @ c5dfcfd (111 tests,
tsc, verify:packed green), shibumi-server main @ 05eda65 (202 tests green). Implemented
by agent team, 59 review findings fixed across 7 rounds, both branches reviewer-approved.
Remaining: step 6 (docs/pages sweep below) and releases. Hard facts for step 6:
- Site MUST publish /ship/v48.ts with sha256 425a8ca3d0b9b8b27660906ea38ec9acb3441a0e0fcf0bd3be191a8e3bd5bea6
  (byte content = shibumi-create scripts/ship.ts vendored client; digest in scripts/ship.lock.json).
- Release create-shibumi 0.3.0 (bump from 0.2.9) and shibumi-server 0.10.7. Owner publishes;
  verify registry digest vs npm pack, then tag (git tag needs -m in shibumi-create).
- After 0.10.7: `shis update` on alpha to get set-repository/PATH fixes live.
- Accepted trade recorded in review: only `.env`/`.env.*` basenames excluded from setup
  commits (app.env-style names commit); .env.example/.sample/.template re-added as examples.

Decided 2026-08-24 evening, walking every prompt flow clack-screen by clack-screen.
Goal: Astro-grade DX. Two real inputs exist in the whole product (SSH target, domain);
everything else must be a default, a plan line, or an opt-in command.

Counts: create 4 stops → 3. Setup 11 stops → 4. Webhook, gh scopes, and trigger
question leave the default path entirely.

## Decisions (owner-confirmed)

1. **Create menu is three items**: full-stack, blog, static. Web template (Hono +
   Alpine + Zod, no DB) is **deleted**, not hidden behind a flag. "Start from?"
   nesting dies; blog is top-level. Label is **"Blog"**, not "Astro blog" (Astro
   may appear in the hint line).
2. **Setup asks two questions** (SSH target, app domain), shows a plan, runs it on
   one confirm. `--interactive` restores per-step gates. Failures stop with the
   existing "Next:" lines.
3. **No GitHub origin is not an error.** Setup offers to create the repo with gh
   and push. **Private by default**, `--public` flag, no visibility question.
4. **No webhook in the default path.** Default trigger is `bun ship`; a webhook
   adds nothing there. This removes the gh sign-in gate, the `admin:repo_hook`
   scope grant, and the webhook confirm from setup.
5. **`bun ship:webhook`** is the opt-in for push-to-deploy: installs the webhook,
   switches trigger to github-push. `bun ship:webhook --off` reverses both.
   Setup outro mentions it once.
6. **Trigger question dies.** Plan line states "Deploys run on: bun ship"; the
   outro points at ship:webhook for the alternative.
7. **`bun ship` day-2 stays strict.** No auto-commit on dirty tree; guards keep
   throwing with "Next:" lines. Deploys stay intentional.
8. **Adopt mode**: `bun create shibumi .` in an existing project vendors the ship
   client instead of scaffolding. Detects build output (astro/vite → dist/,
   eleventy → _site/, next export → out/, root index.html or public/ → that dir),
   select with detected default, free text fallback. SPA stays default-off with a
   `--spa` flag; no question.
9. **shis day-2 fixes** (shibumi-server repo):
   - Installer puts `shis` on non-interactive PATH (symlink /usr/local/bin or
     .profile line). Tonight: `ssh alpha shis` → command not found.
   - `shis remove` outro states what was preserved (checkout, volumes, images)
     and warns about re-adding under a different repo.
   - `shis add` on an origin-mismatched checkout offers "move to .bak and clone
     fresh? Y/n" instead of a dead-end error.
   - New `shis set-repository <app> <repo>`: repoint registration, old checkout
     to .bak, fresh clone. Tonight's kunstfy.com landing swap needed sudo
     remove + re-add + manual mv because this doesn't exist.
   - Ship client's "prebuilt image source does not match repository" error gains
     `Next: ssh <host> shis set-repository <app> <repo>`.

## Target screens

### Create (3 stops)

```
┌  渋み  create shibumi
◆  Project name?                ./quiet-bamboo
◆  What are you shipping?
   ● Bun full-stack app (recommended)   Hono, Alpine, SQLite, migrations, backups
   ○ Blog                               Astro: posts, RSS, sitemap, SEO, llms.txt
   ○ Static site                        any framework's build output
◆  Deploy to a VPS now?         Yes / Later
└  Next: cd quiet-bamboo && bun dev
```

### Setup (4 stops incl. Ship now)

```
┌  渋み  ship setup
◆  SSH target (user@server or alias)     alpha
◆  App domain                            quiet-bamboo.dev
●  Plan
│  Create private repo bitbonsai/quiet-bamboo, push main
│  Connect to alpha, save target for this project
│  Install or upgrade shibumi-server (sudo password once)
│  Register quiet-bamboo.dev
│  Commit and push deployment files
│  Deploys run on: bun ship
◆  Run setup?                            Y/n
◇  ...progress receipts...
◆  Ship now?                             Y/n
└  Live at https://quiet-bamboo.dev
   Deploys: bun ship. Prefer push-to-deploy? bun ship:webhook
```

### ship:webhook (opt-in)

```
$ bun ship:webhook
●  Push-to-deploy: every push to main deploys automatically
◆  Sign in to GitHub now?              (only if unauthed)
◆  Authorize webhook access now?       (only if scope missing)
◆  Install webhook and switch to push-to-deploy?   Y/n
└  git push origin main now deploys. Undo: bun ship:webhook --off
```

### Adopt (existing project)

```
$ bun create shibumi .
●  Existing project found (Astro detected)
◆  Add deploy tooling to this project?   Y/n
◆  Built site directory?                 ● dist/ (detected)  ○ Somewhere else
◇  Vendored scripts/ship.ts, added ship scripts, generated Dockerfile + compose
◆  Deploy to a VPS now?                  Yes / Later
└  Next: bun ship:setup
```

### shis day-2

```
$ shis remove kunstfy.com --yes
◇  Removed kunstfy.com
   Kept: checkout ~/shibumi/kunstfy-com, volumes, images
   Re-adding under a different repo? Delete the checkout first.

$ shis add kunstfy.com --repository github:bitbonsai/kunstfy-landing ...
▲  Checkout ~/shibumi/kunstfy-com has origin bitbonsai/kunstfy-dogfood
◆  Move it to kunstfy-com.bak and clone bitbonsai/kunstfy-landing?   Y/n

$ shis set-repository kunstfy-com github:bitbonsai/kunstfy-landing
◆  Repoint kunstfy-com? Old checkout moves to .bak, fresh clone.   Y/n
```

## Implementation order

0. **Cut 0.2.9 first, unmixed** (already-planned release of v47 vendor + blog
   polish; see INDEX). Flow work lands after, as **0.3.0** (sum 3, golden-legal).
1. create-shibumi: menu to 3, delete web template (src, tests, fixtures, docs),
   "Blog" label.
2. ship.ts (**v48**): webhook out of default setup; `ship:webhook` command with
   `--off`; trigger question removed.
3. ship.ts v48: plan-summary setup; gh repo create (private, `--public`);
   `--interactive` for per-step gates.
4. create-shibumi: adopt mode (`bun create shibumi .`) with output-dir detection.
5. shibumi-server (**0.10.7**): PATH fix, remove outro, add checkout-replace
   prompt, `set-repository`; ship-client error text update.
6. Docs and pages sweep (below), then release.

## Docs and pages to update (step 6)

Every surface showing the old flow lies after this ships:

- **Homepage terminal replay** (shibumistack.dev): shows 4-option create with
  "Bun web app" line. Re-record with 3-option menu and new setup.
- **/docs quickstart + /docs/cli**: create walkthrough, template list, setup
  transcript, webhook section (rewrite as opt-in ship:webhook), trigger docs.
- **/docs/cli/extensions**: check web-template references.
- **/docs/faq**: webhook and template questions.
- **/server and /ship pages**: setup transcript, shis command list
  (set-repository, remove outro), day-2 section.
- **create-shibumi README + template READMEs/agents.md**: script tables gain
  ship:webhook; web template rows die.
- **server.shibumistack.dev docs**: shis reference.
- **Blog**: short release post for 0.3.0 covering the flow rework.
- Copy gate must pass on all of it.

## Open questions

- Adopt mode for Bun server apps: same entry, detect `start` script, reuse
  existing Dockerfile-generation path. In scope for step 4 or a follow-up.
- `bun create shibumi .` name collision: dir name becomes domain inference input;
  verify domainFromProject behavior with adopted package names.
- Webhook-era configs (trigger github-push already set): ship:webhook --off
  must migrate them cleanly; keep validateConfig compatible across v47/v48.
