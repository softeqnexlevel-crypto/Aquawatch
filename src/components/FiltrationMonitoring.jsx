// components/FiltrationMonitoring.jsx - FULLY MOBILE RESPONSIVE
//
// Requires the updated DataContext (exposes `isLive` and `systemOn`).
// If those are missing the page falls back to the old behaviour (always "live").

import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { AlertTriangle, CheckCircle, AlertCircle, Filter, Clock } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { format, subHours } from 'date-fns';

import { RadialGauge, classifyByBands } from './dashboardComponents/Radialgauge';

// ---------------------------------------------------------------------------
// Thresholds
//
// Stage 1 / Stage 2 membrane elements share the same OEM guideline: 1.5 bar
// critical, with a 1.2 bar early-warning buffer. The media filter has its own,
// tighter guideline and is deliberately NOT derived from the membrane values.
// ---------------------------------------------------------------------------
const STAGE_DP_WARNING  = 1.2;
const STAGE_DP_CRITICAL = 1.5;
const MEDIA_DP_WARNING  = 0.30;
const MEDIA_DP_CRITICAL = 0.50;

// Gauge max = 1.5× critical so the needle has visible travel past the red line.
const GAUGE_MAX_RATIO = 1.5;

const buildBands = (warning, critical) => [
  { key: 'normal',   label: 'Normal',   min: 0,       max: warning,  color: '#22c55e' },
  { key: 'warning',  label: 'Warning',  min: warning, max: critical, color: '#eab308' },
  { key: 'critical', label: 'Critical', min: critical, max: critical * GAUGE_MAX_RATIO, color: '#ef4444' },
];

// ---------------------------------------------------------------------------
// FILTERS config — the single source of truth for every monitored filter.
// ---------------------------------------------------------------------------
const FILTERS = [
  { key: 'RO5-Stage1Delta',       label: 'Stage 1 Differential Pressure',      short: 'Stage 1', color: '#0ea5e9', warning: STAGE_DP_WARNING, critical: STAGE_DP_CRITICAL },
  { key: 'RO5-Stage2Delta',       label: 'Stage 2 Differential Pressure',      short: 'Stage 2', color: '#14b8a6', warning: STAGE_DP_WARNING, critical: STAGE_DP_CRITICAL },
  { key: 'RO5-MediaFilterDeltaP', label: 'Media Filter Differential Pressure', short: 'Media',   color: '#a78bfa', warning: MEDIA_DP_WARNING, critical: MEDIA_DP_CRITICAL },
];

FILTERS.forEach((f) => {
  f.bands = buildBands(f.warning, f.critical);
  f.gaugeMax = f.critical * GAUGE_MAX_RATIO;
});

const PAGE_TITLE    = 'Stage 1 Differential Pressure Monitoring';
const PAGE_SUBTITLE = 'Real-time monitoring';
const TREND_TITLE   = 'Stage 1 Differential Pressure Trend';

// Hex colour + alpha suffix, or a neutral border if the colour is a CSS variable.
const tint = (c, alpha) => (typeof c === 'string' && c.startsWith('#') ? `${c}${alpha}` : 'var(--border)');

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

