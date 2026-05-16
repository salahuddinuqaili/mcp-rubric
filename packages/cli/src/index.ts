#!/usr/bin/env node
import { DEFAULT_BACKEND_PORT } from "@mcp-studio/shared";
import { Command } from "commander";

const program = new Command()
  .name("mcp-studio")
  .description("Postman + ESLint for MCP servers")
  .version("0.0.1");

program
  .command("dev", { isDefault: true })
  .description("Start MCP Studio")
  .option("-p, --port <port>", "Backend port", String(DEFAULT_BACKEND_PORT))
  .action(async (opts) => {
    console.log(`Starting MCP Studio on port ${opts.port}...`);
    // Phase 1: wire up server + client start
  });

program
  .command("scan")
  .description("Scan an MCP server for compliance and quality (CI mode)")
  .requiredOption("--command <cmd>", "Command to start stdio MCP server")
  .option("--args <args...>", "Arguments for the command")
  .option("--url <url>", "URL for SSE or Streamable HTTP server")
  .option("--transport <type>", "Transport type: stdio, sse, streamable-http", "stdio")
  .option("--format <format>", "Output format: table or json", "table")
  .option("--min-score <score>", "Minimum passing score (exit 1 if below)", "0")
  .action(async (opts) => {
    console.log("Scanning...", opts);
    // Phase 4: wire up scanner
  });

program.parse();
