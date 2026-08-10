# Plans

## Active

- [ ] Replace the `/server` source CTA with an upfront Linux-server install dialog; keep GitHub as the secondary action.
- [ ] Review and commit the accumulated website copy, terminal system, theme metadata, and `/server` changes without touching unrelated `package.json` or `shibumi-cli/blog` work.
- [ ] Publish `shibumi-server` 0.1.0 after final package review.

## Planned

- [ ] Add durable delivery state across restarts and health-check rollback.
- [ ] Run the next live dogfood only with the tiny Bun fixture or MCPVault's future lightweight Shibumi app.

## Recently shipped

- [x] Auto-assign an available local port during interactive app setup (`f24b4f0`).
- [x] Split installation from interactive app registration and add a local launcher (`15a0e7a`).
- [x] Keep the active image plus two previous app images for quick rollbacks (`f68d1c2`).
- [x] Always validate Compose and make app-owned deploy tests optional (`fdcb379`).
- [x] Check host requirements before interactive server setup (`4f913ca`).
