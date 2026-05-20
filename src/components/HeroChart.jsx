import { useState, useEffect } from "react";

export default function HeroChart() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((p) => p + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const readings = [
    { label: "pH Level", val: (7.1 + (tick % 4) * 0.08).toFixed(2), unit: "", isNormal: true },
    { label: "Chlorine", val: (0.28 + (tick % 3) * 0.04).toFixed(2), unit: "mg/L", isNormal: true },
    { label: "Turbidity", val: tick % 5 === 3 ? "4.21" : "1.38", unit: "NTU", isNormal: tick % 5 !== 3 },
    { label: "Pressure", val: "3.10", unit: "bar", isNormal: true },
  ];

  return (
    <div className="w-full rounded-xl bg-[#0E1626] border border-slate-800 text-slate-200 overflow-hidden shadow-2xl">
      
      {/* Top Bar Window Chassis */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/40 border-b border-slate-800/60">
        {/* Mock MacOS Control Dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        
        {/* Title Center String */}
        <div className="text-xs font-medium text-slate-400 tracking-wide select-none">
          AquaWatch · Live Dashboard
        </div>
        
        {/* Live Alarm Indicator Badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[11px] font-medium text-red-400 animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>3 alarms</span>
        </div>
      </div>

      {/* Main Internal Frame Body */}
      <div className="p-4 sm:p-5 space-y-5 text-left">
        
        {/* KPI Grid Panel Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { v: "9/9", l: "Online", textClass: "text-emerald-400" },
            { v: "3", l: "Alarms", textClass: "text-red-400" },
            { v: "87", l: "Tags", textClass: "text-slate-200" },
            { v: "98.7%", l: "Uptime", textClass: "text-emerald-400" }
          ].map((k, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800/50 rounded-lg p-3 flex flex-col justify-between">
              <div className={`text-xl font-bold tracking-tight ${k.textClass}`}>{k.v}</div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-1">{k.l}</div>
            </div>
          ))}
        </div>

        {/* Live Readings Stream Section */}
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-lg p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800/50">
            Live sensor readings · Intake A
          </div>
          
          {readings.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/20 last:border-0 group transition-colors">
              <div className="flex items-center gap-3">
                {/* Dynamic Running Color Dot */}
                <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${r.isNormal ? "bg-emerald-400 shadow-sm shadow-emerald-500/50" : "bg-amber-400 shadow-sm shadow-amber-500/50 animate-ping"}`} />
                <span className="font-medium text-slate-300">{r.label}</span>
              </div>
              
              {/* Telemetry Metric Values */}
              <div className="flex items-center gap-4">
                <div className="text-right font-mono font-semibold">
                  <span className={`transition-colors duration-300 ${r.isNormal ? "text-emerald-400" : "text-amber-400"}`}>
                    {r.val}
                  </span>
                  {r.unit && <span className="text-xs text-slate-500 font-normal ml-1">{r.unit}</span>}
                </div>
                
                {/* Dynamic Context Component Badges */}
                <span className={`w-16 text-center text-[11px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider transition-all ${
                  r.isNormal 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                }`}>
                  {r.isNormal ? "Normal" : "Warning"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mini Inline SVG Sparkline Section */}
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 px-1">
            <span>pH trend — 24h</span>
            <span className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">7.24 avg</span>
          </div>
          
          <div className="w-full pt-1">
            <svg width="100%" height="50" viewBox="0 0 440 50" preserveAspectRatio="none" className="overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path 
                d="M0,35 C30,30 60,25 90,28 S140,20 175,18 S220,26 255,22 S310,15 345,20 S400,12 440,16" 
                stroke="#3b82f6" 
                strokeWidth="2" 
                fill="none"
              />
              <path 
                d="M0,35 C30,30 60,25 90,28 S140,20 175,18 S220,26 255,22 S310,15 345,20 S400,12 440,16 L440,50 L0,50Z" 
                fill="url(#chartGradient)"
              />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}