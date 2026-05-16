// ============================================================
// Transport Configuration
// ============================================================

export type TransportType = "stdio" | "sse" | "streamable-http";

export interface StdioConfig {
  type: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface SseConfig {
  type: "sse";
  url: string;
  headers?: Record<string, string>;
}

export interface StreamableHttpConfig {
  type: "streamable-http";
  url: string;
  headers?: Record<string, string>;
}

export type TransportConfig = StdioConfig | SseConfig | StreamableHttpConfig;

// ============================================================
// Server Connection
// ============================================================

export interface ServerConnectionConfig {
  id: string;
  name: string;
  transport: TransportConfig;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface ServerConnection {
  config: ServerConnectionConfig;
  status: ConnectionStatus;
  error?: string;
  serverInfo?: {
    name: string;
    version: string;
  };
  capabilities?: ServerCapabilities;
  connectedAt?: string;
}

export interface ServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  prompts?: { listChanged?: boolean };
}

// ============================================================
// MCP Entities
// ============================================================

export type JsonSchema = Record<string, unknown>;

export interface McpTool {
  connectionId: string;
  name: string;
  title?: string;
  description?: string;
  inputSchema: JsonSchema;
  annotations?: ToolAnnotations;
}

export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface McpResource {
  connectionId: string;
  uri: string;
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
}

export interface McpResourceTemplate {
  connectionId: string;
  uriTemplate: string;
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
}

export interface McpPrompt {
  connectionId: string;
  name: string;
  title?: string;
  description?: string;
  arguments?: PromptArgument[];
}

export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

// ============================================================
// Tool Call Records (persisted)
// ============================================================

export interface ContentBlock {
  type: "text" | "image" | "audio" | "resource" | "resource_link";
  text?: string;
  data?: string;
  mimeType?: string;
  uri?: string;
}

export interface ToolCallResult {
  content: ContentBlock[];
  isError?: boolean;
}

export interface ToolCallRecord {
  id: string;
  connectionId: string;
  connectionName: string;
  toolName: string;
  arguments: Record<string, unknown>;
  result: ToolCallResult | null;
  status: "pending" | "success" | "error";
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

// ============================================================
// Resource Read Records (persisted)
// ============================================================

export interface ResourceReadResult {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
  }>;
}

export interface ResourceReadRecord {
  id: string;
  connectionId: string;
  connectionName: string;
  resourceUri: string;
  result: ResourceReadResult | null;
  status: "pending" | "success" | "error";
  timestamp: string;
  durationMs?: number;
}

// ============================================================
// Collections (persisted)
// ============================================================

export interface Collection {
  id: string;
  name: string;
  description?: string;
  items: CollectionItem[];
  createdAt: string;
  updatedAt: string;
}

export type CollectionItem = CollectionToolCall | CollectionResourceRead | CollectionPromptGet;

export interface CollectionToolCall {
  type: "tool-call";
  id: string;
  connectionConfig: TransportConfig;
  toolName: string;
  arguments: Record<string, unknown>;
  label?: string;
}

export interface CollectionResourceRead {
  type: "resource-read";
  id: string;
  connectionConfig: TransportConfig;
  resourceUri: string;
  label?: string;
}

export interface CollectionPromptGet {
  type: "prompt-get";
  id: string;
  connectionConfig: TransportConfig;
  promptName: string;
  arguments?: Record<string, string>;
  label?: string;
}

// ============================================================
// Scanner / Validator
// ============================================================

export type RuleSeverity = "error" | "warning" | "info";
export type RuleCategory = "protocol" | "quality" | "security";

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: RuleSeverity;
  weight: number;
}

export interface RuleDiagnostic {
  ruleId: string;
  severity: RuleSeverity;
  message: string;
  target?: string;
}

export interface ScanResult {
  id: string;
  connectionId: string;
  connectionName: string;
  serverInfo?: { name: string; version: string };
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  diagnostics: RuleDiagnostic[];
  summary: {
    total: number;
    passed: number;
    errors: number;
    warnings: number;
    infos: number;
  };
  scannedAt: string;
  durationMs: number;
}
