import { Hono } from "hono";

export const app = new Hono();

app.get("/", (c) => {
  return c.json({
    name: "my-shibumi-app",
    message: "Hello from Shibumi",
    stack: ["Bun", "Hono"],
  });
});
