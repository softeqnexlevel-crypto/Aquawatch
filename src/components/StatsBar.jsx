import { STATS } from "../data";

export default function StatsBar() {
  return (
    <section className="w-full bg-[#0A0F1D] px-4 sm:px-6 lg:px-8 py-6">
      {/* Premium Glassmorphic Container Core */}
      <div className="max-w-7xl mx-auto rounded-2xl bg-[#0E1626]/40 border border-slate-800/80 p-6 backdrop-blur-md shadow-xl shadow-black/30">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-2">
          {STATS.map((s, i) => (
            <div 
              key={i} 
              className="group flex flex-col items-center text-center lg:items-start lg:text-left px-4 relative last:border-0"
            >
              {/* Responsive Vertical Border Dividers between items */}
              {i !== STATS.length - 1 && (
                <div className="hidden lg:block absolute right-0 top-1/4 h-1/2 w-px bg-slate-800/60" />
              )}

              {/* Real-time Telemetry Data Value Display */}
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono transition-colors duration-200 group-hover:text-blue-400">
                {s.val}
              </div>

              {/* Informational Parameter Label */}
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1.5 transition-colors duration-200 group-hover:text-slate-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}