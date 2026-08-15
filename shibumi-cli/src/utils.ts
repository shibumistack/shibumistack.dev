import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join, relative, extname, resolve } from "path";

// ── Types ───────────────────────────────────────────────────────────

export type Template = "bare" | "blog" | "ssr" | "static";
export type DeployTarget = "self-hosted" | "cloudflare" | "vercel" | "fly" | "static";

export interface ProjectOptions {
  dir: string;
  template: Template;
  deploy: DeployTarget;
  git: boolean;
  deps: boolean;
}

export interface ExtensionHook {
  file: string;
  find?: string;
  insert?: string;
  after?: string;
  add?: string;
}

export interface ExtensionManifest {
  name: string;
  title: string;
  description: string;
  files: Array<{ from: string; to: string }>;
  agents?: string;
  migration?: string;
  deps?: string[];
  hooks?: ExtensionHook[];
}

export interface InstallResult {
  files: string[];
  deps: string[];
  migration: string | null;
  agentsMd: string | null;
  hooksApplied: string[];
}

// ── Template copy ───────────────────────────────────────────────────

const TEMPLATES_DIR = join(import.meta.dir, "templates");

export function copyTemplate(template: Template, targetDir: string): void {
  const src = join(TEMPLATES_DIR, template);
  if (!existsSync(src)) {
    throw new Error(`Template "${template}" not found at ${src}`);
  }
  cpSync(src, targetDir, { recursive: true });
}

// ── Deploy config generation ────────────────────────────────────────

