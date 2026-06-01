import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const performanceData = [
  { day: 'Mon', recovery: 78, production: 2450, antiscalant: 12.4 },
  { day: 'Tue', recovery: 81, production: 2680, antiscalant: 13.1 },
  { day: 'Wed', recovery: 76, production: 2390, antiscalant: 11.8 },
  { day: 'Thu', recovery: 83, production: 2750, antiscalant: 13.5 },
  { day: 'Fri', recovery: 79, production: 2580, antiscalant: 12.7 },
  { day: 'Sat', recovery: 82, production: 2690, antiscalant: 13.0 },
  { day: 'Sun', recovery: 80, production: 2520, antiscalant: 12.5 },
];

const monthlyData = [
  { month: 'Jan', recovery: 79, production: 72000, antiscalant: 380 },
  { month: 'Feb', recovery: 81, production: 76500, antiscalant: 395 },
  { month: 'Mar', recovery: 77, production: 69800, antiscalant: 365 },
  { month: 'Apr', recovery: 83, production: 81200, antiscalant: 420 },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-8 bg-[#0A0F1D] min-h-screen text-slate-200">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white">System Overview</h1>
        <div className="text-sm text-slate-400">Last Updated: Just now</div>
      </div>

      {/* Key Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
          <p className="text-slate-400">System Recovery Rate</p>
          <p className="text-5xl font-bold text-teal-400 mt-3">81.4%</p>
          <p className="text-green-400 text-sm mt-2">↑ 2.3% from yesterday</p>
        </div>

        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
          <p className="text-slate-400">Total Production Today</p>
          <p className="text-5xl font-bold text-white mt-3">2,680 m³</p>
          <p className="text-slate-400 text-sm mt-2">Borehole 3 • 1,240 m³</p>
        </div>

        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
          <p className="text-slate-400">Antiscalant Consumption</p>
          <p className="text-5xl font-bold text-amber-400 mt-3">13.1 L</p>
          <p className="text-slate-400 text-sm mt-2">Today • 395 L this month</p>
        </div>

        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
          <p className="text-slate-400">System Runtime</p>
          <p className="text-5xl font-bold text-white mt-3">142 hrs</p>
          <p className="text-red-400 text-sm mt-2">Maintenance due in 18 hrs</p>
        </div>
      </div>

      {/* Performance Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Performance */}
        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Daily System Performance</h3>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="recovery" stroke="#14b8a6" strokeWidth={3} name="Recovery %" />
              <Line type="monotone" dataKey="production" stroke="#3b82f6" strokeWidth={3} name="Production (m³)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recovery Rate Trend */}
        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">System Recovery Rate Trend (%)</h3>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis domain={[70, 90]} stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="recovery" stroke="#22d3ee" strokeWidth={4} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Antiscalant & Differential Pressure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Antiscalant Consumption & Dosing</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="antiscalant" fill="#f59e0b" radius={8} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            <div>
              <p className="text-2xl font-bold text-amber-400">13.1 L</p>
              <p className="text-xs text-slate-400">Today</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">395 L</p>
              <p className="text-xs text-slate-400">This Month</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">4,820 L</p>
              <p className="text-xs text-slate-400">Projected Yearly</p>
            </div>
          </div>
        </div>

        {/* Differential Pressure */}
        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Differential Pressure</h3>
          <div className="space-y-6 mt-8">
            <div>
              <p className="text-sm text-slate-400">Prefilter ΔP</p>
              <div className="flex items-center gap-3">
                <div className="h-3 flex-1 bg-slate-700 rounded">
                  <div className="h-3 w-[65%] bg-orange-500 rounded"></div>
                </div>
                <span className="font-mono text-orange-400">0.68 bar</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">1st Stage ΔP</p>
              <div className="flex items-center gap-3">
                <div className="h-3 flex-1 bg-slate-700 rounded">
                  <div className="h-3 w-[42%] bg-teal-500 rounded"></div>
                </div>
                <span className="font-mono text-teal-400">0.45 bar</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">2nd Stage ΔP</p>
              <div className="flex items-center gap-3">
                <div className="h-3 flex-1 bg-slate-700 rounded">
                  <div className="h-3 w-[28%] bg-blue-500 rounded"></div>
                </div>
                <span className="font-mono text-blue-400">0.31 bar</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Borehole & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Borehole Production</h3>
          <div className="text-6xl font-bold text-white">1,240 m³</div>
          <p className="text-teal-400">Borehole #3 • Active</p>
          <p className="text-sm text-slate-400 mt-8">Daily Average: 1,180 m³</p>
        </div>

        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">System Runtime</h3>
          <div className="text-6xl font-bold text-white">142 hrs</div>
          <p className="text-slate-400">This Month</p>
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-red-400">Next Maintenance in 18 hours</p>
          </div>
        </div>

        <div className="bg-[#0E1626] border border-slate-700 rounded-2xl p-6 flex flex-col justify-center">
          <h3 className="font-semibold">Current Recovery Rate</h3>
          <div className="text-7xl font-bold text-cyan-400 my-4">81.4%</div>
          <p className="text-sm text-slate-400">Target: 78–85%</p>
        </div>
      </div>
    </div>
  );
}