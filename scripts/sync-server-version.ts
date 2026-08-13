#!/usr/bin/env bun

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const packagePath = join(import.meta.dir, "..", "package.json");
const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as Record<string, unknown> & { shibumiServerVersion?: unknown };
const expected = process.argv[2];
if (expected !== undefined && !/^\d+\.\d+\.\d+$/.test(expected)) throw new Error("expected version must use semantic versioning");
const response = await fetch("https://registry.npmjs.org/shibumi-server/latest", { headers: { accept: "application/json" } });
if (!response.ok) throw new Error(`npm registry returned ${response.status}`);
const value: unknown = await response.json();
const version = value && typeof value === "object" ? (value as { version?: unknown }).version : undefined;
if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error("npm registry returned an invalid shibumi-server version");
if (expected !== undefined && version !== expected) throw new Error(`npm latest is ${version}; waiting for ${expected}`);

const source = await fetch(`https://raw.githubusercontent.com/bitbonsai/shibumi-server/v${version}/install.sh`);
if (!source.ok || !(await source.text()).startsWith("#!/")) throw new Error(`GitHub tag v${version} has no reviewed install.sh`);

if (packageJson.shibumiServerVersion === version) {
  console.log(`shibumi-server ${version} already pinned`);
} else {
  packageJson.shibumiServerVersion = version;
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  console.log(`pinned shibumi-server ${version}`);
}
