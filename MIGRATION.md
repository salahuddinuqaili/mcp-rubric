# Migration: MCP Studio → Rubric

The project was renamed on 2026-08-16, one day after its first npm release. If you installed anything during that window, here is what changed and what to do.

## Package renames

| Old (deprecated) | New | Version |
|---|---|---|
| — (never published) | `mcp-rubric` | 0.2.0 |
| `mcp-studio-server@0.1.0` | `mcp-rubric-server` | 0.2.0 |
| `mcp-studio-shared@0.1.0` | `mcp-rubric-shared` | 0.2.0 |

```bash
npm uninstall mcp-studio-server mcp-studio-shared
npm install mcp-rubric-server mcp-rubric-shared
```

Import specifiers change with the package names; nothing else about the API moved. The exported symbols, WebSocket message shapes, scanner rules, scoring, and REST routes are identical between 0.1.0 and 0.2.0.

The CLI never shipped under the old name, so there is nothing to migrate — install `mcp-rubric` and the command is `mcp-rubric`.

## Repository

`github.com/salahuddinuqaili/mcp-studio` now redirects to `github.com/salahuddinuqaili/mcp-rubric`. Existing clones keep working through the redirect, but you can update the remote:

```bash
git remote set-url origin https://github.com/salahuddinuqaili/mcp-rubric.git
```

## Local database

`DB_FILENAME` changed from `mcp-studio.db` to `rubric.db`. The server creates a fresh database on first run; any local history and collections in the old file are not read. To keep them, rename the file:

```bash
mv mcp-studio.db rubric.db
```

## Why

`mcp-studio` cannot be published to npm. The registry's typosquat protection normalizes names by stripping punctuation, so `mcp-studio` collides with the pre-existing [`mcpstudio`](https://www.npmjs.com/package/mcpstudio) package and is rejected — even though `npm view mcp-studio` returns a clean 404. `mcp-studio-cli` was already taken by an unrelated project.

Rather than pick a near-miss variant of a name two other projects already use, the product was renamed. The full reasoning, including the shortlist and the names that were rejected, is in [NAMING.md](./NAMING.md). A rubric is a published scoring guide — weighted criteria, levels, a grade — which is exactly what the compliance scanner is.

## One breaking change worth knowing

Every `scan` example in the old docs used `--command "node server.js"`. That form cannot spawn on Linux or macOS: the whole string is treated as the executable name. Use the split form:

```bash
mcp-rubric scan --command node --args server.js --min-score 80
```

Two related fixes landed in 0.2.0: an unreadable `--config` now exits 3 instead of 1 (previously indistinguishable from a failing score in CI), and a non-numeric `--min-score` now exits 3 instead of silently passing the gate.
