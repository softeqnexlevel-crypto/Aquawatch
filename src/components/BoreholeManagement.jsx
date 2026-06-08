import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { boreholes, monthlyProduction } from "../data/mockData";
import { MapPin, ChevronRight, Activity, Clock, Wrench, Droplet } from "lucide-react";

const StatusBadge = ({ status }) => {
  const cfg = {
    Active: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", dot: "#22c55e" },
    Maintenance: { bg: "rgba(234,179,8,0.1)", color: "#eab308", dot: "#eab308" },
    Standby: { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9", dot: "#0ea5e9" },
    Offline: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", dot: "#ef4444" },
  }[status] || { bg: "rgba(77,122,158,0.1)", color: "#4d7a9e", dot: "#4d7a9e" };

  return (
    <span className="flex items-center gap-1 rounded px-1.5 py-0.5" style={{ background: cfg.bg }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      <span style={{ fontSize: 10, color: cfg.color, fontWeight: 500 }}>{status}</span>
    </span>
  );
};

const HealthBar = ({ value }) => {
  const color = value >= 80 ? "#22c55e" : value >= 60 ? "#eab308" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 60, height: 4, background: "var(--secondary)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color, minWidth: 28 }}>{value}%</span>
    </div>
  );
};

const boreholeHistory = [
  { month: "Jan", prod: 31200 },
  { month: "Feb", prod: 28800 },
  { month: "Mar", prod: 32400 },
  { month: "Apr", prod: 30600 },
  { month: "May", prod: 33600 },
  { month: "Jun", prod: 21600 },
];

export function BoreholeManagement() {
  const [selected, setSelected] = useState(boreholes[0]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#0a1828", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 4, padding: "6px 10px" }}>
        <p style={{ fontSize: 10, color: "#4d7a9e" }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: p.color }}>
            {p.value?.toLocaleString()} m³
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Table panel */}
      <div className="flex flex-col flex-1 min-w-0 overflow-auto p-4" style={{ scrollbarWidth: "none" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Borehole Overview · {boreholes.length} Assets
          </h2>
          <div className="flex gap-2">
            {["All", "Active", "Maintenance", "Standby"].map(f => (
              <button 
                key={f} 
                className="px-2 py-1 rounded text-xs" 
                style={{ 
                  background: "var(--secondary)", 
                  color: "var(--muted-foreground)", 
                  border: "1px solid var(--border)", 
                  fontSize: 10 
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded overflow-hidden" style={{ border: "1px solid var(--border)", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--muted)" }}>
                {["ID", "Name", "Location", "Status", "Flow Rate", "Daily (m³)", "Monthly (m³)", "Runtime", "Health", ""].map(h => (
                  <th 
                    key={h} 
                    style={{ 
                      padding: "8px 10px", 
                      textAlign: "left", 
                      fontSize: 9, 
                      fontWeight: 600, 
                      color: "var(--muted-foreground)", 
                      letterSpacing: "0.08em", 
                      textTransform: "uppercase", 
                      whiteSpace: "nowrap", 
                      borderBottom: "1px solid var(--border)" 
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {boreholes.map((b, i) => (
                <tr
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="cursor-pointer transition-colors"
                  style={{
                    background: selected.id === b.id ? "rgba(14,165,233,0.06)" : i % 2 === 0 ? "var(--card)" : "var(--muted)",
                    borderLeft: selected.id === b.id ? "2px solid #0ea5e9" : "2px solid transparent",
                  }}
                >
                  <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#0ea5e9", borderBottom: "1px solid var(--border)" }}>
                    {b.id}
                  </td>
                  <td style={{ padding: "7px 10px", fontSize: 11, color: "var(--foreground)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>
                    {b.name}
                  </td>
                  <td style={{ padding: "7px 10px", fontSize: 10, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-1">
                      <MapPin size={9} />{b.location}
                    </div>
                  </td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)" }}>
                    <StatusBadge status={b.status} />
                  </td>
                  <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: b.flowRate > 0 ? "var(--foreground)" : "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                    {b.flowRate > 0 ? `${b.flowRate} m³/hr` : "—"}
                  </td>
                  <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                    {b.dailyProd > 0 ? b.dailyProd.toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                    {b.monthlyProd.toLocaleString()}
                  </td>
                  <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                    {b.runtimeHours > 0 ? `${b.runtimeHours}h` : "—"}
                  </td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)" }}>
                    <HealthBar value={b.health} />
                  </td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)" }}>
                    <ChevronRight size={12} style={{ color: "var(--muted-foreground)" }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Production comparison chart */}
        <div className="rounded p-3 mt-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Monthly Production Comparison
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={boreholes.filter(b => b.monthlyProd > 0)} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis dataKey="id" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={v => (v / 1000).toFixed(0) + "k"} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="monthlyProd" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Monthly m³" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail panel */}
      <div 
        className="flex flex-col overflow-auto p-4 gap-4" 
        style={{ width: 280, background: "var(--muted)", borderLeft: "1px solid var(--border)", scrollbarWidth: "none", flexShrink: 0 }}
      >
        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "#0ea5e9" }}>
              {selected.id}
            </span>
            <StatusBadge status={selected.status} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 2 }}>
            {selected.name}
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
            <MapPin size={9} />{selected.location}
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {[
            { label: "Flow Rate", value: selected.flowRate > 0 ? `${selected.flowRate} m³/hr` : "—", icon: Activity },
            { label: "Runtime", value: `${selected.runtimeHours}h`, icon: Clock },
            { label: "Daily Output", value: selected.dailyProd > 0 ? `${selected.dailyProd.toLocaleString()} m³` : "—", icon: Droplet },
            { label: "Health Score", value: `${selected.health}%`, icon: Activity },
          ].map(m => (
            <div key={m.label} className="rounded p-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, color: "var(--muted-foreground)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {m.label}
              </div>
              <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Production history mini chart */}
        <div className="rounded p-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Production History
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={boreholeHistory} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 8, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fontSize: 8, fill: "#4d7a9e" }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={v => (v / 1000).toFixed(0) + "k"} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="prod" 
                stroke="#06b6d4" 
                strokeWidth={1.5} 
                dot={{ r: 2, fill: "#06b6d4" }} 
                name="Production" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Maintenance info */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Maintenance
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Last Service</span>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                {selected.lastMaintenance}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Next Due</span>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#eab308" }}>
                {selected.nextMaintenance}
              </span>
            </div>
          </div>
        </div>

        {/* Water quality summary */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Water Quality
          </div>
          {[
            { param: "pH", value: "7.2", unit: "", status: "Normal" },
            { param: "TDS", value: "842", unit: "mg/L", status: "Normal" },
            { param: "Turbidity", value: "0.4", unit: "NTU", status: "Normal" },
            { param: "Hardness", value: "280", unit: "mg/L", status: "Normal" },
          ].map(q => (
            <div key={q.param} className="flex items-center justify-between py-1" style={{ borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{q.param}</span>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                  {q.value} {q.unit}
                </span>
                <span style={{ fontSize: 8, color: "#22c55e", background: "rgba(34,197,94,0.1)", borderRadius: 2, padding: "0 4px" }}>
                  {q.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}