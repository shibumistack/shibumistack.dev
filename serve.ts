const server = Bun.serve({
  port: 9001,
  async fetch(req) {
    let path = new URL(req.url).pathname;
    if (path === "/") path = "/index.html";
    if (!path.includes(".")) path += ".html";

    const file = Bun.file(`.${path}`);
    if (await file.exists()) return new Response(file);
    return new Response("Not found", { status: 404 });
  },
});

console.log(`http://localhost:${server.port}`);
