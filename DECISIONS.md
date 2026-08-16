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

## 2026-05-17: Server package exports point to dist/, not src/
Changed server's package.json exports from `./src/*.ts` to conditional exports with `types`/`import` pointing to `./dist/`. Source-pointing exports broke production (CLI importing compiled server couldn't resolve `.ts` files). Rejected: keeping src-pointing exports with tsx-only runtime (breaks published packages).

## 2026-05-18: Publish all 3 packages to npm
Publishing shared, server, and cli to npm (client stays private, bundled into CLI's static assets). Removed `"private": true` from shared and server. pnpm replaces `workspace:*` with real versions during publish, but only for non-private packages. Rejected: single-package publish with bundled deps (larger package, harder to debug), monorepo-to-single-file bundler (esbuild/rollup adds complexity, native modules like better-sqlite3 can't bundle).

## 2026-08-15: CLI publish on hold — package name contested
`mcp-studio` is unpublishable (npm's typosquat guard strips hyphens, colliding with `mcpstudio` v1.0.2) and `mcp-studio-cli` is owned by an unrelated project. Marked packages/cli private until the name is settled; `mcp-studio-server` and `mcp-studio-shared` are already published at 0.1.0. Rejected for now: `mcp-studio-app`/`-devtools` (free, but naming around a contested product identity is a decision worth making deliberately), `@mcp-studio-dev/*` (bakes a throwaway account name into the install command).

## 2026-08-15: Unscoped npm package names
Renamed to `mcp-studio` (CLI), `mcp-studio-server`, `mcp-studio-shared`, `mcp-studio-client` (private). Scoped names required an npm org, and `npx mcp-studio` — the command the README advertises — only resolves to an unscoped package. Rejected: `@mcp-studio/*` scope (org creation overhead, `npx @mcp-studio/cli` is worse to type and remember).

## 2026-05-17: Production SPA serving via @hono/node-server/serve-static
Added serveStatic middleware to `createApp()` with optional `clientDistPath` param. When the client dist exists, Hono serves it at `/` with SPA fallback to index.html. This lets `mcp-studio dev` serve the full app from a single port. Rejected: separate static file server (extra process), embedding assets in the binary (too complex for JS).
