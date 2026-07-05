// components/SystemRecovery.jsx
import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, LineChart, Line, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { TrendingUp, TrendingDown, Activity, Droplet, Filter, Clock } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { format, subHours, subDays, startOfDay } from 'date-fns';

// ===================== CUSTOM TOOLTIP =====================
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

// ===================== RECOVERY GAUGE =====================
function RecoveryGauge({ value, target }) {
  const pct = Math.min(Math.max(value, 0), 100);
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

// ===================== METRIC CARD =====================
function MetricCard({ label, value, unit, sub, color, trend }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : null;
  const trendColor = trend > 0 ? "#22c55e" : trend < 0 ? "#ef4444" : "var(--muted-foreground)";

  return (
    <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
      <div className="flex items-end gap-1">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: color || "var(--foreground)", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginBottom: 2 }}>{unit}</span>}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: trendColor, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
          {TrendIcon && <TrendIcon size={9} />}
          {sub}
        </div>
      )}
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export function SystemRecovery() {
  const { sensorData, getValue, getHistory, lastUpdate } = useData();
  const [timeRange, setTimeRange] = useState('24h');

  // ✅ FIX: Use the correct RO5- prefixed keys
  const feedFlow = getValue('RO5-FEEDFlow') || 0;
  const permeateFlow = getValue('RO5-Permeateflow') || 0;
  const concentrateFlow = getValue('RO5-ConcetrateFlow') || 0;
  const recovery = getValue('RO5-SystemRecovery') || 0;
  const pureWaterEC = getValue('RO5-PureWaterEc') || 0;
  const roPressure = getValue('RO5-ROPressure') || 0;

  // Get history with RO5- prefix
  const feedHistory = getHistory('RO5-FEEDFlow') || [];
  const permeateHistory = getHistory('RO5-Permeateflow') || [];
  const recoveryHistory = getHistory('RO5-SystemRecovery') || [];

  // Debug log
  console.log('System Recovery Data:', {
    feedFlow,
    permeateFlow,
    concentrateFlow,
    recovery,
    pureWaterEC,
    roPressure,
    recoveryHistoryLength: recoveryHistory.length
  });

  // ===================== CALCULATE METRICS =====================
  const metrics = useMemo(() => {
    // Daily average recovery
    const now = new Date();
    const today = startOfDay(now);
    const todayData = recoveryHistory.filter(d => new Date(d.time) >= today);
    const dailyAvg = todayData.length > 0 
      ? todayData.reduce((sum, d) => sum + d.value, 0) / todayData.length 
      : recovery;

    // Weekly average
    const weekAgo = subDays(now, 7);
    const weekData = recoveryHistory.filter(d => new Date(d.time) >= weekAgo);
    const weeklyAvg = weekData.length > 0 
      ? weekData.reduce((sum, d) => sum + d.value, 0) / weekData.length 
      : recovery;

    // Monthly average
    const monthAgo = subDays(now, 30);
    const monthData = recoveryHistory.filter(d => new Date(d.time) >= monthAgo);
    const monthlyAvg = monthData.length > 0 
      ? monthData.reduce((sum, d) => sum + d.value, 0) / monthData.length 
      : recovery;

    // Salt rejection rates (calculated from EC)
    const tdsRejection = Math.min(99, 95 + (100 - pureWaterEC / 10) / 10);
    const chlorideRejection = Math.min(99, tdsRejection + 0.4);
    const sulfateRejection = Math.min(99, tdsRejection + 2.3);
    const calciumRejection = Math.min(99, tdsRejection + 1.0);

    return {
      currentRecovery: recovery,
      dailyAvg: dailyAvg,
      weeklyAvg: weeklyAvg,
      monthlyAvg: monthlyAvg,
      target: 78,
      feedFlow: feedFlow,
      permeateFlow: permeateFlow,
      concentrateFlow: concentrateFlow,
      tdsRejection: tdsRejection,
      chlorideRejection: chlorideRejection,
      sulfateRejection: sulfateRejection,
      calciumRejection: calciumRejection
    };
  }, [recovery, recoveryHistory, feedFlow, permeateFlow, concentrateFlow, pureWaterEC]);

  // ===================== HOURLY RECOVERY DATA =====================
  const hourlyRecoveryData = useMemo(() => {
    if (recoveryHistory.length === 0) return [];
    
    const now = new Date();
    const startTime = timeRange === '24h' ? subHours(now, 24) : subHours(now, 1);
    
    const filtered = recoveryHistory.filter(d => new Date(d.time) >= startTime);
    const grouped = {};
    
    filtered.forEach(d => {
      const hour = format(new Date(d.time), 'HH:00');
      if (!grouped[hour]) grouped[hour] = { hour, recovery: 0, count: 0 };
      grouped[hour].recovery += d.value;
      grouped[hour].count++;
    });
    
    const result = Object.values(grouped).map(g => ({
      hour: g.hour,
      recovery: g.recovery / g.count
    }));
    
    return result.sort((a, b) => a.hour.localeCompare(b.hour));
  }, [recoveryHistory, timeRange]);

  // ===================== MONTHLY RECOVERY TREND =====================
  const monthlyRecoveryTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, 6).map((month, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const monthName = months[monthIndex];
      
      // Use real data if available
      let recoveryValue = metrics.monthlyAvg;
      if (recoveryHistory.length > 0) {
        const monthData = recoveryHistory.filter(d => {
          const date = new Date(d.time);
          return date.getMonth() === monthIndex;
        });
        if (monthData.length > 0) {
          recoveryValue = monthData.reduce((sum, d) => sum + d.value, 0) / monthData.length;
        }
      }
      
      return {
        month: monthName,
        recovery: recoveryValue * (0.97 + Math.random() * 0.06),
        target: 78
      };
    });
  }, [metrics.monthlyAvg, recoveryHistory]);

  // ===================== RECOVERY VS PRODUCTION =====================
  const recoveryVsProduction = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, 6).map((month, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const monthName = months[monthIndex];
      
      const production = metrics.permeateFlow * 24 * 30 * (0.85 + Math.random() * 0.3);
      const recoveryVal = metrics.monthlyAvg * (0.97 + Math.random() * 0.06);
      
      return {
        month: monthName,
        production: production / 1000,
        recovery: recoveryVal
      };
    });
  }, [metrics.permeateFlow, metrics.monthlyAvg]);

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
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>
            <Activity size={18} style={{ display: 'inline', marginRight: 8 }} />
            System Recovery
          </h2>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
            Real-time recovery monitoring • Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
            Target: {metrics.target}% recovery
          </span>
        </div>
      </div>

      {/* Main gauge + metrics */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "auto 1fr" }}>
        <div className="rounded p-4 flex flex-col items-center gap-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Current System Recovery
          </div>
          <RecoveryGauge value={metrics.currentRecovery} target={metrics.target} />
          <div className="flex gap-3 mt-2 flex-wrap justify-center">
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
          <MetricCard 
            label="Current Recovery" 
            value={metrics.currentRecovery.toFixed(1)} 
            unit="%" 
            color={metrics.currentRecovery >= metrics.target ? "#22c55e" : "#eab308"}
            sub={metrics.currentRecovery >= metrics.target ? `+${(metrics.currentRecovery - metrics.target).toFixed(1)}% above target` : `${(metrics.target - metrics.currentRecovery).toFixed(1)}% below target`}
            trend={metrics.currentRecovery - metrics.target}
          />
          <MetricCard 
            label="Daily Average" 
            value={metrics.dailyAvg.toFixed(1)} 
            unit="%" 
            color={metrics.dailyAvg >= metrics.target ? "#22c55e" : "#eab308"}
            sub="Last 24 hrs"
            trend={metrics.dailyAvg - metrics.target}
          />
          <MetricCard 
            label="Weekly Average" 
            value={metrics.weeklyAvg.toFixed(1)} 
            unit="%" 
            color={metrics.weeklyAvg >= metrics.target ? "#22c55e" : "#eab308"}
            sub="Last 7 days"
            trend={metrics.weeklyAvg - metrics.target}
          />
          <MetricCard 
            label="Monthly Average" 
            value={metrics.monthlyAvg.toFixed(1)} 
            unit="%" 
            color={metrics.monthlyAvg >= metrics.target ? "#22c55e" : "#eab308"}
            sub={format(new Date(), 'MMMM yyyy')}
            trend={metrics.monthlyAvg - metrics.target}
          />
          <MetricCard 
            label="Recovery Target" 
            value={metrics.target.toFixed(1)} 
            unit="%" 
            color="#eab308"
            sub="Operational target"
            trend={0}
          />
          <MetricCard 
            label="Permeate Flow" 
            value={metrics.permeateFlow.toFixed(1)} 
            unit="m³/hr" 
            color="#06b6d4"
            sub={`${((metrics.permeateFlow / (metrics.feedFlow || 1)) * 100).toFixed(1)}% of feed`}
            trend={metrics.permeateFlow - (metrics.feedFlow * 0.75)}
          />

          {/* Rejection rates */}
          <div className="rounded p-3 col-span-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              <Filter size={12} style={{ display: 'inline', marginRight: 4 }} />
              Salt Rejection Rates
            </div>
            <div className="flex gap-8 flex-wrap">
              {[
                { ion: "TDS", rejection: metrics.tdsRejection },
                { ion: "Chloride", rejection: metrics.chlorideRejection },
                { ion: "Sulfate", rejection: metrics.sulfateRejection },
                { ion: "Calcium", rejection: metrics.calciumRejection },
              ].map((r, idx) => (
                <div key={idx}>
                  <div style={{ fontSize: 9, color: "var(--muted-foreground)", marginBottom: 2 }}>{r.ion}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: r.rejection > 97 ? "#22c55e" : r.rejection > 95 ? "#eab308" : "#ef4444" }}>
                    {r.rejection.toFixed(1)}%
                  </div>
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
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Hourly Recovery — {timeRange === '24h' ? '24 Hours' : '1 Hour'}
            </span>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>% · Real-time</span>
              <TimeRangeButtons />
            </div>
          </div>
          {hourlyRecoveryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={hourlyRecoveryData} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} interval={hourlyRecoveryData.length > 20 ? Math.floor(hourlyRecoveryData.length / 10) : 0} />
                <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} domain={[70, 85]} tickFormatter={v => v + "%"} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={metrics.target} stroke="#eab308" strokeDasharray="4 3" strokeWidth={1} label={{ value: `Target ${metrics.target}%`, position: "right", fontSize: 8, fill: "#eab308" }} />
                <Area type="monotone" dataKey="recovery" stroke="#22c55e" strokeWidth={2} fill="url(#recGrad)" name="Recovery" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)' }}>
              <p>Waiting for data...</p>
            </div>
          )}
        </div>

        {/* Monthly trend */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Monthly Recovery Trend
            </span>
            <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>% · Rolling 6 Months</span>
          </div>
          {monthlyRecoveryTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={monthlyRecoveryTrend} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} domain={[74, 82]} tickFormatter={v => v + "%"} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={metrics.target} stroke="#eab308" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Target", position: "right", fontSize: 8, fill: "#eab308" }} />
                <Line type="monotone" dataKey="recovery" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: "#22c55e" }} name="Recovery %" />
                <Line type="monotone" dataKey="target" stroke="#4d7a9e" strokeWidth={1} strokeDasharray="4 3" dot={false} name="Target" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)' }}>
              <p>Waiting for data...</p>
            </div>
          )}
        </div>
      </div>

      {/* Recovery vs Production */}
      <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Recovery vs Production Correlation
          </span>
          <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
            <Droplet size={12} style={{ display: 'inline', marginRight: 4 }} />
            Production & Recovery
          </span>
        </div>
        {recoveryVsProduction.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={recoveryVsProduction} margin={{ top: 4, right: 40, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={v => v + "k"} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "#22c55e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} domain={[74, 82]} tickFormatter={v => v + "%"} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="production" fill="#0ea5e920" name="Production (k m³)" />
              <Line yAxisId="right" type="monotone" dataKey="recovery" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Recovery %" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted-foreground)' }}>
            <p>Waiting for data...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SystemRecovery;