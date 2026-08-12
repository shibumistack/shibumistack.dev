# Shibumi docs

> *Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.*
>
> Antoine de Saint-Exupéry

## Start here

Shibumi currently has two usable deployment pieces and one product direction under active construction:

- **[shibumi-server](/docs/server)** receives signed GitHub webhooks and deploys apps with rootless Podman behind Caddy.
- **[Ship tooling](/docs/server/ship)** connects an existing Bun project to your server through project-owned source.
- **[create-shibumi](/docs/cli)** will scaffold new apps and install source-owning extensions. Its command surface is still being built.

For product rationale and stack choices, read [Technical decisions](/docs/decisions).

## Current stack

| Piece | Responsibility |
| --- | --- |
| `Bun` | Runtime, packages, tests, and build tooling |
| `Hono` | Routes and middleware |
| `Zod` | Input validation at boundaries |
| `Drizzle` | Typed schema, queries, and migrations |
| `SQLite` | Local durable storage |
| `Alpine` | Small behavior near HTML |
| `Nanostores` | Shared browser state when needed |

## Own the result

Generated code should remain useful without a Shibumi runtime. Extensions copy reviewed source, configuration, tests, and local `agents.md` guidance into your app. Deployment scripts live in your repository. Server secrets remain on your server.

## Documentation status

Server docs describe working release `{{server-version}}`. CLI docs clearly mark planned behavior until packages ship.
