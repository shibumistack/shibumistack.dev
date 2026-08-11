# Ship an existing project

Connect any Bun project to `shibumi-server` with one small script that lives in your repository. Projects created by Shibumi already include these files. For an existing project, add the same owned source once, review it, and commit it.

Requirements: Bun, Git, GitHub CLI, and SSH access to your server.

## 1. Copy the ship script

Download versioned source into your project. The command writes a file but does not execute it. Read `scripts/ship.ts` before committing.

```sh
mkdir -p scripts
curl -fsSLo scripts/ship.ts https://shibumistack.dev/ship/v2.ts
bun add --dev '@clack/prompts@^0.7.0'
```

Source: <https://shibumistack.dev/ship/v2.ts>

## 2. Add package scripts

Let Bun update `package.json` without replacing existing scripts:

```sh
bun pm pkg set 'scripts.ship=bun scripts/ship.ts' \
  'scripts.ship:setup=bun scripts/ship.ts --setup'
```

The added keys look like this:

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

## 3. Connect the project

```sh
bun run ship:setup
```

Setup explains each boundary before saving anything. It connects through your existing SSH configuration, completes server registration, downloads commit-safe project config, and creates the GitHub webhook through `gh`.

- Committed: `scripts/ship.ts`, `shibumi-server.json`, and package changes.
- Local only: SSH target in `.git/config`.
- Server only: checkout path, machine config, and webhook secret.

## 4. Deploy

```sh
bun run ship
```

Ship requires a clean tree on the configured branch. It runs your project test and check scripts, verifies origin state, pushes one commit, then follows deployment status over SSH.

Existing domains keep their current Caddy upstream until the first Shibumi deployment passes health checks and you approve cutover.

The ship workflow is project code, not a hidden deployment runtime. Server behavior and security boundaries are documented on the [shibumi-server page](/server.md).
