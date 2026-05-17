import type { ScannerRule } from "../../rule-registry.js";

export const validInputSchemas: ScannerRule = {
  meta: {
    id: "protocol/valid-input-schemas",
    name: "Valid input schemas",
    description: "Tool input schemas are valid JSON Schema",
    category: "protocol",
    severity: "error",
    weight: 6,
  },
  async check(ctx) {
    const diagnostics = [];
    for (const tool of ctx.tools) {
      const schema = tool.inputSchema;
      if (!schema || typeof schema !== "object") {
        diagnostics.push({
          ruleId: "protocol/valid-input-schemas",
          severity: "error" as const,
          message: `Tool "${tool.name}" has no input schema`,
          target: tool.name,
        });
      } else if (schema.type && schema.type !== "object") {
        diagnostics.push({
          ruleId: "protocol/valid-input-schemas",
          severity: "error" as const,
          message: `Tool "${tool.name}" input schema type must be "object", got "${schema.type}"`,
          target: tool.name,
        });
      }
    }
    return diagnostics;
  },
};
