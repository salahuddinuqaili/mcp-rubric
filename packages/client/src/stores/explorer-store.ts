import type { McpPrompt, McpResource, McpResourceTemplate, McpTool } from "mcp-studio-shared";
import type { WsEvent } from "mcp-studio-shared";
import { create } from "zustand";
import { wsClient } from "../lib/ws-client.js";

interface ExplorerState {
  tools: McpTool[];
  resources: McpResource[];
  resourceTemplates: McpResourceTemplate[];
  prompts: McpPrompt[];
  loading: boolean;

  fetchTools: (connectionId: string) => Promise<void>;
  fetchResources: (connectionId: string) => Promise<void>;
  fetchPrompts: (connectionId: string) => Promise<void>;
  fetchAll: (connectionId: string) => Promise<void>;
  clear: () => void;
}

export const useExplorerStore = create<ExplorerState>((set) => {
  // Auto-refresh on server-side list changes
  wsClient.on("tools:changed", (event: WsEvent) => {
    const { connectionId } = event.payload as { connectionId: string };
    wsClient
      .request<{ tools: McpTool[] }>("list-tools", { connectionId })
      .then(({ tools }) => set({ tools }))
      .catch(() => {});
  });

  wsClient.on("resources:changed", (event: WsEvent) => {
    const { connectionId } = event.payload as { connectionId: string };
    wsClient
      .request<{ resources: McpResource[]; resourceTemplates: McpResourceTemplate[] }>(
        "list-resources",
        { connectionId },
      )
      .then(({ resources, resourceTemplates }) => set({ resources, resourceTemplates }))
      .catch(() => {});
  });

  wsClient.on("prompts:changed", (event: WsEvent) => {
    const { connectionId } = event.payload as { connectionId: string };
    wsClient
      .request<{ prompts: McpPrompt[] }>("list-prompts", { connectionId })
      .then(({ prompts }) => set({ prompts }))
      .catch(() => {});
  });

  return {
    tools: [],
    resources: [],
    resourceTemplates: [],
    prompts: [],
    loading: false,

    fetchTools: async (connectionId) => {
      set({ loading: true });
      try {
        const { tools } = await wsClient.request<{ tools: McpTool[] }>("list-tools", {
          connectionId,
        });
        set({ tools, loading: false });
      } catch {
        set({ loading: false });
      }
    },

    fetchResources: async (connectionId) => {
      set({ loading: true });
      try {
        const { resources, resourceTemplates } = await wsClient.request<{
          resources: McpResource[];
          resourceTemplates: McpResourceTemplate[];
        }>("list-resources", { connectionId });
        set({ resources, resourceTemplates, loading: false });
      } catch {
        set({ loading: false });
      }
    },

    fetchPrompts: async (connectionId) => {
      set({ loading: true });
      try {
        const { prompts } = await wsClient.request<{ prompts: McpPrompt[] }>("list-prompts", {
          connectionId,
        });
        set({ prompts, loading: false });
      } catch {
        set({ loading: false });
      }
    },

    fetchAll: async (connectionId) => {
      set({ loading: true });
      try {
        const [toolsResult, resourcesResult, promptsResult] = await Promise.all([
          wsClient.request<{ tools: McpTool[] }>("list-tools", { connectionId }),
          wsClient.request<{
            resources: McpResource[];
            resourceTemplates: McpResourceTemplate[];
          }>("list-resources", { connectionId }),
          wsClient.request<{ prompts: McpPrompt[] }>("list-prompts", { connectionId }),
        ]);
        set({
          tools: toolsResult.tools,
          resources: resourcesResult.resources,
          resourceTemplates: resourcesResult.resourceTemplates,
          prompts: promptsResult.prompts,
          loading: false,
        });
      } catch {
        set({ loading: false });
      }
    },

    clear: () => {
      set({ tools: [], resources: [], resourceTemplates: [], prompts: [] });
    },
  };
});
