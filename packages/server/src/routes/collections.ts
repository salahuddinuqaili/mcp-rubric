import { Hono } from "hono";
import { API_PREFIX } from "mcp-studio-shared";
import type { CollectionItem } from "mcp-studio-shared";
import {
  createCollection,
  deleteCollection,
  getAllCollections,
  getCollectionById,
  updateCollection,
} from "../db/collections-repository.js";

export const collectionsRoutes = new Hono();

collectionsRoutes.get(`${API_PREFIX}/collections`, (c) => {
  const collections = getAllCollections();
  return c.json({ collections });
});

collectionsRoutes.get(`${API_PREFIX}/collections/:id`, (c) => {
  const id = c.req.param("id");
  const collection = getCollectionById(id);
  if (!collection) {
    return c.json({ error: "Collection not found" }, 404);
  }
  return c.json({ collection });
});

collectionsRoutes.post(`${API_PREFIX}/collections`, async (c) => {
  const body = await c.req.json<{ name: string; description?: string }>();
  if (!body.name?.trim()) {
    return c.json({ error: "Name is required" }, 400);
  }
  const collection = createCollection(body.name.trim(), body.description?.trim());
  return c.json({ collection }, 201);
});

collectionsRoutes.put(`${API_PREFIX}/collections/:id`, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    name?: string;
    description?: string;
    items?: CollectionItem[];
  }>();
  const collection = updateCollection(id, body);
  if (!collection) {
    return c.json({ error: "Collection not found" }, 404);
  }
  return c.json({ collection });
});

collectionsRoutes.delete(`${API_PREFIX}/collections/:id`, (c) => {
  const id = c.req.param("id");
  const deleted = deleteCollection(id);
  if (!deleted) {
    return c.json({ error: "Collection not found" }, 404);
  }
  return c.json({ success: true });
});
