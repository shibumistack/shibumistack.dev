import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import type { Context } from "hono";
import { readdir } from "node:fs/promises";
import { YAML } from "bun";

const app = new Hono();

type MediaRange = {
  type: string;
  quality: number;
};

const activePages = ["home", "docs", "roadmap", "brand", "blog"] as const;

type ActivePage = (typeof activePages)[number];

type PageMeta = {
  title: string;
  description: string;
  path: string;
};

type PageFiles = {
  key: string;
  routePath: string;
  pagePath?: string;
  stylePath?: string;
  scriptPath?: string;
  markdownPath?: string;
};

type BlogPost = {
  slug: string;
  title: string;
  date: Date;
  excerpt: string;
  path: string;
};

const safeNameSource = "[a-z0-9][a-z0-9-]*";
const fileStemPattern = new RegExp(`^${safeNameSource}$`);
const iconTokenPattern = new RegExp(`{{icon\\((${safeNameSource})\\)}}`, "g");
const activeTokenPattern = new RegExp(`{{active\\((${safeNameSource})\\)}}`, "g");
const pageRoutePattern = new RegExp(`^\\/(${safeNameSource})\\/?$`);
const blogPostPattern = new RegExp(`^\\/blog\\/(${safeNameSource})$`);
const directMarkdownPattern = /^\/([A-Za-z0-9_-]+)\.md$/;
const unresolvedTokenPattern = /{{[^}]+}}/;
const unresolvedInsertPattern = /<!-- insert:[a-z0-9-]+ -->/;
const iconCache = new Map<string, string>();

const pageMeta: Record<string, PageMeta> = {
  index: {
    title: "Shibumi Stack: refined simplicity for shipping web apps",
    description: "A lean, opinionated web stack for building calm, durable apps with Bun, Hono, Drizzle, Alpine, and Zod.",
    path: "/",
  },
  brand: {
    title: "Brand — Shibumi Stack",
    description: "Shibumi Stack brand assets, logos, colors, and usage guidance.",
    path: "/brand",
  },
  docs: {
    title: "Docs — Shibumi Stack",
    description: "Technical decisions behind Shibumi Stack: Bun, Hono, Drizzle, Alpine, Zod, owned source, and deploy targets.",
    path: "/docs",
  },
  building: {
    title: "Roadmap — Shibumi Stack",
    description: "What ships first, what comes next, and where the design is still open.",
    path: "/building",
  },
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

async function read(path: string): Promise<string> {
  return Bun.file(path).text();
}

async function existingPath(paths: string[]): Promise<string | undefined> {
  for (const path of paths) {
    if (await Bun.file(path).exists()) {
      return path;
    }
  }
}

function parseFrontmatter(text: string): { frontmatter: Record<string, unknown>; body: string } {
  if (!text.startsWith("---")) {
    return { frontmatter: {}, body: text };
  }

  const end = text.indexOf("---", 3);
  if (end === -1) {
    return { frontmatter: {}, body: text };
  }

  return {
    frontmatter: (YAML.parse(text.slice(3, end).trim()) as Record<string, unknown> | undefined) ?? {},
    body: text.slice(end + 3).trimStart(),
  };
}

async function discoverBlogPosts(): Promise<BlogPost[]> {
  const dir = "src/content/blog";
  const posts: BlogPost[] = [];

  try {
    const stat = await import("node:fs/promises").then((fs) => fs.stat(dir));
    if (!stat.isDirectory()) return posts;
  } catch {
    return posts;
  }

  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

    const slug = entry.name.slice(0, -3);
    if (!fileStemPattern.test(slug)) {
      throw new Error(`Unsafe file name in ${dir}: ${entry.name}`);
    }

    const text = await read(`${dir}/${entry.name}`);
    const { frontmatter } = parseFrontmatter(text);
    const date = frontmatter?.date ? new Date(String(frontmatter.date)) : new Date(0);

    posts.push({
      slug,
      title: String(frontmatter?.title || slug),
      date,
      excerpt: String(frontmatter?.excerpt || ""),
      path: `${dir}/${entry.name}`,
    });
  }

  return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

async function discoverNames(dir: string, extension: string): Promise<Set<string>> {
  const names = new Set<string>();
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(extension)) continue;

    const name = entry.name.slice(0, -extension.length);
    if (!fileStemPattern.test(name)) {
      throw new Error(`Unsafe file name in ${dir}: ${entry.name}`);
    }

    names.add(name);
  }

  return names;
}

