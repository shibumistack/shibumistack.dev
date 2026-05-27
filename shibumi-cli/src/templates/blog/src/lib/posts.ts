import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

export interface PostMeta {
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
}

export interface Post {
  slug: string;
  meta: PostMeta;
  content: string;
}

const CONTENT_DIR = join(import.meta.dir, "../../content");

/**
 * Load all posts from content/, sorted newest-first.
 */
export function getPosts(): Post[] {
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  const posts = files.map((file) => {
    const raw = readFileSync(join(CONTENT_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const slug = file.replace(/\.md$/, "");

    return {
      slug,
      meta: data as PostMeta,
      content,
    };
  });

  posts.sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime());

  return posts;
}

/**
 * Load a single post by slug. Returns null if not found.
 */
export function getPost(slug: string): Post | null {
  try {
    const raw = readFileSync(join(CONTENT_DIR, `${slug}.md`), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      meta: data as PostMeta,
      content,
    };
  } catch {
    return null;
  }
}
