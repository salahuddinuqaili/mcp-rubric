import { resolve } from "node:path";
import { serve } from "@hono/node-server";
import { createApp } from "mcp-rubric-server/app.js";

export async function startDev(port: number): Promise<void> {
  // In production (npm install), client assets are copied into dist/client during build
  const clientDistPath = resolve(import.meta.dirname, "client");

  const { app, injectWebSocket } = createApp({ clientDistPath });

  const server = serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Rubric running at http://localhost:${info.port}`);
    console.log("Press Ctrl+C to stop");
  });

  injectWebSocket(server);
}
