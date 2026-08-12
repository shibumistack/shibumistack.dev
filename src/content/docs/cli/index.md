# CLI preview

`create-shibumi` does not ship yet. This section documents intended command surface so decisions stay visible while implementation starts.

## Create app

```sh
bun create shibumi@latest
```

Scaffolder will ask for project directory and template, then write ordinary source files. Generated app should run without hidden Shibumi runtime.

Planned templates include minimal, full-stack, static, SPA, and AI app shapes. Stack pieces appear only when template needs them.

## Add extension

```sh
shi add auth
```

Extensions copy source, migrations, tests, environment guidance, and named fragments such as `agents/auth.md` into project guidance. Install plan should be previewable, conflict-aware, idempotent, and reviewable.

## Ownership rule

CLI may generate or modify files, but project owns result. Existing owned changes must not be overwritten silently. Dependencies should remain direct dependencies of app rather than hidden transitively behind Shibumi runtime.

## Status

Server commands under `shis` are working and documented in [Server commands](/docs/reference/server-commands). App scaffolding and `shi` extension commands remain planned until package releases begin.
