# Blog template

![The scaffolded blog: a post list with dates and summaries](/docs/templates/blog.png)

An Astro blog that publishes markdown. Write posts as files, get RSS, a sitemap, SEO meta, and an `llms.txt` without wiring anything.

```sh
bun create shibumi@latest my-blog --template blog
```

## What lands in your repo

- Markdown posts with frontmatter; drafts stay out of the build
- RSS feed and sitemap served as `application/xml`
- SEO meta, OpenGraph tags, clean URLs, view transitions
- `llms.txt` and markdown alternates for every post, so agents read your writing as text
- The same deploy path as every template: `Dockerfile`, `compose.yaml`, deploy script

## Writing

`bun dev` runs Astro locally. A post is a file in `src/content/`; commit and `bun ship` to publish.
