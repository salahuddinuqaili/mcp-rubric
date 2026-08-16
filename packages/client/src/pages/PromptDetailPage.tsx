import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { wsClient } from "@/lib/ws-client";
import { useConnectionStore } from "@/stores/connection-store";
import { useExplorerStore } from "@/stores/explorer-store";
import type { ContentBlock } from "mcp-rubric-shared";
import { useState } from "react";
import { Link, useParams } from "react-router";

interface PromptResult {
  description?: string;
  messages: Array<{ role: string; content: ContentBlock }>;
}

export function PromptDetailPage() {
  const { name } = useParams<{ name: string }>();
  const activeConnectionId = useConnectionStore((s) => s.activeConnectionId);
  const prompts = useExplorerStore((s) => s.prompts);
  const prompt = prompts.find((p) => p.name === name);

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<PromptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!prompt) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground">Prompt &quot;{name}&quot; not found</p>
        <Link to="/explorer" className="text-sm text-primary underline">
          Back to Explorer
        </Link>
      </div>
    );
  }

  const handleExecute = async () => {
    if (!activeConnectionId) return;
    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const res = await wsClient.request<PromptResult>("get-prompt", {
        connectionId: activeConnectionId,
        promptName: prompt.name,
        arguments: Object.keys(formValues).length > 0 ? formValues : undefined,
      });
      setResult(res);
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
        <span className="text-sm">{prompt.name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{prompt.name}</h1>
        <p className="text-muted-foreground mt-1">{prompt.description || "No description"}</p>
      </div>

      {/* Arguments Form */}
      {prompt.arguments && prompt.arguments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Arguments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prompt.arguments.map((arg) => (
              <div key={arg.name} className="space-y-1">
                <Label htmlFor={arg.name} className="flex items-center gap-1">
                  {arg.name}
                  {arg.required && <span className="text-destructive text-xs">*</span>}
                </Label>
                {arg.description && (
                  <p className="text-xs text-muted-foreground">{arg.description}</p>
                )}
                <Input
                  id={arg.name}
                  value={formValues[arg.name] ?? ""}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, [arg.name]: e.target.value }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button onClick={handleExecute} disabled={executing || !activeConnectionId}>
        {executing ? "Getting prompt..." : "Get Prompt"}
      </Button>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.messages.map((msg, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: messages have no stable ID
              <div key={i} className="rounded-md border p-3">
                <Badge variant="outline" className="mb-2">
                  {msg.role}
                </Badge>
                {msg.content.type === "text" && (
                  <p className="text-sm whitespace-pre-wrap">{msg.content.text}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
