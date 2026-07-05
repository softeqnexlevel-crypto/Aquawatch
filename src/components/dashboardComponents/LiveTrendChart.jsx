// components/dashboardComponents/LiveTrendChart.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import { Play, Pause, Maximize2, Minimize2 } from "lucide-react";
import { format, subHours, subDays, subWeeks } from 'date-fns';
import { COLORS, SENSOR_MAP } from '../Dashboard';

export const LiveTrendChart = ({ data, sensorKey, height = 200, showControls = true }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sensorData = data[sensorKey];
  const history = data.history?.[sensorKey] || [];

  const sensorInfo = SENSOR_MAP[sensorKey] || { label: sensorKey || 'Sensor', unit: '', color: COLORS.primary };

  const getTimeRange = useCallback(() => {
    const now = new Date();
    switch (timeRange) {
      case '1h': return subHours(now, 1);
      case '6h': return subHours(now, 6);
      case '24h': return subDays(now, 1);
      case '7d': return subWeeks(now, 1);
      default: return subHours(now, 1);
    }
  }, [timeRange]);

  const filteredData = useMemo(() => {
    if (!history || history.length === 0) return [];
    const startTime = getTimeRange();
    return history.filter(d => new Date(d.time) >= startTime);
  }, [history, getTimeRange]);

  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;
    const values = filteredData.map(d => d.value).filter(v => v !== undefined && v !== null);
    if (values.length === 0) return null;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: mean,
      current: values[values.length - 1],
      stdDev: stdDev,
      count: values.length
    };
  }, [filteredData]);

  const anomalies = useMemo(() => {
    if (!filteredData || filteredData.length < 10) return [];
    const values = filteredData.map(d => d.value).filter(v => v !== undefined && v !== null);
    if (values.length === 0) return [];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    if (stdDev === 0) return [];

    return filteredData.filter(d => {
      const zScore = Math.abs((d.value - mean) / stdDev);
      return zScore > 2.5;
    });
  }, [filteredData]);

  if (!sensorData) {
    return (
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 16,
        textAlign: 'center',
        height: height + 80
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
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 16,
        textAlign: 'center',
        height: height + 80
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

  return (
    <div style={{
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
      height: isFullscreen ? '100vh' : 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
        gap: 8
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
              {['1h', '6h', '24h', '7d'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    padding: '2px 8px',
                    fontSize: 9,
                    borderRadius: 3,
                    background: timeRange === range ? COLORS.primary : 'transparent',
                    color: timeRange === range ? 'white' : 'var(--muted-foreground)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer'
                  }}
                >
                  {range}
                </button>
              ))}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  padding: '2px 8px',
                  fontSize: 9,
                  borderRadius: 3,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  color: 'var(--muted-foreground)'
                }}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                style={{
                  padding: '2px 8px',
                  fontSize: 9,
                  borderRadius: 3,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  color: 'var(--muted-foreground)'
                }}
              >
                {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            </div>
          )}
        </div>
      </div>

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
            dataKey="time"
            tickFormatter={time => format(new Date(time), 'HH:mm')}
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
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
                  padding: '8px 12px'
                }}>
                  <p style={{ fontSize: 10, color: '#4d7a9e' }}>
                    {format(new Date(label), 'HH:mm:ss')}
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

          {showAnnotations && anomalies.map((anomaly, idx) => (
            <ReferenceArea
              key={idx}
              x1={anomaly.time}
              x2={anomaly.time}
              stroke={COLORS.danger}
              strokeDasharray="3 3"
              label={{ value: '⚠', position: 'insideTop' }}
            />
          ))}

          {stats && stats.stdDev > 0 && (
            <>
              <ReferenceLine y={stats.avg} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" label={{ value: 'μ', position: 'insideBottomRight', fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
              <ReferenceLine y={stats.avg + stats.stdDev} stroke={COLORS.warning} strokeDasharray="3 3" opacity={0.3} />
              <ReferenceLine y={stats.avg - stats.stdDev} stroke={COLORS.warning} strokeDasharray="3 3" opacity={0.3} />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};