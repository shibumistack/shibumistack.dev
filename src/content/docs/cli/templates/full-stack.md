# Full-stack template

![The scaffolded full-stack app: a counter stored in SQLite and two demo API routes](/docs/templates/full-stack.png)

The recommended starting point, and the only template with a database. Each library does one job, and the database file sits on a volume outside the image, so deploys and rollbacks swap the code and leave the data alone.

```sh
bun create shibumi@latest my-app --template full-stack
```

## What lands in your repo

- Hono routes in `src/`, with a demo page and two API endpoints
- Drizzle schema and migrations; the scaffold ships a persisted counter so you can watch data survive a redeploy
- SQLite backup and restore scripts
- Tests, a health endpoint, `Dockerfile`, `compose.yaml`, the deploy script, and an `agents.md` with house rules for your coding agent

## Extensions

Feature source installs into the repo with [`bun shi add`](/docs/cli/extensions): auth, email, uploads, admin. Each one copies readable `.ts` files, migrations, tests, and its own `agents/<name>.md`.

## Ship it

`bun ship:setup` once, then `bun ship` deploys the exact committed code to your [VPS](/docs/server/install) or [homelab](/docs/server/homelab). The data volume stays put across deploys and rollbacks.
