// components/ProductionMonitoring.jsx - FULLY MOBILE RESPONSIVE

import React, { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { TrendingUp, TrendingDown, Clock, Calendar, Activity } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { format, subHours, subDays, startOfDay, endOfDay } from 'date-fns';
import { API_BASE_URL } from '../config';

// ===================== CUSTOM TOOLTIP =====================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1828", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 4, padding: "6px 10px" }}>
      <p style={{ fontSize: 10, color: "#4d7a9e", marginBottom: 2 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

// ===================== STAT CARD =====================
function StatCard({ label, value, unit, sub, color, trend, isMobile }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : null;
  const trendColor = trend > 0 ? "#22c55e" : trend < 0 ? "#ef4444" : "var(--muted-foreground)";

  return (
    <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label}
      </div>
      <div className="flex items-end gap-1">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: isMobile ? 18 : 24, fontWeight: 700, color: color || "var(--foreground)", lineHeight: 1 }}>
          {value}
        </span>
        <span style={{ fontSize: isMobile ? 9 : 10, color: "var(--muted-foreground)", marginBottom: 2 }}>{unit}</span>
      </div>
      {sub && (
        <div style={{ fontSize: isMobile ? 8 : 10, color: "#22c55e", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          {TrendIcon && <TrendIcon size={isMobile ? 8 : 9} style={{ color: trendColor }} />}
          {sub}
        </div>
      )}
    </div>
  );
}

// ===================== CHART PANEL =====================
function ChartPanel({ title, meta, children, action, isMobile }) {
  return (
    <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
        <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {title}
        </span>
        <div className="flex items-center gap-3 flex-wrap">
          {meta && (
            <span style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
              {meta}
            </span>
          )}
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export function ProductionMonitoring() {
  const { sensorData, getValue, getHistory, lastUpdate } = useData();
  const [timeRange, setTimeRange] = useState('24h');
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const feedFlow = getValue('RO5-FEEDFlow') || 0;
  const permeateFlow = getValue('RO5-Permeateflow') || 0;
  const concentrateFlow = getValue('RO5-ConcetrateFlow') || 0;
  const recovery = getValue('RO5-SystemRecovery') || 0;
  const roPressure = getValue('RO5-ROPressure') || 0;
  const pureWaterEC = getValue('RO5-PureWaterEc') || 0;

  const feedHistory = getHistory('RO5-FEEDFlow') || [];

  // ===================== REAL PRODUCTION TOTALS =====================
  const [productionSummary, setProductionSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const fetchProductionSummary = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const res = await fetch(`${API_BASE_URL}/api/production-summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProductionSummary(data);
    } catch (err) {
      console.error('Failed to fetch production summary:', err);
      setSummaryError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionSummary();
    const interval = setInterval(fetchProductionSummary, 60000);
    return () => clearInterval(interval);
  }, []);

  const dailyTotal = productionSummary?.permeate?.daily ?? 0;
  const weeklyTotal = productionSummary?.permeate?.weekly ?? 0;
  const monthlyTotal = productionSummary?.permeate?.monthly ?? 0;
  const yearlyTotal = productionSummary?.permeate?.yearly ?? 0;
  const feedDailyTotal = productionSummary?.feed?.daily ?? 0;

  // ===================== HOURLY DATA =====================
  const hourlyData = useMemo(() => {
    if (feedHistory.length === 0) return [];

    const now = new Date();
    const startTime = timeRange === '24h' ? subHours(now, 24) : subHours(now, 1);

    const filtered = feedHistory.filter(d => new Date(d.time) >= startTime);
    const grouped = {};

    filtered.forEach(d => {
      const hour = format(new Date(d.time), 'HH:00');
      if (!grouped[hour]) grouped[hour] = { hour, flow: 0, count: 0 };
      grouped[hour].flow += d.value;
      grouped[hour].count++;
    });

    const result = Object.values(grouped).map(g => ({
      hour: g.hour,
      flow: g.flow / g.count
    }));

    return result.sort((a, b) => a.hour.localeCompare(b.hour));
  }, [feedHistory, timeRange]);

  const currentFlow = feedHistory.length > 0 ? feedHistory[feedHistory.length - 1]?.value || feedFlow : feedFlow;

  // ===================== TRENDS =====================
  const flowTrend = useMemo(() => {
    if (feedHistory.length < 2) return 0;
    const recent = feedHistory.slice(-10);
    const avgRecent = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    const older = feedHistory.slice(-20, -10);
    const avgOlder = older.reduce((sum, d) => sum + d.value, 0) / (older.length || 1);
    return avgOlder > 0 ? ((avgRecent - avgOlder) / avgOlder) * 100 : 0;
  }, [feedHistory]);

  // ===================== EFFICIENCY =====================
  const efficiency = useMemo(() => {
    if (feedFlow === 0) return 0;
    return (permeateFlow / feedFlow) * 100;
  }, [feedFlow, permeateFlow]);

  // ===================== PRODUCTION TARGETS =====================
  const productionTargets = useMemo(() => {
    const dailyTarget = 4200;
    const weeklyTarget = 29400;
    const monthlyTarget = 130200;
    const yearlyTarget = 1562400;

    const dailyEff = dailyTarget > 0 ? (dailyTotal / dailyTarget) * 100 : 0;
    const weeklyEff = weeklyTarget > 0 ? (weeklyTotal / weeklyTarget) * 100 : 0;
    const monthlyEff = monthlyTarget > 0 ? (monthlyTotal / monthlyTarget) * 100 : 0;
    const yearlyEff = yearlyTarget > 0 ? (yearlyTotal / yearlyTarget) * 100 : 0;

    const mk = (period, target, actual, eff) => ({
      period,
      target: target.toLocaleString(),
      actual: Math.round(actual).toLocaleString(),
      variance: actual >= target ? `+${Math.round(actual - target)}` : `-${Math.round(target - actual)}`,
      eff: `${eff.toFixed(1)}%`,
      status: eff >= 95 ? "ON TRACK" : eff >= 80 ? "CAUTION" : "BELOW TARGET",
      statusColor: eff >= 95 ? "#22c55e" : eff >= 80 ? "#eab308" : "#ef4444"
    });

    return [
      mk("Today", dailyTarget, dailyTotal, dailyEff),
      mk("This Week", weeklyTarget, weeklyTotal, weeklyEff),
      mk("This Month", monthlyTarget, monthlyTotal, monthlyEff),
      mk("This Year", yearlyTarget, yearlyTotal, yearlyEff),
    ];
  }, [dailyTotal, weeklyTotal, monthlyTotal, yearlyTotal]);

  // ===================== TIME RANGE BUTTONS =====================
  const TimeRangeButtons = () => (
    <div className="flex gap-1">
      {['1h', '24h'].map(range => (
        <button
          key={range}
          onClick={() => setTimeRange(range)}
          style={{
            padding: isMobile ? '2px 8px' : '2px 10px',
            borderRadius: 3,
            fontSize: isMobile ? 8 : 9,
            background: timeRange === range ? '#0ea5e9' : 'var(--secondary)',
            color: timeRange === range ? 'white' : 'var(--muted-foreground)',
            border: '1px solid var(--border)',
            cursor: 'pointer'
          }}
        >
          {range}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4 overflow-auto h-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "var(--foreground)" }}>
            Production Monitoring
          </h2>
          <p style={{ fontSize: isMobile ? 10 : 11, color: "var(--muted-foreground)", marginTop: 2 }}>
            Real-time production data • Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={isMobile ? 12 : 14} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ fontSize: isMobile ? 9 : 10, color: "var(--muted-foreground)" }}>
            {summaryLoading ? 'Loading…' : summaryError ? 'Totals unavailable' : 'From database'}
          </span>
        </div>
      </div>

      {summaryError && (
        <div className="rounded p-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: isMobile ? 10 : 11 }}>
          Couldn't load production totals ({summaryError}). Showing live values only.
        </div>
      )}

      {/* KPI row - Responsive */}
      <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)" }}>
        <StatCard 
          label="Current Flow" 
          value={currentFlow.toFixed(1)} 
          unit="m³/hr" 
          sub={`${flowTrend.toFixed(1)}% vs avg`} 
          color="#0ea5e9"
          trend={flowTrend}
          isMobile={isMobile}
        />
        <StatCard 
          label="Today" 
          value={Math.round(dailyTotal).toLocaleString()} 
          unit="m³" 
          sub={`${((dailyTotal / 4200) * 100).toFixed(1)}%`}
          color="#06b6d4" 
          trend={((dailyTotal / 4200) * 100) - 100}
          isMobile={isMobile}
        />
        <StatCard 
          label="Weekly" 
          value={Math.round(weeklyTotal).toLocaleString()} 
          unit="m³" 
          sub={`${((weeklyTotal / 29400) * 100).toFixed(1)}%`}
          color="#14b8a6" 
          trend={((weeklyTotal / 29400) * 100) - 100}
          isMobile={isMobile}
        />
        {!isMobile && (
          <>
            <StatCard 
              label="Monthly" 
              value={Math.round(monthlyTotal).toLocaleString()} 
              unit="m³" 
              sub={`${((monthlyTotal / 130200) * 100).toFixed(1)}%`}
              color="#22c55e" 
              trend={((monthlyTotal / 130200) * 100) - 100}
              isMobile={isMobile}
            />
            <StatCard 
              label="Recovery" 
              value={recovery.toFixed(1)} 
              unit="%" 
              sub={recovery > 75 ? "Good" : recovery > 65 ? "Caution" : "Check"}
              color={recovery > 75 ? "#22c55e" : recovery > 65 ? "#eab308" : "#ef4444"}
              trend={recovery - 75}
              isMobile={isMobile}
            />
            <StatCard 
              label="Efficiency" 
              value={efficiency.toFixed(1)} 
              unit="%" 
              sub={`${(efficiency / 80 * 100).toFixed(1)}%`}
              color="#a78bfa" 
              trend={efficiency - 80}
              isMobile={isMobile}
            />
          </>
        )}
      </div>

      {/* Mobile additional stats row */}
      {isMobile && (
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <StatCard 
            label="Monthly" 
            value={Math.round(monthlyTotal).toLocaleString()} 
            unit="m³" 
            sub={`${((monthlyTotal / 130200) * 100).toFixed(1)}%`}
            color="#22c55e" 
            trend={((monthlyTotal / 130200) * 100) - 100}
            isMobile={isMobile}
          />
          <StatCard 
            label="Recovery" 
            value={recovery.toFixed(1)} 
            unit="%" 
            sub={recovery > 75 ? "Good" : "Check"}
            color={recovery > 75 ? "#22c55e" : "#eab308"}
            trend={recovery - 75}
            isMobile={isMobile}
          />
          <StatCard 
            label="Efficiency" 
            value={efficiency.toFixed(1)} 
            unit="%" 
            sub={`${(efficiency / 80 * 100).toFixed(1)}%`}
            color="#a78bfa" 
            trend={efficiency - 80}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Hourly flow chart */}
      <ChartPanel 
        title="Hourly Flow Rate" 
        meta={`${timeRange === '24h' ? '24 Hours' : '1 Hour'}`}
        action={<TimeRangeButtons />}
        isMobile={isMobile}
      >
        {hourlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={isMobile ? 150 : 190}>
            <AreaChart data={hourlyData} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e" }} 
                axisLine={false} 
                tickLine={false} 
                interval={hourlyData.length > 20 ? Math.floor(hourlyData.length / 10) : 0}
              />
              <YAxis 
                tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} 
                axisLine={false} 
                tickLine={false} 
                domain={['auto', 'auto']} 
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={feedHistory.length > 0 ? feedHistory.reduce((sum, d) => sum + d.value, 0) / feedHistory.length : 0} 
                stroke="#4d7a9e" 
                strokeDasharray="4 3" 
                strokeWidth={1} 
                label={{ value: "Avg", position: "right", fontSize: isMobile ? 7 : 9, fill: "#4d7a9e" }} 
              />
              <Area type="monotone" dataKey="flow" stroke="#0ea5e9" strokeWidth={2} fill="url(#flowGrad)" name="Flow Rate" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted-foreground)' }}>
            <Activity size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>Waiting for data...</p>
          </div>
        )}
      </ChartPanel>

      {/* Production Targets Table - Responsive */}
      <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Production Targets — Real Performance
        </div>
        
        {isMobile ? (
          // Mobile card view
          <div className="flex flex-col gap-2">
            {productionTargets.map((r, i) => (
              <div key={r.period} className="rounded p-3" style={{ background: i % 2 === 0 ? "var(--card)" : "var(--muted)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{r.period}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: r.statusColor, background: `${r.statusColor}15`, borderRadius: 3, padding: "1px 8px" }}>
                    {r.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <span style={{ fontSize: 8, color: "var(--muted-foreground)" }}>Target</span>
                    <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>{r.target}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 8, color: "var(--muted-foreground)" }}>Actual</span>
                    <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600 }}>{r.actual}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 8, color: "var(--muted-foreground)" }}>Variance</span>
                    <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: r.variance.startsWith("+") ? "#22c55e" : "#ef4444" }}>{r.variance}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 8, color: "var(--muted-foreground)" }}>Efficiency</span>
                    <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: r.statusColor }}>{r.eff}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop table view
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr>
                  {["Period", "Target (m³)", "Actual (m³)", "Variance", "Efficiency", "Status"].map((h) => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productionTargets.map((r, i) => (
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
                    <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: r.variance.startsWith("+") ? "#22c55e" : "#ef4444", borderBottom: "1px solid var(--border)" }}>
                      {r.variance}
                    </td>
                    <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: r.statusColor, borderBottom: "1px solid var(--border)" }}>
                      {r.eff}
                    </td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: r.statusColor, background: `${r.statusColor}15`, borderRadius: 3, padding: "1px 8px" }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary stats - Responsive */}
      <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)" }}>
        {[
          { label: "Feed Flow", value: feedFlow.toFixed(1), unit: "m³/h", status: feedFlow > 50 ? "Normal" : "Low", color: feedFlow > 50 ? "#22c55e" : "#eab308" },
          { label: "Permeate Flow", value: permeateFlow.toFixed(1), unit: "m³/h", status: permeateFlow > 30 ? "Normal" : "Low", color: permeateFlow > 30 ? "#22c55e" : "#eab308" },
          { label: "Concentrate Flow", value: concentrateFlow.toFixed(1), unit: "m³/h", status: concentrateFlow > 10 ? "Normal" : "Low", color: concentrateFlow > 10 ? "#22c55e" : "#eab308" },
          { label: "RO Pressure", value: roPressure.toFixed(1), unit: "bar", status: roPressure > 10 && roPressure < 16 ? "Normal" : "Check", color: roPressure > 10 && roPressure < 16 ? "#22c55e" : "#ef4444" },
        ].map(item => (
          <div key={item.label} className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {item.label}
            </div>
            <div style={{ fontSize: isMobile ? 16 : 18, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)", marginTop: 2 }}>
              {item.value} <span style={{ fontSize: isMobile ? 10 : 12, color: "var(--muted-foreground)" }}>{item.unit}</span>
            </div>
            <div style={{ fontSize: isMobile ? 8 : 9, marginTop: 2, color: item.color }}>
              {item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductionMonitoring;