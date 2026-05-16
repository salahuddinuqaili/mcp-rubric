import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import {
  createCollection,
  deleteCollection,
  getCollectionById,
  updateCollection,
} from "../../packages/server/src/db/collections-repository.js";
import { closeDb } from "../../packages/server/src/db/index.js";
import { ConnectionManager } from "../../packages/server/src/mcp/connection-manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ECHO_SERVER_PATH = path.resolve(__dirname, "../fixtures/echo-server/dist/index.js");

describe("ConnectionManager with echo-server", () => {
  const manager = new ConnectionManager();
  let connectionId: string | undefined;

  afterEach(async () => {
    if (connectionId) {
      try {
        await manager.disconnect(connectionId);
      } catch {
        // already disconnected
      }
      connectionId = undefined;
    }
  });

  it("connects to the echo-server via stdio", async () => {
    const connection = await manager.connect("echo-test", {
      type: "stdio",
      command: "node",
      args: [ECHO_SERVER_PATH],
    });

    connectionId = connection.config.id;

    expect(connection.status).toBe("connected");
    expect(connection.serverInfo?.name).toBe("echo-server");
    expect(connection.serverInfo?.version).toBe("0.0.1");
  });

  it("lists tools from echo-server", async () => {
    const connection = await manager.connect("echo-test", {
      type: "stdio",
      command: "node",
      args: [ECHO_SERVER_PATH],
    });
    connectionId = connection.config.id;

    const tools = await manager.listTools(connectionId);

    expect(tools).toHaveLength(2);

    const echo = tools.find((t) => t.name === "echo");
    expect(echo).toBeDefined();
    expect(echo?.description).toBe("Echoes the input text back");
    expect(echo?.connectionId).toBe(connectionId);

    const add = tools.find((t) => t.name === "add");
    expect(add).toBeDefined();
    expect(add?.description).toBe("Adds two numbers");
  });

  it("lists resources from echo-server", async () => {
    const connection = await manager.connect("echo-test", {
      type: "stdio",
      command: "node",
      args: [ECHO_SERVER_PATH],
    });
    connectionId = connection.config.id;

    const { resources } = await manager.listResources(connectionId);

    expect(resources).toHaveLength(1);
    expect(resources[0].uri).toBe("info://server");
    expect(resources[0].name).toBe("Server information");
    expect(resources[0].connectionId).toBe(connectionId);
  });

  it("lists prompts from echo-server", async () => {
    const connection = await manager.connect("echo-test", {
      type: "stdio",
      command: "node",
      args: [ECHO_SERVER_PATH],
    });
    connectionId = connection.config.id;

    const prompts = await manager.listPrompts(connectionId);

    expect(prompts).toHaveLength(1);
    expect(prompts[0].name).toBe("greet");
    expect(prompts[0].description).toBe("Generates a greeting");
    expect(prompts[0].arguments).toHaveLength(1);
    expect(prompts[0].arguments?.[0].name).toBe("name");
    expect(prompts[0].connectionId).toBe(connectionId);
  });

  it("calls the echo tool and gets correct response", async () => {
    const connection = await manager.connect("echo-test", {
      type: "stdio",
      command: "node",
      args: [ECHO_SERVER_PATH],
    });
    connectionId = connection.config.id;

    const result = await manager.callTool(connectionId, "echo", { text: "hello" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe("Echo: hello");
  });

  it("calls the add tool and gets correct result", async () => {
    const connection = await manager.connect("echo-test", {
      type: "stdio",
      command: "node",
      args: [ECHO_SERVER_PATH],
    });
    connectionId = connection.config.id;

    const result = await manager.callTool(connectionId, "add", { a: 3, b: 7 });

    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe("10");
  });

  it("reads a resource and gets content", async () => {
    const connection = await manager.connect("echo-test", {
      type: "stdio",
      command: "node",
      args: [ECHO_SERVER_PATH],
    });
    connectionId = connection.config.id;

    const result = await manager.readResource(connectionId, "info://server");

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].uri).toBe("info://server");
    expect(result.contents[0].mimeType).toBe("text/plain");
    expect(result.contents[0].text).toContain("Echo Server");
  });

  it("gets a prompt with arguments", async () => {
    const connection = await manager.connect("echo-test", {
      type: "stdio",
      command: "node",
      args: [ECHO_SERVER_PATH],
    });
    connectionId = connection.config.id;

    const result = await manager.getPrompt(connectionId, "greet", { name: "World" });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[0].content.text).toBe("Say hello to World");
  });

  it("full flow: connect → list-tools → list-resources → list-prompts", async () => {
    const connection = await manager.connect("echo-full-flow", {
      type: "stdio",
      command: "node",
      args: [ECHO_SERVER_PATH],
    });
    connectionId = connection.config.id;

    expect(connection.status).toBe("connected");

    const [tools, { resources }, prompts] = await Promise.all([
      manager.listTools(connectionId),
      manager.listResources(connectionId),
      manager.listPrompts(connectionId),
    ]);

    expect(tools).toHaveLength(2);
    expect(resources).toHaveLength(1);
    expect(prompts).toHaveLength(1);

    await manager.disconnect(connectionId);
    connectionId = undefined;

    expect(manager.getConnection(connection.config.id)).toBeUndefined();
  });
});

describe("Collections with echo-server", () => {
  const manager = new ConnectionManager();
  let connectionId: string | undefined;

  afterEach(async () => {
    if (connectionId) {
      try {
        await manager.disconnect(connectionId);
      } catch {
        // already disconnected
      }
      connectionId = undefined;
    }
  });

  afterAll(() => {
    closeDb();
  });

  it("creates a collection, adds items, runs them sequentially", async () => {
    // Connect to echo-server
    const connection = await manager.connect("coll-test", {
      type: "stdio",
      command: "node",
      args: [ECHO_SERVER_PATH],
    });
    connectionId = connection.config.id;

    // Create a collection with two items
    const coll = createCollection("Test Collection", "Integration test");
    expect(coll.items).toHaveLength(0);

    const updated = updateCollection(coll.id, {
      items: [
        {
          type: "tool-call",
          id: "item-1",
          connectionConfig: { type: "stdio", command: "node" },
          toolName: "echo",
          arguments: { text: "collection-test" },
        },
        {
          type: "resource-read",
          id: "item-2",
          connectionConfig: { type: "stdio", command: "node" },
          resourceUri: "info://server",
        },
      ],
    });
    expect(updated?.items).toHaveLength(2);

    // Execute the collection items sequentially
    const results: Array<{ itemId: string; success: boolean }> = [];
    const saved = getCollectionById(coll.id);
    expect(saved).toBeDefined();
    for (const item of saved?.items ?? []) {
      try {
        if (item.type === "tool-call") {
          await manager.callTool(connectionId, item.toolName, item.arguments);
        } else if (item.type === "resource-read") {
          await manager.readResource(connectionId, item.resourceUri);
        }
        results.push({ itemId: item.id, success: true });
      } catch {
        results.push({ itemId: item.id, success: false });
      }
    }

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);

    // Cleanup
    deleteCollection(coll.id);
    expect(getCollectionById(coll.id)).toBeUndefined();
  });
});
