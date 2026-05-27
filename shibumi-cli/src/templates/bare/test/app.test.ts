import { describe, it, expect } from "bun:test";
import { app } from "../src/app";

describe("app", () => {
  it("returns hello from root", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Hello from Shibumi");
    expect(body.stack).toContain("Bun");
    expect(body.stack).toContain("Hono");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await app.fetch(new Request("http://localhost/nope"));
    expect(res.status).toBe(404);
  });
});
