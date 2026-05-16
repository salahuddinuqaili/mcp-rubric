import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import type {
  ConnectionStatus,
  ContentBlock,
  McpPrompt,
  McpResource,
  McpResourceTemplate,
  McpTool,
  ResourceReadResult,
  ServerCapabilities,
  ServerConnection,
  ServerConnectionConfig,
  ToolCallResult,
  TransportConfig,
} from "@mcp-studio/shared";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  PromptListChangedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createTransport } from "./transport-factory.js";

interface ManagedConnection {
  config: ServerConnectionConfig;
  client: Client;
  transport: Transport;
  status: ConnectionStatus;
  error?: string;
  serverInfo?: { name: string; version: string };
  capabilities?: ServerCapabilities;
  connectedAt?: string;
}

export interface ConnectionManagerEvents {
  "status-changed": [connectionId: string, status: ConnectionStatus, error?: string];
  "tools-changed": [connectionId: string];
  "resources-changed": [connectionId: string];
  "prompts-changed": [connectionId: string];
}

export class ConnectionManager extends EventEmitter<ConnectionManagerEvents> {
  private connections = new Map<string, ManagedConnection>();

  async connect(name: string, transport: TransportConfig): Promise<ServerConnection> {
    const id = randomUUID();
    const config: ServerConnectionConfig = { id, name, transport };

    const mcpTransport = createTransport(transport);
    const client = new Client({ name: "mcp-studio", version: "0.0.1" });

    const managed: ManagedConnection = {
      config,
      client,
      transport: mcpTransport,
      status: "connecting",
    };

    this.connections.set(id, managed);
    this.emit("status-changed", id, "connecting");

    try {
      client.setNotificationHandler(ToolListChangedNotificationSchema, () => {
        this.emit("tools-changed", id);
      });
      client.setNotificationHandler(ResourceListChangedNotificationSchema, () => {
        this.emit("resources-changed", id);
      });
      client.setNotificationHandler(PromptListChangedNotificationSchema, () => {
        this.emit("prompts-changed", id);
      });

      mcpTransport.onclose = () => {
        const conn = this.connections.get(id);
        if (conn && conn.status !== "disconnected") {
          conn.status = "disconnected";
          this.emit("status-changed", id, "disconnected");
        }
      };

      mcpTransport.onerror = (error: Error) => {
        const conn = this.connections.get(id);
        if (conn) {
          conn.status = "error";
          conn.error = error.message;
          this.emit("status-changed", id, "error", error.message);
        }
      };

      await client.connect(mcpTransport);

      managed.status = "connected";
      managed.connectedAt = new Date().toISOString();
      managed.serverInfo = client.getServerVersion() as
        | { name: string; version: string }
        | undefined;
      managed.capabilities = client.getServerCapabilities() as ServerCapabilities | undefined;

      this.emit("status-changed", id, "connected");

      return this.toServerConnection(managed);
    } catch (err) {
      managed.status = "error";
      managed.error = err instanceof Error ? err.message : String(err);
      this.emit("status-changed", id, "error", managed.error);
      throw err;
    }
  }

  async disconnect(connectionId: string): Promise<void> {
    const managed = this.getManaged(connectionId);
    try {
      await managed.client.close();
    } finally {
      managed.status = "disconnected";
      this.connections.delete(connectionId);
      this.emit("status-changed", connectionId, "disconnected");
    }
  }

  async listTools(connectionId: string): Promise<McpTool[]> {
    const managed = this.getManaged(connectionId);
    const result = await managed.client.listTools();
    return result.tools.map((t) => ({
      connectionId,
      name: t.name,
      title: t.title,
      description: t.description,
      inputSchema: t.inputSchema as Record<string, unknown>,
      annotations: t.annotations,
    }));
  }

  async listResources(
    connectionId: string,
  ): Promise<{ resources: McpResource[]; resourceTemplates: McpResourceTemplate[] }> {
    const managed = this.getManaged(connectionId);

    const [resourcesResult, templatesResult] = await Promise.all([
      managed.client.listResources(),
      managed.client.listResourceTemplates().catch(() => ({ resourceTemplates: [] })),
    ]);

    const resources: McpResource[] = resourcesResult.resources.map((r) => ({
      connectionId,
      uri: r.uri,
      name: r.name,
      title: r.title,
      description: r.description,
      mimeType: r.mimeType,
    }));

    const resourceTemplates: McpResourceTemplate[] = templatesResult.resourceTemplates.map(
      (rt) => ({
        connectionId,
        uriTemplate: rt.uriTemplate,
        name: rt.name,
        title: rt.title,
        description: rt.description,
        mimeType: rt.mimeType,
      }),
    );

    return { resources, resourceTemplates };
  }

  async listPrompts(connectionId: string): Promise<McpPrompt[]> {
    const managed = this.getManaged(connectionId);
    const result = await managed.client.listPrompts();
    return result.prompts.map((p) => ({
      connectionId,
      name: p.name,
      title: p.title,
      description: p.description,
      arguments: p.arguments?.map((a) => ({
        name: a.name,
        description: a.description,
        required: a.required,
      })),
    }));
  }

  async callTool(
    connectionId: string,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult> {
    const managed = this.getManaged(connectionId);
    const result = await managed.client.callTool({ name: toolName, arguments: args });
    return {
      content: (result.content as ContentBlock[]) ?? [],
      isError: result.isError as boolean | undefined,
    };
  }

  async readResource(connectionId: string, uri: string): Promise<ResourceReadResult> {
    const managed = this.getManaged(connectionId);
    const result = await managed.client.readResource({ uri });
    return {
      contents: result.contents.map((c) => ({
        uri: c.uri,
        mimeType: c.mimeType,
        text: "text" in c ? (c.text as string) : undefined,
      })),
    };
  }

  async getPrompt(
    connectionId: string,
    promptName: string,
    args?: Record<string, string>,
  ): Promise<{ description?: string; messages: Array<{ role: string; content: ContentBlock }> }> {
    const managed = this.getManaged(connectionId);
    const result = await managed.client.getPrompt({ name: promptName, arguments: args });
    return {
      description: result.description,
      messages: result.messages.map((m) => ({
        role: m.role,
        content: m.content as unknown as ContentBlock,
      })),
    };
  }

  getConnectionName(connectionId: string): string {
    return this.getManaged(connectionId).config.name;
  }

  getConnection(connectionId: string): ServerConnection | undefined {
    const managed = this.connections.get(connectionId);
    if (!managed) return undefined;
    return this.toServerConnection(managed);
  }

  getAllConnections(): ServerConnection[] {
    return Array.from(this.connections.values()).map((m) => this.toServerConnection(m));
  }

  private getManaged(connectionId: string): ManagedConnection {
    const managed = this.connections.get(connectionId);
    if (!managed) {
      throw new Error(`Connection not found: ${connectionId}`);
    }
    return managed;
  }

  private toServerConnection(managed: ManagedConnection): ServerConnection {
    return {
      config: managed.config,
      status: managed.status,
      error: managed.error,
      serverInfo: managed.serverInfo,
      capabilities: managed.capabilities,
      connectedAt: managed.connectedAt,
    };
  }
}
