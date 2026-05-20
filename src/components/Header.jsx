export default function Header() {
  return (
    <header className="h-16 border-b border-slate-800 bg-[#0E1626]/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      {/* Real-time System Connectivity State */}
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-white tracking-wide uppercase">System Monitor</h1>
        <div className="flex items-center gap-2 rounded-full bg-teal-500/10 border border-teal-500/20 px-3 py-0.5 text-xs text-teal-400">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"></span>
          8/9 Stations Normal
        </div>
      </div>

      {/* Global Action Tools (Replaced "Start Free") */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
          <i className="ti ti-download"></i>
          Export Logs
        </button>
        
        <button className="flex items-center gap-2 rounded-lg bg-[#SALFFF] px-3 py-1.5 text-xs font-semibold text-[#0A0F1D] hover:bg-[#SALFFF]/90 transition-all shadow-sm shadow-[#SALFFF]/10">
          <i className="ti ti-plus"></i>
          Add Machine
        </button>
      </div>
    </header>
  );
}