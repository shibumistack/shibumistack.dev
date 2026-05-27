import { Hono } from "hono";
import { getPost, getPosts, type Post } from "./lib/posts";
import { renderPost, renderIndex, renderRss } from "./lib/render";

export const app = new Hono();

// ── Routes ──────────────────────────────────────────────────────────

app.get("/", async (c) => {
  const posts = getPosts();
  const html = renderIndex(posts);
  return c.html(html);
});

app.get("/rss.xml", async (c) => {
  const posts = getPosts();
  const rss = renderRss(posts);
  return c.text(rss, 200, { "Content-Type": "application/rss+xml" });
});

app.get("/post/:slug", async (c) => {
  const slug = c.req.param("slug");
  const post = getPost(slug);

  if (!post) {
    return c.notFound();
  }

  const html = renderPost(post);
  return c.html(html);
});

// ── 404 ─────────────────────────────────────────────────────────────

app.notFound((c) => {
  return c.html("<h1>404</h1><p>Not found.</p>", 404);
});
