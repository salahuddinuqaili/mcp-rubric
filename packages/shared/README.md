# mcp-studio-shared

Shared types, WebSocket message schemas, and constants for [MCP Studio](https://github.com/salahuddinuqaili/mcp-studio) — Postman + ESLint for MCP servers.

Zero runtime dependencies. Consumed by `mcp-studio` (the CLI) and `mcp-studio-server`.

```bash
npm install mcp-studio-shared
```

```ts
import { DEFAULT_BACKEND_PORT } from "mcp-studio-shared";
import type { TransportConfig, ScanResult } from "mcp-studio-shared";
```

Most people want the CLI instead — it isn't on npm yet, so run it from the [repo](https://github.com/salahuddinuqaili/mcp-studio).

## License

[MIT](./LICENSE)
