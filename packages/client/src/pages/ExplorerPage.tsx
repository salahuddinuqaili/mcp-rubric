import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConnectionStore } from "@/stores/connection-store";
import { useExplorerStore } from "@/stores/explorer-store";
import { useEffect } from "react";

export function ExplorerPage() {
  const activeConnectionId = useConnectionStore((s) => s.activeConnectionId);
  const connections = useConnectionStore((s) => s.connections);
  const { tools, resources, prompts, loading, fetchAll } = useExplorerStore();

  const activeConnection = activeConnectionId ? connections.get(activeConnectionId) : undefined;

  useEffect(() => {
    if (activeConnectionId) {
      fetchAll(activeConnectionId);
    }
  }, [activeConnectionId, fetchAll]);

  if (!activeConnectionId || !activeConnection) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a connection from the sidebar to explore
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{activeConnection.config.name}</h1>
        {activeConnection.serverInfo && (
          <Badge variant="outline">
            {activeConnection.serverInfo.name} v{activeConnection.serverInfo.version}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="tools">
        <TabsList>
          <TabsTrigger value="tools">Tools {!loading && `(${tools.length})`}</TabsTrigger>
          <TabsTrigger value="resources">
            Resources {!loading && `(${resources.length})`}
          </TabsTrigger>
          <TabsTrigger value="prompts">Prompts {!loading && `(${prompts.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="mt-4 space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : tools.length === 0 ? (
            <p className="text-muted-foreground">No tools exposed by this server</p>
          ) : (
            tools.map((tool) => (
              <Card key={tool.name}>
                <CardHeader className="py-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {tool.name}
                    {tool.annotations?.readOnlyHint && (
                      <Badge variant="secondary" className="text-xs">
                        read-only
                      </Badge>
                    )}
                    {tool.annotations?.destructiveHint && (
                      <Badge variant="destructive" className="text-xs">
                        destructive
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <p className="text-sm text-muted-foreground">
                    {tool.description || "No description"}
                  </p>
                  {tool.inputSchema && Object.keys(tool.inputSchema).length > 0 && (
                    <pre className="mt-2 rounded-md bg-muted p-2 text-xs overflow-auto">
                      {JSON.stringify(tool.inputSchema, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resources" className="mt-4 space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : resources.length === 0 ? (
            <p className="text-muted-foreground">No resources exposed by this server</p>
          ) : (
            resources.map((resource) => (
              <Card key={resource.uri}>
                <CardHeader className="py-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {resource.name}
                    {resource.mimeType && (
                      <Badge variant="outline" className="text-xs">
                        {resource.mimeType}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <p className="text-xs text-muted-foreground font-mono">{resource.uri}</p>
                  {resource.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="prompts" className="mt-4 space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : prompts.length === 0 ? (
            <p className="text-muted-foreground">No prompts exposed by this server</p>
          ) : (
            prompts.map((prompt) => (
              <Card key={prompt.name}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">{prompt.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <p className="text-sm text-muted-foreground">
                    {prompt.description || "No description"}
                  </p>
                  {prompt.arguments && prompt.arguments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Arguments:</p>
                      {prompt.arguments.map((arg) => (
                        <div key={arg.name} className="flex items-center gap-2 text-xs">
                          <code className="rounded bg-muted px-1 py-0.5">{arg.name}</code>
                          {arg.required && (
                            <Badge variant="secondary" className="text-[10px]">
                              required
                            </Badge>
                          )}
                          {arg.description && (
                            <span className="text-muted-foreground">{arg.description}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
