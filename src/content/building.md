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

SQLite by default. Drizzle handles schema, queries, and migrations. The production driver follows the target.

### State

Nanostores for shared state. Use Alpine inside a component. Use a store only when state is shared.

### Core

CSRF included. Security defaults should not be an optional extension.

### Extensions

Copy code, not dependencies. Auth, Resend email, uploads, payments, and admin are added explicitly and owned by the app.

### Agents

Each extension can merge named guidance such as `agents/auth.md` into root `agents.md`, so coding agents know local conventions and fragment ownership stays clear.

### [shibumi-server](/server.md)

A VPS deploy service that verifies signed GitHub pushes, checks host capacity, validates the deployment config, builds with rootless Podman, replaces the old container, checks the new one's health, keeps the previous two images for quick rollbacks, and removes older ones. App-owned tests are optional. Public code and templates stay in Git; secrets and machine inventory stay on the server.
