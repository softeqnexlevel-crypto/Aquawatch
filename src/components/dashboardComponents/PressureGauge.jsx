// components/dashboardComponents/PressureGauge.jsx
import React from 'react';

export const PRESSURE_UNIT_DISPLAY = 'bar';

// Keys are chosen to match how Dashboard.jsx maps a band to a tone:
//   'normal' -> green, 'warning' -> amber, anything else -> red.
// Thresholds match the RO Pressure KPI card (normal = 8–16 bar).
export const PRESSURE_BANDS_BAR = [
  { key: 'warning', label: 'Low',    min: 0,  max: 8,  color: '#eab308' },
  { key: 'normal',  label: 'Normal', min: 8,  max: 16, color: '#22c55e' },
  { key: 'danger',  label: 'High',   min: 16, max: 20, color: '#ef4444' },
];

// < 8 low, 8–16 (inclusive) normal, > 16 high. Anything above the last
// band's max is still classified as the last band.
export function classifyPressure(value, bands = PRESSURE_BANDS_BAR) {
  if (!Number.isFinite(value)) return null;
  const hit = bands.find((b, i) => (i === 0 ? value < b.max : value <= b.max));
  return hit || bands[bands.length - 1];
}

// --- geometry helpers (semicircle: 180° = min, 0° = max) -------------
const polar = (cx, cy, r, deg) => {
  const rad = (Math.PI / 180) * deg;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
};

const arcPath = (cx, cy, r, startDeg, endDeg) => {
  const [x1, y1] = polar(cx, cy, r, startDeg);
  const [x2, y2] = polar(cx, cy, r, endDeg);
  const large = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
};

export function PressureGauge({
  value,
  unit = PRESSURE_UNIT_DISPLAY,
  size = 180,
  bands = PRESSURE_BANDS_BAR,
}) {
  const hasValue = Number.isFinite(value);
  const min = bands[0].min;
  const max = bands[bands.length - 1].max;
  const span = max - min;

  const clamped = hasValue ? Math.max(min, Math.min(max, value)) : min;
  const angleFor = (v) => 180 - ((v - min) / span) * 180;

  const band = hasValue ? classifyPressure(value, bands) : null;
  const valueColor = band?.color || 'var(--muted-foreground)';

  const cx = 100;
  const cy = 100;
  const r = 78;
  const stroke = 16;
  const needleAngle = angleFor(clamped);
  const [nx, ny] = polar(cx, cy, r - stroke / 2 - 6, needleAngle);

  return (
    <svg
      width={size}
      viewBox="0 0 200 140"
      style={{ maxWidth: '100%', display: 'block' }}
      role="img"
      aria-label={hasValue ? `Pressure ${value.toFixed(1)} ${unit}` : 'Pressure: no data'}
    >
      {/* Track */}
      <path
        d={arcPath(cx, cy, r, 180, 0)}
        stroke="var(--border)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="butt"
        opacity={0.35}
      />

      {/* Colour bands */}
      {bands.map((b) => (
        <path
          key={b.key}
          d={arcPath(cx, cy, r, angleFor(b.min), angleFor(b.max))}
          stroke={b.color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="butt"
          opacity={hasValue && band?.key === b.key ? 1 : 0.45}
        />
      ))}

      {/* Scale labels */}
      <text x={cx - r} y={cy + 16} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
        {min}
      </text>
      <text x={cx + r} y={cy + 16} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
        {max}
      </text>

      {/* Needle (hidden when there is no data) */}
      {hasValue && (
        <g style={{ transition: 'all 0.6s ease' }}>
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="var(--foreground)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>
      )}
      <circle cx={cx} cy={cy} r={6} fill="var(--foreground)" />

      {/* Readout */}
      <text
        x={cx}
        y={cy + 34}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="22"
        fontWeight="700"
        fill={valueColor}
      >
        {hasValue ? value.toFixed(1) : '--'}
      </text>
      <text x={cx} y={cy + 46} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
        {unit}
      </text>
    </svg>
  );
}

export default PressureGauge;