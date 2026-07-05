// components/dashboardComponents/FlowBalanceChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { COLORS } from '../Dashboard';

export const FlowBalanceChart = ({ data }) => {
  const feed = data?.['FEEDFlow']?.value || 0;
  const permeate = data?.['Permeateflow']?.value || 0;
  const concentrate = data?.['ConcentrateFlow']?.value || 0;
  const recovery = data?.['SystemRecovery']?.value || 0;

  const chartData = [
    { name: 'Feed', value: feed, color: COLORS.primary, label: 'Raw Water In' },
    { name: 'Permeate', value: permeate, color: COLORS.success, label: 'Product Water' },
    { name: 'Concentrate', value: concentrate, color: COLORS.warning, label: 'Reject Stream' },
  ];

  const balance = feed - (permeate + concentrate);
  const isBalanced = Math.abs(balance) < 0.5;

  if (feed === 0 && permeate === 0 && concentrate === 0) {
    return (
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 16,
        textAlign: 'center'
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
          Flow Balance
        </span>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 20 }}>
          Waiting for flow data...
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
          Flow Balance
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            Recovery: <span style={{ color: COLORS.success, fontWeight: 600 }}>
              {recovery.toFixed(1)}%
            </span>
          </span>
          <span style={{ fontSize: 10, color: isBalanced ? COLORS.success : COLORS.danger }}>
            {isBalanced ? '✓ Balanced' : `⚠️ ${balance.toFixed(2)} m³/h off`}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={80}
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
                  <p style={{ fontSize: 10, color: '#4d7a9e' }}>{d.label}</p>
                  <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: d.color }}>
                    {d.value.toFixed(2)} m³/h
                  </p>
                  <p style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>
                    {((d.value / (feed || 1)) * 100).toFixed(1)}% of feed
                  </p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};