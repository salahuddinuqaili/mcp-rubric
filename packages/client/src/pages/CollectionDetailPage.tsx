import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { wsClient } from "@/lib/ws-client";
import { useCollectionsStore } from "@/stores/collections-store";
import { useConnectionStore } from "@/stores/connection-store";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

interface RunResult {
  itemId: string;
  type: string;
  success: boolean;
  error?: string;
}

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { collections, fetchAll, update } = useCollectionsStore();
  const activeConnectionId = useConnectionStore((s) => s.activeConnectionId);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RunResult[] | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const collection = collections.find((c) => c.id === id);

  if (!collection) {
    return <p className="text-muted-foreground">Collection not found</p>;
  }

  const handleRunAll = async () => {
    if (!activeConnectionId || !id) return;
    setRunning(true);
    setResults(null);
    try {
      const res = await wsClient.request<{ collectionId: string; results: RunResult[] }>(
        "run-collection",
        { collectionId: id, connectionId: activeConnectionId },
      );
      setResults(res.results);
    } catch (err) {
      setResults([{ itemId: "error", type: "system", success: false, error: String(err) }]);
    } finally {
      setRunning(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const items = collection.items.filter((it) => it.id !== itemId);
    await update(collection.id, { items });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link to="/collections" className="text-sm text-muted-foreground hover:text-foreground">
          Collections
        </Link>
        <span className="text-sm text-muted-foreground mx-1">/</span>
        <span className="text-sm">{collection.name}</span>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{collection.name}</h1>
        <Badge variant="secondary">{collection.items.length} items</Badge>
      </div>

      {collection.description && <p className="text-muted-foreground">{collection.description}</p>}

      <Button
        onClick={handleRunAll}
        disabled={running || !activeConnectionId || collection.items.length === 0}
      >
        {running ? "Running..." : "Run All"}
      </Button>

      {!activeConnectionId && (
        <p className="text-sm text-muted-foreground">Connect to a server to run this collection</p>
      )}

      {/* Items */}
      <div className="space-y-2">
        {collection.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No items yet. Use &quot;Save to Collection&quot; from the Tool or Resource detail pages.
          </p>
        ) : (
          collection.items.map((item) => {
            const runResult = results?.find((r) => r.itemId === item.id);
            return (
              <Card key={item.id}>
                <CardHeader className="py-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                    <span>
                      {item.type === "tool-call" && item.toolName}
                      {item.type === "resource-read" && item.resourceUri}
                      {item.type === "prompt-get" && item.promptName}
                    </span>
                    {item.label && (
                      <span className="text-muted-foreground text-xs">({item.label})</span>
                    )}
                    {runResult && (
                      <Badge
                        variant={runResult.success ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {runResult.success ? "pass" : "fail"}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="ml-auto text-destructive"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      x
                    </Button>
                  </CardTitle>
                </CardHeader>
                {runResult?.error && (
                  <CardContent className="pt-0 pb-2">
                    <p className="text-xs text-destructive">{runResult.error}</p>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Run results summary */}
      {results && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">
              Run Results: {results.filter((r) => r.success).length}/{results.length} passed
            </CardTitle>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
