---
name: shibumi-ship
description: Operate the Shibumi deployment workflow for projects that ship through shibumi-server. Use this skill whenever the user says "ship", "deploy", "push and ship", "commit and ship", "make it live", "is it deployed?", asks for deployment logs, or asks to roll back in a Shibumi-enabled project (one containing shibumi-server.json, scripts/ship.ts, or a package script "ship" that runs scripts/ship.ts). Do not use it for Vibelab apps, generic CI/CD or Kubernetes design questions, local development ("bun dev"), or projects without Shibumi markers.
---

# Shibumi Ship

Run the project-owned deployment workflow safely. This skill owns intent
parsing, sequencing, verification, and failure reporting. `scripts/ship.ts`
(the Ship client) and `shibumi-server` own the deployment mechanics: Git
checks, image build and upload, push, deploy trigger, status polling, health,
and rollback. Never reimplement or duplicate any of that; your job is to run
the right command once and report what happened accurately.

## Confirm the project is Shibumi-enabled

Before anything else, verify at least one marker in the project root:

- `shibumi-server.json` (committed deploy config: domain, branch, appId)
- `scripts/ship.ts`
- a `package.json` script `ship` invoking that file (normally `bun scripts/ship.ts`)

No marker → this skill does not apply. Say so and stop; do not improvise a
deploy pipeline.

## Preflight (read-only)

- Read the nearest `AGENTS.md`/`agents.md` and `package.json` scripts; project
  notes may constrain shipping.
- Inspect `git status`, current branch, upstream, and the latest commit
  without changing anything. This is for your report, not for gating: the
  Ship client re-checks all of it and refuses ambiguous deploys itself.
- Read `shibumi-server.json` for the domain and branch you will verify
  against. Never print secrets: do not dump `~/.config/shibumi/config.json`,
  webhook secrets, or credential material from remote output. Domain, branch,
  commit, and stage names are fine.

## Intent map

| User intent | Action |
|---|---|
| ship / deploy / make it live | `bun ship` |
| push and ship | `bun ship` alone. It fetches, pushes the exact commit itself, and refuses if behind or diverged. No separate `git push` first. |
| commit and ship | Commit first using the session's normal commit workflow, staging only the files relevant to the change. Never sweep unrelated changes into the commit. Then `bun ship`. |
| is it deployed? / deployment status | `bun ship --status`, then compare reported commit with `HEAD` and perform the safe public HTTP check below. |
| logs / why did the deploy fail | `bun ship --logs` |
| rollback | `bun ship --rollback`, only after explicit request or confirmation described below |
| setup, `--update`, config changes, existing-domain Caddy cutover, destructive recovery | Only on explicit user request. These change server or repo state beyond a normal deploy. |

## Running bun ship

Run exactly `bun ship` from project root with long timeout. A deploy builds
container image, uploads it over SSH, and polls status for up to 12 minutes.
Allow at least 15 minutes. Prefer background run with output to a file when
execution limit is shorter.

The client detects agent execution and switches to static line-by-line
output on its own. Do not wrap it in pipes, pseudo-TTYs, or pagers to change
that behavior; just run it and read the output.

`bun ship` already performs, in order: setup detection, project checks
(`bun run test`, `bun run check` when present), refusal on dirty tree /
wrong branch / behind origin, prebuilt image build and upload, `git push` of
the exact commit when ahead, deploy trigger over SSH, and status polling for
that exact commit. If it refuses, that refusal is correct: fix stated cause
(or ask user), don't work around it. Successful run may update tracked
`scripts/ship.ts` to reviewed latest source. Report that unstaged change so
user can review and commit it.

Safety rules, no exceptions:

- If output contains a line starting with `Agent:`, the client is telling you
  this step needs an interactive terminal (SSH prompts, sudo, cutover, server
  install). Relay exact local command to user (for example, "run `bun ship`
  in your terminal") and stop. Never open your own SSH session to the server
  to bypass it.
- Never auto-retry a failed deployment. One run per user request.
- Never auto-rollback.
- Never change server config, Caddy routes, or `shibumi-server.json` while
  diagnosing a failure.

## Verification

On success, trust client status polling for deployment health and exact
deployed commit. It polls status keyed to pushed commit hash, so
"Deployment complete" is authoritative. Then independently run one
safe public check against the domain from `shibumi-server.json`:

```sh
curl -sS -o /dev/null -w '%{http_code}' --max-time 10 https://<domain>/
```

Report using this shape:

```text
Shipped <short-commit> to https://<domain>
Checks: pass
Health: HTTP 200
```

Include what actually happened: shipped commit (from `git rev-parse HEAD`
after the run), domain or URL, command result, HTTP status. If you cannot
establish which commit is deployed, do not claim success. Say exactly what
is unverified.

Caveat: if client reports "New upstream healthy at 127.0.0.1 (Caddy
cutover pending)", the new app is healthy but not yet public. Report that
state; the public URL still serves the previous upstream until the user
completes cutover interactively.

## Failure handling

On failure, when it is safe and useful, run `bun ship --logs` once. Then:

1. Identify the failing stage:
   - **client/preflight**: dirty tree, wrong branch, behind origin,
     `test`/`check` failed, Docker/Compose/Buildx unavailable
   - **build/upload**: local image build failed, platform mismatch, server
     rejected uploaded image
   - **server deploy**: stages `checkout`, `build`, `start` from status/logs
   - **health**: container started but health check never passed; startup or
     health failure means server restored previous release
   - **cutover**: existing-domain onboarding only; previous upstream remains
     active
2. Quote the exact error and preserve the client's `Next:` guidance verbatim.
   It is written to be actionable; do not paraphrase it away.
3. Stop. Report stage, exact error, current deployment state (previous
   release restored, or unknown), and the next safe action. Keep log excerpts
   concise, but keep anything security-relevant or data-loss-relevant intact.

## Deployment truth

Describe deploys honestly:

- A regular deploy is **not blue-green**. Compose recreates same service on
  same host port. Managed Caddy routes wait and retry unavailable upstream for
  up to 20 seconds, masking normal restart gap with brief latency. Existing
  in-flight or long-lived connections can still fail. If startup or health
  fails, previous release is restored.
- Existing-domain onboarding is different: the old upstream keeps serving
  while the new app starts and passes health, and traffic moves only on an
  explicit, interactive Caddy cutover.
- Never promise zero downtime, and never imply Caddy switches upstreams on a
  normal deploy.

## Rollback

`bun ship --rollback` restores the previous retained image in production.
Treat it as a mutating production action: run it only when the user
explicitly asked to roll back, or explicitly confirmed after you proposed it.
Be aware the client auto-approves its own confirmation prompt under agent
execution. Your confirmation with user is only gate, so never run it
speculatively or as part of diagnosing a failed deploy. After it completes,
verify with the same public HTTP check and report the restored state.
