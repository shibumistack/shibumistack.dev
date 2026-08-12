# Add an app

Register one domain, GitHub repository, and branch at a time. Multiple domains may deploy different branches from the same repository.

## Before setup

Your repository needs a Compose file and a service with a loopback health endpoint. Point domain DNS toward the server or use Cloudflare proxying.

## Preview safely

```sh
shis add example.com --dry-run
```

Dry run follows real DNS detection, prompts, port selection, checkout validation, and Caddy detection. It writes no config or secrets, invokes no sudo, and changes neither Caddy nor systemd.

## Register

```sh
shis add example.com
```

Interactive setup asks for repository and checkout, assigns the first free port from `9100`, and previews Caddy choices. Public repositories may be cloned.

Private repositories need non-interactive read access for the server deployment user. GitHub CLI can provide HTTPS credentials:

```sh
gh auth login
gh auth setup-git
git ls-remote https://github.com/owner/private-repo.git
```

Run these commands on the server as the same user that runs `shibumi-server`. A repository-scoped read-only SSH deploy key also works. Verify `git ls-remote` succeeds before registration.

Existing domains preserve their current upstream by default. Shibumi adds only its webhook route until a healthy first deployment and explicit cutover.

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

## Repeat behavior

Repeating the same registration validates stored settings, preserves checkout and webhook secret, skips Caddy mutation, and restarts the service. Conflicting settings fail closed.
