#!/usr/bin/env bun

import { text, select, confirm, spinner } from "@clack/prompts";
import chalk from "chalk";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import {
  copyTemplate,
  generateDeployConfig,
  installExtension,
  listExtensions,
  optimizeImages,
  type Template,
  type DeployTarget,
} from "./utils.js";

// ── Colors ──────────────────────────────────────────────────────────

const kanji = chalk.hex("#c76647").bold;
const accent = chalk.hex("#c76647");
const dim = chalk.dim;
const success = chalk.hex("#64b464").bold;

// ── Args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
// Positional args: exclude flags and their values
const positional = args.filter((a, i) => {
  if (a.startsWith("--")) return false;
  // Check if previous arg was a flag that takes a value
  const prev = args[i - 1];
  if (prev && prev.startsWith("--") && ["template", "deploy"].some(f => prev === `--${f}`)) {
    return false;
  }
  return true;
});

const YES = flags.has("--yes") || flags.has("-y");

// Parse --template and --deploy flags
function getFlag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

const TEMPLATE_FLAG = getFlag("template") as Template | undefined;
const DEPLOY_FLAG = getFlag("deploy") as DeployTarget | undefined;

// ── Default names ───────────────────────────────────────────────────

const adjectives = ["quiet", "still", "bare", "calm", "steady", "clear", "soft", "plain"];
const nouns = ["bamboo", "water", "stone", "pine", "stream", "moon", "field", "cloud"];

function randomName(): string {
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  return `${a}-${n}`;
}

// ── CLI banner ──────────────────────────────────────────────────────

function banner(): void {
  console.log();
  console.log(`  ${kanji("渋み")} ${chalk.bold("shibumi")} ${dim("Refined simplicity")}`);
  console.log();
}

// ── Create command ──────────────────────────────────────────────────

async function createCommand(): Promise<void> {
  banner();

  let dir: string;
  let template: Template;
  let deploy: DeployTarget;
  let git: boolean;
  let deps: boolean;

  if (YES) {
    dir = positional[0] || randomName();
    template = TEMPLATE_FLAG || "bare";
    deploy = DEPLOY_FLAG || "self-hosted";
    git = true;
    deps = true;
  } else {
    // 1. Project directory
    const defaultName = randomName();
    const dirResult = await text({
      message: "Where should we create your project?",
      placeholder: `./${defaultName}`,
      defaultValue: defaultName,
    });
    if (typeof dirResult === "symbol") {
      console.log(dim("\nCancelled."));
      process.exit(0);
    }
    dir = dirResult;

    // 2. Template
    const templateResult = await select<Template>({
      message: "How would you like to start?",
      options: [
        { value: "bare", label: "Bare: minimal, start from scratch" },
        { value: "blog", label: "Blog: markdown posts, RSS feed, SEO ready" },
        { value: "ssr", label: "SSR: full stack with API routes" },
        { value: "static", label: "Static: pre-built, outputs to dist/" },
      ],
    });
    if (typeof templateResult === "symbol") {
      console.log(dim("\nCancelled."));
      process.exit(0);
    }
    template = templateResult;

    // 3. Deploy target
    const deployResult = await select<DeployTarget>({
      message: "Where will you deploy?",
      options: [
        { value: "self-hosted", label: "Self-hosted (Bun + Docker)" },
        { value: "cloudflare", label: "Cloudflare Workers/Pages" },
        { value: "vercel", label: "Vercel" },
        { value: "fly", label: "Fly.io" },
        { value: "static", label: "Static CDN" },
      ],
    });
    if (typeof deployResult === "symbol") {
      console.log(dim("\nCancelled."));
      process.exit(0);
    }
    deploy = deployResult;

    // 4. Git init
    const gitResult = await confirm({
      message: "Initialize a repository?",
      initialValue: true,
    });
    if (typeof gitResult === "symbol") {
      console.log(dim("\nCancelled."));
      process.exit(0);
    }
    git = gitResult;

    // 5. Install deps
    const depsResult = await confirm({
      message: "Install dependencies?",
      initialValue: true,
    });
    if (typeof depsResult === "symbol") {
      console.log(dim("\nCancelled."));
      process.exit(0);
    }
    deps = depsResult;
  }

  // ── Create project ────────────────────────────────────────────────

  const projectDir = resolve(dir);

  if (existsSync(projectDir)) {
    console.log(chalk.red(`\n  Directory already exists: ${dir}`));
    process.exit(1);
  }

  console.log();
  const s = spinner();

  // Copy template
  s.start("Copying template...");
  mkdirSync(projectDir, { recursive: true });
  copyTemplate(template, projectDir);
  s.stop(`${success("✓")} Template copied`);

  // Deploy config
  if (deploy !== "static") {
    s.start("Generating deploy config...");
    generateDeployConfig(projectDir, deploy, dir);
    s.stop(`${success("✓")} Deploy config generated`);
  }

  // Git init
  if (git) {
    s.start("Initializing git...");
    const { execSync } = await import("child_process");
    try {
      execSync("git init", { cwd: projectDir, stdio: "ignore" });
      execSync("git add -A", { cwd: projectDir, stdio: "ignore" });
      execSync('git commit -m "Initial commit from create-shibumi"', {
        cwd: projectDir,
        stdio: "ignore",
      });
      s.stop(`${success("✓")} Git initialized`);
    } catch {
      s.stop(`${dim("⚠")} Git init skipped (git not available)`);
    }
  }

  // Install deps
  if (deps) {
    s.start("Installing dependencies...");
    const { execSync } = await import("child_process");
    try {
      execSync("bun install", { cwd: projectDir, stdio: "ignore" });
      s.stop(`${success("✓")} Dependencies installed`);
    } catch {
      s.stop(`${dim("⚠")} Dependency install skipped (run manually)`);
    }
  }

  // ── Done ──────────────────────────────────────────────────────────

  console.log();
  console.log(
    `  ${accent("next")}  ${chalk.bold(`cd ${dir} && bun dev`)}`
  );
  console.log();
  console.log(`  ${dim("Docs:")} ${dim.underline("https://shibumistack.dev/docs")}`);
  console.log();
}

