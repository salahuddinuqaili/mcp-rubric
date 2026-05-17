import type { ScannerRule } from "../../rule-registry.js";

export const serverHasCapabilities: ScannerRule = {
  meta: {
    id: "protocol/server-has-capabilities",
    name: "Server has capabilities",
    description: "Server declares at least one capability",
    category: "protocol",
    severity: "error",
    weight: 8,
  },
  async check(ctx) {
    const caps = ctx.capabilities;
    if (!caps || (!caps.tools && !caps.resources && !caps.prompts)) {
      return [
        {
          ruleId: "protocol/server-has-capabilities",
          severity: "error",
          message: "Server does not declare any capabilities (tools, resources, or prompts)",
        },
      ];
    }
    return [];
  },
};
