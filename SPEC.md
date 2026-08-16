# Rubric — Product Specification

> Postman + ESLint for MCP servers

## Problem

The MCP ecosystem has 85K+ stars on server repos but zero quality tooling for server developers. There is no way to:
- Interactively explore what an MCP server exposes (tools, resources, prompts)
- Test tool calls with a visual request builder
- Validate that a server implements the MCP spec correctly
- Score server quality (descriptions, schemas, security)
- Run automated compliance checks in CI

The closest tool (MCP Inspector) is a minimal debugging utility, not a developer workflow.

## Vision

Rubric is the **Postman for MCP** — a developer tool where you connect to any MCP server, browse its capabilities, execute tool calls interactively, save request collections, and run compliance/quality scans. Plus a CLI for CI pipelines.

## Target Users

1. **MCP server authors** — testing their servers during development
2. **AI app developers** — evaluating which MCP servers to integrate
3. **Platform teams** — enforcing MCP server quality standards across an org

## Core Features

### 1. Server Connection Manager
- Connect via stdio (spawn a local command), SSE, or Streamable HTTP
- Multiple simultaneous connections
- Auto-reconnect between browser and backend (dropped MCP connections are marked disconnected, not retried)
- Recent connections saved for quick access _(planned)_

### 2. Tool Explorer
- Browse all tools, resources, and prompts from connected servers
- Search/filter by name _(planned)_
- View full schema details, descriptions, annotations
- Visual schema tree for input/output schemas

### 3. Interactive Request Builder
- Auto-generated form from tool input schemas (text fields, dropdowns, toggles)
- Raw JSON editor fallback for complex inputs
- Execute tool calls with one click
- Response viewer with timing and content type rendering
- Renders text and image content blocks (audio and resource blocks _planned_)

### 4. Resource Reader
- Browse and read server resources by URI
- Content rendering based on MIME type (text, images, binary)
- Resource template support with argument substitution

### 5. Prompt Inspector
- Browse prompts with their argument definitions
- Fill arguments via generated form
- Preview rendered prompt messages (role + content)

### 6. Call History
- Persistent log of all tool calls, resource reads
- Filterable by server, tool name, status, date range _(planned)_
- Expandable rows showing full arguments and results
- Timing data for performance analysis
- Clear/delete individual records or all history

### 7. Collections
- Save tool calls and resource reads as named collections
- Organize related requests together (like Postman collections)
- "Run All" to execute an entire collection sequentially
- Export/import collections as JSON _(planned)_

### 8. Compliance Scanner
- One-click scan of a connected server
- Built-in rules across three categories:
  - **Protocol compliance** — spec conformance, valid schemas, matching capabilities
  - **Quality** — description completeness, naming consistency, schema documentation
  - **Security** — no secrets in descriptions, input validation, no wildcard schemas
- Score (0-100) with letter grade (A-F)
- Detailed diagnostics: rule ID, severity, message, target entity
- Scan history for tracking improvement over time

### 9. CLI for CI
- `mcp-rubric scan --command node --args server.js` — headless scanning
- Table and JSON output formats
- `--min-score` flag with exit codes for CI gates
- Config file support for complex connection configs

---

## Architecture

```
┌─────────────────────┐     WebSocket + REST     ┌──────────────────────┐     MCP Protocol     ┌─────────────────┐
│   React SPA         │ ◄──────────────────────► │   Hono Backend       │ ◄─────────────────► │   MCP Servers    │
│   (Vite :5177)      │                          │   (Node.js :3777)    │                      │   (stdio/SSE/    │
│                     │                          │                      │                      │    HTTP)         │
│  - Zustand stores   │                          │  - ConnectionManager │                      │                  │
│  - WS client        │                          │  - Scanner engine    │                      │                  │
│  - shadcn/ui        │                          │  - SQLite DB         │                      │                  │
└─────────────────────┘                          └──────────────────────┘                      └─────────────────┘
```

**Why a backend proxy?** Browsers cannot spawn child processes (stdio transport) or maintain persistent MCP connections. The Hono backend acts as a bridge — it manages MCP SDK Client instances and exposes them to the frontend via WebSocket and REST.

### Communication Patterns

| Pattern | Used For | Why |
|---------|----------|-----|
| WebSocket | Connect/disconnect, list tools, call tools, scan (with progress) | Real-time, bidirectional, push events |
| REST | History CRUD, collections CRUD, scan results | Standard request/response, cacheable |

### WebSocket Message Protocol

Every client request includes a UUID `id`. The server echoes it in the response. This enables `wsClient.request()` to return a `Promise` correlated to the response. Push events (connection status, scan progress, list changes) have no `id` and are dispatched to event listeners.

---

## Data Model

### Core Entities

**ServerConnectionConfig** — How to connect to an MCP server
- `id`, `name`, `transport` (stdio | sse | streamable-http)
- Stdio: `command`, `args`, `env`, `cwd`
- SSE/HTTP: `url`, `headers`

**McpTool** — A tool exposed by a connected server
- `connectionId`, `name`, `description`, `inputSchema`, `annotations`

**McpResource** — A resource exposed by a connected server
- `connectionId`, `uri`, `name`, `description`, `mimeType`

**McpPrompt** — A prompt template exposed by a connected server
- `connectionId`, `name`, `description`, `arguments[]`

