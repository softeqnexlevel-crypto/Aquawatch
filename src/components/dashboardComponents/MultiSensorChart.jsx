// components/dashboardComponents/MultiSensorChart.jsx
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from 'date-fns';
import { COLORS, SENSOR_MAP } from '../Dashboard';

export const MultiSensorChart = ({ data, sensors, height = 250 }) => {
  const [selectedSensors, setSelectedSensors] = useState(sensors || []);
  const [normalize, setNormalize] = useState(false);

  const chartData = useMemo(() => {
    if (!selectedSensors || selectedSensors.length === 0) return [];

    const timePoints = new Set();
    const sensorData = {};

    selectedSensors.forEach(key => {
      const history = data.history?.[key] || [];
      if (history.length === 0) return;
      sensorData[key] = history;
      history.forEach(d => {
        if (d && d.time) {
          timePoints.add(d.time);
        }
      });
    });

    if (timePoints.size === 0) return [];

    return Array.from(timePoints).sort().map(time => {
      const point = { time };
      selectedSensors.forEach(key => {
        const value = sensorData[key]?.find(d => d.time === time)?.value;
        if (value !== undefined && value !== null) {
          point[key] = normalize ? (value / (sensorData[key]?.reduce((a, b) => a + (b.value || 0), 0) / (sensorData[key]?.length || 1) || 1)) : value;
        }
      });
      return point;
    });
  }, [data.history, selectedSensors, normalize]);

  const getSensorColor = (key) => SENSOR_MAP[key]?.color || COLORS.primary;
  const getSensorLabel = (key) => SENSOR_MAP[key]?.label || key;
  const getSensorUnit = (key) => SENSOR_MAP[key]?.unit || '';

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 16,
        textAlign: 'center',
        height: height + 60
      }}>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
          Select sensors to compare
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
          Sensor Comparison
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
            <input
              type="checkbox"
              checked={normalize}
              onChange={() => setNormalize(!normalize)}
              style={{ marginRight: 4 }}
            />
            Normalize
          </label>
          <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
            {selectedSensors.length} sensors active
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="time"
            tickFormatter={time => format(new Date(time), 'HH:mm')}
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            domain={normalize ? [0, 2] : ['auto', 'auto']}
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
                  {payload.map((p, idx) => (
                    <p key={idx} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: p.color }}>
                      {getSensorLabel(p.name)}: {p.value?.toFixed(2)} {getSensorUnit(p.name)}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10 }}
            formatter={(value) => getSensorLabel(value)}
          />
          {selectedSensors.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={getSensorColor(key)}
              strokeWidth={2}
              dot={false}
              name={key}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};