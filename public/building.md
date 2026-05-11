# Roadmap

Shibumi is being built in public.

The plan is public while the stack settles. This page tracks what is decided, what ships first, and where the design is still open.

## Now

Brand, landing pages, CLI design, and the DX plan. The product promise is being narrowed before the package ships.

## Next

Release `create-shibumi` with bare, blog, SSR, and static starts plus deploy config chosen during setup.

## Then

Ship auth, email, uploads, payments, and admin as copied source with migrations and agent guidance.

## What is planned

### create-shibumi

A scaffolder with prompts for template, deploy target, git, and dependencies.

### Templates

Bare, blog, SSR, and static starts. Different starts for different projects, not one template forced everywhere.

### Deploy targets

Cloudflare, Vercel, Fly.io, static CDN, and self-hosted Bun with Docker.

### Data

SQLite in development. Drizzle keeps schema and queries familiar while production follows the target.

### Core

CSRF included. Security defaults should not be an optional extension.

### Extensions

Copy code, not dependencies. Auth, Resend email, uploads, payments, and admin are added explicitly and owned by the app.

### Agents

Each extension can append an `agents.md` fragment so coding agents know the local conventions.

### shibumi-server

A small VPS deploy helper: receive webhook, pull repo, rebuild, and register the route with Caddy.
