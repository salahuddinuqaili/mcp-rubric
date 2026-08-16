import type { ResourceReadRecord, ToolCallRecord } from "mcp-rubric-shared";
import { API_PREFIX } from "mcp-rubric-shared";
import { create } from "zustand";

interface HistoryState {
  toolCalls: ToolCallRecord[];
  resourceReads: ResourceReadRecord[];
  loading: boolean;

  fetchToolCalls: (filters?: Record<string, string>) => Promise<void>;
  fetchResourceReads: (filters?: Record<string, string>) => Promise<void>;
  deleteToolCall: (id: string) => Promise<void>;
  deleteResourceRead: (id: string) => Promise<void>;
  clearAllToolCalls: () => Promise<void>;
  clearAllResourceReads: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  toolCalls: [],
  resourceReads: [],
  loading: false,

  fetchToolCalls: async (filters = {}) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_PREFIX}/history/tool-calls?${params}`);
      const { records } = (await res.json()) as { records: ToolCallRecord[] };
      set({ toolCalls: records, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchResourceReads: async (filters = {}) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_PREFIX}/history/resource-reads?${params}`);
      const { records } = (await res.json()) as { records: ResourceReadRecord[] };
      set({ resourceReads: records, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  deleteToolCall: async (id) => {
    await fetch(`${API_PREFIX}/history/tool-calls/${id}`, { method: "DELETE" });
    set({ toolCalls: get().toolCalls.filter((r) => r.id !== id) });
  },

  deleteResourceRead: async (id) => {
    await fetch(`${API_PREFIX}/history/resource-reads/${id}`, { method: "DELETE" });
    set({ resourceReads: get().resourceReads.filter((r) => r.id !== id) });
  },

  clearAllToolCalls: async () => {
    await fetch(`${API_PREFIX}/history/tool-calls`, { method: "DELETE" });
    set({ toolCalls: [] });
  },

  clearAllResourceReads: async () => {
    await fetch(`${API_PREFIX}/history/resource-reads`, { method: "DELETE" });
    set({ resourceReads: [] });
  },
}));
