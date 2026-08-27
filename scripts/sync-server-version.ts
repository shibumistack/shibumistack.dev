#!/usr/bin/env bun

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const packagePath = join(import.meta.dir, "..", "package.json");
const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as Record<string, unknown> & { shibumiServerVersion?: unknown };
const expected = process.argv[2];
if (expected !== undefined && !/^\d+\.\d+\.\d+$/.test(expected)) throw new Error("expected version must use semantic versioning");
const requested = expected ?? "latest";
const registryUrl = new URL(`https://registry.npmjs.org/shibumi-server/${requested}`);
registryUrl.searchParams.set("cachebust", String(Date.now()));
const response = await fetch(registryUrl, {
  cache: "no-store",
  headers: { accept: "application/json", "cache-control": "no-cache" },
});
if (!response.ok) throw new Error(`npm registry returned ${response.status} for ${requested}`);
const value: unknown = await response.json();
const version = value && typeof value === "object" ? (value as { version?: unknown }).version : undefined;
if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error("npm registry returned an invalid shibumi-server version");
if (expected !== undefined && version !== expected) throw new Error(`npm returned ${version}; waiting for ${expected}`);

const source = await fetch(`https://raw.githubusercontent.com/shibumistack/shibumi-server/v${version}/install.sh`);
if (!source.ok || !(await source.text()).startsWith("#!/")) throw new Error(`GitHub tag v${version} has no reviewed install.sh`);

if (packageJson.shibumiServerVersion === version) {
  console.log(`shibumi-server ${version} already pinned`);
} else {
  packageJson.shibumiServerVersion = version;
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  console.log(`pinned shibumi-server ${version}`);
}
