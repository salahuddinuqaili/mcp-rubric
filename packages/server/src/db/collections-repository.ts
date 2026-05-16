import { randomUUID } from "node:crypto";
import type { Collection, CollectionItem } from "@mcp-studio/shared";
import { getDb } from "./index.js";

interface CollectionRow {
  id: string;
  name: string;
  description: string | null;
  items: string;
  created_at: string;
  updated_at: string;
}

function rowToCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    items: JSON.parse(row.items) as CollectionItem[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createCollection(name: string, description?: string): Collection {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    "INSERT INTO collections (id, name, description, items, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, name, description ?? null, "[]", now, now);

  return { id, name, description, items: [], createdAt: now, updatedAt: now };
}

export function getCollectionById(id: string): Collection | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM collections WHERE id = ?").get(id) as
    | CollectionRow
    | undefined;
  return row ? rowToCollection(row) : undefined;
}

export function getAllCollections(): Collection[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM collections ORDER BY updated_at DESC")
    .all() as CollectionRow[];
  return rows.map(rowToCollection);
}

export function updateCollection(
  id: string,
  update: { name?: string; description?: string; items?: CollectionItem[] },
): Collection | undefined {
  const db = getDb();
  const existing = getCollectionById(id);
  if (!existing) return undefined;

  const name = update.name ?? existing.name;
  const description = update.description ?? existing.description;
  const items = update.items ?? existing.items;
  const updatedAt = new Date().toISOString();

  db.prepare(
    "UPDATE collections SET name = ?, description = ?, items = ?, updated_at = ? WHERE id = ?",
  ).run(name, description ?? null, JSON.stringify(items), updatedAt, id);

  return { ...existing, name, description, items, updatedAt };
}

export function deleteCollection(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM collections WHERE id = ?").run(id);
  return result.changes > 0;
}
