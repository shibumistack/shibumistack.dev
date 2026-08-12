import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import type { Context } from "hono";
import { readdir, stat } from "node:fs/promises";
import { YAML } from "bun";
import packageJson from "../package.json";

const app = new Hono();
const serverVersion = packageJson.shibumiServerVersion;
if (!/^\d+\.\d+\.\d+$/.test(serverVersion)) throw new Error("package.json shibumiServerVersion must be a stable semantic version");

type MediaRange = {
  type: string;
  quality: number;
};

const activePages = ["home", "docs", "server", "roadmap", "brand", "blog", "extensions"] as const;

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

type DocPage = {
  path: string;
  title: string;
  description: string;
  section: "Start" | "Server" | "CLI" | "Reference";
  source: string;
};

const safeNameSource = "[a-z0-9][a-z0-9-]*";
const fileStemPattern = new RegExp(`^${safeNameSource}$`);
const iconTokenPattern = new RegExp(`{{icon\\((${safeNameSource})\\)}}`, "g");
const activeTokenPattern = new RegExp(`{{active\\((${safeNameSource})\\)}}`, "g");
const pageRoutePattern = new RegExp(`^\\/(${safeNameSource})\\/?$`);
const blogPostPattern = new RegExp(`^\\/blog\\/(${safeNameSource})$`);
const docsRoutePattern = /^\/docs(?:\/([a-z0-9][a-z0-9/-]*))?\/?$/;
const directMarkdownPattern = /^\/([A-Za-z0-9_-]+)\.md$/;
const unresolvedTokenPattern = /{{[^}]+}}/;
const unresolvedInsertPattern = /<!-- insert:[a-z0-9-]+ -->/;
const iconCache = new Map<string, string>();
const namesCache = new Map<string, Set<string>>();

const assetVersion = String(
  Math.max(
    Bun.file("public/shared.css").lastModified,
    Bun.file("public/main.js").lastModified,
  ),
);

const docs: DocPage[] = [
  { path: "", title: "Shibumi docs", description: "Build apps that keep your zen.", section: "Start", source: "src/content/docs/index.md" },
  { path: "decisions", title: "Technical decisions", description: "Why Shibumi uses seven visible pieces and stays out of your runtime.", section: "Start", source: "src/content/docs.md" },
  { path: "server", title: "Server overview", description: "Deploy signed GitHub pushes to rootless Podman behind Caddy.", section: "Server", source: "src/content/server.md" },
  { path: "server/install", title: "Install server", description: "Prepare a Linux host and install a pinned shibumi-server release.", section: "Server", source: "src/content/docs/server/install.md" },
  { path: "server/add-app", title: "Add an app", description: "Register a domain, repository, checkout, and Caddy route.", section: "Server", source: "src/content/docs/server/add-app.md" },
  { path: "server/ship", title: "Connect project", description: "Connect project-owned ship tooling to shibumi-server.", section: "Server", source: "src/content/docs/server/ship.md" },
  { path: "server/deployments", title: "Deployments", description: "Understand webhook checks, resource guards, health checks, and cutover.", section: "Server", source: "src/content/docs/server/deployments.md" },
  { path: "server/history-rollback", title: "History and rollback", description: "Inspect verified deployments and rebuild an earlier Git commit.", section: "Server", source: "src/content/docs/server/history-rollback.md" },
  { path: "server/operations", title: "Operations", description: "List, update, remove, inspect, and uninstall server state safely.", section: "Server", source: "src/content/docs/server/operations.md" },
  { path: "server/security", title: "Security model", description: "Trust boundaries, secrets, webhook verification, Caddy privileges, and resource limits.", section: "Server", source: "src/content/docs/server/security.md" },
  { path: "cli", title: "CLI preview", description: "Planned create-shibumi and extension command surface.", section: "CLI", source: "src/content/docs/cli/index.md" },
  { path: "reference/server-commands", title: "Server commands", description: "shis command and option reference.", section: "Reference", source: "src/content/docs/reference/server-commands.md" },
];

