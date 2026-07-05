// components/dashboardComponents/SystemHealthRadar.jsx
import React, { useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS } from '../Dashboard';

export const SystemHealthRadar = ({ data }) => {
  const metrics = useMemo(() => {
    const getHealth = (key, goodThreshold, warnThreshold) => {
      const sensor = data?.[key];
      if (!sensor) return 0;
      const value = sensor.value;
      if (value === undefined || value === null) return 0;
      if (value <= goodThreshold) return 100;
      if (value <= warnThreshold) return 70 - (value - goodThreshold) / (warnThreshold - goodThreshold) * 30;
      return Math.max(40 - Math.min((value - warnThreshold) / warnThreshold * 40, 40), 10);
    };

    return [
      { subject: 'Membranes', A: getHealth('Stage1Delta', 2.5, 3.5), fullMark: 100 },
      { subject: 'Pressure', A: getHealth('ROPressure', 13, 16), fullMark: 100 },
      { subject: 'Flow', A: getHealth('FEEDFlow', 60, 80), fullMark: 100 },
      { subject: 'Quality', A: getHealth('PureWaterEC', 10, 20), fullMark: 100 },
      { subject: 'Efficiency', A: data?.['SystemRecovery']?.value || 0, fullMark: 100 },
      { subject: 'Filters', A: getHealth('MediaFilterDeltaP', 0.2, 0.4), fullMark: 100 },
    ];
  }, [data]);

  if (!metrics || metrics.every(m => m.A === 0)) {
    return (
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 16,
        textAlign: 'center',
        height: 250
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
          System Health
        </span>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 20 }}>
          Waiting for data...
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
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
          System Health
        </span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={metrics}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            tickFormatter={v => `${v}%`}
          />
          <Radar
            dataKey="A"
            stroke={COLORS.primary}
            fill={COLORS.primary}
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={{
                  background: '#0a1828',
                  border: '1px solid rgba(14,165,233,0.2)',
                  borderRadius: 4,
                  padding: '8px 12px'
                }}>
                  <p style={{ fontSize: 10, color: '#4d7a9e' }}>{payload[0].payload.subject}</p>
                  <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: COLORS.primary }}>
                    {payload[0].value?.toFixed(1)}%
                  </p>
                  <p style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>
                    {payload[0].value > 80 ? '✅ Healthy' : payload[0].value > 60 ? '⚠️ Warning' : '🔴 Critical'}
                  </p>
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};