# Add an app from the server

This is the server-operator path, one domain and branch at a time. Most users should start from the [local project](/docs/server/ship) instead, which calls this same registration command over SSH.

## Before setup

Your repository needs a Compose file and a service with a loopback health endpoint. Point domain DNS toward the server or use Cloudflare proxying.

## Preview without changes

```sh
shis add example.com --dry-run
```

Dry run performs DNS detection, prompts, port selection, checkout validation, and Caddy detection. It does not write config or secrets, invoke sudo, or change Caddy and systemd.

## Register

```sh
shis add example.com
```

Interactive setup asks for repository and checkout, assigns the first free port above `9000`, and previews Caddy choices. Public repositories may be cloned.

Private repositories need non-interactive read access for the server deployment user. GitHub CLI can provide HTTPS credentials:

```sh
gh auth login
gh auth setup-git
git ls-remote https://github.com/owner/private-repo.git
```

Run these commands on the server as the same user that runs `shibumi-server`. A repository-scoped read-only SSH deploy key also works. Verify `git ls-remote` succeeds before registration.

Existing domains preserve their current upstream by default. Shibumi adds only its webhook route until a healthy first deployment and explicit cutover.

If the checkout path already exists but its Git origin points at a different repository, `add` offers to move it to `<checkout>.bak` and clone the requested repository fresh instead of failing outright. `--yes` accepts that move; the offer is refused only when `<checkout>.bak` already exists. To repoint an app that is already registered, use [`shis set-repository`](/docs/server/operations#repoint-an-apps-repository) rather than removing and re-adding it.

## Automation

```sh
shis add example.com \
  --repository github:owner/repository \
  --checkout /home/deploy/shibumi/example-com \
  --port 9100
```

A GitHub tree URL selects its branch directly:

```sh
shis add staging.example.com \
  --repository https://github.com/owner/repository/tree/shibumi \
  --checkout /home/deploy/shibumi/staging-example-com \
  --port 9101
```

Equivalent explicit form uses `--repository github:owner/repository --ref refs/heads/shibumi`. Domain and branch names remain independent. Each domain accepts webhooks only for its configured branch.

Other optional flags select Compose file, Compose frontend, service, and health path. Append an app-owned test command after `--`:

```sh
shis add example.com \
  --repository github:owner/repository \
  --checkout /home/deploy/shibumi/example-com \
  --port 9100 \
  -- bun test
```

Test arguments execute directly in the service container. They are never interpreted as a shell string.

## Run setup again

Repeating the same registration validates stored settings, preserves checkout and webhook secret, skips Caddy mutation, and restarts the service. Conflicting settings fail closed.