const pageMeta: Record<string, PageMeta> = {
  index: {
    title: "Shibumi Stack: refined simplicity for shipping web apps",
    description: "A small web stack for apps you can understand and keep: Bun, Hono, Zod, Drizzle, SQLite, Alpine, and Nanostores.",
    path: "/",
  },
  brand: {
    title: "Brand: Shibumi Stack",
    description: "Shibumi Stack brand assets, logos, colors, and usage guidance.",
    path: "/brand",
  },
  docs: {
    title: "Docs: Shibumi Stack",
    description: "Shibumi Stack's seven pieces: Bun, Hono, Zod, Drizzle, SQLite, Alpine, and Nanostores.",
    path: "/docs",
  },
  server: {
    title: "shibumi-server: deploy your app to your own server",
    description: "A small Bun service that validates, builds, and deploys your app to your own server with rootless Podman behind Caddy.",
    path: "/server",
  },
  ship: {
    title: "Ship an existing project: Shibumi Stack",
    description: "Add the owned Shibumi ship workflow to an existing Bun project, connect it to your server, and deploy with one command.",
    path: "/ship",
  },
  building: {
    title: "Roadmap: Shibumi Stack",
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
  return c.body((await Bun.file(path).text()).replaceAll("{{server-version}}", serverVersion), 200, {
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
    const s = await stat(dir);
    if (!s.isDirectory()) return posts;
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
  const key = `${dir}:${extension}`;
  const cached = namesCache.get(key);
  if (cached) return cached;

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

  namesCache.set(key, names);
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
  const page = files.pagePath ? await renderTokens(`page ${files.key}`, await read(files.pagePath), { "server-version": serverVersion }) : "";
  const pageDialog = files.key === "server" ? await part("server-install-dialog") : "";
  let layout = await renderTokens("layout", await read("src/layout.html"), {
    title: meta?.title ?? "Shibumi Stack",
    description: meta?.description ?? "A lean, opinionated web stack for building calm, durable apps.",
    canonical: `https://shibumistack.dev${meta?.path ?? files.routePath}`,
    "asset-version": assetVersion,
  });
  const footer = await part("footer", { year: String(new Date().getFullYear()) });
  const installDialog = await part("install-dialog");

  layout = insert(layout, "meta", await metaTags(meta));
  layout = insert(layout, "page-style", await pageStyle(files.stylePath));
  layout = insert(layout, "nav", await nav(active));
  layout = insert(layout, "page", page + pageDialog);
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
    code: (text, meta?: { language?: string }) => {
      const lang = meta?.language ? ` language="${meta.language}"` : "";
      return `<pre><code${lang}>${escapeCommentMarkers(text)}</code></pre>`;
    },
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

function highlightDocsCode(text: string, language = "text"): string {
  let code = escapeHtml(text);
  const stash: string[] = [];
  const token = (className: string, value: string) => {
    const key = String.fromCodePoint(0xe000 + stash.length);
    stash.push(`<span class="syntax-${className}">${value}</span>`);
    return key;
  };

  if (["sh", "bash", "shell"].includes(language)) {
    code = code
      .replace(/(^|\s)(#[^\n]*)/gm, (_match, lead, value) => `${lead}${token("comment", value)}`)
      .replace(/(&quot;[^\n]*?&quot;|'[^\n]*?')/g, (value) => token("string", value))
      .replace(/(^|[;&|]\s*)(bun|shis|git|curl|cd|systemctl|journalctl|podman|npm)(?=\s|$)/gm, (_match, lead, value) => `${lead}${token("command", value)}`)
      .replace(/(^|\s)(--?[a-z][a-z0-9-]*)(?=\s|$)/g, (_match, lead, value) => `${lead}${token("option", value)}`);
  } else if (language === "json") {
    code = code
      .replace(/(&quot;[^&\n]*?&quot;)(\s*:)?/g, (_match, value, colon) => token(colon ? "key" : "string", value) + (colon ?? ""))
      .replace(/\b(true|false|null)\b/g, (value) => token("literal", value))
      .replace(/\b-?\d+(?:\.\d+)?\b/g, (value) => token("number", value));
  } else if (["ts", "typescript", "js", "javascript"].includes(language)) {
    code = code
      .replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (value) => token("comment", value))
      .replace(/(&quot;[^\n]*?&quot;|'[^\n]*?'|`[^\n]*?`)/g, (value) => token("string", value))
      .replace(/\b(import|export|from|const|let|function|async|await|return|if|else|new|throw|type|interface)\b/g, (value) => token("keyword", value));
  } else if (language === "diff") {
    code = code.replace(/^\+.*$/gm, (value) => token("added", value)).replace(/^-.*$/gm, (value) => token("removed", value));
  }

  return code.replace(/[\ue000-\uf8ff]/g, (key) => stash[key.codePointAt(0)! - 0xe000]);
}

function docsMarkdownHtml(markdown: string): string {
  const slugs = new Map<string, number>();
  return Bun.markdown.render(markdown, {
    html: () => "",
    heading: (children, attrs: { level: number }) => {
      if (attrs.level === 1) return `<h1>${children}</h1>`;
      const base = children.replace(/<[^>]+>/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
      const count = slugs.get(base) ?? 0;
      slugs.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count + 1}`;
      return `<h${attrs.level} id="${id}">${children}<a class="docs-anchor" href="#${id}" aria-label="Link to ${id}">#</a></h${attrs.level}>`;
    },
    paragraph: (children) => `<p>${children}</p>`,
    strong: (children) => `<strong>${children}</strong>`,
    emphasis: (children) => `<em>${children}</em>`,
    codespan: (text) => `<code>${escapeCommentMarkers(text)}</code>`,
    code: (text, meta?: { language?: string }) => {
      const language = (meta?.language ?? "text").toLowerCase();
      if (language === "clack" || language === "run") {
        const lines = text.trimEnd().split("\n");
        const command = lines.shift() ?? "";
        const brand = lines.shift() ?? "渋み  shis (shibumi-server)";
        const typed = lines.map((line) => {
          const separator = line.indexOf("|");
          return separator === -1 ? { type: "success", value: line } : { type: line.slice(0, separator), value: line.slice(separator + 1) };
        });
        const outro = typed.at(-1)?.type === "outro" ? typed.pop() : undefined;
        const steps = typed.filter(({ value }) => value).map(({ type, value }) => `<div class="docs-clack-step docs-clack-${escapeHtml(type)}">${type === "answer" ? '<span class="docs-clack-spacer"></span>' : '<span class="docs-clack-symbol" aria-hidden="true"></span>'}<span>${highlightDocsCode(value, "text")}</span></div>`).join("");
        const toggle = language === "run" ? '<button class="docs-return" type="button" aria-expanded="false">Output</button>' : "";
        return `<div class="docs-clack${language === "run" ? " docs-clack-collapsible" : ""}"><div class="docs-clack-command"><span>›</span><code>${highlightDocsCode(command, "sh")}</code>${toggle}<button class="docs-copy copy-command" type="button" data-copy-code aria-label="Copy session">Copy</button></div><div class="docs-clack-flow"><div class="docs-clack-brand"><span aria-hidden="true">┌</span><strong>${escapeHtml(brand)}</strong></div>${steps}<div class="docs-clack-outcome"><span aria-hidden="true">└</span><div><strong>${escapeHtml(outro?.value ?? "Complete")}</strong></div></div></div><code class="docs-clack-source">${escapeHtml(text)}</code></div>`;
      }
      const terminal = ["sh", "bash", "shell", "text"].includes(language);
      return `<div class="docs-code ${terminal ? "docs-terminal" : "docs-source"}" data-language="${escapeHtml(language)}"><div class="docs-code-bar">${terminal ? "" : `<span>${escapeHtml(language)}</span>`}<button class="docs-copy copy-command" type="button" data-copy-code aria-label="Copy code">Copy</button></div><pre><code>${highlightDocsCode(text, language)}</code></pre></div>`;
    },
    link: (children, attrs: { href: string }) => isSafeHref(attrs.href) ? `<a href="${attrs.href}">${children}</a>` : children,
    list: (children, attrs: { ordered: boolean }) => `<${attrs.ordered ? "ol" : "ul"}>${children}</${attrs.ordered ? "ol" : "ul"}>`,
    listItem: (children) => `<li>${children}</li>`,
    table: (children) => `<div class="docs-table-wrap"><table>${children}</table></div>`,
    thead: (children) => `<thead>${children}</thead>`,
    tbody: (children) => `<tbody>${children}</tbody>`,
    tr: (children) => `<tr>${children}</tr>`,
    th: (children) => `<th>${children}</th>`,
    td: (children) => `<td>${children}</td>`,
    blockquote: (children) => {
      const callout = /^<p><strong>(Released now|Note|Warning|Important):<\/strong>/.exec(children);
      if (!callout) return `<blockquote><span class="docs-quote-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/></svg></span><div>${children}</div></blockquote>`;
      const tone = callout[1] === "Warning" ? "warning" : "info";
      return `<aside class="docs-callout docs-callout-${tone}" role="note"><span class="docs-callout-icon" aria-hidden="true">${tone === "warning" ? "!" : "i"}</span><div>${children}</div></aside>`;
    },
  });
}

function docsSidebar(activePath: string): string {
  const sections: DocPage["section"][] = ["Start", "Server", "CLI", "Reference"];
  return sections.map((section) => {
    const links = docs.filter((page) => page.section === section).map((page) => {
      const href = page.path ? `/docs/${page.path}` : "/docs";
      return `<a href="${href}"${page.path === activePath ? ' aria-current="page"' : ""}>${escapeHtml(page.title)}</a>`;
    }).join("");
    return `<div class="docs-nav-group"><h2>${section}</h2>${links}</div>`;
  }).join("");
}

async function renderDocs(path: string): Promise<string | undefined> {
  const page = docs.find((item) => item.path === path);
  if (!page || !await Bun.file(page.source).exists()) return;
  const source = (await read(page.source)).replaceAll("{{server-version}}", serverVersion);
  const current = docs.indexOf(page);
  const previous = docs[current - 1];
  const next = docs[current + 1];
  const link = (item: DocPage, direction: string) => `<a class="docs-pager-${direction}" href="${item.path ? `/docs/${item.path}` : "/docs"}"><span>${direction === "prev" ? "Previous" : "Next"}</span><strong>${escapeHtml(item.title)}</strong></a>`;

  let body = await renderTokens("docs shell", await read("src/pages/docs/index.html"), {
    "docs-title": page.title,
    "docs-description": page.description,
    "docs-section": page.section,
  });
  body = insert(body, "docs-sidebar", docsSidebar(path));
  body = insert(body, "docs-content", docsMarkdownHtml(source));
  body = insert(body, "docs-pager", `${previous ? link(previous, "prev") : ""}${next ? link(next, "next") : ""}`);

  const meta: PageMeta = {
    title: `${page.title}: Shibumi Stack Docs`,
    description: page.description,
    path: page.path ? `/docs/${page.path}` : "/docs",
  };
  let layout = await renderTokens("layout", await read("src/layout.html"), {
    title: meta.title,
    description: meta.description,
    canonical: `https://shibumistack.dev${meta.path}`,
    "asset-version": assetVersion,
  });
  layout = insert(layout, "meta", await metaTags(meta));
  layout = insert(layout, "page-style", await pageStyle("src/pages/docs/index.css"));
  layout = insert(layout, "nav", await nav("docs"));
  layout = insert(layout, "page", body);
  layout = insert(layout, "footer", await part("footer", { year: String(new Date().getFullYear()) }) + await part("install-dialog"));
  layout = insert(layout, "page-script", await pageScript("src/pages/docs/index.js"));
  assertNoInserts(layout);
  return layout;
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
    title: "Blog: Shibumi Stack",
    description: "Notes on building calm, durable web apps.",
    canonical: "https://shibumistack.dev/blog",
    "asset-version": assetVersion,
  });
  const footer = await part("footer", { year: String(new Date().getFullYear()) });
  const installDialog = await part("install-dialog");

  layout = insert(layout, "meta", await metaTags({ title: "Blog: Shibumi Stack", description: "Notes on building calm, durable web apps.", path: "/blog" }));
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
    title: `${escapeHtml(title)}: Shibumi Stack`,
    description: "Notes on building calm, durable web apps.",
    canonical: `https://shibumistack.dev/blog/${slug}`,
    "asset-version": assetVersion,
  });
  const footer = await part("footer", { year: String(new Date().getFullYear()) });
  const installDialog = await part("install-dialog");

  layout = insert(
    layout,
    "meta",
    await metaTags({ title: `${title}: Shibumi Stack`, description: "Notes on building calm, durable web apps.", path: `/blog/${slug}` }),
  );
  layout = insert(layout, "page-style", await pageStyle("src/pages/blog/post.css"));
  layout = insert(layout, "nav", await nav("blog"));
  layout = insert(layout, "page", page);
  layout = insert(layout, "footer", footer + installDialog);
  layout = insert(layout, "page-script", "");

  assertNoInserts(layout);
  return layout;
}

app.get("/install/server", (c) => c.redirect(`https://raw.githubusercontent.com/bitbonsai/shibumi-server/v${serverVersion}/install.sh`, 302));
app.get("/install/ship", (c) => c.redirect("/ship/install-v9.ts", 302));
app.get("/install/ship.sh", (c) => c.redirect("/ship/bootstrap-v1.sh", 302));
app.get("/ship/bootstrap-v1.sh", async (c) => c.body(await read("public/ship/bootstrap-v1.sh"), 200, {
  "Cache-Control": "public, max-age=31536000, immutable",
  "Content-Disposition": 'inline; filename="shibumi-ship.sh"',
  "Content-Type": "text/plain; charset=utf-8",
}));
for (const version of ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9"]) {
  app.get(`/ship/install-${version}.ts`, async (c) => c.body(await read(`public/ship/install-${version}.ts`), 200, {
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Disposition": 'inline; filename="shibumi-ship.ts"',
    "Content-Type": "text/plain; charset=utf-8",
  }));
}
for (const version of ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11"]) {
  app.get(`/ship/${version}.ts`, async (c) => c.body(await read(`public/ship/${version}.ts`), 200, {
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Disposition": 'inline; filename="ship.ts"',
    "Content-Type": "text/plain; charset=utf-8",
  }));
}

app.use("*", async (c, next) => {
  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    return next();
  }

  const pathname = new URL(c.req.url).pathname;

  const docsMatch = pathname.match(docsRoutePattern);
  if (docsMatch) {
    const docPath = docsMatch[1] ?? "";
    const doc = docs.find((item) => item.path === docPath);
    if (doc && wantsMarkdown(c)) return markdown(c, doc.source);
    const docHtml = await renderDocs(docPath);
    if (docHtml) return c.html(docHtml);
    return next();
  }

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
    title: "404: Shibumi Stack",
    description: "Page not found.",
    path: "/404",
  }), 404);
});

export default app;
