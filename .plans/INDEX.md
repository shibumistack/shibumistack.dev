# Plans

## Active

- [ ] Ship VPS-first `create-shibumi` (`.plans/cli-vps-release.md`). Workstreams 1-5 done 2026-08-23 (foundation, public-repo migration + Ship byte-lock, web template, Ship v42 static mode + thin static template, SQLite full-stack) plus the Astro `blog` template and two adversarial security passes (codex, kimi k3). Remaining: ws6 extension installer + auth + email (single-database rule), ws7 packed-tarball verification, ws8 VPS dogfood + release gates. npm publish is manual/owner-only at ws8.
- [ ] Dogfood static output across Netlify, Cloudflare, and Vercel after VPS-first release (`.plans/create-shibumi.md`).
- [ ] Add protected-branch PR flow to owned ship client, including exact merged-SHA handoff.
- [ ] Bootstrap Vibetoolbox and MCPVault owned clients to v28; verify automatic update on next release.

## Planned

- [ ] Ship v43 batch: `.xml` MIME in staticHttpdConf, "Static site" prompt label (see agents.md gotcha).
- [ ] Build full task-oriented shibumi-server documentation beyond `/server` and `/ship`.
- [ ] Add webhook adapters for git hosts beyond GitHub.
- [ ] More Astro templates (landing page etc.) per the blog template contract in `.plans/cli-vps-release.md`.

## Recently shipped

- [x] Astro `blog` template: Nue structure, schema-enforced SEO, RSS/sitemap/OG, llms.txt + markdown alternates; clack 1.7 input fix.
- [x] SQLite full-stack template with owned migration/backup/restore lifecycle, container-verified persistence.
- [x] Ship v42: static output mode (local builds in clean context, scratch+httpd images, SPA Bun server); installer v40 live.
- [x] Bun web template: security headers on every response class, CSP without unsafe-*, pinned self-hosted Alpine CSP build.
- [x] create-shibumi foundation migrated to public repo with sha256-locked Ship vendor and CI acceptance for all templates.
