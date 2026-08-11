import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  copyTemplate,
  generateDeployConfig,
  installExtension,
  listExtensions,
  optimizeImages,
} from "../src/utils";
import type { Template } from "../src/utils";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "shibumi-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

// ── Templates ───────────────────────────────────────────────────────

describe("copyTemplate", () => {
  it("copies bare with all critical files", () => {
    copyTemplate("bare", tempDir);
    expect(existsSync(join(tempDir, "package.json"))).toBe(true);
    expect(existsSync(join(tempDir, "src", "app.ts"))).toBe(true);
    expect(existsSync(join(tempDir, "src", "server.ts"))).toBe(true);
    expect(existsSync(join(tempDir, "test", "app.test.ts"))).toBe(true);
  });

  it("copies blog with content directory", () => {
    copyTemplate("blog", tempDir);
    expect(existsSync(join(tempDir, "content", "hello.md"))).toBe(true);
    expect(existsSync(join(tempDir, "src", "lib", "posts.ts"))).toBe(true);
  });

  it("copies ssr with db schema", () => {
    copyTemplate("ssr", tempDir);
    expect(existsSync(join(tempDir, "src", "db", "schema.ts"))).toBe(true);
    expect(existsSync(join(tempDir, "src", "routes", "api.ts"))).toBe(true);
  });

  it("copies static with build script", () => {
    copyTemplate("static", tempDir);
    expect(existsSync(join(tempDir, "src", "build.ts"))).toBe(true);
    expect(existsSync(join(tempDir, "content", "hello.md"))).toBe(true);
  });

  it("throws for unknown template", () => {
    expect(() => copyTemplate("nonexistent" as Template, tempDir)).toThrow();
  });
});

// ── Deploy config ───────────────────────────────────────────────────

describe("generateDeployConfig", () => {
  beforeEach(() => copyTemplate("bare", tempDir));

  it("self-hosted: Dockerfile + Compose + Caddy", () => {
    generateDeployConfig(tempDir, "self-hosted", "app");
    expect(existsSync(join(tempDir, "Dockerfile"))).toBe(true);
    expect(existsSync(join(tempDir, "docker-compose.yml"))).toBe(true);
    expect(existsSync(join(tempDir, "Caddyfile"))).toBe(true);
  });

  it("cloudflare: wrangler.toml + worker entry", () => {
    generateDeployConfig(tempDir, "cloudflare", "app");
    expect(existsSync(join(tempDir, "wrangler.toml"))).toBe(true);
    expect(existsSync(join(tempDir, "src", "worker.ts"))).toBe(true);
  });

  it("vercel: vercel.json", () => {
    generateDeployConfig(tempDir, "vercel", "app");
    expect(existsSync(join(tempDir, "vercel.json"))).toBe(true);
  });

  it("fly: fly.toml + Dockerfile", () => {
    generateDeployConfig(tempDir, "fly", "app");
    expect(existsSync(join(tempDir, "fly.toml"))).toBe(true);
    expect(existsSync(join(tempDir, "Dockerfile"))).toBe(true);
  });

  it("static: no extra files", () => {
    generateDeployConfig(tempDir, "static", "app");
    expect(existsSync(join(tempDir, "Dockerfile"))).toBe(false);
  });
});

// ── Extensions ──────────────────────────────────────────────────────

describe("installExtension", () => {
  beforeEach(() => copyTemplate("ssr", tempDir));

  it("installs auth with files and hooks", () => {
    const result = installExtension("auth", tempDir);
    expect(result.files.length).toBe(3);
    expect(result.hooksApplied).toContain("src/app.ts");
    expect(existsSync(join(tempDir, "src", "lib", "session.ts"))).toBe(true);
  });

  it("installs email with deps, no migration", () => {
    const result = installExtension("email", tempDir);
    expect(result.files.length).toBe(1);
    expect(result.deps).toContain("resend");
    expect(result.migration).toBeNull();
  });

  it("throws for unknown extension", () => {
    expect(() => installExtension("nonexistent", tempDir)).toThrow();
  });
});

