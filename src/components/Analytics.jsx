// components/Analytics.jsx - FULLY MOBILE RESPONSIVE
//
// ✅ 2026-08-19: Fixed "Total Output" and "Chemical" cards showing
// fluctuating instead of accumulated values. Root cause: these were
// computed as `currentFlow * hours` (a flat extrapolation of whatever
// the instantaneous flow reading happens to be right now), so the
// number moved every time the live flow reading changed — not what a
// real cumulative production total should do.
//
// Now pulls real accumulated volumes from GET /api/production-summary,
// the same endpoint Dashboard.jsx already uses, which computes proper
// trapezoidal integration (flow × time) over actual stored measurements
// on the backend (see getProductionVolume() in database/postgres.js).
// That's a true running total that only grows, unaffected by the
// current instantaneous reading.
//
// Also removed the 6-month "Production & Recovery Trend" chart and the
// chemical-consumption bar chart, both of which filled in months with
// no real history using `Math.random()` — per client request, this is
// skipped for now rather than shipping fabricated numbers. If a real
// month-by-month trend is wanted later, it needs a new backend endpoint
// exposing getMeasurementAggregates() with a monthly bucket, since the
// frontend only holds the last 500 in-memory readings and can't
// reconstruct 6 months of history on its own.

import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Download, RefreshCw, CheckCircle, Activity, Droplet, Filter, Wrench } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { API_BASE_URL } from "../config";
import { format } from 'date-fns';

const COLORS = {
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  primary: '#0ea5e9',
  purple: '#a78bfa',
  muted: '#4d7a9e',
};

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
      borderRadius: 8, padding: "10px 14px", minWidth: 200, maxWidth: 280,
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

