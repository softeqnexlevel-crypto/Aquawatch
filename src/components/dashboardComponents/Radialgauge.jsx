// components/dashboardComponents/RadialGauge.jsx
//
// Generic 270° radial gauge for any single-scale reading with color bands
// (e.g. Delta P sensors). Same visual language as PressureGauge, but
// parameterized by `max` and `bands` instead of a fixed 0–16 bar dial, so
// it can represent small ranges (e.g. 0–0.6 bar) legibly.
import React, { useRef } from 'react';

const CX = 100;
const CY = 100;
const SWEEP_START_DEG = 225;
const SWEEP_DEG = 270;
const OVERTRAVEL = 1.02;

const angleFor = (val, max) => SWEEP_START_DEG - (val / max) * SWEEP_DEG;

const polar = (r, deg) => {
  const rad = (Math.PI / 180) * deg;
  return [CX + r * Math.cos(rad), CY - r * Math.sin(rad)];
};

const arcPath = (r, startDeg, endDeg) => {
  const [x1, y1] = polar(r, startDeg);
  const [x2, y2] = polar(r, endDeg);
  const large = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
};

// Returns the matching band ({key, label, min, max, color}) for a value,
// clamping to the outer bands if the value is out of range.
export function classifyByBands(value, bands) {
  if (!Number.isFinite(value) || !bands || bands.length === 0) return null;
  for (const b of bands) {
    if (value >= b.min && value < b.max) return b;
  }
  if (value >= bands[bands.length - 1].max) return bands[bands.length - 1];
  return bands[0];
}

let gaugeInstance = 0;

export function RadialGauge({
  value,
  unit = '',
  label = '',
  size = 160,
  max = 1,
  bands = [], // [{ min, max, color, label, key }]
  precision = 2,
  showReadout = true,
}) {
  const idRef = useRef(null);
  if (idRef.current === null) idRef.current = `rg${++gaugeInstance}`;
  const id = idRef.current;

  const hasValue = Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(max * OVERTRAVEL, value)) : 0;
  const needleRotation = -angleFor(clamped, max);

  const ticks = Array.from({ length: 21 }, (_, i) => {
    const val = (i / 20) * max;
    const major = i % 5 === 0;
    const deg = angleFor(val, max);
    const [x1, y1] = polar(42.5, deg);
    const [x2, y2] = polar(major ? 47 : 45, deg);
    return { val, major, x1, y1, x2, y2 };
  });

  const numberLabels = [0, max * 0.25, max * 0.5, max * 0.75, max].map((val) => {
    const [x, y] = polar(30, angleFor(val, max));
    return { text: val < 1 ? val.toFixed(2) : val.toFixed(1), x, y };
  });

  const readoutSize = Math.max(14, Math.round(size * 0.14));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <svg
        width={size}
        viewBox="38 38 124 124"
        style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={hasValue ? `${label} ${value.toFixed(precision)} ${unit}` : `${label}: no data`}
      >
        <defs>
          <radialGradient id={`${id}-dial`} cx="0.5" cy="0.42" r="0.65">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.75" stopColor="#f7f8f6" />
            <stop offset="1" stopColor="#e4e6e3" />
          </radialGradient>
          <radialGradient id={`${id}-hub`} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#6b7280" />
            <stop offset="1" stopColor="#111315" />
          </radialGradient>
          <filter id={`${id}-needle-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.8" dy="1.4" stdDeviation="0.9" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Dial face */}
        <circle cx={CX} cy={CY} r="60" fill={`url(#${id}-dial)`} />

        {/* Printed colour arc */}
        {bands.map((b) => (
          <path
            key={`${b.min}-${b.max}`}
            d={arcPath(38.5, angleFor(b.min, max), angleFor(b.max, max))}
            stroke={b.color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="butt"
          />
        ))}

        {/* Tick marks */}
        {ticks.map((t) => (
          <line
            key={t.val}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="#1b1b1b"
            strokeWidth={t.major ? 0.9 : 0.45}
          />
        ))}

        {/* Numeric labels */}
        {numberLabels.map((l, i) => (
          <text
            key={i}
            x={l.x} y={l.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="5.4" fontWeight="600" fill="#1b1b1b"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            {l.text}
          </text>
        ))}

        {/* Dial printing */}
        <text
          x={CX} y="85" textAnchor="middle"
          fontSize="4" letterSpacing="0.4" fill="#333"
          fontFamily="Arial, Helvetica, sans-serif"
        >
          {label.toUpperCase()}
        </text>
        <text
          x={CX} y="118" textAnchor="middle"
          fontSize="6" fontWeight="700" fill="#c62828"
          fontFamily="Arial, Helvetica, sans-serif"
        >
          {unit}
        </text>

        {/* Needle */}
        <g
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transformBox: 'view-box',
            transform: `rotate(${needleRotation}deg)`,
            transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          opacity={hasValue ? 1 : 0.35}
          filter={`url(#${id}-needle-shadow)`}
        >
          <path d={`M ${CX + 50} ${CY} L ${CX + 3} ${CY - 2.3} L ${CX - 14} ${CY - 1.4} L ${CX - 14} ${CY + 1.4} L ${CX + 3} ${CY + 2.3} Z`} fill="#141618" />
        </g>

        {/* Hub */}
        <circle cx={CX} cy={CY} r="5.6" fill={`url(#${id}-hub)`} />
        <circle cx={CX} cy={CY} r="1.8" fill="#d8dce0" />

        {/* Thin dark rim */}
        <circle cx={CX} cy={CY} r="60" fill="none" stroke="#334155" strokeWidth="2" />
      </svg>

      {showReadout && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 6, lineHeight: 1.15 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: readoutSize, fontWeight: 700, color: 'var(--foreground)' }}>
            {hasValue ? value.toFixed(precision) : '--'}
            <span style={{ fontSize: Math.max(9, Math.round(readoutSize * 0.45)), fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: 4 }}>
              {unit}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default RadialGauge;