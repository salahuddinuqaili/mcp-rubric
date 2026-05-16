import { Outlet } from "react-router";
import { ServerSidebar } from "./ServerSidebar";

export function AppLayout() {
  return (
    <div className="flex h-screen">
      <ServerSidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
