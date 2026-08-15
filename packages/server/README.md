# mcp-studio-server

Hono backend for [MCP Studio](https://github.com/salahuddinuqaili/mcp-studio) — Postman + ESLint for MCP servers.

Owns the MCP client connections, the compliance scanner engine, and SQLite persistence. Browsers can't spawn stdio processes or hold MCP connections, so this package does it for them and bridges the result over WebSocket and REST.

```bash
npm install mcp-studio-server
```

```ts
import { createApp } from "mcp-studio-server/app.js";
import { runScan } from "mcp-studio-server/scanner/index.js";
import { ConnectionManager } from "mcp-studio-server/mcp/connection-manager.js";
```

Most people want the CLI instead:

```bash
npx mcp-studio          # web UI
npx mcp-studio scan     # CI compliance scan
```

## License

[MIT](./LICENSE)
