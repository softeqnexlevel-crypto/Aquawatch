import { TICKER } from "../data";
import '../app.css'
export default function LiveTicker() {
  // Map parameters to exact Tailwind colors and glow rings based on structural health
  const alertTheme = {
    Normal: "bg-emerald-400 text-emerald-400 shadow-emerald-500/40",
    Warning: "bg-amber-400 text-amber-400 shadow-amber-500/40 animate-pulse",
    Critical: "bg-red-500 text-red-400 shadow-red-500/40 animate-ping"
  };

  return (
    <div className="w-full bg-[#0A0F1D] border-y border-slate-800/60 py-2.5 overflow-hidden relative select-none">
      
      {/* Visual Ambient Fading Masks (Fades items smoothly at the left/right screen edges) */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-[#0A0F1D] via-transparent to-[#0A0F1D] opacity-100" />

      {/* Infinite Horizontal Animation Track Wrapper */}
      <div className="flex w-max items-center gap-8 animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
        
        {/* Render data arrays duplicated back-to-back to enable loop tiling matches */}
        {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => {
          const currentClass = alertTheme[t.status || "Normal"];
          
          return (
            <div 
              key={i} 
              className="flex items-center gap-2 text-xs font-medium border-r border-slate-800/80 pr-8 last:border-0 shrink-0 tracking-wide"
            >
              {/* Telemetry Status Indicator Node */}
              <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)] ${currentClass.split(' ')[0]} ${currentClass.includes('animate-') ? currentClass.split(' ').slice(2).join(' ') : ''}`} />
              
              {/* Data String Metrics labels */}
              <span className="text-slate-400 font-semibold">{t.label}:</span>
              
              {/* Numeric Stream Monitoring string */}
              <span className={`font-mono font-bold ${currentClass.split(' ')[1]}`}>
                {t.val}
              </span>
              
              {t.unit && (
                <span className="text-[10px] font-sans font-medium text-slate-600 uppercase ml-0.5">
                  {t.unit}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}