import type { ResourceReadRecord, ToolCallRecord } from "@mcp-studio/shared";
import { getDb } from "./index.js";

// ============================================================
// Tool Call Records
// ============================================================

export function insertToolCallRecord(record: ToolCallRecord): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO tool_call_records (id, connection_id, connection_name, tool_name, arguments, result, status, started_at, completed_at, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.connectionId,
    record.connectionName,
    record.toolName,
    JSON.stringify(record.arguments),
    record.result ? JSON.stringify(record.result) : null,
    record.status,
    record.startedAt,
    record.completedAt ?? null,
    record.durationMs ?? null,
  );
}

export function updateToolCallRecord(
  id: string,
  update: Pick<ToolCallRecord, "result" | "status" | "completedAt" | "durationMs">,
): void {
  const db = getDb();
  db.prepare(
    "UPDATE tool_call_records SET result = ?, status = ?, completed_at = ?, duration_ms = ? WHERE id = ?",
  ).run(
    update.result ? JSON.stringify(update.result) : null,
    update.status,
    update.completedAt ?? null,
    update.durationMs ?? null,
    id,
  );
}

export interface ToolCallFilter {
  connectionId?: string;
  toolName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export function getToolCallRecords(filter: ToolCallFilter = {}): ToolCallRecord[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.connectionId) {
    conditions.push("connection_id = ?");
    params.push(filter.connectionId);
  }
  if (filter.toolName) {
    conditions.push("tool_name = ?");
    params.push(filter.toolName);
  }
  if (filter.status) {
    conditions.push("status = ?");
    params.push(filter.status);
  }
  if (filter.startDate) {
    conditions.push("started_at >= ?");
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    conditions.push("started_at <= ?");
    params.push(filter.endDate);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filter.limit ?? 100;
  const offset = filter.offset ?? 0;

  const rows = db
    .prepare(`SELECT * FROM tool_call_records ${where} ORDER BY started_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as ToolCallRow[];

  return rows.map(rowToToolCallRecord);
}

export function deleteToolCallRecord(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM tool_call_records WHERE id = ?").run(id);
  return result.changes > 0;
}

export function deleteAllToolCallRecords(): number {
  const db = getDb();
  const result = db.prepare("DELETE FROM tool_call_records").run();
  return result.changes;
}

// ============================================================
// Resource Read Records
// ============================================================

export function insertResourceReadRecord(record: ResourceReadRecord): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO resource_read_records (id, connection_id, connection_name, resource_uri, result, status, timestamp, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.connectionId,
    record.connectionName,
    record.resourceUri,
    record.result ? JSON.stringify(record.result) : null,
    record.status,
    record.timestamp,
    record.durationMs ?? null,
  );
}

export function updateResourceReadRecord(
  id: string,
  update: Pick<ResourceReadRecord, "result" | "status" | "durationMs">,
): void {
  const db = getDb();
  db.prepare(
    "UPDATE resource_read_records SET result = ?, status = ?, duration_ms = ? WHERE id = ?",
  ).run(
    update.result ? JSON.stringify(update.result) : null,
    update.status,
    update.durationMs ?? null,
    id,
  );
}

export interface ResourceReadFilter {
  connectionId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export function getResourceReadRecords(filter: ResourceReadFilter = {}): ResourceReadRecord[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.connectionId) {
    conditions.push("connection_id = ?");
    params.push(filter.connectionId);
  }
  if (filter.startDate) {
    conditions.push("timestamp >= ?");
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    conditions.push("timestamp <= ?");
    params.push(filter.endDate);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filter.limit ?? 100;
  const offset = filter.offset ?? 0;

  const rows = db
    .prepare(
      `SELECT * FROM resource_read_records ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as ResourceReadRow[];

  return rows.map(rowToResourceReadRecord);
}

export function deleteResourceReadRecord(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM resource_read_records WHERE id = ?").run(id);
  return result.changes > 0;
}

export function deleteAllResourceReadRecords(): number {
  const db = getDb();
  const result = db.prepare("DELETE FROM resource_read_records").run();
  return result.changes;
}

// ============================================================
// Row mapping helpers
// ============================================================

interface ToolCallRow {
  id: string;
  connection_id: string;
  connection_name: string;
  tool_name: string;
  arguments: string;
  result: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

function rowToToolCallRecord(row: ToolCallRow): ToolCallRecord {
  return {
    id: row.id,
    connectionId: row.connection_id,
    connectionName: row.connection_name,
    toolName: row.tool_name,
    arguments: JSON.parse(row.arguments) as Record<string, unknown>,
    result: row.result ? (JSON.parse(row.result) as ToolCallRecord["result"]) : null,
    status: row.status as ToolCallRecord["status"],
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    durationMs: row.duration_ms ?? undefined,
  };
}

interface ResourceReadRow {
  id: string;
  connection_id: string;
  connection_name: string;
  resource_uri: string;
  result: string | null;
  status: string;
  timestamp: string;
  duration_ms: number | null;
}

function rowToResourceReadRecord(row: ResourceReadRow): ResourceReadRecord {
  return {
    id: row.id,
    connectionId: row.connection_id,
    connectionName: row.connection_name,
    resourceUri: row.resource_uri,
    result: row.result ? (JSON.parse(row.result) as ResourceReadRecord["result"]) : null,
    status: row.status as ResourceReadRecord["status"],
    timestamp: row.timestamp,
    durationMs: row.duration_ms ?? undefined,
  };
}
