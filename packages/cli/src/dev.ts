import { serve } from "@hono/node-server";
import { createApp } from "@mcp-studio/server/app.js";

export async function startDev(port: number): Promise<void> {
  const { app, injectWebSocket } = createApp();

  const server = serve({ fetch: app.fetch, port }, (info) => {
    console.log(`MCP Studio running at http://localhost:${info.port}`);
    console.log("Press Ctrl+C to stop");
  });

  injectWebSocket(server);
}
