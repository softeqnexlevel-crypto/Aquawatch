import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ─── DATA ───────────────────────────────────────────────────────────────────
const performanceData = [
  { day: 'Mon', recovery: 78, production: 2450, antiscalant: 12.4, pressure: 6.8 },
  { day: 'Tue', recovery: 81, production: 2680, antiscalant: 13.1, pressure: 6.5 },
  { day: 'Wed', recovery: 76, production: 2390, antiscalant: 11.8, pressure: 7.1 },
  { day: 'Thu', recovery: 83, production: 2750, antiscalant: 13.5, pressure: 6.3 },
  { day: 'Fri', recovery: 79, production: 2580, antiscalant: 12.7, pressure: 6.9 },
  { day: 'Sat', recovery: 82, production: 2690, antiscalant: 13.0, pressure: 6.6 },
  { day: 'Sun', recovery: 80, production: 2520, antiscalant: 12.5, pressure: 6.8 },
];

const monthlyData = [
  { month: 'Jan', antiscalant: 380, production: 72000, recovery: 79 },
  { month: 'Feb', antiscalant: 395, production: 76500, recovery: 81 },
  { month: 'Mar', antiscalant: 365, production: 69800, recovery: 77 },
  { month: 'Apr', antiscalant: 420, production: 81200, recovery: 83 },
];

const stationFeed = [
  { id: 'STN-001', name: 'River Delta Alpha', ph: 7.2, turbidity: 3.1,  temp: 22.4, status: 'normal', last: '2m ago' },
  { id: 'STN-002', name: 'Reservoir Beta',    ph: 6.8, turbidity: 8.7,  temp: 19.1, status: 'warn',   last: '1m ago' },
  { id: 'STN-003', name: 'Coastal Gamma',     ph: 7.9, turbidity: 2.0,  temp: 24.8, status: 'normal', last: '3m ago' },
  { id: 'STN-004', name: 'Lake Delta',        ph: 5.1, turbidity: 14.2, temp: 18.3, status: 'alarm',  last: '30s ago' },
  { id: 'STN-005', name: 'Inlet Epsilon',     ph: 7.4, turbidity: 1.8,  temp: 21.0, status: 'normal', last: '2m ago' },
];

const pressureStages = [
  { label: 'Prefilter ΔP',  pct: 65, val: '0.68 bar', color: '#f97316', warn: true  },
  { label: '1st Stage ΔP',  pct: 42, val: '0.45 bar', color: '#14b8a6', warn: false },
  { label: '2nd Stage ΔP',  pct: 28, val: '0.31 bar', color: '#3b82f6', warn: false },
];

// ─── THEME ──────────────────────────────────────────────────────────────────
const T = {
  bg:     '#07101E',
  panel:  '#0C1829',
  panel2: '#0F1E30',
  border: '#162336',
  text:   '#94a3b8',
  hi:     '#e2e8f0',
  teal:   '#14b8a6',
  cyan:   '#22d3ee',
  blue:   '#3b82f6',
  amber:  '#f59e0b',
  green:  '#22c55e',
  red:    '#ef4444',
  orange: '#f97316',
};

const tip = {
  contentStyle: { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, color: T.hi, fontSize: 12, fontFamily: 'inherit' },
  labelStyle:   { color: T.text, marginBottom: 4 },
  cursor:       { stroke: T.border },
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function PulsingDot({ color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.4,
        animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
      }} />
      <span style={{ position: 'relative', borderRadius: '50%', width: 10, height: 10, background: color }} />
    </span>
  );
}

