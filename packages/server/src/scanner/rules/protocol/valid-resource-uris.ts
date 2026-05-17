import type { ScannerRule } from "../../rule-registry.js";

export const validResourceUris: ScannerRule = {
  meta: {
    id: "protocol/valid-resource-uris",
    name: "Valid resource URIs",
    description: "Resource URIs parse as valid URLs",
    category: "protocol",
    severity: "error",
    weight: 5,
  },
  async check(ctx) {
    const diagnostics = [];
    for (const resource of ctx.resources) {
      try {
        new URL(resource.uri);
      } catch {
        diagnostics.push({
          ruleId: "protocol/valid-resource-uris",
          severity: "error" as const,
          message: `Resource URI "${resource.uri}" is not a valid URL`,
          target: resource.uri,
        });
      }
    }
    return diagnostics;
  },
};
