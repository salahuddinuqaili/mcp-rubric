# Why this project is called Rubric

This project was called MCP Studio until 2026-08-16, one day after its first npm release. It was renamed because the old name could not be published, and because the replacement names available to us were worse than picking a new identity. This note records what happened and why, so the decision doesn't have to be reconstructed from commit history.

For the practical mapping of old package names to new ones, see [MIGRATION.md](./MIGRATION.md).

## A 404 does not mean a name is available

We checked availability the way most people do:

```console
$ npm view mcp-studio version
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/mcp-studio
```

We checked every sibling name the same way. All 404. The release was built on that answer, and the answer was to the wrong question. **A 404 means the name has never been published. It does not mean you are allowed to publish it.** npm only tells you the second thing at the moment you try:

```console
$ pnpm publish:all
+ mcp-studio-shared@0.1.0
+ mcp-studio-server@0.1.0
npm error code E403
npm error 403 Forbidden - PUT https://registry.npmjs.org/mcp-studio
npm error Package name too similar to existing package mcpstudio;
npm error try renaming your package to '@mcp-studio-dev/mcp-studio'
```

Two of the three packages published before the third was refused. The libraries were live and immutable in the same second that the CLI — the piece users actually install — turned out to be unpublishable.

## What npm's typosquat guard actually enforces

The guard normalizes a candidate name before comparing it, and **stripping punctuation is part of that normalization**. `mcp-studio` becomes `mcpstudio`, which has existed since March 2025 as an unrelated project.

The rule that falls out of this:

> A name is only viable if **both** its hyphenated and de-hyphenated forms are unpublished.

This is why `mcp-studio-server` and `mcp-studio-shared` published without complaint — `mcpstudioserver` and `mcpstudioshared` collide with nothing — while `mcp-studio` was rejected.

It also disqualifies names that look completely free:

| Candidate | Squashed form | Verdict |
|---|---|---|
| `mcp-studio` | `mcpstudio` — taken | blocked |
| `mcp-probe` | `mcpprobe` — taken | blocked |
| `mcp-forge` | `mcpforge` — taken | blocked |
| `mcp-grade` | `mcpgrade` — taken | blocked |
| `mcp-gate` | `mcpgate` — taken | blocked |
| `mcp-rubric` | `mcprubric` — free | viable |

## The second collision

The obvious fix was `mcp-studio-cli`: conventional suffix, matches the siblings, passes the squash test.

It belongs to someone else — v0.1.11, published May 2026, described as "MCP Studio CLI — a terminal REPL for hosting and driving MCP servers." A different tool by someone who had the same instinct about what to call something that works on MCP servers.

At that point the problem stopped being a packaging inconvenience. Two unrelated projects were already shipping under the name, and the question changed from "which suffix is free" to "is this our name at all."

## Choosing Rubric

Every bare English word worth having is gone from npm — `assay`, `touchstone`, `loupe`, `caliper`, and `crucible` are all occupied. The registry is twenty years old. So the shape had to be a one-word product name with an `mcp-` prefixed package, which also keeps the tool findable by people searching the ecosystem.

The tool grades MCP servers: 16 rules across protocol, quality, and security, weighted by severity, producing a score and a letter grade. The shortlist came from testing and certification, because that is what the tool does and what separates it from a debugger.

| Name | The argument | Why not |
|---|---|---|
| Assay | The test of a metal's purity. Verb and noun. | Names the act, not the standard. |
| Touchstone | Already means "the standard by which things are judged." | Well-worn in enterprise software. |
| Crucible | The vessel metal is tested in; a severe trial. | Atlassian shipped a Crucible. |
| Muster | "Pass muster" sells the CI gate in one phrase. | Names the verdict, not the criteria. |
| **Rubric** | A published scoring guide: weighted criteria, levels, a grade. | **Chosen.** |

A rubric is not a metaphor here. The scanner publishes its criteria and weights up front, applies them, and returns a grade — that is the definition of the word, not an analogy to it. The alternatives each describe something adjacent: the act of testing, the object you test against, or the pass/fail outcome.

The etymology is a bonus rather than a reason: *ruber*, red — the red-letter rules and headings of medieval manuscripts, which became "the standing instructions" in liturgy and law.

**The known risk:** "rubric" is loaded vocabulary in AI evaluation, where rubric-based grading means handing a judge model a list of criteria. This tool grades protocol conformance and never invokes a model. That distinction is stated once, prominently, in the README rather than repeated defensively throughout the docs.

Rejected alternatives at the packaging level: `@mcp-studio/cli` (requires an npm org, and the scope's availability was never verified), `@mcp-studio-dev/mcp-studio` (bakes a throwaway account name into the install command forever), and plain `mcp-conformance` (discoverable, but no identity to build on).

## What the rename cost, and what it found

The identifier change was mechanical: 44 files, mostly import specifiers, plus four package manifests and eight human-facing strings. No architecture, schema, or test changes.

The audit that followed was where the value was. Nine agents swept the result in parallel — leftover references, packaging readiness, branding consistency, and one tasked adversarially with disproving the documentation against the source. It returned 45 findings, and the most serious one had nothing to do with the rename:

```bash
# what every doc example said
mcp-rubric scan --command "node my-server.js" --min-score 80

# what the SDK does with it (stdio.js:65-72)
spawn(command, args, { shell: false })

# so on Linux and macOS it looks for an executable literally
# named "node my-server.js" and ENOENTs

# the form that works everywhere
mcp-rubric scan --command node --args my-server.js --min-score 80
```

The documented CI invocation could not run in CI. It worked in local testing on Windows, where `cross-spawn` routes through `cmd.exe`, and the integration test happened to use the split form — so nothing caught it.

Two related defects came out of the same pass:

- An unreadable `--config` file exited **1** — the same code as "score below threshold" — so CI would report a typo'd path as a failing scan. Now exits 3 with a message.
- A non-numeric `--min-score` produced `NaN`, making every comparison false and silently passing the gate it exists to enforce. Now exits 3.

None of these were caused by the rename. They surfaced because a rename forces you to re-read the lines you have stopped seeing.

## If you are naming a package

1. **Check both forms.** A 404 on `your-name` means nothing until `yourname` also returns 404. One extra command.
2. **Publish the entry point first.** We published two libraries before the binary, and discovered the blocking problem after two names were permanently spent.
3. **Make the binary name and the package name identical.** Ours differed, which is why the README confidently documented `npx mcp-studio` for a package that was never called that — `npx` resolves the package name, not the `bin` key.
4. **Search the ecosystem, not just the registry.** Two projects were already using this name in MCP tooling. The registry answers "is this string taken," never "is this name yours."
5. **Treat a forced rename as a free audit.** Every genuine bug fixed above was older than the rename.
