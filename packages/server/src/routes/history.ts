import { Hono } from "hono";
import { API_PREFIX } from "mcp-rubric-shared";
import {
  deleteAllResourceReadRecords,
  deleteAllToolCallRecords,
  deleteResourceReadRecord,
  deleteToolCallRecord,
  getResourceReadRecords,
  getToolCallRecords,
} from "../db/history-repository.js";

export const historyRoutes = new Hono();

historyRoutes.get(`${API_PREFIX}/history/tool-calls`, (c) => {
  const connectionId = c.req.query("connectionId");
  const toolName = c.req.query("toolName");
  const status = c.req.query("status");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const limit = c.req.query("limit");
  const offset = c.req.query("offset");

  const records = getToolCallRecords({
    connectionId: connectionId || undefined,
    toolName: toolName || undefined,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  });

  return c.json({ records });
});

historyRoutes.get(`${API_PREFIX}/history/resource-reads`, (c) => {
  const connectionId = c.req.query("connectionId");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const limit = c.req.query("limit");
  const offset = c.req.query("offset");

  const records = getResourceReadRecords({
    connectionId: connectionId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  });

  return c.json({ records });
});

historyRoutes.delete(`${API_PREFIX}/history/tool-calls`, (c) => {
  const count = deleteAllToolCallRecords();
  return c.json({ success: true, deleted: count });
});

historyRoutes.delete(`${API_PREFIX}/history/tool-calls/:id`, (c) => {
  const id = c.req.param("id");
  const deleted = deleteToolCallRecord(id);
  if (!deleted) {
    return c.json({ error: "Record not found" }, 404);
  }
  return c.json({ success: true });
});

historyRoutes.delete(`${API_PREFIX}/history/resource-reads`, (c) => {
  const count = deleteAllResourceReadRecords();
  return c.json({ success: true, deleted: count });
});

historyRoutes.delete(`${API_PREFIX}/history/resource-reads/:id`, (c) => {
  const id = c.req.param("id");
  const deleted = deleteResourceReadRecord(id);
  if (!deleted) {
    return c.json({ error: "Record not found" }, 404);
  }
  return c.json({ success: true });
});
