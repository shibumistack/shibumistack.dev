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
  { href: "#install", label: "Install", key: "install" },
  { href: "/docs", label: "Docs", key: "docs" },
  { href: "/building", label: "Roadmap", key: "roadmap" },
  { href: "/brand", label: "Brand", key: "brand" },
];

const themeToggle = `<button class="theme-toggle" type="button" aria-label="Toggle theme"><svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg><svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>`;

const installDialog = `<dialog class="install-dialog" id="install-dialog">
  <div class="install-dialog-content">
    <div class="install-dialog-head">
      <span class="kanji">渋み</span>
      <span>Get started</span>
    </div>
    <p class="install-dialog-hint">Run this in your terminal to scaffold a new project.</p>
    <div class="install-dialog-command">
      <span class="prompt-mark">›</span>
      <code>bun create shibumi@latest</code>
      <button class="copy-command" type="button" data-copy="bun create shibumi@latest" aria-label="Copy install command"><svg class="icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></button>
    </div>
    <p class="install-dialog-alt">or <code>npm create shibumi@latest</code></p>
  </div>
</dialog>`;

function siteNav(active?: NavItem["key"]): string {
  const links = navItems
    .map((item) => {
      if (item.key === "install") {
        return `<button class="nav-install" type="button">${item.label}</button>`;
      }
      const current = item.key === active ? ' aria-current="page"' : "";
      return `<a href="${item.href}"${current}>${item.label}</a>`;
    })
    .join("");

  return `<header>
            <a class="mark" href="/" aria-label="Shibumi Stack home"><img src="/brand/logos/shibumistack-light.png" alt=""><span>shibumistack<span class="mark-tld">.dev</span></span></a>
            <nav aria-label="Primary">${links}<a class="github-link" href="https://github.com/shibumistack/shibumistack.dev" aria-label="GitHub repository"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.86c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg></a>${themeToggle}</nav>
        </header>`;
}

function siteFooter(): string {
  return `<footer class="site-footer">
            <span>MIT License &copy; ${new Date().getFullYear()} Shibumi Stack</span>
            <span class="made-with">Made with &hearts; by <a href="https://bitbonsai.com">@bitbonsai</a></span>
            <div class="footer-links">
                <a href="/docs">Docs</a>
                <a href="/building">Roadmap</a>
                <a href="https://github.com/shibumistack" aria-label="GitHub">GitHub</a>
                <a href="mailto:info@shibumistack.dev">Contact</a>
            </div>
        </footer>`;
}

function siteMeta(title: string, description: string, path: string): string {
  const url = `https://shibumistack.dev${path}`;
  return `<meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="https://shibumistack.dev/og.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="en_US">
    <meta property="og:site_name" content="Shibumi Stack">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${url}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="https://shibumistack.dev/og.png">
    <meta name="twitter:creator" content="@bitbonsai">`;
}

async function html(path: string, active?: NavItem["key"], meta?: { title: string; description: string; path: string }): Promise<string> {
  let content = (await Bun.file(path).text())
    .replace("<!-- shibumi-nav -->", siteNav(active))
    .replace("<!-- shibumi-footer -->", siteFooter() + installDialog);
  if (meta) {
    content = content.replace("<!-- shibumi-meta -->", siteMeta(meta.title, meta.description, meta.path));
  }
  return content;
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
  return c.html(await html("src/brand.html", "brand", {
    title: "Brand — Shibumi Stack",
    description: "Shibumi Stack brand assets, logos, colors, and usage guidance.",
    path: "/brand",
  }));
});

app.get("/docs", async (c) => {
  if (wantsMarkdown(c)) {
    return markdown(c, "public/docs.md");
  }
  return c.html(await html("src/docs.html", "docs", {
    title: "Docs — Shibumi Stack",
    description: "Technical decisions behind Shibumi Stack: Bun, Hono, Drizzle, Alpine, Zod, owned source, and deploy targets.",
    path: "/docs",
  }));
});

app.get("/building", async (c) => {
  if (wantsMarkdown(c)) {
    return markdown(c, "public/building.md");
  }
  return c.html(await html("src/building.html", "roadmap", {
    title: "Roadmap — Shibumi Stack",
    description: "What ships first, what comes next, and where the design is still open.",
    path: "/building",
  }));
});

app.get("/index.md", (c) => markdown(c, "public/index.md", "text/plain"));
app.get("/brand.md", (c) => markdown(c, "public/brand.md", "text/plain"));
app.get("/docs.md", (c) => markdown(c, "public/docs.md", "text/plain"));
app.get("/building.md", (c) => markdown(c, "public/building.md", "text/plain"));
app.get("/dx.md", (c) => markdown(c, "public/dx.md", "text/plain"));
app.get("/README.md", (c) => markdown(c, "public/README.md", "text/plain"));
app.get("/CONTRIBUTING.md", (c) => markdown(c, "public/CONTRIBUTING.md", "text/plain"));

app.use("/*", serveStatic({ root: "./public" }));

app.notFound(async (c) => {
  return c.html(await html("src/404.html", undefined, {
    title: "404 — Shibumi Stack",
    description: "Page not found.",
    path: "/404",
  }), 404);
});

export default app;
