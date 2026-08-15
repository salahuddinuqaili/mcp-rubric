import { ConnectionManager } from "mcp-studio-server/mcp/connection-manager.js";
import { createDefaultRegistry, runScan } from "mcp-studio-server/scanner/index.js";
import type { ScanResult, TransportConfig } from "mcp-studio-shared";

interface ScanOptions {
  format: "table" | "json";
  minScore: number;
}

export async function runScanCommand(
  transport: TransportConfig,
  options: ScanOptions,
): Promise<number> {
  const manager = new ConnectionManager();

  let connectionId: string | undefined;
  try {
    const connection = await manager.connect("scan-target", transport);
    connectionId = connection.config.id;

    const registry = createDefaultRegistry();
    const result = await runScan(connectionId, manager, registry);

    if (options.format === "json") {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printTable(result);
    }

    await manager.disconnect(connectionId);

    if (result.score < options.minScore) {
      return 1;
    }
    return 0;
  } catch (err) {
    if (connectionId) {
      try {
        await manager.disconnect(connectionId);
      } catch {
        // ignore cleanup errors
      }
    }

    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("ENOENT") ||
      message.includes("connect") ||
      message.includes("Connection")
    ) {
      console.error(`Connection failed: ${message}`);
      return 2;
    }
    console.error(`Internal error: ${message}`);
    return 3;
  }
}

function printTable(result: ScanResult): void {
  console.log("");
  console.log(`  Score: ${result.score}/100 (${result.grade})`);
  console.log(
    `  ${result.summary.passed}/${result.summary.total} rules passed | ${result.summary.errors} errors | ${result.summary.warnings} warnings | ${result.summary.infos} info`,
  );
  if (result.serverInfo) {
    console.log(`  Server: ${result.serverInfo.name} v${result.serverInfo.version}`);
  }
  console.log(`  Duration: ${result.durationMs}ms`);
  console.log("");

  if (result.diagnostics.length === 0) {
    console.log("  No issues found.");
    return;
  }

  // Column widths
  const sevWidth = 7;
  const ruleWidth = Math.max(...result.diagnostics.map((d) => d.ruleId.length), 4);
  const targetWidth = Math.max(...result.diagnostics.map((d) => (d.target ?? "").length), 6);

  const header = `  ${"SEV".padEnd(sevWidth)} ${"RULE".padEnd(ruleWidth)} ${"TARGET".padEnd(targetWidth)} MESSAGE`;
  console.log(header);
  console.log(`  ${"-".repeat(header.length - 2)}`);

  for (const d of result.diagnostics) {
    const sev = d.severity.toUpperCase().padEnd(sevWidth);
    const rule = d.ruleId.padEnd(ruleWidth);
    const target = (d.target ?? "").padEnd(targetWidth);
    console.log(`  ${sev} ${rule} ${target} ${d.message}`);
  }
  console.log("");
}