// ===================== FILTER GAUGE CARD =====================
// mode: 'live' | 'stopped' (plant reports not operating) | 'offline' (no live data)
function FilterGaugeCard({ value, filter, lastUpdate, mode, isMobile }) {
  const { label, bands, gaugeMax, warning, critical } = filter;

  const isLiveMode = mode === 'live';
  const band = isLiveMode ? classifyByBands(value, bands) : null;
  const color = !isLiveMode ? 'var(--muted-foreground)' : (band?.color ?? '#22c55e');
  const statusLabel =
    mode === 'offline' ? 'NO DATA' :
    mode === 'stopped' ? 'STOPPED' :
    (band?.label ?? 'NORMAL').toUpperCase();

  // Health score: 100% at 0 bar, 0% at critical. Not meaningful unless running.
  const healthScore = isLiveMode
    ? Math.max(0, Math.round(100 - Math.min((value / critical) * 100, 100)))
    : null;
  const healthColor =
    healthScore === null ? 'var(--muted-foreground)' :
    healthScore > 70 ? '#22c55e' : healthScore > 50 ? '#eab308' : '#ef4444';

  const StatusIcon =
    !isLiveMode ? AlertCircle :
    value >= critical ? AlertTriangle :
    value >= warning ? AlertCircle :
    CheckCircle;

  // Gauge: needle at 0 when stopped, blank when there is no data at all
  const gaugeValue = mode === 'offline' ? undefined : (isLiveMode ? value : 0);

  const summaryItems = [
    { label: "Warning",      value: `${warning.toFixed(2)} bar`,  color: "#eab308" },
    { label: "Critical",     value: `${critical.toFixed(2)} bar`, color: "#ef4444" },
    { label: "Health Score", value: healthScore === null ? '--' : `${healthScore}%`, color: healthColor },
    { label: "Last Update",  value: lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--', color: "var(--muted-foreground)" },
  ];

  return (
    <div
      className="rounded p-3 sm:p-4 flex flex-col gap-3 sm:gap-4"
      style={{ background: "var(--card)", border: `1px solid ${tint(color, '30')}` }}
    >
      {/* Header: name + status pill */}
      <div className="flex items-start justify-between gap-2">
        <div
          style={{
            fontSize: isMobile ? 9 : 11,
            fontWeight: 600,
            color: "var(--muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Filter size={isMobile ? 10 : 12} />
          {label}
        </div>
        <div
          className="flex items-center gap-1 rounded px-1.5 sm:px-2 py-0.5 sm:py-1"
          style={{ background: tint(color, '15'), border: `1px solid ${tint(color, '40')}`, flexShrink: 0 }}
        >
          <StatusIcon size={isMobile ? 10 : 12} style={{ color }} />
          <span style={{ fontSize: isMobile ? 8 : 10, fontWeight: 700, color, letterSpacing: "0.06em" }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Gauge */}
      <div style={{ display: 'flex', justifyContent: 'center', opacity: isLiveMode ? 1 : 0.55 }}>
        <RadialGauge
          value={gaugeValue}
          unit="bar"
          label={label}
          size={isMobile ? 170 : 210}
          max={gaugeMax}
          bands={bands}
          precision={3}
        />
      </div>

      {/* Thresholds + health summary */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {summaryItems.map((m, idx) => (
          <div key={idx} className="rounded p-1.5 sm:p-2" style={{ background: "var(--muted)" }}>
            <div style={{ fontSize: isMobile ? 7 : 8, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {m.label}
            </div>
            <div style={{ fontSize: isMobile ? 9 : 10, fontFamily: "var(--font-mono)", color: m.color, fontWeight: 600, marginTop: 1 }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Health score bar */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: isMobile ? 9 : 10, color: "var(--muted-foreground)" }}>Filter Health Score</span>
        <div className="flex items-center gap-2">
          <div style={{ width: isMobile ? 60 : 80, height: 4, background: "var(--secondary)", borderRadius: 2 }}>
            <div style={{ width: `${healthScore ?? 0}%`, height: "100%", background: healthColor, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: isMobile ? 9 : 10, fontFamily: "var(--font-mono)", color: healthColor, fontWeight: 600 }}>
            {healthScore === null ? '--' : `${healthScore}%`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export function FiltrationMonitoring() {
  // isLive / systemOn come from the updated DataContext (defaults keep old behaviour)
  const { getValue, getHistory, lastUpdate, isLive = true, systemOn = null } = useData();
  const [timeRange, setTimeRange] = useState('24h');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // What is the plant actually doing right now?
  const mode = !isLive ? 'offline' : (systemOn === false ? 'stopped' : 'live');
  const running = mode === 'live';

  const modeInfo = {
    live:    { text: 'LIVE',          color: '#22c55e' },
    stopped: { text: 'PLANT STOPPED', color: '#eab308' },
    offline: { text: 'NO LIVE DATA',  color: '#ef4444' },
  }[mode];
  const systemText = systemOn === null ? 'unknown' : (systemOn ? 'ON' : 'OFF');

  // Current values. Never fall back to chart history: history is old by definition.
  const filterData = useMemo(() => (
    FILTERS.map((f) => {
      const raw = Number(getValue(f.key));
      return {
        ...f,
        value: running && Number.isFinite(raw) ? raw : 0,
        history: getHistory(f.key) || [],
      };
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [getValue, getHistory, lastUpdate, running]);

  // Merge all series into a single time-aligned array for the trend chart.
  const chartData = useMemo(() => {
    const now = new Date();
    const startTime = timeRange === '24h' ? subHours(now, 24) : subHours(now, 1);

    const dataMap = new Map();
    filterData.forEach((f) => {
      f.history.forEach((d) => {
        const t = new Date(d.time);
        if (t < startTime) return;
        const k = t.getTime();
        if (!dataMap.has(k)) dataMap.set(k, { time: format(t, 'HH:mm'), _t: k });
        dataMap.get(k)[f.short] = d.value;
      });
    });

    return Array.from(dataMap.values())
      .sort((a, b) => a._t - b._t)
      .slice(-50);
  }, [filterData, timeRange]);

  // "Recent average exceeds warning" events — only while the plant is running.
  const filterEvents = useMemo(() => {
    if (!running) return [];
    const events = [];
    filterData.forEach((f) => {
      if (f.history.length <= 10) return;
      const recent = f.history.slice(-10);
      const values = recent.map((d) => Number(d.value) || 0);
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      if (avg > f.warning) {
        events.push({
          time: format(new Date(recent[recent.length - 1].time), 'yyyy-MM-dd HH:mm'),
          filter: f.label,
          event: "High ΔP Warning",
          before: values[0].toFixed(2),
          after: avg.toFixed(2),
          dur: "Monitoring",
          op: "System Auto",
        });
      }
    });
    return events.slice(0, 5);
  }, [filterData, running]);

  return (
    <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4 overflow-auto h-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            <Filter size={isMobile ? 12 : 14} style={{ display: 'inline', marginRight: 4 }} />
            {PAGE_TITLE}
          </div>
          <p style={{ fontSize: isMobile ? 10 : 12, color: "var(--muted-foreground)", marginTop: 2 }}>
            {PAGE_SUBTITLE} • Last live data: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Shows exactly what the page believes about the plant */}
          <div
            title="Feed status · value of RO5-SystemOperation"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '3px 10px', borderRadius: 20,
              background: `${modeInfo.color}18`, border: `1px solid ${modeInfo.color}40`,
              fontSize: isMobile ? 9 : 10, fontWeight: 700, color: modeInfo.color, letterSpacing: '0.05em',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: modeInfo.color }} />
            {modeInfo.text} · System: {systemText}
          </div>
          {['1h', '24h'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: isMobile ? '3px 10px' : '4px 12px',
                borderRadius: 4,
                background: timeRange === range ? '#0ea5e9' : 'var(--secondary)',
                color: timeRange === range ? 'white' : 'var(--muted-foreground)',
                border: '1px solid var(--border)',
                fontSize: isMobile ? 9 : 10,
                cursor: 'pointer',
              }}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Banner when not running */}
      {!running && (
        <div
          className="rounded p-2 sm:p-3"
          style={{
            background: `${modeInfo.color}10`,
            border: `1px solid ${modeInfo.color}30`,
            borderLeft: `4px solid ${modeInfo.color}`,
            fontSize: isMobile ? 10 : 12,
            color: modeInfo.color,
          }}
        >
          {mode === 'offline'
            ? 'No live data from the plant. Gauges are cleared; the trend below shows recorded history only.'
            : 'The plant reports it is not operating. Gauges are at zero; the trend below shows recorded history only.'}
        </div>
      )}

      {/* Gauges — driven by FILTERS */}
      <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: isMobile ? "1fr" : `repeat(${FILTERS.length}, 1fr)` }}>
        {filterData.map((f) => (
          <FilterGaugeCard
            key={f.key}
            value={f.value}
            filter={f}
            lastUpdate={lastUpdate}
            mode={mode}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Trend chart */}
      <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
          <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {TREND_TITLE} — {timeRange === '24h' ? '24 Hours' : '1 Hour'}
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {FILTERS.map((f) => (
              <div key={f.key} className="flex items-center gap-1">
                <div style={{ width: 12, height: 2, background: f.color, borderRadius: 1 }} />
                <span style={{ fontSize: isMobile ? 7 : 9, color: "var(--muted-foreground)" }}>{f.short}</span>
              </div>
            ))}
            {!isMobile && (
              <>
                <div className="flex items-center gap-1">
                  <div style={{ width: 12, height: 1, borderTop: "1px dashed #eab308" }} />
                  <span style={{ fontSize: 9, color: "#eab308" }}>Warning ({STAGE_DP_WARNING.toFixed(1)} bar)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div style={{ width: 12, height: 1, borderTop: "1px dashed #ef4444" }} />
                  <span style={{ fontSize: 9, color: "#ef4444" }}>Critical ({STAGE_DP_CRITICAL.toFixed(1)} bar)</span>
                </div>
              </>
            )}
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e" }}
                axisLine={false}
                tickLine={false}
                interval={chartData.length > 20 ? Math.floor(chartData.length / 10) : 0}
              />
              <YAxis
                tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.toFixed(2)}
                domain={[0, STAGE_DP_CRITICAL * 1.2]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={STAGE_DP_WARNING}  stroke="#eab308" strokeDasharray="4 3" strokeWidth={1} />
              <ReferenceLine y={STAGE_DP_CRITICAL} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
              {FILTERS.map((f) => (
                <Line
                  key={f.key}
                  type="monotone"
                  dataKey={f.short}
                  stroke={f.color}
                  strokeWidth={2}
                  dot={false}
                  name={f.label}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)' }}>
            <AlertCircle size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p>Waiting for data...</p>
            <p style={{ fontSize: 10, marginTop: 4 }}>Data will appear once available</p>
          </div>
        )}

        {/* Mobile legend for thresholds */}
        {isMobile && (
          <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-1">
              <div style={{ width: 12, height: 1, borderTop: "1px dashed #eab308" }} />
              <span style={{ fontSize: 8, color: "#eab308" }}>Warning ({STAGE_DP_WARNING.toFixed(1)} bar)</span>
            </div>
            <div className="flex items-center gap-1">
              <div style={{ width: 12, height: 1, borderTop: "1px dashed #ef4444" }} />
              <span style={{ fontSize: 8, color: "#ef4444" }}>Critical ({STAGE_DP_CRITICAL.toFixed(1)} bar)</span>
            </div>
          </div>
        )}
      </div>

      {/* Events table */}
      <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          <Clock size={isMobile ? 10 : 12} style={{ display: 'inline', marginRight: 4 }} />
          Recent Filter Events
        </div>

        {filterEvents.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 10 }}>
            {running ? 'No recent events. All filters operating normally.' : 'No live events while the plant is not running.'}
          </div>
        ) : isMobile ? (
          <div className="flex flex-col gap-2">
            {filterEvents.map((r, idx) => (
              <div key={idx} className="rounded p-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)" }}>{r.filter}</span>
                  <span style={{ fontSize: 10, color: '#eab308' }}>{r.event}</span>
                </div>
                <div style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                  {r.time}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>Before: <span style={{ color: "var(--foreground)" }}>{r.before} bar</span></span>
                  <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>After: <span style={{ color: "#22c55e" }}>{r.after} bar</span></span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>Duration: <span style={{ color: "var(--foreground)" }}>{r.dur}</span></span>
                  <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>Operator: <span style={{ color: "var(--foreground)" }}>{r.op}</span></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr>
                  {["Timestamp", "Filter", "Event", "dP Before", "dP After", "Duration", "Operator"].map((h, idx) => (
                    <th key={idx} style={{ padding: "6px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filterEvents.map((r, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                    <td style={{ padding: "7px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.time}</td>
                    <td style={{ padding: "7px 10px", fontSize: 10, color: "var(--foreground)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.filter}</td>
                    <td style={{ padding: "7px 10px", fontSize: 10, color: '#eab308', borderBottom: "1px solid var(--border)" }}>{r.event}</td>
                    <td style={{ padding: "7px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.before} bar</td>
                    <td style={{ padding: "7px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "#22c55e", borderBottom: "1px solid var(--border)" }}>{r.after} bar</td>
                    <td style={{ padding: "7px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.dur}</td>
                    <td style={{ padding: "7px 10px", fontSize: 10, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.op}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FiltrationMonitoring;