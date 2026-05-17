import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { runScanCommand } from "../../packages/cli/src/scan.js";
import { closeDb } from "../../packages/server/src/db/index.js";
import { ConnectionManager } from "../../packages/server/src/mcp/connection-manager.js";
import { createDefaultRegistry, runScan } from "../../packages/server/src/scanner/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ECHO_SERVER_PATH = path.resolve(__dirname, "../fixtures/echo-server/dist/index.js");

describe("CLI scan command", () => {
  afterAll(() => {
    closeDb();
  });

  it("returns exit code 0 when score meets min-score", async () => {
    const exitCode = await runScanCommand(
      { type: "stdio", command: "node", args: [ECHO_SERVER_PATH] },
      { format: "json", minScore: 0 },
    );
    expect(exitCode).toBe(0);
  });

  it("returns exit code 1 when score is below min-score", async () => {
    const exitCode = await runScanCommand(
      { type: "stdio", command: "node", args: [ECHO_SERVER_PATH] },
      { format: "json", minScore: 100 },
    );
    expect(exitCode).toBe(1);
  });

  it("returns exit code 2 for connection failures", async () => {
    const exitCode = await runScanCommand(
      { type: "stdio", command: "nonexistent-binary-that-does-not-exist" },
      { format: "json", minScore: 0 },
    );
    expect(exitCode).toBe(2);
  });

  it("scanner produces valid results against echo-server", async () => {
    const manager = new ConnectionManager();
    const connection = await manager.connect("cli-test", {
      type: "stdio",
      command: "node",
      args: [ECHO_SERVER_PATH],
    });

    const registry = createDefaultRegistry();
    const result = await runScan(connection.config.id, manager, registry);

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(["A", "B", "C", "D", "F"]).toContain(result.grade);
    expect(result.diagnostics).toBeInstanceOf(Array);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.summary.total).toBe(16);

    await manager.disconnect(connection.config.id);
  });
});
