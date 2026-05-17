import type { ScannerRule } from "../../rule-registry.js";

export const resourcesHaveMimetype: ScannerRule = {
  meta: {
    id: "quality/resources-have-mimetype",
    name: "Resources have MIME type",
    description: "Every resource specifies MIME type",
    category: "quality",
    severity: "warning",
    weight: 3,
  },
  async check(ctx) {
    const diagnostics = [];
    for (const resource of ctx.resources) {
      if (!resource.mimeType || resource.mimeType.trim().length === 0) {
        diagnostics.push({
          ruleId: "quality/resources-have-mimetype",
          severity: "warning" as const,
          message: `Resource "${resource.name}" does not specify a MIME type`,
          target: resource.uri,
        });
      }
    }
    return diagnostics;
  },
};
