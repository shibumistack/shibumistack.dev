# VPS Deploy Guide (Self-hosted)

When a user picks "Self-hosted (Bun + Docker)" during `create-shibumi`, we need
docs that walk them through the full server setup. This is what shibumistack.dev/docs/deploy/vps
should cover.

## Why this matters

Most "deploy to VPS" docs assume you already know Linux admin. Our users might not.
The whole point of shibumi is removing friction, so the deploy docs need to match
that energy. Step by step, why each step matters, copy-pasteable commands.

## Two deploy modes

### Static sites (docs, blogs, landing pages)
Git pull is enough. No build step, no runtime, Caddy serves files directly.
```
webhook/CI → ssh → git pull
```

### Apps (Bun + Hono + SQLite)
Build on the VPS itself. No registry, no external CI dependency. Works with any
git host (GitHub, Codeberg, Gitea, self-hosted).
```
signed webhook → fetch exact commit → validate + build → optional app tests → replace + health check → retain 2 rollback images
```
This is the default. The VPS is the CI. The existing container stays up while
the replacement validates and builds. App-owned tests are optional. Save GitHub Actions/Woodpecker as the upgrade
path for teams that want centrally managed build/test gates before deploy.

## Outline

### 1. Server setup
- Get a VPS (Hetzner, DigitalOcean, Linode, etc.)
- SSH in as root, create a non-root user
- Basic hardening: disable root SSH, key-only auth, firewall (ufw)
- Why: security baseline, don't run as root

### 2. Install Docker/Podman
- Either works. Podman is rootless by default (better security), no daemon.
- Same Dockerfile, same compose.yaml. Commands are interchangeable.
- Why: isolation, reproducible builds, easy rollback

### 3. Install Caddy
- Caddy = auto-HTTPS, zero config TLS
- Why: no certbot, no cron renewal, no nginx config hell

### 4. Clone and run
- `git clone` your repo into `/var/www/yourapp`
- `docker compose up -d --build` (or `podman compose`)
- Why: get it running manually first before automating

### 5. Caddy config
- Point domain to server IP (A record)
- Caddyfile: reverse proxy to app on localhost:9001
- Why: Caddy handles HTTPS termination, app handles logic

### 6. Deploy user + SSH key
- Create a `deploy` user (not your personal user)
- Generate an SSH key pair on the server
- Lock the key to a single command (force-command in authorized_keys)
- Why each security step matters:
  - Dedicated user = blast radius control
  - Force-command = even if key leaks, attacker can only run the deploy command
  - No shell access, no port forwarding, no tunneling

### 7. Auto-deploy
Two options depending on git host:

**Option A: Signed webhook**
A small Bun system service listens on localhost behind Caddy. GitHub is the
first supported payload format; additional git hosts can add explicit signature
and payload adapters later.
```
POST /hooks/github/myapp
  → verify X-Hub-Signature-256 over the raw body
  → match configured repository and branch
  → check free memory and disk
  → fetch the exact commit
  → validate and build under a deadline and resource limits with rootless Podman
  → optionally run app-owned tests in a temporary container
  → replace the old container and health-check the new one
  → retain the previous two successful images for rollbacks and remove older images
```
The webhook secret lives in a mode-0600 environment file or systemd credential,
not in a URL or public JSON config. Commands use argument arrays rather than
shell-interpolated payload values. A second request for an active app receives
`409 Conflict` and is not queued. A resource preflight and bounded build protect
the VPS; app containers also declare Compose limits.

**Option B: CI-triggered SSH (GitHub Actions, Woodpecker, etc.)**
For teams that want test/lint gates before deploy.
- Store SSH key + host + user + path as CI secrets
- CI workflow: ssh into server, trigger the same deploy command
- Upgrade path, not the default

### 8. SQLite data
- Volume/directory outside the repo for the database file
- Backup strategy (cron + rclone to S3/B2)
- Why: git pull + rebuild shouldn't touch your data, backups are non-negotiable

## Git host flexibility

The deploy mechanism (SSH + build on server) is git-host agnostic. Shibumi
doesn't pick a side. The scaffolder asks:

```
   git   Where do you host code?
           ● GitHub
           ○ Codeberg
           ○ Self-hosted Gitea/Forgejo
           ○ None
```

And generates the right webhook config or CI file. The deploy target stays the same.

## Tone

Direct, no fluff. Explain WHY once per step (one sentence), then the commands.
Like a senior friend walking you through it over coffee, not a corporate tutorial.

## Lessons from our own setup

Things we hit deploying shibumistack.dev to Hetzner that users will hit too:

1. authorized_keys must be ONE LINE per key, including force-command prefix
2. `USER` is a reserved env var in GitHub Actions runners, don't use it
3. Git "dubious ownership" error when deploy user pulls a repo owned by another user
   - Fix: `git config --global --add safe.directory /path/to/repo`
4. File permissions: deploy user needs write access (ACL), but shouldn't own the dir
5. sshd is picky about .ssh permissions: dir=700, authorized_keys=600
6. Test SSH connection manually before trusting the CI pipeline

## Milestone: Dogfooding

shibumistack.dev will be converted from static HTML to a shibumi app once
create-shibumi exists. The site becomes the first real project scaffolded
with the tool.

- Bun + Hono serves pages
- SQLite for help docs, search, extension registry
- Alpine for interactive bits (search, code examples, theme toggle)
- Drizzle for schema
- Deployed on Hetzner VPS with container approach
- Every page is a living example of the stack
