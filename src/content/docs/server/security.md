# Security model

Caddy is the only public listener. The webhook service binds to loopback, and a non-root user runs deployments.

## Verify webhook requests

The receiver validates the event and delivery headers, enforces a payload limit, verifies `X-Hub-Signature-256`, and matches the configured repository, branch, and exact SHA. Active and successful delivery UUIDs stay in a bounded 24-hour replay cache. Failed deliveries may be retried.

HMAC proves a request is authentic; it does not absorb volumetric DDoS. Rate-limit the webhook path in Caddy, a firewall, or your upstream provider.

## Secrets

Each app gets a unique random 32-byte webhook secret, stored in a mode-`0600` file on the server. Client configuration never contains it. The `webhook-secret` command exists only for the SSH-to-GitHub CLI handoff and emits JSON so the client can keep the value in memory.

Never commit webhook secrets, application keys, repository credentials, registry credentials, TLS keys, databases, backups, or raw payload logs.

## Limit Caddy privileges

Interactive setup explains each privileged change before sudo asks for the password. A root-owned helper accepts schema-validated JSON over stdin, computes controlled paths and loopback upstreams, backs up the source, writes atomically, validates the full config, reloads, and rolls back on failure.

The helper never accepts raw Caddy text, shell commands, file paths, or upstream hosts.

## Verify image identity

Local Ship builds only the committed `HEAD` and labels the image with the app ID, repository, full revision, Git source tree, and platform. The server fetches the webhook commit, resolves the tree independently, and verifies the labels, exact tag, and platform before Compose starts with `--no-build`.

## Limit resource use

Preflight memory and disk floors protect the host before each deployment. Building on the client keeps production CPU and memory free, and fallback server builds run under a cancellable deadline. systemd caps memory, swap, CPU, and tasks for the receiver and its direct children. Rootless Podman isolates app containers; Compose should set per-app limits and bind app ports to loopback.

## Known limits

The replay cache does not survive service restarts, and deployments are not queued. GitHub commit statuses and external registry workflows are future work.
