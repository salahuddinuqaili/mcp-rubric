import type { McpPrompt, McpResource, McpTool, ServerCapabilities } from "mcp-rubric-shared";

export interface ScanContext {
  connectionId: string;
  capabilities?: ServerCapabilities;
  tools: McpTool[];
  resources: McpResource[];
  prompts: McpPrompt[];
}
