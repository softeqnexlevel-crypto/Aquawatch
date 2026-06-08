import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { filterPressureData } from "../data/mockData";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1828", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 4, padding: "6px 10px" }}>
      <p style={{ fontSize: 10, color: "#4d7a9e", marginBottom: 2 }}>{label}</p>
      {payload.map((p, idx) => (
        <p key={idx} style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: p.color }}>{p.name}: {p.value?.toFixed(3)} bar</p>
      ))}
    </div>
  );
};

function PressureGauge({ value, warning, critical, label, filterNum }) {
  const pct = Math.min((value / critical) * 100, 100);
  const color = value >= critical ? "#ef4444" : value >= warning ? "#eab308" : "#22c55e";
  const status = value >= critical ? "CRITICAL" : value >= warning ? "WARNING" : "NORMAL";
  const StatusIcon = value >= critical ? AlertTriangle : value >= warning ? AlertCircle : CheckCircle;

  const segments = [
    { end: (warning / critical) * 100, color: "#22c55e" },
    { end: 100, color: "#ef4444" },
  ];

  return (
    <div className="rounded p-4 flex flex-col gap-4" style={{ background: "var(--card)", border: `1px solid ${color}30` }}>
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Filter {filterNum}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{label}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded px-2 py-1" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
          <StatusIcon size={12} style={{ color }} />
          <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.06em" }}>{status}</span>
        </div>
      </div>

      {/* Pressure value */}
      <div className="flex items-end gap-2">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 42, fontWeight: 700, color, lineHeight: 1 }}>{value.toFixed(3)}</span>
        <span style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 4 }}>bar</span>
      </div>

      {/* Bar gauge */}
      <div>
        <div style={{ height: 10, background: "var(--secondary)", borderRadius: 5, overflow: "hidden", position: "relative" }}>
          <div style={{
            width: `${(warning / critical) * 100}%`, height: "100%",
            background: "linear-gradient(to right, #22c55e, #eab308)",
            position: "absolute", top: 0, left: 0
          }} />
          <div style={{
            width: `${Math.max(0, pct - (warning / critical) * 100)}%`, height: "100%",
            background: "#ef4444",
            position: "absolute", top: 0, left: `${(warning / critical) * 100}%`
          }} />
          {/* Current marker */}
          <div style={{
            position: "absolute", top: -2, bottom: -2,
            left: `${pct}%`, width: 3, background: "#fff",
            borderRadius: 2, transform: "translateX(-50%)", boxShadow: `0 0 6px ${color}`
          }} />
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 8, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>0.00</span>
          <span style={{ fontSize: 8, color: "#eab308", fontFamily: "var(--font-mono)" }}>⚠ {warning.toFixed(2)}</span>
          <span style={{ fontSize: 8, color: "#ef4444", fontFamily: "var(--font-mono)" }}>🔴 {critical.toFixed(2)}</span>
        </div>
      </div>

      {/* Thresholds */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {[
          { label: "Warning Threshold", value: `${warning.toFixed(2)} bar`, color: "#eab308" },
          { label: "Critical Threshold", value: `${critical.toFixed(2)} bar`, color: "#ef4444" },
          { label: "Operating Since", value: "04:00 today", color: "var(--muted-foreground)" },
          { label: "Last Backwash", value: "2026-06-05 22:00", color: "var(--muted-foreground)" },
        ].map((m, idx) => (
          <div key={idx} className="rounded p-2" style={{ background: "var(--muted)" }}>
            <div style={{ fontSize: 8, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: m.color, fontWeight: 600, marginTop: 2 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Health score */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Filter Health Score</span>
        <div className="flex items-center gap-2">
          <div style={{ width: 80, height: 4, background: "var(--secondary)", borderRadius: 2 }}>
            <div style={{ width: `${100 - pct}%`, height: "100%", background: color, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color, fontWeight: 600 }}>{Math.round(100 - pct)}%</span>
        </div>
      </div>
    </div>
  );
}

export function FiltrationMonitoring() {
  const latestF1 = filterPressureData[filterPressureData.length - 1]?.filter1 || 0;
  const latestF2 = filterPressureData[filterPressureData.length - 1]?.filter2 || 0;
  const recent48 = filterPressureData.slice(-24);

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Pre-Filter Differential Pressure Monitoring
      </div>

      {/* Gauges */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <PressureGauge value={latestF1} warning={0.50} critical={0.65} label="Prefilter Unit 1" filterNum={1} />
        <PressureGauge value={latestF2} warning={0.50} critical={0.65} label="Prefilter Unit 2" filterNum={2} />
      </div>

      {/* Pressure trend chart */}
      <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Differential Pressure Trend — 24hrs</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 16, height: 2, background: "#0ea5e9", borderRadius: 1 }} />
              <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>Filter 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 16, height: 2, background: "#14b8a6", borderRadius: 1 }} />
              <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>Filter 2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 16, height: 1, borderTop: "1px dashed #eab308" }} />
              <span style={{ fontSize: 9, color: "#eab308" }}>Warning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 16, height: 1, borderTop: "1px dashed #ef4444" }} />
              <span style={{ fontSize: 9, color: "#ef4444" }}>Critical</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={recent48} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} interval={5} />
            <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={v => v.toFixed(2)} domain={[0, 0.8]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0.50} stroke="#eab308" strokeDasharray="4 3" strokeWidth={1} />
            <ReferenceLine y={0.65} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
            <Line type="monotone" dataKey="filter1" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Filter 1" />
            <Line type="monotone" dataKey="filter2" stroke="#14b8a6" strokeWidth={2} dot={false} name="Filter 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Filter log table */}
      <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Recent Filter Events</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Timestamp", "Filter", "Event", "dP Before", "dP After", "Duration", "Operator"].map((h, idx) => (
                <th key={idx} style={{ padding: "6px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { time: "2026-06-05 22:00", filter: "Filter 1", event: "Backwash", before: "0.62 bar", after: "0.21 bar", dur: "18 min", op: "P. Ochieng" },
              { time: "2026-06-05 20:45", filter: "Filter 2", event: "Backwash", before: "0.55 bar", after: "0.18 bar", dur: "16 min", op: "P. Ochieng" },
              { time: "2026-06-04 14:30", filter: "Filter 1", event: "Backwash", before: "0.58 bar", after: "0.20 bar", dur: "17 min", op: "G. Wanjiku" },
              { time: "2026-06-04 10:00", filter: "Filter 2", event: "Inspection", before: "—", after: "—", dur: "45 min", op: "G. Wanjiku" },
            ].map((r, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                <td style={{ padding: "7px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.time}</td>
                <td style={{ padding: "7px 10px", fontSize: 10, color: "var(--foreground)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.filter}</td>
                <td style={{ padding: "7px 10px", fontSize: 10, color: "#0ea5e9", borderBottom: "1px solid var(--border)" }}>{r.event}</td>
                <td style={{ padding: "7px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.before}</td>
                <td style={{ padding: "7px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "#22c55e", borderBottom: "1px solid var(--border)" }}>{r.after}</td>
                <td style={{ padding: "7px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.dur}</td>
                <td style={{ padding: "7px 10px", fontSize: 10, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.op}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}