// components/dashboardComponents/DistributionHistogram.jsx
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS, SENSOR_MAP } from '../Dashboard';

export const DistributionHistogram = ({ data, sensorKey }) => {
  const [bins, setBins] = useState(20);
  const history = data?.history?.[sensorKey] || [];
  const sensor = SENSOR_MAP[sensorKey] || { label: sensorKey || 'Sensor', color: COLORS.primary };

  // Picks enough decimal places that adjacent bin edges don't round to
  // the same displayed value. A fixed .toFixed(1) works fine when the
  // data spans a wide range, but collapses to identical labels (e.g.
  // "11.3-11.3" repeated) when the range is tiny — like RO Pressure
  // barely moving between 11.31 and 11.32 across only a few readings.
  const getPrecision = (binSize) => {
    if (!isFinite(binSize) || binSize <= 0) return 2;
    const decimals = Math.ceil(-Math.log10(binSize));
    return Math.min(Math.max(decimals, 1), 6); // clamp to 1–6 decimals
  };

  const histogramData = useMemo(() => {
    if (!history || history.length === 0) return [];

    const values = history.map(d => d.value).filter(v => v !== undefined && v !== null && !isNaN(v));
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range === 0) {
      return [{ range: `${min.toFixed(2)}`, label: min.toFixed(2), count: values.length }];
    }

    // Don't create more bins than there is real data to fill them with —
    // 20 bins for 4 readings just produces a wall of empty, overlapping
    // labels. Cap to the smaller of: what the user picked, or a sane
    // number derived from how many readings actually exist.
    const effectiveBins = Math.max(1, Math.min(bins, values.length));
    const binSize = range / effectiveBins;
    const precision = getPrecision(binSize);

    const binsArray = Array.from({ length: effectiveBins }, (_, i) => {
      const start = min + i * binSize;
      const end = min + (i + 1) * binSize;
      return {
        range: `${start.toFixed(precision)}-${end.toFixed(precision)}`, // full range — shown in tooltip
        label: start.toFixed(precision),                                 // short label — shown on axis
        count: 0,
        start,
        end,
      };
    });

    values.forEach(v => {
      const binIndex = Math.min(Math.floor((v - min) / binSize), effectiveBins - 1);
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
            n={values.length}{histogramData.length > 1 && histogramData.length < bins ? ` · ${histogramData.length} bins used` : ''}
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
        <span>Max: <span style={{ color: COLORS.success, fontFamily: 'var(--font-mono)' }}>{Math.max(...values).toFixed(2)}</span></span>
      </div>

      {histogramData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              angle={-40}
              textAnchor="end"
              height={40}
              interval={0}
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