// ── Add command (extensions) ────────────────────────────────────────

async function addCommand(extensionName: string): Promise<void> {
  const projectDir = resolve(".");

  // Check we're in a shibumi project
  if (!existsSync(resolve("package.json"))) {
    console.log(chalk.red("\n  Not a Shibumi project. Run this from your project root."));
    process.exit(1);
  }

  banner();

  const available = listExtensions();
  const ext = available.find((e) => e.name === extensionName);

  if (!ext) {
    console.log(chalk.red(`  Extension "${extensionName}" not found.`));
    console.log(dim(`  Available: ${available.map((e) => e.name).join(", ")}`));
    process.exit(1);
  }

  console.log(`  Adding ${accent(extensionName)}...`);
  console.log();

  const s = spinner();

  s.start("Copying files...");
  const result = installExtension(extensionName, projectDir);
  s.stop(`${success("✓")} ${result.files.length} files written`);

  // Install deps if any
  if (result.deps.length > 0) {
    s.start("Installing dependencies...");
    const { execSync } = await import("child_process");
    try {
      execSync(`bun add ${result.deps.join(" ")}`, {
        cwd: projectDir,
        stdio: "ignore",
      });
      s.stop(`${success("✓")} Dependencies installed`);
    } catch {
      s.stop(`${dim("⚠")} Dependency install failed (run manually)`);
    }
  }

  // Run migration if any
  if (result.migration) {
    s.start("Running migration...");
    try {
      const { execSync } = await import("child_process");
      execSync("bun run db:migrate", { cwd: projectDir, stdio: "ignore" });
      s.stop(`${success("✓")} Migration applied`);
    } catch {
      s.stop(`${dim("⚠")} Migration skipped (run manually)`);
    }
  }

  // Append agents.md
  if (result.agentsMd) {
    s.start("Updating agents.md...");
    const { appendFileSync, readFileSync, writeFileSync } = await import("fs");
    const agentsPath = resolve(projectDir, "agents.md");
    try {
      let existing = "";
      try {
        existing = readFileSync(agentsPath, "utf-8");
      } catch {
        // File doesn't exist, that's fine
      }

      // Only append if not already present
      if (!existing.includes(`## ${ext.title}`)) {
        writeFileSync(agentsPath, existing + "\n" + result.agentsMd);
      }
      s.stop(`${success("✓")} agents.md updated`);
    } catch {
      s.stop(`${dim("⚠")} agents.md update skipped`);
    }
  }

  // Report hooks applied
  if (result.hooksApplied.length > 0) {
    for (const file of result.hooksApplied) {
      console.log(`  ${success("✓")} ${accent(file)} wired up`);
    }
  }

  console.log();
  console.log(`  ${success("✓")} ${accent(extensionName)} installed`);
  console.log();
}

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const command = positional[0];

  if (command === "add") {
    const extName = positional[1];
    if (!extName) {
      console.log(chalk.red("\n  Usage: shibumi add <extension>"));
      console.log(dim(`  Available: ${listExtensions().map((e) => e.name).join(", ")}`));
      process.exit(1);
    }
    await addCommand(extName);
  } else if (command === "list") {
    banner();
    const exts = listExtensions();
    console.log("  Available extensions:\n");
    for (const ext of exts) {
      console.log(`    ${accent(ext.name)}  ${dim(ext.description)}`);
    }
    console.log();
  } else if (command === "optimize") {
    // Image optimization
    const inputDir = positional[1] || "public/images";
    const outputDir = positional[2] || "public/images/optimized";
    banner();
    console.log(`  Optimizing images from ${accent(inputDir)}\n`);
    const s = spinner();
    s.start("Optimizing...");
    try {
      const stats = await optimizeImages(inputDir, outputDir);
      s.stop(`${success("✓")} ${stats.files} images optimized`);
      if (stats.files > 0) {
        const savings = ((1 - stats.optimizedSize / stats.originalSize) * 100).toFixed(1);
        console.log(`\n  ${accent(String(stats.files))} images`);
        console.log(`  ${(stats.originalSize / 1024).toFixed(1)}KB → ${(stats.optimizedSize / 1024).toFixed(1)}KB (${savings}% smaller)\n`);
      }
    } catch (err: any) {
      s.stop(`${chalk.red("✗")} ${err.message}`);
      process.exit(1);
    }
  } else {
    await createCommand();
  }
}

main().catch((err) => {
  if (err.message?.includes("User canceled")) {
    console.log(dim("\nCancelled."));
  } else {
    console.error(chalk.red("\nSomething went wrong:"), err.message);
  }
  process.exit(1);
});
