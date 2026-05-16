import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useConnectionStore } from "@/stores/connection-store";
import { Link, useLocation } from "react-router";

const statusColors: Record<string, string> = {
  connected: "bg-green-500",
  connecting: "bg-yellow-500 animate-pulse",
  error: "bg-red-500",
  disconnected: "bg-neutral-500",
};

export function ServerSidebar() {
  const connections = useConnectionStore((s) => s.connections);
  const activeConnectionId = useConnectionStore((s) => s.activeConnectionId);
  const setActive = useConnectionStore((s) => s.setActive);
  const location = useLocation();

  const navItems = [
    { label: "Explorer", path: "/explorer" },
    { label: "History", path: "/history" },
    { label: "Scanner", path: "/scanner" },
    { label: "Collections", path: "/collections" },
  ];

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between p-4">
        <Link to="/" className="text-lg font-bold tracking-tight">
          MCP Studio
        </Link>
      </div>

      <Separator />

      <div className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase">Servers</span>
          <Link to="/">
            <Button variant="ghost" size="icon-xs" title="Add connection">
              <span className="text-lg leading-none">+</span>
            </Button>
          </Link>
        </div>

        {connections.size === 0 && (
          <p className="text-xs text-muted-foreground py-2">No connections</p>
        )}

        <div className="space-y-1">
          {Array.from(connections.entries()).map(([id, conn]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                activeConnectionId === id ? "bg-accent text-accent-foreground" : "text-foreground"
              }`}
            >
              <span className={`size-2 shrink-0 rounded-full ${statusColors[conn.status]}`} />
              <span className="truncate">{conn.config.name}</span>
              <Badge variant="outline" className="ml-auto text-[10px] px-1">
                {conn.config.transport.type}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
              location.pathname.startsWith(item.path)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
