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

Ship checks these tools before it runs project tests or asks to deploy. When Docker config refers to a missing credential helper, Ship can remove only that reference after writing a mode-`0600` backup. Declining prints the manual repair steps.

## 1. Connect

Run the installer from the project root:

```sh
curl -fsSL https://shibumistack.dev/install/ship.sh | sh
```

The shell downloads reviewed TypeScript to a temporary file. Bun runs it with terminal prompts, then the shell removes the file.

The installer checks the Git root, adds Ship source and package commands, and starts setup. It never replaces an edited `scripts/ship.ts`.

Setup suggests a domain from the package name or Compose `SITE_URL`. It asks for the SSH target you already use and registers the current branch. Choose **Run bun ship** or **Deploy every GitHub push**. The first option is recommended and records a `ship` trigger in committed `shibumi-server.json`.

SSH targets stay in mode-`0600` `~/.config/shibumi/config.json`, or `$XDG_CONFIG_HOME/shibumi/config.json`. Projects can reuse one saved server or choose among several. Password login works once per run because Ship reuses its temporary SSH connection.

When no tracked Compose file exists, setup can generate a Bun `Dockerfile`, loopback-only `compose.yaml`, and `.dockerignore`. Existing files are never replaced. Review and commit generated files before resuming:

```sh
git add Dockerfile compose.yaml .dockerignore package.json bun.lock scripts/ship.ts
git commit -m "Add deployment configuration"
git push
bun ship:setup
```

Generation requires a `start` package script when it must create a Dockerfile. It adds a build stage only when `package.json` has a `build` script. An existing untracked Compose file must be reviewed and committed instead.

DNS and webhook checks can depend on outside changes. Failed setup leaves owned files in place and prints the command needed to resume.

Automation can choose the trigger directly:

```sh
bun ship:setup --trigger ship
bun ship:setup --trigger github-push
```

**Cloudflare:** Proxied domains using deploy-on-push require **Full (strict)** SSL/TLS mode. Flexible mode creates an HTTPS redirect loop.

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
    "ship:status": "bun scripts/ship.ts --status"
  },
  "devDependencies": {
    "@clack/prompts": "^0.7.0"
  }
}
```

`bun dev` runs the original development command on the app port from `shibumi-server.json`. If another process owns that port, Ship shows its PID and command, then asks before sending `SIGTERM`.

`bun ship:setup` refreshes project config or changes the trigger. Direct Ship mode uses prebuilt images and disables the matching webhook when GitHub CLI is available. Deploy-on-push uses server builds and creates or repairs the webhook. GitHub access is optional for direct shipping.

Source: <https://shibumistack.dev/ship/v43.ts>

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

Ship requires a clean tree on the configured branch. It runs project checks, builds committed `HEAD` for the server's Linux platform, and uploads the exact commit tag through SSH. Only then does it push Git. Direct mode asks the server to deploy that commit and follows status. Deploy-on-push waits for GitHub after a new push. Either mode can redeploy an already-pushed `HEAD`.

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
