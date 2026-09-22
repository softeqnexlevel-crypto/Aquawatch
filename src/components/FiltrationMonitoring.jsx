// components/FiltrationMonitoring.jsx - FULLY MOBILE RESPONSIVE

import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { AlertTriangle, CheckCircle, AlertCircle, Filter, Clock, ChevronLeft } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { format, subHours } from 'date-fns';

// Generic radial gauge for Delta P sensors
import { RadialGauge, classifyByBands } from './dashboardComponents/Radialgauge';

// ---------------------------------------------------------------------------
// Differential pressure guidelines
//
// Stage 1 / Stage 2 membrane elements share the same OEM guideline: 1.5 bar
// critical. Warning is set at 80% of critical (1.2 bar) as an early-alert
// buffer — adjust STAGE_DP_WARNING if you want a different margin.
//
// The media filter is a separate asset with its own, tighter guideline, so it
// is deliberately NOT derived from the membrane thresholds.
// ---------------------------------------------------------------------------
const STAGE_DP_CRITICAL = 1.5;
const STAGE_DP_WARNING  = 1.2;

const MEDIA_FILTER_DP_WARNING  = 0.30;
const MEDIA_FILTER_DP_CRITICAL = 0.50;

// Shared band definitions so the gauges, the summary cards, and the trend
// chart can't drift apart. Colors intentionally match the legacy palette.
const STAGE_DP_BANDS = [
  { key: 'normal',   label: 'Normal',   min: 0,                  max: STAGE_DP_WARNING,  color: '#22c55e' },
  { key: 'warning',  label: 'Warning',  min: STAGE_DP_WARNING,   max: STAGE_DP_CRITICAL, color: '#eab308' },
  { key: 'critical', label: 'Critical', min: STAGE_DP_CRITICAL,  max: STAGE_DP_CRITICAL * 1.5, color: '#ef4444' },
];

const MEDIA_FILTER_DP_BANDS = [
  { key: 'normal',   label: 'Normal',   min: 0,                         max: MEDIA_FILTER_DP_WARNING,  color: '#22c55e' },
  { key: 'warning',  label: 'Warning',  min: MEDIA_FILTER_DP_WARNING,   max: MEDIA_FILTER_DP_CRITICAL, color: '#eab308' },
  { key: 'critical', label: 'Critical', min: MEDIA_FILTER_DP_CRITICAL,  max: MEDIA_FILTER_DP_CRITICAL * 1.5, color: '#ef4444' },
];

// Gauge max = 1.5× critical so the needle has visible travel past the red line.
const STAGE_DP_GAUGE_MAX  = STAGE_DP_CRITICAL * 1.5;        // 2.25 bar
const MEDIA_DP_GAUGE_MAX  = MEDIA_FILTER_DP_CRITICAL * 1.5; // 0.75 bar

// Human-readable names for each monitored filter asset.
const FILTER_LABELS = {
  stage1: 'Stage 1 Differential Pressure',
  stage2: 'Stage 2 Differential Pressure',
  media:  'Media Filter Differential Pressure',
};