**ToolCallRecord** — A persisted record of a tool call (SQLite)
- `id`, `connectionId`, `toolName`, `arguments`, `result`, `status`, `startedAt`, `completedAt`, `durationMs`

**Collection** — A saved group of requests (SQLite)
- `id`, `name`, `description`, `items[]`, `createdAt`, `updatedAt`

**ScanResult** — Results of a compliance scan (SQLite)
- `id`, `connectionId`, `score`, `grade`, `diagnostics[]`, `summary`, `scannedAt`, `durationMs`

**ValidationRule** — A scanner rule definition
- `id`, `name`, `description`, `category`, `severity`, `weight`

---

## UI Screens

### Routes

| Route | Screen | Purpose |
|-------|--------|---------|
| `/` | Connect | Connection form, recent connections |
| `/explorer` | Explorer | Tabbed view: Tools, Resources, Prompts |
| `/explorer/tools/:name` | Tool Detail | Schema inspector + request builder + results |
| `/explorer/resources/:uri` | Resource Detail | Read + display resource content |
| `/explorer/prompts/:name` | Prompt Detail | Argument form + rendered messages |
| `/history` | History | Searchable/filterable call history table |
| `/scanner` | Scanner | Run scan, score card, diagnostics list |
| `/collections` | Collections | List/manage/run collections |
| `/collections/:id` | Collection Detail | Edit and run a collection |

### Layout

Persistent left sidebar with:
- Connected servers (colored status dots)
- Navigation links (Explorer, History, Scanner, Collections)
- "+" button to add new connection

Top header with breadcrumbs and active connection info.

---

## Scanner Rules

### Protocol Compliance (severity: error)

| Rule | Check |
|------|-------|
| `protocol/server-has-capabilities` | Server declares at least one capability |
| `protocol/capabilities-match-content` | Declared capabilities match actual content |
| `protocol/valid-input-schemas` | Tool input schemas are valid JSON Schema |
| `protocol/valid-resource-uris` | Resource URIs parse as valid URLs |
| `protocol/tools-have-names` | All tools have non-empty names |
| `protocol/prompts-have-names` | All prompts have non-empty names |

### Quality (severity: warning/info)

| Rule | Check |
|------|-------|
| `quality/tools-have-descriptions` | Every tool has a description |
| `quality/tool-description-length` | Descriptions are >= 20 characters |
| `quality/resources-have-descriptions` | Every resource has a description |
| `quality/resources-have-mimetype` | Every resource specifies MIME type |
| `quality/prompts-have-descriptions` | Every prompt has a description |
| `quality/consistent-tool-naming` | All tool names use same convention |
| `quality/input-schema-has-descriptions` | Schema properties have descriptions |

### Security (severity: warning/error)

| Rule | Check |
|------|-------|
| `security/no-wildcard-input-schema` | Input schemas are not `{}` |
| `security/no-secrets-in-descriptions` | No API keys/tokens in descriptions |
| `security/tools-have-input-validation` | Input schemas use constraints |

### Scoring

- Each rule has a weight (0-10)
- Score = (maxPoints - penalties) / maxPoints * 100
- Penalties applied once per failing rule, by the rule's declared severity: error = full weight, warning = 50%, info = 15%
- Grade: A (90+), B (80+), C (70+), D (60+), F (<60)

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Language | TypeScript 5.x (strict) | End-to-end type safety, best AI generation |
| Monorepo | pnpm workspaces | Fast, disk-efficient, proven |
| Frontend | React 19 + Vite 6 | Standard, fast HMR |
| Styling | Tailwind CSS v4 + shadcn/ui | Rapid UI development, consistent design |
| State | Zustand | Lightweight, TypeScript-friendly |
| Backend | Hono | Lightweight, first-class WebSocket, fast |
| MCP Client | @modelcontextprotocol/sdk | Official SDK |
| Database | better-sqlite3 | Zero-config, synchronous, single-file |
| CLI | Commander | Standard Node.js CLI framework |
| Testing | Vitest | Fast, Vite-native |
| Linting | Biome | Single tool, fast, replaces ESLint + Prettier |

---

## Implementation Phases

### Phase 0: Scaffolding
Empty monorepo that builds, lints, and type-checks. All configs, types, and stubs in place.

### Phase 1: Connection Management
Connect to MCP servers, browse tools/resources/prompts. WebSocket handler, ConnectionManager, Explorer UI.

### Phase 2: Tool Execution
Call tools, read resources, get prompts interactively. Request builder, response viewer, SQLite persistence.

### Phase 3: History & Collections
Persistent call history with filtering. Collection CRUD and "Run All" execution.

### Phase 4: Scanner
Rule engine, built-in rules, scoring algorithm. Scanner UI with progress, score card, diagnostics.

### Phase 5: CLI & Polish
Production CLI (`dev` + `scan` commands). CI integration, theming, documentation.

---

## CLI Interface

```
# Start the web UI
mcp-rubric

# Scan a stdio server
mcp-rubric scan --command node --args my-server.js --format table

# Scan with minimum score (CI gate)
mcp-rubric scan --command npx --args my-mcp-server --min-score 80 --format json

# Scan a remote SSE server
mcp-rubric scan --url http://localhost:3000/sse --transport sse

# Scan from config file
mcp-rubric scan --config ./rubric.config.json
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Score >= --min-score |
| 1 | Score < --min-score |
| 2 | Connection failure |
| 3 | Internal error or missing required flags |
