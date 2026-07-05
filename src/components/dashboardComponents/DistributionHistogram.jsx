// components/dashboardComponents/DistributionHistogram.jsx
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS, SENSOR_MAP } from '../Dashboard';

export const DistributionHistogram = ({ data, sensorKey }) => {
  const [bins, setBins] = useState(20);
  const history = data?.history?.[sensorKey] || [];
  const sensor = SENSOR_MAP[sensorKey] || { label: sensorKey || 'Sensor', color: COLORS.primary };

  const histogramData = useMemo(() => {
    if (!history || history.length === 0) return [];

    const values = history.map(d => d.value).filter(v => v !== undefined && v !== null && !isNaN(v));
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range === 0) {
      return [{ range: `${min.toFixed(1)}`, count: values.length }];
    }

    const binSize = range / bins;

    const binsArray = Array.from({ length: bins }, (_, i) => ({
      range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
      count: 0,
      start: min + i * binSize,
      end: min + (i + 1) * binSize
    }));

    values.forEach(v => {
      const binIndex = Math.min(Math.floor((v - min) / binSize), bins - 1);
      if (binsArray[binIndex]) {
        binsArray[binIndex].count++;
      }
    });

    return binsArray;
  }, [history, bins]);

  if (!history || history.length === 0) {
    return (
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 16,
        textAlign: 'center'
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
          {sensor.label} Distribution
        </span>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 20 }}>
          No data available
        </p>
      </div>
    );
  }

  const values = history.map(d => d.value).filter(v => v !== undefined && v !== null && !isNaN(v));
  const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const median = values.length > 0 ? [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] : 0;

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 16
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
        gap: 8
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
          {sensor.label} Distribution
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={bins}
            onChange={(e) => setBins(Number(e.target.value))}
            style={{
              padding: '2px 8px',
              fontSize: 10,
              borderRadius: 3,
              background: 'var(--secondary)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              cursor: 'pointer'
            }}
          >
            {[10, 20, 30, 50].map(n => (
              <option key={n} value={n}>{n} bins</option>
            ))}
          </select>
          <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
            n={values.length}
          </span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 12,
        fontSize: 10,
        color: 'var(--muted-foreground)',
        flexWrap: 'wrap'
      }}>
        <span>Mean: <span style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>{mean.toFixed(2)}</span></span>
        <span>Median: <span style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>{median.toFixed(2)}</span></span>
        <span>Min: <span style={{ color: COLORS.danger, fontFamily: 'var(--font-mono)' }}>{Math.min(...values).toFixed(2)}</span></span>
        <span>Max: <span style={{ color: COLORS.success, fontFamily: 'var(--font-mono)' }}>{Math.max(...values).toFixed(2)}</span></span>
      </div>

      {histogramData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 8, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(bins / 10)}
            />
            <YAxis
              tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{
                    background: '#0a1828',
                    border: '1px solid rgba(14,165,233,0.2)',
                    borderRadius: 4,
                    padding: '8px 12px'
                  }}>
                    <p style={{ fontSize: 10, color: '#4d7a9e' }}>Range: {d.range}</p>
                    <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: COLORS.primary }}>
                      Count: {d.count}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
                      {((d.count / values.length) * 100).toFixed(1)}%
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              fill={sensor.color || COLORS.primary}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            Insufficient data for histogram
          </p>
        </div>
      )}
    </div>
  );
};