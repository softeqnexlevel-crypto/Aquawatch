export default function TagRules() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-4xl font-bold text-white">Tag Rules & Alerts</h1>
      <p className="text-slate-400">Configure automated rules and thresholds for your water quality parameters.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Active Rules</h3>
          <div className="space-y-4">
            {[
              "pH < 6.5 or > 8.5 → Critical Alarm",
              "Turbidity > 5 NTU → High Priority",
              "Recovery Rate < 75% → Warning",
              "Antiscalant Low Level → Refill Alert",
              "ΔP Prefilter > 1.2 bar → Backwash Required"
            ].map((rule, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl">
                <p className="text-slate-300">{rule}</p>
                <span className="text-green-400 text-sm">Active</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Add New Rule</h3>
          <div className="space-y-4 text-sm">
            <input type="text" placeholder="Rule Name" className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3" />
            <select className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3">
              <option>Parameter</option>
              <option>pH</option>
              <option>Turbidity</option>
              <option>Recovery Rate</option>
              <option>Differential Pressure</option>
            </select>
            <button className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-semibold">
              Create Rule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}