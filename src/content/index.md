# Shibumi Stack

Refined simplicity for shipping web apps.

Shibumi Stack is a small, opinionated path for building durable apps with Bun, Hono, Drizzle, Alpine, and Zod. Few pieces. Clear seams. Nothing hidden.

## What Shibumi is

You install a small and elegant new framework. Then, one day you realize you're debugging 600MB of dependencies you never wanted.

Shibumi is a **frameworkless framework**. Every file is something you can open, read, and understand. Extensions ship with an `agents.md` so your coding agent knows how they work. Nothing runs unless you can own it.

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
4. **SPA**: Client-side routing with Alpine. No server required.
5. **Fullstack**: SSR, API routes, Drizzle, Zod, and Alpine.
6. **AI app**: Streaming responses, prompt templates, model integration.

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
