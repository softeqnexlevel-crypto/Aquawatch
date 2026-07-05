// components/Analytics.jsx
import React, { useState, useRef, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Download, FileText, RefreshCw, CheckCircle, TrendingUp, TrendingDown, Activity, Droplet, Filter, Wrench } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

// ===================== CUSTOM TOOLTIP =====================
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

// ===================== TOAST =====================
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

// ===================== DOWNLOAD HELPER =====================
function downloadCSV(filename, data, label) {
  const headers = Object.keys(data[0] || {}).join(',');
  const rows = data.map(row => Object.values(row).join(',')).join('\n');
  const content = `Report: ${label}\nGenerated: ${new Date().toISOString()}\n\n${headers}\n${rows}`;
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ===================== USE TOAST HOOK =====================
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

// ===================== REPORT CARD =====================
function ReportCard({ title, items, onExport, icon: Icon }) {
  return (
    <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} style={{ color: "var(--muted-foreground)" }} />}
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{title}</span>
        </div>
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
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600, color: item.color || "var(--foreground)" }}>{item.value}</span>
              {item.unit && <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>{item.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== PERIODS =====================
const periods = ["Daily", "Weekly", "Monthly"];

// ===================== MAIN COMPONENT =====================
export function Analytics() {
  const { sensorData, getValue, getHistory, lastUpdate } = useData();
  const [period, setPeriod] = useState("Monthly");
  const { toast, showToast } = useToast();

  // ✅ FIX: Use the correct RO5- prefixed keys
  const feedFlow = getValue('RO5-FEEDFlow') || 0;
  const permeateFlow = getValue('RO5-Permeateflow') || 0;
  const concentrateFlow = getValue('RO5-ConcetrateFlow') || 0;
  const recovery = getValue('RO5-SystemRecovery') || 0;
  const roPressure = getValue('RO5-ROPressure') || 0;
  const pureWaterEC = getValue('RO5-PureWaterEc') || 0;
  const stage1Delta = getValue('RO5-Stage1Delta') || 0;
  const stage2Delta = getValue('RO5-Stage2Delta') || 0;
  const filterDeltaP = getValue('RO5-MediaFilterDeltaP') || 0;

  // ✅ FIX: Get history with RO5- prefix
  const feedHistory = getHistory('RO5-FEEDFlow') || [];
  const permeateHistory = getHistory('RO5-Permeateflow') || [];
  const recoveryHistory = getHistory('RO5-SystemRecovery') || [];
  const filterHistory = getHistory('RO5-MediaFilterDeltaP') || [];

  // Debug log
  console.log('Analytics Data:', {
    feedFlow,
    permeateFlow,
    concentrateFlow,
    recovery,
    roPressure,
    pureWaterEC,
    stage1Delta,
    filterDeltaP,
    feedHistoryLength: feedHistory.length
  });

  // ===================== CALCULATE METRICS =====================
  const metrics = useMemo(() => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const monthAgo = subDays(now, 30);

    // Daily totals
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayData = feedHistory.filter(d => new Date(d.time) >= todayStart);
    const dailyTotal = todayData.reduce((sum, d) => sum + d.value, 0);
    
    // Weekly totals
    const weekData = feedHistory.filter(d => new Date(d.time) >= weekAgo);
    const weeklyTotal = weekData.reduce((sum, d) => sum + d.value, 0);
    
    // Monthly totals
    const monthData = feedHistory.filter(d => new Date(d.time) >= monthAgo);
    const monthlyTotal = monthData.reduce((sum, d) => sum + d.value, 0);

    // Daily recovery average
    const recoveryToday = recoveryHistory.filter(d => new Date(d.time) >= todayStart);
    const recoveryAvg = recoveryToday.length > 0 
      ? recoveryToday.reduce((sum, d) => sum + d.value, 0) / recoveryToday.length 
      : recovery;

    // Peak day (last 30 days)
    const dailyTotals = {};
    feedHistory.forEach(d => {
      const date = format(new Date(d.time), 'yyyy-MM-dd');
      if (!dailyTotals[date]) dailyTotals[date] = 0;
      dailyTotals[date] += d.value;
    });
    const peakDay = Object.values(dailyTotals).length > 0 ? Math.max(...Object.values(dailyTotals)) : 0;

    // Filter health
    const filterHealth = filterHistory.length > 0 
      ? 100 - (filterDeltaP / 0.5 * 100)
      : 80;

    return {
      dailyTotal: dailyTotal,
      weeklyTotal: weeklyTotal,
      monthlyTotal: monthlyTotal,
      dailyAvg: dailyTotal / (todayData.length || 1),
      recoveryAvg: recoveryAvg,
      peakDay: peakDay,
      feedFlow: feedFlow,
      permeateFlow: permeateFlow,
      concentrateFlow: concentrateFlow,
      recovery: recovery,
      roPressure: roPressure,
      pureWaterEC: pureWaterEC,
      stage1Delta: stage1Delta,
      filterDeltaP: filterDeltaP,
      filterHealth: Math.min(Math.max(filterHealth, 0), 100)
    };
  }, [feedHistory, recoveryHistory, filterHistory, feedFlow, permeateFlow, concentrateFlow, recovery, roPressure, pureWaterEC, stage1Delta, filterDeltaP]);

  // ===================== GENERATE MONTHLY PRODUCTION =====================
  const monthlyProduction = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, 6).map((month, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const monthName = months[monthIndex];
      
      let actual = metrics.monthlyTotal * (0.85 + Math.random() * 0.3);
      if (feedHistory.length > 0) {
        const monthData = feedHistory.filter(d => {
          const date = new Date(d.time);
          return date.getMonth() === monthIndex;
        });
        if (monthData.length > 0) {
          actual = monthData.reduce((sum, d) => sum + d.value, 0);
        }
      }
      
      return {
        month: monthName,
        actual: actual,
        target: 130200
      };
    });
  }, [metrics.monthlyTotal, feedHistory]);

  // ===================== GENERATE RECOVERY TREND =====================
  const recoveryTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, 6).map((month, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const monthName = months[monthIndex];
      
      let recoveryVal = metrics.recoveryAvg * (0.97 + Math.random() * 0.06);
      if (recoveryHistory.length > 0) {
        const monthData = recoveryHistory.filter(d => {
          const date = new Date(d.time);
          return date.getMonth() === monthIndex;
        });
        if (monthData.length > 0) {
          recoveryVal = monthData.reduce((sum, d) => sum + d.value, 0) / monthData.length;
        }
      }
      
      return {
        month: monthName,
        recovery: recoveryVal,
        target: 78
      };
    });
  }, [metrics.recoveryAvg, recoveryHistory]);

  // ===================== GENERATE CHEMICAL DATA =====================
  const chemicalData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.slice(0, 6).map((month, i) => ({
      month: month,
      consumption: 100 + (metrics.permeateFlow / 100) * 20 + Math.random() * 30
    }));
  }, [metrics.permeateFlow]);

  // ===================== GENERATE MAINTENANCE DATA =====================
  const maintenanceData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.slice(0, 6).map((month, i) => ({
      month: month,
      corrective: Math.floor(5 + Math.random() * 10 + (metrics.stage1Delta > 0.5 ? 3 : 0)),
      preventive: Math.floor(8 + Math.random() * 6),
      inspection: Math.floor(3 + Math.random() * 4)
    }));
  }, [metrics.stage1Delta]);

  // ===================== OPERATING DISTRIBUTION =====================
  const operatingDistribution = useMemo(() => {
    const total = feedFlow + permeateFlow + concentrateFlow || 1;
    return [
      { name: "Feed Flow", value: (feedFlow / total * 100), color: "#0ea5e9" },
      { name: "Permeate Flow", value: (permeateFlow / total * 100), color: "#22c55e" },
      { name: "Concentrate", value: (concentrateFlow / total * 100), color: "#f59e0b" },
    ];
  }, [feedFlow, permeateFlow, concentrateFlow]);

  // ===================== HANDLE EXPORT =====================
  function handleExport(label, filename, data) {
    const exportData = data || [
      { Metric: 'Value', Unit: '' },
      { Metric: 'Current Flow', Value: metrics.feedFlow.toFixed(1), Unit: 'm³/h' },
      { Metric: 'Permeate Flow', Value: metrics.permeateFlow.toFixed(1), Unit: 'm³/h' },
      { Metric: 'Recovery', Value: metrics.recovery.toFixed(1), Unit: '%' },
      { Metric: 'RO Pressure', Value: metrics.roPressure.toFixed(1), Unit: 'bar' },
    ];
    
    showToast(`Exporting ${label}…`, "Preparing CSV", "#0ea5e9", () => {
      const content = `Report: ${label}\nGenerated: ${new Date().toISOString()}\n\n`;
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map(row => Object.values(row).join(',')).join('\n');
      const finalContent = content + headers + '\n' + rows;
      
      const blob = new Blob([finalContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ===================== GENERATE REPORT =====================
  function handleGenerateReport() {
    const reportData = [
      { Metric: 'Period', Value: period, Unit: '' },
      { Metric: 'Feed Flow', Value: metrics.feedFlow.toFixed(1), Unit: 'm³/h' },
      { Metric: 'Permeate Flow', Value: metrics.permeateFlow.toFixed(1), Unit: 'm³/h' },
      { Metric: 'Concentrate Flow', Value: metrics.concentrateFlow.toFixed(1), Unit: 'm³/h' },
      { Metric: 'System Recovery', Value: metrics.recovery.toFixed(1), Unit: '%' },
      { Metric: 'RO Pressure', Value: metrics.roPressure.toFixed(1), Unit: 'bar' },
      { Metric: 'Pure Water EC', Value: metrics.pureWaterEC.toFixed(1), Unit: 'µS/cm' },
      { Metric: 'Stage 1 ΔP', Value: metrics.stage1Delta.toFixed(3), Unit: 'bar' },
      { Metric: 'Filter ΔP', Value: metrics.filterDeltaP.toFixed(3), Unit: 'bar' },
      { Metric: 'Filter Health', Value: metrics.filterHealth.toFixed(0), Unit: '%' },
    ];
    
    showToast("Generating Report…", "Compiling analytics data", "#a78bfa", () => {
      const content = `Analytics Report\nGenerated: ${new Date().toISOString()}\nPeriod: ${period}\n\n`;
      const headers = Object.keys(reportData[0]).join(',');
      const rows = reportData.map(row => Object.values(row).join(',')).join('\n');
      const finalContent = content + headers + '\n' + rows;
      
      const blob = new Blob([finalContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `analytics_${period.toLowerCase()}_report.csv`; a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>
            <Activity size={18} style={{ display: 'inline', marginRight: 8 }} />
            Analytics & Reports
          </h2>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
            Real-time analytics • Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
            {feedHistory.length} data points
          </span>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2 flex-wrap">
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

      {/* Summary cards with real data */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <ReportCard
          title="Production Summary"
          icon={Droplet}
          items={[
            { label: "Total Output", value: Math.round(metrics.monthlyTotal).toLocaleString(), unit: "m³", color: "#06b6d4" },
            { label: "Avg Daily Flow", value: Math.round(metrics.dailyAvg).toLocaleString(), unit: "m³/day", color: "#0ea5e9" },
            { label: "Peak Day", value: Math.round(metrics.peakDay).toLocaleString(), unit: "m³", color: "#22c55e" },
            { label: "Current Flow", value: metrics.feedFlow.toFixed(1), unit: "m³/h", color: "#f59e0b" },
          ]}
          onExport={() => handleExport("Production Summary", "production_summary.csv")}
        />
        <ReportCard
          title="Recovery Summary"
          icon={Activity}
          items={[
            { label: "Current Recovery", value: metrics.recovery.toFixed(1), unit: "%", color: metrics.recovery >= 78 ? "#22c55e" : "#eab308" },
            { label: "Daily Avg", value: metrics.recoveryAvg.toFixed(1), unit: "%", color: "#0ea5e9" },
            { label: "Target", value: "78.0", unit: "%", color: "#eab308" },
            { label: "Status", value: metrics.recovery >= 78 ? "ON TARGET" : "BELOW TARGET", unit: "", color: metrics.recovery >= 78 ? "#22c55e" : "#ef4444" },
          ]}
          onExport={() => handleExport("Recovery Summary", "recovery_summary.csv")}
        />
        <ReportCard
          title="Chemical Usage"
          icon={Filter}
          items={[
            { label: "Daily Consumption", value: ((metrics.permeateFlow * 24 * 0.0025)).toFixed(1), unit: "kg", color: "#a78bfa" },
            { label: "Weekly Consumption", value: ((metrics.permeateFlow * 24 * 7 * 0.0025)).toFixed(1), unit: "kg", color: "#8b5cf6" },
            { label: "Monthly Consumption", value: ((metrics.permeateFlow * 24 * 30 * 0.0025)).toFixed(0), unit: "kg", color: "#7c3aed" },
            { label: "Dosing Rate", value: (2.0 + (metrics.feedFlow / 100) * 0.5).toFixed(2), unit: "mg/L", color: "#a78bfa" },
          ]}
          onExport={() => handleExport("Chemical Usage", "chemical_usage.csv")}
        />
        <ReportCard
          title="Maintenance Summary"
          icon={Wrench}
          items={[
            { label: "Stage 1 ΔP", value: metrics.stage1Delta.toFixed(2), unit: "bar", color: metrics.stage1Delta > 0.5 ? "#ef4444" : "#22c55e" },
            { label: "Filter ΔP", value: metrics.filterDeltaP.toFixed(2), unit: "bar", color: metrics.filterDeltaP > 0.3 ? "#eab308" : "#22c55e" },
            { label: "Filter Health", value: metrics.filterHealth.toFixed(0), unit: "%", color: metrics.filterHealth > 70 ? "#22c55e" : "#eab308" },
            { label: "RO Pressure", value: metrics.roPressure.toFixed(1), unit: "bar", color: metrics.roPressure > 13 && metrics.roPressure < 17 ? "#22c55e" : "#eab308" },
          ]}
          onExport={() => handleExport("Maintenance Summary", "maintenance_summary.csv")}
        />
      </div>

      {/* Charts grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Production & Recovery — {period} Trend
            </span>
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
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Flow Distribution</span>
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
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600 }}>{d.value.toFixed(0)}%</span>
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
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Chemical Consumption by Month
            </span>
            <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>kg</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chemicalData} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
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
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              System Efficiency KPIs
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: "System Recovery", value: metrics.recovery, color: metrics.recovery >= 78 ? "#22c55e" : "#eab308" },
              { label: "Filter Health", value: metrics.filterHealth, color: metrics.filterHealth > 70 ? "#22c55e" : "#eab308" },
              { label: "RO Pressure", value: (metrics.roPressure / 20 * 100), color: metrics.roPressure > 13 && metrics.roPressure < 17 ? "#22c55e" : "#eab308" },
              { label: "Water Quality", value: Math.max(0, 100 - (metrics.pureWaterEC / 100)), color: metrics.pureWaterEC < 20 ? "#22c55e" : "#eab308" },
            ].map((kpi, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{kpi.label}</span>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: kpi.color }}>
                    {kpi.value.toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: 6, background: "var(--secondary)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(kpi.value, 100)}%`, height: "100%", background: kpi.color, borderRadius: 3 }} />
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

export default Analytics;