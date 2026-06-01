import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0F1D] text-slate-200 antialiased">
      {/* Structural Column 1: Left Navigation panel */}
      <Sidebar />

      {/* Structural Column 2: App Data & Control Feed */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Dynamic Upper Controls */}
        <Header />

        {/* Telemetry Stream View Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0A0F1D]">
          {/* React Router will inject your Dashboard, Stations, etc. here automatically */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}