import { API_PREFIX } from "@mcp-studio/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";

export function createApp() {
  const app = new Hono();

  app.use("/*", cors());

  app.get(`${API_PREFIX}/health`, (c) => {
    return c.json({ status: "ok", uptime: process.uptime() });
  });

  return app;
}
