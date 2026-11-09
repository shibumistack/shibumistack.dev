# Shibumi docs

Generate a Bun app, blog, or static site as source you own. Get it working locally first; deployment to your Linux server is a separate step.

## Quick start: run your first app

On your computer, install [Bun](https://bun.com/docs/installation) **1.4.4 or newer** and Git. Check `bun --version`; if Bun is older, run `bun upgrade`. The CLI checks this before creating project files.

No Docker, domain or VPS is needed to run locally.

```sh
bun create shibumi@latest my-app --template full-stack
cd my-app
bun dev
```

Choose **Later** when asked about deployment. Creation installs dependencies and initializes Git without making a commit.

Open **http://localhost:9001**. You should see the full-stack starter. Click **Count**, then reload: the value remains because it is stored in SQLite. Keep the terminal running; Ctrl+C stops the server. If the port is already occupied, do not stop another app unless it is yours.

Edit the page in `src/app.ts` and refresh to see your change. Browser behavior lives in `public/app.js` and styles in `public/style.css`.

Before deploying, stop the dev server and run:

```sh
bun test
bun check
bun run build
```

`bun check` uses Bun's native TypeScript checker. You do not need a separate TypeScript compiler package.

## Choose another starting point

Use a different project name if `my-app` already exists. Shibumi refuses to overwrite it.

| What you want | Create command | Next step |
| --- | --- | --- |
| An app with SQLite | `bun create shibumi@latest my-app --template full-stack` | [Full-stack guide](/docs/cli/templates/full-stack) |
| A Markdown blog | `bun create shibumi@latest my-blog --template blog` | [Blog guide](/docs/cli/templates/blog) |
| Plain HTML and CSS | `bun create shibumi@latest my-site --template static` | [Static guide](/docs/cli/templates/static) |

All three start with `cd <project-name>` and `bun dev`. Choose **Later** for deployment while trying them. Blog and static also preview on port 9001, so stop one before starting another. For a blog, set your identity and real domain in `src/site.ts` before publishing.

Already have a site? [Add Ship to an existing project](/ship) instead of creating another one.

## Put it online when you are ready

Local development does not require a server. Deployment does require these preparations:

| Where | What must be ready |
| --- | --- |
| Your computer | Bun 1.4.4+, Git, SSH and a working Docker CLI, Compose and Buildx connected to a running container engine. [Local build setup](/docs/server/ship#local-build-requirements) |
| Your Linux server | Git, rootless Podman, a working Compose frontend, Caddy and a systemd user session. The installer checks these; it does not provision a bare VPS for you. [Server requirements](/docs/server/install) |
| Access | A working `user@server` SSH login, permission to approve server setup through sudo, and repository read access for the deployment user. Private repositories need credentials too. [Repository access](/docs/server/add-app#register) |
| Your domain | DNS must point to the server and HTTP/HTTPS must be reachable. [Domain setup](/docs/server/add-app#before-setup) |

Review your generated source and make the first commit. In a second terminal, from the project root:

```sh
git status
git add .
git commit -m "Create app"
bun ship:setup
bun ship
```

Setup asks for the SSH target and domain, then shows a plan for confirmation. If you have no GitHub origin, it offers to create a private repository using GitHub CLI; install `gh` and sign in if you choose that path. The server also needs read access to the repository.

Blog and static setup generate container files. Review and commit them when prompted. Agent or non-interactive setup can pause at that review step; commit the generated files and rerun `bun ship:setup`, pushing when requested. Generating files is not a completed deployment.

After `bun ship` succeeds, open the HTTPS URL it prints and check the same page you tested locally. Use `bun ship:status` for state or `bun ship:logs` to investigate a failure. [Deployment troubleshooting](/docs/ship/troubleshooting) explains common local engine and permission errors.

`bun ship --rollback` restores the retained previous image, not earlier database contents. Recovery can interrupt requests; it is not a zero-downtime guarantee. [Rollback details](/docs/server/history-rollback)

## Product reference

- [CLI](/docs/cli): flags, existing-project adoption and generated project behavior.
- [Extensions](/docs/cli/extensions): auth, email, uploads and admin as owned source. Auth and uploads add APIs, not ready-made login or upload pages.
- [Server](/docs/server): image verification, rootless containers and operations.
- [Shibumi Forms](/docs/forms): a separate service for submissions from static sites.
- [Product and server choices](/docs/decisions): the reasons behind the stack.

## Markdown for agents

Every docs page links its direct Markdown file beside the title. [`llms.txt`](/llms.txt) lists all agent-readable docs, including this page at [`/docs/index.md`](/docs/index.md).
