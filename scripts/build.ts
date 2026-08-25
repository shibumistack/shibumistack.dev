#!/usr/bin/env bun

import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import app, { staticHtmlRoutes } from "../src/app";
import packageJson from "../package.json";

const output = "dist";

async function write(path: string, body: string | ArrayBuffer): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body instanceof ArrayBuffer ? new Uint8Array(body) : body);
}

async function responseBody(path: string, accept?: string): Promise<string> {
  const response = await app.request(path, accept ? { headers: { accept } } : undefined);
  if (!response.ok) throw new Error(`cannot build ${path}: HTTP ${response.status}`);
  return response.text();
}

await rm(output, { recursive: true, force: true });
await cp("public", output, { recursive: true });

const htmlRoutes = await staticHtmlRoutes();
for (const route of htmlRoutes) {
  const path = route === "/" ? join(output, "index.html") : join(output, route.slice(1), "index.html");
  await write(path, await responseBody(route, "text/html"));
}

const notFound = await app.request("/404");
if (notFound.status !== 404) throw new Error(`cannot build /404: HTTP ${notFound.status}`);
await write(join(output, "404.html"), await notFound.text());

const contentFiles = (await readdir("src/content", { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => entry.name)
  .sort();
for (const name of [...contentFiles, "README.md", "CONTRIBUTING.md"]) {
  await write(join(output, name), await responseBody(`/${name}`));
}
await write(join(output, "dx"), await responseBody("/dx"));

for (const route of htmlRoutes.filter((route) => route.startsWith("/docs"))) {
  const path = route === "/docs" ? "docs/index.md" : `${route.slice(1)}.md`;
  await write(join(output, path), await responseBody(route, "text/markdown"));
}

await write(join(output, "ship", "latest.ts"), await responseBody("/ship/latest.ts"));
await write(join(output, "install", "ship"), await responseBody("/ship/install-v46.ts"));
await write(join(output, "install", "ship.sh"), await responseBody("/ship/bootstrap-v29.sh"));
await write(join(output, "install", "server"), `#!/bin/sh\nset -eu\ncurl -fsSL https://raw.githubusercontent.com/bitbonsai/shibumi-server/v${packageJson.shibumiServerVersion}/install.sh | bash\n`);

const urls = htmlRoutes.map((route) => `  <url><loc>https://shibumistack.dev${route === "/" ? route : `${route}/`}</loc></url>`).join("\n");
await write(join(output, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
await write(join(output, "httpd.conf"), [
  "E404:404.html",
  "I:index.html",
  ".md:text/plain",
  ".sh:text/plain",
  ".ts:text/plain",
  ".json:application/json",
  ".svg:image/svg+xml",
  ".webp:image/webp",
  "",
].join("\n"));

console.log(`Built ${htmlRoutes.length} HTML routes in ${output}/`);
