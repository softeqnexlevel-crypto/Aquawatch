import React from 'react';
import { COLORS } from '../Dashboard';

export const AdvancedGauge = ({ value, label, unit, min, max, color, size = 120, fullWidth = false }) => {
  // Guard against undefined or null values
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const percentage = ((safeValue - min) / (max - min)) * 100;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const getColor = () => {
    if (clampedPercentage > 80) return COLORS.danger;
    if (clampedPercentage > 60) return COLORS.warning;
    return COLORS.success;
  };

  const displayColor = color || getColor();

  return (
    <div
      className="gauge-wrapper rounded p-3 flex flex-col gap-1"
      style={{
        width: fullWidth ? '100%' : size,
        height: '100%',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
      }}
    >
      {/* Header row — matches KPICard's label position exactly */}
      <div className="flex items-center justify-between">
        <span style={{
          fontSize: 10, color: 'var(--muted-foreground)', fontWeight: 500,
          letterSpacing: '0.06em', textTransform: 'uppercase'
        }}>{label}</span>
      </div>

      {/* Gauge fills the remaining space, centered */}
      <div className="gauge-container" style={{
        position: 'relative', width: '100%', flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg
          width={fullWidth ? '100%' : size}
          height="auto"
          viewBox="0 0 120 84"
          style={{ display: 'block', width: '100%', maxWidth: fullWidth ? 160 : size, height: 'auto' }}
        >
          <defs>
            <linearGradient id={`gaugeGrad-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={COLORS.success} />
              <stop offset="50%" stopColor={COLORS.warning} />
              <stop offset="100%" stopColor={COLORS.danger} />
            </linearGradient>
          </defs>
          {/* Background arc */}
          <path
            d="M 10 80 A 50 50 0 0 1 110 80"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 10 80 A 50 50 0 0 1 110 80"
            fill="none"
            stroke={displayColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(clampedPercentage / 100) * 314} 314`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
          {/* Indicator dot */}
          <circle
            cx={10 + (clampedPercentage / 100) * 100}
            cy={80 - 50 * Math.sin((clampedPercentage / 100) * Math.PI)}
            r="5"
            fill={displayColor}
            style={{ transition: 'cx 0.8s ease, cy 0.8s ease' }}
          />
          {/* Value text */}
          <text x="60" y="60" textAnchor="middle" fontSize="18" fill="white" fontWeight="bold">
            {safeValue.toFixed(1)}
          </text>
          {/* Unit text */}
          <text x="60" y="75" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.5)">
            {unit}
          </text>
        </svg>
      </div>
    </div>
  );
};