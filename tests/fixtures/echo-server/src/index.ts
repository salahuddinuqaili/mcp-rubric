import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "echo-server",
  version: "0.0.1",
});

server.tool(
  "echo",
  "Echoes the input text back",
  { text: z.string().describe("Text to echo") },
  async ({ text }) => ({
    content: [{ type: "text", text: `Echo: ${text}` }],
  }),
);

server.tool(
  "add",
  "Adds two numbers",
  { a: z.number().describe("First number"), b: z.number().describe("Second number") },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
  }),
);

server.resource("Server information", "info://server", async () => ({
  contents: [
    {
      uri: "info://server",
      mimeType: "text/plain",
      text: "Echo Server v0.0.1 — A test fixture for Rubric",
    },
  ],
}));

server.prompt(
  "greet",
  "Generates a greeting",
  { name: z.string().describe("Name to greet") },
  async ({ name }) => ({
    messages: [{ role: "user", content: { type: "text", text: `Say hello to ${name}` } }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
