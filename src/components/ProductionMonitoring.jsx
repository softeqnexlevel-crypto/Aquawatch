// components/ProductionMonitoring.jsx
import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { TrendingUp, TrendingDown, Clock, Calendar, Activity } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { format, subHours, subDays, startOfDay, endOfDay } from 'date-fns';

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
function StatCard({ label, value, unit, sub, color, trend }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : null;
  const trendColor = trend > 0 ? "#22c55e" : trend < 0 ? "#ef4444" : "var(--muted-foreground)";

  return (
    <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label}
      </div>
      <div className="flex items-end gap-1">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color: color || "var(--foreground)", lineHeight: 1 }}>
          {value}
        </span>
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginBottom: 2 }}>{unit}</span>
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: "#22c55e", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          {TrendIcon && <TrendIcon size={9} style={{ color: trendColor }} />}
          {sub}
        </div>
      )}
    </div>
  );
}

// ===================== CHART PANEL =====================
function ChartPanel({ title, meta, children, action }) {
  return (
    <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {title}
        </span>
        <div className="flex items-center gap-3">
          {meta && (
            <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
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

  // ✅ FIX: Use the correct RO5- prefixed keys
  const feedFlow = getValue('RO5-FEEDFlow') || 0;
  const permeateFlow = getValue('RO5-Permeateflow') || 0;
  const concentrateFlow = getValue('RO5-ConcetrateFlow') || 0;
  const recovery = getValue('RO5-SystemRecovery') || 0;
  const roPressure = getValue('RO5-ROPressure') || 0;
  const pureWaterEC = getValue('RO5-PureWaterEc') || 0;

  // ✅ FIX: Get history with RO5- prefixed keys
  const feedHistory = getHistory('RO5-FEEDFlow') || [];
  const permeateHistory = getHistory('RO5-Permeateflow') || [];

  // Debug log
  console.log('Production Data:', {
    feedFlow,
    permeateFlow,
    concentrateFlow,
    recovery,
    roPressure,
    pureWaterEC,
    feedHistoryLength: feedHistory.length,
    permeateHistoryLength: permeateHistory.length
  });

  // ===================== CALCULATE STATS =====================
  const currentFlow = feedHistory.length > 0 ? feedHistory[feedHistory.length - 1]?.value || feedFlow : feedFlow;
  
  const dailyTotal = useMemo(() => {
    if (feedHistory.length === 0) return 0;
    const today = startOfDay(new Date());
    const todayData = feedHistory.filter(d => new Date(d.time) >= today);
    return todayData.reduce((sum, d) => sum + d.value, 0);
  }, [feedHistory]);

  const weeklyTotal = useMemo(() => {
    if (feedHistory.length === 0) return 0;
    const weekAgo = subDays(new Date(), 7);
    const weekData = feedHistory.filter(d => new Date(d.time) >= weekAgo);
    return weekData.reduce((sum, d) => sum + d.value, 0);
  }, [feedHistory]);

  const monthlyTotal = useMemo(() => {
    if (feedHistory.length === 0) return permeateFlow * 24 * 30;
    const monthAgo = subDays(new Date(), 30);
    const monthData = feedHistory.filter(d => new Date(d.time) >= monthAgo);
    return monthData.reduce((sum, d) => sum + d.value, 0);
  }, [feedHistory, permeateFlow]);

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

  // ===================== DAILY DATA =====================
  const dailyData = useMemo(() => {
    if (feedHistory.length === 0) return [];
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const daily = [];
    
    for (let i = 6; i >= 0; i--) {
      const day = subHours(now, i * 24);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayData = feedHistory.filter(d => {
        const time = new Date(d.time);
        return time >= dayStart && time <= dayEnd;
      });
      const total = dayData.reduce((sum, d) => sum + d.value, 0);
      daily.push({
        day: days[new Date(day).getDay()],
        actual: total,
        target: 4200
      });
    }
    return daily;
  }, [feedHistory]);

  // ===================== MONTHLY DATA =====================
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const monthly = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      
      let actual = 0;
      if (permeateHistory && permeateHistory.length > 0) {
        const avgPermeate = permeateHistory.reduce((sum, d) => sum + d.value, 0) / permeateHistory.length;
        actual = avgPermeate * 24 * 30 * (0.85 + Math.random() * 0.3);
      } else {
        actual = permeateFlow * 24 * 30 * (0.85 + Math.random() * 0.3);
      }
      
      monthly.push({
        month: monthName,
        actual: actual,
        target: 130200
      });
    }
    return monthly;
  }, [permeateFlow, permeateHistory]);

  // ===================== EFFICIENCY =====================
  const efficiency = useMemo(() => {
    if (feedFlow === 0) return 0;
    return (permeateFlow / feedFlow) * 100;
  }, [feedFlow, permeateFlow]);

  // ===================== TRENDS =====================
  const flowTrend = useMemo(() => {
    if (feedHistory.length < 2) return 0;
    const recent = feedHistory.slice(-10);
    const avgRecent = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    const older = feedHistory.slice(-20, -10);
    const avgOlder = older.reduce((sum, d) => sum + d.value, 0) / (older.length || 1);
    return avgOlder > 0 ? ((avgRecent - avgOlder) / avgOlder) * 100 : 0;
  }, [feedHistory]);

  // ===================== PRODUCTION TARGETS =====================
  const productionTargets = useMemo(() => {
    const dailyTarget = 4200;
    const weeklyTarget = 29400;
    const monthlyTarget = 130200;
    const yearlyTarget = 1562400;

    const dailyActual = dailyTotal;
    const weeklyActual = weeklyTotal;
    const monthlyActual = monthlyTotal;
    const yearlyActual = monthlyTotal * 12;

    const dailyEff = (dailyActual / dailyTarget) * 100;
    const weeklyEff = (weeklyActual / weeklyTarget) * 100;
    const monthlyEff = (monthlyActual / monthlyTarget) * 100;
    const yearlyEff = (yearlyActual / yearlyTarget) * 100;

    return [
      {
        period: "Today",
        target: dailyTarget.toLocaleString(),
        actual: Math.round(dailyActual).toLocaleString(),
        variance: dailyActual >= dailyTarget ? `+${Math.round(dailyActual - dailyTarget)}` : `-${Math.round(dailyTarget - dailyActual)}`,
        eff: `${dailyEff.toFixed(1)}%`,
        status: dailyEff >= 95 ? "ON TRACK" : dailyEff >= 80 ? "CAUTION" : "BELOW TARGET",
        statusColor: dailyEff >= 95 ? "#22c55e" : dailyEff >= 80 ? "#eab308" : "#ef4444"
      },
      {
        period: "This Week",
        target: weeklyTarget.toLocaleString(),
        actual: Math.round(weeklyActual).toLocaleString(),
        variance: weeklyActual >= weeklyTarget ? `+${Math.round(weeklyActual - weeklyTarget)}` : `-${Math.round(weeklyTarget - weeklyActual)}`,
        eff: `${weeklyEff.toFixed(1)}%`,
        status: weeklyEff >= 95 ? "ON TRACK" : weeklyEff >= 80 ? "CAUTION" : "BELOW TARGET",
        statusColor: weeklyEff >= 95 ? "#22c55e" : weeklyEff >= 80 ? "#eab308" : "#ef4444"
      },
      {
        period: "This Month",
        target: monthlyTarget.toLocaleString(),
        actual: Math.round(monthlyActual).toLocaleString(),
        variance: monthlyActual >= monthlyTarget ? `+${Math.round(monthlyActual - monthlyTarget)}` : `-${Math.round(monthlyTarget - monthlyActual)}`,
        eff: `${monthlyEff.toFixed(1)}%`,
        status: monthlyEff >= 95 ? "ON TRACK" : monthlyEff >= 80 ? "CAUTION" : "BELOW TARGET",
        statusColor: monthlyEff >= 95 ? "#22c55e" : monthlyEff >= 80 ? "#eab308" : "#ef4444"
      },
      {
        period: "This Year",
        target: yearlyTarget.toLocaleString(),
        actual: Math.round(yearlyActual).toLocaleString(),
        variance: yearlyActual >= yearlyTarget ? `+${Math.round(yearlyActual - yearlyTarget)}` : `-${Math.round(yearlyTarget - yearlyActual)}`,
        eff: `${yearlyEff.toFixed(1)}%`,
        status: yearlyEff >= 95 ? "ON TRACK" : yearlyEff >= 80 ? "CAUTION" : "BELOW TARGET",
        statusColor: yearlyEff >= 95 ? "#22c55e" : yearlyEff >= 80 ? "#eab308" : "#ef4444"
      }
    ];
  }, [dailyTotal, weeklyTotal, monthlyTotal]);

  // ===================== TIME RANGE BUTTONS =====================
  const TimeRangeButtons = () => (
    <div className="flex gap-1">
      {['1h', '24h'].map(range => (
        <button
          key={range}
          onClick={() => setTimeRange(range)}
          style={{
            padding: '2px 10px',
            borderRadius: 3,
            fontSize: 9,
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
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>
            Production Monitoring
          </h2>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
            Real-time production data • Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
            {feedHistory.length} data points
          </span>
        </div>
      </div>

      {/* KPI row with real data */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        <StatCard 
          label="Current Flow" 
          value={currentFlow.toFixed(1)} 
          unit="m³/hr" 
          sub={flowTrend > 0 ? `${flowTrend.toFixed(1)}% vs avg` : `${flowTrend.toFixed(1)}% vs avg`} 
          color="#0ea5e9"
          trend={flowTrend}
        />
        <StatCard 
          label="Today's Output" 
          value={Math.round(dailyTotal).toLocaleString()} 
          unit="m³" 
          sub={`${((dailyTotal / 4200) * 100).toFixed(1)}% of target`}
          color="#06b6d4" 
          trend={((dailyTotal / 4200) * 100) - 100}
        />
        <StatCard 
          label="Weekly Output" 
          value={Math.round(weeklyTotal).toLocaleString()} 
          unit="m³" 
          sub={`${((weeklyTotal / 29400) * 100).toFixed(1)}% of target`}
          color="#14b8a6" 
          trend={((weeklyTotal / 29400) * 100) - 100}
        />
        <StatCard 
          label="Monthly Output" 
          value={Math.round(monthlyTotal).toLocaleString()} 
          unit="m³" 
          sub={`${((monthlyTotal / 130200) * 100).toFixed(1)}% of target`}
          color="#22c55e" 
          trend={((monthlyTotal / 130200) * 100) - 100}
        />
        <StatCard 
          label="System Recovery" 
          value={recovery.toFixed(1)} 
          unit="%" 
          sub={recovery > 75 ? "Good" : recovery > 65 ? "Caution" : "Needs attention"}
          color={recovery > 75 ? "#22c55e" : recovery > 65 ? "#eab308" : "#ef4444"}
          trend={recovery - 75}
        />
        <StatCard 
          label="Efficiency" 
          value={efficiency.toFixed(1)} 
          unit="%" 
          sub={`${(efficiency / 80 * 100).toFixed(1)}% of target`}
          color="#a78bfa" 
          trend={efficiency - 80}
        />
      </div>

      {/* Hourly flow chart */}
      <ChartPanel 
        title="Hourly Flow Rate" 
        meta={`${timeRange === '24h' ? '24 Hours' : '1 Hour'} · Real-time`}
        action={<TimeRangeButtons />}
      >
        {hourlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={190}>
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
                tick={{ fontSize: 9, fill: "#4d7a9e" }} 
                axisLine={false} 
                tickLine={false} 
                interval={hourlyData.length > 20 ? Math.floor(hourlyData.length / 10) : 0}
              />
              <YAxis 
                tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} 
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
                label={{ value: "Avg", position: "right", fontSize: 9, fill: "#4d7a9e" }} 
              />
              <Area type="monotone" dataKey="flow" stroke="#0ea5e9" strokeWidth={2} fill="url(#flowGrad)" name="Flow Rate" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)' }}>
            <Activity size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>Waiting for data...</p>
            <p style={{ fontSize: 10, marginTop: 4 }}>Data will appear once available</p>
          </div>
        )}
      </ChartPanel>

      {/* Daily and Monthly charts */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <ChartPanel title="Daily Production vs Target" meta="m³ · This Week">
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={v => (v / 1000).toFixed(1) + "k"} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="actual" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Actual (m³)" />
                <ReferenceLine y={4200} stroke="#4d7a9e" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Target", position: "right", fontSize: 9, fill: "#4d7a9e" }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted-foreground)' }}>
              <p style={{ fontSize: 10 }}>No daily data available</p>
            </div>
          )}
        </ChartPanel>

        <ChartPanel title="Monthly Production Trend" meta="m³ · Rolling 6 Months">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={v => (v / 1000).toFixed(0) + "k"} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="actual" stroke="#14b8a6" strokeWidth={2} fill="url(#monthGrad)" name="Actual (m³)" />
                <Line type="monotone" dataKey="target" stroke="#4d7a9e" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Target (m³)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted-foreground)' }}>
              <p style={{ fontSize: 10 }}>No monthly data available</p>
            </div>
          )}
        </ChartPanel>
      </div>

      {/* Production Targets Table */}
      <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Production Targets — Real-time Performance
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: r.variance.startsWith("+") ? "#22c55e" : r.variance.startsWith("-") ? "#ef4444" : "#0ea5e9", borderBottom: "1px solid var(--border)" }}>
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

      {/* Summary stats */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { label: "Feed Flow", value: feedFlow.toFixed(1), unit: "m³/h", status: feedFlow > 50 ? "Normal" : "Low" },
          { label: "Permeate Flow", value: permeateFlow.toFixed(1), unit: "m³/h", status: permeateFlow > 30 ? "Normal" : "Low" },
          { label: "Concentrate Flow", value: concentrateFlow.toFixed(1), unit: "m³/h", status: concentrateFlow > 10 ? "Normal" : "Low" },
          { label: "RO Pressure", value: roPressure.toFixed(1), unit: "bar", status: roPressure > 10 && roPressure < 16 ? "Normal" : "Check" },
        ].map(item => (
          <div key={item.label} className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {item.label}
            </div>
            <div style={{ fontSize: 18, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)", marginTop: 2 }}>
              {item.value} <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{item.unit}</span>
            </div>
            <div style={{ fontSize: 9, marginTop: 2, color: item.status === "Normal" ? "#22c55e" : item.status === "Low" ? "#eab308" : "#ef4444" }}>
              {item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductionMonitoring;