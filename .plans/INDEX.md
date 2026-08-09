# Plans

## Active

- [ ] Publish `shibumi-server` 0.1.0 after final package review.
- [ ] Run the next live dogfood only with the tiny Bun fixture or MCPVault's future lightweight Shibumi app.

## Planned

- [ ] Add durable delivery state across restarts and health-check rollback.

## Recently shipped

- [x] Add bounded webhook replay protection and cheap malformed-header rejection (`2f3197c`).
- [x] Implement pinned `init` and idempotent app registration (`b230c20`).
- [x] Publish the `/server` route, Markdown alternate, and navigation (`488e8fc`).
- [x] Add memory/disk preflight, build cancellation, and resource limits (`cb74f45`).
