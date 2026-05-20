export default function CTA() {
  return (
    <section className="relative w-full bg-[#0A0F1D] text-slate-200 py-16 md:py-24 overflow-hidden border-t border-slate-800/40">
      
      {/* Dynamic Background Spotlight Glow — Powered by Brand Primary Blue */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full bg-[#5A1FFF]/10 blur-[120px] pointer-events-none select-none" />
      
      {/* Decorative Matrix Grid Lines to match Hero aesthetics */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)] opacity-10 pointer-events-none" />

      {/* Main Container Wrapper */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-6 z-10">
        
        {/* Section Context Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-400 uppercase tracking-wider">
          Get started today
        </div>

        {/* Action Header Title */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          Clean water starts with<br />
          <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-teal-400 bg-clip-text text-transparent">
            clear data
          </span>
        </h2>

        {/* Informational Core Copy */}
        <p className="max-w-2xl text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
          Join utilities across Africa and beyond monitoring their networks with AquaWatch. Start free, no credit card required.
        </p>

        {/* Trigger Interactive Action Buttons */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4 pt-3 justify-center">
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30 active:scale-95 group">
            <span>Start monitoring free</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/40 backdrop-blur-sm px-6 py-3.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95">
            Schedule a demo
          </button>
        </div>

        {/* Underlying Operational Assurances Banner */}
        <div className="text-xs text-slate-500 font-medium tracking-wide pt-4 select-none">
          Free plan · No credit card · Up in 5 minutes
        </div>

      </div>
    </section>
  );
}