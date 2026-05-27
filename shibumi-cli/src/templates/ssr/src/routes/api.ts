import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { items } from "../db/schema";
import { ItemSchema } from "../lib/validate";

export const api = new Hono();

// GET /api/items — list all items
api.get("/items", async (c) => {
  const all = db.select().from(items).all();
  return c.json(all);
});

// POST /api/items — create an item
api.post("/items", async (c) => {
  const body = await c.req.json();
  const parsed = ItemSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 400);
  }

  const result = db.insert(items).values({ name: parsed.data.name }).returning().get();
  return c.json(result, 201);
});

// DELETE /api/items/:id — delete an item
api.delete("/items/:id", async (c) => {
  const id = Number(c.req.param("id"));
  db.delete(items).where(eq(items.id, id)).run();
  return c.json({ ok: true });
});
