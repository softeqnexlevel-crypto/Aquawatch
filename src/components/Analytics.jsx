import { useState, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { monthlyProduction, antiscalantMonthly, maintenanceHoursMonthly, recoveryTrend, operatingDistribution } from "../data/mockData";
import { Download, FileText, RefreshCw, CheckCircle } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1828", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 4, padding: "6px 10px" }}>
      <p style={{ fontSize: 10, color: "#4d7a9e", marginBottom: 2 }}>{label}</p>
      {payload.map((p, idx) => (
        <p key={idx} style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: p.color || "#d4e4f7" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

const periods = ["Daily", "Weekly", "Monthly"];

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 999,
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "10px 14px", minWidth: 240, maxWidth: 280,
      boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
      display: "flex", alignItems: "flex-start", gap: 8,
      opacity: toast.visible ? 1 : 0, transition: "opacity 0.3s",
    }}>
      <div style={{ marginTop: 1 }}>
        {toast.done
          ? <CheckCircle size={16} style={{ color: "#22c55e" }} />
          : <RefreshCw size={16} style={{ color: toast.iconColor, animation: "spin 1s linear infinite" }} />
        }
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{toast.title}</div>
        <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 2 }}>
          {toast.done ? "File downloaded" : toast.sub}
        </div>
        <div style={{ height: 3, borderRadius: 2, background: "var(--border)", marginTop: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, background: "#0ea5e9", width: `${toast.progress}%`, transition: "width 0.05s linear" }} />
        </div>
      </div>
    </div>
  );
}

// ── Download helper ────────────────────────────────────────────────────────────
function downloadCSV(filename, label) {
  const content = `Report: ${label}\nGenerated: ${new Date().toISOString()}\n\nID,Timestamp,Value\n1,2026-06-01,100\n2,2026-06-02,120\n3,2026-06-03,115`;
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── useToast hook ──────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  function showToast(title, sub, iconColor, onComplete) {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setToast({ title, sub, iconColor, progress: 0, done: false, visible: true });
    let progress = 0;
    intervalRef.current = setInterval(() => {
      progress = Math.min(progress + 2, 100);
      setToast(prev => prev ? { ...prev, progress } : prev);
      if (progress >= 100) {
        clearInterval(intervalRef.current);
        onComplete?.();
        setToast(prev => prev ? { ...prev, done: true } : prev);
        timerRef.current = setTimeout(() => setToast(null), 2000);
      }
    }, 30);
  }

  return { toast, showToast };
}

// ── ReportCard ─────────────────────────────────────────────────────────────────
function ReportCard({ title, items, onExport }) {
  return (
    <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{title}</span>
        <button
          onClick={onExport}
          className="flex items-center gap-1"
          style={{ fontSize: 9, color: "#0ea5e9", cursor: "pointer", background: "none", border: "none", padding: 0 }}
        >
          <Download size={10} />Export
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-1" style={{ borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{item.label}</span>
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)" }}>{item.value}</span>
              {item.unit && <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>{item.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Analytics ──────────────────────────────────────────────────────────────────
export function Analytics() {
  const [period, setPeriod] = useState("Monthly");
  const { toast, showToast } = useToast();

  function handleExport(label, filename) {
    showToast(`Exporting ${label}…`, "Preparing CSV", "#0ea5e9", () => downloadCSV(filename, label));
  }

  function handleGenerateReport() {
    showToast("Generating Report…", "Compiling analytics data", "#a78bfa", () => downloadCSV(`analytics_${period.toLowerCase()}_report.csv`, `${period} Analytics Report`));
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Analytics & Reports</span>
        <div className="flex-1" />
        <div className="flex rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "5px 12px", fontSize: 10, cursor: "pointer",
                fontWeight: period === p ? 600 : 400,
                color: period === p ? "#020810" : "var(--muted-foreground)",
                background: period === p ? "#0ea5e9" : "var(--card)",
                borderRight: "1px solid var(--border)", border: "none",
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={handleGenerateReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)", fontSize: 10, color: "var(--foreground)", cursor: "pointer" }}
        >
          <FileText size={12} />Generate Report
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <ReportCard
          title="Production Summary"
          items={[
            { label: "Total Output", value: "88,200", unit: "m³" },
            { label: "Avg Daily Flow", value: "4,118", unit: "m³/day" },
            { label: "Peak Day", value: "4,350", unit: "m³" },
            { label: "vs Target", value: "+2.1%", unit: "" },
          ]}
          onExport={() => handleExport("Production Summary", "production_summary.csv")}
        />
        <ReportCard
          title="Recovery Summary"
          items={[
            { label: "Avg Recovery", value: "78.6%", unit: "" },
            { label: "Best Day", value: "81.2%", unit: "" },
            { label: "Worst Day", value: "74.1%", unit: "" },
            { label: "vs Target", value: "+0.6%", unit: "" },
          ]}
          onExport={() => handleExport("Recovery Summary", "recovery_summary.csv")}
        />
        <ReportCard
          title="Chemical Usage"
          items={[
            { label: "Antiscalant", value: "132", unit: "kg" },
            { label: "Chlorine", value: "18", unit: "kg" },
            { label: "pH Adj.", value: "4.2", unit: "kg" },
            { label: "Cost", value: "KES 62,400", unit: "" },
          ]}
          onExport={() => handleExport("Chemical Usage", "chemical_usage.csv")}
        />
        <ReportCard
          title="Maintenance Summary"
          items={[
            { label: "Work Orders", value: "6", unit: "" },
            { label: "Hours Spent", value: "20h", unit: "" },
            { label: "Downtime", value: "6.5h", unit: "" },
            { label: "Cost", value: "KES 48,000", unit: "" },
          ]}
          onExport={() => handleExport("Maintenance Summary", "maintenance_summary.csv")}
        />
      </div>

      {/* Charts grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Production & Recovery — 2026 YTD</span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={monthlyProduction} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000).toFixed(0) + "k"} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="actual" stroke="#06b6d4" strokeWidth={2} fill="url(#aGrad)" name="Actual (m³)" />
              <Line type="monotone" dataKey="target" stroke="#4d7a9e" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Target (m³)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Operating Time Distribution</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={operatingDistribution} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={0}>
                  {operatingDistribution.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid gap-1.5 w-full" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {operatingDistribution.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div style={{ width: 7, height: 7, borderRadius: 1, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: "var(--muted-foreground)", flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600 }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chemical + KPI charts */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Chemical Consumption by Month</span>
            <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>kg</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={antiscalantMonthly} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="consumption" fill="#a78bfa" radius={[3, 3, 0, 0]} name="Consumption (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>System Efficiency KPIs</span>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: "Plant Availability", value: 96.4, color: "#22c55e" },
              { label: "System Recovery", value: 78.6, color: "#0ea5e9" },
              { label: "Dosing Efficiency", value: 98.2, color: "#a78bfa" },
              { label: "Production Efficiency", value: 94.8, color: "#06b6d4" },
            ].map((kpi, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{kpi.label}</span>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: kpi.color }}>{kpi.value}%</span>
                </div>
                <div style={{ height: 6, background: "var(--secondary)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${kpi.value}%`, height: "100%", background: kpi.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}