import { randomUUID } from "node:crypto";
import type { WSContext } from "hono/ws";
import type {
  CollectionItem,
  ToolCallRecord,
  WsEvent,
  WsRequest,
  WsResponse,
} from "mcp-studio-shared";
import { getCollectionById } from "../db/collections-repository.js";
import {
  insertResourceReadRecord,
  insertToolCallRecord,
  updateResourceReadRecord,
  updateToolCallRecord,
} from "../db/history-repository.js";
import { insertScanResult } from "../db/scan-repository.js";
import type { ConnectionManager } from "../mcp/connection-manager.js";
import { createDefaultRegistry, runScan } from "../scanner/index.js";

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

      case "call-tool": {
        const {
          connectionId,
          toolName,
          arguments: args,
        } = request.payload as {
          connectionId: string;
          toolName: string;
          arguments: Record<string, unknown>;
        };

        const recordId = randomUUID();
        const startedAt = new Date().toISOString();
        const connectionName = this.manager.getConnectionName(connectionId);

        const record: ToolCallRecord = {
          id: recordId,
          connectionId,
          connectionName,
          toolName,
          arguments: args,
          result: null,
          status: "pending",
          startedAt,
        };
        insertToolCallRecord(record);

        const start = Date.now();
        try {
          const result = await this.manager.callTool(connectionId, toolName, args);
          const durationMs = Date.now() - start;
          const completedAt = new Date().toISOString();
          const status = result.isError ? "error" : "success";

          updateToolCallRecord(recordId, { result, status, completedAt, durationMs });
          record.result = result;
          record.status = status;
          record.completedAt = completedAt;
          record.durationMs = durationMs;
        } catch (err) {
          const durationMs = Date.now() - start;
          const completedAt = new Date().toISOString();
          updateToolCallRecord(recordId, {
            result: { content: [{ type: "text", text: String(err) }], isError: true },
            status: "error",
            completedAt,
            durationMs,
          });
          record.result = { content: [{ type: "text", text: String(err) }], isError: true };
          record.status = "error";
          record.completedAt = completedAt;
          record.durationMs = durationMs;
        }

        return {
          id: request.id,
          type: "call-tool",
          payload: { record },
        };
      }

      case "read-resource": {
        const { connectionId, uri } = request.payload as {
          connectionId: string;
          uri: string;
        };

        const recordId = randomUUID();
        const timestamp = new Date().toISOString();
        const connectionName = this.manager.getConnectionName(connectionId);

        insertResourceReadRecord({
          id: recordId,
          connectionId,
          connectionName,
          resourceUri: uri,
          result: null,
          status: "pending",
          timestamp,
        });

        const start = Date.now();
        try {
          const result = await this.manager.readResource(connectionId, uri);
          const durationMs = Date.now() - start;

          updateResourceReadRecord(recordId, { result, status: "success", durationMs });

          return {
            id: request.id,
            type: "read-resource",
            payload: {
              record: {
                id: recordId,
                connectionId,
                connectionName,
                resourceUri: uri,
                result,
                status: "success",
                timestamp,
                durationMs,
              },
            },
          };
        } catch (err) {
          const durationMs = Date.now() - start;
          updateResourceReadRecord(recordId, { result: null, status: "error", durationMs });
          throw err;
        }
      }

      case "get-prompt": {
        const {
          connectionId,
          promptName,
          arguments: args,
        } = request.payload as {
          connectionId: string;
          promptName: string;
          arguments?: Record<string, string>;
        };

        const result = await this.manager.getPrompt(connectionId, promptName, args);
        return {
          id: request.id,
          type: "get-prompt",
          payload: result,
        };
      }

      case "run-scan": {
        const { connectionId } = request.payload as { connectionId: string };
        const registry = createDefaultRegistry();

        const result = await runScan(
          connectionId,
          this.manager,
          registry,
          (connId, rule, progress) => {
            this.broadcast({
              type: "scan:progress",
              payload: { connectionId: connId, currentRule: rule, progress },
            });
          },
        );

        insertScanResult(result);

        return {
          id: request.id,
          type: "run-scan",
          payload: { result },
        };
      }

      case "run-collection": {
        const { collectionId, connectionId } = request.payload as {
          collectionId: string;
          connectionId: string;
        };

        const collection = getCollectionById(collectionId);
        if (!collection) throw new Error("Collection not found");

        const results: Array<{ itemId: string; type: string; success: boolean; error?: string }> =
          [];

        for (const item of collection.items) {
          try {
            await this.executeCollectionItem(item, connectionId);
            results.push({ itemId: item.id, type: item.type, success: true });
          } catch (err) {
            results.push({
              itemId: item.id,
              type: item.type,
              success: false,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }

        return {
          id: request.id,
          type: "run-collection",
          payload: { collectionId, results },
        };
      }

      default:
        throw new Error(`Unknown message type: ${request.type}`);
    }
  }

  private async executeCollectionItem(item: CollectionItem, connectionId: string): Promise<void> {
    switch (item.type) {
      case "tool-call":
        await this.manager.callTool(connectionId, item.toolName, item.arguments);
        break;
      case "resource-read":
        await this.manager.readResource(connectionId, item.resourceUri);
        break;
      case "prompt-get":
        await this.manager.getPrompt(connectionId, item.promptName, item.arguments);
        break;
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
