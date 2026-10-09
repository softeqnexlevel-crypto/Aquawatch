// components/dashboardComponents/LiveTrendChart.jsx
import React, { useState, useMemo } from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import { Play, Pause, Maximize2, Minimize2 } from "lucide-react";
import { format, subHours, subDays, subWeeks } from 'date-fns';
import { COLORS, SENSOR_MAP } from '../Dashboard';

const RANGE_LABELS = { '1h': '1 hour', '6h': '6 hours', '24h': '24 hours', '7d': '7 days' };

// "12 min", "3.5 h", "2.1 d"
const formatSpan = (ms) => {
  const min = ms / 60000;
  if (min < 1) return '<1 min';
  if (min < 60) return `${Math.round(min)} min`;
  const hrs = min / 60;
  if (hrs < 48) return `${hrs.toFixed(1)} h`;
  return `${(hrs / 24).toFixed(1)} d`;
};

export const LiveTrendChart = ({ data, sensorKey, height = 200, showControls = true }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sensorData = data?.[sensorKey];
  const history = data?.history?.[sensorKey] || [];

  const sensorInfo = SENSOR_MAP[sensorKey] || {
    label: sensorKey || 'Sensor',
    unit: '',
    color: COLORS.primary,
  };

  // Requested window. Recomputed whenever the range changes OR new history
  // arrives, so "now" never goes stale (previously endMs was frozen, which
  // silently dropped every new reading after you picked a range).
  const requestedWindow = useMemo(() => {
    const now = new Date();
    let start;
    switch (timeRange) {
      case '1h':  start = subHours(now, 1); break;
      case '6h':  start = subHours(now, 6); break;
      case '24h': start = subDays(now, 1); break;
      case '7d':  start = subWeeks(now, 1); break;
      default:    start = subHours(now, 1);
    }
    return { startMs: start.getTime(), endMs: now.getTime() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, history]);

  // Raw history -> { t, value } inside the requested window.
  const filteredData = useMemo(() => {
    if (!history || history.length === 0) return [];
    const { startMs, endMs } = requestedWindow;
    return history
      .map((d) => ({ t: new Date(d.time).getTime(), value: d.value, raw: d }))
      .filter((d) => Number.isFinite(d.t) && d.t >= startMs && d.t <= endMs)
      .sort((a, b) => a.t - b.t);
  }, [history, requestedWindow]);

  // Effective X-axis: trimmed to the data we actually have, so a 7d request
  // with 10 minutes of data doesn't squash everything into one pixel column.
  const axis = useMemo(() => {
    const { startMs, endMs } = requestedWindow;
    if (filteredData.length === 0) {
      return { start: startMs, end: endMs, spanMs: endMs - startMs, trimmed: false, dataSpanMs: 0 };
    }
    const firstT = filteredData[0].t;
    const lastT = filteredData[filteredData.length - 1].t;
    const dataSpanMs = Math.max(lastT - firstT, 0);

    // Small padding so the first/last points aren't glued to the edges.
    const pad = Math.max(dataSpanMs * 0.02, 15 * 1000);
    const start = Math.max(startMs, firstT - pad);
    const end = Math.min(endMs, Math.max(lastT + pad, endMs - 0)); // keep "now" on the right edge
    const spanMs = end - start;

    // Trimmed when data covers noticeably less than the requested window.
    const trimmed = dataSpanMs < (endMs - startMs) * 0.9;
    return { start, end, spanMs, trimmed, dataSpanMs };
  }, [filteredData, requestedWindow]);

  // Tick format chosen from the VISIBLE span, not the requested range.
  const tickFormat = useMemo(() => {
    const h = axis.spanMs / 3600000;
    if (h <= 0.25) return 'HH:mm:ss';
    if (h <= 24) return 'HH:mm';
    if (h <= 48) return 'dd MMM HH:mm';
    return 'dd MMM';
  }, [axis.spanMs]);

  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;
    const values = filteredData.map((d) => d.value).filter((v) => v !== undefined && v !== null);
    if (values.length === 0) return null;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: mean,
      current: values[values.length - 1],
      stdDev,
      count: values.length,
    };
  }, [filteredData]);

  const anomalies = useMemo(() => {
    if (!filteredData || filteredData.length < 10) return [];
    const values = filteredData.map((d) => d.value).filter((v) => v !== undefined && v !== null);
    if (values.length === 0) return [];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    if (stdDev === 0) return [];
    return filteredData.filter((d) => Math.abs((d.value - mean) / stdDev) > 2.5);
  }, [filteredData]);

  const hasNoDataInWindow = history && history.length > 0 && filteredData.length === 0;

  if (!sensorData) {
    return (
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: 16, textAlign: 'center', height: height + 80,
      }}>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
          No data available for this sensor
        </p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: 16, textAlign: 'center', height: height + 80,
      }}>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
          Waiting for data stream...
        </p>
        <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 4 }}>
          {sensorInfo.label}: {sensorData.value?.toFixed(2) || '--'} {sensorInfo.unit}
        </p>
      </div>
    );
  }

  const chartHeight = isFullscreen ? height * 1.5 : height;

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
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12, flexWrap: 'wrap', gap: 8,
      }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
            {sensorInfo.label}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', marginLeft: 8 }}>
            {sensorInfo.unit}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {stats && (
            <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--muted-foreground)' }}>
              <span>Min: <span style={{ color: COLORS.danger }}>{stats.min.toFixed(1)}</span></span>
              <span>Avg: <span style={{ color: COLORS.warning }}>{stats.avg.toFixed(1)}</span></span>
              <span>Max: <span style={{ color: COLORS.success }}>{stats.max.toFixed(1)}</span></span>
              <span>σ: <span style={{ color: COLORS.purple }}>{stats.stdDev.toFixed(2)}</span></span>
            </div>
          )}
          {showControls && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['1h', '6h', '24h', '7d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    ...controlBtn,
                    background: timeRange === range ? COLORS.primary : 'transparent',
                    color: timeRange === range ? 'white' : 'var(--muted-foreground)',
                  }}
                >
                  {range}
                </button>
              ))}
              <button onClick={() => setIsPlaying(!isPlaying)} style={controlBtn}>
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button onClick={() => setIsFullscreen(!isFullscreen)} style={controlBtn}>
                {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Coverage note: explains why a 7d/24h view may show less than requested */}
      {!hasNoDataInWindow && axis.trimmed && (
        <div style={{
          fontSize: 10, color: COLORS.warning, marginBottom: 8,
          padding: '4px 8px', borderRadius: 4,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          Showing {formatSpan(axis.dataSpanMs)} of data. {RANGE_LABELS[timeRange]} requested, but live history only
          covers the time since this page was opened.
        </div>
      )}

      {hasNoDataInWindow ? (
        <div style={{
          height: chartHeight, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)',
          fontSize: 11, border: '1px dashed var(--border)', borderRadius: 6,
        }}>
          <p>No data in the last {timeRange}.</p>
          <p style={{ fontSize: 10, marginTop: 4, opacity: 0.75 }}>
            Try a wider range or wait for the next reading.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={filteredData}>
            <defs>
              <linearGradient id={`gradient-${sensorKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sensorInfo.color || COLORS.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={sensorInfo.color || COLORS.primary} stopOpacity={0.02} />
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
              minTickGap={30}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{
                    background: '#0a1828',
                    border: '1px solid rgba(14,165,233,0.2)',
                    borderRadius: 4,
                    padding: '8px 12px',
                  }}>
                    <p style={{ fontSize: 10, color: '#4d7a9e' }}>
                      {format(new Date(label), axis.spanMs > 24 * 3600000 ? 'dd MMM HH:mm:ss' : 'HH:mm:ss')}
                    </p>
                    <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: payload[0].color }}>
                      {payload[0].value?.toFixed(2)} {sensorInfo.unit}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={sensorInfo.color || COLORS.primary}
              strokeWidth={2}
              fill={`url(#gradient-${sensorKey})`}
              name={sensorInfo.label}
              isAnimationActive={isPlaying}
            />

            {showAnnotations &&
              anomalies.map((anomaly, idx) => (
                <ReferenceArea
                  key={idx}
                  x1={anomaly.t}
                  x2={anomaly.t}
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
      )}
    </div>
  );
};