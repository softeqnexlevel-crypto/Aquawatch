// components/dashboardComponents/PressureGauge.jsx
//
// Photo-style replica of a liquid-filled, front-flange industrial pressure
// gauge: 270° sweep, dual scale (MPa outside, bar inside), green/yellow/red
// arc, tapered black needle, stainless bezel and 3-ear mounting flange.
//
// Drop-in replacement: same exports and props as the previous semicircle gauge.
import React, { useRef } from 'react';

export const PRESSURE_UNIT_DISPLAY = 'bar';

// ── Status classification (unchanged) ───────────────────────────────────────
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

// ── Physical dial ───────────────────────────────────────────────────────────
// The coloured arc is PRINTED on the dial, like the real gauge, so it is
// separate from the status bands above. Edit these three ranges to change it.
export const DIAL_MAX_BAR = 16; // = 1.6 MPa
export const DIAL_BANDS_BAR = [
  { from: 0,  to: 8,  color: '#2e9e4f' }, // green  0 – 0.8 MPa
  { from: 8,  to: 12, color: '#f2c318' }, // yellow 0.8 – 1.2 MPa
  { from: 12, to: 16, color: '#dc2626' }, // red    1.2 – 1.6 MPa
];

const BAR_PER_MPA = 10;
const SWEEP_START_DEG = 225; // 0 sits at the lower left (7:30 o'clock)
const SWEEP_DEG = 270;       // full scale at the lower right (4:30 o'clock)
const OVERTRAVEL = 1.02;     // needle may swing slightly past full scale

const CX = 100;
const CY = 100;

// Angles are "math" degrees: 0° = 3 o'clock, counter-clockwise positive.
const angleFor = (bar) => SWEEP_START_DEG - (bar / DIAL_MAX_BAR) * SWEEP_DEG;

const polar = (r, deg) => {
  const rad = (Math.PI / 180) * deg;
  return [CX + r * Math.cos(rad), CY - r * Math.sin(rad)];
};

// Clockwise arc from startDeg down to endDeg (SVG sweep-flag = 1)
const arcPath = (r, startDeg, endDeg) => {
  const [x1, y1] = polar(r, startDeg);
  const [x2, y2] = polar(r, endDeg);
  const large = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
};

// ── Static dial artwork (never changes, so computed once) ───────────────────
const TICKS = Array.from({ length: 33 }, (_, i) => {
  const bar = i * 0.5;               // a tick every 0.5 bar (0.05 MPa)
  const major = i % 4 === 0;         // every 2 bar (0.2 MPa)
  const deg = angleFor(bar);
  const [x1, y1] = polar(42.5, deg);
  const [x2, y2] = polar(major ? 47 : 45, deg);
  return { bar, major, x1, y1, x2, y2 };
});

// Outer scale: MPa every 0.2
const MPA_LABELS = Array.from({ length: 9 }, (_, i) => {
  const mpa = i * 0.2;
  const [x, y] = polar(52, angleFor(mpa * BAR_PER_MPA));
  return { text: i === 0 ? '0' : mpa.toFixed(1), x, y };
});

// Inner scale: bar every 4
const BAR_LABELS = [0, 4, 8, 12, 16].map((bar) => {
  const [x, y] = polar(30, angleFor(bar));
  return { text: String(bar), x, y };
});

const EAR_ANGLES = [90, 210, 330]; // top, lower-left, lower-right

let gaugeInstance = 0;

export function PressureGauge({
  value,
  unit = PRESSURE_UNIT_DISPLAY,
  size = 180,
  bands = PRESSURE_BANDS_BAR,
  dialBands = DIAL_BANDS_BAR,
  showReadout = true,
}) {
  // Unique SVG ids so several gauges can share one page
  const idRef = useRef(null);
  if (idRef.current === null) idRef.current = `pg${++gaugeInstance}`;
  const id = idRef.current;

  const hasValue = Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(DIAL_MAX_BAR * OVERTRAVEL, value)) : 0;
  const needleRotation = -angleFor(clamped); // CSS rotates clockwise, our angles go counter-clockwise

  const band = hasValue ? classifyPressure(value, bands) : null;
  const valueColor = band?.color || 'var(--muted-foreground)';

  const readoutSize = Math.max(16, Math.round(size * 0.13));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <svg
        width={size}
        viewBox="0 0 200 200"
        style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={
          hasValue
            ? `Pressure ${value.toFixed(1)} ${unit}, ${(value / BAR_PER_MPA).toFixed(2)} MPa`
            : 'Pressure: no data'
        }
      >
        <defs>
          {/* Brushed stainless steel, shared by flange + ears so they blend */}
          <linearGradient id={`${id}-steel`} gradientUnits="userSpaceOnUse" x1="10" y1="10" x2="190" y2="190">
            <stop offset="0" stopColor="#f4f6f8" />
            <stop offset="0.28" stopColor="#aab2ba" />
            <stop offset="0.5" stopColor="#eef1f4" />
            <stop offset="0.75" stopColor="#8e97a1" />
            <stop offset="1" stopColor="#d9dee3" />
          </linearGradient>
          {/* Polished bezel ring, light source from the opposite corner */}
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

        {/* Mounting flange: round plate + three ears with holes */}
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

        {/* Bezel ring */}
        <circle cx={CX} cy={CY} r="68" fill={`url(#${id}-bezel)`} />
        <circle cx={CX} cy={CY} r="62.5" fill="#59616a" />

        {/* Dial face */}
        <circle cx={CX} cy={CY} r="60" fill={`url(#${id}-dial)`} />

        {/* Printed colour arc */}
        {dialBands.map((b) => (
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

        {/* Needle: tapered pointer with a short counterweight tail.
            Drawn pointing right, then rotated about the hub. */}
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
        <circle cx={CX} cy={CY} r="60" fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="0.8" />
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