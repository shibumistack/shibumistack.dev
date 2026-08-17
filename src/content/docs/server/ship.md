# Connect project to server

Deployment setup belongs to the project. `bun ship` uses owned TypeScript source and a commit-safe `shibumi-server.json` file.

## Add ship workflow

From local Git project root:

```sh
curl -fsSL https://shibumistack.dev/install/ship.sh | sh
```

Installer refuses to run outside Git root and never overwrites an existing owned `scripts/ship.ts` change. It can install or upgrade `shibumi-server`, register the app, and configure GitHub through confirmed SSH. You do not need to run `shis add` first.

When no tracked Compose file exists, setup offers to generate `Dockerfile`, `compose.yaml`, and `.dockerignore` from standard Bun package scripts. Review, commit, and push those files, then resume with `bun ship:setup`. Existing files are never overwritten.

## First setup

```sh
bun ship:setup
```

Use the same `user@server` target or SSH alias you already use. Password login works: enter it once per run, then Shibumi reuses a temporary SSH connection. SSH targets stay in mode-`0600` `~/.config/shibumi/config.json` (or `$XDG_CONFIG_HOME/shibumi/config.json`); they are not committed. New projects reuse the only saved server or show a picker when several are saved. Setup calls explicit `~/.local/bin/shibumi-server` remotely, exports sanitized project config, and uses GitHub CLI to create and test the webhook while keeping its secret in memory.

If DNS or webhook delivery is not ready, installer keeps the owned setup files. Complete the printed action, then run `bun ship:setup` again.

Committed `shibumi-server.json` contains app identity, repository, branch, webhook URL, service, remote app port, health path, and confirmed server hostname. It excludes secrets, checkout paths, SSH users, aliases, and credentials.

## Ship

```sh
bun ship
```

Ship checks Git state and runs configured project checks. It creates build context from committed `HEAD`, builds for server's Linux platform, labels image with repository, app, commit, Git tree, and platform identity, then uploads it through SSH. Only after upload succeeds does it push Git and poll deployment status. If `HEAD` is already pushed, Shibumi uploads and redeploys that exact commit. Push stays normal Git; Shibumi needs no GitHub deployment token or public status endpoint.

Docker layer cache stays enabled. Use `bun ship --rebuild` for a no-cache build. Git submodules are currently refused because `git archive` cannot prove their nested content identity.

Agents use `bun ship -y` for prompt-free routine confirmation. Clean-tree checks, project checks, image verification, and failures remain active. Missing SSH, GitHub, domain, server registration, or cutover prerequisites produce a direct request for agent to ask user.

## Change setup

```sh
bun ship:setup
```

Run setup again to refresh project configuration and webhook setup. Change SSH target with `git config --local shibumi.server user@server`.

## Update client

Before each normal deployment, Ship checks mutable latest pointer against immutable reviewed source. When newer source exists, it offers to run that version immediately. After successful deployment it updates tracked `scripts/ship.ts`, leaving change unstaged for review and commit. `bun ship -y` accepts update automatically.

Network failures keep current client. Unknown local edits are never overwritten. Server setup, webhook, SSH target, and `shibumi-server.json` stay unchanged.

Manual update remains available:

```sh
bun ship:update
```
