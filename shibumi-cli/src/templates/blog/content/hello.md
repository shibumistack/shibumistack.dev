---
title: Hello, Shibumi
date: 2025-01-15
excerpt: Your first post. Edit or delete this file and add your own.
---

Welcome to your new blog.

This is a markdown file. Write in plain text, and the blog renders it into HTML. No CMS, no database, no build step beyond what Bun and Hono already provide.

## How it works

Posts live in `content/`. Each file is a markdown file with a YAML frontmatter block:

```yaml
---
title: Hello, Shibumi
date: 2025-01-15
excerpt: Your first post.
---
```

The blog discovers all `.md` files in `content/`, parses the frontmatter, sorts by date, and serves them.

## Write

Add a new file to `content/`:

```sh
echo '---
title: My Post
date: 2025-01-20
excerpt: A short description.
---

Your content here.' > content/my-post.md
```

Restart the dev server. The post appears at `/post/my-post`.

## Deploy

```sh
bun run build
```

Same as any Shibumi app. Push to your platform and it runs.
