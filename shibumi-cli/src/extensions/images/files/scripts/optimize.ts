/**
 * Image optimization build script.
 *
 * 1. Converts images in public/images/ to WebP in public/images/optimized/
 * 2. Rewrites <img> tags in HTML files to <picture> with WebP source
 * 3. Originals are never modified or deleted
 *
 * Usage:
 *   bun run scripts/optimize.ts [html-dir] [image-dir]
 *
 * Defaults:
 *   html-dir: public (or src/pages for Hono apps)
 *   image-dir: public/images
 */

import { optimizeImages } from "../src/lib/optimize-images";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, extname, relative, dirname, basename } from "path";

const HTML_DIR = process.argv[2] || "public";
const IMAGE_DIR = process.argv[3] || "public/images";
const OPTIMIZED_DIR = join(IMAGE_DIR, "optimized");

// ── Step 1: Optimize images ─────────────────────────────────────────

async function step1_optimize() {
  console.log("  Converting images to WebP...");

  if (!existsSync(IMAGE_DIR)) {
    console.log("  No images directory found, skipping.");
    return;
  }

  const stats = await optimizeImages(IMAGE_DIR, OPTIMIZED_DIR);

  if (stats.files === 0) {
    console.log("  No images to optimize.");
    return;
  }

  const savings = ((1 - stats.optimizedSize / stats.originalSize) * 100).toFixed(1);
  console.log(`  ✓ ${stats.files} images → WebP (${savings}% smaller)`);
}

// ── Step 2: Rewrite HTML img tags ───────────────────────────────────

function step2_rewriteHtml() {
  console.log("  Rewriting <img> tags...");

  if (!existsSync(HTML_DIR)) {
    console.log("  No HTML directory found, skipping.");
    return;
  }

  let count = 0;
  const entries = readdirSync(HTML_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    if (extname(entry.name) !== ".html") continue;

    const filePath = join(HTML_DIR, entry.name);
    const html = readFileSync(filePath, "utf-8");

    // Match <img src="..."> tags
    const rewritten = html.replace(
      /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
      (match, before, src, after) => {
        // Skip external URLs and data URIs
        if (src.startsWith("http") || src.startsWith("data:") || src.startsWith("blob:")) {
          return match;
        }

        // Skip if already a <picture>
        // (this is a simple heuristic — if the img is inside a picture, skip)
        if (match.includes("type=\"image/webp\"")) {
          return match;
        }

        // Compute WebP path
        const ext = extname(src).toLowerCase();
        if (![".png", ".jpg", ".jpeg"].includes(ext)) return match;

        const webpSrc = src.replace(ext, ".webp");

        // Keep original for fallback
        count++;
        return `<picture><source srcset="${webpSrc}" type="image/webp"><img ${before}src="${src}"${after}></picture>`;
      }
    );

    if (count > 0) {
      writeFileSync(filePath, rewritten);
    }
  }

  console.log(`  ✓ ${count} images rewritten to <picture>`);
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("\n  Optimizing images\n");

  await step1_optimize();
  step2_rewriteHtml();

  console.log("\n  Done. Originals preserved in public/images/\n");
}

main();
