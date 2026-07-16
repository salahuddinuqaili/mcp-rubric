#!/usr/bin/env node
import { readFileSync } from "node:fs";
import type { TransportConfig } from "@mcp-studio/shared";
import { DEFAULT_BACKEND_PORT } from "@mcp-studio/shared";
import { Command } from "commander";
import { startDev } from "./dev.js";
import { runScanCommand } from "./scan.js";

const program = new Command()
  .name("mcp-studio")
  .description("Postman + ESLint for MCP servers")
  .version("0.1.0");

program
  .command("dev", { isDefault: true })
  .description("Start MCP Studio web UI")
  .option("-p, --port <port>", "Backend port", String(DEFAULT_BACKEND_PORT))
  .action(async (opts) => {
    await startDev(Number(opts.port));
  });

program
  .command("scan")
  .description("Scan an MCP server for compliance and quality (CI mode)")
  .option("--command <cmd>", "Command to start stdio MCP server")
  .option("--args <args...>", "Arguments for the command")
  .option("--url <url>", "URL for SSE or Streamable HTTP server")
  .option("--transport <type>", "Transport type: stdio, sse, streamable-http", "stdio")
  .option("--format <format>", "Output format: table or json", "table")
  .option("--min-score <score>", "Minimum passing score (exit 1 if below)", "0")
  .option("--config <path>", "Path to JSON connection config file")
  .action(async (opts) => {
    let transport: TransportConfig;

    if (opts.config) {
      const configContent = readFileSync(opts.config, "utf-8");
      const config = JSON.parse(configContent) as { name?: string; transport: TransportConfig };
      transport = config.transport;
    } else if (opts.url) {
      const type = opts.transport === "sse" ? "sse" : "streamable-http";
      transport = { type, url: opts.url } as TransportConfig;
    } else if (opts.command) {
      transport = {
        type: "stdio",
        command: opts.command,
        args: opts.args,
      };
    } else {
      console.error("Error: either --command, --url, or --config is required");
      process.exit(3);
    }

    const exitCode = await runScanCommand(transport, {
      format: opts.format as "table" | "json",
      minScore: Number(opts.minScore),
    });
    process.exit(exitCode);
  });

program.parse();
