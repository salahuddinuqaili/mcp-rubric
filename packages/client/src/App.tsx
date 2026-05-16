import { AppLayout } from "@/components/AppLayout";
import { wsClient } from "@/lib/ws-client";
import { ConnectPage } from "@/pages/ConnectPage";
import { ExplorerPage } from "@/pages/ExplorerPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { PromptDetailPage } from "@/pages/PromptDetailPage";
import { ResourceDetailPage } from "@/pages/ResourceDetailPage";
import { ToolDetailPage } from "@/pages/ToolDetailPage";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      {title} — coming in a later phase
    </div>
  );
}

export function App() {
  useEffect(() => {
    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<ConnectPage />} />
          <Route path="explorer" element={<ExplorerPage />} />
          <Route path="explorer/tools/:name" element={<ToolDetailPage />} />
          <Route path="explorer/resources/*" element={<ResourceDetailPage />} />
          <Route path="explorer/prompts/:name" element={<PromptDetailPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="scanner" element={<PlaceholderPage title="Scanner" />} />
          <Route path="collections" element={<PlaceholderPage title="Collections" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