async function hasDiscoveredName(dir: string, extension: string, name: string): Promise<boolean> {
  if (!fileStemPattern.test(name)) return false;

  const names = await discoverNames(dir, extension);
  return names.has(name);
}

export async function iconNames(): Promise<string[]> {
  return Array.from(await discoverNames("src/icons", ".svg")).sort();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function icon(name: string): Promise<string> {
  if (!(await hasDiscoveredName("src/icons", ".svg", name))) {
    throw new Error(`Unknown icon: ${name}`);
  }

  const cached = iconCache.get(name);
  if (cached) return cached;

  const svg = await read(`src/icons/${name}.svg`);
  iconCache.set(name, svg);
  return svg;
}

function isActivePage(page: string): page is ActivePage {
  return activePages.includes(page as ActivePage);
}

async function replaceAsync(
  content: string,
  pattern: RegExp,
  replace: (match: RegExpMatchArray) => Promise<string> | string,
): Promise<string> {
  let result = "";
  let lastIndex = 0;

  for (const match of content.matchAll(pattern)) {
    const index = match.index ?? 0;
    result += content.slice(lastIndex, index);
    result += await replace(match);
    lastIndex = index + match[0].length;
  }

  return result + content.slice(lastIndex);
}

async function replaceIconTokens(content: string): Promise<string> {
  return replaceAsync(content, iconTokenPattern, async (match) => {
    const name = match[1];
    if (!(await hasDiscoveredName("src/icons", ".svg", name))) {
      throw new Error(`Unknown icon token: ${name}`);
    }
    return icon(name);
  });
}

function replaceActiveTokens(content: string, active?: ActivePage): string {
  return content.replaceAll(activeTokenPattern, (_token, page: string) => {
    if (!isActivePage(page)) {
      throw new Error(`Unknown active page token: ${page}`);
    }
    return active === page ? ' aria-current="page"' : "";
  });
}

function replaceValueTokens(content: string, vars: Record<string, string>): string {
  for (const [key, value] of Object.entries(vars)) {
    content = content.replaceAll(`{{${key}}}`, escapeHtml(value));
  }

  return content;
}

function assertNoTokens(label: string, content: string): void {
  const unresolved = content.match(unresolvedTokenPattern);
  if (unresolved) {
    throw new Error(`Unresolved token in ${label}: ${unresolved[0]}`);
  }
}

function assertNoInserts(content: string): void {
  const unresolved = content.match(unresolvedInsertPattern);
  if (unresolved) {
    throw new Error(`Unresolved insert: ${unresolved[0]}`);
  }
}

async function renderTokens(label: string, content: string, vars: Record<string, string> = {}, active?: ActivePage): Promise<string> {
  content = await replaceIconTokens(content);
  content = replaceActiveTokens(content, active);
  content = replaceValueTokens(content, vars);
  assertNoTokens(label, content);

  return content;
}

async function part(name: string, vars: Record<string, string> = {}, active?: ActivePage): Promise<string> {
  if (!(await hasDiscoveredName("src/parts", ".html", name))) {
    throw new Error(`Unknown part: ${name}`);
  }

  return renderTokens(`part ${name}`, await read(`src/parts/${name}.html`), vars, active);
}

async function nav(active?: ActivePage): Promise<string> {
  return part("nav", {}, active);
}

async function metaTags(meta?: PageMeta): Promise<string> {
  if (!meta) return "";

  return part("meta", {
    url: `https://shibumistack.dev${meta.path}`,
    title: meta.title,
    description: meta.description,
  });
}

function insert(content: string, name: string, value: string): string {
  return content.replaceAll(`<!-- insert:${name} -->`, value);
}

async function pageStyle(path?: string): Promise<string> {
  if (!path) return "";
  return `<style data-page>\n${await read(path)}\n</style>`;
}

async function pageScript(path?: string): Promise<string> {
  if (!path) return "";
  return `<script data-page-script>\n${await read(path)}\n</script>`;
}

async function html(files: PageFiles, active?: ActivePage, meta?: PageMeta): Promise<string> {
  const page = files.pagePath ? await renderTokens(`page ${files.key}`, await read(files.pagePath)) : "";
  let layout = await renderTokens("layout", await read("src/layout.html"), {
    title: meta?.title ?? "Shibumi Stack",
    description: meta?.description ?? "A lean, opinionated web stack for building calm, durable apps.",
    canonical: `https://shibumistack.dev${meta?.path ?? files.routePath}`,
  });
  const footer = await part("footer", { year: String(new Date().getFullYear()) });
  const installDialog = await part("install-dialog");

  layout = insert(layout, "meta", await metaTags(meta));
  layout = insert(layout, "page-style", await pageStyle(files.stylePath));
  layout = insert(layout, "nav", await nav(active));
  layout = insert(layout, "page", page);
  layout = insert(layout, "footer", footer + installDialog);
  layout = insert(layout, "page-script", await pageScript(files.scriptPath));

  assertNoInserts(layout);

  return layout;
}

function activePageFor(key: string): ActivePage | undefined {
  if (key === "index") return "home";
  if (key === "building") return "roadmap";
  if (isActivePage(key)) return key;
}

function parseRouteKey(pathname: string): { key: string; routePath: string } | undefined {
  if (pathname === "/") {
    return { key: "index", routePath: "/" };
  }

  const match = pathname.match(pageRoutePattern);
  if (!match || match[1] === "404") {
    return;
  }

  return { key: match[1], routePath: `/${match[1]}` };
}

async function pageFiles(pathname: string): Promise<PageFiles | undefined> {
  const route = parseRouteKey(pathname);
  if (!route) return;

  const pagePath = await existingPath([
    `src/pages/${route.key}.html`,
    `src/pages/${route.key}/index.html`,
  ]);
  const stylePath = await existingPath([
    `src/pages/${route.key}.css`,
    `src/pages/${route.key}/index.css`,
  ]);
  const scriptPath = await existingPath([
    `src/pages/${route.key}.js`,
    `src/pages/${route.key}/index.js`,
  ]);
  const markdownPath = await existingPath([
    `src/content/${route.key}.md`,
    `src/content/${route.key}/index.md`,
  ]);

  if (!pagePath && !markdownPath) {
    return;
  }

  return {
    key: route.key,
    routePath: route.routePath,
    pagePath,
    stylePath,
    scriptPath,
    markdownPath,
  };
}

function parseDirectMarkdownPath(pathname: string): string | undefined {
  const match = pathname.match(directMarkdownPattern);
  if (!match) return;

  const name = match[1];
  if (name === "README" || name === "CONTRIBUTING") {
    return `${name}.md`;
  }

  return `src/content/${name}.md`;
}

function isSafeHref(href: string): boolean {
  return /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href) || /^\//.test(href) || /^#/.test(href);
}