// ===================== USE TOAST HOOK =====================
function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = React.useRef(null);
  const intervalRef = React.useRef(null);

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
function ReportCard({ title, items, onExport, icon: Icon, isMobile }) {
  return (
    <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {Icon && <Icon size={isMobile ? 12 : 14} style={{ color: "var(--muted-foreground)" }} />}
          <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{title}</span>
        </div>
        <button
          onClick={onExport}
          className="flex items-center gap-1"
          style={{ fontSize: isMobile ? 8 : 9, color: "#0ea5e9", cursor: "pointer", background: "none", border: "none", padding: 0 }}
        >
          <Download size={isMobile ? 8 : 10} />{!isMobile && "Export"}
        </button>
      </div>
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-0.5 sm:py-1" style={{ borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: isMobile ? 9 : 10, color: "var(--muted-foreground)" }}>{item.label}</span>
            <div className="flex items-center gap-1">
              <span style={{ fontSize: isMobile ? 10 : 11, fontFamily: "var(--font-mono)", fontWeight: 600, color: item.color || "var(--foreground)" }}>{item.value}</span>
              {item.unit && <span style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)" }}>{item.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== PRODUCTION SUMMARY API =====================
// Same endpoint + auth pattern Dashboard.jsx already uses — kept
// identical so both pages agree on the same real accumulated numbers
// instead of drifting apart with their own separate calculations.
const api = {
  getProductionSummary: async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/production-summary`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
};

const DOSING_RATE = 2.66; // mg/L — fixed dosing rate used to derive chemical consumption from real accumulated volume
const RECOVERY_TARGET = 70;

export function Analytics() {
  const { sensorData, getValue, getHistory, lastUpdate } = useData();
  const { toast, showToast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  const [productionSummary, setProductionSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ Real accumulated production totals — polled the same way
  // Dashboard.jsx does, so both pages stay in sync with the backend's
  // actual integrated volume rather than each computing their own guess.
  const fetchProductionSummary = async () => {
    try {
      const data = await api.getProductionSummary();
      setProductionSummary(data);
      setSummaryLoading(false);
    } catch (err) {
      console.error('Failed to fetch production summary:', err);
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionSummary();
    const interval = setInterval(fetchProductionSummary, 60000);
    return () => clearInterval(interval);
  }, []);

  // Live instantaneous sensor readings — these are legitimately meant to
  // fluctuate (they're "right now" values), unlike the accumulated totals
  // above, so they're kept separate and only used where "current" is the
  // actual intent (e.g. "Current Flow", live gauges, maintenance deltas).
  const feedFlow = getValue('RO5-FEEDFlow') || 0;
  const permeateFlow = getValue('RO5-Permeateflow') || 0;
  const concentrateFlow = getValue('RO5-ConcetrateFlow') || 0;
  const recovery = getValue('RO5-SystemRecovery') || 0;
  const roPressure = getValue('RO5-ROPressure') || 0;
  const stage1Delta = getValue('RO5-Stage1Delta') || 0;
  const stage2Delta = getValue('RO5-Stage2Delta') || 0;

  const recoveryHistory = getHistory('RO5-SystemRecovery');

  // Real accumulated volumes (m³), straight from the backend's
  // trapezoidal-integration query — these only grow over their period,
  // they don't jump around with the current instantaneous flow reading.
  const dailyVolume = productionSummary?.permeate?.daily ?? 0;
  const weeklyVolume = productionSummary?.permeate?.weekly ?? 0;
  const monthlyVolume = productionSummary?.permeate?.monthly ?? 0;

  // Recovery daily average — computed from real logged history (not
  // fabricated), just naturally limited to whatever window of history
  // is currently held in memory.
  const recoveryAvg = React.useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayReadings = recoveryHistory.filter(d => new Date(d.time) >= todayStart);
    if (todayReadings.length === 0) return recovery;
    return todayReadings.reduce((sum, d) => sum + d.value, 0) / todayReadings.length;
  }, [recoveryHistory, recovery]);

  // Chemical consumption derived from real accumulated volume, not from
  // extrapolating the current flow reading across a fixed time window.
  const chemicalDaily = (dailyVolume * DOSING_RATE) / 1000;   // kg
  const chemicalWeekly = (weeklyVolume * DOSING_RATE) / 1000; // kg
  const chemicalMonthly = (monthlyVolume * DOSING_RATE) / 1000; // kg

  // Live flow-share snapshot — this is a real "right now" distribution
  // (feed vs permeate vs concentrate), so fluctuating with the live
  // reading is correct here.
  const operatingDistribution = React.useMemo(() => {
    const total = feedFlow + permeateFlow + concentrateFlow || 1;
    return [
      { name: "Feed Flow", value: (feedFlow / total * 100), color: "#0ea5e9" },
      { name: "Permeate Flow", value: (permeateFlow / total * 100), color: "#22c55e" },
      { name: "Concentrate", value: (concentrateFlow / total * 100), color: "#f59e0b" },
    ];
  }, [feedFlow, permeateFlow, concentrateFlow]);

  const kpis = [
    { label: "System Recovery", value: recovery, color: recovery >= RECOVERY_TARGET ? COLORS.success : COLORS.warning },
    { label: "System Runtime", value: 98, color: COLORS.success },
    { label: "Sensor Accuracy", value: 95, color: COLORS.primary },
    { label: "Water Quality", value: 95, color: COLORS.success },
  ];

  // Real accumulated-volume bar chart: Daily / Weekly / Monthly, straight
  // from productionSummary — replaces the old 6-month trend chart that
  // filled unknown months with random numbers. Per client: skip 6-month
  // history for now rather than fabricate it.
  const productionByPeriod = [
    { period: 'Daily', volume: dailyVolume },
    { period: 'Weekly', volume: weeklyVolume },
    { period: 'Monthly', volume: monthlyVolume },
  ];

  const chemicalByPeriod = [
    { period: 'Daily', consumption: chemicalDaily },
    { period: 'Weekly', consumption: chemicalWeekly },
    { period: 'Monthly', consumption: chemicalMonthly },
  ];

  // Export handlers
  function handleExport(label, filename, data) {
    const exportData = data || [
      { Metric: 'Daily Production', Value: dailyVolume.toFixed(1), Unit: 'm³' },
      { Metric: 'Weekly Production', Value: weeklyVolume.toFixed(1), Unit: 'm³' },
      { Metric: 'Monthly Production', Value: monthlyVolume.toFixed(1), Unit: 'm³' },
      { Metric: 'Current Feed Flow', Value: feedFlow.toFixed(1), Unit: 'm³/h' },
      { Metric: 'Current Permeate Flow', Value: permeateFlow.toFixed(1), Unit: 'm³/h' },
      { Metric: 'Recovery', Value: recovery.toFixed(1), Unit: '%' },
      { Metric: 'RO Pressure', Value: roPressure.toFixed(1), Unit: 'bar' },
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

  return (
    <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "var(--foreground)" }}>
            <Activity size={isMobile ? 14 : 18} style={{ display: 'inline', marginRight: 6 }} />
            Analytics & Reports
          </h2>
          <p style={{ fontSize: isMobile ? 10 : 11, color: "var(--muted-foreground)", marginTop: 2 }}>
            {summaryLoading ? 'Loading accumulated totals…' : 'Real-time analytics'} • Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
      </div>

      {/* Summary cards - Responsive */}
      <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)" }}>
        <ReportCard
          title="Production"
          icon={Droplet}
          isMobile={isMobile}
          items={[
            { label: "Today", value: summaryLoading ? '…' : Math.round(dailyVolume).toLocaleString(), unit: "m³", color: "#0ea5e9" },
            { label: "This Week", value: summaryLoading ? '…' : Math.round(weeklyVolume).toLocaleString(), unit: "m³", color: "#06b6d4" },
            { label: "This Month", value: summaryLoading ? '…' : Math.round(monthlyVolume).toLocaleString(), unit: "m³", color: "#22c55e" },
            { label: "Current Flow", value: permeateFlow.toFixed(1), unit: "m³/h", color: "#f59e0b" },
          ]}
          onExport={() => handleExport("Production Summary", "production_summary.csv")}
        />
        <ReportCard
          title="Recovery"
          icon={Activity}
          isMobile={isMobile}
          items={[
            { label: "Current", value: recovery.toFixed(1), unit: "%", color: recovery >= RECOVERY_TARGET ? "#22c55e" : "#eab308" },
            { label: "Daily Avg", value: recoveryAvg.toFixed(1), unit: "%", color: "#0ea5e9" },
            { label: "Target", value: RECOVERY_TARGET.toFixed(1), unit: "%", color: "#eab308" },
            { label: "Status", value: recovery >= RECOVERY_TARGET ? "ON TARGET" : "BELOW", unit: "", color: recovery >= RECOVERY_TARGET ? "#22c55e" : "#ef4444" },
          ]}
          onExport={() => handleExport("Recovery Summary", "recovery_summary.csv")}
        />
        <ReportCard
          title="Chemical"
          icon={Filter}
          isMobile={isMobile}
          items={[
            { label: "Daily", value: summaryLoading ? '…' : chemicalDaily.toFixed(1), unit: "kg", color: "#a78bfa" },
            { label: "Weekly", value: summaryLoading ? '…' : chemicalWeekly.toFixed(1), unit: "kg", color: "#8b5cf6" },
            { label: "Monthly", value: summaryLoading ? '…' : chemicalMonthly.toFixed(0), unit: "kg", color: "#7c3aed" },
            { label: "Dosing Rate", value: DOSING_RATE.toFixed(2), unit: "mg/L", color: "#a78bfa" },
          ]}
          onExport={() => handleExport("Chemical Usage", "chemical_usage.csv")}
        />
        <ReportCard
          title="Maintenance"
          icon={Wrench}
          isMobile={isMobile}
          items={[
            { label: "Stage 1 ΔP", value: stage1Delta.toFixed(2), unit: "bar", color: stage1Delta > 2.0 ? "#ef4444" : "#22c55e" },
            { label: "Stage 2 ΔP", value: stage2Delta.toFixed(2), unit: "bar", color: stage2Delta > 2.0 ? "#ef4444" : "#22c55e" },
            { label: "RO Pressure", value: roPressure.toFixed(1), unit: "bar", color: roPressure > 10 && roPressure < 16 ? "#22c55e" : "#eab308" },
          ]}
          onExport={() => handleExport("Maintenance Summary", "maintenance_summary.csv")}
        />
      </div>

      {/* Charts grid - Responsive */}
      <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr" }}>
        <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Accumulated Production
            </span>
            <span style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>m³</span>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 150 : 190}>
            <BarChart data={productionByPeriod} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: isMobile ? 8 : 10, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="volume" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Volume (m³)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="mb-2 sm:mb-3">
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Flow Distribution
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            <ResponsiveContainer width="100%" height={isMobile ? 120 : 140}>
              <PieChart>
                <Pie data={operatingDistribution} cx="50%" cy="50%" innerRadius={isMobile ? 28 : 38} outerRadius={isMobile ? 45 : 60} dataKey="value" strokeWidth={0}>
                  {operatingDistribution.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid gap-1 w-full" style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr" }}>
              {operatingDistribution.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div style={{ width: 7, height: 7, borderRadius: 1, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", flex: 1 }}>{isMobile && d.name.length > 8 ? d.name.substring(0, 8) : d.name}</span>
                  <span style={{ fontSize: isMobile ? 9 : 10, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600 }}>{d.value.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chemical + KPI charts - Responsive */}
      <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
        <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Chemical Consumption
            </span>
            <span style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>kg</span>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 120 : 150}>
            <BarChart data={chemicalByPeriod} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="consumption" fill="#a78bfa" radius={[3, 3, 0, 0]} name="Consumption (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              System Efficiency KPIs
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:gap-3">
            {kpis.map((kpi, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: isMobile ? 9 : 10, color: "var(--muted-foreground)" }}>{kpi.label}</span>
                  <span style={{ fontSize: isMobile ? 9 : 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: kpi.color }}>
                    {kpi.value.toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: isMobile ? 4 : 6, background: "var(--secondary)", borderRadius: 3, overflow: "hidden" }}>
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