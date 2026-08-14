# Ship an existing project

Connect any Bun project to `shibumi-server` from your local project root. One installer handles server registration through SSH, GitHub webhook setup, and owned project source. You do not need to add the app from a server shell first.

Requirements: Bun, Git, GitHub CLI, and SSH access to your Linux server.

## 1. Connect

Run this from your project root. The shell downloads reviewed TypeScript to a temporary file, Bun runs it with terminal prompts, then the file is removed.

```sh
curl -fsSL https://shibumistack.dev/install/ship.sh | sh
```

The installer validates your Git project, adds owned ship source and package commands, then connects setup. Existing edits to `scripts/ship.ts` are never overwritten.

Setup suggests the domain from your package name or Compose `SITE_URL`, asks for your normal `user@server` target or SSH alias, and registers the current branch. It installs or upgrades `shibumi-server` through confirmed SSH when needed. Password login works: enter it once per run, then Shibumi reuses that temporary SSH connection.

DNS and webhook checks can depend on changes outside Shibumi. If either is not ready, setup keeps the owned files and prints the exact action to complete. Resume without reinstalling:

```sh
bun run ship:setup
```

**Cloudflare:** For proxied domains, set SSL/TLS encryption mode to **Full (strict)**. Flexible mode sends HTTP to Caddy, causing an HTTPS redirect loop. GitHub reports `stopped after 10 redirects`, and webhook setup cannot finish.

## 2. Review owned source

Your project receives `scripts/ship.ts` and these package keys:

```json
{
  "scripts": {
    "ship": "bun scripts/ship.ts",
    "ship:setup": "bun scripts/ship.ts --setup"
  },
  "devDependencies": {
    "@clack/prompts": "^0.7.0"
  }
}
```

Run `bun run ship:setup` later to refresh project configuration and webhook setup. Run `bun run ship:update` to update only the owned ship client, without changing server setup, webhooks, or `shibumi-server.json`.

Source: <https://shibumistack.dev/ship/v20.ts>

- Committed: `scripts/ship.ts`, `shibumi-server.json`, and package changes.
- Local only: SSH target in `.git/config`.
- Server only: checkout path, machine config, and webhook secret.

## 3. Deploy

```sh
bun run ship
```

Ship requires a clean tree on the configured branch. It runs your project test and check scripts, verifies origin state, pushes when commits are ahead, then follows deployment status over SSH. When `HEAD` is already pushed, it redeploys that exact commit instead of stopping.

Existing domains keep their current Caddy upstream until the first Shibumi deployment passes health checks and you approve cutover.

Agents use the same command:

```sh
bun run ship
```

Ship detects agent and non-interactive execution, accepts routine confirmations, and uses inferred setup. When SSH, GitHub, domain, server registration, or existing-domain cutover needs user input, it exits with a direct request for the agent to ask the user. First installation assumes yes for routine setup confirmations.

The ship workflow is project code, not a hidden deployment runtime. Server behavior and security boundaries are documented on the [shibumi-server page](/server.md).
