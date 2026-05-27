# create-shibumi

Scaffold a new Shibumi Stack project.

```
bun create shibumi@latest my-app
```

## What it gives you

A working project with Bun, Hono, and the right config for your deploy target. No hidden runtime. No framework magic. Just source code you can read.

### Templates

| Template | What's inside |
|----------|---------------|
| **Bare** | Minimal app, one route, tests |
| **Blog** | Markdown posts, RSS feed, frontmatter |
| **SSR** | Drizzle, Zod, Alpine, API routes, SQLite |
| **Static** | Build-time HTML output, no server |

### Deploy targets

Self-hosted (Docker + Caddy), Cloudflare Workers, Vercel, Fly.io, or static CDN.

### Extensions

Add features with source code you own:

```sh
bun run shibumi add auth    # cookie sessions, login/logout
bun run shibumi add email   # transactional email via Resend
```

Extensions are copy-paste, not dependencies. You get the files, you own them.

#### Hooks

Extensions can wire themselves into your code. The `images` extension demonstrates this — it adds the middleware import and usage to your `app.ts` automatically:

```sh
bun run shibumi add images
```

```diff
  import { Hono } from "hono";
+ import { imageMiddleware } from "./middleware/images";
  
  export const app = new Hono();
+ app.use("/images/*", imageMiddleware());
  
  app.get("/", ...);
```

The user runs one command. No manual wiring.

**How hooks work in the manifest:**

```json
{
  "hooks": [
    {
      "file": "src/app.ts",
      "find": "import { Hono } from \"hono\";",
      "insert": "import { imageMiddleware } from \"./middleware/images\";",
      "after": "export const app = new Hono();",
      "add": "\napp.use(\"/images/*\", imageMiddleware());"
    }
  ]
}
```

| Field | What it does |
|-------|-------------|
| `file` | Target file to modify |
| `find` | String to locate in the file |
| `insert` | Text to add after the `find` match |
| `after` | String to locate for the `add` step |
| `add` | Text to append after the `after` match |

Hooks are idempotent — running `shibumi add images` twice won't duplicate code.

## Usage

```sh
# Interactive (prompts for everything)
bun create shibumi@latest

# With arguments
bun create shibumi@latest my-app --yes

# Add an extension to an existing project
cd my-app
bun run shibumi add auth
bun run shibumi add email
```

### Flags

| Flag | Description |
|------|-------------|
| `--yes`, `-y` | Skip prompts, use defaults (Bare + Self-hosted + git + deps) |

### Commands

| Command | Description |
|---------|-------------|
| `shibumi` | Create a new project (default) |
| `shibumi add <ext>` | Add an extension |
| `shibumi list` | List available extensions |
| `shibumi optimize` | Optimize images (converts to WebP) |

## Stack

- **Bun** — runtime, package manager, test runner
- **Hono** — route layer
- **Drizzle** — schema, queries, migrations (SSR template)
- **Alpine** — client-side interactivity (SSR template)
- **Zod** — validation (SSR template)

## Writing Extensions

An extension is a directory with three exports:

```
src/extensions/my-ext/
├── manifest.json    # metadata, files, hooks
├── agents.md        # guidance for coding agents
└── files/           # source files to copy into the project
    └── src/
        └── ...
```

### Manifest

```json
{
  "name": "my-ext",
  "title": "My Extension",
  "description": "What it does",
  "files": [
    { "from": "files/src/lib/helper.ts", "to": "src/lib/helper.ts" }
  ],
  "agents": "agents.md",
  "deps": ["some-package"],
  "migration": "files/migration.sql",
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

All fields except `name`, `title`, `description`, and `files` are optional.

## Development

```sh
git clone https://github.com/shibumistack/create-shibumi.git
cd create-shibumi
bun install
bun test
bun src/index.ts
```

## License

MIT
