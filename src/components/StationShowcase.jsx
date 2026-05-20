const stations = [
  { 
    name: "Intake A — Nairobi River", 
    type: "Intake", 
    status: "Normal", 
    readings: [
      { key: "pH Level", val: "7.24", unit: "", status: "Normal" },
      { key: "Chlorine", val: "0.31", unit: "mg/L", status: "Normal" },
      { key: "Turbidity", val: "1.38", unit: "NTU", status: "Normal" }
    ] 
  },
  { 
    name: "Treatment Plant 1", 
    type: "Treatment", 
    status: "Warning", 
    readings: [
      { key: "pH Level", val: "6.78", unit: "", status: "Warning" },
      { key: "Chlorine", val: "0.08", unit: "mg/L", status: "Warning" },
      { key: "Turbidity", val: "4.21", unit: "NTU", status: "Normal" }
    ] 
  },
  { 
    name: "Reservoir Westside", 
    type: "Reservoir", 
    status: "Critical", 
    readings: [
      { key: "pH Level", val: "8.92", unit: "", status: "Critical" },
      { key: "Chlorine", val: "0.00", unit: "mg/L", status: "Critical" },
      { key: "Turbidity", val: "0.82", unit: "NTU", status: "Normal" }
    ] 
  },
];

export default function StationShowcase() {
  // Mapping statuses directly to matching Tailwind style schemas
  const statusTheme = {
    Normal: {
      dot: "bg-emerald-400 shadow-emerald-500/50",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      text: "text-emerald-400",
      border: "hover:border-emerald-500/30"
    },
    Warning: {
      dot: "bg-amber-400 shadow-amber-500/50 animate-pulse",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      text: "text-amber-400",
      border: "hover:border-amber-500/30"
    },
    Critical: {
      dot: "bg-red-500 shadow-red-500/50 animate-ping",
      badge: "bg-red-500/10 text-red-400 border-red-500/20",
      text: "text-red-400",
      border: "hover:border-red-500/30"
    }
  };

  return (
    <section id="stations" className="w-full bg-[#0A0F1D] text-slate-200 py-12 md:py-20 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column Section: Content Panel */}
          <div className="lg:col-span-5 flex flex-col items-start text-left space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Station Management
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Every station, every reading,<br />instantly
            </h2>
            
            <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
              Add a station in 60 seconds. Configure thresholds per parameter. Get status at a glance — and drill into full history for any node.
            </p>

            {/* Checklist Operational Features Layout */}
            <div className="w-full space-y-3 pt-2">
              {[
                "Grid, list or interactive map view",
                "Inline threshold editing with WHO presets",
                "Per-station drill-down with 12-month history",
                "Offline heartbeat detection & auto-alert"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <i className="ti ti-check text-xs font-bold" />
                  </div>
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column Section: Interactive Stations Array Feed */}
          <div className="lg:col-span-7 w-full flex flex-col gap-4">
            {stations.map((st, i) => {
              const currentTheme = statusTheme[st.status];
              
              return (
                <div 
                  key={i} 
                  className={`w-full rounded-xl bg-[#0E1626] border border-slate-800/80 p-4 sm:p-5 transition-all duration-300 shadow-lg shadow-black/20 flex flex-col gap-4 ${currentTheme.border} hover:-translate-y-0.5`}
                >
                  {/* Station Block Component Header */}
                  <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800/40">
                    <div className="flex items-center gap-3 text-left">
                      {/* Live Environment Heartbeat Dot */}
                      <div className={`w-2.5 h-2.5 rounded-full shadow-sm shrink-0 ${currentTheme.dot}`} />
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-white tracking-tight leading-none">
                          {st.name}
                        </h3>
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-1.5 inline-block">
                          {st.type}
                        </span>
                      </div>
                    </div>

                    {/* Badge Component Flag */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider select-none ${currentTheme.badge}`}>
                      {st.status}
                    </span>
                  </div>

                  {/* Operational Metrics Core Grid Rows */}
                  <div className="grid grid-cols-3 gap-3">
                    {st.readings.map((r, j) => {
                      const readingTheme = statusTheme[r.status];
                      
                      return (
                        <div key={j} className="bg-slate-900/40 border border-slate-800/40 rounded-lg p-3 text-left">
                          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate mb-1">
                            {r.key}
                          </div>
                          <div className="flex items-baseline gap-0.5 font-mono">
                            <span className={`text-base sm:text-lg font-bold tracking-tight ${readingTheme.text}`}>
                              {r.val}
                            </span>
                            {r.unit && (
                              <span className="text-[10px] text-slate-500 font-sans font-normal ml-0.5">
                                {r.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}