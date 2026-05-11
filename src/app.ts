import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const app = new Hono();

function wantsMarkdown(c: any): boolean {
  return c.req.header("accept")?.includes("text/markdown") ?? false;
}

app.get("/", async (c) => {
  if (wantsMarkdown(c)) {
    return c.body(await Bun.file("public/index.md").text(), 200, {
      "content-type": "text/markdown; charset=utf-8",
    });
  }
  return c.html(await Bun.file("src/index.html").text());
});

app.get("/brand", async (c) => {
  if (wantsMarkdown(c)) {
    return c.body(await Bun.file("public/brand.md").text(), 200, {
      "content-type": "text/markdown; charset=utf-8",
    });
  }
  return c.html(await Bun.file("src/brand.html").text());
});

app.use("/*", serveStatic({ root: "./public" }));

export default app;
