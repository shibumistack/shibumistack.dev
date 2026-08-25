# Deployments

`bun ship` builds one exact committed image locally, uploads it, and asks the server to deploy that commit. Projects that opted into push-to-deploy with `bun ship:webhook` start the same deployment from a signed GitHub push instead.

## Client pipeline

1. Require a clean tree on configured branch.
2. Fetch Git and reject a behind or diverged branch.
3. Run project tests and type checks.
4. Create build context from committed `HEAD` with `git archive`.
5. Build for server's Linux platform with Docker layer cache.
6. Label image with app ID, repository, full commit, Git source tree, and platform.
7. Upload exact commit-tagged image through SSH.
8. Push Git, or request exact-commit redeploy when already pushed.
9. Follow server status over SSH.

Upload happens before Git push, so webhook cannot race a missing image. `bun ship --rebuild` passes `--no-cache` while retaining exact-commit identity.

## Request checks

Before reading full payload, receiver checks route, method, content type, GitHub event, delivery UUID, and signature shape. It then enforces body size, verifies HMAC, parses payload, and matches repository, branch, and full commit SHA.

Duplicate verified deliveries are acknowledged without deploying twice. One deployment may run per app; another receives `409 Conflict` instead of entering a hidden queue.

## Server pipeline

1. Check free memory and checkout filesystem space.
2. Require clean managed checkout.
3. Fetch configured branch and verify exact webhook SHA.
4. Resolve Git source tree independently.
5. Validate Compose configuration.
6. Verify uploaded tag, app ID, repository, revision, source tree, and platform.
7. Run optional app tests in a temporary container.
8. Capture currently running image.
9. Start replacement with `--no-build` and check loopback health endpoint.
10. Retain active image plus one rollback image for up to 12 hours, remove legacy and superseded tags, then prune dangling images.

Current app remains running through validation and optional tests. Cutover happens only after those steps pass.

## Runtime metadata

Every started app service receives two environment variables without Compose configuration:

- `SHIBUMI_COMMIT`: full commit SHA for running image.
- `SHIBUMI_DEPLOYED_AT`: deployment timestamp in ISO 8601 format.

Rollback updates `SHIBUMI_COMMIT` to retained image's commit. Apps can expose this metadata in version or health responses while apps that ignore it remain unchanged.

## Failed replacement

If startup or health fails, Shibumi retags previous running image under Compose image name, recreates service without building, and checks restored health. Attempted deployment remains failed in status and history.

## Resource defaults

- Prebuilt available memory: 512 MiB
- Fallback server-build available memory: 2 GiB
- Free disk: 4 GiB
- Fallback build deadline: 10 minutes
- Retained earlier successful images: 1 for up to 12 hours (active plus one rollback image)

Images build on client by default, so running apps do not compete with production builds. Systemd limits receiver and fallback build processes. App containers need their own Compose resource limits.
