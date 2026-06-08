import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { hourlyProduction, dailyProduction, monthlyProduction } from "../data/mockData";
import { TrendingUp } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0a1828",
        border: "1px solid rgba(14,165,233,0.2)",
        borderRadius: 4,
        padding: "6px 10px",
      }}
    >
      <p style={{ fontSize: 10, color: "#4d7a9e", marginBottom: 2 }}>{label}</p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: p.color,
          }}
        >
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

function StatCard({ label, value, unit, sub, color }) {
  return (
    <div
      className="rounded p-3"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        style={{
          fontSize: 9,
          color: "var(--muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div className="flex items-end gap-1">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 24,
            fontWeight: 700,
            color: color || "var(--foreground)",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginBottom: 2 }}>
          {unit}
        </span>
      </div>
      {sub && (
        <div
          style={{
            fontSize: 10,
            color: "#22c55e",
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <TrendingUp size={9} />
          {sub}
        </div>
      )}
    </div>
  );
}

function ChartPanel({ title, meta, children }) {
  return (
    <div
      className="rounded p-3"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {title}
        </span>
        {meta && (
          <span
            style={{
              fontSize: 9,
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {meta}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

const annualData = [
  { month: "Jan", actual: 128400, target: 130200 },
  { month: "Feb", actual: 116800, target: 118000 },
  { month: "Mar", actual: 131200, target: 130200 },
  { month: "Apr", actual: 127600, target: 130200 },
  { month: "May", actual: 133400, target: 130200 },
  { month: "Jun", actual: 88200, target: 78120 },
];

export function ProductionMonitoring() {
  const currentFlow = hourlyProduction[hourlyProduction.length - 1]?.flow || 176;
  const dailyTotal = hourlyProduction.reduce((s, h) => s + h.flow, 0);

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      {/* KPI row */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        <StatCard label="Current Flow" value={currentFlow.toString()} unit="m³/hr" sub="+2.1% vs avg" color="#0ea5e9" />
        <StatCard label="Today's Output" value={dailyTotal.toLocaleString()} unit="m³" sub="96.2% of target" color="#06b6d4" />
        <StatCard label="Weekly Output" value="28,640" unit="m³" sub="+1.4% vs last wk" color="#14b8a6" />
        <StatCard label="Monthly Output" value="88,200" unit="m³" sub="67.7% of month target" color="#22c55e" />
        <StatCard label="Annual Output" value="725.6k" unit="m³" sub="On track" color="#a78bfa" />
        <StatCard label="Efficiency" value="96.4" unit="%" sub="+0.8% MoM" color="#22c55e" />
      </div>

      {/* Hourly flow */}
      <ChartPanel title="Hourly Flow Rate — Today" meta="m³/hr · Real-time">
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={hourlyProduction} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} domain={[130, 220]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={175} stroke="#4d7a9e" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Target", position: "right", fontSize: 9, fill: "#4d7a9e" }} />
            <Area type="monotone" dataKey="flow" stroke="#0ea5e9" strokeWidth={2} fill="url(#flowGrad)" name="Flow Rate" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Daily production vs target */}
        <ChartPanel title="Daily Production vs Target" meta="m³ · This Week">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={dailyProduction} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000).toFixed(1) + "k"} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="actual" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Actual (m³)" />
              <ReferenceLine y={4200} stroke="#4d7a9e" strokeDasharray="4 3" strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Monthly production trend */}
        <ChartPanel title="Monthly Production Trend" meta="m³ · 2026 YTD">
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={annualData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000).toFixed(0) + "k"} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="actual" stroke="#14b8a6" strokeWidth={2} fill="url(#monthGrad)" name="Actual (m³)" />
              <Line type="monotone" dataKey="target" stroke="#4d7a9e" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Target (m³)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* Production targets table */}
      <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 10,
          }}
        >
          Production Targets
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Period", "Target (m³)", "Actual (m³)", "Variance", "Efficiency", "Status"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "6px 10px",
                    textAlign: "left",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "var(--muted-foreground)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { period: "Today", target: "4,200", actual: "4,224", variance: "+24", eff: "100.6%", ok: true },
              { period: "This Week", target: "29,400", actual: "28,640", variance: "-760", eff: "97.4%", ok: true },
              { period: "This Month", target: "130,200", actual: "88,200", variance: "On track", eff: "67.7%", ok: true },
              { period: "This Year", target: "1,562,400", actual: "725,600", variance: "On track", eff: "92.8%", ok: true },
            ].map((r, i) => (
              <tr key={r.period} style={{ background: i % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                <td style={{ padding: "7px 10px", fontSize: 11, fontWeight: 500, color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                  {r.period}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                  {r.target}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>
                  {r.actual}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: r.variance.startsWith("+") ? "#22c55e" : r.variance.startsWith("-") ? "#ef4444" : "#0ea5e9", borderBottom: "1px solid var(--border)" }}>
                  {r.variance}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#22c55e", borderBottom: "1px solid var(--border)" }}>
                  {r.eff}
                </td>
                <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: "#22c55e", background: "rgba(34,197,94,0.1)", borderRadius: 3, padding: "1px 6px" }}>
                    ON TRACK
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}