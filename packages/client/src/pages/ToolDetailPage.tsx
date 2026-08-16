import { SaveToCollectionDialog } from "@/components/SaveToCollectionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { wsClient } from "@/lib/ws-client";
import { useConnectionStore } from "@/stores/connection-store";
import { useExplorerStore } from "@/stores/explorer-store";
import type { CollectionToolCall, ToolCallRecord } from "mcp-rubric-shared";
import { useState } from "react";
import { Link, useParams } from "react-router";

export function ToolDetailPage() {
  const { name } = useParams<{ name: string }>();
  const activeConnectionId = useConnectionStore((s) => s.activeConnectionId);
  const tools = useExplorerStore((s) => s.tools);
  const tool = tools.find((t) => t.name === name);

  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [rawJson, setRawJson] = useState("");
  const [useRawMode, setUseRawMode] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ToolCallRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!tool) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground">Tool &quot;{name}&quot; not found</p>
        <Link to="/explorer" className="text-sm text-primary underline">
          Back to Explorer
        </Link>
      </div>
    );
  }

  const properties = (tool.inputSchema.properties ?? {}) as Record<
    string,
    { type?: string; description?: string; enum?: string[] }
  >;
  const required = (tool.inputSchema.required ?? []) as string[];

  const handleFieldChange = (field: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleExecute = async () => {
    if (!activeConnectionId) return;
    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      let args: Record<string, unknown>;
      if (useRawMode) {
        args = JSON.parse(rawJson || "{}") as Record<string, unknown>;
      } else {
        args = { ...formValues };
        for (const [key, schema] of Object.entries(properties)) {
          // Coerce number fields
          if (schema.type === "number" || schema.type === "integer") {
            if (args[key] !== undefined && args[key] !== "") {
              args[key] = Number(args[key]);
            }
          }
          // Remove empty strings for non-required fields
          if (args[key] === "" && !required.includes(key)) {
            delete args[key];
          }
        }
      }

      const { record } = await wsClient.request<{ record: ToolCallRecord }>("call-tool", {
        connectionId: activeConnectionId,
        toolName: tool.name,
        arguments: args,
      });
      setResult(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link to="/explorer" className="text-sm text-muted-foreground hover:text-foreground">
          Explorer
        </Link>
        <span className="text-sm text-muted-foreground mx-1">/</span>
        <span className="text-sm">{tool.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tool.name}</h1>
          <p className="text-muted-foreground mt-1">{tool.description || "No description"}</p>
        </div>
        {activeConnectionId && (
          <SaveToCollectionDialog
            item={
              {
                type: "tool-call",
                id: crypto.randomUUID(),
                connectionConfig: { type: "stdio", command: "" },
                toolName: tool.name,
                arguments: formValues,
              } satisfies CollectionToolCall
            }
          />
        )}
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Arguments</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="raw-mode" className="text-xs text-muted-foreground">
                Raw JSON
              </Label>
              <Switch id="raw-mode" checked={useRawMode} onCheckedChange={setUseRawMode} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {useRawMode ? (
            <Textarea
              placeholder='{"key": "value"}'
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              className="font-mono text-sm min-h-[120px]"
            />
          ) : Object.keys(properties).length === 0 ? (
            <p className="text-sm text-muted-foreground">This tool takes no arguments</p>
          ) : (
            Object.entries(properties).map(([field, schema]) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={field} className="flex items-center gap-1">
                  {field}
                  {required.includes(field) && <span className="text-destructive text-xs">*</span>}
                </Label>
                {schema.description && (
                  <p className="text-xs text-muted-foreground">{schema.description}</p>
                )}
                {schema.type === "boolean" ? (
                  <Switch
                    id={field}
                    checked={!!formValues[field]}
                    onCheckedChange={(v) => handleFieldChange(field, v)}
                  />
                ) : (
                  <Input
                    id={field}
                    type={schema.type === "number" || schema.type === "integer" ? "number" : "text"}
                    placeholder={schema.type ?? "string"}
                    value={(formValues[field] as string) ?? ""}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                  />
                )}
              </div>
            ))
          )}

          <Button onClick={handleExecute} disabled={executing || !activeConnectionId}>
            {executing ? "Executing..." : "Execute"}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              Response
              <Badge variant={result.status === "success" ? "secondary" : "destructive"}>
                {result.status}
              </Badge>
              {result.durationMs !== undefined && (
                <span className="text-xs text-muted-foreground font-normal">
                  {result.durationMs}ms
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.result?.content.map((block, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: content blocks have no stable ID
              <div key={i} className="mb-2">
                {block.type === "text" && (
                  <pre className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap overflow-auto">
                    {block.text}
                  </pre>
                )}
                {block.type === "image" && block.data && (
                  <img
                    src={`data:${block.mimeType ?? "image/png"};base64,${block.data}`}
                    alt="Tool result"
                    className="max-w-full rounded-md"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
