import { randomUUID } from "node:crypto";
import type { RuleDiagnostic, ScanResult } from "mcp-rubric-shared";
import type { ConnectionManager } from "../mcp/connection-manager.js";
import type { ScanContext } from "./context.js";
import { RuleRegistry } from "./rule-registry.js";
import { capabilitiesMatchContent } from "./rules/protocol/capabilities-match-content.js";
import { promptsHaveNames } from "./rules/protocol/prompts-have-names.js";
import { serverHasCapabilities } from "./rules/protocol/server-has-capabilities.js";
import { toolsHaveNames } from "./rules/protocol/tools-have-names.js";
import { validInputSchemas } from "./rules/protocol/valid-input-schemas.js";
import { validResourceUris } from "./rules/protocol/valid-resource-uris.js";
import { consistentToolNaming } from "./rules/quality/consistent-tool-naming.js";
import { inputSchemaHasDescriptions } from "./rules/quality/input-schema-has-descriptions.js";
import { promptsHaveDescriptions } from "./rules/quality/prompts-have-descriptions.js";
import { resourcesHaveDescriptions } from "./rules/quality/resources-have-descriptions.js";
import { resourcesHaveMimetype } from "./rules/quality/resources-have-mimetype.js";
import { toolDescriptionLength } from "./rules/quality/tool-description-length.js";
import { toolsHaveDescriptions } from "./rules/quality/tools-have-descriptions.js";
import { noSecretsInDescriptions } from "./rules/security/no-secrets-in-descriptions.js";
import { noWildcardInputSchema } from "./rules/security/no-wildcard-input-schema.js";
import { toolsHaveInputValidation } from "./rules/security/tools-have-input-validation.js";
import { calculateScore } from "./scoring.js";

export function createDefaultRegistry(): RuleRegistry {
  const registry = new RuleRegistry();

  // Protocol rules
  registry.register(serverHasCapabilities);
  registry.register(capabilitiesMatchContent);
  registry.register(validInputSchemas);
  registry.register(validResourceUris);
  registry.register(toolsHaveNames);
  registry.register(promptsHaveNames);

  // Quality rules
  registry.register(toolsHaveDescriptions);
  registry.register(toolDescriptionLength);
  registry.register(resourcesHaveDescriptions);
  registry.register(resourcesHaveMimetype);
  registry.register(promptsHaveDescriptions);
  registry.register(consistentToolNaming);
  registry.register(inputSchemaHasDescriptions);

  // Security rules
  registry.register(noWildcardInputSchema);
  registry.register(noSecretsInDescriptions);
  registry.register(toolsHaveInputValidation);

  return registry;
}

export type ScanProgressCallback = (
  connectionId: string,
  currentRule: string,
  progress: number,
) => void;

export async function runScan(
  connectionId: string,
  manager: ConnectionManager,
  registry: RuleRegistry,
  onProgress?: ScanProgressCallback,
): Promise<ScanResult> {
  const start = Date.now();

  // Gather context from the connection
  const connection = manager.getConnection(connectionId);
  if (!connection) throw new Error(`Connection not found: ${connectionId}`);

  const [tools, { resources }, prompts] = await Promise.all([
    manager.listTools(connectionId),
    manager.listResources(connectionId),
    manager.listPrompts(connectionId),
  ]);

  const ctx: ScanContext = {
    connectionId,
    capabilities: connection.capabilities,
    tools,
    resources,
    prompts,
  };

  // Run all rules
  const rules = registry.getAll();
  const allDiagnostics: RuleDiagnostic[] = [];

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const diagnostics = await rule.check(ctx);
    allDiagnostics.push(...diagnostics);

    if (onProgress) {
      onProgress(connectionId, rule.meta.id, (i + 1) / rules.length);
    }
  }

  const { score, grade, summary } = calculateScore(allDiagnostics, rules);
  const durationMs = Date.now() - start;

  return {
    id: randomUUID(),
    connectionId,
    connectionName: connection.config.name,
    serverInfo: connection.serverInfo,
    score,
    grade,
    diagnostics: allDiagnostics,
    summary,
    scannedAt: new Date().toISOString(),
    durationMs,
  };
}
