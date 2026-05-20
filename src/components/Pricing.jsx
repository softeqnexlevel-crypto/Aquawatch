import { useState } from "react";
import { PLANS } from "../data";

export default function Pricing() {
  // 1. Interactive State for Billing Cycle Toggle
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="w-full bg-[#0A0F1D] text-slate-200 py-12 md:py-20 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Component Title Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
            Scale from a single pilot station to a city-wide distribution network.
          </p>

          {/* 2. Interactive Toggle Switch Component */}
          <div className="flex items-center gap-3 pt-4 select-none">
            <span className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${!isAnnual ? "text-blue-400" : "text-slate-500"}`}>
              Billed Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 rounded-full bg-slate-800 p-1 transition-colors duration-300 focus:outline-none border border-slate-700 relative"
            >
              <div 
                className={`w-4 h-4 rounded-full bg-blue-500 shadow-md transform transition-transform duration-300 ${isAnnual ? "translate-x-6 bg-teal-400" : "translate-x-0"}`} 
              />
            </button>
            <span className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center gap-1.5 ${isAnnual ? "text-teal-400" : "text-slate-500"}`}>
              Billed Annually
              <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded font-bold uppercase normal-case tracking-normal">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Matrix Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {PLANS.map((plan, i) => {
            // Calculate dynamic values based on interactive toggle switch
            const numericalPrice = parseFloat(plan.price.replace(/[^0-9.]/g, ''));
            const finalPriceDisplay = isAnnual && !isNaN(numericalPrice)
              ? `$${Math.floor((numericalPrice * 12) * 0.8)}` 
              : plan.price;
            
            const finalPeriodDisplay = isAnnual && !isNaN(numericalPrice) ? "/ year" : plan.period;

            return (
              <div 
                key={i} 
                className={`group relative flex flex-col justify-between p-6 rounded-2xl bg-[#0E1626] border transition-all duration-300 shadow-xl text-left ${
                  plan.highlight 
                    ? "border-blue-500/40 shadow-blue-900/10 hover:border-blue-500/80 md:-translate-y-2 hover:-translate-y-3" 
                    : "border-slate-800/80 hover:border-slate-700 hover:-translate-y-1"
                }`}
              >
                {/* Visual Popular Flag Ribbons */}
                {plan.highlight && (
                  <div className="absolute top-0 right-6 transform -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-md">
                    Most popular
                  </div>
                )}

                {/* Upper Frame Identity & Cost Metrics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white tracking-tight">{plan.name}</h3>
                  
                  <div className="flex items-baseline gap-1.5 pb-4 border-b border-slate-800/60">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono transition-all duration-300">
                      {finalPriceDisplay}
                    </span>
                    <span className="text-xs text-slate-500 font-medium tracking-wide">
                      {finalPeriodDisplay}
                    </span>
                  </div>

                  {/* Capabilities Feature Vector Checklists */}
                  <ul className="space-y-2.5 pt-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-normal">
                        <i className={`ti ti-circle-check shrink-0 text-base ${plan.highlight ? "text-blue-400" : "text-emerald-400"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lower Action Form Buttons */}
                <div className="pt-6 mt-6 border-t border-slate-800/40">
                  <button className={`w-full inline-flex items-center justify-center rounded-xl px-4 py-3 text-xs font-semibold tracking-wide transition-all active:scale-95 ${
                    plan.highlight 
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-900/20" 
                      : "bg-slate-900/60 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white"
                  }`}>
                    {plan.cta}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}