# MCP Studio

**The developer toolkit for MCP servers — explore, test, and validate.**

MCP Studio is Postman + ESLint for the [Model Context Protocol](https://modelcontextprotocol.io/). Connect to any MCP server, browse its tools interactively, execute calls with a visual request builder, and run automated compliance scans.

> **Status:** Early development (Phase 0 complete). Star and watch for updates.

---

## Why MCP Studio?

The MCP ecosystem has 85K+ stars on server repos but **zero quality tooling** for server developers. No interactive playground. No testing framework. No compliance scanner. MCP Studio fills that gap.

## Features

| Feature | Description |
|---------|-------------|
| **Interactive Playground** | Connect to any MCP server, browse tools/resources/prompts, execute calls with auto-generated forms |
| **Compliance Scanner** | Validate servers against 18+ protocol, quality, and security rules — get a score (A-F) |
| **Call History** | Persistent log of all tool calls with timing, filtering, and replay |
| **Collections** | Save and organize groups of requests (like Postman collections) |
| **CLI for CI** | `mcp-studio scan` with exit codes, JSON output, and `--min-score` gating |

## Quick Start

```bash
# Start the web UI (coming soon)
npx mcp-studio

# Scan a server in CI (coming soon)
npx mcp-studio scan --command "node my-server.js" --min-score 80 --format json
```

## How It Works

```
┌─────────────┐       WebSocket + REST       ┌──────────────┐       MCP Protocol       ┌─────────────┐
│  React SPA  │  ◄─────────────────────────►  │  Hono Server │  ◄────────────────────►  │ MCP Servers │
│  :5177      │                               │  :3777       │                           │ stdio/SSE/  │
└─────────────┘                               └──────────────┘                           │ HTTP        │
                                                                                         └─────────────┘
```

Browsers can't spawn processes or hold MCP connections directly. MCP Studio's backend acts as a proxy — managing MCP SDK Client instances and bridging them to the React frontend via WebSocket.

## Tech Stack

- **TypeScript** (strict mode, end-to-end)
- **React 19 + Vite 6** (frontend)
- **Tailwind CSS v4 + shadcn/ui** (UI)
- **Hono** (backend)
- **@modelcontextprotocol/sdk** (MCP client)
- **better-sqlite3** (local persistence)
- **Biome** (linting + formatting)

## Development

```bash
git clone https://github.com/YOUR_USERNAME/mcp-studio.git
cd mcp-studio
pnpm install
pnpm dev          # Start backend (:3777) + frontend (:5177)
```

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev servers |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check everything |
| `pnpm lint` | Lint with Biome |
| `pnpm test` | Run tests |

## Project Structure

```
packages/
  shared/    # Types, WS message schemas, constants
  server/    # Hono backend, MCP client, scanner engine
  client/    # React SPA (Vite + Tailwind + shadcn/ui)
  cli/       # CLI binary (Commander)
```

## Roadmap

- [x] Phase 0 — Project scaffolding, types, architecture
- [ ] Phase 1 — Connection management, tool/resource/prompt explorer
- [ ] Phase 2 — Interactive tool execution, resource reading
- [ ] Phase 3 — Call history, collections
- [ ] Phase 4 — Compliance scanner with 18+ rules
- [ ] Phase 5 — Production CLI, CI integration, theming

## Contributing

MCP Studio is in early development. Issues and PRs welcome once Phase 1 lands.

## License

MIT
