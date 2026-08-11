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
    expect(body).toContain('<meta name="theme-color" content="#f7f3e8">');
    expect(body).toContain('<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f7f3e8">');
    expect(body).toContain('<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1e1510">');
    expect(body).toContain('<meta name="color-scheme" content="light dark">');
    expect(body).toContain('aria-label="Replay terminal animation"');
    expect(body).toContain("terminal-label-success");
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
    expect(body).toContain("Dogfooding Shibumi");
  });

  test("serves individual blog posts", async () => {
    const res = await app.request("/blog/dogfooding");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Dogfooding Shibumi");
    expect(body).toContain("owned source");
  });

  test("returns 404 for unknown blog posts", async () => {
    const res = await app.request("/blog/not-a-post");

    expect(res.status).toBe(404);
  });

  test("serves the shibumi-server page and Markdown alternate", async () => {
    const htmlRes = await app.request("/server");
    const htmlBody = await htmlRes.text();

    expect(htmlRes.status).toBe(200);
    expect(htmlBody).toContain("No cloud deploy service");
    expect(htmlBody).toContain("Bad builds don't go live");
    expect(htmlBody).toContain("rootless Podman");
    expect(htmlBody).toContain("What do these checks mean?");
    expect(htmlBody.match(/class="deploy-check\b/g)?.length).toBe(9);
    expect(htmlBody).toContain("Dogfooding with MCPVault");
    expect(htmlBody).toContain("Ready to add apps");
    expect(htmlBody).toContain("Adding apps");
    expect(htmlBody).toContain('"curl -fsSL https://shibumistack.dev/install/server | bash"');
    expect(htmlBody).toContain('"shibumi-server add sub.example.com"');
    expect(htmlBody.match(/aria-label="Replay terminal animation"/g)?.length).toBe(3);
    expect(htmlBody).toContain("terminal-label-success");
    expect(htmlBody).toContain('href="/server" aria-current="page"');
    expect(htmlBody).toContain('data-dialog="server-install-dialog"');
    expect(htmlBody).toContain("data-page-script");

    const markdownRes = await app.request("/server", {
      headers: { accept: "text/markdown" },
    });
    expect(markdownRes.status).toBe(200);
    expect(await markdownRes.text()).toContain("# shibumi-server");
  });

  test("redirects the server installer to its source", async () => {
    const res = await app.request("/install/server");

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://raw.githubusercontent.com/bitbonsai/shibumi-server/v0.1.4/install.sh");
  });

  test("serves extensions page", async () => {
    const res = await app.request("/extensions");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Extensions");
    expect(body).toContain("shibumi add");
    expect(body).toContain("auth");
    expect(body).toContain("images");
    expect(body).toContain("email");
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
