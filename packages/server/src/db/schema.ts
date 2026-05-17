export const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS tool_call_records (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL,
    connection_name TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    arguments TEXT NOT NULL,
    result TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_ms INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS resource_read_records (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL,
    connection_name TEXT NOT NULL,
    resource_uri TEXT NOT NULL,
    result TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    timestamp TEXT NOT NULL,
    duration_ms INTEGER
  )`,
  "CREATE INDEX IF NOT EXISTS idx_tool_calls_connection ON tool_call_records(connection_id)",
  "CREATE INDEX IF NOT EXISTS idx_tool_calls_tool_name ON tool_call_records(tool_name)",
  "CREATE INDEX IF NOT EXISTS idx_tool_calls_started_at ON tool_call_records(started_at)",
  "CREATE INDEX IF NOT EXISTS idx_resource_reads_connection ON resource_read_records(connection_id)",
  "CREATE INDEX IF NOT EXISTS idx_resource_reads_timestamp ON resource_read_records(timestamp)",
  `CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    items TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS scan_results (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL,
    connection_name TEXT NOT NULL,
    server_info TEXT,
    score INTEGER NOT NULL,
    grade TEXT NOT NULL,
    diagnostics TEXT NOT NULL,
    summary TEXT NOT NULL,
    scanned_at TEXT NOT NULL,
    duration_ms INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_scans_connection ON scan_results(connection_id)",
  "CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scan_results(scanned_at)",
];
