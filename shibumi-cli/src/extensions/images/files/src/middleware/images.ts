/**
 * Image optimization middleware for Hono.
 *
 * Intercepts requests for images, converts to WebP on the fly,
 * caches the result, and serves it. Originals stay untouched.
 *
 * Usage:
 *   import { imageMiddleware } from "./middleware/images";
 *   app.use("/images/*", imageMiddleware());
 *
 * How it works:
 *   1. Browser requests /images/hero.png
 *   2. Middleware checks if public/images/optimized/hero.webp exists
 *   3. If yes → serve it
 *   4. If no → convert with Bun.Image, write to optimized/, serve it
 *   5. Browser gets WebP. Original PNG stays in place.
 *
 * The <img> tags in your HTML never change.
 * Delete public/images/optimized/ to reset.
 */

import { Context, Next } from "hono";
import { existsSync, mkdirSync } from "fs";
import { join, extname } from "path";

const { Image } = Bun;

const WEBP_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
const CACHE_DIR = "public/images/optimized";

interface ImageOptions {
  /** WebP quality 1-100. Default: 80 */
  quality?: number;
  /** Directory containing original images. Default: public */
  publicDir?: string;
  /** Cache directory. Default: public/images/optimized */
  cacheDir?: string;
}

export function imageMiddleware(options: ImageOptions = {}) {
  const quality = options.quality ?? 80;
  const publicDir = options.publicDir ?? "public";
  const cacheDir = options.cacheDir ?? join(publicDir, "images", "optimized");

  return async (c: Context, next: Next) => {
    const path = new URL(c.req.url).pathname;
    const ext = extname(path).toLowerCase();

    // Only handle image extensions
    if (!WEBP_EXTENSIONS.has(ext)) {
      return next();
    }

    // Compute cache path: /images/hero.png → public/images/optimized/hero.webp
    // Strip /images/ prefix since cacheDir already includes it
    const filename = path.split("/").pop()!.replace(ext, ".webp");
    const cachePath = join(".", cacheDir, filename);

    // Serve cached version if it exists
    if (existsSync(cachePath)) {
      const file = Bun.file(cachePath);
      return new Response(file, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Image-Optimized": "cached",
        },
      });
    }

    // Convert on the fly
    try {
      // path is /images/hero.png → find it in public/
      const inputPath = join(".", publicDir, path);

      if (!existsSync(inputPath)) {
        return next();
      }

      const img = new Image(inputPath);
      const webpBuf = await img.bytes("webp", { quality });

      // Cache it
      mkdirSync(join(".", cacheDir), { recursive: true });
      await Bun.write(cachePath, webpBuf);

      return new Response(webpBuf, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Image-Optimized": "generated",
        },
      });
    } catch {
      // Conversion failed: serve original
      return next();
    }
  };
}
