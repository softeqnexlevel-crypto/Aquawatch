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
import { antiscalantMonthly, antiscalantHourly, alerts } from "../data/mockData";
import { AlertTriangle, CheckCircle, FlaskConical } from "lucide-react";

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
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function TankGauge({ level, label }) {
  const color = level > 40 ? "#22c55e" : level > 20 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        style={{
          width: 52,
          height: 100,
          border: `2px solid ${color}40`,
          borderRadius: 4,
          background: "var(--secondary)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${level}%`,
            background: `linear-gradient(to top, ${color}cc, ${color}44)`,
            transition: "height 0.5s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            color: "var(--foreground)",
            zIndex: 1,
          }}
        >
          {level}%
        </div>

        {/* Level lines */}
        {[25, 50, 75].map((l) => (
          <div
            key={l}
            style={{
              position: "absolute",
              bottom: `${l}%`,
              left: 0,
              right: 0,
              height: 1,
              background: "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>

      <span style={{ fontSize: 9, color: "var(--muted-foreground)", textAlign: "center" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 8,
          fontWeight: 600,
          color: color,
          background: `${color}18`,
          borderRadius: 3,
          padding: "1px 6px",
        }}
      >
        {level > 40 ? "OK" : level > 20 ? "LOW" : "CRITICAL"}
      </span>
    </div>
  );
}

function MetricCard({ label, value, unit, color, sub }) {
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
            fontSize: 22,
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
        <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

const chemAlerts = alerts.filter(
  (a) =>
    a.type.includes("Chemical") ||
    a.type.includes("chemical") ||
    a.equipment.includes("Tank")
);

export function AntiscalantDosing() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      {/* Metrics + Tanks */}
      <div className="flex gap-4">
        {/* Metric cards */}
        <div className="flex-1 grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <MetricCard label="Current Dosing Rate" value="2.42" unit="mg/L" color="#a78bfa" sub="Normal: 2.0–3.0 mg/L" />
          <MetricCard label="Daily Consumption" value="4.6" unit="kg" color="#0ea5e9" sub="vs 4.4 kg yesterday" />
          <MetricCard label="Weekly Consumption" value="32.1" unit="kg" color="#06b6d4" sub="On target" />
          <MetricCard label="Monthly Consumption" value="132" unit="kg" color="#14b8a6" sub="vs 198 kg May" />
          <MetricCard label="Chemical Stock" value="368" unit="kg" color="#22c55e" sub="≈ 80 days remaining" />
          <MetricCard label="Dosing Efficiency" value="98.2" unit="%" color="#22c55e" sub="+0.4% vs last month" />
        </div>

        {/* Tank gauges */}
        <div
          className="rounded p-4 flex flex-col gap-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)", minWidth: 200 }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Chemical Tank Levels
          </div>
          <div className="flex justify-around items-start flex-1">
            <TankGauge level={18} label="Tank A (500L)" />
            <TankGauge level={62} label="Tank B (500L)" />
            <TankGauge level={85} label="Reserve (200L)" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {chemAlerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {chemAlerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded p-2.5"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertTriangle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
              <div className="flex-1">
                <span style={{ fontSize: 11, fontWeight: 500, color: "#ef4444" }}>{a.type}</span>
                <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginLeft: 8 }}>
                  {a.equipment} · {a.value} (threshold: {a.threshold})
                </span>
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#ef4444",
                  background: "rgba(239,68,68,0.15)",
                  borderRadius: 3,
                  padding: "1px 6px",
                }}
              >
                {a.severity.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Dosing rate hourly */}
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
              Dosing Rate — Today
            </span>
            <span
              style={{
                fontSize: 9,
                color: "var(--muted-foreground)",
                fontFamily: "var(--font-mono)",
              }}
            >
              mg/L · Hourly
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={antiscalantHourly} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fill: "#4d7a9e" }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                domain={[1.8, 3.2]}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={2.0} stroke="#22c55e" strokeDasharray="3 2" strokeWidth={1} />
              <ReferenceLine y={3.0} stroke="#22c55e" strokeDasharray="3 2" strokeWidth={1} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                name="Dose Rate"
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <div style={{ width: 20, height: 1, background: "#22c55e", borderTop: "1px dashed #22c55e" }} />
              <span style={{ fontSize: 9, color: "#22c55e" }}>Normal band (2.0–3.0)</span>
            </div>
            <div className="flex items-center gap-1">
              <div style={{ width: 20, height: 1, background: "#a78bfa" }} />
              <span style={{ fontSize: 9, color: "#a78bfa" }}>Actual</span>
            </div>
          </div>
        </div>

        {/* Monthly consumption */}
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
              Monthly Consumption
            </span>
            <span
              style={{
                fontSize: 9,
                color: "var(--muted-foreground)",
                fontFamily: "var(--font-mono)",
              }}
            >
              kg · 2026 YTD
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={antiscalantMonthly} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 9, fill: "#4d7a9e" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="consumption" fill="#a78bfa" radius={[3, 3, 0, 0]} name="Consumption (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Consumption log table */}
      <div
        className="rounded p-3"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
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
          Recent Dosing Records
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Date", "Avg Dose Rate (mg/L)", "Consumption (kg)", "Production (m³)", "Dose/m³", "Status"].map((h) => (
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
              { date: "2026-06-06", rate: "2.42", cons: "4.6", prod: "4,224", dpm: "1.09", ok: true },
              { date: "2026-06-05", rate: "2.38", cons: "4.4", prod: "4,080", dpm: "1.08", ok: true },
              { date: "2026-06-04", rate: "2.45", cons: "4.7", prod: "4,218", dpm: "1.11", ok: true },
              { date: "2026-06-03", rate: "2.61", cons: "5.1", prod: "4,350", dpm: "1.17", ok: false },
              { date: "2026-06-02", rate: "2.40", cons: "4.5", prod: "3,960", dpm: "1.14", ok: true },
            ].map((r, i) => (
              <tr key={r.date} style={{ background: i % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                  {r.date}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#a78bfa", borderBottom: "1px solid var(--border)" }}>
                  {r.rate}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                  {r.cons}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                  {r.prod}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                  {r.dpm}
                </td>
                <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-1">
                    {r.ok ? (
                      <CheckCircle size={10} style={{ color: "#22c55e" }} />
                    ) : (
                      <AlertTriangle size={10} style={{ color: "#eab308" }} />
                    )}
                    <span style={{ fontSize: 9, color: r.ok ? "#22c55e" : "#eab308", fontWeight: 600 }}>
                      {r.ok ? "NORMAL" : "ELEVATED"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}