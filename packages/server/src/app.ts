import { existsSync } from "node:fs";
import { serveStatic } from "@hono/node-server/serve-static";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { API_PREFIX, WS_PATH } from "mcp-rubric-shared";
import { ConnectionManager } from "./mcp/connection-manager.js";
import { collectionsRoutes } from "./routes/collections.js";
import { historyRoutes } from "./routes/history.js";
import { scansRoutes } from "./routes/scans.js";
import { WsHandler } from "./ws/handler.js";

export interface AppOptions {
  clientDistPath?: string;
}

export function createApp(options: AppOptions = {}) {
  const app = new Hono();
  const manager = new ConnectionManager();
  const wsHandler = new WsHandler(manager);

  const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app });

  app.use("/*", cors());

  app.get(`${API_PREFIX}/health`, (c) => {
    return c.json({ status: "ok", uptime: process.uptime() });
  });

  app.route("/", historyRoutes);
  app.route("/", collectionsRoutes);
  app.route("/", scansRoutes);

  app.get(
    WS_PATH,
    upgradeWebSocket(() => ({
      onOpen(_event, ws) {
        wsHandler.handleOpen(ws);
      },
      onMessage(event, ws) {
        const data = typeof event.data === "string" ? event.data : String(event.data);
        wsHandler.handleMessage(ws, data);
      },
      onClose(_event, ws) {
        wsHandler.handleClose(ws);
      },
    })),
  );

  // Serve built frontend assets in production mode
  if (options.clientDistPath && existsSync(options.clientDistPath)) {
    app.use("/*", serveStatic({ root: options.clientDistPath }));
    // SPA fallback: serve index.html for unmatched routes
    app.get("*", serveStatic({ root: options.clientDistPath, path: "index.html" }));
  }

  return { app, injectWebSocket };
}
