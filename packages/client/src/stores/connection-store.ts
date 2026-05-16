import type {
  ConnectionStatus,
  ServerCapabilities,
  ServerConnection,
  TransportConfig,
} from "@mcp-studio/shared";
import type { WsEvent } from "@mcp-studio/shared";
import { create } from "zustand";
import { wsClient } from "../lib/ws-client.js";

interface ConnectionState {
  connections: Map<string, ServerConnection>;
  activeConnectionId: string | null;
  connecting: boolean;

  connect: (name: string, transport: TransportConfig) => Promise<string>;
  disconnect: (connectionId: string) => Promise<void>;
  setActive: (connectionId: string | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => {
  // Subscribe to connection status events
  wsClient.on("connection:status", (event: WsEvent) => {
    const { connectionId, status, error } = event.payload as {
      connectionId: string;
      status: ConnectionStatus;
      error?: string;
    };

    set((state) => {
      const connections = new Map(state.connections);
      const existing = connections.get(connectionId);
      if (existing) {
        connections.set(connectionId, { ...existing, status, error });
      }

      // Clear active if disconnected
      const activeConnectionId =
        status === "disconnected" && state.activeConnectionId === connectionId
          ? null
          : state.activeConnectionId;

      return { connections, activeConnectionId };
    });
  });

  return {
    connections: new Map(),
    activeConnectionId: null,
    connecting: false,

    connect: async (name, transport) => {
      set({ connecting: true });
      try {
        const result = await wsClient.request<{
          connectionId: string;
          serverInfo?: { name: string; version: string };
          capabilities?: ServerCapabilities;
        }>("connect", { name, transport });

        const connection: ServerConnection = {
          config: { id: result.connectionId, name, transport },
          status: "connected",
          serverInfo: result.serverInfo,
          capabilities: result.capabilities,
          connectedAt: new Date().toISOString(),
        };

        set((state) => {
          const connections = new Map(state.connections);
          connections.set(result.connectionId, connection);
          return {
            connections,
            activeConnectionId: result.connectionId,
            connecting: false,
          };
        });

        return result.connectionId;
      } catch (err) {
        set({ connecting: false });
        throw err;
      }
    },

    disconnect: async (connectionId) => {
      await wsClient.request("disconnect", { connectionId });

      set((state) => {
        const connections = new Map(state.connections);
        connections.delete(connectionId);
        return {
          connections,
          activeConnectionId:
            state.activeConnectionId === connectionId ? null : state.activeConnectionId,
        };
      });
    },

    setActive: (connectionId) => {
      set({ activeConnectionId: connectionId });
    },
  };
});
