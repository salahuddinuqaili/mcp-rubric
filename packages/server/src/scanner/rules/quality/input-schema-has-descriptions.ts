import type { ScannerRule } from "../../rule-registry.js";

export const inputSchemaHasDescriptions: ScannerRule = {
  meta: {
    id: "quality/input-schema-has-descriptions",
    name: "Input schema has descriptions",
    description: "Schema properties have descriptions",
    category: "quality",
    severity: "info",
    weight: 3,
  },
  async check(ctx) {
    const diagnostics = [];
    for (const tool of ctx.tools) {
      const properties = tool.inputSchema?.properties as
        | Record<string, { description?: string }>
        | undefined;
      if (!properties) continue;

      for (const [propName, propSchema] of Object.entries(properties)) {
        if (!propSchema.description || propSchema.description.trim().length === 0) {
          diagnostics.push({
            ruleId: "quality/input-schema-has-descriptions",
            severity: "info" as const,
            message: `Tool "${tool.name}" property "${propName}" lacks a description`,
            target: `${tool.name}.${propName}`,
          });
        }
      }
    }
    return diagnostics;
  },
};
