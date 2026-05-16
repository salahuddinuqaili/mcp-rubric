import type { WsEvent, WsRequest, WsResponse } from "@mcp-studio/shared";
import type { WSContext } from "hono/ws";
import type { ConnectionManager } from "../mcp/connection-manager.js";

type WsClient = WSContext<WebSocket>;

export class WsHandler {
  private clients = new Set<WsClient>();

  constructor(private manager: ConnectionManager) {
    this.setupManagerListeners();
  }

  handleOpen(ws: WsClient): void {
    this.clients.add(ws);
  }

  handleClose(ws: WsClient): void {
    this.clients.delete(ws);
  }

  async handleMessage(ws: WsClient, data: string): Promise<void> {
    let request: WsRequest;
    try {
      request = JSON.parse(data) as WsRequest;
    } catch {
      ws.send(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    try {
      const response = await this.routeMessage(request);
      ws.send(JSON.stringify(response));
    } catch (err) {
      const errorResponse: WsResponse = {
        id: request.id,
        type: request.type,
        payload: {},
        error: err instanceof Error ? err.message : String(err),
      };
      ws.send(JSON.stringify(errorResponse));
    }
  }

  private async routeMessage(request: WsRequest): Promise<WsResponse> {
    switch (request.type) {
      case "connect": {
        const { name, transport } = request.payload as {
          name: string;
          transport: Parameters<ConnectionManager["connect"]>[1];
        };
        const connection = await this.manager.connect(name, transport);
        return {
          id: request.id,
          type: "connect",
          payload: {
            connectionId: connection.config.id,
            serverInfo: connection.serverInfo,
            capabilities: connection.capabilities,
          },
        };
      }

      case "disconnect": {
        const { connectionId } = request.payload as { connectionId: string };
        await this.manager.disconnect(connectionId);
        return {
          id: request.id,
          type: "disconnect",
          payload: { connectionId },
        };
      }

      case "list-tools": {
        const { connectionId } = request.payload as { connectionId: string };
        const tools = await this.manager.listTools(connectionId);
        return {
          id: request.id,
          type: "list-tools",
          payload: { tools },
        };
      }

      case "list-resources": {
        const { connectionId } = request.payload as { connectionId: string };
        const result = await this.manager.listResources(connectionId);
        return {
          id: request.id,
          type: "list-resources",
          payload: result,
        };
      }

      case "list-prompts": {
        const { connectionId } = request.payload as { connectionId: string };
        const prompts = await this.manager.listPrompts(connectionId);
        return {
          id: request.id,
          type: "list-prompts",
          payload: { prompts },
        };
      }

      default:
        throw new Error(`Unknown message type: ${request.type}`);
    }
  }

  private broadcast(event: WsEvent): void {
    const data = JSON.stringify(event);
    for (const client of this.clients) {
      client.send(data);
    }
  }

  private setupManagerListeners(): void {
    this.manager.on("status-changed", (connectionId, status, error) => {
      this.broadcast({
        type: "connection:status",
        payload: { connectionId, status, error },
      });
    });

    this.manager.on("tools-changed", (connectionId) => {
      this.broadcast({
        type: "tools:changed",
        payload: { connectionId },
      });
    });

    this.manager.on("resources-changed", (connectionId) => {
      this.broadcast({
        type: "resources:changed",
        payload: { connectionId },
      });
    });

    this.manager.on("prompts-changed", (connectionId) => {
      this.broadcast({
        type: "prompts:changed",
        payload: { connectionId },
      });
    });
  }
}
