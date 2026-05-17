import type { ScanResult } from "@mcp-studio/shared";
import { getDb } from "./index.js";

interface ScanResultRow {
  id: string;
  connection_id: string;
  connection_name: string;
  server_info: string | null;
  score: number;
  grade: string;
  diagnostics: string;
  summary: string;
  scanned_at: string;
  duration_ms: number;
}

function rowToScanResult(row: ScanResultRow): ScanResult {
  return {
    id: row.id,
    connectionId: row.connection_id,
    connectionName: row.connection_name,
    serverInfo: row.server_info
      ? (JSON.parse(row.server_info) as ScanResult["serverInfo"])
      : undefined,
    score: row.score,
    grade: row.grade as ScanResult["grade"],
    diagnostics: JSON.parse(row.diagnostics) as ScanResult["diagnostics"],
    summary: JSON.parse(row.summary) as ScanResult["summary"],
    scannedAt: row.scanned_at,
    durationMs: row.duration_ms,
  };
}

export function insertScanResult(result: ScanResult): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO scan_results (id, connection_id, connection_name, server_info, score, grade, diagnostics, summary, scanned_at, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    result.id,
    result.connectionId,
    result.connectionName,
    result.serverInfo ? JSON.stringify(result.serverInfo) : null,
    result.score,
    result.grade,
    JSON.stringify(result.diagnostics),
    JSON.stringify(result.summary),
    result.scannedAt,
    result.durationMs,
  );
}

export function getScanResults(connectionId?: string): ScanResult[] {
  const db = getDb();
  if (connectionId) {
    const rows = db
      .prepare("SELECT * FROM scan_results WHERE connection_id = ? ORDER BY scanned_at DESC")
      .all(connectionId) as ScanResultRow[];
    return rows.map(rowToScanResult);
  }
  const rows = db
    .prepare("SELECT * FROM scan_results ORDER BY scanned_at DESC LIMIT 50")
    .all() as ScanResultRow[];
  return rows.map(rowToScanResult);
}

export function getScanResultById(id: string): ScanResult | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM scan_results WHERE id = ?").get(id) as
    | ScanResultRow
    | undefined;
  return row ? rowToScanResult(row) : undefined;
}
