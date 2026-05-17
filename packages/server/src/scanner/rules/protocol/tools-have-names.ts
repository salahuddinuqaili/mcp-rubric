import type { ScannerRule } from "../../rule-registry.js";

export const toolsHaveNames: ScannerRule = {
  meta: {
    id: "protocol/tools-have-names",
    name: "Tools have names",
    description: "All tools have non-empty names",
    category: "protocol",
    severity: "error",
    weight: 5,
  },
  async check(ctx) {
    const diagnostics = [];
    for (const tool of ctx.tools) {
      if (!tool.name || tool.name.trim().length === 0) {
        diagnostics.push({
          ruleId: "protocol/tools-have-names",
          severity: "error" as const,
          message: "A tool has an empty or missing name",
        });
      }
    }
    return diagnostics;
  },
};
