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

// Vertical gradient endpoints for the water fill, derived from the band color
// so the fill matches the current classification (red / yellow / green).
const WATER_GRADIENTS = {
  '#ef4444': 'linear-gradient(180deg, #f87171 0%, #b91c1c 100%)', // red
  '#eab308': 'linear-gradient(180deg, #facc15 0%, #a16207 100%)', // yellow
  '#22c55e': 'linear-gradient(180deg, #4ade80 0%, #15803d 100%)', // green
};

export function TankLevelGauge({ value, height = 200, width = 120 }) {
  const hasValue = Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(100, value)) : 0;
  const band = hasValue ? classifyTankLevel(clamped) : null;

  // Color of the water fill follows the classification band:
  //   < 25%  → red
  //   25–50% → yellow
  //   >= 50% → green
  const fillColor = band?.color || '#64748b';
  const fillGradient = WATER_GRADIENTS[fillColor] || WATER_GRADIENTS['#ef4444'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        position: 'relative',
        width,
        height,
        borderRadius: 12,
        overflow: 'hidden',
        border: '2px solid #0f172a',
        // Static zone backdrop: red 0–25, yellow 25–50, green 50–100.
        // Note the gradient is written bottom-to-top because CSS gradients
        // read top-to-bottom. So the first colour band we write corresponds
        // to the TOP of the tank.
        background:
          'linear-gradient(to bottom,' +
          ' #166534 0%, #166534 50%,' +   // top 50–100%  → green
          ' #ca8a04 50%, #ca8a04 75%,' +  // middle 25–50% → yellow
          ' #b91c1c 75%, #b91c1c 100%)',  // bottom 0–25% → red
      }}>
        {/* Water fill — colored by the current band */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          height: `${clamped}%`,
          background: fillGradient,
          transition: 'height 0.6s ease, background 0.6s ease',
          boxShadow: `inset 0 0 12px rgba(0,0,0,0.35), 0 0 12px ${fillColor}80`,
        }} />

        {/* Percentage overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700,
          color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
        }}>
          {hasValue ? `${clamped.toFixed(1)}%` : '--'}
        </div>

        {/* "Max 100%" label at top */}
        <div style={{
          position: 'absolute', top: 4, left: 0, right: 0,
          textAlign: 'center', fontSize: 9, color: '#e2e8f0',
        }}>
          Max 100%
        </div>
      </div>

      {/* Readout below the tank */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700,
          color: band?.color || 'var(--muted-foreground)', lineHeight: 1,
        }}>
          {hasValue ? `${clamped.toFixed(1)}%` : '--'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>
          Tank Level
        </div>
      </div>
    </div>
  );
}

export default TankLevelGauge;