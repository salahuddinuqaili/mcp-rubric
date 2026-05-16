import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHistoryStore } from "@/stores/history-store";
import { useEffect, useState } from "react";

export function HistoryPage() {
  const {
    toolCalls,
    resourceReads,
    loading,
    fetchToolCalls,
    fetchResourceReads,
    deleteToolCall,
    deleteResourceRead,
    clearAllToolCalls,
    clearAllResourceReads,
  } = useHistoryStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchToolCalls();
    fetchResourceReads();
  }, [fetchToolCalls, fetchResourceReads]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">History</h1>

      <Tabs defaultValue="tool-calls">
        <TabsList>
          <TabsTrigger value="tool-calls">Tool Calls ({toolCalls.length})</TabsTrigger>
          <TabsTrigger value="resource-reads">Resource Reads ({resourceReads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tool-calls" className="mt-4 space-y-2">
          {toolCalls.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="xs"
                className="text-destructive"
                onClick={clearAllToolCalls}
              >
                Clear All
              </Button>
            </div>
          )}
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : toolCalls.length === 0 ? (
            <p className="text-muted-foreground">No tool calls recorded yet</p>
          ) : (
            toolCalls.map((record) => (
              <Card key={record.id}>
                <CardHeader className="py-3">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  >
                    <CardTitle className="flex items-center gap-2 text-sm font-normal">
                      <span className="font-medium">{record.toolName}</span>
                      <Badge
                        variant={record.status === "success" ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {record.status}
                      </Badge>
                      {record.durationMs !== undefined && (
                        <span className="text-xs text-muted-foreground">{record.durationMs}ms</span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {record.connectionName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.startedAt).toLocaleString()}
                      </span>
                    </CardTitle>
                  </button>
                </CardHeader>
                {expandedId === record.id && (
                  <CardContent className="pt-0 pb-3 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Arguments</p>
                      <pre className="rounded-md bg-muted p-2 text-xs overflow-auto">
                        {JSON.stringify(record.arguments, null, 2)}
                      </pre>
                    </div>
                    {record.result && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Result</p>
                        {record.result.content.map((block, i) => (
                          <pre
                            // biome-ignore lint/suspicious/noArrayIndexKey: content blocks lack stable IDs
                            key={i}
                            className="rounded-md bg-muted p-2 text-xs overflow-auto whitespace-pre-wrap"
                          >
                            {block.text ?? JSON.stringify(block)}
                          </pre>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive"
                      onClick={() => deleteToolCall(record.id)}
                    >
                      Delete
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resource-reads" className="mt-4 space-y-2">
          {resourceReads.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="xs"
                className="text-destructive"
                onClick={clearAllResourceReads}
              >
                Clear All
              </Button>
            </div>
          )}
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : resourceReads.length === 0 ? (
            <p className="text-muted-foreground">No resource reads recorded yet</p>
          ) : (
            resourceReads.map((record) => (
              <Card key={record.id}>
                <CardHeader className="py-3">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  >
                    <CardTitle className="flex items-center gap-2 text-sm font-normal">
                      <span className="font-medium font-mono text-xs">{record.resourceUri}</span>
                      <Badge
                        variant={record.status === "success" ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {record.status}
                      </Badge>
                      {record.durationMs !== undefined && (
                        <span className="text-xs text-muted-foreground">{record.durationMs}ms</span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(record.timestamp).toLocaleString()}
                      </span>
                    </CardTitle>
                  </button>
                </CardHeader>
                {expandedId === record.id && (
                  <CardContent className="pt-0 pb-3 space-y-2">
                    {record.result?.contents.map((content, i) => (
                      <pre
                        // biome-ignore lint/suspicious/noArrayIndexKey: content items lack stable IDs
                        key={i}
                        className="rounded-md bg-muted p-2 text-xs overflow-auto whitespace-pre-wrap"
                      >
                        {content.text ?? `[${content.mimeType}]`}
                      </pre>
                    ))}
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive"
                      onClick={() => deleteResourceRead(record.id)}
                    >
                      Delete
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
