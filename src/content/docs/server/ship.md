# Connect project to server

Deployment setup belongs to the project. `bun run ship` uses owned TypeScript source and a commit-safe `shibumi-server.json` file.

## Add ship workflow

From local Git project root:

```sh
curl -fsSL https://shibumistack.dev/install/ship.sh | sh
```

Installer refuses to run outside Git root and never overwrites an existing owned `scripts/ship.ts` change.

## First setup

```sh
bun run ship:setup
```

Use the same `user@server` target or SSH alias you already use. Password login works: enter it once per run, then Shibumi reuses a temporary SSH connection. SSH target remains in local `.git/config`; it is not committed. Setup calls explicit `~/.local/bin/shibumi-server` remotely, exports sanitized project config, and uses GitHub CLI to create the webhook while keeping its secret in memory.

Committed `shibumi-server.json` contains app identity, repository, branch, webhook URL, service, health path, and confirmed server hostname. It excludes secrets, checkout paths, SSH users, aliases, and credentials.

## Ship

```sh
bun run ship
```

Ship checks Git state, runs configured project checks, pushes when commits are ahead, then polls deployment status over existing SSH access. If `HEAD` is already pushed, Shibumi asks the server to redeploy that exact commit. Push stays normal Git; Shibumi does not need GitHub deployment tokens or a public status endpoint.

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
