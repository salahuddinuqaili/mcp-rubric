import type { ScanResult } from "@mcp-studio/shared";
import { API_PREFIX } from "@mcp-studio/shared";
import type { WsEvent } from "@mcp-studio/shared";
import { create } from "zustand";
import { wsClient } from "../lib/ws-client.js";

interface ScannerState {
  currentResult: ScanResult | null;
  history: ScanResult[];
  scanning: boolean;
  progress: number;
  currentRule: string;

  runScan: (connectionId: string) => Promise<void>;
  fetchHistory: (connectionId?: string) => Promise<void>;
}

export const useScannerStore = create<ScannerState>((set) => {
  wsClient.on("scan:progress", (event: WsEvent) => {
    const { currentRule, progress } = event.payload as {
      connectionId: string;
      currentRule: string;
      progress: number;
    };
    set({ currentRule, progress });
  });

  return {
    currentResult: null,
    history: [],
    scanning: false,
    progress: 0,
    currentRule: "",

    runScan: async (connectionId) => {
      set({ scanning: true, progress: 0, currentRule: "", currentResult: null });
      try {
        const { result } = await wsClient.request<{ result: ScanResult }>("run-scan", {
          connectionId,
        });
        set((state) => ({
          currentResult: result,
          scanning: false,
          progress: 1,
          history: [result, ...state.history],
        }));
      } catch {
        set({ scanning: false });
      }
    },

    fetchHistory: async (connectionId) => {
      const params = connectionId ? `?connectionId=${connectionId}` : "";
      const res = await fetch(`${API_PREFIX}/scans${params}`);
      const { results } = (await res.json()) as { results: ScanResult[] };
      set({ history: results });
    },
  };
});
