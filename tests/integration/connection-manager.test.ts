import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
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
