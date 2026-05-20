import { FEATURES } from "../data";

export default function Features() {
  return (
    <section id="features" className="w-full bg-[#0A0F1D] text-slate-200 py-10 md:py-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Component Header Block */}
        <div className="flex flex-col items-start text-left space-y-4 mb-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Platform capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for water engineers
          </h2>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Everything you need to achieve WHO compliance and protect your distribution network.
          </p>
        </div>

        {/* Feature Grid Framework */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <div 
              key={i} 
              className="group relative flex flex-col items-start text-left p-6 rounded-xl bg-[#0E1626] border border-slate-800/80 hover:border-slate-700 transition-all duration-300 shadow-xl shadow-black/20 hover:-translate-y-1"
            >
              {/* Dynamic Accent Ambient Glow behind Icon on Hover */}
              <div 
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-xl"
                style={{
                  background: `radial-gradient(circle at 20% 20%, ${f.accent || '#5A1FFF'}15, transparent 50%)`
                }}
              />

              {/* Functional Icon Container */}
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300 mb-5 shadow-sm"
                style={{ 
                  backgroundColor: `${f.accent || '#5A1FFF'}10`, 
                  borderColor: `${f.accent || '#5A1FFF'}30`,
                  color: f.accent || '#5A1FFF'
                }}
              >
                <i className={`ti ${f.icon} text-xl font-semibold`} />
              </div>

              {/* Copy Titles */}
              <h3 className="text-lg font-bold text-white tracking-tight mb-2 group-hover:text-blue-400 transition-colors duration-200">
                {f.title}
              </h3>
              <p className="text-sm text-slate-400 font-normal leading-relaxed flex-1">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}