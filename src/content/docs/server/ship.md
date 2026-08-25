# Connect project to server

The project owns deployment setup. `bun ship` runs tracked TypeScript and reads commit-safe `shibumi-server.json`.

## Add Ship to the project

From local Git project root:

```sh
curl -fsSL https://shibumistack.dev/install/ship.sh | sh
```

Installer refuses to run outside Git root and never overwrites an existing owned `scripts/ship.ts` change. It can install or upgrade `shibumi-server`, register the app, and configure deployment through confirmed SSH. You do not need to run `shis add` first.

When no tracked Compose file exists, setup offers to generate `Dockerfile`, `compose.yaml`, and `.dockerignore` from standard Bun package scripts. Review, commit, and push those files, then resume with `bun ship:setup`. Existing files are never overwritten.

## Connect to the server

```sh
bun ship:setup
```

Use the same `user@server` target or SSH alias you already use. Password login works: enter it once per run, then Shibumi reuses a temporary SSH connection. SSH targets stay in mode-`0600` `~/.config/shibumi/config.json` (or `$XDG_CONFIG_HOME/shibumi/config.json`); they are not committed. New projects reuse the only saved server or show a picker when several are saved. Setup calls explicit `~/.local/bin/shibumi-server` remotely and exports sanitized project config.

Setup asks for the SSH target and the app domain, then renders a plan and runs every line of it on one **Run setup?** confirm:

```text
●  Plan
│  Create private repo bitbonsai/quiet-bamboo, push main
│  Connect to alpha, save target for this project
│  Install or upgrade shibumi-server (sudo password once)
│  Register quiet-bamboo.dev
│  Commit and push deployment files
│  Deploys run on: bun ship
```

Nothing is written before that confirm. The GitHub sign-in and the Caddy cutover are the two exceptions that still ask for themselves, because one opens a browser and the other moves live traffic. `bun ship:setup --interactive` restores a gate on every step, and `--yes` renders the plan without asking.

A missing GitHub origin is not a failure. Setup offers to create the repository with the GitHub CLI and push it, private unless `--public` is passed. There is no visibility question.

Deployments run on `bun ship`, which uploads the exact image and asks the server to deploy that commit. Setup installs no webhook, so it needs no GitHub sign-in and no `admin:repo_hook` grant. `bun ship:webhook` opts into push-to-deploy when you want it, and `bun ship:webhook --off` reverses both the hook and the trigger.

Committed `shibumi-server.json` contains deployment trigger, app identity, repository, branch, webhook URL, service, remote app port, health path, and confirmed server hostname. It excludes secrets, checkout paths, SSH users, aliases, and credentials.

## Ship

Local prebuilt shipping requires Colima with Docker CLI, Docker Compose, and Buildx. Recommended macOS setup:

```sh
brew install colima docker docker-compose docker-buildx
colima start
docker info
docker compose version
docker buildx version
```

```sh
bun ship
```

Ship checks local build tools before project tests or confirmation, then checks Git state and runs configured project checks. If Docker config names an unavailable credential helper, Ship offers to remove only stale references after writing a mode-`0600` backup. Declining or running non-interactively prints manual recovery steps. It creates build context from committed `HEAD`, builds for server's Linux platform, labels image with repository, app, commit, Git tree, and platform identity, then uploads it through SSH. Only after upload succeeds does it push Git. The default trigger asks the server over SSH to deploy exact commit, then polls status. Push-to-deploy waits for GitHub after a new push. If `HEAD` is already pushed, either mode redeploys it directly.

Docker layer cache stays enabled. Use `bun ship --rebuild` for a no-cache build. Git submodules are currently refused because `git archive` cannot prove their nested content identity.

Agents use `bun ship -y` for prompt-free routine confirmation. Clean-tree checks, project checks, image verification, and failures remain active. Missing SSH, GitHub, domain, server registration, or cutover prerequisites produce a direct request for agent to ask user.

## Change the setup

```sh
bun ship:setup
```

Run setup again to refresh project configuration. It keeps whatever trigger the project already recorded, so a project configured before `ship:webhook` existed stays on push-to-deploy until you turn it off. Change the trigger with the dedicated command:

```sh
bun ship:webhook        # switch to push-to-deploy
bun ship:webhook --off  # back to bun ship
```

Change SSH target with `git config --local shibumi.server user@server`.

## Update the Ship client

Before each normal deployment, Ship checks mutable latest pointer against immutable reviewed source. When newer source exists, it offers to run that version immediately. After successful deployment it updates tracked `scripts/ship.ts`, leaving change unstaged for review and commit. `bun ship -y` accepts update automatically.

Network failures keep current client. Unknown local edits are never overwritten. Server setup, webhook, SSH target, and `shibumi-server.json` stay unchanged.

Manual update remains available:

```sh
bun ship:update
```
