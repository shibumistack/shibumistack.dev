# Ship an existing project

Connect any Bun project to `shibumi-server` from your local project root. One installer handles server registration through SSH, GitHub webhook setup, and owned project source. You do not need to add the app from a server shell first.

Requirements: Bun, Git, Docker Desktop or compatible Docker Engine, GitHub CLI, and SSH access to your Linux server.

## 1. Connect

Run this from your project root. The shell downloads reviewed TypeScript to a temporary file, Bun runs it with terminal prompts, then the file is removed.

```sh
curl -fsSL https://shibumistack.dev/install/ship.sh | sh
```

The installer validates your Git project, adds owned ship source and package commands, then connects setup. Existing edits to `scripts/ship.ts` are never overwritten.

Setup suggests the domain from your package name or Compose `SITE_URL`, asks once for your normal `user@server` target or SSH alias, and registers the current branch. It stores that target by resolved server hostname in mode-`0600` `~/.config/shibumi/config.json` (or `$XDG_CONFIG_HOME/shibumi/config.json`) and shows which target it uses. New projects reuse the only saved server automatically or show a server picker when several are saved. It installs or upgrades `shibumi-server` through confirmed SSH when needed. Password login works: enter it once per run, then Shibumi reuses that temporary SSH connection.

If no tracked Compose file exists, setup offers to generate a bounded Bun `Dockerfile`, loopback-only `compose.yaml`, and secret-safe `.dockerignore`. It never overwrites existing files. Review the generated files, verify the app binds to `0.0.0.0` and reads `PORT`, then commit and push them before resuming:

```sh
git add Dockerfile compose.yaml .dockerignore package.json bun.lock scripts/ship.ts
git commit -m "Add deployment configuration"
git push
bun ship:setup
```

Generation requires a `start` package script when no `Dockerfile` exists. A `build` step is included only when the package has a `build` script. Existing untracked Compose files must be reviewed and committed instead.

DNS and webhook checks can depend on changes outside Shibumi. If either is not ready, setup keeps the owned files and prints the exact action to complete. Resume without reinstalling with `bun ship:setup`.

**Cloudflare:** For proxied domains, set SSL/TLS encryption mode to **Full (strict)**. Flexible mode sends HTTP to Caddy, causing an HTTPS redirect loop. GitHub reports `stopped after 10 redirects`, and webhook setup cannot finish.

## 2. Review owned source

Your project receives `scripts/ship.ts` and these package keys:

```json
{
  "scripts": {
    "dev": "bun scripts/ship.ts --dev",
    "dev:app": "<original dev command>",
    "ship": "bun scripts/ship.ts",
    "ship:setup": "bun scripts/ship.ts --setup",
    "ship:logs": "bun scripts/ship.ts --logs"
  },
  "devDependencies": {
    "@clack/prompts": "^0.7.0"
  }
}
```

`bun dev` uses the remote app port from `shibumi-server.json`, preserving the original dev command as `dev:app`. If that loopback port is occupied, it shows the owning process and asks before sending `SIGTERM`.

Run `bun ship:setup` later to refresh project configuration and webhook setup. Run `bun ship:update` to update only the owned ship client, without changing server setup, webhooks, or `shibumi-server.json`.

Source: <https://shibumistack.dev/ship/v23.ts>

- Committed: `scripts/ship.ts`, `shibumi-server.json`, and package changes.
- Local only: SSH targets in `~/.config/shibumi/config.json`.
- Server only: checkout path, machine config, and webhook secret.

## 3. Deploy

```sh
bun ship
```

`bun ship:logs` prints the latest bounded deployment log from the server.

Ship requires a clean tree on the configured branch. It runs project tests and checks, creates a build context from committed `HEAD`, builds for the server's Linux architecture, and uploads the exact commit-tagged image through SSH. Only then does it push Git and follow deployment status. When `HEAD` is already pushed, it uploads and redeploys that exact commit.

Uncommitted work fails with `git status` output and a concrete next step. Ship never stages or commits files for you. The server verifies the image tag and platform, skips its own build, and starts with `--no-build` only after the signed webhook matches the same commit.

Existing domains keep their current Caddy upstream until the first Shibumi deployment passes health checks and you approve cutover. Ship uses the latest successful server deployment duration as the next ETA, then reports total elapsed client time.

Restore the one previous image retained by the server:

```sh
bun ship --rollback
```

Rollback confirms locally, refuses while a deployment is active, retags the retained image, recreates the service without a build, and checks health. If restoration fails, the current image is restored. Use `bun ship --rollback -y` only for explicit automation.

Agents can run without prompts:

```sh
bun ship -y
```

`-y` is the short form of `--yes`. Bun forwards arguments after the script name, so no `--` separator is needed. This accepts routine confirmations but keeps clean-tree checks, tests, image verification, and deployment failures intact.

Ship detects agent and non-interactive execution and uses inferred setup. When SSH, GitHub, domain, server registration, or existing-domain cutover needs user input, it exits with a direct request for the agent to ask the user. First installation assumes yes for routine setup confirmations.

The ship workflow is project code, not a hidden deployment runtime. Server behavior and security boundaries are documented on the [shibumi-server page](/server.md).
