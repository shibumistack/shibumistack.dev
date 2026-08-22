---
title: Dogfooding Shibumi
date: 2026-05-12
excerpt: The website found gaps in the CLI and deployment model before release.
---

# Dogfooding Shibumi

I started this website before `create-shibumi` existed. That was useful. Every time the site needed something new, I had to decide whether Shibumi needed the feature or whether a few lines in the project were enough.

Most of the time, a few lines won.

## What the site uses

Development runs Hono through Bun. Production is static: `scripts/build.ts` asks the same Hono app to render known routes, writes them to `dist/`, and copies `public/`. A scratch container serves the result with BusyBox `httpd`.

Templates are HTML files with explicit `{{tokens}}` and `<!-- insert:markers -->`. `src/app.ts` reads them and replaces strings. There is no template package to configure.

Routing is deliberately narrow. The app resolves `/`, one safe page segment, blog posts, and an allowlist of docs routes. If I need a route shape that does not fit those rules, I add it in `app.ts` instead of teaching a generic router another convention.

Every main page has Markdown source under `src/content/`. Browsers get HTML. A request that prefers `text/markdown` gets Markdown, and direct `.md` URLs stay available for agents. The static build publishes those files too.

## The useful mistakes

I first wrote a frontmatter parser with regex and string splitting. It was about twenty lines and worked on the first post. Then I replaced it with `Bun.YAML.parse()` and `Bun.markdown.html()`. Eight lines, fewer edge cases, no dependency.

The VPS work found a more expensive mistake. Building a framework-heavy site on a small host exhausted memory before health checks ran. That failure moved image builds to the client and added memory, disk, timeout, and systemd limits to `shibumi-server`.

Ship found another gap. Development ports assigned by the server were easy to forget, so `bun dev` now runs the original dev command with the configured port. Its startup output says "starting" because Ship does not claim readiness before the child server accepts connections.

These details are hard to invent in a template review. They show up when the project is running.

## What shipped

`create-shibumi` publishes static output, creates a Bun web app, or creates a SQLite full-stack app. All three use the VPS path. Packed-package fixtures prove that generated projects install, build, run, and deploy without reaching back into the CLI repository.

Bundled auth, email, and uploads extensions copy their source and agent instructions into generated projects.

The website still does not use Drizzle, SQLite, Alpine, Nanostores, or Zod. Adding them for a stack badge would be silly. They should enter when the site has work for them.

## Why keep doing it this way

Shibumi is supposed to leave readable files behind. This site makes that promise awkward to fake. If a page needs a framework explanation before I can edit it, or a deploy needs hidden state to recover, the product has already drifted.

I expect more of those moments before `0.1.0`. Better here than in someone else's project.
