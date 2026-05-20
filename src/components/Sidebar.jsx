import { useState } from "react";

export default function Sidebar() {
  // Track which operational module is active
  const [activeTab, setActiveTab] = useState("dashboard");

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "ti-layout-dashboard" },
    { id: "stations", label: "Stations / Machines", icon: "ti-building-factory" },
    { id: "tags", label: "Tag Rules", icon: "ti-tags" },
    { id: "alarms", label: "Alarms", icon: "ti-bell-ringing" },
    { id: "analytics", label: "Analytics", icon: "ti-chart-bar" },
    { id: "billing", label: "Billing", icon: "ti-credit-card" },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0E1626] flex flex-col justify-between p-4 h-screen shrink-0">
      {/* Top Section: Brand Logo & App Modules */}
      <div className="space-y-6">
        {/* Retained Branding from your Landing Page Navbar */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#SALFFF] text-[#0A0F1D]">
            <i className="ti ti-droplet text-lg font-bold"></i>
          </div>
          <span className="font-semibold text-lg tracking-wide text-white">AquaWatch</span>
        </div>

        {/* Management Module Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#SALFFF]/10 text-[#SALFFF]"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <i className={`ti ${item.icon} text-lg`}></i>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Operations Monitor & Profile Context */}
      <div className="border-t border-slate-800 pt-4">
        {/* Machine Status Counter Block */}
        <div className="rounded-lg bg-slate-800/40 p-3 mb-4 border border-slate-700/30">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Current Plan</span>
            <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-400 uppercase tracking-wider">
              Pro Plan
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">9 / 15 Stations Online</p>
        </div>
        
        {/* Logged-in Operator Profile (Replaced "Sign In") */}
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-slate-600">
            EM
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">Workspace Admin</p>
            <p className="text-[10px] text-slate-500 truncate">admin@aquawatch.io</p>
          </div>
        </div>
      </div>
    </aside>
  );
}