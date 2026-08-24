# Plans

## Active

- [ ] Publish `shibumi-server` 0.10.6 to npm (manual/owner). npm still serves 0.10.4 without `shis env`, so a fresh server install cannot run `bun ship:env` from a 0.2.0-scaffolded project. Ship v45 requires server >= 0.10.6.
- [ ] amd64 dogfood host: run the live VPS leg (setup, ship, env, rollback) on amd64; alpha is arm64-only, CI covers the amd64 container path.
- [ ] Ship v46 batch: fix github-push setup outro ("git push deploys automatically" but the setup commit is local-only; say `git push origin <branch> to deploy`). k3 LOW from the v45 review.
- [ ] Restore kunstfy.com when dogfooding ends: `~/bit/backups/kunstfy.com-2026-08-24/RESTORE.md` + `shis remove kunstfy.com` on alpha.
- [ ] Dogfood static output across Netlify, Cloudflare, and Vercel after VPS-first release (`.plans/create-shibumi.md`).
- [ ] Add protected-branch PR flow to owned ship client, including exact merged-SHA handoff.

## Planned

- [ ] Build full task-oriented shibumi-server documentation beyond `/server` and `/ship`.
- [ ] Add webhook adapters for git hosts beyond GitHub.
- [ ] More Astro templates (landing page etc.) per the blog template contract in `.plans/cli-vps-release.md`.
- [ ] Ship-client trust-model hardening (signed install manifest, pinned digests, POSIX-quoted remote args) — deliberate self-hosted trust decisions, owner call.

## Recently shipped (2026-08-24)

- [x] **create-shibumi 0.2.0 published to npm** (tag `v0.2.0`, registry sha256 `a5b090bd…`). `bun create shibumi@latest` real; cold-verified all four templates + extension cycle from the registry. Closes the site-copy-ahead-of-release gap open since 2026-08-22. Repo dir renamed to `../shibumi-create` (package name stays `create-shibumi`).
- [x] Real VPS dogfood end-to-end on kunstfy.com → alpha: DNS via Cloudflare API, setup, `ship:env`, deploy, auth/uploads/admin live, rollback with env retention, remove + re-add from zero. Caught and fixed: CSRF-behind-TLS-proxy 403s (extensions 1.0.1, `csrfOptions()` pinned to APP_ORIGIN + scheme check), stale env store after `shis remove`, admin console-seed doc impossible in prebuilt containers, same-version source-install init no-op.
- [x] Ship v45: setup ends with "Ship now?" confirm, Enter runs the first deploy. Upgrade path verified live (v44→v45 via `bun ship:update`). Installer `install-v43` pins v45.
- [x] shibumi-server 0.10.6 on alpha (source install): `shis env` hardened per k3 review (rollback re-injects env, reserved keys rejected at set, stdin cap, 0700/0600 + temp-rename, env store deleted on app removal).
- [x] Docs: `/docs/app-env` (environment and secrets) on server site, `ship:env` in command tables, fresh-VPS prep guide (rent → harden → linger → DNS) as an expand on `/docs/install`, Ship-now flow in both `/ship` pages.
- [x] Adversarial reviews: k3 on shis env diff (1 MED + 4 LOW, all fixed), k3 on release tarball + CSRF fix (MED scheme gap fixed), k3 on v45 prompt (ok, 1 LOW queued as v46).
