# Shibumi docs

## Start here

- [create-shibumi](/docs/cli) creates a SQLite full-stack app, a blog, or a static site, and adds VPS deployment to a project you already have.
- [shibumi-server](/docs/server) verifies and deploys app images with rootless Podman behind Caddy.
- [Ship](/docs/server/ship) connects a Bun project to the server through owned TypeScript and committed config.
- [Shibumi Forms](/docs/forms) is a standalone service that accepts submissions from any static site through a plain HTML form. Hosted pre-alpha and self-hosted source are available.

Read [product and server choices](/docs/decisions) for boundaries and reasons behind the stack.

## Libraries by job

| Piece | Job |
| --- | --- |
| `Bun` | Runtime, packages, tests, and builds |
| `Hono` | Routes and middleware |
| `Zod` | Environment and request validation |
| `Drizzle` | Schema, queries, and migrations |
| `SQLite` | File-backed application data |
| `Alpine` | Behavior inside HTML components |
| `Nanostores` | Optional state shared across components |

A project includes only the libraries its selected starting point requires.

## Project ownership

Generated apps import their libraries directly. Shibumi adds source, config, tests, and `agents.md` guidance to the repository. Deployment secrets remain on the server, and SSH targets remain in local config.

## Markdown for agents

Every docs page links its direct Markdown file beside the title. [`llms.txt`](/llms.txt) lists all agent-readable docs, including this page at [`/docs/index.md`](/docs/index.md).
