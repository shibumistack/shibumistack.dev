# Plans

## Active

- [ ] Publish `shibumi-server` 0.1.4, upgrade Alpha, and preview its first app with `add --dry-run`.
- [ ] Run the next live dogfood only with the tiny Bun fixture or MCPVault's future lightweight Shibumi app.

## Planned

- [ ] Add durable delivery state across restarts and health-check rollback.
- [ ] Add webhook adapters for git hosts beyond GitHub.

## Recently shipped

- [x] Add no-write app previews and non-blocking update warnings for `shibumi-server` 0.1.4 (`6a3d266`).
- [x] Publish `shibumi-server` 0.1.2 with corrected systemd output, absolute-Bun launcher, safe uninstall, canonical repository input, and collision-free dashed domain IDs (`03e078a`).
- [x] Ship the `/server` install dialog, shared terminal simulations, and public bootstrap route (`fba6634`, `a779180`).
- [x] Auto-assign an available local port during interactive app setup (`f24b4f0`).
- [x] Split installation from interactive app registration and add a local launcher (`15a0e7a`).
- [x] Keep the active image plus two previous app images for quick rollbacks (`f68d1c2`).
- [x] Always validate Compose and make app-owned deploy tests optional (`fdcb379`).
- [x] Check host requirements before interactive server setup (`4f913ca`).
