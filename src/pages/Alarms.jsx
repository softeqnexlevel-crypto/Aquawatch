export default function Alarms() {
  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold text-white mb-8">Active Alarms & Notifications</h1>

      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-400 font-semibold">CRITICAL</p>
              <h3 className="text-xl font-bold mt-1">High Differential Pressure - Prefilter</h3>
              <p className="text-slate-300 mt-2">STN-03 • 1.45 bar (Threshold: 1.2 bar)</p>
            </div>
            <span className="text-sm text-slate-400">8 minutes ago</span>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-400 font-semibold">WARNING</p>
              <h3 className="text-xl font-bold mt-1">Recovery Rate Below Target</h3>
              <p className="text-slate-300 mt-2">STN-03 • Current: 71% (Target ≥ 78%)</p>
            </div>
            <span className="text-sm text-slate-400">47 minutes ago</span>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <p className="text-blue-400 font-semibold">INFO</p>
          <h3 className="text-xl font-bold mt-1">Antiscalant Tank Level Low</h3>
          <p className="text-slate-300 mt-2">25% remaining • Refill recommended</p>
        </div>
      </div>
    </div>
  );
}