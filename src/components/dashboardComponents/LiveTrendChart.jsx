// components/dashboardComponents/LiveTrendChart.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { Play, Pause, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { API_BASE_URL } from '../../config';
import { COLORS, SENSOR_MAP } from '../Dashboard';

// ── Optional backend history ───────────────────────────────────────────────
// GET {API_BASE_URL}/api/history?sensor=<key>&from=<ISO>&to=<ISO>&points=<n>
// → [{ time, value }, ...]  or  { data: [...] }
// If this endpoint doesn't exist (404/405) the chart silently falls back to
// live readings for the rest of the session.
const HISTORY_ENDPOINT = `${API_BASE_URL}/api/history`;
const MAX_POINTS = 500;
let historyApiMissing = false; // module-level: remembered across chart instances

const HOUR = 60 * 60 * 1000;
const RANGES = {
  '1h':  { ms: HOUR,          tick: 'HH:mm',  tooltip: 'HH:mm:ss',     refreshMs: 30_000 },
  '6h':  { ms: 6 * HOUR,      tick: 'HH:mm',  tooltip: 'HH:mm:ss',     refreshMs: 30_000 },
  '24h': { ms: 24 * HOUR,     tick: 'HH:mm',  tooltip: 'dd MMM HH:mm', refreshMs: 120_000 },
  '7d':  { ms: 7 * 24 * HOUR, tick: 'dd MMM', tooltip: 'dd MMM HH:mm', refreshMs: 120_000 },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const toPoint = (row) => {
  const t = new Date(row?.time ?? row?.timestamp).getTime();
  const value = Number(row?.value);
  return Number.isFinite(t) && Number.isFinite(value) ? { t, value } : null;
};

const decimate = (points, max) => {
  if (points.length <= max) return points;
  const step = points.length / max;
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)]);
  out.push(points[points.length - 1]);
  return out;
};

// Picks decimals from magnitude so 0.04 doesn't render as "0.0".
const decimalsFor = (magnitude) => {
  const m = Math.abs(magnitude);
  if (m === 0) return 1;
  if (m < 1) return 3;
  if (m < 10) return 2;
  return 1;
};

