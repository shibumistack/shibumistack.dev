# Plans

## Active

- [ ] Design pinned `bunx shibumi-server init` installation and app registration.

## Planned

- [ ] Add durable delivery state and health-check rollback.
- [ ] Test only with the tiny Bun fixture or MCPVault's future lightweight Shibumi app; never build the current Astro app on a small production VPS.

## Recently shipped

- [x] Publish the `/server` page, Markdown alternate, navigation, metadata, and synchronized deploy copy (`488e8fc`).
- [x] Add memory/disk preflight, build cancellation, and resource limits to `shibumi-server` (`cb74f45`).
- [x] Implement signed GitHub webhook deployment core in `shibumi-server` (`751260b`).
