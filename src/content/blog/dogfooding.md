---
title: Dogfooding Shibumi
date: 2026-05-12
---

# Dogfooding Shibumi

We are building `create-shibumi` by building `shibumistack.dev` with it. Not alongside it. With it.

This sounds obvious but it is not how most frameworks are made. Usually someone designs an abstraction in a vacuum, documents the API, then hopes the real world fits. We are doing the opposite. Every page on this site is a test of whether the stack actually works for shipping something small and coherent.

## What that means in practice

The site has no build step. `bun dev` runs `src/app.ts` through Bun's hot reload and serves it. Templates are plain HTML files with `{{tokens}}` and `<!-- insert:markers -->`. There is no template engine. Just string replacement.

Routing is explicit. One file, `src/app.ts`, resolves every path. No route table, no file-system router, no magic conventions. If you want a new page you add a handler. If you want to understand how a URL becomes HTML you read the code top to bottom.

Markdown is first-class. Every HTML page has a Markdown alternate served from `src/content/`. Direct `.md` links return plain text. This is not a feature we added later. It is part of the contract: the site should be readable by humans, agents, and source-shaped tools.

## What we have learned so far

**Bun's native APIs are enough.** We started with a hand-rolled frontmatter parser. It was twenty lines of regex and string splitting. It worked until it did not. Then we remembered Bun ships `Bun.YAML.parse()` and `Bun.markdown.html()`. The replacement was eight lines. No dependency, no plugin, no configuration.

**Simple does not mean primitive.** The blog has YAML frontmatter, chronological listing, and individual post pages. The implementation is three functions in `app.ts`: one discovers posts, one renders the list, one renders a post. The Markdown body goes through `Bun.markdown.html()` which handles headings, lists, code blocks, tables, and GFM extensions. We did not write a parser. We wrote glue.

**The stack should get out of the way.** When we added the blog, we created `src/content/blog/`, two template files, and a few lines of routing. No generator, no schema, no type definitions. The "framework" is the filesystem and a few conventions you can see.

## What is still open

We have not touched Alpine yet. The site uses vanilla JS for theme toggling, view transitions, and the install dialog. When `create-shibumi` ships, Alpine will be part of the default stack. We will migrate the site then, not before. Same for Drizzle and Zod. They are in the product direction but not in this repo yet.

The scaffolder itself does not exist. There is no `bun create shibumi@latest`. This site is the proof that the underlying idea — Bun, Hono, plain files, owned source — is enough to ship something real.

## The point

Shibumi is not a runtime you install. It is a set of decisions you can see, copy, and modify. This site is the first artifact. Every line of it is owned source. If we need to change how the blog works, we change `app.ts`. There is no upstream to wait for.

That is the stack we are building. This site is how we know it works.
