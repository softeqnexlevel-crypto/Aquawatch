export default function Footer() {
  return (
    <footer className="w-full bg-[#0A0F1D] border-t border-slate-800/60 py-4 px-6 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Brand Identity & Active Git/Build Version */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white shadow-sm shadow-blue-900/20">
            <i className="ti ti-droplet text-xs font-bold" />
          </div>
          <span className="font-semibold text-sm text-white tracking-wide">AquaWatch</span>
          <span className="text-[10px] bg-slate-900 text-slate-500 font-mono border border-slate-800 px-1.5 py-0.5 rounded">
            v1.0.4-stable
          </span>
        </div>

        {/* Middle: Standard Documentation & Support Anchors */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          {["Docs", "API Reference", "System Status", "Support Desk"].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase().replace(" ", "-")}`} 
              className="text-xs text-slate-400 hover:text-blue-400 transition-colors duration-150"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right Side: Compliance Indicators, Connection Ping & Copyright */}
        <div className="flex flex-wrap items-center justify-end gap-4 text-xs">
          
          {/* WHO Water Quality Guidelines Target Compliance Stamp */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-500 border-r border-slate-800 pr-4">
            <i className="ti ti-shield-check text-emerald-400 text-sm" />
            <span className="text-[10px] font-medium tracking-wide uppercase">WHO Compliant</span>
          </div>

          {/* Real-Time Database Stream Latency Counter */}
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/60 border border-slate-800/80 px-2 py-0.5 rounded font-mono text-[10px]">
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
            <span>ping: 42ms</span>
          </div>

          {/* Legal Copyright String */}
          <div className="text-[11px] font-medium text-slate-500 tracking-wide">
            © 2026 AquaWatch
          </div>

        </div>

      </div>
    </footer>
  );
}