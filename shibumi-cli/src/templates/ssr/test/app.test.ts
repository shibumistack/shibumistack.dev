import { describe, it, expect } from "bun:test";
import { app } from "../src/app";

describe("ssr app", () => {
  it("serves the index page", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<h1>Items</h1>");
    expect(html).toContain("alpinejs");
  });

  it("lists items via API", async () => {
    const res = await app.fetch(new Request("http://localhost/api/items"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("creates and deletes an item", async () => {
    // Create
    const createRes = await app.fetch(
      new Request("http://localhost/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test item" }),
      })
    );
    expect(createRes.status).toBe(201);
    const item = await createRes.json();
    expect(item.name).toBe("Test item");
    expect(item.id).toBeDefined();

    // Delete
    const delRes = await app.fetch(
      new Request(`http://localhost/api/items/${item.id}`, {
        method: "DELETE",
      })
    );
    expect(delRes.status).toBe(200);
  });

  it("rejects invalid input", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      })
    );
    expect(res.status).toBe(400);
  });
});
