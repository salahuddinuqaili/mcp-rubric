import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConnectionStore } from "@/stores/connection-store";
import { useScannerStore } from "@/stores/scanner-store";
import { useEffect } from "react";

const gradeColors: Record<string, string> = {
  A: "text-green-400",
  B: "text-blue-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  F: "text-red-400",
};

const severityColors: Record<string, string> = {
  error: "destructive",
  warning: "secondary",
  info: "outline",
};

export function ScannerPage() {
  const activeConnectionId = useConnectionStore((s) => s.activeConnectionId);
  const { currentResult, history, scanning, progress, currentRule, runScan, fetchHistory } =
    useScannerStore();

  useEffect(() => {
    fetchHistory(activeConnectionId ?? undefined);
  }, [fetchHistory, activeConnectionId]);

  const handleScan = () => {
    if (activeConnectionId) runScan(activeConnectionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scanner</h1>
        <Button onClick={handleScan} disabled={scanning || !activeConnectionId}>
          {scanning ? `Scanning... ${Math.round(progress * 100)}%` : "Run Scan"}
        </Button>
      </div>

      {!activeConnectionId && (
        <p className="text-muted-foreground">Connect to a server to run a scan</p>
      )}

      {scanning && currentRule && (
        <p className="text-sm text-muted-foreground">Checking: {currentRule}</p>
      )}

      {/* Score Card */}
      {currentResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-5xl font-bold ${gradeColors[currentResult.grade]}`}>
                  {currentResult.grade}
                </div>
                <div className="text-2xl font-medium mt-1">{currentResult.score}/100</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {currentResult.summary.total} rules checked
                  </span>
                  <span className="text-green-400">{currentResult.summary.passed} passed</span>
                </div>
                <div className="flex gap-3">
                  {currentResult.summary.errors > 0 && (
                    <Badge variant="destructive">{currentResult.summary.errors} errors</Badge>
                  )}
                  {currentResult.summary.warnings > 0 && (
                    <Badge variant="secondary">{currentResult.summary.warnings} warnings</Badge>
                  )}
                  {currentResult.summary.infos > 0 && (
                    <Badge variant="outline">{currentResult.summary.infos} info</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentResult.connectionName} — {currentResult.durationMs}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostics */}
      {currentResult && currentResult.diagnostics.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Diagnostics</h2>
          {currentResult.diagnostics.map((d, i) => (
            <Card
              // biome-ignore lint/suspicious/noArrayIndexKey: diagnostics lack unique IDs
              key={i}
            >
              <CardHeader className="py-2">
                <CardTitle className="flex items-center gap-2 text-sm font-normal">
                  <Badge
                    variant={severityColors[d.severity] as "destructive" | "secondary" | "outline"}
                    className="text-xs"
                  >
                    {d.severity}
                  </Badge>
                  <code className="text-xs text-muted-foreground">{d.ruleId}</code>
                  {d.target && (
                    <span className="text-xs text-muted-foreground ml-auto">{d.target}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2">
                <p className="text-sm">{d.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Scan History</h2>
          {history.map((scan) => (
            <Card key={scan.id}>
              <CardHeader className="py-2">
                <CardTitle className="flex items-center gap-2 text-sm font-normal">
                  <span className={`font-bold ${gradeColors[scan.grade]}`}>{scan.grade}</span>
                  <span>{scan.score}/100</span>
                  <span className="text-muted-foreground">{scan.connectionName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(scan.scannedAt).toLocaleString()}
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
