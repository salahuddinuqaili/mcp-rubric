# MCP Studio

**Postman + ESLint for MCP servers.**

Connect to any MCP server, explore its tools visually, execute calls with auto-generated forms, and run compliance scans that score protocol conformance, quality, and security. Debug with MCP Inspector; ship with MCP Studio.

[![npm](https://img.shields.io/npm/v/mcp-studio)](https://www.npmjs.com/package/mcp-studio)
[![license](https://img.shields.io/github/license/salahuddinuqaili/mcp-studio)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org/)

## Features

- **Compliance Scanner** — 16 built-in rules that score your server (A-F) across protocol, quality, and security categories
- **CI Gate** — `mcp-studio scan --min-score 80` fails your pipeline if the server doesn't meet the bar
- **Interactive Playground** — Connect via stdio/SSE/HTTP, browse tools/resources/prompts, execute calls with schema-generated forms
- **History and Collections** — Persistent request log with timing, plus saved request groups you can replay

## Quick Start

### Use it

```bash
# Launch the web UI
npx mcp-studio

# Scan a server in CI
npx mcp-studio scan --command "node my-server.js" --min-score 80
```

### Develop it

```bash
git clone https://github.com/salahuddinuqaili/mcp-studio.git
cd mcp-studio
pnpm install
pnpm build
pnpm dev
```

Opens the playground at `http://localhost:5177` with the backend on `:3777`.

## CLI Reference

### Commands

| Command | Description |
|---------|-------------|
| `mcp-studio` (default) | Start the web UI. Flag: `--port <port>` (default: 3777) |
| `mcp-studio scan` | Run a headless compliance scan |

### Scan Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--command <cmd>` | Command to start a stdio MCP server | — |
| `--args <args...>` | Arguments passed to the command | — |
| `--url <url>` | URL for SSE or Streamable HTTP server | — |
| `--transport <type>` | `stdio`, `sse`, or `streamable-http` | `stdio` |
| `--format <format>` | `table` or `json` | `table` |
| `--min-score <n>` | Minimum passing score (exit 1 if below) | `0` |
| `--config <path>` | Path to JSON connection config file | — |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Scan passed (score >= `--min-score`) |
| 1 | Scan failed (score < `--min-score`) |
| 2 | Connection failure |
| 3 | Internal error or missing required flags |

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

### GitHub Actions

```yaml
- name: Scan MCP server
  run: |
    npx mcp-studio scan \
      --command "node dist/server.js" \
      --min-score 80 \
      --format json
```

## Scanner Rules

Scoring: errors deduct full weight, warnings 50%, info 15%. Grade: A (90+), B (80+), C (70+), D (60+), F (<60).

MCP Studio ships 16 rules across three categories:

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
┌─────────────┐                ┌────────────────┐                ┌──────────────┐
│  React SPA  │  WS + REST     │  Hono Backend  │  MCP Protocol  │  MCP Servers │
│    :5177    │ <============> │     :3777      │ <============> │  stdio / SSE │
└─────────────┘                └────────────────┘                └──────────────┘
```

Browsers cannot spawn processes or hold persistent MCP connections. The Hono backend acts as a proxy — managing MCP Client instances and bridging them to the frontend via WebSocket and REST.

Built with TypeScript, React 19, Hono, better-sqlite3, and the official [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk).

---

## Development

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Backend :3777 + frontend :5177 |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check monorepo |
| `pnpm lint` | Lint + format check (Biome) |
| `pnpm test` | Run tests (Vitest) |

See [SPEC.md](./SPEC.md) for the product specification and [CLAUDE.md](./CLAUDE.md) for code conventions.

---

## Roadmap

- [ ] Publish to npm (`npx mcp-studio`)
- [ ] Error toasts and reconnect banner in web UI
- [ ] Connection persistence (survive page reload)
- [ ] Export/import collections as JSON
- [ ] Custom scanner rules (bring your own)
- [ ] SARIF output for IDE integration

## Contributing

Issues and PRs welcome. See [SPEC.md](./SPEC.md) for product context.

## License

[MIT](./LICENSE)
