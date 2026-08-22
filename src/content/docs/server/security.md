# Security model

Caddy is the only public listener. The webhook service binds to loopback, and a non-root user runs deployments.

## Verify webhook requests

Receiver validates event and delivery headers, enforces payload limit, verifies `X-Hub-Signature-256`, and matches configured repository, branch, and exact SHA. Active and successful delivery UUIDs remain in bounded 24-hour replay cache. Failed deliveries may be retried.

HMAC proves request authenticity. It does not provide volumetric DDoS protection. Rate-limit webhook path in Caddy, firewall, or upstream provider.

## Secrets

Each app receives unique random 32-byte webhook secret stored in mode-`0600` server file. Client configuration excludes it. Explicit `webhook-secret` command exists only for SSH-to-GitHub CLI handoff and emits JSON so client can keep value in memory.

Never commit webhook secrets, application keys, repository credentials, registry credentials, TLS keys, databases, backups, or raw payload logs.

## Limit Caddy privileges

Interactive setup explains privileged change before sudo handles password directly. Root-owned helper accepts schema-validated JSON over stdin, computes controlled paths and loopback upstreams, backs up source, writes atomically, validates full config, reloads, and rolls back on failure.

Helper never accepts arbitrary Caddy text, shell commands, file paths, or upstream hosts.

## Verify image identity

Local Ship builds only committed `HEAD` and labels image with app ID, repository, full revision, Git source tree, and platform. Server fetches webhook commit, resolves tree independently, and verifies labels, exact tag, and platform before Compose starts with `--no-build`.

## Limit resource use

Preflight memory and disk floors protect host before deployment. Client builds keep production CPU and memory free. Fallback server builds retain cancellable deadline. systemd applies memory, swap, CPU, and task ceilings to receiver and direct children. Rootless Podman isolates app containers; Compose should set per-app limits and bind app ports to loopback.

## Known limits

Replay cache is not durable across service restarts. Deployments are not queued. GitHub commit statuses and external registry workflows are future work.
