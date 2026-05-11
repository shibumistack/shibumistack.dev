import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import type { Context } from "hono";

const app = new Hono();

type MediaRange = {
  type: string;
  quality: number;
};

function parseAccept(accept: string): MediaRange[] {
  return accept
    .split(",")
    .map((part) => {
      const [type = "", ...params] = part.trim().split(";");
      const qualityParam = params.find((param) => param.trim().startsWith("q="));
      const quality = qualityParam ? Number(qualityParam.split("=")[1]) : 1;

      return {
        type: type.toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 1,
      };
    })
    .filter((range) => range.type.length > 0);
}

function qualityFor(ranges: MediaRange[], type: string): number {
  return ranges.find((range) => range.type === type)?.quality ?? 0;
}

function wantsMarkdown(c: Context): boolean {
  const accept = c.req.header("accept");

  if (!accept) return false;

  const ranges = parseAccept(accept);
  const markdown = qualityFor(ranges, "text/markdown");
  const html = qualityFor(ranges, "text/html");

  return markdown > 0 && markdown >= html;
}

async function markdown(c: Context, path: string, contentType = "text/markdown") {
  return c.body(await Bun.file(path).text(), 200, {
    "content-type": `${contentType}; charset=utf-8`,
    "content-disposition": "inline",
  });
}

type NavItem = {
  href: string;
  label: string;
  key: "install" | "docs" | "roadmap" | "brand";
};

const navItems: NavItem[] = [
  { href: "/#install", label: "Install", key: "install" },
  { href: "/docs", label: "Docs", key: "docs" },
  { href: "/building", label: "Roadmap", key: "roadmap" },
  { href: "/brand", label: "Brand", key: "brand" },
];

function siteNav(active?: NavItem["key"]): string {
  const links = navItems
    .map((item) => {
      const current = item.key === active ? ' aria-current="page"' : "";
      return `<a href="${item.href}"${current}>${item.label}</a>`;
    })
    .join("");

  return `<header>
            <a class="mark" href="/" aria-label="Shibumi Stack home"><img src="/brand/logos/shibumistack-light.png" alt=""><span>shibumistack<span class="mark-tld">.dev</span></span></a>
            <nav aria-label="Primary">${links}<a class="github-link" href="https://github.com/shibumistack/shibumistack.dev" aria-label="GitHub repository"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.86c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg></a></nav>
        </header>`;
}

async function html(path: string, active?: NavItem["key"]): Promise<string> {
  return (await Bun.file(path).text()).replace("<!-- shibumi-nav -->", siteNav(active));
}

app.get("/", async (c) => {
  if (wantsMarkdown(c)) {
    return markdown(c, "public/index.md");
  }
  return c.html(await html("src/index.html"));
});

app.get("/brand", async (c) => {
  if (wantsMarkdown(c)) {
    return markdown(c, "public/brand.md");
  }
  return c.html(await html("src/brand.html", "brand"));
});

app.get("/docs", async (c) => {
  if (wantsMarkdown(c)) {
    return markdown(c, "public/docs.md");
  }
  return c.html(await html("src/docs.html", "docs"));
});

app.get("/building", async (c) => {
  if (wantsMarkdown(c)) {
    return markdown(c, "public/building.md");
  }
  return c.html(await html("src/building.html", "roadmap"));
});

app.get("/index.md", (c) => markdown(c, "public/index.md", "text/plain"));
app.get("/brand.md", (c) => markdown(c, "public/brand.md", "text/plain"));
app.get("/docs.md", (c) => markdown(c, "public/docs.md", "text/plain"));
app.get("/building.md", (c) => markdown(c, "public/building.md", "text/plain"));
app.get("/dx.md", (c) => markdown(c, "public/dx.md", "text/plain"));
app.get("/README.md", (c) => markdown(c, "public/README.md", "text/plain"));
app.get("/CONTRIBUTING.md", (c) => markdown(c, "public/CONTRIBUTING.md", "text/plain"));

app.use("/*", serveStatic({ root: "./public" }));

export default app;
