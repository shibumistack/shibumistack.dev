# Plans

## Active

- [ ] Ship VPS-first `create-shibumi` (`.plans/cli-vps-release.md`). ws1-8 done. create-shibumi @ 0.2.0 with four extensions (auth, email, uploads, admin), per-extension YAML config, `shibumi update`. Remaining: npm publish (manual/owner, still `private:true`, `../create-shibumi/PUBLISHING.md`) and a real VPS dogfood matrix (needs Cloudflare DNS + an amd64 host; alpha is arm64-only).
- [ ] Deploy updated `shibumi-server` to alpha so `shis env` (per-app secrets) exists there, then dogfood `bun ship:env` set→deploy→auth/admin working in prod. This is the gate on the secrets feature being real; also the first true VPS deploy of a generated app.
- [ ] Fold pending adversarial review of the shibumi-server `shis env` diff (codex/kimi unavailable this session — timed out; manual review found no HIGH).
- [ ] Dogfood static output across Netlify, Cloudflare, and Vercel after VPS-first release (`.plans/create-shibumi.md`).
- [ ] Add protected-branch PR flow to owned ship client, including exact merged-SHA handoff.

## Planned

- [ ] Build full task-oriented shibumi-server documentation beyond `/server` and `/ship`.
- [ ] Add webhook adapters for git hosts beyond GitHub.
- [ ] More Astro templates (landing page etc.) per the blog template contract in `.plans/cli-vps-release.md`.

## Recently shipped

- [x] Secrets/env: `shis env` (server per-app store, stdin values, injected at deploy) + `bun ship:env set/import/list/rm` (Ship v44) + config-in-YAML split. Built across all three repos, unit-tested; deploy+dogfood pending.
- [x] create-shibumi 0.2.0: per-extension versions, `shibumi update` (re-vendor + drift), per-extension `src/config/*.yaml` (bundled, boot-validated).
- [x] Extensions: installer (add/remove/list/update, dependsOn), auth, email, uploads, admin — each codex + kimi reviewed, container-dogfooded.
- [x] Packed verification (`verify:packed`), site copy gate (`verify:copy`), Bun floor 1.4.0, Ship v43/v44.
- [x] Astro `blog` template; SQLite full-stack lifecycle; Ship v42 static mode; Bun web template.

Archived plans: .plans/.archive/
