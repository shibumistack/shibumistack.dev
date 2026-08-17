# Shibumi Stack

Refined simplicity for shipping web apps.

Shibumi Stack is a small web stack for apps you can understand and keep: Bun, Hono, Zod, Drizzle, SQLite, Alpine, and Nanostores. Clear seams. Nothing hidden.

Shibumi (渋み) is a Japanese concept meaning understated elegance, refined simplicity, or subtle beauty.

## What Shibumi is

You install a small and elegant new framework. Then, one day you realize you're debugging 600MB of dependencies you never wanted.

Shibumi is a **frameworkless framework**. Every file is something you can open, read, and understand. Extensions ship named agent guidance and merge it into root `agents.md`, so your coding agent knows how they work. Nothing runs unless you can own it.

## Your agent knows the project

Every Shibumi project ships with an `agents.md` file. It tells your coding agent the rules: where routes live, how data flows, what tests exist, and where the boundaries are.

Extensions add their own fragments. Install auth, and the agent learns the session model. Add payments, and it knows the webhook flow. The more you build, the smarter it gets.

## Why this

- **Calm defaults**: practical choices that fit together naturally.
- **Open seams**: each layer stays visible, understandable, and replaceable.
- **Long life**: SQLite by default, Bun commands throughout, and self-host-friendly deployment.

## Start with a theme

1. **Minimal**: Smallest useful app. Routes, layout, styles, and tests.
2. **Blog**: Markdown-driven content, RSS, and permalinks.
3. **Landing**: Marketing page with waitlist or signup form.
4. **SPA**: Client-side routing and shared state with Alpine and Nanostores.
5. **Fullstack**: SSR, API routes, SQLite, Drizzle, Zod, and Alpine.
6. **AI app**: Streaming responses, prompt templates, model integration.

## Self-hosted deploys

[shibumi-server](/server.md) has a signed receiver, replay protection, resource guards, and a pinned v{{server-version}} installer:

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
shibumi-server add example.com
```

Once configured, `bun ship` runs project checks, builds committed code on your computer for the server's Linux architecture, and uploads the labeled image through SSH before pushing Git. The service verifies the signed push and exact image, keeps the current app running through checks, then replaces it, confirms health, keeps one rollback image, and removes older ones. Before the next deployment, Ship can run reviewed client updates and save them only after success. App-owned tests are optional. Secrets and machine configuration stay outside the public repository. [See how shibumi-server works.](/server.md)

## Start

```sh
bun create shibumi@latest my-app
cd my-app
bun dev
```

## Links

- [Roadmap](/building.md)
- [Brand assets](/brand.md)
- [Contributing](/CONTRIBUTING.md)
- [License](/LICENSE)
