import type { ScannerRule } from "../../rule-registry.js";

export const consistentToolNaming: ScannerRule = {
  meta: {
    id: "quality/consistent-tool-naming",
    name: "Consistent tool naming",
    description: "All tool names use same convention",
    category: "quality",
    severity: "info",
    weight: 3,
  },
  async check(ctx) {
    if (ctx.tools.length < 2) return [];

    const conventions = {
      camelCase: /^[a-z][a-zA-Z0-9]*$/,
      snake_case: /^[a-z][a-z0-9_]*$/,
      "kebab-case": /^[a-z][a-z0-9-]*$/,
      PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
    };

    // Detect which convention each tool uses
    const detected = new Set<string>();
    for (const tool of ctx.tools) {
      for (const [name, pattern] of Object.entries(conventions)) {
        if (pattern.test(tool.name)) {
          detected.add(name);
          break;
        }
      }
    }

    if (detected.size > 1) {
      return [
        {
          ruleId: "quality/consistent-tool-naming",
          severity: "info" as const,
          message: `Tools use mixed naming conventions: ${[...detected].join(", ")}`,
        },
      ];
    }

    return [];
  },
};
