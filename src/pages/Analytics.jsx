export default function Analytics() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-4xl font-bold text-white">Analytics & Insights</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-8 h-96 flex items-center justify-center">
          <p className="text-slate-500">Monthly Trend Charts (Production, Recovery, Quality) will go here</p>
        </div>
        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-8 h-96 flex items-center justify-center">
          <p className="text-slate-500">Predictive Analysis & AI Insights</p>
        </div>
      </div>

      <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Key Performance Indicators (Last 30 Days)</h3>
        <div className="grid grid-cols-4 gap-6 text-center">
          <div><p className="text-4xl font-bold text-teal-400">79.8%</p><p className="text-sm text-slate-400">Avg Recovery</p></div>
          <div><p className="text-4xl font-bold text-blue-400">68,450 m³</p><p className="text-sm text-slate-400">Total Production</p></div>
          <div><p className="text-4xl font-bold text-amber-400">412 L</p><p className="text-sm text-slate-400">Antiscalant Used</p></div>
          <div><p className="text-4xl font-bold text-red-400">7</p><p className="text-sm text-slate-400">Critical Alarms</p></div>
        </div>
      </div>
    </div>
  );
}