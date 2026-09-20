// components/dashboardComponents/PressureGauge.jsx
import React, { useRef } from 'react';

export const PRESSURE_UNIT_DISPLAY = 'bar';
const DEFAULT_SECONDARY_UNIT = 'MPa';
const DEFAULT_BAR_PER_PRIMARY = 10;

export const PRESSURE_BANDS_BAR = [
  { key: 'warning', label: 'Low',    min: 0,  max: 8,  color: '#eab308' },
  { key: 'normal',  label: 'Normal', min: 8,  max: 16, color: '#22c55e' },
  { key: 'danger',  label: 'High',   min: 16, max: 20, color: '#ef4444' },
];

export function classifyPressure(value, bands = PRESSURE_BANDS_BAR) {
  if (!Number.isFinite(value)) return null;
  const hit = bands.find((b, i) => (i === 0 ? value < b.max : value <= b.max));
  return hit || bands[bands.length - 1];
}

export const DIAL_MAX_BAR = 16;
export const DIAL_BANDS_BAR = [
  { from: 0,  to: 8,  color: '#2e9e4f' },
  { from: 8,  to: 12, color: '#f2c318' },
  { from: 12, to: 16, color: '#dc2626' },
];

const SWEEP_START_DEG = 225;
const SWEEP_DEG = 270;
const OVERTRAVEL = 1.02;
const CX = 100;
const CY = 100;
const EAR_ANGLES = [90, 210, 330];

const angleFor = (v, max) => SWEEP_START_DEG - (v / max) * SWEEP_DEG;

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

function pickMajorStep(max) {
  const candidates = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 4, 5, 10, 20, 25, 50, 100];
  for (const c of candidates) {
    if (max / c <= 8) return c;
  }
  return max / 6;
}

function fmt(v, decimals) {
  if (Math.abs(v) < 1e-9) return '0';
  const s = v.toFixed(decimals);
  return s.replace(/\.?0+$/, '');
}

let gaugeInstance = 0;

