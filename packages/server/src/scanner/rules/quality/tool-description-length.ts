import type { ScannerRule } from "../../rule-registry.js";

export const toolDescriptionLength: ScannerRule = {
  meta: {
    id: "quality/tool-description-length",
    name: "Tool description length",
    description: "Descriptions are >= 20 characters",
    category: "quality",
    severity: "info",
    weight: 3,
  },
  async check(ctx) {
    const diagnostics = [];
    for (const tool of ctx.tools) {
      if (tool.description && tool.description.trim().length < 20) {
        diagnostics.push({
          ruleId: "quality/tool-description-length",
          severity: "info" as const,
          message: `Tool "${tool.name}" description is shorter than 20 characters`,
          target: tool.name,
        });
      }
    }
    return diagnostics;
  },
};