function escapeCommentMarkers(text: string): string {
  return text.replace(/<!--/g, "&lt;!--").replace(/-->/g, "--&gt;");
}

function safeMarkdownHtml(markdown: string): string {
  return Bun.markdown.render(markdown, {
    html: () => "",
    heading: (children, attrs: { level: number }) => `<h${attrs.level}>${children}</h${attrs.level}>`,
    paragraph: (children) => `<p>${children}</p>`,
    strong: (children) => `<strong>${children}</strong>`,
    emphasis: (children) => `<em>${children}</em>`,
    codespan: (text) => `<code>${escapeCommentMarkers(text)}</code>`,
    code: (text) => `<pre><code>${escapeCommentMarkers(text)}</code></pre>`,
    link: (children, attrs: { href: string }) => {
      if (!isSafeHref(attrs.href)) return children;
      return `<a href="${attrs.href}">${children}</a>`;
    },
    list: (children, attrs: { ordered: boolean }) => {
      const tag = attrs.ordered ? "ol" : "ul";
      return `<${tag}>${children}</${tag}>`;
    },
    listItem: (children) => `<li>${children}</li>`,
    blockquote: (children) => `<blockquote>${children}</blockquote>`,

  });
}

async function renderBlogList(): Promise<string> {
  const posts = await discoverBlogPosts();
  const items = posts
    .map(
      (post) =>
        `<li><a href="/blog/${post.slug}"><time datetime="${post.date.toISOString().split("T")[0]}">${post.date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time><h2>${escapeHtml(post.title)}</h2>${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ""}</a></li>`,
    )
    .join("\n");

  let page = await renderTokens("blog list", await read("src/pages/blog.html"), {}, "blog");
  page = insert(page, "posts", items);

  let layout = await renderTokens("layout", await read("src/layout.html"), {
    title: "Blog — Shibumi Stack",
    description: "Notes on building calm, durable web apps.",
    canonical: "https://shibumistack.dev/blog",
  });
  const footer = await part("footer", { year: String(new Date().getFullYear()) });
  const installDialog = await part("install-dialog");

  layout = insert(layout, "meta", await metaTags({ title: "Blog — Shibumi Stack", description: "Notes on building calm, durable web apps.", path: "/blog" }));
  layout = insert(layout, "page-style", await pageStyle("src/pages/blog.css"));
  layout = insert(layout, "nav", await nav("blog"));
  layout = insert(layout, "page", page);
  layout = insert(layout, "footer", footer + installDialog);
  layout = insert(layout, "page-script", "");

  assertNoInserts(layout);
  return layout;
}