export function PressureGauge({
  value,
  unit = PRESSURE_UNIT_DISPLAY,
  secondaryUnit = DEFAULT_SECONDARY_UNIT,
  primaryPerSecondary = DEFAULT_BAR_PER_PRIMARY,

  maxValue = DIAL_MAX_BAR,
  majorTick,
  minorDivisions = 4,

  size = 180,
  bands = PRESSURE_BANDS_BAR,
  dialBands,
  title = 'PRESSURE GAUGE',
  showReadout = true,
  showSecondaryReadout = true,

  // ── NEW ────────────────────────────────────────────────────────────────
  // frame = true  → original look: stainless flange, 3 ears, bezel ring
  // frame = false → dial-only look: just the white dial on the card bg
  frame = true,
}) {
  const idRef = useRef(null);
  if (idRef.current === null) idRef.current = `pg${++gaugeInstance}`;
  const id = idRef.current;

  const hasValue = Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(maxValue * OVERTRAVEL, value)) : 0;
  const needleRotation = -angleFor(clamped, maxValue);

  const band = hasValue ? classifyPressure(value, bands) : null;
  const valueColor = band?.color || 'var(--muted-foreground)';

  const readoutSize = Math.max(16, Math.round(size * 0.13));

  const stepMajor = majorTick || pickMajorStep(maxValue);
  const stepMinor = stepMajor / minorDivisions;
  const tickCount = Math.round(maxValue / stepMinor);

  const TICKS = Array.from({ length: tickCount + 1 }, (_, i) => {
    const v = i * stepMinor;
    const ratio = v / stepMajor;
    const isMajor = Math.abs(ratio - Math.round(ratio)) < 1e-6;
    const deg = angleFor(v, maxValue);
    const [x1, y1] = polar(42.5, deg);
    const [x2, y2] = polar(isMajor ? 47 : 45, deg);
    return { v, major: isMajor, x1, y1, x2, y2 };
  });

  const outerLabelDecimals = stepMajor / primaryPerSecondary < 0.1 ? 2 : 1;
  const OUTER_LABELS = [];
  if (secondaryUnit) {
    for (let v = 0; v <= maxValue + 1e-6; v += stepMajor) {
      const secondary = v / primaryPerSecondary;
      const [x, y] = polar(52, angleFor(v, maxValue));
      OUTER_LABELS.push({ text: fmt(secondary, outerLabelDecimals), x, y });
    }
  }

  const innerLabelDecimals = stepMajor < 1 ? (stepMajor < 0.1 ? 2 : 1) : 0;
  const INNER_LABELS = [];
  for (let v = 0; v <= maxValue + 1e-6; v += stepMajor) {
    const [x, y] = polar(30, angleFor(v, maxValue));
    INNER_LABELS.push({ text: fmt(v, innerLabelDecimals), x, y });
  }

  const printedBands = dialBands || [
    { from: 0,               to: maxValue * 0.5,  color: '#2e9e4f' },
    { from: maxValue * 0.5,  to: maxValue * 0.75, color: '#f2c318' },
    { from: maxValue * 0.75, to: maxValue,        color: '#dc2626' },
  ];

  // ── Viewport trick ─────────────────────────────────────────────────────
  // When frame = true  → show the full 200x200 canvas (flange + ears visible)
  // When frame = false → crop the viewBox to the dial face only, so the SVG
  //                      wraps tightly around the white circle.
  const viewBox = frame ? '0 0 200 200' : '38 38 124 124';
  //        ^ dial face is centred at (100,100) with radius 62; crop to 124x124
  //          starting at (38,38) so the white dial sits flush to the edge.

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <svg
        width={size}
        viewBox={viewBox}
        style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={
          hasValue ? `Pressure ${value.toFixed(2)} ${unit}` : 'Pressure: no data'
        }
      >
        <defs>
          <linearGradient id={`${id}-steel`} gradientUnits="userSpaceOnUse" x1="10" y1="10" x2="190" y2="190">
            <stop offset="0" stopColor="#f4f6f8" />
            <stop offset="0.28" stopColor="#aab2ba" />
            <stop offset="0.5" stopColor="#eef1f4" />
            <stop offset="0.75" stopColor="#8e97a1" />
            <stop offset="1" stopColor="#d9dee3" />
          </linearGradient>
          <linearGradient id={`${id}-bezel`} gradientUnits="userSpaceOnUse" x1="190" y1="20" x2="20" y2="180">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#9ea7b0" />
            <stop offset="0.55" stopColor="#f1f3f5" />
            <stop offset="1" stopColor="#7d8791" />
          </linearGradient>
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
          <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.6" stdDeviation="1.8" floodColor="#000" floodOpacity="0.35" />
          </filter>
          <filter id={`${id}-needle-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.8" dy="1.4" stdDeviation="0.9" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* ── Chrome (flange, ears, bezel) only when frame = true ────────── */}
        {frame && (
          <>
            <g filter={`url(#${id}-shadow)`}>
              {EAR_ANGLES.map((deg) => {
                const [x, y] = polar(85, deg);
                return <circle key={deg} cx={x} cy={y} r="12" fill={`url(#${id}-steel)`} />;
              })}
              <circle cx={CX} cy={CY} r="80" fill={`url(#${id}-steel)`} />
            </g>
            {EAR_ANGLES.map((deg) => {
              const [x, y] = polar(85, deg);
              return (
                <g key={`hole-${deg}`}>
                  <circle cx={x} cy={y} r="4.6" fill="#2b3037" />
                  <circle cx={x} cy={y} r="4.6" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.7" />
                </g>
              );
            })}
            <circle cx={CX} cy={CY} r="74" fill="none" stroke="#6f7883" strokeOpacity="0.45" strokeWidth="0.6" />
            <circle cx={CX} cy={CY} r="68" fill={`url(#${id}-bezel)`} />
            <circle cx={CX} cy={CY} r="62.5" fill="#59616a" />
          </>
        )}

        {/* ── Dial face (always visible) ─────────────────────────────────── */}
        <circle cx={CX} cy={CY} r="60" fill={`url(#${id}-dial)`} />

        {/* Printed colored arc */}
        {printedBands.map((b, i) => (
          <path
            key={i}
            d={arcPath(38.5, angleFor(b.from, maxValue), angleFor(b.to, maxValue))}
            stroke={b.color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="butt"
          />
        ))}

        {/* Ticks */}
        {TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="#1b1b1b"
            strokeWidth={t.major ? 0.9 : 0.45}
          />
        ))}

        {/* Outer scale labels */}
        {OUTER_LABELS.map((l, i) => (
          <text
            key={`outer-${i}`}
            x={l.x} y={l.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="5.4" fontWeight="600" fill="#1b1b1b"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            {l.text}
          </text>
        ))}

        {/* Inner scale labels */}
        {INNER_LABELS.map((l, i) => (
          <text
            key={`inner-${i}`}
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
          {title}
        </text>
        <text
          x={CX} y="115" textAnchor="middle"
          fontSize="6.2" fontWeight="700" fill="#c62828"
          fontFamily="Arial, Helvetica, sans-serif"
        >
          {unit}
        </text>
        {secondaryUnit && (
          <text
            x={CX} y="123" textAnchor="middle"
            fontSize="5.6" fontWeight="600" fill="#1b1b1b"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            {secondaryUnit}
          </text>
        )}

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

        {/* Glass reflection (clipped to dial) */}
        <g clipPath={`url(#${id}-clip)`} style={{ pointerEvents: 'none' }}>
          <ellipse
            cx="80" cy="66" rx="40" ry="20"
            transform="rotate(-32 80 66)"
            fill={`url(#${id}-glass)`}
          />
        </g>

        {/* Dial rim — thinner & darker when framed, cleaner when not */}
        <circle
          cx={CX} cy={CY} r="60"
          fill="none"
          stroke={frame ? '#000' : '#334155'}
          strokeOpacity={frame ? 0.25 : 0.5}
          strokeWidth={frame ? 0.8 : 1.2}
        />
      </svg>

      {showReadout && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 6, lineHeight: 1.15 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: readoutSize, fontWeight: 700, color: valueColor }}>
            {hasValue ? value.toFixed(1) : '--'}
            <span style={{ fontSize: Math.max(9, Math.round(readoutSize * 0.45)), fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: 4 }}>
              {unit}
            </span>
          </div>
          {hasValue && secondaryUnit && showSecondaryReadout && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: Math.max(9, Math.round(readoutSize * 0.45)), color: 'var(--muted-foreground)' }}>
              {(value / primaryPerSecondary).toFixed(2)} {secondaryUnit}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PressureGauge;