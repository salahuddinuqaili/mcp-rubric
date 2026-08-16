# mcp-rubric-shared

Shared types, WebSocket message schemas, and constants for [Rubric](https://github.com/salahuddinuqaili/mcp-rubric) — Postman + ESLint for MCP servers, scoring protocol conformance rather than model output.

Zero runtime dependencies. Consumed by `mcp-rubric` (the CLI) and `mcp-rubric-server`, and useful on its own if you want to type a scan result or talk to the backend's WebSocket.

```bash
npm install mcp-rubric-shared
```

```ts
import { DEFAULT_BACKEND_PORT, WS_PATH } from "mcp-rubric-shared";
import type { ScanResult, TransportConfig } from "mcp-rubric-shared";

const transport: TransportConfig = {
  type: "stdio",
  command: "node",
  args: ["my-server.js"],
};

function report(result: ScanResult) {
  console.log(`${result.grade} (${result.score}) — ${result.diagnostics.length} findings`);
}
```

Most people want the CLI instead:

```bash
npx mcp-rubric                                                    # web UI
npx mcp-rubric scan --command "node my-server.js" --min-score 80  # CI
```

Source and docs: [github.com/salahuddinuqaili/mcp-rubric](https://github.com/salahuddinuqaili/mcp-rubric)

## License

[MIT](./LICENSE)
