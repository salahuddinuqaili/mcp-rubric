import { serve } from "@hono/node-server";
import { DEFAULT_BACKEND_PORT } from "@mcp-studio/shared";
import { createApp } from "./app.js";

const app = createApp();
const port = Number(process.env.PORT ?? DEFAULT_BACKEND_PORT);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`MCP Studio backend listening on http://localhost:${info.port}`);
});
