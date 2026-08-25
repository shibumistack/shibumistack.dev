# Deployments

`bun ship` builds one exact committed image locally, uploads it, and asks the server to deploy that commit. Projects that opted into push-to-deploy with `bun ship:webhook` start the same deployment from a signed GitHub push instead.

## Client pipeline

1. Require a clean tree on the configured branch.
2. Fetch Git and reject a branch that is behind or has diverged.
3. Run the project's tests and type checks.
4. Create the build context from the committed `HEAD` with `git archive`.
5. Build for the server's Linux platform with the Docker layer cache.
6. Label the image with the app ID, repository, full commit, Git source tree, and platform.
7. Upload the exact commit-tagged image over SSH.
8. Push Git, or request an exact-commit redeploy when already pushed.
9. Follow server status over SSH.

The upload happens before the Git push, so a webhook can never race a missing image. `bun ship --rebuild` passes `--no-cache` while keeping the exact-commit identity.

## Request checks

Before reading the full payload, the receiver checks the route, method, content type, GitHub event, delivery UUID, and signature shape. It then enforces the body size, verifies the HMAC, parses the payload, and matches the repository, branch, and full commit SHA.

Duplicate verified deliveries are acknowledged without deploying twice. One deployment runs per app; a second request gets `409 Conflict` instead of entering a hidden queue.

## Server pipeline

1. Check free memory and checkout filesystem space.
2. Require a clean managed checkout.
3. Fetch the configured branch and verify the exact webhook SHA.
4. Resolve the Git source tree independently.
5. Validate the Compose configuration.
6. Verify the uploaded tag, app ID, repository, revision, source tree, and platform.
7. Run optional app tests in a temporary container.
8. Capture the currently running image.
9. Start the replacement with `--no-build` and check the loopback health endpoint.
10. Retain the active image plus one rollback image for up to 12 hours, remove legacy and superseded tags, then prune dangling images.

The current app keeps running through validation and the optional tests; cutover happens only after they pass.

## Runtime metadata

Every started app service gets two environment variables without any Compose configuration:

- `SHIBUMI_COMMIT`: the full commit SHA of the running image.
- `SHIBUMI_DEPLOYED_AT`: the deployment timestamp in ISO 8601 format.

Rollback updates `SHIBUMI_COMMIT` to the retained image's commit. Apps can expose this metadata in version or health responses; apps that ignore it are unaffected.

## Failed replacement

If startup or the health check fails, Shibumi retags the previous image under the Compose image name, recreates the service without building, and checks health again. The attempted deployment stays failed in status and history.

## Resource defaults

- Prebuilt available memory: 512 MiB
- Fallback server-build available memory: 2 GiB
- Free disk: 4 GiB
- Fallback build deadline: 10 minutes
- Retained earlier successful images: 1 for up to 12 hours (the active image plus one rollback image)

Images build on the client by default, so running apps never compete with production builds. systemd limits the receiver and fallback build processes; app containers need their own Compose resource limits.
