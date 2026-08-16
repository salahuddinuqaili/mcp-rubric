---
name: Rubric tech stack decisions
description: Validated tech stack choices with reasoning for Rubric
type: project
---

All choices validated as of 2026-05-15:

- **TypeScript 5.x strict** — best MCP SDK support, best AI code generation, one language end-to-end
- **pnpm workspaces** — monorepo with 4 packages (shared, server, client, cli)
- **React 19 + Vite 6** — frontend, confirmed compatible with shadcn/ui
- **Tailwind CSS v4 + shadcn/ui** — confirmed compatible, use @tailwindcss/vite plugin
- **Hono** — backend, first-class WebSocket via @hono/node-server v2
- **@modelcontextprotocol/sdk** — official MCP TypeScript client SDK (12K stars)
- **better-sqlite3** — zero-config local persistence for history/collections/scans
- **Zustand** — lightweight frontend state management
- **Commander** — CLI framework
- **Vitest** — Vite-native testing
- **Biome** — single-binary linting + formatting (replaces ESLint + Prettier)

**Why:** Stack optimized for vibe-coding with Claude Code. TypeScript has the strongest AI generation. All libraries are well-documented with large training data presence.

**How to apply:** Don't swap libraries without logging to DECISIONS.md. If a dep isn't working, check if it's a config issue before reaching for an alternative.
