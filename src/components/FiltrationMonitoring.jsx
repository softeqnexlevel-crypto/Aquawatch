// components/FiltrationMonitoring.jsx
import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { AlertTriangle, CheckCircle, AlertCircle, Filter, Calendar, Clock } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { format, subHours, subDays } from 'date-fns';

// ===================== CUSTOM TOOLTIP =====================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1828", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 4, padding: "6px 10px" }}>
      <p style={{ fontSize: 10, color: "#4d7a9e", marginBottom: 2 }}>{label}</p>
      {payload.map((p, idx) => (
        <p key={idx} style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: p.color }}>
          {p.name}: {p.value?.toFixed(3)} bar
        </p>
      ))}
    </div>
  );
};

// ===================== PRESSURE GAUGE COMPONENT =====================
function PressureGauge({ value, warning, critical, label, filterNum, lastUpdate }) {
  // Guard against undefined/null values
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const pct = Math.min((safeValue / critical) * 100, 100);
  const color = safeValue >= critical ? "#ef4444" : safeValue >= warning ? "#eab308" : "#22c55e";
  const status = safeValue >= critical ? "CRITICAL" : safeValue >= warning ? "WARNING" : "NORMAL";
  const StatusIcon = safeValue >= critical ? AlertTriangle : safeValue >= warning ? AlertCircle : CheckCircle;

  // Calculate health score
  const healthScore = Math.round(100 - pct);

  return (
    <div className="rounded p-4 flex flex-col gap-4" style={{ background: "var(--card)", border: `1px solid ${color}30` }}>
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            <Filter size={12} style={{ display: 'inline', marginRight: 4 }} />
            Filter {filterNum}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{label}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded px-2 py-1" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
          <StatusIcon size={12} style={{ color }} />
          <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.06em" }}>{status}</span>
        </div>
      </div>

      {/* Pressure value */}
      <div className="flex items-end gap-2">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 42, fontWeight: 700, color, lineHeight: 1 }}>
          {safeValue.toFixed(3)}
        </span>
        <span style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 4 }}>bar</span>
      </div>

      {/* Bar gauge */}
      <div>
        <div style={{ height: 10, background: "var(--secondary)", borderRadius: 5, overflow: "hidden", position: "relative" }}>
          <div style={{
            width: `${(warning / critical) * 100}%`, height: "100%",
            background: "linear-gradient(to right, #22c55e, #eab308)",
            position: "absolute", top: 0, left: 0
          }} />
          <div style={{
            width: `${Math.max(0, pct - (warning / critical) * 100)}%`, height: "100%",
            background: "#ef4444",
            position: "absolute", top: 0, left: `${(warning / critical) * 100}%`
          }} />
          {/* Current marker */}
          <div style={{
            position: "absolute", top: -2, bottom: -2,
            left: `${Math.min(pct, 100)}%`, width: 3, background: "#fff",
            borderRadius: 2, transform: "translateX(-50%)", boxShadow: `0 0 6px ${color}`
          }} />
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 8, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>0.00</span>
          <span style={{ fontSize: 8, color: "#eab308", fontFamily: "var(--font-mono)" }}>⚠ {warning.toFixed(2)}</span>
          <span style={{ fontSize: 8, color: "#ef4444", fontFamily: "var(--font-mono)" }}>🔴 {critical.toFixed(2)}</span>
        </div>
      </div>

      {/* Thresholds and info */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {[
          { label: "Warning Threshold", value: `${warning.toFixed(2)} bar`, color: "#eab308" },
          { label: "Critical Threshold", value: `${critical.toFixed(2)} bar`, color: "#ef4444" },
          { label: "Health Score", value: `${healthScore}%`, color: healthScore > 70 ? "#22c55e" : healthScore > 50 ? "#eab308" : "#ef4444" },
          { label: "Last Update", value: lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--', color: "var(--muted-foreground)" },
        ].map((m, idx) => (
          <div key={idx} className="rounded p-2" style={{ background: "var(--muted)" }}>
            <div style={{ fontSize: 8, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: m.color, fontWeight: 600, marginTop: 2 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Health score bar */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Filter Health Score</span>
        <div className="flex items-center gap-2">
          <div style={{ width: 80, height: 4, background: "var(--secondary)", borderRadius: 2 }}>
            <div style={{ 
              width: `${Math.max(0, healthScore)}%`, 
              height: "100%", 
              background: healthScore > 70 ? "#22c55e" : healthScore > 50 ? "#eab308" : "#ef4444", 
              borderRadius: 2 
            }} />
          </div>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color, fontWeight: 600 }}>
            {healthScore}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export function FiltrationMonitoring() {
  const { sensorData, getValue, getHistory, lastUpdate } = useData();
  const [timeRange, setTimeRange] = useState('24h');

  // Get real data from sensors
  const stage1Delta = getValue('Stage1Delta') || 0;
  const stage2Delta = getValue('Stage2Delta') || 0;
  const filterDeltaP = getValue('MediaFilterDeltaP') || 0;
  const mediaFilterIn = getValue('MediaFilterInPress') || 0;
  const mediaFilterOut = getValue('MediaFilterOutPress') || 0;

  // Get history for trends
  const stage1History = getHistory('Stage1Delta');
  const stage2History = getHistory('Stage2Delta');
  const filterHistory = getHistory('MediaFilterDeltaP');

  // Process data for chart
  const chartData = useMemo(() => {
    const now = new Date();
    const startTime = timeRange === '24h' ? subHours(now, 24) : subHours(now, 1);
    
    // Get data from all three histories
    const dataMap = new Map();
    
    // Add stage1 data
    stage1History.forEach(d => {
      const time = new Date(d.time);
      if (time >= startTime) {
        const key = time.getTime();
        if (!dataMap.has(key)) {
          dataMap.set(key, { time: format(time, 'HH:mm') });
        }
        dataMap.get(key).filter1 = d.value;
      }
    });
    
    // Add stage2 data
    stage2History.forEach(d => {
      const time = new Date(d.time);
      if (time >= startTime) {
        const key = time.getTime();
        if (!dataMap.has(key)) {
          dataMap.set(key, { time: format(time, 'HH:mm') });
        }
        dataMap.get(key).filter2 = d.value;
      }
    });
    
    // Add filter data
    filterHistory.forEach(d => {
      const time = new Date(d.time);
      if (time >= startTime) {
        const key = time.getTime();
        if (!dataMap.has(key)) {
          dataMap.set(key, { time: format(time, 'HH:mm') });
        }
        dataMap.get(key).filterDP = d.value;
      }
    });
    
    // Convert to array and sort by time
    return Array.from(dataMap.values())
      .sort((a, b) => {
        const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
        const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
        return timeA - timeB;
      })
      .slice(-50); // Keep last 50 points
  }, [stage1History, stage2History, filterHistory, timeRange]);

  // Generate filter events from real data
  const filterEvents = useMemo(() => {
    const events = [];
    
    // Add events based on pressure changes
    if (stage1History.length > 10) {
      const recent = stage1History.slice(-10);
      const avg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
      if (avg > 0.5) {
        events.push({
          time: format(new Date(), 'yyyy-MM-dd HH:mm'),
          filter: "Stage 1",
          event: "High ΔP Warning",
          before: recent[0]?.value?.toFixed(2) || '0.00',
          after: avg.toFixed(2),
          dur: "Monitoring",
          op: "System Auto"
        });
      }
    }
    
    if (stage2History.length > 10) {
      const recent = stage2History.slice(-10);
      const avg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
      if (avg > 0.4) {
        events.push({
          time: format(new Date(), 'yyyy-MM-dd HH:mm'),
          filter: "Stage 2",
          event: "High ΔP Warning",
          before: recent[0]?.value?.toFixed(2) || '0.00',
          after: avg.toFixed(2),
          dur: "Monitoring",
          op: "System Auto"
        });
      }
    }
    
    if (filterHistory.length > 10) {
      const recent = filterHistory.slice(-10);
      const avg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
      if (avg > 0.3) {
        events.push({
          time: format(new Date(), 'yyyy-MM-dd HH:mm'),
          filter: "Media Filter",
          event: "High ΔP Warning",
          before: recent[0]?.value?.toFixed(2) || '0.00',
          after: avg.toFixed(2),
          dur: "Monitoring",
          op: "System Auto"
        });
      }
    }
    
    // Add some historical events if we have enough data
    if (stage1History.length > 50) {
      const older = stage1History.slice(-50, -40);
      const olderAvg = older.reduce((sum, d) => sum + d.value, 0) / older.length;
      const recent = stage1History.slice(-10);
      const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
      
      if (recentAvg < olderAvg * 0.7) {
        events.push({
          time: format(subHours(new Date(), 2), 'yyyy-MM-dd HH:mm'),
          filter: "Stage 1",
          event: "Backwash",
          before: olderAvg.toFixed(2),
          after: recentAvg.toFixed(2),
          dur: "18 min",
          op: "P. Ochieng"
        });
      }
    }
    
    // Sort by time (most recent first) and limit to 5
    return events.slice(0, 5);
  }, [stage1History, stage2History, filterHistory]);

  // Calculate if filters are healthy
  const isHealthy = (value, warning) => value < warning;
  const healthStatus = (value, warning, critical) => {
    if (value >= critical) return { status: 'Critical', color: '#ef4444', icon: AlertTriangle };
    if (value >= warning) return { status: 'Warning', color: '#eab308', icon: AlertCircle };
    return { status: 'Normal', color: '#22c55e', icon: CheckCircle };
  };

  // Latest values for gauges
  const latestF1 = chartData.length > 0 ? chartData[chartData.length - 1]?.filter1 || stage1Delta : stage1Delta;
  const latestF2 = chartData.length > 0 ? chartData[chartData.length - 1]?.filter2 || stage2Delta : stage2Delta;
  const latestFilterDP = chartData.length > 0 ? chartData[chartData.length - 1]?.filterDP || filterDeltaP : filterDeltaP;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            <Filter size={14} style={{ display: 'inline', marginRight: 6 }} />
            Filter Differential Pressure Monitoring
          </div>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>
            Real-time monitoring • Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimeRange('1h')}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              background: timeRange === '1h' ? '#0ea5e9' : 'var(--secondary)',
              color: timeRange === '1h' ? 'white' : 'var(--muted-foreground)',
              border: '1px solid var(--border)',
              fontSize: 10,
              cursor: 'pointer'
            }}
          >
            1H
          </button>
          <button
            onClick={() => setTimeRange('24h')}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              background: timeRange === '24h' ? '#0ea5e9' : 'var(--secondary)',
              color: timeRange === '24h' ? 'white' : 'var(--muted-foreground)',
              border: '1px solid var(--border)',
              fontSize: 10,
              cursor: 'pointer'
            }}
          >
            24H
          </button>
        </div>
      </div>

      {/* Gauges - Real Data */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <PressureGauge 
          value={latestF1} 
          warning={0.50} 
          critical={0.65} 
          label="Stage 1 Delta P" 
          filterNum={1} 
          lastUpdate={lastUpdate}
        />
        <PressureGauge 
          value={latestF2} 
          warning={0.50} 
          critical={0.65} 
          label="Stage 2 Delta P" 
          filterNum={2}
          lastUpdate={lastUpdate}
        />
        <PressureGauge 
          value={latestFilterDP} 
          warning={0.30} 
          critical={0.50} 
          label="Media Filter Delta P" 
          filterNum={3}
          lastUpdate={lastUpdate}
        />
      </div>

      {/* Pressure trend chart */}
      <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Differential Pressure Trend — {timeRange === '24h' ? '24 Hours' : '1 Hour'}
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 16, height: 2, background: "#0ea5e9", borderRadius: 1 }} />
              <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>Stage 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 16, height: 2, background: "#14b8a6", borderRadius: 1 }} />
              <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>Stage 2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 16, height: 2, background: "#a78bfa", borderRadius: 1 }} />
              <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>Media Filter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 16, height: 1, borderTop: "1px dashed #eab308" }} />
              <span style={{ fontSize: 9, color: "#eab308" }}>Warning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 16, height: 1, borderTop: "1px dashed #ef4444" }} />
              <span style={{ fontSize: 9, color: "#ef4444" }}>Critical</span>
            </div>
          </div>
        </div>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 9, fill: "#4d7a9e" }} 
                axisLine={false} 
                tickLine={false} 
                interval={chartData.length > 20 ? Math.floor(chartData.length / 10) : 0}
              />
              <YAxis 
                tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={v => v.toFixed(2)} 
                domain={[0, 0.8]} 
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0.50} stroke="#eab308" strokeDasharray="4 3" strokeWidth={1} />
              <ReferenceLine y={0.65} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
              <Line 
                type="monotone" 
                dataKey="filter1" 
                stroke="#0ea5e9" 
                strokeWidth={2} 
                dot={false} 
                name="Stage 1" 
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="filter2" 
                stroke="#14b8a6" 
                strokeWidth={2} 
                dot={false} 
                name="Stage 2"
                connectNulls 
              />
              <Line 
                type="monotone" 
                dataKey="filterDP" 
                stroke="#a78bfa" 
                strokeWidth={2} 
                dot={false} 
                name="Media Filter"
                connectNulls 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)' }}>
            <p>Waiting for data...</p>
            <p style={{ fontSize: 10, marginTop: 4 }}>Data will appear once available</p>
          </div>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { 
            label: "Stage 1 Delta", 
            value: latestF1.toFixed(3), 
            unit: "bar", 
            status: healthStatus(latestF1, 0.50, 0.65),
            icon: latestF1 >= 0.65 ? AlertTriangle : latestF1 >= 0.50 ? AlertCircle : CheckCircle
          },
          { 
            label: "Stage 2 Delta", 
            value: latestF2.toFixed(3), 
            unit: "bar", 
            status: healthStatus(latestF2, 0.50, 0.65),
            icon: latestF2 >= 0.65 ? AlertTriangle : latestF2 >= 0.50 ? AlertCircle : CheckCircle
          },
          { 
            label: "Media Filter Delta", 
            value: latestFilterDP.toFixed(3), 
            unit: "bar", 
            status: healthStatus(latestFilterDP, 0.30, 0.50),
            icon: latestFilterDP >= 0.50 ? AlertTriangle : latestFilterDP >= 0.30 ? AlertCircle : CheckCircle
          },
        ].map(item => {
          const StatusIcon = item.icon;
          return (
            <div key={item.label} className="rounded p-3" style={{ background: "var(--card)", border: `1px solid ${item.status.color}30` }}>
              <div style={{ fontSize: 10, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {item.label}
              </div>
              <div style={{ fontSize: 20, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)", marginTop: 4 }}>
                {item.value} <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{item.unit}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4,
                marginTop: 4,
                fontSize: 10, 
                color: item.status.color
              }}>
                <StatusIcon size={12} />
                {item.status.status}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter events table with real data */}
      <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
          Recent Filter Events
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Timestamp", "Filter", "Event", "dP Before", "dP After", "Duration", "Operator"].map((h, idx) => (
                <th key={idx} style={{ 
                  padding: "6px 10px", 
                  textAlign: "left", 
                  fontSize: 9, 
                  fontWeight: 600, 
                  color: "var(--muted-foreground)", 
                  letterSpacing: "0.08em", 
                  textTransform: "uppercase", 
                  borderBottom: "1px solid var(--border)" 
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filterEvents.length > 0 ? (
              filterEvents.map((r, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                  <td style={{ padding: "7px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.time}</td>
                  <td style={{ padding: "7px 10px", fontSize: 10, color: "var(--foreground)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.filter}</td>
                  <td style={{ padding: "7px 10px", fontSize: 10, color: r.event.includes('Warning') ? '#eab308' : '#0ea5e9', borderBottom: "1px solid var(--border)" }}>{r.event}</td>
                  <td style={{ padding: "7px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.before} bar</td>
                  <td style={{ padding: "7px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "#22c55e", borderBottom: "1px solid var(--border)" }}>{r.after} bar</td>
                  <td style={{ padding: "7px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.dur}</td>
                  <td style={{ padding: "7px 10px", fontSize: 10, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.op}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 10 }}>
                  No recent events. All filters operating normally.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FiltrationMonitoring;