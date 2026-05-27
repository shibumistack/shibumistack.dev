/**
 * Image optimization using Bun's built-in Image API.
 * Zero dependencies.
 */

const { Image } = Bun;
const { readdirSync, mkdirSync, existsSync } = require("fs");
const { join, extname, resolve } = require("path");

const SUPPORTED = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

export interface OptimizeStats {
  files: number;
  originalSize: number;
  optimizedSize: number;
}

/**
 * Convert a single image to WebP.
 */
export async function convertToWebp(
  inputPath: string,
  outputPath: string,
  quality = 80
): Promise<Uint8Array> {
  const img = new Image(inputPath);
  const buf = await img.bytes("webp", { quality });

  mkdirSync(join(outputPath, ".."), { recursive: true });
  await Bun.write(outputPath, buf);

  return buf;
}

/**
 * Optimize all images in a directory recursively.
 * Originals are never modified or deleted.
 * Skips the output directory if it's inside the input directory.
 */
export async function optimizeImages(
  inputDir: string,
  outputDir: string,
  quality = 80
): Promise<OptimizeStats> {
  const stats: OptimizeStats = { files: 0, originalSize: 0, optimizedSize: 0 };

  if (!existsSync(inputDir)) return stats;

  // Resolve to absolute paths to correctly detect output dir inside input dir
  const absInput = resolve(inputDir);
  const absOutput = resolve(outputDir);

  mkdirSync(outputDir, { recursive: true });

  const entries = readdirSync(inputDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subInput = resolve(join(inputDir, entry.name));

      // Skip output directory to avoid infinite recursion
      if (subInput === absOutput || subInput.startsWith(absOutput + "/")) {
        continue;
      }

      const sub = await optimizeImages(
        join(inputDir, entry.name),
        join(outputDir, entry.name),
        quality
      );
      stats.files += sub.files;
      stats.originalSize += sub.originalSize;
      stats.optimizedSize += sub.optimizedSize;
      continue;
    }

    const ext = extname(entry.name).toLowerCase();
    if (!SUPPORTED.has(ext)) continue;

    const inputPath = join(inputDir, entry.name);
    const outputName = entry.name.replace(ext, ".webp");
    const outputPath = join(outputDir, outputName);

    try {
      const originalBuf = Bun.file(inputPath);
      const originalSize = originalBuf.size;

      const webpBuf = await convertToWebp(inputPath, outputPath, quality);

      stats.files++;
      stats.originalSize += originalSize;
      stats.optimizedSize += webpBuf.length;
    } catch {
      // Skip unprocessable files
    }
  }

  return stats;
}
