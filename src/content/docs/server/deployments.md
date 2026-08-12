# Deployments

A signed GitHub push starts one deterministic deployment for one app.

## Request checks

Before reading full payload, receiver checks route, method, content type, GitHub event, delivery UUID, and signature shape. It then enforces body size, verifies HMAC, parses payload, and matches repository, branch, and full commit SHA.

Duplicate verified deliveries are acknowledged without deploying twice. One deployment may run per app; another receives `409 Conflict` instead of entering a hidden queue.

## Pipeline

1. Check free memory and checkout filesystem space.
2. Require a clean managed checkout.
3. Fetch configured branch and verify exact webhook SHA.
4. Reset checkout to that commit.
5. Validate Compose configuration.
6. Build with a deadline.
7. Run optional app tests in a temporary container.
8. Capture currently running image.
9. Start replacement and check loopback health endpoint.
10. Retain active image plus configured rollback images.

Current app remains running through validation, build, and tests. Cutover happens only after those steps pass.

## Failed cutover

If startup or health fails, Shibumi retags the previous running image under its Compose image name, recreates that service without building, and checks restored health. Attempted deployment remains failed in status and history.

## Resource defaults

- Available memory: 2 GiB
- Free disk: 4 GiB
- Build deadline: 10 minutes
- Retained rollback images: 2

Systemd also limits receiver and direct build processes. App containers need their own Compose resource limits.
