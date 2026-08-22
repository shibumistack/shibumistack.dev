import { beforeAll, describe, expect, test } from "bun:test";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

beforeAll(() => {
  const build = Bun.spawnSync([process.execPath, "scripts/build.ts"], { cwd: root });
  if (build.exitCode !== 0) throw new Error(build.stderr.toString() || build.stdout.toString());
});

describe("static artifact", () => {
  test("contains rendered routes, Markdown, installers, and custom 404", async () => {
    expect(await Bun.file(resolve(root, "dist/index.html")).text()).toContain("Simple apps,");
    const serverDocs = await Bun.file(resolve(root, "dist/docs/server/index.html")).text();
    expect(serverDocs).toContain("Built and uploaded a1b2c3d");
    expect(serverDocs).toContain('<link rel="canonical" href="https://shibumistack.dev/docs/server/">');
    expect(await Bun.file(resolve(root, "dist/docs/server.md")).text()).toContain("# shibumi-server");
    expect(await Bun.file(resolve(root, "dist/docs/forms.md")).text()).toContain("# Shibumi Forms");
    expect(await Bun.file(resolve(root, "dist/docs/cli.md")).text()).toContain("## Full-stack SQLite");
    expect(await Bun.file(resolve(root, "dist/404.html")).text()).toContain("Nothing here.");
    expect((await Bun.file(resolve(root, "dist/install/ship.sh")).text()).startsWith("#!/bin/sh")).toBeTrue();
    expect(await Bun.file(resolve(root, "dist/install/server")).text()).toContain("raw.githubusercontent.com/bitbonsai/shibumi-server");
    expect(await Bun.file(resolve(root, "dist/httpd.conf")).text()).toContain("E404:404.html");
  });

  test("contains no unresolved template markers", async () => {
    for (const path of new Bun.Glob("dist/**/*.html").scanSync(root)) {
      expect(await Bun.file(resolve(root, path)).text()).not.toMatch(/{{[^}]+}}|<!-- insert:/);
    }
  });
});
