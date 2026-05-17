import type { ScannerRule } from "../../rule-registry.js";

export const promptsHaveNames: ScannerRule = {
  meta: {
    id: "protocol/prompts-have-names",
    name: "Prompts have names",
    description: "All prompts have non-empty names",
    category: "protocol",
    severity: "error",
    weight: 5,
  },
  async check(ctx) {
    const diagnostics = [];
    for (const prompt of ctx.prompts) {
      if (!prompt.name || prompt.name.trim().length === 0) {
        diagnostics.push({
          ruleId: "protocol/prompts-have-names",
          severity: "error" as const,
          message: "A prompt has an empty or missing name",
        });
      }
    }
    return diagnostics;
  },
};