function RadialGauge({ value, min = 0, max = 100, color, size = 120, label, unit = '%' }) {
  const r = 46, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  const pct = (value - min) / (max - min);
  const arc = circumference * 0.75;
  const offset = arc - pct * arc;
  const rotation = -225;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth={10}
          strokeDasharray={`${arc} ${circumference - arc}`}
          strokeDashoffset={0} strokeLinecap="round"
          transform={`rotate(${rotation} ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${arc} ${circumference - arc}`}
          strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(${rotation} ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize={18} fontWeight={700} fontFamily="inherit">
          {value}{unit}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={T.text} fontSize={10} fontFamily="inherit">
          {label}
        </text>
      </svg>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { normal: [T.green, 'NORMAL'], warn: [T.amber, 'WARN'], alarm: [T.red, 'ALARM'] };
  const [color, label] = map[status] || [T.text, status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, letterSpacing: '0.1em', fontWeight: 700, color }}>
      <PulsingDot color={color} />
      {label}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.16em', marginBottom: 14, fontWeight: 500 }}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub, subColor, accent, children }) {
  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: '20px 22px',
      borderTop: `2px solid ${accent}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.12em' }}>{label}</div>
      {children || (
        <>
          <div style={{ fontSize: 30, fontWeight: 700, color: accent, lineHeight: 1.1 }}>{value}</div>
          <div style={{ fontSize: 11, color: subColor || T.text }}>{sub}</div>
        </>
      )}
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  const [activeChart, setActiveChart] = useState('recovery');

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const chartMetrics = {
    recovery:   { key: 'recovery',   color: T.cyan,  label: 'Recovery %',    unit: '%' },
    production: { key: 'production', color: T.blue,  label: 'Production m³', unit: ' m³' },
    antiscalant:{ key: 'antiscalant',color: T.amber, label: 'Antiscalant L', unit: ' L' },
  };
  const cm = chartMetrics[activeChart];

  return (
    <div style={{ background: T.bg, minHeight: '100%', color: T.hi, fontFamily: "'DM Mono','Courier New',monospace" }}>
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .row-hover:hover { background: rgba(255,255,255,0.025) !important; }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.16em', marginBottom: 6 }}>OPERATIONS CENTER</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>System Overview</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.cyan, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' }}>
              {time.toLocaleTimeString()}
            </div>
            <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.1em', marginTop: 2 }}>
              {time.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, padding: '7px 14px', fontSize: 11, color: T.green, letterSpacing: '0.08em' }}>
            <PulsingDot color={T.green} /> ALL SYSTEMS OPERATIONAL
          </div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <KpiCard label="SYSTEM RECOVERY RATE" value="81.4%" sub="↑ 2.3% from yesterday" subColor={T.green} accent={T.teal} />
        <KpiCard label="TOTAL PRODUCTION TODAY" value="2,680 m³" sub="Borehole 3 · 1,240 m³" accent={T.blue} />
        <KpiCard label="ANTISCALANT CONSUMPTION" value="13.1 L" sub="Today · 395 L this month" accent={T.amber} />
        <KpiCard label="SYSTEM RUNTIME" accent={T.red}>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>142 hrs</div>
          <div style={{ fontSize: 11, color: T.red }}>⚠ Maintenance due in 18 hrs</div>
          <div style={{ marginTop: 10, height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '88%', background: `linear-gradient(90deg, ${T.amber}, ${T.red})`, borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 10, color: T.text, marginTop: 4 }}>160 hr maintenance cycle · 88% elapsed</div>
        </KpiCard>
      </div>

      {/* ── Gauges + switchable area chart ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14, marginBottom: 20 }}>
        {/* Gauge column */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <SectionLabel>KEY METRICS · LIVE</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <RadialGauge value={81.4} min={60} max={100} color={T.cyan}  label="Recovery" size={130} />
            <RadialGauge value={68}   min={0}  max={100} color={T.blue}  label="Capacity"  size={110} />
            <RadialGauge value={88}   min={0}  max={100} color={T.amber} label="Runtime"   size={110} unit="%" />
          </div>
        </div>

        {/* Switchable chart */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <SectionLabel>DAILY PERFORMANCE TREND</SectionLabel>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.entries(chartMetrics).map(([k, { label, color }]) => (
                <button key={k} onClick={() => setActiveChart(k)} style={{
                  background: activeChart === k ? `${color}18` : 'transparent',
                  border: `1px solid ${activeChart === k ? color : T.border}`,
                  borderRadius: 6, color: activeChart === k ? color : T.text,
                  padding: '5px 12px', cursor: 'pointer', fontSize: 10,
                  fontFamily: 'inherit', letterSpacing: '0.08em', transition: 'all 0.15s',
                }}>{label.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={cm.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={cm.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
              <XAxis dataKey="day" stroke="transparent" tick={{ fill: T.text, fontSize: 11 }} />
              <YAxis stroke="transparent" tick={{ fill: T.text, fontSize: 11 }} />
              <Tooltip {...tip} formatter={(v) => [`${v}${cm.unit}`, cm.label]} />
              <Area type="monotoneX" dataKey={cm.key} stroke={cm.color} strokeWidth={2.5}
                fill="url(#areaGrad)" dot={{ r: 4, fill: cm.color, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: cm.color, stroke: T.bg, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Antiscalant bar chart + pressure + recovery trend ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px 220px', gap: 14, marginBottom: 20 }}>
        {/* Antiscalant */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <SectionLabel>ANTISCALANT CONSUMPTION — MONTHLY</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ left: -20, right: 0, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
              <XAxis dataKey="month" stroke="transparent" tick={{ fill: T.text, fontSize: 11 }} />
              <YAxis stroke="transparent" tick={{ fill: T.text, fontSize: 11 }} />
              <Tooltip {...tip} formatter={(v) => [`${v} L`, 'Antiscalant']} />
              <Bar dataKey="antiscalant" fill={T.amber} radius={[5, 5, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, marginTop: 18, borderTop: `1px solid ${T.border}`, paddingTop: 18, textAlign: 'center' }}>
            {[['13.1 L', 'Today'], ['395 L', 'This Month'], ['4,820 L', 'Projected Yearly']].map(([v, l]) => (
              <div key={l} style={{ borderRight: l !== 'Projected Yearly' ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.amber }}>{v}</div>
                <div style={{ fontSize: 10, color: T.text, marginTop: 4, letterSpacing: '0.08em' }}>{l.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Differential pressure */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <SectionLabel>DIFFERENTIAL PRESSURE</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 8 }}>
            {pressureStages.map(({ label, pct, val, color, warn }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: T.text }}>{label}</span>
                  {warn && <span style={{ fontSize: 9, color: T.orange, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 3, padding: '1px 6px', letterSpacing: '0.08em' }}>HIGH</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, color, fontVariantNumeric: 'tabular-nums', minWidth: 56, textAlign: 'right' }}>{val}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.1em', marginBottom: 12 }}>BOREHOLE #3</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>1,240 m³</div>
            <div style={{ fontSize: 12, color: T.teal, marginTop: 4 }}>Active · Daily avg 1,180 m³</div>
          </div>
        </div>

        {/* Recovery rate big display */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
          <SectionLabel>RECOVERY RATE</SectionLabel>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ fontSize: 64, fontWeight: 700, color: T.cyan, lineHeight: 1, letterSpacing: '-0.02em' }}>81.4</div>
            <div style={{ fontSize: 22, color: T.text, marginTop: -4 }}>%</div>
            <div style={{ fontSize: 10, color: T.text, letterSpacing: '0.1em', marginTop: 6 }}>TARGET 78–85%</div>
            <div style={{ marginTop: 12, width: '100%' }}>
              {/* target band indicator */}
              <div style={{ position: 'relative', height: 8, background: T.border, borderRadius: 4, overflow: 'visible' }}>
                <div style={{ position: 'absolute', left: '78%', width: '7%', top: 0, height: '100%', background: 'rgba(34,211,238,0.15)', border: `1px solid ${T.cyan}` }} />
                <div style={{ position: 'absolute', left: `${(81.4 - 60) / 40 * 100}%`, top: -3, width: 3, height: 14, background: T.cyan, borderRadius: 2 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.text, marginTop: 5 }}>
                <span>60%</span><span style={{ color: T.cyan }}>78–85%</span><span>100%</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: T.text }}>7-day avg</span>
              <span style={{ color: T.hi }}>80.1%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ color: T.text }}>Monthly avg</span>
              <span style={{ color: T.hi }}>80.8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live station feed ── */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <SectionLabel>LIVE STATION FEED</SectionLabel>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: T.text }}>
            <span style={{ color: T.green }}>● NORMAL ×3</span>
            <span style={{ color: T.amber }}>● WARN ×1</span>
            <span style={{ color: T.red }}>● ALARM ×1</span>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['ID', 'STATION NAME', 'pH', 'TURBIDITY NTU', 'TEMP °C', 'STATUS', 'UPDATED'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 14px', color: T.text, fontWeight: 400, fontSize: 10, letterSpacing: '0.1em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stationFeed.map(s => {
              const rowAccent = s.status === 'alarm' ? 'rgba(239,68,68,0.06)' : s.status === 'warn' ? 'rgba(245,158,11,0.06)' : 'transparent';
              return (
                <tr key={s.id} className="row-hover" style={{ borderBottom: `1px solid ${T.border}`, background: rowAccent, cursor: 'default' }}>
                  <td style={{ padding: '12px 14px', color: T.text, fontSize: 11 }}>{s.id}</td>
                  <td style={{ padding: '12px 14px', color: T.hi, fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '12px 14px', color: s.ph < 6.5 || s.ph > 8.5 ? T.red : T.green, fontVariantNumeric: 'tabular-nums' }}>
                    {s.ph}
                    {(s.ph < 6.5 || s.ph > 8.5) && <span style={{ marginLeft: 6, fontSize: 10 }}>⚠</span>}
                  </td>
                  <td style={{ padding: '12px 14px', color: s.turbidity > 10 ? T.red : s.turbidity > 6 ? T.amber : T.hi, fontVariantNumeric: 'tabular-nums' }}>
                    {s.turbidity}
                    {s.turbidity > 10 && <span style={{ marginLeft: 6, fontSize: 10 }}>⚠</span>}
                  </td>
                  <td style={{ padding: '12px 14px', fontVariantNumeric: 'tabular-nums' }}>{s.temp}</td>
                  <td style={{ padding: '12px 14px' }}><StatusBadge status={s.status} /></td>
                  <td style={{ padding: '12px 14px', color: T.text, fontSize: 11 }}>{s.last}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}