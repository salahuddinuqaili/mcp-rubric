import { createNodeWebSocket } from "@hono/node-ws";
import { API_PREFIX, WS_PATH } from "@mcp-studio/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ConnectionManager } from "./mcp/connection-manager.js";
import { collectionsRoutes } from "./routes/collections.js";
import { historyRoutes } from "./routes/history.js";
import { scansRoutes } from "./routes/scans.js";
import { WsHandler } from "./ws/handler.js";

export function createApp() {
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

  return { app, injectWebSocket };
}
