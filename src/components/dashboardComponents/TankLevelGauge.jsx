// components/dashboardComponents/TankLevelGauge.jsx
import React from 'react';

export const TANK_BANDS = [
  { key: 'low', label: 'Bottom', min: 0,  max: 25,  color: '#ef4444', statusLabel: 'Low' },
  { key: 'mid', label: 'Middle', min: 25, max: 50,  color: '#eab308', statusLabel: 'Warning' },
  { key: 'top', label: 'Top',    min: 50, max: 100, color: '#22c55e', statusLabel: 'Normal' },
];

export function classifyTankLevel(value) {
  if (!Number.isFinite(value)) return null;
  if (value < 25) return TANK_BANDS[0];
  if (value < 50) return TANK_BANDS[1];
  return TANK_BANDS[2];
}

const WATER_GRADIENTS = {
  '#ef4444': 'linear-gradient(180deg, #f87171 0%, #b91c1c 100%)',
  '#eab308': 'linear-gradient(180deg, #facc15 0%, #a16207 100%)',
  '#22c55e': 'linear-gradient(180deg, #4ade80 0%, #15803d 100%)',
};

// value   = fill level in % (0-100), drives the water height and colour
// display = optional text to print inside (e.g. "6.5 m³"); falls back to the percentage
export function TankLevelGauge({ value, height = 200, width = 120, display }) {
  const hasValue = Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(100, value)) : 0;
  const band = hasValue ? classifyTankLevel(clamped) : null;

  const fillColor = band?.color || '#64748b';
  const fillGradient = WATER_GRADIENTS[fillColor] || WATER_GRADIENTS['#ef4444'];

  const text = hasValue ? (display ?? `${clamped.toFixed(1)}%`) : '--';
  // Font scales with bar width; longer text (e.g. "10.0 m³") shrinks to fit.
  const valueFontSize = Math.max(11, Math.min(Math.round(width * 0.26), Math.floor((width - 8) / (text.length * 0.62))));

  return (
    <div style={{
      position: 'relative',
      width,
      height,
      borderRadius: 12,
      overflow: 'hidden',
      border: '2px solid #0f172a',
      backgroundColor: fillColor,
      opacity: 1,
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: fillColor,
        opacity: 0.22,
        transition: 'background 0.6s ease',
      }} />

      <div style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        height: `${clamped}%`,
        background: fillGradient,
        transition: 'height 0.6s ease, background 0.6s ease',
        boxShadow: `inset 0 0 12px rgba(0,0,0,0.35), 0 0 12px ${fillColor}80`,
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: valueFontSize,
        fontWeight: 700,
        color: '#ffffff',
        textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        pointerEvents: 'none',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}>
        {text}
      </div>
    </div>
  );
}

export default TankLevelGauge;