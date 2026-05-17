import type { ScannerRule } from "../../rule-registry.js";

export const resourcesHaveDescriptions: ScannerRule = {
  meta: {
    id: "quality/resources-have-descriptions",
    name: "Resources have descriptions",
    description: "Every resource has a description",
    category: "quality",
    severity: "warning",
    weight: 4,
  },
  async check(ctx) {
    const diagnostics = [];
    for (const resource of ctx.resources) {
      if (!resource.description || resource.description.trim().length === 0) {
        diagnostics.push({
          ruleId: "quality/resources-have-descriptions",
          severity: "warning" as const,
          message: `Resource "${resource.name}" has no description`,
          target: resource.uri,
        });
      }
    }
    return diagnostics;
  },
};
