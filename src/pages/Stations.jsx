import { useState } from 'react';

export default function Stations() {
  const [selectedStation, setSelectedStation] = useState(null);

  const stations = [
    { id: "STN-01", location: "Borehole 1 - North Zone", status: "Online", ph: 7.8, turbidity: 1.2, recovery: 82, production: 1240, dpPrefilter: 0.65, dpStage1: 0.48, lastUpdate: "2 min ago" },
    { id: "STN-02", location: "Treatment Plant A", status: "Online", ph: 7.3, turbidity: 0.8, recovery: 79, production: 980, dpPrefilter: 0.72, dpStage1: 0.55, lastUpdate: "Just now" },
    { id: "STN-03", location: "Borehole 3 - South Zone", status: "Warning", ph: 6.9, turbidity: 4.5, recovery: 71, production: 650, dpPrefilter: 1.45, dpStage1: 0.92, lastUpdate: "14 min ago" },
    { id: "STN-04", location: "Distribution Point C", status: "Online", ph: 7.5, turbidity: 1.1, recovery: 84, production: 1120, dpPrefilter: 0.58, dpStage1: 0.41, lastUpdate: "5 min ago" },
  ];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-4xl font-bold text-white">Monitoring Stations</h1>

      <div className="bg-[#0E1626] border border-slate-700 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr>
              <th className="p-5 text-left">Station</th>
              <th className="p-5 text-left">Location</th>
              <th className="p-5 text-left">Status</th>
              <th className="p-5 text-left">pH</th>
              <th className="p-5 text-left">Turbidity (NTU)</th>
              <th className="p-5 text-left">Recovery %</th>
              <th className="p-5 text-left">Production (m³)</th>
              <th className="p-5 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {stations.map((station) => (
              <tr key={station.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-5 font-mono text-teal-400 font-semibold">{station.id}</td>
                <td className="p-5 text-slate-300">{station.location}</td>
                <td className="p-5">
                  <span className={`px-4 py-1 rounded-full text-sm font-medium
                    ${station.status === 'Online' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {station.status}
                  </span>
                </td>
                <td className="p-5">{station.ph}</td>
                <td className="p-5">{station.turbidity}</td>
                <td className="p-5 font-semibold text-cyan-400">{station.recovery}%</td>
                <td className="p-5 font-semibold">{station.production}</td>
                <td className="p-5">
                  <button 
                    onClick={() => setSelectedStation(station)}
                    className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-xl text-sm font-medium transition"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Station Detail Modal */}
      {selectedStation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#0E1626] border border-slate-700 rounded-3xl p-8 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">{selectedStation.id} - {selectedStation.location}</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400">Prefilter ΔP</p>
                <p className="text-4xl font-bold text-orange-400">{selectedStation.dpPrefilter} bar</p>
              </div>
              <div>
                <p className="text-slate-400">1st Stage ΔP</p>
                <p className="text-4xl font-bold text-teal-400">{selectedStation.dpStage1} bar</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setSelectedStation(null)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}