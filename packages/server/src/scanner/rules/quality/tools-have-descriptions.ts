import type { ScannerRule } from "../../rule-registry.js";

export const toolsHaveDescriptions: ScannerRule = {
  meta: {
    id: "quality/tools-have-descriptions",
    name: "Tools have descriptions",
    description: "Every tool has a description",
    category: "quality",
    severity: "warning",
    weight: 6,
  },
  async check(ctx) {
    const diagnostics = [];
    for (const tool of ctx.tools) {
      if (!tool.description || tool.description.trim().length === 0) {
        diagnostics.push({
          ruleId: "quality/tools-have-descriptions",
          severity: "warning" as const,
          message: `Tool "${tool.name}" has no description`,
          target: tool.name,
        });
      }
    }
    return diagnostics;
  },
};
