import { describe, expect, test } from "bun:test";
import app, { icon, iconNames } from "../src/app";

describe("routes", () => {
  test("serves homepage as HTML by default", async () => {
    const res = await app.request("/");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Simple.");
    expect(body).toContain("Yours");
  });

  test("negotiates Markdown only when preferred", async () => {
    const res = await app.request("/", {
      headers: { accept: "text/markdown" },
    });
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    expect(body).toContain("# Shibumi Stack");
    const htmlRes = await app.request("/", {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/markdown;q=0.1,*/*;q=0.8",
      },
    });

    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers.get("content-type")).toContain("text/html");
  });

  test("serves discovered HTML pages with Markdown alternates", async () => {
    const htmlRes = await app.request("/brand");
    const htmlBody = await htmlRes.text();

    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers.get("content-type")).toContain("text/html");
    expect(htmlBody).toContain("Quiet craft.");

    const markdownRes = await app.request("/brand", {
      headers: { accept: "text/markdown" },
    });
    const markdownBody = await markdownRes.text();

    expect(markdownRes.status).toBe(200);
    expect(markdownRes.headers.get("content-type")).toContain("text/markdown");
    expect(markdownBody).toContain("# Brand");
  });

  test("serves Markdown-only discovered pages", async () => {
    const res = await app.request("/dx");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    expect(body).toContain("# Shibumi Stack DX Plan");
  });

  test("opens direct Markdown links inline", async () => {
    const res = await app.request("/index.md");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(res.headers.get("content-disposition")).toBe("inline");
    expect(body).toContain("# Shibumi Stack");

    const readmeRes = await app.request("/README.md");
    const readmeBody = await readmeRes.text();

    expect(readmeRes.status).toBe(200);
    expect(readmeRes.headers.get("content-type")).toContain("text/plain");
    expect(readmeRes.headers.get("content-disposition")).toBe("inline");
    expect(readmeBody).toContain("shibumistack.dev");
  });

  test("serves 404 page for unknown routes", async () => {
    const res = await app.request("/not-here");
    const body = await res.text();

    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Nothing here.");
  });

  test("serves blog listing page", async () => {
    const res = await app.request("/blog");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Blog");
    expect(body).toContain("Hello, Shibumi");
  });

  test("serves individual blog posts", async () => {
    const res = await app.request("/blog/hello-shibumi");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Hello, Shibumi");
    expect(body).toContain("own your source");
  });

  test("returns 404 for unknown blog posts", async () => {
    const res = await app.request("/blog/not-a-post");

    expect(res.status).toBe(404);
  });
});

describe("icons", () => {
  test("all discovered icons can be inlined", async () => {
    for (const name of await iconNames()) {
      const svg = await icon(name);

      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
    }
  });

  test("rejects unknown icon names", async () => {
    await expect(icon("../package" as never)).rejects.toThrow("Unknown icon");
  });

  test("all icon tokens used by templates are discovered", async () => {
    const files = [
      "src/layout.html",
      ...Array.from(new Bun.Glob("src/parts/*.html").scanSync(".")),
      ...Array.from(new Bun.Glob("src/pages/*.html").scanSync(".")),
    ];
    const availableIcons = await iconNames();
    const referenced = new Set<string>();

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = await Bun.file(file).text();
      for (const match of content.matchAll(/{{icon\(([a-z0-9-]+)\)}}/g)) {
        const name = match[1];
        referenced.add(name);

        expect(availableIcons).toContain(name);
        await expect(icon(name)).resolves.toContain("<svg");
      }
    }

    expect(referenced.size).toBeGreaterThan(0);
  });
});
