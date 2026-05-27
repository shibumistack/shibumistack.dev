import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { mkdirSync, existsSync } from "fs";
import * as schema from "./schema";

const DB_DIR = "data";
const DB_PATH = `${DB_DIR}/app.db`;

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);

// Create tables on startup (dev convenience — use migrations for prod)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export const db = drizzle(sqlite, { schema });
