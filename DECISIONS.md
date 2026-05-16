# Architecture Decisions

## 2026-05-15: Web-first, not Electron
Chose local web server + React SPA over Electron desktop app. Simpler to build, same pattern as MCP Inspector, no Electron overhead. Rejected: Electron (slower dev cycle, packaging complexity), Tauri (Rust complexity for a vibe-coded project).

## 2026-05-15: TypeScript over Rust
TypeScript end-to-end. Official MCP SDK is TS, React ecosystem is TS, AI code generation is strongest in TS. Rejected: Rust (no official MCP SDK, slower iteration, harder AI generation).

## 2026-05-15: Hono over Express/Fastify
Hono for backend. Lightweight, first-class WebSocket support via @hono/node-server, modern API. Rejected: Express (legacy patterns, no native WS), Fastify (heavier, more config).

## 2026-05-15: WebSocket for real-time, REST for CRUD
WebSocket handles connection management, tool calls, scans (needs push events for progress/status). REST handles history, collections, scan results (standard CRUD, cacheable). Rejected: all-WebSocket (overcomplicated for CRUD), all-REST (no push events).

## 2026-05-15: better-sqlite3 over alternatives
Synchronous SQLite for local persistence. Zero config, single file, no server process. Rejected: Drizzle+Turso (overkill for local), JSON files (no querying), LevelDB (no SQL).

## 2026-05-15: Biome over ESLint + Prettier
Single binary replaces both linting and formatting. 56x faster than ESLint. Covers ~80% of rules. Rejected: ESLint+Prettier (slower, two configs, more deps).

## 2026-05-15: Zustand over Redux/Jotai
Lightweight state management. Minimal boilerplate, great TS support, no providers needed. Rejected: Redux (too much boilerplate), Jotai (atomic model adds complexity for our use case).

## 2026-05-15: Correlated WS messages with UUID
Every WS request includes a UUID `id`, echoed in response. Enables Promise-based `wsClient.request()`. Push events (status changes, progress) have no `id`. Rejected: sequential message ordering (fragile), separate channels per operation (complex).
