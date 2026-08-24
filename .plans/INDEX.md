# Plans

## Active

- [ ] **Flow simplification** (`.plans/flows.md`): create menu to 3 templates (web template deleted), 2-question plan-summary setup, webhook out of default path behind new `bun ship:webhook`, adopt mode (`bun create shibumi .`), shis day-2 fixes (`set-repository`, PATH, remove/add outros). Lands as create-shibumi 0.3.0 + ship v48 + shibumi-server 0.10.7, after 0.2.9 ships unmixed. Full docs/pages sweep required, incl. homepage replay re-record.
- [ ] Cut and publish create-shibumi 0.2.9 (0.2.8 on npm matches only its release commit; 16 later commits — Ship v47 vendor, static clack dep fix, favicon/generator meta, static landing restyle, full blog polish (hero mark, view transitions, drafts, Pexels images, ghost pill, unslopped posts) — are unpublished). 0.2.9 sums 11, golden-legal.
- [ ] Restore kunstfy.com when dogfooding ends: `~/bit/backups/kunstfy.com-2026-08-24/RESTORE.md`; `shis remove` each of kunstfy.com, web/blog/static.kunstfy.com on alpha; delete the four CF A records; delete private bitbonsai/kunstfy-* repos if unwanted.
- [ ] amd64 dogfood host: run the live VPS leg (setup, ship, env, rollback) on amd64; alpha is arm64-only, CI covers the amd64 container path.
- [ ] Full-stack path never re-verified from npm on a real domain after the local dir was deleted mid-test: counter-survives-rollback on a deployed 0.2.8+ scaffold is still unproven end-to-end (blog/static/web legs all passed live).
- [ ] Dogfood static output across Netlify, Cloudflare, and Vercel after VPS-first release (`.plans/create-shibumi.md`).
- [ ] Add protected-branch PR flow to owned ship client, including exact merged-SHA handoff.

## Planned

- [ ] Build full task-oriented shibumi-server documentation beyond `/server` and `/ship`.
- [ ] Add webhook adapters for git hosts beyond GitHub.
- [ ] More Astro templates (landing page etc.) per the blog template contract in `.plans/cli-vps-release.md`.
- [ ] Ship-client trust-model hardening (signed install manifest, pinned digests, POSIX-quoted remote args) — deliberate self-hosted trust decisions, owner call.

## Recently shipped (2026-08-24, second wave)

- [x] **shibumi-server 0.10.6 on npm**; install chain site → v0.10.6 install.sh → npm verified. `shis update` on alpha agrees with source install.
- [x] **create-shibumi 0.2.1–0.2.8 published** through the day (branded installer, `shi` alias, clean test output, Ship v46 `bun dev` pre-setup). npm 0.2.8 == commit 1bdb699 only; later polish awaits 0.2.9.
- [x] **Ship v47 live**: `--no-spa` (pinned in blog/static), commit-and-continue after deploy-file generation, generated compose drops `init: true` (catatonit exit-125 trap found by the blog deploy).
- [x] **Template dogfood on real domains**: blog.kunstfy.com (first real static pipeline deploy; RSS/sitemap `application/xml` proven, llms.txt, md alternates, clean URLs), static.kunstfy.com, web.kunstfy.com. Findings fixed: static template missing clack dep, generated-compose init, SPA question on preconfigured setups.
- [x] **Design pass everywhere**: kozo paper background site-only (canonical shibumi.css, pure-blur header), noise texture removed, cache-hash asset links on both sites, `/extensions` folded into docs as `/docs/cli/extensions` with `bun shi` canonical, FAQ page at `/docs/faq`, docs sidebar sans labels, rotate-cw replay icons.

Archived plans: .plans/.archive/
