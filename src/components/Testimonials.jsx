import { TESTIMONIALS } from "../data";

export default function Testimonials() {
  return (
    <section className="w-full bg-[#0A0F1D] text-slate-200 py-12 md:py-20 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-start text-left space-y-4 mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Trusted by water utilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            What engineers say
          </h2>
        </div>

        {/* Testimonials Responsive Grid Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {TESTIMONIALS.map((t, i) => (
            <div 
              key={i} 
              className="group relative flex flex-col justify-between p-6 rounded-2xl bg-[#0E1626] border border-slate-800/80 hover:border-slate-700 transition-all duration-300 shadow-xl shadow-black/20 text-left hover:-translate-y-1"
            >
              {/* Background Accent Decorative Quote Icon */}
              <div className="absolute top-4 right-6 text-slate-800/40 text-4xl pointer-events-none select-none">
                <i className="ti ti-quote" />
              </div>

              {/* Quote Description Text Copy */}
              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed italic relative z-10 mb-6">
                "{t.text}"
              </p>

              {/* Author Attribution Meta Block */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800/40">
                
                {/* Responsive Avatar Container */}
                <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 overflow-hidden">
                  {t.avatar && t.avatar.length <= 3 ? (
                    <span>{t.avatar}</span>
                  ) : (
                    <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" />
                  )}
                </div>

                {/* Name & Technical Professional Roles */}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white tracking-tight truncate">
                    {t.name}
                  </div>
                  <div className="text-xs font-medium text-slate-500 truncate mt-0.5">
                    {t.role}
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}