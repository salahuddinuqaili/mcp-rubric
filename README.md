# MCP Studio

**Explore, test, and validate MCP servers.**

MCP Studio is [Postman](https://www.postman.com/) + [ESLint](https://eslint.org/) for the [Model Context Protocol](https://modelcontextprotocol.io/). Connect to any MCP server, browse its tools interactively, execute calls with a visual request builder, and run automated compliance scans — all from a single tool.

> **Status:** Phases 0–4 complete. Connect, explore, execute, history, collections, and scanner all functional. CLI in progress.

---

## Why?

The MCP ecosystem has **85K+ stars** across server repos but no quality tooling for the developers building them. No interactive playground. No testing framework. No compliance scanner.

MCP Studio is that missing layer.

---

## Features

| | Feature | What it does |
|-|---------|-------------|
| 1 | **Interactive Playground** | Connect to any MCP server (stdio, SSE, HTTP), browse tools/resources/prompts, execute calls with auto-generated forms from schemas |
| 2 | **Compliance Scanner** | 18+ built-in rules across protocol compliance, quality, and security — produces a score (A-F) with detailed diagnostics |
| 3 | **Call History** | Persistent log of every tool call with arguments, results, timing, and status |
| 4 | **Collections** | Group and replay saved requests — like Postman collections for MCP |
| 5 | **CLI for CI** | `mcp-studio scan --min-score 80` gates your pipeline with exit codes and JSON output |

---

## Quick Start

```bash
# Launch the web UI
npx mcp-studio

# Scan a server headlessly (CI mode)
npx mcp-studio scan --command "node my-server.js" --min-score 80 --format json
```

---

## Architecture

```
┌─────────────┐        WS + REST        ┌──────────────┐      MCP Protocol      ┌─────────────┐
│  React SPA  │  ◄────────────────────►  │  Hono Server │  ◄──────────────────►  │ MCP Servers │
│  :5177      │                          │  :3777       │                         │ stdio/SSE/  │
└─────────────┘                          └──────────────┘                         │ HTTP        │
                                                                                  └─────────────┘
```

Browsers can't spawn processes or hold MCP connections. The Hono backend acts as a proxy — managing MCP Client instances and exposing them to the frontend over WebSocket.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript (strict, end-to-end) |
| Frontend | React 19, Vite 6, Tailwind v4, shadcn/ui |
| Backend | Hono, @modelcontextprotocol/sdk |
| Persistence | better-sqlite3 |
| CLI | Commander |
| Quality | Biome (lint + format), Vitest |

---

## Development

```bash
git clone https://github.com/salahuddinuqaili/mcp-studio.git
cd mcp-studio
pnpm install
pnpm dev       # backend :3777 + frontend :5177
```

| Command | What |
|---------|------|
| `pnpm dev` | Start dev servers |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check monorepo |
| `pnpm lint` | Lint + format check |
| `pnpm test` | Run tests |

---

## Project Structure

```
packages/
  shared/     @mcp-studio/shared   — Types, WS protocol, constants
  server/     @mcp-studio/server   — Hono backend, MCP client, scanner
  client/     @mcp-studio/client   — React SPA
  cli/        @mcp-studio/cli      — CLI binary
```

---

## Roadmap

- [x] Project scaffolding, type system, architecture
- [x] Connection management + tool/resource/prompt explorer
- [x] Interactive tool execution + resource reading
- [x] Call history + collections
- [x] Compliance scanner (16 rules, scoring, reports)
- [ ] Production CLI + CI integration + theming

---

## Contributing

Issues and PRs welcome. See [SPEC.md](./SPEC.md) for the full product specification.

## License

[MIT](./LICENSE)
