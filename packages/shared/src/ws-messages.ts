import type {
  ConnectionStatus,
  ContentBlock,
  McpPrompt,
  McpResource,
  McpResourceTemplate,
  McpTool,
  ResourceReadRecord,
  ScanResult,
  ServerCapabilities,
  ToolCallRecord,
  TransportConfig,
} from "./types.js";

// ============================================================
// Base envelope
// ============================================================

export interface WsRequest {
  id: string;
  type: string;
  payload: unknown;
}

export interface WsResponse {
  id: string;
  type: string;
  payload: unknown;
  error?: string;
}

export interface WsEvent {
  type: string;
  payload: unknown;
}

// ============================================================
// Connection messages
// ============================================================

export interface ConnectRequest extends WsRequest {
  type: "connect";
  payload: {
    name: string;
    transport: TransportConfig;
  };
}

export interface ConnectResponse extends WsResponse {
  type: "connect";
  payload: {
    connectionId: string;
    serverInfo?: { name: string; version: string };
    capabilities?: ServerCapabilities;
  };
}

export interface DisconnectRequest extends WsRequest {
  type: "disconnect";
  payload: { connectionId: string };
}

export interface DisconnectResponse extends WsResponse {
  type: "disconnect";
  payload: { connectionId: string };
}

export interface ConnectionStatusEvent extends WsEvent {
  type: "connection:status";
  payload: {
    connectionId: string;
    status: ConnectionStatus;
    error?: string;
  };
}

// ============================================================
// Discovery messages
// ============================================================

export interface ListToolsRequest extends WsRequest {
  type: "list-tools";
  payload: { connectionId: string };
}

export interface ListToolsResponse extends WsResponse {
  type: "list-tools";
  payload: { tools: McpTool[] };
}

export interface ListResourcesRequest extends WsRequest {
  type: "list-resources";
  payload: { connectionId: string };
}

export interface ListResourcesResponse extends WsResponse {
  type: "list-resources";
  payload: {
    resources: McpResource[];
    resourceTemplates: McpResourceTemplate[];
  };
}

export interface ListPromptsRequest extends WsRequest {
  type: "list-prompts";
  payload: { connectionId: string };
}

export interface ListPromptsResponse extends WsResponse {
  type: "list-prompts";
  payload: { prompts: McpPrompt[] };
}

// ============================================================
// Execution messages
// ============================================================

export interface CallToolRequest extends WsRequest {
  type: "call-tool";
  payload: {
    connectionId: string;
    toolName: string;
    arguments: Record<string, unknown>;
  };
}

export interface CallToolResponse extends WsResponse {
  type: "call-tool";
  payload: {
    record: ToolCallRecord;
  };
}

export interface ReadResourceRequest extends WsRequest {
  type: "read-resource";
  payload: {
    connectionId: string;
    uri: string;
  };
}

export interface ReadResourceResponse extends WsResponse {
  type: "read-resource";
  payload: {
    record: ResourceReadRecord;
  };
}

export interface GetPromptRequest extends WsRequest {
  type: "get-prompt";
  payload: {
    connectionId: string;
    promptName: string;
    arguments?: Record<string, string>;
  };
}

export interface GetPromptResponse extends WsResponse {
  type: "get-prompt";
  payload: {
    description?: string;
    messages: Array<{
      role: "user" | "assistant";
      content: ContentBlock;
    }>;
  };
}

// ============================================================
// Scanner messages
// ============================================================

export interface RunScanRequest extends WsRequest {
  type: "run-scan";
  payload: { connectionId: string };
}

export interface RunScanResponse extends WsResponse {
  type: "run-scan";
  payload: { result: ScanResult };
}

export interface ScanProgressEvent extends WsEvent {
  type: "scan:progress";
  payload: {
    connectionId: string;
    currentRule: string;
    progress: number;
  };
}

// ============================================================
// Server change notifications
// ============================================================

export interface ToolsChangedEvent extends WsEvent {
  type: "tools:changed";
  payload: { connectionId: string };
}

export interface ResourcesChangedEvent extends WsEvent {
  type: "resources:changed";
  payload: { connectionId: string };
}

export interface PromptsChangedEvent extends WsEvent {
  type: "prompts:changed";
  payload: { connectionId: string };
}

// ============================================================
// Union types
// ============================================================

export type ClientMessage =
  | ConnectRequest
  | DisconnectRequest
  | ListToolsRequest
  | ListResourcesRequest
  | ListPromptsRequest
  | CallToolRequest
  | ReadResourceRequest
  | GetPromptRequest
  | RunScanRequest;

export type ServerMessage =
  | ConnectResponse
  | DisconnectResponse
  | ListToolsResponse
  | ListResourcesResponse
  | ListPromptsResponse
  | CallToolResponse
  | ReadResourceResponse
  | GetPromptResponse
  | RunScanResponse;

export type ServerEvent =
  | ConnectionStatusEvent
  | ScanProgressEvent
  | ToolsChangedEvent
  | ResourcesChangedEvent
  | PromptsChangedEvent;
