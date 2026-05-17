import type { ScannerRule } from "../../rule-registry.js";

export const noWildcardInputSchema: ScannerRule = {
  meta: {
    id: "security/no-wildcard-input-schema",
    name: "No wildcard input schema",
    description: "Input schemas are not {}",
    category: "security",
    severity: "warning",
    weight: 5,
  },
  async check(ctx) {
    const diagnostics = [];
    for (const tool of ctx.tools) {
      const schema = tool.inputSchema;
      if (!schema) continue;

      const properties = schema.properties as Record<string, unknown> | undefined;
      const hasProperties = properties && Object.keys(properties).length > 0;
      const hasRequired = Array.isArray(schema.required) && schema.required.length > 0;

      if (!hasProperties && !hasRequired && schema.type === "object") {
        diagnostics.push({
          ruleId: "security/no-wildcard-input-schema",
          severity: "warning" as const,
          message: `Tool "${tool.name}" has a wildcard input schema ({}) — accepts any input`,
          target: tool.name,
        });
      }
    }
    return diagnostics;
  },
};