export function generateDeployConfig(
  targetDir: string,
  deploy: DeployTarget,
  projectName: string
): void {
  switch (deploy) {
    case "self-hosted":
      writeFileSync(
        join(targetDir, "Dockerfile"),
        `FROM oven/bun:alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

EXPOSE 3000
CMD ["bun", "start"]
`
      );
      writeFileSync(
        join(targetDir, "docker-compose.yml"),
        `services:
  app:
    build: .
    ports:
      - "127.0.0.1:\${SHIBUMI_PORT:-9001}:3000"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -q -T 5 -O /dev/null http://127.0.0.1:3000/"]
      interval: 60s
      timeout: 10s
      retries: 3
      start_period: 10s
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
`
      );
      mkdirSync(join(targetDir, "scripts"), { recursive: true });
      cpSync(join(import.meta.dir, "templates", "ship.ts"), join(targetDir, "scripts", "ship.ts"));
      const packagePath = join(targetDir, "package.json");
      const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as {
        scripts?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const currentDev = packageJson.scripts?.dev;
      packageJson.scripts = {
        ...packageJson.scripts,
        ...(currentDev ? { "dev:app": currentDev, dev: "bun scripts/ship.ts --dev" } : {}),
        ship: "bun scripts/ship.ts",
        "ship:setup": "bun scripts/ship.ts --setup",
        "ship:update": "bun scripts/ship.ts --update",
        "ship:logs": "bun scripts/ship.ts --logs",
      };
      packageJson.devDependencies = { ...packageJson.devDependencies, "@clack/prompts": "^0.7.0" };
      writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
      break;

    case "cloudflare":
      writeFileSync(
        join(targetDir, "wrangler.toml"),
        `name = "${projectName}"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

[site]
bucket = "./public"
`
      );
      writeFileSync(
        join(targetDir, "src", "worker.ts"),
        `import { app } from "./app";

export default {
  fetch: app.fetch,
};
`
      );
      break;

    case "vercel":
      writeFileSync(
        join(targetDir, "vercel.json"),
        `{
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "framework": null
}
`
      );
      break;

    case "fly":
      writeFileSync(
        join(targetDir, "fly.toml"),
        `app = "${projectName}"
primary_region = "iad"

[build]

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true

[mounts]
  source = "data"
  destination = "/app/data"
`
      );
      if (!existsSync(join(targetDir, "Dockerfile"))) {
        generateDeployConfig(targetDir, "self-hosted", projectName);
      }
      break;

    case "static":
      break;
  }
}

// ── Extension system ────────────────────────────────────────────────

const EXTENSIONS_DIR = join(import.meta.dir, "extensions");

/**
 * List all available extensions.
 */
export function listExtensions(): ExtensionManifest[] {
  if (!existsSync(EXTENSIONS_DIR)) return [];

  const { readdirSync } = require("fs");
  const dirs = readdirSync(EXTENSIONS_DIR, { withFileTypes: true })
    .filter((d: any) => d.isDirectory())
    .map((d: any) => d.name);

  return dirs
    .map((name: string) => {
      try {
        const manifestPath = join(EXTENSIONS_DIR, name, "manifest.json");
        const raw = readFileSync(manifestPath, "utf-8");
        return JSON.parse(raw) as ExtensionManifest;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as ExtensionManifest[];
}

/**
 * Install an extension into a project directory.
 * Returns info about what was installed.
 */
export function installExtension(
  extensionName: string,
  projectDir: string
): InstallResult {
  const extDir = join(EXTENSIONS_DIR, extensionName);

  if (!existsSync(extDir)) {
    throw new Error(`Extension "${extensionName}" not found at ${extDir}`);
  }

  const manifestPath = join(extDir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as ExtensionManifest;

  const copiedFiles: string[] = [];

  // Copy files
  for (const file of manifest.files) {
    const src = join(extDir, file.from);
    const dest = join(projectDir, file.to);

    if (!existsSync(src)) {
      throw new Error(`Extension file not found: ${file.from}`);
    }

    // Ensure destination directory exists
    const destDir = join(dest, "..");
    mkdirSync(destDir, { recursive: true });

    cpSync(src, dest);
    copiedFiles.push(file.to);
  }

  // Read agents.md fragment
  let agentsMd: string | null = null;
  if (manifest.agents) {
    const agentsPath = join(extDir, manifest.agents);
    if (existsSync(agentsPath)) {
      agentsMd = readFileSync(agentsPath, "utf-8").trim();
    }
  }

  // Read migration if present
  let migration: string | null = null;
  if (manifest.migration) {
    const migrationPath = join(extDir, manifest.migration);
    if (existsSync(migrationPath)) {
      migration = readFileSync(migrationPath, "utf-8");
    }
  }

  // Apply hooks (code modifications)
  const hooksApplied: string[] = [];
  if (manifest.hooks) {
    for (const hook of manifest.hooks) {
      const filePath = join(projectDir, hook.file);
      if (!existsSync(filePath)) continue;

      let content = readFileSync(filePath, "utf-8");
      let modified = false;

      // Insert import after a find pattern
      if (hook.find && hook.insert) {
        if (content.includes(hook.find) && !content.includes(hook.insert)) {
          content = content.replace(hook.find, hook.find + "\n" + hook.insert);
          modified = true;
        }
      }

      // Add code after a pattern
      if (hook.after && hook.add) {
        if (content.includes(hook.after) && !content.includes(hook.add.trim())) {
          content = content.replace(hook.after, hook.after + hook.add);
          modified = true;
        }
      }

      if (modified) {
        writeFileSync(filePath, content);
        hooksApplied.push(hook.file);
      }
    }
  }

  return {
    files: copiedFiles,
    deps: manifest.deps || [],
    migration,
    agentsMd,
    hooksApplied,
  };
}

// ── Image optimization ─────────────────────────────────────────────

export interface OptimizeStats {
  files: number;
  originalSize: number;
  optimizedSize: number;
}

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

/**
 * Optimize images using Bun's built-in Image API.
 * Converts to WebP with 80% quality.
 */
export async function optimizeImages(
  inputDir: string,
  outputDir: string
): Promise<OptimizeStats> {
  const { Image } = require("bun");
  const stats: OptimizeStats = { files: 0, originalSize: 0, optimizedSize: 0 };

  if (!existsSync(inputDir)) {
    return stats;
  }

  const absInput = resolve(inputDir);
  const absOutput = resolve(outputDir);

  mkdirSync(outputDir, { recursive: true });

  const entries = readdirSync(inputDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subInput = resolve(join(inputDir, entry.name));
      if (subInput === absOutput || subInput.startsWith(absOutput + "/")) {
        continue;
      }

      const sub = await optimizeImages(
        join(inputDir, entry.name),
        join(outputDir, entry.name)
      );
      stats.files += sub.files;
      stats.originalSize += sub.originalSize;
      stats.optimizedSize += sub.optimizedSize;
      continue;
    }

    const ext = extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;

    const inputPath = join(inputDir, entry.name);
    const outputName = entry.name.replace(ext, ".webp");
    const outputPath = join(outputDir, outputName);

    try {
      const originalBuf = Bun.file(inputPath);
      const originalSize = originalBuf.size;

      const img = new Image(inputPath);
      const webpBuf = await img.bytes("webp", { quality: 80 });

      await Bun.write(outputPath, webpBuf);

      stats.files++;
      stats.originalSize += originalSize;
      stats.optimizedSize += webpBuf.length;
    } catch {
      // Skip files that can't be processed
    }
  }

  return stats;
}
