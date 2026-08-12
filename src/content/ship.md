# Ship an existing project

Connect any Bun project to `shibumi-server` with one small script that lives in your repository. Projects created by Shibumi already include these files. For an existing project, add the same owned source once, review it, and commit it.

Requirements: Bun, Git, GitHub CLI, and SSH access to your server.

## 1. Connect

Run this from your project root. The shell downloads reviewed TypeScript to a temporary file, Bun runs it with terminal prompts, then the file is removed.

```sh
curl -fsSL https://shibumistack.dev/install/ship.sh | sh
```

The installer validates your Git project, adds owned ship source and package commands, then connects setup. Existing edits to `scripts/ship.ts` are never overwritten.

Setup suggests the domain from your package name or Compose `SITE_URL`. Use your normal `user@server` target or SSH alias. Password login works: enter it once per run, then Shibumi reuses that temporary SSH connection.

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

Run `bun run ship:setup` later to refresh project configuration and webhook setup.

Source: <https://shibumistack.dev/ship/v11.ts>

- Committed: `scripts/ship.ts`, `shibumi-server.json`, and package changes.
- Local only: SSH target in `.git/config`.
- Server only: checkout path, machine config, and webhook secret.

## 3. Deploy

```sh
bun run ship
```

Ship requires a clean tree on the configured branch. It runs your project test and check scripts, verifies origin state, pushes one commit, then follows deployment status over SSH.

Existing domains keep their current Caddy upstream until the first Shibumi deployment passes health checks and you approve cutover.

The ship workflow is project code, not a hidden deployment runtime. Server behavior and security boundaries are documented on the [shibumi-server page](/server.md).
