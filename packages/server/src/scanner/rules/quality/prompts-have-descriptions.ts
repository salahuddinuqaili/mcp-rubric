import type { ScannerRule } from "../../rule-registry.js";

export const promptsHaveDescriptions: ScannerRule = {
  meta: {
    id: "quality/prompts-have-descriptions",
    name: "Prompts have descriptions",
    description: "Every prompt has a description",
    category: "quality",
    severity: "warning",
    weight: 4,
  },
  async check(ctx) {
    const diagnostics = [];
    for (const prompt of ctx.prompts) {
      if (!prompt.description || prompt.description.trim().length === 0) {
        diagnostics.push({
          ruleId: "quality/prompts-have-descriptions",
          severity: "warning" as const,
          message: `Prompt "${prompt.name}" has no description`,
          target: prompt.name,
        });
      }
    }
    return diagnostics;
  },
};
