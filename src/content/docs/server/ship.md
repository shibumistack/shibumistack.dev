# Connect project to server

Deployment setup belongs to the project. `bun run ship` uses owned TypeScript source and a commit-safe `shibumi-server.json` file.

## Add ship workflow

From local Git project root:

```sh
curl -fsSL https://shibumistack.dev/install/ship.sh | sh
```

Installer refuses to run outside Git root and never overwrites an existing owned `scripts/ship.ts` change. It can install or upgrade `shibumi-server`, register the app, and configure GitHub through confirmed SSH. You do not need to run `shis add` first.

When no tracked Compose file exists, setup offers to generate `Dockerfile`, `compose.yaml`, and `.dockerignore` from standard Bun package scripts. Review, commit, and push those files, then resume with `bun run ship:setup`. Existing files are never overwritten.

## First setup

```sh
bun run ship:setup
```

Use the same `user@server` target or SSH alias you already use. Password login works: enter it once per run, then Shibumi reuses a temporary SSH connection. SSH targets stay in mode-`0600` `~/.config/shibumi/config.json` (or `$XDG_CONFIG_HOME/shibumi/config.json`); they are not committed. New projects reuse the only saved server or show a picker when several are saved. Setup calls explicit `~/.local/bin/shibumi-server` remotely, exports sanitized project config, and uses GitHub CLI to create and test the webhook while keeping its secret in memory.

If DNS or webhook delivery is not ready, installer keeps the owned setup files. Complete the printed action, then run `bun run ship:setup` again.

Committed `shibumi-server.json` contains app identity, repository, branch, webhook URL, service, remote app port, health path, and confirmed server hostname. It excludes secrets, checkout paths, SSH users, aliases, and credentials.

## Ship

```sh
bun run ship
```

Ship checks Git state, runs configured project checks, pushes when commits are ahead, then polls deployment status over existing SSH access. If `HEAD` is already pushed, Shibumi asks the server to redeploy that exact commit. Push stays normal Git; Shibumi does not need GitHub deployment tokens or a public status endpoint.

Agents use the same `bun run ship` command. Ship detects non-interactive execution and accepts routine confirmations. Missing SSH, GitHub, domain, server registration, or cutover prerequisites produce a direct request for the agent to ask the user.

## Change setup

```sh
bun run ship:setup
```

Run setup again to refresh project configuration and webhook setup. Change SSH target with `git config --local shibumi.server user@server`.

## Update client

```sh
bun run ship:update
```

Update only `scripts/ship.ts`. Server setup, webhook, SSH target, and `shibumi-server.json` stay unchanged. Unknown local edits are never overwritten.
