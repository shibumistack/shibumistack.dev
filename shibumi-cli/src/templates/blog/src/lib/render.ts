import { Marked } from "marked";
import type { Post } from "./posts";

const marked = new Marked();

// ── Layout ──────────────────────────────────────────────────────────

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, serif; line-height: 1.6; color: #1a1a1a; background: #faf8f4; max-width: 640px; margin: 0 auto; padding: 2rem 1rem; }
    a { color: #c76647; text-decoration: none; }
    a:hover { text-decoration: underline; }
    h1, h2, h3 { line-height: 1.2; margin: 1.5rem 0 0.5rem; }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.4rem; }
    p { margin: 0.75rem 0; }
    code { background: #f0ebe0; padding: 0.15em 0.3em; border-radius: 3px; font-size: 0.9em; }
    pre { background: #f0ebe0; padding: 1rem; overflow-x: auto; margin: 1rem 0; border-radius: 4px; }
    pre code { background: none; padding: 0; }
    .meta { color: #5c5852; font-size: 0.9rem; }
    .post-list { list-style: none; }
    .post-list li { margin: 1.5rem 0; }
    .post-list .title { font-size: 1.2rem; font-weight: bold; }
    .post-list .excerpt { color: #5c5852; margin-top: 0.25rem; }
    .back { display: inline-block; margin-bottom: 2rem; }
    header, footer { margin: 2rem 0; }
    footer { color: #5c5852; font-size: 0.85rem; border-top: 1px solid #e5e0d8; padding-top: 1rem; }
  </style>
</head>
<body>
  ${body}
  <footer>
    <p>Built with <a href="https://shibumistack.dev">Shibumi Stack</a></p>
  </footer>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Pages ───────────────────────────────────────────────────────────

export function renderIndex(posts: Post[]): string {
  const list = posts
    .map(
      (p) => `
    <li>
      <div class="title"><a href="/post/${p.slug}">${escapeHtml(p.meta.title)}</a></div>
      <div class="meta">${p.meta.date}</div>
      ${p.meta.excerpt ? `<div class="excerpt">${escapeHtml(p.meta.excerpt)}</div>` : ""}
    </li>`
    )
    .join("\n");

  const body = `
    <header>
      <h1>Blog</h1>
      <p class="meta">${posts.length} post${posts.length === 1 ? "" : "s"}</p>
    </header>
    <ul class="post-list">
      ${list}
    </ul>`;

  return layout("Blog", body);
}

export function renderPost(post: Post): string {
  const html = marked.parse(post.content) as string;

  const body = `
    <a class="back" href="/">&larr; All posts</a>
    <article>
      <h1>${escapeHtml(post.meta.title)}</h1>
      <div class="meta">${post.meta.date}</div>
      ${html}
    </article>`;

  return layout(post.meta.title, body);
}

export function renderRss(posts: Post[]): string {
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeHtml(p.meta.title)}</title>
      <link>https://example.com/post/${p.slug}</link>
      <description>${escapeHtml(p.meta.excerpt || "")}</description>
      <pubDate>${new Date(p.meta.date).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog</title>
    <link>https://example.com</link>
    <description>A Shibumi blog</description>
${items}
  </channel>
</rss>`;
}