// Page / section headings, centralised so a rename touches one place.
const PAGE_TITLE    = 'Stage 1 Differential Pressure Monitoring';
const PAGE_SUBTITLE = 'Real-time monitoring';
const TREND_TITLE   = 'Stage 1 Differential Pressure Trend';

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
// Wraps the shared <RadialGauge /> with the surrounding status chrome:
// header (icon + name), status pill, band thresholds, health score, and
// the "last update" line. Keeping this wrapper local means FiltrationMonitoring
// stays readable and the gauge component itself stays generic.
function FilterGaugeCard({
  value,
  label,
  bands,
  max,
  warning,
  critical,
  lastUpdate,
  isMobile,
  accentColor = "#0ea5e9",
}) {
  const hasValue = Number.isFinite(value);
  const band = classifyByBands(value, bands);
  const color = !hasValue ? 'var(--muted-foreground)' : (band?.color ?? '#22c55e');
  const statusLabel = !hasValue ? 'NO DATA' : (band?.label ?? 'NORMAL').toUpperCase();

  // Health score: 100% at 0 bar, 0% at critical. Clamped for display.
  const pct = hasValue ? Math.min((value / critical) * 100, 100) : 0;
  const healthScore = hasValue ? Math.max(0, Math.round(100 - pct)) : 0;
  const healthColor = healthScore > 70 ? '#22c55e' : healthScore > 50 ? '#eab308' : '#ef4444';

  const StatusIcon =
    !hasValue ? AlertCircle :
    value >= critical ? AlertTriangle :
    value >= warning ? AlertCircle :
    CheckCircle;

  return (
    <div
      className="rounded p-3 sm:p-4 flex flex-col gap-3 sm:gap-4"
      style={{ background: "var(--card)", border: `1px solid ${color}30` }}
    >
      {/* Header: name + status pill */}
      <div className="flex items-start justify-between gap-2">
        <div style={{ minWidth: 0 }}>
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
        </div>
        <div
          className="flex items-center gap-1 rounded px-1.5 sm:px-2 py-0.5 sm:py-1"
          style={{ background: `${color}15`, border: `1px solid ${color}40`, flexShrink: 0 }}
        >
          <StatusIcon size={isMobile ? 10 : 12} style={{ color }} />
          <span style={{ fontSize: isMobile ? 8 : 10, fontWeight: 700, color, letterSpacing: "0.06em" }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* The gauge itself */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <RadialGauge
          value={hasValue ? value : undefined}
          unit="bar"
          label={label}
          size={isMobile ? 170 : 210}
          max={max}
          bands={bands}
          precision={3}
        />
      </div>

      {/* Thresholds + health summary */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {[
          { label: "Warning",      value: `${warning.toFixed(2)} bar`,  color: "#eab308" },
          { label: "Critical",     value: `${critical.toFixed(2)} bar`, color: "#ef4444" },
          { label: "Health Score", value: `${healthScore}%`,            color: healthColor },
          { label: "Last Update",  value: lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--', color: "var(--muted-foreground)" },
        ].map((m, idx) => (
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
            <div
              style={{
                width: `${healthScore}%`,
                height: "100%",
                background: healthColor,
                borderRadius: 2,
              }}
            />
          </div>
          <span style={{ fontSize: isMobile ? 9 : 10, fontFamily: "var(--font-mono)", color: healthColor, fontWeight: 600 }}>
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
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use the correct RO5- prefixed keys
  const stage1Delta  = getValue('RO5-Stage1Delta') || 0;
  const stage2Delta  = getValue('RO5-Stage2Delta') || 0;
  const filterDeltaP = getValue('RO5-MediaFilterDeltaP') || 0;

  // Get history with the correct RO5- prefixed keys
  const stage1History = getHistory('RO5-Stage1Delta');
  const stage2History = getHistory('RO5-Stage2Delta');
  const filterHistory = getHistory('RO5-MediaFilterDeltaP');

  // Process data for chart
  const chartData = useMemo(() => {
    const now = new Date();
    const startTime = timeRange === '24h' ? subHours(now, 24) : subHours(now, 1);

    const dataMap = new Map();

    const addSeries = (history, key) => {
      if (!history || history.length === 0) return;
      history.forEach(d => {
        const time = new Date(d.time);
        if (time >= startTime) {
          const k = time.getTime();
          if (!dataMap.has(k)) dataMap.set(k, { time: format(time, 'HH:mm') });
          dataMap.get(k)[key] = d.value;
        }
      });
    };

    addSeries(stage1History, 'filter1');
    addSeries(stage2History, 'filter2');
    addSeries(filterHistory, 'filterDP');

    return Array.from(dataMap.values())
      .sort((a, b) => {
        const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
        const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
        return timeA - timeB;
      })
      .slice(-50);
  }, [stage1History, stage2History, filterHistory, timeRange]);

  // Generate filter events from real data
  const filterEvents = useMemo(() => {
    const events = [];

    const check = (history, filterName, warning) => {
      if (!history || history.length <= 10) return;
      const recent = history.slice(-10);
      const avg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
      if (avg > warning) {
        events.push({
          time: format(new Date(), 'yyyy-MM-dd HH:mm'),
          filter: filterName,
          event: "High ΔP Warning",
          before: recent[0]?.value?.toFixed(2) || '0.00',
          after: avg.toFixed(2),
          dur: "Monitoring",
          op: "System Auto",
        });
      }
    };

    check(stage1History, FILTER_LABELS.stage1, STAGE_DP_WARNING);
    check(stage2History, FILTER_LABELS.stage2, STAGE_DP_WARNING);
    check(filterHistory, FILTER_LABELS.media,  MEDIA_FILTER_DP_WARNING);

    return events.slice(0, 5);
  }, [stage1History, stage2History, filterHistory]);

  // Latest values for gauges
  const last = chartData[chartData.length - 1];
  const latestF1        = last?.filter1  ?? stage1Delta;
  const latestF2        = last?.filter2  ?? stage2Delta;
  const latestFilterDP  = last?.filterDP ?? filterDeltaP;

  // Health status helper used by the summary cards below the trend chart.
  const healthStatus = (value, warning, critical) => {
    if (value >= critical) return { status: 'Critical', color: '#ef4444', icon: AlertTriangle };
    if (value >= warning)  return { status: 'Warning',  color: '#eab308', icon: AlertCircle };
    return { status: 'Normal', color: '#22c55e', icon: CheckCircle };
  };

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
            {PAGE_SUBTITLE} • Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['1h', '24h'].map(range => (
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

      {/* Gauges - Responsive grid */}
      <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)" }}>
        <FilterGaugeCard
          value={latestF1}
          label={FILTER_LABELS.stage1}
          bands={STAGE_DP_BANDS}
          max={STAGE_DP_GAUGE_MAX}
          warning={STAGE_DP_WARNING}
          critical={STAGE_DP_CRITICAL}
          lastUpdate={lastUpdate}
          isMobile={isMobile}
          accentColor="#0ea5e9"
        />
        <FilterGaugeCard
          value={latestF2}
          label={FILTER_LABELS.stage2}
          bands={STAGE_DP_BANDS}
          max={STAGE_DP_GAUGE_MAX}
          warning={STAGE_DP_WARNING}
          critical={STAGE_DP_CRITICAL}
          lastUpdate={lastUpdate}
          isMobile={isMobile}
          accentColor="#14b8a6"
        />
        <FilterGaugeCard
          value={latestFilterDP}
          label={FILTER_LABELS.media}
          bands={MEDIA_FILTER_DP_BANDS}
          max={MEDIA_DP_GAUGE_MAX}
          warning={MEDIA_FILTER_DP_WARNING}
          critical={MEDIA_FILTER_DP_CRITICAL}
          lastUpdate={lastUpdate}
          isMobile={isMobile}
          accentColor="#a78bfa"
        />
      </div>

      {/* Pressure trend chart */}
      <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
          <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {TREND_TITLE} — {timeRange === '24h' ? '24 Hours' : '1 Hour'}
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              <div style={{ width: 12, height: 2, background: "#0ea5e9", borderRadius: 1 }} />
              <span style={{ fontSize: isMobile ? 7 : 9, color: "var(--muted-foreground)" }}>Stage 1</span>
            </div>
            <div className="flex items-center gap-1">
              <div style={{ width: 12, height: 2, background: "#14b8a6", borderRadius: 1 }} />
              <span style={{ fontSize: isMobile ? 7 : 9, color: "var(--muted-foreground)" }}>Stage 2</span>
            </div>
            <div className="flex items-center gap-1">
              <div style={{ width: 12, height: 2, background: "#a78bfa", borderRadius: 1 }} />
              <span style={{ fontSize: isMobile ? 7 : 9, color: "var(--muted-foreground)" }}>Media</span>
            </div>
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
                tickFormatter={v => v.toFixed(2)}
                domain={[0, 1.8]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={STAGE_DP_WARNING}  stroke="#eab308" strokeDasharray="4 3" strokeWidth={1} />
              <ReferenceLine y={STAGE_DP_CRITICAL} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
              <Line type="monotone" dataKey="filter1"  stroke="#0ea5e9" strokeWidth={2} dot={false} name="Stage 1"      connectNulls />
              <Line type="monotone" dataKey="filter2"  stroke="#14b8a6" strokeWidth={2} dot={false} name="Stage 2"      connectNulls />
              <Line type="monotone" dataKey="filterDP" stroke="#a78bfa" strokeWidth={2} dot={false} name="Media Filter" connectNulls />
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

      {/* Status Summary - Responsive */}
      <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)" }}>
        {[
          { label: FILTER_LABELS.stage1, value: latestF1,       warning: STAGE_DP_WARNING,        critical: STAGE_DP_CRITICAL },
          { label: FILTER_LABELS.stage2, value: latestF2,       warning: STAGE_DP_WARNING,        critical: STAGE_DP_CRITICAL },
          { label: FILTER_LABELS.media,  value: latestFilterDP, warning: MEDIA_FILTER_DP_WARNING, critical: MEDIA_FILTER_DP_CRITICAL },
        ].map(item => {
          const status = healthStatus(item.value, item.warning, item.critical);
          const StatusIcon = status.icon;
          return (
            <div key={item.label} className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: `1px solid ${status.color}30` }}>
              <div style={{ fontSize: isMobile ? 8 : 10, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {item.label}
              </div>
              <div style={{ fontSize: isMobile ? 16 : 20, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)", marginTop: 2 }}>
                {item.value.toFixed(3)} <span style={{ fontSize: isMobile ? 10 : 12, color: "var(--muted-foreground)" }}>bar</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, fontSize: isMobile ? 9 : 10, color: status.color }}>
                <StatusIcon size={isMobile ? 10 : 12} />
                {status.status}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter events table - Responsive */}
      <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          <Clock size={isMobile ? 10 : 12} style={{ display: 'inline', marginRight: 4 }} />
          Recent Filter Events
        </div>

        {isMobile ? (
          // Mobile card view for events
          <div className="flex flex-col gap-2">
            {filterEvents.length > 0 ? (
              filterEvents.map((r, idx) => (
                <div key={idx} className="rounded p-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)" }}>{r.filter}</span>
                    <span style={{ fontSize: 10, color: r.event.includes('Warning') ? '#eab308' : '#0ea5e9' }}>{r.event}</span>
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
              ))
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 10 }}>
                No recent events. All filters operating normally.
              </div>
            )}
          </div>
        ) : (
          // Desktop table view
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
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
        )}
      </div>
    </div>
  );
}

export default FiltrationMonitoring;