const formatSpan = (ms) => {
  const min = ms / 60000;
  if (min < 1) return 'under 1 min';
  if (min < 60) return `${Math.round(min)} min`;
  const h = min / 60;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} days`;
};

// ── Stored history hook (silent when the endpoint doesn't exist) ───────────
function useStoredHistory(sensorKey, timeRange) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(!historyApiMissing);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPoints([]);
    setError(null);
    if (!sensorKey || historyApiMissing) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const { ms, refreshMs } = RANGES[timeRange];
    setLoading(true);

    const load = async () => {
      if (historyApiMissing) return;
      try {
        const to = Date.now();
        const params = new URLSearchParams({
          sensor: sensorKey,
          from: new Date(to - ms).toISOString(),
          to: new Date(to).toISOString(),
          points: String(MAX_POINTS),
        });
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${HISTORY_ENDPOINT}?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (res.status === 404 || res.status === 405) {
          historyApiMissing = true; // endpoint not built yet: stop asking
          setPoints([]);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const rows = Array.isArray(json) ? json : json?.data ?? json?.history ?? [];
        setPoints(rows.map(toPoint).filter(Boolean).sort((a, b) => a.t - b.t));
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load history');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, refreshMs);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [sensorKey, timeRange]);

  return { points, loading, error };
}

// ── Component ──────────────────────────────────────────────────────────────
export const LiveTrendChart = ({ data, sensorKey, height = 200, showControls = true }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [showAnnotations] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const sensorData = data?.[sensorKey];
  const liveHistory = data?.history?.[sensorKey];

  const sensorInfo = SENSOR_MAP[sensorKey] || {
    label: sensorKey || 'Sensor',
    unit: '',
    color: COLORS.primary,
  };
  const range = RANGES[timeRange];
  const color = sensorInfo.color || COLORS.primary;

  const { points: storedPoints, loading, error } = useStoredHistory(sensorKey, timeRange);

  // Pause freezes both the clock and the live feed.
  const frozenLive = useRef(liveHistory);
  if (isPlaying) frozenLive.current = liveHistory;
  const effectiveLive = isPlaying ? liveHistory : frozenLive.current;

  // "now" advances on a timer. It used to be frozen when you clicked a range,
  // which silently dropped every reading that arrived afterwards.
  useEffect(() => {
    if (!isPlaying) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, [isPlaying, timeRange]);

  // Stored + live readings merged by timestamp, limited to the window.
  const chartData = useMemo(() => {
    const startMs = now - range.ms;
    const merged = new Map();
    storedPoints.forEach((p) => merged.set(p.t, p));
    (effectiveLive || []).forEach((row) => {
      const p = toPoint(row);
      if (p) merged.set(p.t, p);
    });
    const inWindow = [...merged.values()]
      .filter((p) => p.t >= startMs)
      .sort((a, b) => a.t - b.t);
    return decimate(inWindow, MAX_POINTS * 2);
  }, [storedPoints, effectiveLive, now, range.ms]);

  // X-axis: full requested range when stored history backs it up; otherwise
  // trimmed to the data we really have so the line fills the plot.
  const axis = useMemo(() => {
    const lastT = chartData.length ? chartData[chartData.length - 1].t : now;
    const end = Math.max(now, lastT);
    const requestedStart = end - range.ms;

    if (chartData.length === 0) {
      return { start: requestedStart, end, partial: false, dataSpanMs: 0 };
    }
    const firstT = chartData[0].t;
    const dataSpanMs = lastT - firstT;
    const hasStored = storedPoints.length > 0;
    const partial = !hasStored && dataSpanMs < range.ms * 0.9;

    if (!partial) return { start: requestedStart, end, partial: false, dataSpanMs };

    const pad = Math.max(dataSpanMs * 0.03, 30_000);
    return { start: Math.max(requestedStart, firstT - pad), end: end + pad / 3, partial: true, dataSpanMs };
  }, [chartData, storedPoints.length, now, range.ms]);

  const tickFormat = useMemo(() => {
    const spanH = (axis.end - axis.start) / HOUR;
    if (spanH <= 0.25) return 'HH:mm:ss';
    if (spanH <= 24) return 'HH:mm';
    if (spanH <= 48) return 'dd MMM HH:mm';
    return 'dd MMM';
  }, [axis.start, axis.end]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map((d) => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
    return { min: Math.min(...values), max: Math.max(...values), avg: mean, stdDev, count: values.length };
  }, [chartData]);

  const anomalies = useMemo(() => {
    if (!stats || chartData.length < 10 || stats.stdDev === 0) return [];
    return chartData.filter((d) => Math.abs((d.value - stats.avg) / stats.stdDev) > 2.5);
  }, [chartData, stats]);

  // ── Early states ─────────────────────────────────────────────────────────
  if (!sensorData) {
    return (
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: 16, textAlign: 'center', height: height + 80,
      }}>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No data available for this sensor</p>
      </div>
    );
  }

  const chartHeight = isFullscreen ? height * 1.5 : height;
  const showSpinner = loading && chartData.length === 0;
  const isEmpty = !loading && chartData.length === 0;
  const dec = stats ? decimalsFor(Math.max(Math.abs(stats.min), Math.abs(stats.max))) : 1;
  const fmt = (v) => (Number.isFinite(v) ? v.toFixed(decimalsFor(v)) : '--');

  const controlBtn = {
    padding: '2px 8px', fontSize: 9, borderRadius: 3, background: 'transparent',
    border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--muted-foreground)',
  };

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 16,
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        width: isFullscreen ? '100vw' : 'auto',
        height: isFullscreen ? '100vh' : 'auto',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12, flexWrap: 'wrap', gap: 8,
      }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{sensorInfo.label}</span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', marginLeft: 8 }}>{sensorInfo.unit}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {stats && (
            <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--muted-foreground)' }}>
              <span>Min: <span style={{ color: COLORS.danger }}>{stats.min.toFixed(dec)}</span></span>
              <span>Avg: <span style={{ color: COLORS.warning }}>{stats.avg.toFixed(dec)}</span></span>
              <span>Max: <span style={{ color: COLORS.success }}>{stats.max.toFixed(dec)}</span></span>
              <span>σ: <span style={{ color: COLORS.purple }}>{stats.stdDev.toFixed(Math.max(dec, 2))}</span></span>
            </div>
          )}

          {showControls && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              {Object.keys(RANGES).map((key) => (
                <button
                  key={key}
                  onClick={() => setTimeRange(key)}
                  style={{
                    ...controlBtn,
                    background: timeRange === key ? COLORS.primary : 'transparent',
                    color: timeRange === key ? 'white' : 'var(--muted-foreground)',
                  }}
                >
                  {key}
                </button>
              ))}
              <button
                onClick={() => setIsPlaying((p) => !p)}
                style={controlBtn}
                title={isPlaying ? 'Pause live updates' : 'Resume live updates'}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button onClick={() => setIsFullscreen((f) => !f)} style={controlBtn}>
                {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Only for real failures (network/500), never for a missing endpoint */}
      {error && (
        <div style={{
          fontSize: 10, color: COLORS.warning, marginBottom: 8, padding: '4px 8px',
          borderRadius: 4, background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
        }}>
          Couldn't load stored history ({error}). Showing live readings only.
        </div>
      )}

      {/* Body */}
      {showSpinner ? (
        <div style={{
          height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, color: 'var(--muted-foreground)', fontSize: 11,
        }}>
          <RefreshCw size={14} className="animate-spin" /> Loading {timeRange} history…
        </div>
      ) : isEmpty ? (
        <div style={{
          height: chartHeight, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)',
          fontSize: 11, border: '1px dashed var(--border)', borderRadius: 6,
        }}>
          <p>No readings in the last {timeRange}.</p>
          <p style={{ fontSize: 10, marginTop: 4, opacity: 0.75 }}>
            Current value: {fmt(Number(sensorData.value))} {sensorInfo.unit}
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${sensorKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={[axis.start, axis.end]}
                allowDataOverflow
                tickFormatter={(t) => format(new Date(t), tickFormat)}
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(v) => v.toFixed(decimalsFor(v))}
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const v = payload[0].value;
                  return (
                    <div style={{
                      background: '#0a1828',
                      border: '1px solid rgba(14,165,233,0.2)',
                      borderRadius: 4,
                      padding: '8px 12px',
                    }}>
                      <p style={{ fontSize: 10, color: '#4d7a9e' }}>
                        {format(new Date(label), (axis.end - axis.start) > 24 * HOUR ? 'dd MMM HH:mm:ss' : 'HH:mm:ss')}
                      </p>
                      <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: payload[0].color }}>
                        {Number.isFinite(v) ? v.toFixed(Math.max(decimalsFor(v), 2)) : '--'} {sensorInfo.unit}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${sensorKey})`}
                name={sensorInfo.label}
                dot={chartData.length < 30 ? { r: 2.5, fill: color } : false}
                isAnimationActive={false}
              />

              {showAnnotations && anomalies.map((a) => (
                <ReferenceArea
                  key={a.t}
                  x1={a.t}
                  x2={a.t}
                  stroke={COLORS.danger}
                  strokeDasharray="3 3"
                  label={{ value: '⚠', position: 'insideTop' }}
                />
              ))}

              {stats && stats.stdDev > 0 && (
                <>
                  <ReferenceLine
                    y={stats.avg}
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="3 3"
                    label={{ value: 'μ', position: 'insideBottomRight', fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                  />
                  <ReferenceLine y={stats.avg + stats.stdDev} stroke={COLORS.warning} strokeDasharray="3 3" opacity={0.3} />
                  <ReferenceLine y={stats.avg - stats.stdDev} stroke={COLORS.warning} strokeDasharray="3 3" opacity={0.3} />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>

          {/* Quiet footnote, not a warning */}
          {axis.partial && (
            <p style={{ fontSize: 9, color: 'var(--muted-foreground)', marginTop: 6, textAlign: 'right', opacity: 0.8 }}>
              Live data only · {formatSpan(axis.dataSpanMs)} collected since this page opened
            </p>
          )}
        </>
      )}
    </div>
  );
};