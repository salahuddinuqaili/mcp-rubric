import type { RuleCategory, RuleDiagnostic, ValidationRule } from "mcp-rubric-shared";
import type { ScanContext } from "./context.js";

export interface ScannerRule {
  meta: ValidationRule;
  check(ctx: ScanContext): Promise<RuleDiagnostic[]>;
}

export class RuleRegistry {
  private rules: ScannerRule[] = [];

  register(rule: ScannerRule): void {
    this.rules.push(rule);
  }

  getAll(): ScannerRule[] {
    return this.rules;
  }

  getByCategory(category: RuleCategory): ScannerRule[] {
    return this.rules.filter((r) => r.meta.category === category);
  }
}
