#!/usr/bin/env bun

import { chmod, mkdir, rename } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = process.cwd();
const packagePath = join(root, "package.json");
const sourcePath = join(root, "scripts/ship.ts");
const sourceUrl = "https://shibumistack.dev/ship/v27.ts";
const knownSourceHashes = new Set([
  "1faf5c7770705567f7d301ea8824eba8edcaf7cf536424c17a5359a4a08d771b",
  "2bc8d26da0bc86c82d1c85d9fbc05e4bd4b31275a333298c8f61f29531dd7af8",
  "eaa46a5535adc6ea5232dfb8f0bd664d3b3c478dd73b6e0865cd30a18b114e51",
  "37da80e9ff046c19af82db6a068ee5a676622c5e8522ebda126116922658e85b",
  "2a8c1a76512f47a26554b2ac095a6a2b065389995b73dbcf247ca819286d9ef1",
  "9422aab473558304f0f49ed883fe5e7117e617529499a87f22f1e3dbe92fbee0",
  "af2fa78e4d7b55f1a68fac75b577341e5883a553760b91ea770a6ff15d1436b3",
  "5a7b79ef5bb0f4bc1cf801319d9c7d3a115b58b290e79fa3233904e1417cf67a",
  "9ddf35c51c1ca619507ff976f675e6f0cdbb66c75a7090fbee4983adfb4ec4d2",
  "21e9b9fb6d1383703eea04099b380b39d9ca45ed6699e4eb670f09d50af6893b",
  "32903bb3092800de3d27db59996a1f6b462ff96f1872ee788570459ad38b0fce",
  "03477e88985a4e6da3acf8869e1d738526360c53e6d15dd4d5ce002d9f0b6143",
  "4029a3793c24b1dab8be8a93e3c423d424c5f663b263941430934042c48e9511",
  "01f2c0c4e618450628c5b5669a4a4c775e6008550c1b56b973a616baf91c4ccc",
  "21430ef23072f99b092b95484b84241dd770c7ca3134ab7aa45f34ef3101f577",
  "cca1474885693da8f83803e6fff152196ed0f84544c0aecc8ace0c3a66dfb32f",
  "79c48192236b4ebe68ff536744801b8c9cedb41c3736a6bb213cbd3f7ac800ba",
  "cc0e2e09fc19d259ade1d73857ccc409f7255aafb4fc0c06765d88498515ca50",
  "2672056570b0371d8555bcbe3d9318387bff968fdeac04207c538da9ef8f033a",
  "037f6b41762f5074fa79dddc1361622d59dd2054b640050d5c9a04735703c5d6",
  "da3971106ecbe26e362378934e56f250092f7ad78fd07aeaba793f153b011662",
  "dbedadfa99662f53cb628e3bcd14533e15bbe7fcbd989c89870a9aeb6d2df9ca",
  "7945ccadc387169a192c502c202f2107de21d08555468d88ec0dc2e349d016bb",
  "4c0a6298765473a7077f3c911c98040a82fa066e17998b716304eb6908244402",
  "9755d84b296ca308192cc870816bdb36b0c74f8336ee4d00ac0171226ef8fd5c",
  "c60bbe204662a7a4328149ba348e074b2432b65e428f994f36606e423da8e333",
]);
const expectedScripts = {
  ship: "bun scripts/ship.ts",
  "ship:setup": "bun scripts/ship.ts --setup",
  "ship:update": "bun scripts/ship.ts --update",
  "ship:logs": "bun scripts/ship.ts --logs",
};
const devScript = "bun scripts/ship.ts --dev";

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
const dirty = await command(["git", "status", "--short"]);
if (dirty.exitCode !== 0) fail("could not inspect Git worktree.\nNext: verify Git, then rerun installer.");
if (dirty.stdout.trim()) fail(`working tree has uncommitted changes.\n\n${dirty.stdout.trim()}\n\nNext: commit or stash these changes, then rerun installer.`);

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
const currentDev = packageJson.scripts?.dev;
const savedDev = packageJson.scripts?.["dev:app"];
if (currentDev !== undefined && typeof currentDev !== "string") fail("package.json script dev must be a string.");
if (savedDev !== undefined && typeof savedDev !== "string") fail("package.json script dev:app must be a string.");
if (currentDev !== devScript && savedDev !== undefined && savedDev !== currentDev) {
  fail("package.json script dev:app already has another value.\nNext: review dev and dev:app before installing Shibumi ship.");
}

const response = await fetch(sourceUrl, { headers: { accept: "text/plain" } });
if (!response.ok) fail(`ship source returned ${response.status}.\nNext: retry when shibumistack.dev is available.`);
const source = await response.text();
if (!source.startsWith("#!/usr/bin/env bun") || !source.includes("export function runShipCli")) {
  fail("downloaded ship source is invalid.\nNext: retry from https://shibumistack.dev/ship.");
}

const existingFile = Bun.file(sourcePath);
const existingInstall = await existingFile.exists() && await Bun.file(join(root, "shibumi-server.json")).exists();
if (await existingFile.exists()) {
  const existing = await existingFile.text();
  if (existing !== source && !knownSourceHashes.has(hash(existing))) {
    fail("scripts/ship.ts contains owned changes.\nNext: review and merge https://shibumistack.dev/ship/v27.ts manually.");
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
if (currentDev && currentDev !== devScript) packageJson.scripts["dev:app"] = currentDev;
if (packageJson.scripts["dev:app"]) packageJson.scripts.dev = devScript;
await Bun.write(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

if (existingInstall) {
  process.stdout.write("Updated scripts/ship.ts and added bun ship:update. Review and commit the changes.\n");
} else {
  // First installation runs setup with Clack from project dependencies.
  const setup = await command([process.execPath, sourcePath, "--setup", ...process.argv.slice(2)], true);
  if (setup.exitCode !== 0) {
    fail("ship setup is incomplete. Setup files were kept so setup can resume.\nNext: complete the action above, then run bun ship:setup.");
  }
}
