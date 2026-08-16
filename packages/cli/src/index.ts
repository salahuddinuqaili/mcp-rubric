#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { Command } from "commander";
import type { TransportConfig } from "mcp-rubric-shared";
import { DEFAULT_BACKEND_PORT } from "mcp-rubric-shared";
import { startDev } from "./dev.js";
import { runScanCommand } from "./scan.js";

const program = new Command()
  .name("mcp-rubric")
  .description("Rubric — Postman + ESLint for MCP servers")
  .version("0.2.0");

program
  .command("dev", { isDefault: true })
  .description("Start the Rubric web UI")
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
      // Read/parse failures must exit 3, not bubble as an unhandled rejection — commander does
      // not await this action, so a throw would exit 1 and read as "score below threshold" in CI.
      try {
        const configContent = readFileSync(opts.config, "utf-8");
        const config = JSON.parse(configContent) as { transport: TransportConfig };
        transport = config.transport;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error: could not read config ${opts.config}: ${message}`);
        process.exit(3);
      }
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

    const minScore = Number(opts.minScore);
    if (Number.isNaN(minScore)) {
      // Without this an unparseable threshold makes every comparison false, silently passing the gate.
      console.error(`Error: --min-score must be a number, got "${opts.minScore}"`);
      process.exit(3);
    }

    const exitCode = await runScanCommand(transport, {
      format: opts.format as "table" | "json",
      minScore,
    });
    process.exit(exitCode);
  });

program.parse();
