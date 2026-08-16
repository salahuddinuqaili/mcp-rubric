import type { RuleDiagnostic, ScanResult } from "mcp-rubric-shared";
import type { ScannerRule } from "./rule-registry.js";

export function calculateScore(
  diagnostics: RuleDiagnostic[],
  rules: ScannerRule[],
): Pick<ScanResult, "score" | "grade" | "summary"> {
  const maxPoints = rules.reduce((sum, r) => sum + r.meta.weight, 0);

  let penalties = 0;
  let errors = 0;
  let warnings = 0;
  let infos = 0;

  // Group diagnostics by rule to count unique rule failures
  const failedRuleIds = new Set(diagnostics.map((d) => d.ruleId));

  for (const rule of rules) {
    if (!failedRuleIds.has(rule.meta.id)) continue;

    const ruleDiagnostics = diagnostics.filter((d) => d.ruleId === rule.meta.id);
    // Count by severity for summary
    for (const d of ruleDiagnostics) {
      if (d.severity === "error") errors++;
      else if (d.severity === "warning") warnings++;
      else infos++;
    }

    // Penalty based on rule severity (applied once per rule)
    switch (rule.meta.severity) {
      case "error":
        penalties += rule.meta.weight;
        break;
      case "warning":
        penalties += rule.meta.weight * 0.5;
        break;
      case "info":
        penalties += rule.meta.weight * 0.15;
        break;
    }
  }

  const score = maxPoints > 0 ? Math.round(((maxPoints - penalties) / maxPoints) * 100) : 100;
  const clampedScore = Math.max(0, Math.min(100, score));

  const grade = getGrade(clampedScore);
  const passed = rules.length - failedRuleIds.size;

  return {
    score: clampedScore,
    grade,
    summary: {
      total: rules.length,
      passed,
      errors,
      warnings,
      infos,
    },
  };
}

function getGrade(score: number): ScanResult["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
