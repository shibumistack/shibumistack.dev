#!/usr/bin/env bun

import { chmod, cp, mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const scenarios = new Set(["clean-ship", "commit-and-ship-dirty-tree", "health-failure", "explicit-rollback", "read-only-status", "non-shibumi-near-miss"]);
const [scenario, destinationArg] = process.argv.slice(2);
if (!scenario || !scenarios.has(scenario) || !destinationArg) {
  throw new Error(`usage: bun prepare-fixture.ts <${[...scenarios].join("|")}> <new-directory>`);
}

const destination = resolve(destinationArg);
try {
  await stat(destination);
  throw new Error(`fixture destination already exists: ${destination}`);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const source = join(import.meta.dir, "fixtures", scenario === "non-shibumi-near-miss" ? "flask" : "shibumi");
await mkdir(dirname(destination), { recursive: true });
await cp(source, destination, { recursive: true });

async function git(...args: string[]): Promise<void> {
  const result = Bun.spawnSync(["git", "-C", destination, ...args], { stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error(result.stderr.toString().trim() || `git ${args[0]} failed`);
}

await git("init", "-b", "main");
await git("config", "user.name", "Shibumi Eval");
await git("config", "user.email", "eval@fixture.invalid");
if (scenario !== "non-shibumi-near-miss") await chmod(join(destination, "bin", "curl"), 0o755);
await git("add", "AGENTS.md", ...(scenario === "non-shibumi-near-miss"
  ? ["app.py", "compose.yaml"]
  : ["package.json", "shibumi-server.json", "scripts/ship.ts", "src/parts/nav.html", "notes/todo.md", "bin/curl"]));
await git("commit", "-m", "Create safe deployment fixture");
await git("init", "--bare", join(destination, ".git", "eval-origin.git"));
await git("remote", "add", "origin", join(destination, ".git", "eval-origin.git"));
await git("push", "-u", "origin", "main");

if (scenario !== "non-shibumi-near-miss") {
  await writeFile(join(destination, ".git", "ship-eval-mode"), `${scenario}\n`);
}
if (scenario === "commit-and-ship-dirty-tree") {
  await writeFile(join(destination, "src", "parts", "nav.html"), "<nav><a href=\"/docs\">Docs</a></nav>\n");
  await writeFile(join(destination, "notes", "todo.md"), "Unrelated changed private scratch note.\n");
}

console.log(JSON.stringify({
  scenario,
  cwd: destination,
  env: scenario === "non-shibumi-near-miss" ? {} : { PATH: `${join(destination, "bin")}:${process.env.PATH}` },
}, null, 2));
