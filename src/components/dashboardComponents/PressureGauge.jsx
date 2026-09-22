// components/dashboardComponents/PressureGauge.jsx
import React, { useRef } from 'react';

export const PRESSURE_UNIT_DISPLAY = 'bar';

// ── Physical dial ───────────────────────────────────────────────────────────
export const DIAL_MAX_BAR = 16;

// Single source of truth: label/key drive status logic (used by Dashboard's
// legend + pressureStatusTone), color/min/max drive both the dial arc and
// the legend range text.
export const PRESSURE_BANDS_BAR = [
  { key: 'normal',   label: 'Normal',   min: 0,  max: 8,  color: '#2e9e4f' },
  { key: 'warning',  label: 'Warning',  min: 8,  max: 12, color: '#f2c318' },
  { key: 'critical', label: 'Critical', min: 12, max: 16, color: '#dc2626' },
];

// Back-compat alias + shape the SVG arc code already expects ({from, to}).
export const DIAL_BANDS_BAR = PRESSURE_BANDS_BAR.map(b => ({
  from: b.min,
  to: b.max,
  color: b.color,
}));

// Returns the matching band object ({key, label, min, max, color}) for a
// given pressure value, clamping to the outer bands if out of range.
export function classifyPressure(value, bands = PRESSURE_BANDS_BAR) {
  if (!Number.isFinite(value)) return null;
  for (const b of bands) {
    if (value >= b.min && value < b.max) return b;
  }
  if (value >= bands[bands.length - 1].max) return bands[bands.length - 1];
  return bands[0];
}

const BAR_PER_MPA = 10;
const SWEEP_START_DEG = 225;
const SWEEP_DEG = 270;
const OVERTRAVEL = 1.02;

const CX = 100;
const CY = 100;

const angleFor = (bar) => SWEEP_START_DEG - (bar / DIAL_MAX_BAR) * SWEEP_DEG;

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

// ── Static dial artwork ─────────────────────────────────────────────────────
const TICKS = Array.from({ length: 33 }, (_, i) => {
  const bar = i * 0.5;
  const major = i % 4 === 0;
  const deg = angleFor(bar);
  const [x1, y1] = polar(42.5, deg);
  const [x2, y2] = polar(major ? 47 : 45, deg);
  return { bar, major, x1, y1, x2, y2 };
});

const MPA_LABELS = Array.from({ length: 9 }, (_, i) => {
  const mpa = i * 0.2;
  const [x, y] = polar(52, angleFor(mpa * BAR_PER_MPA));
  return { text: i === 0 ? '0' : mpa.toFixed(1), x, y };
});

const BAR_LABELS = [0, 4, 8, 12, 16].map((bar) => {
  const [x, y] = polar(30, angleFor(bar));
  return { text: String(bar), x, y };
});

let gaugeInstance = 0;

export function PressureGauge({
  value,
  unit = PRESSURE_UNIT_DISPLAY,
  size = 180,
  bands,        // preferred: array of {min, max, color}
  dialBands,    // back-compat: array of {from, to, color}
  showReadout = true,
}) {
  const idRef = useRef(null);
  if (idRef.current === null) idRef.current = `pg${++gaugeInstance}`;
  const id = idRef.current;

  // Normalize whichever prop was passed into {from, to, color} for the arc.
  const resolvedBands = bands
    ? bands.map(b => ({ from: b.min, to: b.max, color: b.color }))
    : dialBands || DIAL_BANDS_BAR;

  const hasValue = Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(DIAL_MAX_BAR * OVERTRAVEL, value)) : 0;
  const needleRotation = -angleFor(clamped);

  const valueColor = 'var(--foreground)';
  const readoutSize = Math.max(16, Math.round(size * 0.13));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <svg
        width={size}
        viewBox="38 38 124 124"
        style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={
          hasValue
            ? `Pressure ${value.toFixed(1)} ${unit}, ${(value / BAR_PER_MPA).toFixed(2)} MPa`
            : 'Pressure: no data'
        }
      >
        <defs>
          <radialGradient id={`${id}-dial`} cx="0.5" cy="0.42" r="0.65">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.75" stopColor="#f7f8f6" />
            <stop offset="1" stopColor="#e4e6e3" />
          </radialGradient>
          <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${id}-hub`} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#6b7280" />
            <stop offset="1" stopColor="#111315" />
          </radialGradient>
          <clipPath id={`${id}-clip`}>
            <circle cx={CX} cy={CY} r="60" />
          </clipPath>
          <filter id={`${id}-needle-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.8" dy="1.4" stdDeviation="0.9" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Dial face */}
        <circle cx={CX} cy={CY} r="60" fill={`url(#${id}-dial)`} />

        {/* Printed colour arc */}
        {resolvedBands.map((b) => (
          <path
            key={`${b.from}-${b.to}`}
            d={arcPath(38.5, angleFor(b.from), angleFor(b.to))}
            stroke={b.color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="butt"
          />
        ))}

        {/* Tick marks */}
        {TICKS.map((t) => (
          <line
            key={t.bar}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="#1b1b1b"
            strokeWidth={t.major ? 0.9 : 0.45}
          />
        ))}

        {/* MPa numbers (outer, black) */}
        {MPA_LABELS.map((l) => (
          <text
            key={`mpa-${l.text}`}
            x={l.x} y={l.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="5.4" fontWeight="600" fill="#1b1b1b"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            {l.text}
          </text>
        ))}

        {/* bar numbers (inner, red) */}
        {BAR_LABELS.map((l) => (
          <text
            key={`bar-${l.text}`}
            x={l.x} y={l.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="5.2" fontWeight="700" fill="#c62828"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            {l.text}
          </text>
        ))}

        {/* Dial printing */}
        <text
          x={CX} y="85" textAnchor="middle"
          fontSize="3.4" letterSpacing="0.5" fill="#333"
          fontFamily="Arial, Helvetica, sans-serif"
        >
          PRESSURE GAUGE
        </text>
        <text
          x={CX} y="115" textAnchor="middle"
          fontSize="6.2" fontWeight="700" fill="#c62828"
          fontFamily="Arial, Helvetica, sans-serif"
        >
          bar
        </text>
        <text
          x={CX} y="123" textAnchor="middle"
          fontSize="5.6" fontWeight="600" fill="#1b1b1b"
          fontFamily="Arial, Helvetica, sans-serif"
        >
          MPa
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

        {/* Glass reflection */}
        <g clipPath={`url(#${id}-clip)`} style={{ pointerEvents: 'none' }}>
          <ellipse
            cx="80" cy="66" rx="40" ry="20"
            transform="rotate(-32 80 66)"
            fill={`url(#${id}-glass)`}
          />
        </g>

        {/* Thin dark rim */}
        <circle cx={CX} cy={CY} r="60" fill="none" stroke="#334155" strokeWidth="2" />
      </svg>

      {showReadout && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 6, lineHeight: 1.15 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: readoutSize, fontWeight: 700, color: valueColor }}>
            {hasValue ? value.toFixed(1) : '--'}
            <span style={{ fontSize: Math.max(9, Math.round(readoutSize * 0.45)), fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: 4 }}>
              {unit}
            </span>
          </div>
          {hasValue && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: Math.max(9, Math.round(readoutSize * 0.45)), color: 'var(--muted-foreground)' }}>
              {(value / BAR_PER_MPA).toFixed(2)} MPa
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PressureGauge;