#!/usr/bin/env bun

import { chmod, mkdir, rename } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = process.cwd();
const packagePath = join(root, "package.json");
const sourcePath = join(root, "scripts/ship.ts");
const sourceUrl = "https://shibumistack.dev/ship/v8.ts";
const knownSourceHashes = new Set([
  "9422aab473558304f0f49ed883fe5e7117e617529499a87f22f1e3dbe92fbee0",
  "af2fa78e4d7b55f1a68fac75b577341e5883a553760b91ea770a6ff15d1436b3",
  "5a7b79ef5bb0f4bc1cf801319d9c7d3a115b58b290e79fa3233904e1417cf67a",
  "9ddf35c51c1ca619507ff976f675e6f0cdbb66c75a7090fbee4983adfb4ec4d2",
  "21e9b9fb6d1383703eea04099b380b39d9ca45ed6699e4eb670f09d50af6893b",
  "32903bb3092800de3d27db59996a1f6b462ff96f1872ee788570459ad38b0fce",
  "03477e88985a4e6da3acf8869e1d738526360c53e6d15dd4d5ce002d9f0b6143",
]);
const expectedScripts = {
  ship: "bun scripts/ship.ts",
  "ship:setup": "bun scripts/ship.ts --setup",
};

async function command(args: string[], inherit = false): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const child = Bun.spawn(args, {
    cwd: root,
    stdin: inherit ? "inherit" : "ignore",
    stdout: inherit ? "inherit" : "pipe",
    stderr: inherit ? "inherit" : "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    inherit ? Promise.resolve("") : new Response(child.stdout).text(),
    inherit ? Promise.resolve("") : new Response(child.stderr).text(),
  ]);
  return { exitCode, stdout, stderr };
}

function hash(value: string): string {
  return new Bun.CryptoHasher("sha256").update(value).digest("hex");
}

function fail(message: string): never {
  process.stderr.write(`shibumi ship installer failed: ${message}\n`);
  process.exit(1);
}

const packageFile = Bun.file(packagePath);
if (!await packageFile.exists()) fail("package.json not found.\nNext: run this command from Bun project root.");

const gitRoot = await command(["git", "rev-parse", "--show-toplevel"]);
if (gitRoot.exitCode !== 0 || resolve(gitRoot.stdout.trim()) !== resolve(root)) {
  fail("current directory is not Git repository root.\nNext: cd to project root and rerun installer.");
}

let packageJson: { scripts?: Record<string, unknown> };
try {
  packageJson = JSON.parse(await packageFile.text());
} catch {
  fail("package.json is invalid JSON.\nNext: repair package.json and rerun installer.");
}

for (const [name, expected] of Object.entries(expectedScripts)) {
  const current = packageJson.scripts?.[name];
  if (current !== undefined && current !== expected) {
    fail(`package.json script ${name} already has another value.\nNext: review that script before installing Shibumi ship.`);
  }
}

const response = await fetch(sourceUrl, { headers: { accept: "text/plain" } });
if (!response.ok) fail(`ship source returned ${response.status}.\nNext: retry when shibumistack.dev is available.`);
const source = await response.text();
if (!source.startsWith("#!/usr/bin/env bun") || !source.includes("export function runShipCli")) {
  fail("downloaded ship source is invalid.\nNext: retry from https://shibumistack.dev/ship.");
}

const existingFile = Bun.file(sourcePath);
if (await existingFile.exists()) {
  const existing = await existingFile.text();
  if (existing !== source && !knownSourceHashes.has(hash(existing))) {
    fail("scripts/ship.ts contains owned changes.\nNext: review and merge https://shibumistack.dev/ship/v8.ts manually.");
  }
}

// Keep Clack in project dependencies for every future ship run.
const dependency = await command([process.execPath, "add", "--dev", "@clack/prompts@^0.7.0"]);
if (dependency.exitCode !== 0) fail(dependency.stderr.trim() || "could not install @clack/prompts.\nNext: run bun install, then retry.");

await mkdir(join(root, "scripts"), { recursive: true });
const temporarySource = `${sourcePath}.tmp-${process.pid}`;
await Bun.write(temporarySource, source);
await chmod(temporarySource, 0o644);
await rename(temporarySource, sourcePath);

packageJson = JSON.parse(await Bun.file(packagePath).text());
packageJson.scripts = { ...packageJson.scripts, ...expectedScripts };
await Bun.write(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

// The owned script now runs setup with Clack from project dependencies.
const setup = await command([process.execPath, sourcePath, "--setup"], true);
if (setup.exitCode !== 0) fail("ship setup did not complete.\nNext: rerun bun run ship:setup.");
