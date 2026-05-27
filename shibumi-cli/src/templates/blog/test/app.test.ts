import { describe, it, expect } from "bun:test";
import { app } from "../src/app";

describe("blog app", () => {
  it("serves the index page", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<h1>Blog</h1>");
    expect(html).toContain("Hello, Shibumi");
    expect(html).toContain("/post/hello");
  });

  it("serves an individual post", async () => {
    const res = await app.fetch(new Request("http://localhost/post/hello"));
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<h1>Hello, Shibumi</h1>");
    expect(html).toContain("Welcome to your new blog");
    expect(html).toContain("All posts");
  });

  it("returns 404 for unknown posts", async () => {
    const res = await app.fetch(new Request("http://localhost/post/nope"));
    expect(res.status).toBe(404);
  });

  it("serves RSS feed", async () => {
    const res = await app.fetch(new Request("http://localhost/rss.xml"));
    expect(res.status).toBe(200);
    const xml = await res.text();
    expect(xml).toContain("<rss");
    expect(xml).toContain("Hello, Shibumi");
  });
});