async function renderBlogPost(slug: string): Promise<string | undefined> {
  const posts = await discoverBlogPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return;

  const text = await read(post.path);
  const { frontmatter, body } = parseFrontmatter(text);
  const title = String(frontmatter.title || post.slug);
  const date = post.date;
  const dateIso = date.toISOString().split("T")[0];
  const dateDisplay = date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const postBody = safeMarkdownHtml(body).replaceAll("{{", "&#123;&#123;").replaceAll("}}", "&#125;&#125;");

  let page = await renderTokens(
    `blog post ${slug}`,
    await read("src/pages/blog/post.html"),
    { title: escapeHtml(title), "date-iso": dateIso, date: dateDisplay },
    "blog",
  );
  page = insert(page, "body", postBody);

  let layout = await renderTokens("layout", await read("src/layout.html"), {
    title: `${escapeHtml(title)} — Shibumi Stack`,
    description: "Notes on building calm, durable web apps.",
    canonical: `https://shibumistack.dev/blog/${slug}`,
  });
  const footer = await part("footer", { year: String(new Date().getFullYear()) });
  const installDialog = await part("install-dialog");

  layout = insert(
    layout,
    "meta",
    await metaTags({ title: `${title} — Shibumi Stack`, description: "Notes on building calm, durable web apps.", path: `/blog/${slug}` }),
  );
  layout = insert(layout, "page-style", await pageStyle("src/pages/blog/post.css"));
  layout = insert(layout, "nav", await nav("blog"));
  layout = insert(layout, "page", page);
  layout = insert(layout, "footer", footer + installDialog);
  layout = insert(layout, "page-script", "");

  assertNoInserts(layout);
  return layout;
}

app.use("*", async (c, next) => {
  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    return next();
  }

  const pathname = new URL(c.req.url).pathname;

  if (pathname === "/blog") {
    return c.html(await renderBlogList());
  }

  const blogMatch = pathname.match(blogPostPattern);
  if (blogMatch) {
    const postHtml = await renderBlogPost(blogMatch[1]);
    if (postHtml) {
      return c.html(postHtml);
    }
    return next();
  }

  const directMarkdown = parseDirectMarkdownPath(pathname);
  if (directMarkdown && await Bun.file(directMarkdown).exists()) {
    return markdown(c, directMarkdown, "text/plain");
  }

  const files = await pageFiles(pathname);
  if (!files) {
    return next();
  }

  if (files.markdownPath && (!files.pagePath || wantsMarkdown(c))) {
    return markdown(c, files.markdownPath);
  }

  if (files.pagePath) {
    return c.html(await html(files, activePageFor(files.key), pageMeta[files.key]));
  }

  return next();
});

app.use("/*", serveStatic({ root: "./public" }));

app.notFound(async (c) => {
  return c.html(await html({
    key: "404",
    routePath: "/404",
    pagePath: "src/pages/404.html",
    stylePath: "src/pages/404.css",
  }, undefined, {
    title: "404 — Shibumi Stack",
    description: "Page not found.",
    path: "/404",
  }), 404);
});

export default app;
