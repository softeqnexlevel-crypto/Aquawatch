import {
  AreaChart, Area, LineChart, Line, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { recoveryTrend, recoveryHourly, monthlyProduction } from "../data/mockData";
import { TrendingUp } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1828", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 4, padding: "6px 10px" }}>
      <p style={{ fontSize: 10, color: "#4d7a9e", marginBottom: 2 }}>{label}</p>
      {payload.map((p, idx) => (
        <p key={idx} style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}%
        </p>
      ))}
    </div>
  );
};

function RecoveryGauge({ value, target }) {
  const pct = Math.min(value, 100);
  const angle = (pct / 100) * 180 - 90;
  const color = value >= target ? "#22c55e" : value >= target - 2 ? "#eab308" : "#ef4444";

  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx, cy, r, start, end) => {
    const s = polarToCartesian(cx, cy, r, start);
    const e = polarToCartesian(cx, cy, r, end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const gaugeAngle = -90 + (pct / 100) * 180;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" width="200" height="120">
        {/* Background track */}
        <path d={describeArc(100, 100, 80, -90, 90)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={16} strokeLinecap="round" />
        {/* Zones */}
        <path d={describeArc(100, 100, 80, -90, -10)} fill="none" stroke="#ef444430" strokeWidth={16} />
        <path d={describeArc(100, 100, 80, -10, 15)} fill="none" stroke="#eab30830" strokeWidth={16} />
        <path d={describeArc(100, 100, 80, 15, 90)} fill="none" stroke="#22c55e30" strokeWidth={16} />
        {/* Fill */}
        <path d={describeArc(100, 100, 80, -90, -90 + (pct / 100) * 180)} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" />
        {/* Needle */}
        <line
          x1="100" y1="100"
          x2={100 + 65 * Math.cos(((gaugeAngle - 90) * Math.PI) / 180)}
          y2={100 + 65 * Math.sin(((gaugeAngle - 90) * Math.PI) / 180)}
          stroke="#fff" strokeWidth={2} strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="5" fill={color} />
        {/* Labels */}
        <text x="18" y="108" fontSize="8" fill="#4d7a9e" fontFamily="JetBrains Mono">0%</text>
        <text x="170" y="108" fontSize="8" fill="#4d7a9e" fontFamily="JetBrains Mono">100%</text>
        <text x="92" y="52" fontSize="8" fill="#4d7a9e" fontFamily="JetBrains Mono">50%</text>
        {/* Target marker */}
        <line
          x1={100 + 70 * Math.cos((((-90 + (target / 100) * 180) - 90) * Math.PI) / 180)}
          y1={100 + 70 * Math.sin((((-90 + (target / 100) * 180) - 90) * Math.PI) / 180)}
          x2={100 + 84 * Math.cos((((-90 + (target / 100) * 180) - 90) * Math.PI) / 180)}
          y2={100 + 84 * Math.sin((((-90 + (target / 100) * 180) - 90) * Math.PI) / 180)}
          stroke="#eab308" strokeWidth={2}
        />
      </svg>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 36, fontWeight: 700, color, lineHeight: 1, marginTop: -8 }}>{value.toFixed(1)}%</div>
      <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 4 }}>Target: {target}%</div>
    </div>
  );
}

function MetricCard({ label, value, unit, sub, color }) {
  return (
    <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
      <div className="flex items-end gap-1">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: color || "var(--foreground)", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginBottom: 2 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 10, color: "#22c55e", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><TrendingUp size={9} />{sub}</div>}
    </div>
  );
}

const recoveryVsProd = monthlyProduction.map((m, i) => ({
  month: m.month,
  production: m.actual / 1000,
  recovery: recoveryTrend[i]?.recovery || 78,
}));

export function SystemRecovery() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      {/* Main gauge + metrics */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "auto 1fr" }}>
        <div className="rounded p-4 flex flex-col items-center gap-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Current System Recovery</div>
          <RecoveryGauge value={78.6} target={78} />
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#22c55e" }} />
              <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>Above target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#eab308" }} />
              <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>Near target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#ef4444" }} />
              <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>Below target</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)", alignContent: "start" }}>
          <MetricCard label="Current Recovery" value="78.6" unit="%" color="#22c55e" sub="+0.6% above target" />
          <MetricCard label="Daily Average" value="78.2" unit="%" color="#22c55e" sub="Last 24 hrs" />
          <MetricCard label="Weekly Average" value="77.9" unit="%" color="#0ea5e9" sub="Last 7 days" />
          <MetricCard label="Monthly Average" value="78.6" unit="%" color="#22c55e" sub="June 2026" />
          <MetricCard label="Recovery Target" value="78.0" unit="%" color="#eab308" sub="Operational target" />
          <MetricCard label="Permeate Flow" value="138.2" unit="m³/hr" color="#06b6d4" sub="vs 175 feed flow" />

          {/* Rejection rates */}
          <div className="rounded p-3 col-span-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Salt Rejection Rates</div>
            <div className="flex gap-8">
              {[
                { ion: "TDS", rejection: 96.8 }, { ion: "Chloride", rejection: 97.2 },
                { ion: "Sulfate", rejection: 99.1 }, { ion: "Calcium", rejection: 97.8 },
              ].map((r, idx) => (
                <div key={idx}>
                  <div style={{ fontSize: 9, color: "var(--muted-foreground)", marginBottom: 2 }}>{r.ion}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "#22c55e" }}>{r.rejection}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recovery charts */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Hourly recovery today */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Hourly Recovery — Today</span>
            <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>% · Real-time</span>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={recoveryHourly} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} domain={[72, 84]} tickFormatter={v => v + "%"} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={78} stroke="#eab308" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Target 78%", position: "right", fontSize: 8, fill: "#eab308" }} />
              <Area type="monotone" dataKey="recovery" stroke="#22c55e" strokeWidth={2} fill="url(#recGrad)" name="Recovery" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly trend */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Monthly Recovery Trend</span>
            <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>% · 2026 YTD</span>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={recoveryTrend} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} domain={[74, 82]} tickFormatter={v => v + "%"} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={78} stroke="#eab308" strokeDasharray="4 3" strokeWidth={1} />
              <Line type="monotone" dataKey="recovery" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: "#22c55e" }} name="Recovery %" />
              <Line type="monotone" dataKey="target" stroke="#4d7a9e" strokeWidth={1} strokeDasharray="4 3" dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recovery vs Production */}
      <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Recovery vs Production Correlation</span>
          <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>2026 YTD</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={recoveryVsProd} margin={{ top: 4, right: 40, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={v => v + "k"} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "#22c55e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} domain={[74, 82]} tickFormatter={v => v + "%"} />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="left" dataKey="production" fill="#0ea5e920" name="Production (k m³)" />
            <Line yAxisId="right" type="monotone" dataKey="recovery" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Recovery %" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}