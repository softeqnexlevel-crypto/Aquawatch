import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { Droplets, Activity, FlaskConical, Wrench, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { monthlyProduction, recoveryTrend, maintenanceHoursMonthly, alerts, boreholes, downtimeCauses } from "../data/mockData";

function KPICard({
  label, value, unit, icon: Icon, trend, trendValue, color, sub
}) {
  const trendColor = trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#4d7a9e";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <div className="rounded p-3 flex flex-col gap-1" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
        {Icon && <Icon size={13} style={{ color: color || "var(--muted-foreground)" }} />}
      </div>
      <div className="flex items-end gap-1">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: color || "var(--foreground)", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginBottom: 2 }}>{unit}</span>}
      </div>
      {(trendValue || sub) && (
        <div className="flex items-center gap-1">
          {trend && <TrendIcon size={10} style={{ color: trendColor }} />}
          <span style={{ fontSize: 10, color: trendValue ? trendColor : "var(--muted-foreground)" }}>
            {trendValue || sub}
          </span>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
      {children}
    </h2>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1828", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 4, padding: "6px 10px" }}>
      <p style={{ fontSize: 10, color: "#4d7a9e", marginBottom: 4 }}>{label}</p>
      {payload.map((p, idx) => (
        <p key={idx} style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: p.color }}>{p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}</p>
      ))}
    </div>
  );
};

export function Dashboard() {
  const activeBoreholes = boreholes.filter(b => b.status === "Active").length;
  const totalDailyProd = boreholes.reduce((s, b) => s + b.dailyProd, 0);
  const totalMonthlyProd = boreholes.reduce((s, b) => s + b.monthlyProd, 0);
  const activeAlerts = alerts.filter(a => a.status === "Active").length;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>

      {/* KPI Grid */}
      <div>
        <SectionTitle>Key Performance Indicators</SectionTitle>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <KPICard label="Daily Production" value={totalDailyProd.toLocaleString()} unit="m³" icon={Droplets} trend="up" trendValue="+3.2% vs yesterday" color="#0ea5e9" />
          <KPICard label="Weekly Production" value="28,640" unit="m³" icon={Activity} trend="up" trendValue="+1.8% vs last week" color="#06b6d4" />
          <KPICard label="Monthly Production" value={(totalMonthlyProd / 1000).toFixed(1) + "k"} unit="m³" icon={Activity} trend="up" trendValue="92.4% of target" color="#14b8a6" />
          <KPICard label="Active Boreholes" value={activeBoreholes} unit={`/ ${boreholes.length}`} icon={Droplets} sub="1 on maintenance" color="#22c55e" />
          <KPICard label="Active Alerts" value={activeAlerts} icon={AlertTriangle} trend="down" trendValue="2 critical" color="#ef4444" />
        </div>
        <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <KPICard label="System Recovery" value="78.6" unit="%" icon={Activity} trend="up" trendValue="+0.6% vs target" color="#22c55e" />
          <KPICard label="Antiscalant Dosing" value="2.42" unit="mg/L" icon={FlaskConical} sub="Normal range" color="#a78bfa" />
          <KPICard label="Monthly Chemical" value="132" unit="kg" icon={FlaskConical} trend="flat" trendValue="On track" color="#a78bfa" />
          <KPICard label="Maintenance Hours" value="20" unit="hrs/mo" icon={Wrench} sub="6 this month" color="#f59e0b" />
          <KPICard label="Plant Availability" value="96.4" unit="%" icon={CheckCircle} trend="up" trendValue="+0.8% MoM" color="#22c55e" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1fr" }}>
        {/* Monthly Production */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Monthly Production vs Target</SectionTitle>
            <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>2026 YTD · m³</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyProduction} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000).toFixed(0) + "k"} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="actual" stroke="#06b6d4" strokeWidth={2} fill="url(#prodGrad)" name="Actual" />
              <Line type="monotone" dataKey="target" stroke="#4d7a9e" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Downtime causes */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="mb-3">
            <SectionTitle>Downtime Causes</SectionTitle>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={downtimeCauses} cx="50%" cy="50%" innerRadius={32} outerRadius={54} dataKey="value" strokeWidth={0}>
                  {downtimeCauses.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 flex-1">
              {downtimeCauses.map((d) => (
                <div key={d.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 7, height: 7, borderRadius: 1, background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600 }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        {/* Recovery trend */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <SectionTitle>Recovery Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={recoveryTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} domain={[74, 81]} tickFormatter={v => v + "%"} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="recovery" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: "#22c55e" }} name="Recovery %" />
              <Line type="monotone" dataKey="target" stroke="#4d7a9e" strokeWidth={1} strokeDasharray="4 3" dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Maintenance hours */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <SectionTitle>Maintenance Hours</SectionTitle>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={maintenanceHoursMonthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="corrective" stackId="a" fill="#ef4444" name="Corrective" radius={[0, 0, 0, 0]} />
              <Bar dataKey="preventive" stackId="a" fill="#0ea5e9" name="Preventive" />
              <Bar dataKey="inspection" stackId="a" fill="#22c55e" name="Inspection" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Active Alerts */}
        <div className="rounded p-3 flex flex-col gap-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <SectionTitle>Active Alerts</SectionTitle>
          <div className="flex flex-col gap-1.5 flex-1 overflow-auto" style={{ scrollbarWidth: "none" }}>
            {alerts.filter(a => a.status === "Active").map((alert) => {
              const color = alert.severity === "Critical" ? "#ef4444" : alert.severity === "High" ? "#f97316" : alert.severity === "Medium" ? "#eab308" : "#0ea5e9";
              return (
                <div key={alert.id} className="flex items-start gap-2 rounded p-2" style={{ background: "var(--muted)", border: `1px solid ${color}22` }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, marginTop: 3, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 10, fontWeight: 500, color: "var(--foreground)" }}>{alert.type}</div>
                    <div style={{ fontSize: 9, color: "var(--muted-foreground)" }}>{alert.equipment} · {alert.time}</div>
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 600, color, letterSpacing: "0.06em", background: `${color}18`, borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}