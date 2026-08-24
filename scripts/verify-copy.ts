// Site copy gate (release checklist): command and script tables on the site
// must match what create-shibumi actually generates. Runs against the sibling
// checkout so the gate is fixture-backed, not hand-maintained.
//
//   bun run verify:copy [path-to-create-shibumi]
//
// Fails (exit 1) on any drift, listing every finding. The create-shibumi
// checkout defaults to ../shibumi-create (repo/package name stays create-shibumi).
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SITE = resolve(import.meta.dir, "..");
const CLI_REPO = resolve(process.argv[2] ?? join(SITE, "..", "shibumi-create"));

const findings: string[] = [];
function drift(finding: string): void {
  findings.push(finding);
}

if (!existsSync(join(CLI_REPO, "package.json"))) {
  console.error(`create-shibumi checkout not found at ${CLI_REPO}; pass its path as the first argument.`);
  process.exit(1);
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function scriptsOf(template: string): Record<string, string> {
  return (
    JSON.parse(read(join(CLI_REPO, "src", "templates", template, "package.json"))) as {
      scripts: Record<string, string>;
    }
  ).scripts;
}

// 1. dx.md generated-commands block must equal the web template's scripts ------

const dx = read(join(SITE, "src", "content", "dx.md"));
const dxBlock = dx.match(/## Generated commands[\s\S]*?```json\n([\s\S]*?)```/);
if (!dxBlock) {
  drift("dx.md: generated-commands JSON block not found");
} else {
  const documented = (JSON.parse(dxBlock[1]!) as { scripts: Record<string, string> }).scripts;
  const actual = scriptsOf("web");
  const keys = new Set([...Object.keys(documented), ...Object.keys(actual)]);
  for (const key of keys) {
    if (documented[key] !== actual[key]) {
      drift(`dx.md scripts["${key}"] = ${JSON.stringify(documented[key])}, web template has ${JSON.stringify(actual[key])}`);
    }
  }
}

// 2. full-stack = web scripts plus exactly the documented db:* additions -------

const webScripts = scriptsOf("web");
const fullScripts = scriptsOf("full-stack");
const dbExtras = ["db:migrate", "db:backup", "db:restore", "db:status"];
for (const key of Object.keys(webScripts)) {
  if (fullScripts[key] !== webScripts[key]) {
    drift(`full-stack script "${key}" diverges from web: ${JSON.stringify(fullScripts[key])} vs ${JSON.stringify(webScripts[key])}`);
  }
}
for (const key of Object.keys(fullScripts)) {
  if (!(key in webScripts) && !dbExtras.includes(key)) {
    drift(`full-stack has undocumented extra script "${key}" (dx.md only claims db:*)`);
  }
}
for (const key of dbExtras) {
  if (!(key in fullScripts)) drift(`full-stack is missing documented script "${key}"`);
  if (!dx.includes(`\`${key}\``)) drift(`dx.md does not mention full-stack script "${key}"`);
}

// 3. Static template's pinned ship:setup and script surface --------------------

const staticScripts = scriptsOf("static");
if (staticScripts["ship:setup"] !== "bun scripts/ship.ts --setup --static --output-dir public") {
  drift(`static template ship:setup changed: ${staticScripts["ship:setup"]}`);
}
if (staticScripts.shibumi) drift("static template unexpectedly carries the shibumi script");

// 4. Homepage and docs/cli command lines ---------------------------------------

const index = read(join(SITE, "src", "content", "index.md"));
const indexHtml = read(join(SITE, "src", "pages", "index.html"));
const docsCli = read(join(SITE, "src", "content", "docs", "cli", "index.md"));
for (const [file, content] of [
  ["index.md", index],
  ["index.html", indexHtml],
  ["docs/cli/index.md", docsCli],
] as const) {
  if (!content.includes("bun create shibumi@latest")) {
    drift(`${file}: canonical create command missing`);
  }
}
for (const [file, content] of [["index.md", index], ["docs/cli/index.md", docsCli]] as const) {
  if (!content.includes("bun shi add auth")) {
    drift(`${file}: printed extension command missing`);
  }
}
for (const command of ["bun test", "bun run check", "bun run build", "bun install --frozen-lockfile"]) {
  if (!docsCli.includes(command)) drift(`docs/cli acceptance block missing "${command}"`);
}
if (/(^|\s)bun check(\s|$)/m.test(docsCli)) drift('docs/cli says "bun check"; generated projects use "bun run check"');

// 5. Extensions copy vs the shipped bundle list --------------------------------

const lock = JSON.parse(read(join(CLI_REPO, "scripts", "shibumi.lock.json"))) as {
  extensions: Array<{ name: string; version: string }>;
};
const shipped = new Set(lock.extensions.map((entry) => entry.name));
const extensionsMd = read(join(SITE, "src", "content", "docs", "cli", "extensions.md"));
for (const name of shipped) {
  const heading = new RegExp(`^### ${name}`, "im");
  if (!heading.test(extensionsMd)) drift(`extensions.md has no section for shipped extension "${name}"`);
}
for (const match of extensionsMd.matchAll(/^### (\w[\w-]*)( \(planned\))?/gim)) {
  const name = match[1]!.toLowerCase();
  const planned = match[2] !== undefined;
  if (!planned && !shipped.has(name)) {
    drift(`extensions.md claims "${name}" without marking it planned, but the package does not ship it`);
  }
  if (planned && shipped.has(name)) {
    drift(`extensions.md marks shipped extension "${name}" as planned`);
  }
}
if (!extensionsMd.includes("bun shi add <name>")) drift("extensions.md: add command missing");
if (!extensionsMd.includes("bun shi list")) drift("extensions.md: list command missing");
// Every shipped extension must have an entry on both pages (checked above via
// lock.extensions); a "(planned)" section must NOT name a shipped extension
// (checked against the lock in the extensions loop).

// 6. Manifest example fields must exist in the real manifest schema ------------

const authManifest = JSON.parse(read(join(CLI_REPO, "src", "extensions", "auth", "manifest.json"))) as Record<string, unknown>;
const exampleBlocks = [...extensionsMd.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => m[1]!);
for (const block of exampleBlocks) {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(block) as Record<string, unknown>;
  } catch {
    drift(`extensions.md JSON example does not parse: ${block.slice(0, 60)}...`);
    continue;
  }
  for (const key of Object.keys(parsed)) {
    if (!(key in authManifest)) {
      drift(`extensions.md example uses manifest field "${key}" that real manifests do not have`);
    }
  }
  const hooks = parsed.hooks as Array<Record<string, unknown>> | undefined;
  for (const hook of hooks ?? []) {
    for (const key of Object.keys(hook)) {
      if (!["file", "find", "insert", "replace"].includes(key)) {
        drift(`extensions.md hook example uses unknown field "${key}"`);
      }
    }
  }
}

// 7. Vendored Ship version shown on /ship matches the CLI's lock ----------------

const shipMd = read(join(SITE, "src", "content", "ship.md"));
const shipLock = JSON.parse(read(join(CLI_REPO, "scripts", "ship.lock.json"))) as { url: string };
if (!shipMd.includes(shipLock.url)) {
  drift(`ship.md does not reference the CLI's vendored Ship source ${shipLock.url}`);
}

if (findings.length > 0) {
  console.error(`Copy gate: ${findings.length} drift finding(s)\n`);
  for (const finding of findings) console.error(`  - ${finding}`);
  process.exit(1);
}
console.log("Copy gate green: site tables match generated output.");
