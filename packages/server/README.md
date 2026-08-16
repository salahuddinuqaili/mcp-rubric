# mcp-rubric-server

Hono backend for [Rubric](https://github.com/salahuddinuqaili/mcp-rubric) — Postman + ESLint for MCP servers.

Owns the MCP client connections, the compliance scanner engine, and SQLite persistence. Browsers can't spawn stdio processes or hold MCP connections, so this package does it for them and bridges the result over WebSocket and REST. The scanner grades MCP protocol conformance — it is not a model-evaluation harness.

```bash
npm install mcp-rubric-server
```

Connect to a server and score it with the 16 built-in protocol, quality, and security rules:

```ts
import { ConnectionManager } from "mcp-rubric-server/mcp/connection-manager.js";
import { createDefaultRegistry, runScan } from "mcp-rubric-server/scanner/index.js";

const manager = new ConnectionManager();
const connection = await manager.connect("my-server", {
  type: "stdio",
  command: "node",
  args: ["my-server.js"],
});

const result = await runScan(connection.config.id, manager, createDefaultRegistry());
console.log(result.score, result.grade); // e.g. 84 B

await manager.disconnect(connection.config.id);
```

`createApp()` from `mcp-rubric-server/app.js` returns `{ app, injectWebSocket }` — the same Hono app the CLI serves, with REST routes under `/api` and the WebSocket at `/ws`.

Most people want the CLI instead:

```bash
npx mcp-rubric                                                    # web UI
npx mcp-rubric scan --command "node my-server.js" --min-score 80  # CI
```

Source and docs: [github.com/salahuddinuqaili/mcp-rubric](https://github.com/salahuddinuqaili/mcp-rubric)

## License

[MIT](./LICENSE)
