# MCP Studio

**The compliance scanner and interactive playground for MCP servers.**

MCP Studio is [Postman](https://www.postman.com/) + [ESLint](https://eslint.org/) for the [Model Context Protocol](https://modelcontextprotocol.io/). Connect to any MCP server, explore its tools visually, execute calls with auto-generated forms, and run automated compliance scans that score your server's protocol conformance, quality, and security. Tools like MCP Inspector let you debug; MCP Studio tells you if your server is good enough to ship.

---

## Features

- **Compliance Scanner** -- 16 built-in rules that score your server (A-F grade) across protocol, quality, and security categories
- **CI Gate** -- `mcp-studio scan --min-score 80` fails your pipeline if the server doesn't meet the bar
- **Interactive Playground** -- Connect via stdio/SSE/HTTP, browse tools/resources/prompts, execute calls with forms generated from schemas
- **Call History & Collections** -- Persistent request log with timing + saved request groups you can replay

---

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm >= 9

> MCP Studio is not yet published to npm. Install from source for now.

### Install

```bash
git clone https://github.com/salahuddinuqaili/mcp-studio.git
cd mcp-studio
pnpm install
pnpm build
```

### Web UI

```bash
pnpm dev
```

Opens the interactive playground at `http://localhost:5177` (backend on `:3777`). From there you can connect to any MCP server, browse its capabilities, execute tool calls, manage collections, and run visual compliance scans.

### CLI Scanner

```bash
node packages/cli/dist/index.js scan --command "node my-server.js" --min-score 80
```

Runs a headless compliance scan and exits with code 0 (pass) or 1 (fail). Once published to npm, this becomes `npx mcp-studio scan ...`.

---

## CLI Reference

### Commands

| Command | Description |
|---------|-------------|
| `mcp-studio dev` (default) | Start the web UI. Flag: `--port <port>` (default: 3777) |
| `mcp-studio scan` | Run a headless compliance scan |

### Scan Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--command <cmd>` | Command to start a stdio MCP server | -- |
| `--args <args...>` | Arguments passed to the command | -- |
| `--url <url>` | URL for SSE or Streamable HTTP server | -- |
| `--transport <type>` | `stdio`, `sse`, or `streamable-http` | `stdio` |
| `--format <format>` | `table` or `json` | `table` |
| `--min-score <n>` | Minimum passing score (exit 1 if below) | `0` |
| `--config <path>` | Path to JSON connection config file | -- |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Scan passed (score >= `--min-score`) |
| 1 | Scan failed (score < `--min-score`) |
| 2 | Connection failure |
| 3 | Internal error / missing required flags |

### Config File

Instead of passing flags, point to a JSON config:

```bash
mcp-studio scan --config ./mcp-studio.config.json --min-score 80
```

**Stdio server:**
```json
{
  "name": "my-server",
  "transport": {
    "type": "stdio",
    "command": "node",
    "args": ["./dist/server.js"],
    "env": { "NODE_ENV": "production" }
  }
}
```

**Remote SSE server:**
```json
{
  "name": "remote-server",
  "transport": {
    "type": "sse",
    "url": "http://localhost:3000/sse"
  }
}
```

### GitHub Actions Example

```yaml
- name: Scan MCP server
  run: |
    node packages/cli/dist/index.js scan \
      --command "node dist/server.js" \
      --min-score 80 \
      --format json
```

---

## Scanner Rules

MCP Studio ships 16 rules across three categories. Each produces a weighted score (0-100) with a letter grade.

**Scoring:** errors deduct full weight, warnings 50%, info 15%. Grade: A (90+), B (80+), C (70+), D (60+), F (<60).

### Protocol Compliance (severity: error)

| Rule | What it checks |
|------|---------------|
| `protocol/server-has-capabilities` | Server declares at least one capability |
| `protocol/capabilities-match-content` | Declared capabilities match actual tools/resources/prompts |
| `protocol/valid-input-schemas` | Tool input schemas are valid JSON Schema |
| `protocol/valid-resource-uris` | Resource URIs are valid URLs |
| `protocol/tools-have-names` | All tools have non-empty names |
| `protocol/prompts-have-names` | All prompts have non-empty names |

### Quality (severity: warning/info)

| Rule | What it checks |
|------|---------------|
| `quality/tools-have-descriptions` | Every tool has a description |
| `quality/tool-description-length` | Tool descriptions are >= 20 characters |
| `quality/resources-have-descriptions` | Every resource has a description |
| `quality/resources-have-mimetype` | Every resource specifies a MIME type |
| `quality/prompts-have-descriptions` | Every prompt has a description |
| `quality/consistent-tool-naming` | All tool names follow the same naming convention |
| `quality/input-schema-has-descriptions` | Schema properties include description fields |

### Security (severity: warning/error)

| Rule | What it checks |
|------|---------------|
| `security/no-wildcard-input-schema` | Input schemas are not empty `{}` (accept-anything) |
| `security/no-secrets-in-descriptions` | No API keys, tokens, or passwords in description text |
| `security/tools-have-input-validation` | Input schemas use constraints (minLength, enum, pattern, etc.) |

---

## Architecture

```
┌─────────────┐        WS + REST        ┌──────────────┐      MCP Protocol      ┌─────────────┐
│  React SPA  │  <────────────────────>  │  Hono Server │  <──────────────────>  │ MCP Servers │
│  :5177      │                          │  :3777       │                         │ stdio/SSE/  │
└─────────────┘                          └──────────────┘                         │ HTTP        │
                                                                                  └─────────────┘
```

Browsers can't spawn processes or hold persistent MCP connections, so the Hono backend acts as a proxy — managing MCP Client instances and bridging them to the frontend via WebSocket and REST.

Built with TypeScript, React 19, Hono, better-sqlite3, and the official [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk).

---

## Development

```bash
pnpm dev          # Backend :3777 + frontend :5177
pnpm build        # Build all packages
pnpm typecheck    # Type-check monorepo
pnpm lint         # Lint + format check (Biome)
pnpm test         # Run tests (Vitest)
```

See [SPEC.md](./SPEC.md) for the full product specification and [CLAUDE.md](./CLAUDE.md) for code conventions.

---

## Roadmap

- [ ] Publish `@mcp-studio/cli` to npm (enable `npx mcp-studio`)
- [ ] Custom rule authoring (bring your own scanner rules)
- [ ] SARIF output format for IDE integration
- [ ] HTML/PDF scan report export
- [ ] Plugin system for transport extensions

---

## Contributing

Issues and PRs welcome. See [SPEC.md](./SPEC.md) for product context.

## License

[MIT](./LICENSE)
