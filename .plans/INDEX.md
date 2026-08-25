# Plans

## Active

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

- [x] **Site polish wave + releases (2026-08-25 morning)**: create-shibumi 0.3.2 and shibumi-server 0.10.8 published, digest-verified, tagged; alpha on 0.10.8. Homepage refactored (dek cut, extensions story block, template links, bottom-aligned hero command, hover definition box), docs intro dedup + sitewide unslop, template pages with live screenshots (`/docs/cli/templates/*`), homelab page (`/docs/server/homelab`, tunnel-first: Cloudflare Tunnel + Tailscale, port-forwarding not recommended), green Released pills, server docs rewritten to normal English, "vendored"/"Astro blog" purged from user copy. Plan archived: `.plans/.archive/flows.md`.
- [x] **Flow rework released** (2026-08-25 morning): create-shibumi 0.3.0 + shibumi-server 0.10.8 on npm, both digest-verified and tagged (0.10.7 skipped: digit-sum gate). Site docs sweep live (3-item menu everywhere, plan-summary setup, ship:webhook opt-in, adopt mode, replay re-recorded, blog post, rebuilt copy gate), /ship/v48.ts + latest.ts + install-v46 live and byte-verified, shibumiServerVersion pinned 0.10.8, alpha updated to 0.10.8 (set-repository live).
- [x] **Flow simplification code merged** (2026-08-25 00:xx): create-shibumi main c5dfcfd (3-item menu, web template deleted, ship v48: webhook opt-in via `bun ship:webhook`, plan-summary setup, gh repo create private-default, adopt mode), shibumi-server main 05eda65 (`shis set-repository`, PATH symlink install, remove/add outros, non-TTY guards). Agent team + adversarial review, 59 findings fixed.
- [x] **kunstfy.com landing restored on alpha** as static shibumi app (repo bitbonsai/kunstfy-landing, app kunstfy-com); old full-stack checkout parked at `~/shibumi/kunstfy-com-fullstack-bak`, code intact in bitbonsai/kunstfy-dogfood.
- [x] **create-shibumi 0.2.9 published** (release commit fcfeb2f, tag v0.2.9): Ship v47 vendor, static clack dep fix, favicon/generator meta, static landing restyle, full blog polish. Registry integrity verified against local npm pack (shasum fc4d04d5).


Archived plans: .plans/.archive/
