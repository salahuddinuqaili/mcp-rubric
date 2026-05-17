import type { ScannerRule } from "../../rule-registry.js";

const SECRET_PATTERNS = [
  /\b[A-Za-z0-9]{32,}\b/, // Long random strings (API keys)
  /sk[-_][a-zA-Z0-9]{20,}/, // Stripe-style keys
  /\bghp_[a-zA-Z0-9]{36}\b/, // GitHub PATs
  /\bAIza[a-zA-Z0-9_-]{35}\b/, // Google API keys
  /\b(api[_-]?key|secret|token|password)\s*[:=]\s*\S+/i, // Explicit key=value patterns
];

export const noSecretsInDescriptions: ScannerRule = {
  meta: {
    id: "security/no-secrets-in-descriptions",
    name: "No secrets in descriptions",
    description: "No API keys/tokens in descriptions",
    category: "security",
    severity: "error",
    weight: 9,
  },
  async check(ctx) {
    const diagnostics = [];
    const texts: Array<{ text: string; source: string }> = [];

    for (const tool of ctx.tools) {
      if (tool.description) texts.push({ text: tool.description, source: `tool:${tool.name}` });
    }
    for (const resource of ctx.resources) {
      if (resource.description)
        texts.push({ text: resource.description, source: `resource:${resource.uri}` });
    }
    for (const prompt of ctx.prompts) {
      if (prompt.description)
        texts.push({ text: prompt.description, source: `prompt:${prompt.name}` });
    }

    for (const { text, source } of texts) {
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(text)) {
          diagnostics.push({
            ruleId: "security/no-secrets-in-descriptions",
            severity: "error" as const,
            message: `Possible secret or API key found in description of ${source}`,
            target: source,
          });
          break;
        }
      }
    }

    return diagnostics;
  },
};
