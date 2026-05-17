import type { ScannerRule } from "../../rule-registry.js";

export const toolsHaveInputValidation: ScannerRule = {
  meta: {
    id: "security/tools-have-input-validation",
    name: "Tools have input validation",
    description: "Input schemas use constraints",
    category: "security",
    severity: "warning",
    weight: 4,
  },
  async check(ctx) {
    const diagnostics = [];
    for (const tool of ctx.tools) {
      const properties = tool.inputSchema?.properties as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (!properties) continue;

      for (const [propName, propSchema] of Object.entries(properties)) {
        const hasConstraints =
          propSchema.minLength !== undefined ||
          propSchema.maxLength !== undefined ||
          propSchema.minimum !== undefined ||
          propSchema.maximum !== undefined ||
          propSchema.pattern !== undefined ||
          propSchema.enum !== undefined ||
          propSchema.format !== undefined;

        if (!hasConstraints && propSchema.type === "string") {
          diagnostics.push({
            ruleId: "security/tools-have-input-validation",
            severity: "warning" as const,
            message: `Tool "${tool.name}" property "${propName}" has no validation constraints`,
            target: `${tool.name}.${propName}`,
          });
        }
      }
    }
    return diagnostics;
  },
};