// ── Hooks ───────────────────────────────────────────────────────────

describe("hooks", () => {
  it("images extension wires itself into app.ts", () => {
    copyTemplate("bare", tempDir);
    const result = installExtension("images", tempDir);

    // Check that the hook was applied
    expect(result.hooksApplied).toContain("src/app.ts");

    // Check the file was modified
    const app = readFileSync(join(tempDir, "src", "app.ts"), "utf-8");
    expect(app).toContain('import { imageMiddleware } from "./middleware/images"');
    expect(app).toContain('app.use("/images/*", imageMiddleware())');
  });

  it("does not duplicate hooks on second install", () => {
    copyTemplate("bare", tempDir);
    installExtension("images", tempDir);
    const result = installExtension("images", tempDir);

    // Second install should not modify the file again
    expect(result.hooksApplied).not.toContain("src/app.ts");

    const app = readFileSync(join(tempDir, "src", "app.ts"), "utf-8");
    const importCount = (app.match(/imageMiddleware/g) || []).length;
    expect(importCount).toBe(2); // once in import, once in usage: not duplicated
  });

  it("skips hook if target file missing", () => {
    copyTemplate("bare", tempDir);
    // Delete app.ts
    rmSync(join(tempDir, "src", "app.ts"));

    const result = installExtension("images", tempDir);
    expect(result.hooksApplied).not.toContain("src/app.ts");
    expect(result.files.length).toBe(1); // middleware file still copied
  });
});

// ── Image optimization ──────────────────────────────────────────────

describe("optimizeImages", () => {
  it("converts jpeg to webp", async () => {
    const imagesDir = join(tempDir, "images");
    const outputDir = join(tempDir, "optimized");
    mkdirSync(imagesDir, { recursive: true });

    // Create a test image using Bun.Image
    const { Image } = require("bun");
    const src = new Image("/Users/mwolff/bit/shibumistack.dev/public/brand/logos/favicon.png");
    const pngBuf = await src.bytes("png");
    writeFileSync(join(imagesDir, "photo.png"), pngBuf);

    const stats = await optimizeImages(imagesDir, outputDir);

    expect(stats.files).toBe(1);
    expect(stats.originalSize).toBeGreaterThan(0);
    expect(stats.optimizedSize).toBeGreaterThan(0);
    expect(existsSync(join(outputDir, "photo.webp"))).toBe(true);
  });

  it("handles multiple images", async () => {
    const imagesDir = join(tempDir, "images");
    const outputDir = join(tempDir, "optimized");
    mkdirSync(imagesDir, { recursive: true });

    const { Image } = require("bun");
    const src = new Image("/Users/mwolff/bit/shibumistack.dev/public/brand/logos/favicon.png");
    const pngBuf = await src.bytes("png");
    writeFileSync(join(imagesDir, "a.png"), pngBuf);
    writeFileSync(join(imagesDir, "b.png"), pngBuf);

    const stats = await optimizeImages(imagesDir, outputDir);

    expect(stats.files).toBe(2);
    expect(existsSync(join(outputDir, "a.webp"))).toBe(true);
    expect(existsSync(join(outputDir, "b.webp"))).toBe(true);
  });

  it("skips output directory to avoid recursion", async () => {
    const imagesDir = join(tempDir, "images");
    const outputDir = join(imagesDir, "optimized");
    mkdirSync(outputDir, { recursive: true });

    const { Image } = require("bun");
    const src = new Image("/Users/mwolff/bit/shibumistack.dev/public/brand/logos/favicon.png");
    const pngBuf = await src.bytes("png");
    writeFileSync(join(imagesDir, "photo.png"), pngBuf);
    writeFileSync(join(outputDir, "photo.webp"), pngBuf);

    const stats = await optimizeImages(imagesDir, outputDir);

    expect(stats.files).toBe(1); // only the original, not the cached one
  });

  it("handles missing directory", async () => {
    const stats = await optimizeImages("/nonexistent", "/nonexistent");
    expect(stats.files).toBe(0);
  });
});
