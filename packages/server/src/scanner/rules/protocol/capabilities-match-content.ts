import type { ScannerRule } from "../../rule-registry.js";

export const capabilitiesMatchContent: ScannerRule = {
  meta: {
    id: "protocol/capabilities-match-content",
    name: "Capabilities match content",
    description: "Declared capabilities match actual content",
    category: "protocol",
    severity: "error",
    weight: 7,
  },
  async check(ctx) {
    const diagnostics = [];
    const caps = ctx.capabilities;

    if (caps?.tools && ctx.tools.length === 0) {
      diagnostics.push({
        ruleId: "protocol/capabilities-match-content",
        severity: "error" as const,
        message: "Server declares tools capability but exposes no tools",
      });
    }
    if (!caps?.tools && ctx.tools.length > 0) {
      diagnostics.push({
        ruleId: "protocol/capabilities-match-content",
        severity: "error" as const,
        message: "Server exposes tools but does not declare tools capability",
      });
    }
    if (caps?.resources && ctx.resources.length === 0) {
      diagnostics.push({
        ruleId: "protocol/capabilities-match-content",
        severity: "error" as const,
        message: "Server declares resources capability but exposes no resources",
      });
    }
    if (caps?.prompts && ctx.prompts.length === 0) {
      diagnostics.push({
        ruleId: "protocol/capabilities-match-content",
        severity: "error" as const,
        message: "Server declares prompts capability but exposes no prompts",
      });
    }

    return diagnostics;
  },
};
