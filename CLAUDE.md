# Rubric

Postman + ESLint for MCP servers. It grades MCP protocol conformance — it is not an LLM evaluation harness. See SPEC.md for full product spec.

## Architecture

```
Browser (React :5177)  ←─ WS + REST ─→  Hono Backend (:3777)  ←─ MCP Protocol ─→  MCP Servers
```

The backend is a proxy: browsers can't spawn stdio processes or hold MCP connections, so the Hono server manages MCP SDK Client instances and bridges them to the frontend.

## Packages

| Package | Name | Role |
|---------|------|------|
| `packages/shared` | `mcp-rubric-shared` | Types, WS message schemas, constants. Zero runtime deps. |
| `packages/server` | `mcp-rubric-server` | Hono backend. ConnectionManager, scanner engine, SQLite DB. |
| `packages/client` | `mcp-rubric-client` | React SPA. Communicates only via WS + REST to server. Private — bundled into the CLI's static assets, never published. |
| `packages/cli` | `mcp-rubric` | Published CLI binary `mcp-rubric`: web UI (`npx mcp-rubric`) and `mcp-rubric scan` (CI). |

## Commands

```bash
pnpm dev          # Start backend + frontend dev servers
pnpm build        # Build all packages
pnpm typecheck    # Type-check all packages
pnpm lint         # Lint with Biome
pnpm lint:fix     # Auto-fix lint issues
pnpm test         # Run tests with Vitest
```

## Tech Stack

- TypeScript 5.x strict — no `any`, no implicit returns
- React 19 + Vite 6 — frontend
- Tailwind CSS v4 + shadcn/ui — styling
- Hono — backend HTTP + WebSocket
- @modelcontextprotocol/sdk — MCP client
- better-sqlite3 — local persistence
- Zustand — frontend state
- Commander — CLI
- Vitest — testing
- Biome — linting + formatting

## Code Conventions

- **Strict TypeScript**: no `any`, no `@ts-ignore`, no non-null assertions unless proven safe
- **Biome**: 2-space indent, double quotes, semicolons, organize imports
- **Named exports only**: no default exports
- **Comments explain WHY, never WHAT**
- **Explicit error handling**: never swallow errors silently
- **Collocated tests**: `foo.ts` → `foo.test.ts` in the same directory

## File Naming

- `kebab-case` for all files and directories
- `PascalCase` for React component files (e.g., `ToolCallForm.tsx`)
- `camelCase` for utility functions and hooks

## Key Patterns

### WebSocket Messages
All WS messages use a typed envelope with a UUID `id` for request/response correlation. Push events have no `id`. Types are in `packages/shared/src/ws-messages.ts`.

### ConnectionManager
Singleton in `packages/server` that owns all MCP Client instances. All tool calls, resource reads, and scans go through it. Frontend never touches MCP directly.

### Scanner Rules
Each rule implements `{ meta: ValidationRule, check(ctx): Promise<RuleDiagnostic[]> }`. Rules are pure functions registered in a `RuleRegistry`. Add new rules in `packages/server/src/scanner/rules/`.

### Zustand Stores
Five stores: `connection-store`, `explorer-store`, `history-store`, `scanner-store`, `collections-store`. Stores call `wsClient.request()` for real-time ops and `fetch()` for REST CRUD.

### Vite Proxy
In dev, Vite proxies `/api/*` and `/ws` to the Hono backend. In production, the CLI serves built frontend assets via Hono's `serveStatic`.

## Don'ts

- Don't use `any` — use `unknown` and narrow, or define proper types
- Don't add dependencies to root `package.json` (except dev tools shared across all packages)
- Don't put business logic in React components — extract to hooks, stores, or core
- Don't hardcode MCP protocol constants — import from the SDK or `mcp-rubric-shared`
- Don't create REST endpoints for real-time operations — use WebSocket
- Don't skip error handling on MCP client calls — servers can crash or return errors
- Don't commit `.env` files or SQLite databases (`rubric.db` and its `-shm`/`-wal` siblings)

## Architecture Decisions

Logged in DECISIONS.md. Update it when making significant choices about:
- Library additions or replacements
- Data model changes
- New communication patterns
- Infrastructure decisions
