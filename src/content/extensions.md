# Extensions

Extensions copy feature code into a Shibumi project. The project owns the copied routes, migrations, tests, and configuration.

## Command

```sh
bun run shibumi add <name>
```

Before writing, the command lists new files, edits, dependencies, environment variables, migrations, and `agents.md` changes. Existing files require an explicit conflict decision. Running the same install twice must not duplicate code.

## What an extension contains

An extension may include:

- source files with fixed target paths
- exact edits to existing project files
- npm dependencies
- environment variable names, never values
- database migrations
- fixture tests
- a named guide such as `agents/auth.md`

Example manifest fragment:

```json
{
  "name": "auth",
  "files": [
    { "from": "files/src/lib/session.ts", "to": "src/lib/session.ts" }
  ],
  "agents": ["agents/auth.md"],
  "env": ["SESSION_SECRET"],
  "checks": ["bun test"]
}
```

## Available extensions

### Auth

Cookie sessions, login and logout routes, CSRF-protected mutations, password hashing with `Bun.password`, and SQLite session tables.

### Email

A Resend-backed send helper, environment validation, webhook verification, and a fixture that proves template variables and delivery handling.

### Uploads

Validated multipart input plus either local persistent storage or S3-compatible storage. File limits, generated names, content checks, and cleanup rules must ship with it.

List installed and available extensions with:

```sh
bun run shibumi list
```

## File edits

A hook must name the file, the exact text it expects, and the text it will add. If the expected source is missing or appears more than once, installation stops without guessing.

```json
{
  "hooks": [
    {
      "file": "src/app.ts",
      "find": "export const app = new Hono();",
      "after": "app.use(helper());"
    }
  ]
}
```

## Agent guidance

An extension keeps its instructions in a named file and merges a discoverable section into root `agents.md`. Removing the extension can then identify which guidance belongs to it.

## Package checks

Packed CLI tests install each bundled extension into supported fixture projects and run declared checks. They reject undeclared file writes, network access during installation, lifecycle scripts, duplicate hooks, and paths outside the project root.

## Package layout

```text
manifest.json
agents/
  feature.md
files/
  src/
    ...
```

Bundled extensions ship inside the versioned `create-shibumi` package.
