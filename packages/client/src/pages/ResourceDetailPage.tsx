import { SaveToCollectionDialog } from "@/components/SaveToCollectionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { wsClient } from "@/lib/ws-client";
import { useConnectionStore } from "@/stores/connection-store";
import { useExplorerStore } from "@/stores/explorer-store";
import type { CollectionResourceRead, ResourceReadRecord } from "mcp-rubric-shared";
import { useState } from "react";
import { Link, useParams } from "react-router";

export function ResourceDetailPage() {
  const { "*": uri } = useParams();
  const activeConnectionId = useConnectionStore((s) => s.activeConnectionId);
  const resources = useExplorerStore((s) => s.resources);
  const resource = resources.find((r) => r.uri === uri);

  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<ResourceReadRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRead = async () => {
    if (!activeConnectionId || !uri) return;
    setReading(true);
    setError(null);
    setResult(null);

    try {
      const { record } = await wsClient.request<{ record: ResourceReadRecord }>("read-resource", {
        connectionId: activeConnectionId,
        uri,
      });
      setResult(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link to="/explorer" className="text-sm text-muted-foreground hover:text-foreground">
          Explorer
        </Link>
        <span className="text-sm text-muted-foreground mx-1">/</span>
        <span className="text-sm">{resource?.name ?? uri}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{resource?.name ?? "Resource"}</h1>
        <p className="text-xs font-mono text-muted-foreground mt-1">{uri}</p>
        {resource?.description && (
          <p className="text-muted-foreground mt-1">{resource.description}</p>
        )}
        {resource?.mimeType && (
          <Badge variant="outline" className="mt-2">
            {resource.mimeType}
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleRead} disabled={reading || !activeConnectionId}>
          {reading ? "Reading..." : "Read Resource"}
        </Button>
        {activeConnectionId && uri && (
          <SaveToCollectionDialog
            item={
              {
                type: "resource-read",
                id: crypto.randomUUID(),
                connectionConfig: { type: "stdio", command: "" },
                resourceUri: uri,
              } satisfies CollectionResourceRead
            }
          />
        )}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {result?.result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              Content
              {result.durationMs !== undefined && (
                <span className="text-xs text-muted-foreground font-normal">
                  {result.durationMs}ms
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.result.contents.map((content, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: content items have no stable ID
              <div key={i} className="mb-2">
                {content.mimeType && (
                  <Badge variant="outline" className="mb-2 text-xs">
                    {content.mimeType}
                  </Badge>
                )}
                {content.text && (
                  <pre className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap overflow-auto">
                    {content.text}
                  </pre>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
