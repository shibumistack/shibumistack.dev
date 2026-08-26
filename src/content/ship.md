# Ship an existing project

Ship connects a Bun project to `shibumi-server`. Run setup from the local Git root; server registration happens through SSH.

Local requirements are Bun, Git, SSH access, and a Docker-compatible build toolchain. The recommended macOS setup is Colima, Docker CLI, Docker Compose, and Buildx:

```sh
brew install colima docker docker-compose docker-buildx
colima start
docker info
docker compose version
docker buildx version
```

If Ship cannot reach the container engine, follow [Ship troubleshooting](/docs/ship/troubleshooting#docker-engine).

Ship checks these tools before it runs project tests or asks to deploy. When Docker config refers to a missing credential helper, Ship can remove only that reference after writing a mode-`0600` backup. Declining prints the manual repair steps.

## 1. Connect

Run the installer from the project root:

```sh
curl -fsSL https://shibumistack.dev/install/ship.sh | sh
```

The shell downloads reviewed TypeScript to a temporary file. Bun runs it with terminal prompts, then the shell removes the file.

The installer checks the Git root, adds Ship source and package commands, and starts setup. It never replaces an edited `scripts/ship.ts`.

Setup asks two questions, shows what it is about to do, and does all of it on one confirm:

```text
┌  渋み  ship setup
│
◆  SSH target (user@server or alias)
│  alpha
│
◆  App domain
│  quiet-bamboo.dev
│
●  Plan
│  Create private repo bitbonsai/quiet-bamboo, push main
│  Connect to alpha, save target for this project
│  Install or upgrade shibumi-server (sudo password once)
│  Register quiet-bamboo.dev
│  Commit and push deployment files
│  Deploys run on: bun ship
│
◆  Run setup?
│  Yes
│
◇  ...progress receipts...
│
◆  Ship now?
│  Yes
│
└  Live at https://quiet-bamboo.dev
   Deploys run on: bun ship. Prefer push-to-deploy? bun ship:webhook
```

The domain is suggested from the package name or Compose `SITE_URL`, so the question appears only when neither answers it. Every line in the plan names something the single **Run setup?** confirm authorizes, and nothing is written to disk before you accept it. Two things still ask for themselves because the plan cannot speak for them: the GitHub sign-in, which opens a browser, and the Caddy cutover, which moves live traffic.

`bun ship:setup --interactive` restores a gate on every step. `--yes` renders the plan and skips the confirm.

When the project has no GitHub origin, setup offers to create the repository with the GitHub CLI and push it. Repositories are private by default; pass `--public` for a public one. There is no visibility question.

**Ship now?** is the last stop. Enter runs the first deploy in the same session; declining prints the command for later.

SSH targets stay in mode-`0600` `~/.config/shibumi/config.json`, or `$XDG_CONFIG_HOME/shibumi/config.json`. Projects can reuse one saved server or choose among several. Password login works once per run because Ship reuses its temporary SSH connection.

When no tracked Compose file exists, setup can generate a Bun `Dockerfile`, loopback-only `compose.yaml`, and `.dockerignore`. Existing files are never replaced. Review and commit generated files before resuming:

```sh
git add Dockerfile compose.yaml .dockerignore package.json bun.lock scripts/ship.ts
git commit -m "Add deployment configuration"
git push
bun ship:setup
```

Generation requires a `start` package script when it must create a Dockerfile. It adds a build stage only when `package.json` has a `build` script. An existing untracked Compose file must be reviewed and committed instead.

DNS checks can depend on outside changes. Failed setup leaves owned files in place and prints the command needed to resume.

## Push-to-deploy, when you want it

Setup installs no webhook. The default trigger is `bun ship`, which already uploads the exact image and asks the server to deploy that commit, so a webhook adds nothing to it and costs a GitHub sign-in plus an `admin:repo_hook` grant.

Opt in with one command:

```sh
bun ship:webhook
```

```text
┌  渋み  ship webhook
│
●  Push-to-deploy
│  Every push to main deploys quiet-bamboo.dev automatically.
│  The webhook secret travels from server to GitHub CLI through memory only.
│
◆  Install webhook and switch to push-to-deploy?
│  Yes
│
└  git push origin main now deploys. Undo: bun ship:webhook --off
```

It installs the webhook and switches the committed trigger to `github-push` together: the hook goes up first, and if the trigger switch fails, the hook comes back down, so an active hook always means the project deploys on push. Running it again on a project that already has push-to-deploy repairs the delivery.

`bun ship:webhook --off` reverses both halves and returns the project to `bun ship`.

**Cloudflare:** Proxied domains using push-to-deploy require **Full (strict)** SSL/TLS mode. Flexible mode creates an HTTPS redirect loop.

## 2. Review owned files

The installer adds `scripts/ship.ts` and these package entries:

```json
{
  "scripts": {
    "dev": "bun scripts/ship.ts --dev",
    "dev:app": "<original dev command>",
    "ship": "bun scripts/ship.ts",
    "ship:setup": "bun scripts/ship.ts --setup",
    "ship:update": "bun scripts/ship.ts --update",
    "ship:logs": "bun scripts/ship.ts --logs",
    "ship:status": "bun scripts/ship.ts --status",
    "ship:webhook": "bun scripts/ship.ts --webhook"
  },
  "devDependencies": {
    "@clack/prompts": "^1.7.0"
  }
}
```

`bun dev` runs the original development command on the app port from `shibumi-server.json`, or on port `9000` before setup exists. If another process owns that port, Ship shows its PID and command, then asks before sending `SIGTERM`.

`bun ship:setup` refreshes project config. It keeps whatever trigger the project already recorded, so a project set up before `ship:webhook` existed stays on push-to-deploy until `bun ship:webhook --off` says otherwise. Direct Ship uses prebuilt images and needs no GitHub access at all; push-to-deploy uses server builds and is `bun ship:webhook`'s business.

Source: <https://shibumistack.dev/ship/v49.ts>

- Commit `scripts/ship.ts`, `shibumi-server.json`, and package changes.
- Keep SSH targets in local Shibumi config.
- Keep checkout paths, machine config, and webhook secrets on the server.

## 3. Deploy

```sh
bun ship
```

Read current state without deploying:

```sh
bun ship:status
bun ship:logs
```

Before tests and builds, Ship compares its mutable latest pointer with immutable reviewed source. It can use a newer reviewed version for this deployment. After success, it updates tracked `scripts/ship.ts` and leaves the edit unstaged. `-y` accepts the update. Network failure keeps the installed client.

Ship requires a clean tree on the configured branch. It runs project checks, builds committed `HEAD` for the server's Linux platform, and uploads the exact commit tag through SSH. Only then does it push Git. Direct mode asks the server to deploy that commit and follows status. Push-to-deploy waits for GitHub after a new push. Either mode can redeploy an already-pushed `HEAD`.

Ship does not stage or commit files. Dirty work stops with `git status` and a next step. Image labels record repository, app ID, revision, Git tree, and platform. The server verifies every value before starting Compose with `--no-build`.

Docker cache stays on by default. Force every Dockerfile step to run again with:

```sh
bun ship --rebuild
```

Existing domains keep their current Caddy upstream until the first deployment passes health and you approve cutover. Ship uses the latest successful server duration as its next estimate.

Restore the retained image with:

```sh
bun ship --rollback
```

Rollback refuses while deployment is active. It retags the previous image, recreates the service without building, and checks health. Failed restoration puts the current image back. Use `bun ship --rollback -y` only in automation that has already approved the action.

Agents can accept routine prompts with:

```sh
bun ship -y
```

`-y` does not bypass clean-tree checks, tests, image verification, or deployment errors. When setup needs an SSH target, domain, GitHub action, server registration, or Caddy cutover, Ship exits and tells the agent what to ask the user.

Ship is project code. Server trust boundaries and deployment behavior are documented on the [shibumi-server page](https://server.shibumistack.dev).
