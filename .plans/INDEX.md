# Plans

## Active

- [ ] Ship VPS-first `create-shibumi` with static, Bun web, and SQLite full-stack starts (`.plans/cli-vps-release.md`). Workstreams 1 (foundation), 2 (public-repo migration + Ship byte-lock), 3 (Bun web template), 4 (Ship v42 static mode + thin static template), and 5 (SQLite full-stack template with migration/backup/restore lifecycle, all codex-reviewed and container-verified) done 2026-08-23; next: extension installer + auth + email (ws6). Source in `../create-shibumi`; npm publish stays manual/owner-only at ws7.
- [ ] Dogfood static output across Netlify, Cloudflare, and Vercel after VPS-first release (`.plans/create-shibumi.md`).
- [ ] Add protected-branch PR flow to owned ship client, including exact merged-SHA handoff.
- [ ] Bootstrap Vibetoolbox and MCPVault owned clients to v28; verify automatic update on next release.

## Planned

- [ ] Build full task-oriented shibumi-server documentation beyond `/server` and `/ship`.
- [ ] Add webhook adapters for git hosts beyond GitHub.

## Recently shipped

- [x] Redesign homepage as dev-friend story prose with eyebrow-rail layout; deployed to production.
- [x] Extract canonical `public/shibumi.css` shared by all three sites (vendored + sync scripts in server/forms repos).
- [x] Rework server.shibumistack.dev: story sections, tabbed first-run/ship terminals from real CLI output, expanded provider table.
- [x] Migrate `shibumistack.dev` from legacy VPS builds to loopback-only Shibumi prebuilt deployment.
- [x] Align website Clack simulations and docs with local image builds, identity verification, and self-updates.
