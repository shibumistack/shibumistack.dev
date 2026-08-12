# Extensions

Extensions add features to your Shibumi project. They copy source code into your app instead of hiding behavior behind a Shibumi runtime. You own the files from the moment they land.

> **RFC:** Extension packaging, lifecycle, conflict handling, checks, and community registry design are still under review. Commands and manifest fields below describe the current proposal, not a stable public contract.

## Install an extension

```sh
bun run shibumi add <name>
```

That's it. The extension copies files, installs any dependencies, and wires itself into your app if needed.

## Available extensions

### Auth

Cookie sessions with password or magic-link login.

```sh
bun run shibumi add auth
```

What it copies:
- `src/lib/session.ts`: session management with `bun:sqlite`
- `src/middleware/auth.ts`: auth middleware
- `src/routes/auth.ts`: login, register, magic link, logout

What it wires in:
- Auth routes mounted at `/auth`
- Auth middleware on `/protected/*`

What it stores:
- `data/auth.db`: SQLite database with users, sessions, magic links

Zero npm dependencies. Uses `Bun.password` for hashing and `bun:sqlite` for storage.

### Images

Automatic WebP optimization. Serves WebP on the fly, keeps originals untouched.

```sh
bun run shibumi add images
```

What it copies:
- `src/middleware/images.ts`: intercepts image requests, converts to WebP, caches

What it wires in:
- Image middleware on `/images/*`

How it works:
1. Browser requests `/images/hero.png`
2. Middleware checks if cached WebP exists
3. If no → converts with `Bun.Image`, writes to cache
4. Serves WebP. Original stays in place.

No HTML changes needed. No build step. Just middleware.

### Email

Transactional email via Resend.

```sh
bun run shibumi add email
```

What it copies:
- `src/lib/email.ts`: send emails with `sendEmail({ to, subject, html })`

What it needs:
- `RESEND_API_KEY` in your `.env`

## How extensions work

An extension is an install plan: source files, metadata, agent guidance, migrations, dependencies, environment variables, and checks.

### Manifest

Manifest metadata can describe name, version, author, license, source repository, compatibility, categories, themes, deploy targets, and official or community ownership. Exact schema remains part of the RFC.

### Files

Each extension declares files to copy. They land in your project exactly where specified:

```json
{
  "files": [
    { "from": "files/src/lib/helper.ts", "to": "src/lib/helper.ts" }
  ]
}
```

### Hooks

Extensions can modify existing files when they install. The `hooks` field specifies what to find and what to add:

```json
{
  "hooks": [
    {
      "file": "src/app.ts",
      "find": "import { Hono } from \"hono\";",
      "insert": "import { helper } from \"./lib/helper\";",
      "after": "export const app = new Hono();",
      "add": "\napp.use(helper());"
    }
  ]
}
```

Hooks must be idempotent: running the same extension twice must not duplicate code.

### Prompts

Extensions may ask for choices such as session strategy, email provider, or storage backend. Answers become visible generated configuration rather than hidden installer state.

### Agents

Each extension ships named guidance such as `agents/auth.md`. Installation merges it into the project's discoverable root `agents.md`, while the named source path keeps extension ownership clear.

### Dependencies

Extensions can declare npm dependencies. They're installed automatically:

```json
{
  "deps": ["resend"]
}
```

### Checks

Extension submissions should prove they install into fixture apps. Proposed checks include tests, formatting, declared-file verification, and rejection of undeclared network access or install scripts.

```json
{
  "name": "auth",
  "files": [{ "from": "files/src/lib/session.ts", "to": "src/lib/session.ts" }],
  "agents": "agents/auth.md",
  "env": ["SESSION_SECRET"],
  "checks": ["bun test"]
}
```

## Writing your own

An extension is a directory:

```
src/extensions/my-ext/
├── manifest.json
├── agents/
│   └── my-ext.md
└── files/
    └── src/
        └── ...
```

Publish it as an npm package (`@shibumi/my-ext` or `shibumi-ext-my-ext`). Install with:

```sh
bun run shibumi add my-ext
```
