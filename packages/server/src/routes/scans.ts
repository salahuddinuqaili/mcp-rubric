import { API_PREFIX } from "@mcp-studio/shared";
import { Hono } from "hono";
import { getScanResultById, getScanResults } from "../db/scan-repository.js";

export const scansRoutes = new Hono();

scansRoutes.get(`${API_PREFIX}/scans`, (c) => {
  const connectionId = c.req.query("connectionId");
  const results = getScanResults(connectionId || undefined);
  return c.json({ results });
});

scansRoutes.get(`${API_PREFIX}/scans/:id`, (c) => {
  const id = c.req.param("id");
  const result = getScanResultById(id);
  if (!result) {
    return c.json({ error: "Scan result not found" }, 404);
  }
  return c.json({ result });
});
