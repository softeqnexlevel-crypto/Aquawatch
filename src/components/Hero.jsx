import HeroChart from "./HeroChart";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] w-full bg-[#0A0F1D] text-slate-200 overflow-hidden flex items-center px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      
      {/* Background Decorative Matrix — Mapped to Canvas Token Tokens */}
      {/* Glow Blob 1 */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      {/* Glow Blob 2 */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />
      {/* Subtle Technical Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Main Structural Responsiveness Container */}
      <div className="relative w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10">
        
        {/* Left Column Feed Content Box (Spans 7 out of 12 grid blocks) */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-left animate-[slideUp_0.6s_ease-out]">
          
          {/* Top Operational Context Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1 text-xs font-medium text-blue-400 tracking-wide uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Water quality intelligence platform
          </div>

          {/* Heading String Block */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Monitor every<br />
            <span className="text-[#5A1FFF] bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              drop
            </span>{" "}
            in your<br />
            water network [cite: 43, 44]
          </h1>

          {/* Core Descriptive Copy */}
          <p className="max-w-xl text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
            AquaWatch gives utilities, municipalities, and engineers real-time visibility into water quality across their entire distribution network[cite: 45].
          </p>

          {/* Core Functional Operational Call to Action Triggers */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4 pt-2">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-900/30 active:scale-95">
              <i className="ti ti-play text-base" /> Start monitoring free
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 backdrop-blur-sm px-6 py-3.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95">
              <i className="ti ti-player-play text-base" /> Watch demo
            </button>
          </div>

          {/* Lower Matrix Metrics Row Indicators */}
          <div className="w-full max-w-xl border-t border-slate-800/80 pt-6 grid grid-cols-3 gap-4 text-left">
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">9/9</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Stations Live [cite: 79]</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-400 tracking-tight">&lt; 30s</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Refresh Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500 tracking-tight">3</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Active Alarms [cite: 267]</p>
            </div>
          </div>

        </div>

        {/* Right Column Engine Panel Area (Spans 5 out of 12 grid blocks) */}
        <div className="lg:col-span-5 w-full flex items-center justify-center animate-[fadeIn_0.8s_ease-out]">
          <div className="w-full bg-[#0E1626]/40 border border-slate-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-xl shadow-black/40">
            <HeroChart />
          </div>
        </div>

      </div>
    </section>
  );
}