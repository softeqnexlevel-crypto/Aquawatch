// components/dashboardComponents/DistributionHistogram.jsx
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS, SENSOR_MAP } from '../Dashboard';

// Picks enough decimal places that adjacent bin edges don't round to
// the same displayed value (e.g. "11.3-11.3" repeated when the range is tiny).
const getPrecision = (binSize) => {
  if (!isFinite(binSize) || binSize <= 0) return 2;
  const decimals = Math.ceil(-Math.log10(binSize));
  return Math.min(Math.max(decimals, 1), 6); // clamp to 1–6 decimals
};

export const DistributionHistogram = ({ data, sensorKey }) => {
  const [bins, setBins] = useState(20);
  const history = data?.history?.[sensorKey] || [];
  const sensor = SENSOR_MAP[sensorKey] || { label: sensorKey || 'Sensor', color: COLORS.primary };

  // Unit comes from SENSOR_MAP (bar, m³/h, %, µS/cm, ...) instead of being hardcoded.
  const unit = sensor.unit || '';

  // Valid numeric values only
  const values = useMemo(
    () => history.map(d => d.value).filter(v => v !== undefined && v !== null && !isNaN(v)),
    [history]
  );

  // Summary statistics
  const stats = useMemo(() => {
    if (values.length === 0) return { mean: 0, median: 0, max: 0, min: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
    return {
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      median,
      max: sorted[sorted.length - 1],
      min: sorted[0],
    };
  }, [values]);

  const histogramData = useMemo(() => {
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range === 0) {
      return [{ range: `${min.toFixed(2)}`, label: min.toFixed(2), count: values.length }];
    }

    // Don't create more bins than there is real data to fill them with.
    const effectiveBins = Math.max(1, Math.min(bins, values.length));
    const binSize = range / effectiveBins;
    const precision = getPrecision(binSize);

    const binsArray = Array.from({ length: effectiveBins }, (_, i) => {
      const start = min + i * binSize;
      const end = min + (i + 1) * binSize;
      return {
        range: `${start.toFixed(precision)}-${end.toFixed(precision)}`, // full range — tooltip
        label: start.toFixed(precision),                                 // short label — axis
        count: 0,
        start,
        end,
      };
    });

    values.forEach(v => {
      const binIndex = v === max
        ? effectiveBins - 1
        : Math.min(Math.floor((v - min) / binSize), effectiveBins - 1);
      if (binsArray[binIndex]) binsArray[binIndex].count++;
    });

    return binsArray;
  }, [values, bins]);

  // Empty state
  if (!history || history.length === 0 || values.length === 0) {
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
        <span>Mean: <span style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>{stats.mean.toFixed(2)} {unit}</span></span>
        <span>Median: <span style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>{stats.median.toFixed(2)} {unit}</span></span>
        <span>Max: <span style={{ color: COLORS.success, fontFamily: 'var(--font-mono)' }}>{stats.max.toFixed(2)} {unit}</span></span>
        <span>Min: <span style={{ color: COLORS.warning, fontFamily: 'var(--font-mono)' }}>{stats.min.toFixed(2)} {unit}</span></span>
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
              allowDecimals={false}
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
                    <p style={{ fontSize: 10, color: '#4d7a9e' }}>Range: {d.range} {unit}</p>
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