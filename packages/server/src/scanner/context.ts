import type { McpPrompt, McpResource, McpTool, ServerCapabilities } from "@mcp-studio/shared";

export interface ScanContext {
  connectionId: string;
  capabilities?: ServerCapabilities;
  tools: McpTool[];
  resources: McpResource[];
  prompts: McpPrompt[];
}
