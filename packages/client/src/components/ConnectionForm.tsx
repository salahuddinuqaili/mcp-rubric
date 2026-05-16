import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConnectionStore } from "@/stores/connection-store";
import { useExplorerStore } from "@/stores/explorer-store";
import type { TransportConfig, TransportType } from "@mcp-studio/shared";
import { useState } from "react";
import { useNavigate } from "react-router";

export function ConnectionForm() {
  const [name, setName] = useState("");
  const [transportType, setTransportType] = useState<TransportType>("stdio");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const connect = useConnectionStore((s) => s.connect);
  const connecting = useConnectionStore((s) => s.connecting);
  const fetchAll = useExplorerStore((s) => s.fetchAll);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let transport: TransportConfig;
    if (transportType === "stdio") {
      if (!command.trim()) {
        setError("Command is required");
        return;
      }
      transport = {
        type: "stdio",
        command: command.trim(),
        args: args
          .trim()
          .split(/\s+/)
          .filter((a) => a.length > 0),
      };
    } else {
      if (!url.trim()) {
        setError("URL is required");
        return;
      }
      transport = {
        type: transportType,
        url: url.trim(),
      };
    }

    const connectionName = name.trim() || command.trim() || url.trim();

    try {
      const connectionId = await connect(connectionName, transport);
      await fetchAll(connectionId);
      navigate("/explorer");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Connect to MCP Server</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              placeholder="My MCP Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transport">Transport</Label>
            <Select
              value={transportType}
              onValueChange={(v) => setTransportType(v as TransportType)}
            >
              <SelectTrigger id="transport">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stdio">stdio</SelectItem>
                <SelectItem value="sse">SSE</SelectItem>
                <SelectItem value="streamable-http">Streamable HTTP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {transportType === "stdio" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="command">Command</Label>
                <Input
                  id="command"
                  placeholder="node server.js"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="args">Arguments (space-separated)</Label>
                <Input
                  id="args"
                  placeholder="--flag value"
                  value={args}
                  onChange={(e) => setArgs(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="http://localhost:3000/mcp"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={connecting}>
            {connecting ? "Connecting..." : "Connect"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
