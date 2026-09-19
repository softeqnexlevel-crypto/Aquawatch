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

export function TankLevelGauge({ value, height = 200, width = 120 }) {
  const hasValue = Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(100, value)) : 0;
  const band = hasValue ? classifyTankLevel(clamped) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        position: 'relative',
        width,
        height,
        borderRadius: 12,
        overflow: 'hidden',
        border: '2px solid #0f172a',
        background:
          'linear-gradient(to bottom,' +
          ' #166534 0%, #166534 50%,' +
          ' #ca8a04 50%, #ca8a04 75%,' +
          ' #b91c1c 75%, #b91c1c 100%)',
      }}>
        <div style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          height: `${clamped}%`,
          background: 'linear-gradient(180deg, rgba(56,189,248,0.95) 0%, rgba(14,116,144,0.95) 100%)',
          transition: 'height 0.6s ease',
        }} />

        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700,
          color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
        }}>
          {hasValue ? `${clamped.toFixed(1)}%` : '--'}
        </div>

        <div style={{
          position: 'absolute', top: 4, left: 0, right: 0,
          textAlign: 'center', fontSize: 9, color: '#e2e8f0',
        }}>
          Max 100%
        </div>
      </div>

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