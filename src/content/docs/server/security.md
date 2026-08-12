# Security model

`shibumi-server` keeps public surface small: Caddy receives HTTPS, webhook service listens only on loopback, and deployment runs as rootless user.

## Webhook trust boundary

Receiver validates event and delivery headers, enforces payload limit, verifies `X-Hub-Signature-256`, and matches configured repository, branch, and exact SHA. Active and successful delivery UUIDs remain in bounded 24-hour replay cache. Failed deliveries may be retried.

HMAC proves request authenticity. It does not provide volumetric DDoS protection. Rate-limit webhook path in Caddy, firewall, or upstream provider.

## Secrets

Each app receives unique random 32-byte webhook secret stored in mode-`0600` server file. Client configuration excludes it. Explicit `webhook-secret` command exists only for SSH-to-GitHub CLI handoff and emits JSON so client can keep value in memory.

Never commit webhook secrets, application keys, repository credentials, registry credentials, TLS keys, databases, backups, or raw payload logs.

## Caddy privilege

Interactive setup explains privileged change before sudo handles password directly. Root-owned helper accepts schema-validated JSON over stdin, computes controlled paths and loopback upstreams, backs up source, writes atomically, validates full config, reloads, and rolls back on failure.

Helper never accepts arbitrary Caddy text, shell commands, file paths, or upstream hosts.

## Resource isolation

Preflight memory and disk floors protect host before build. Build deadline kills process group. systemd applies memory, swap, CPU, and task ceilings to receiver and direct children. Rootless Podman isolates app containers; Compose should set per-app limits.

## Remaining limits

Replay cache is not durable across service restarts. Deployments are not queued. GitHub commit statuses and external registry workflows are future work.
