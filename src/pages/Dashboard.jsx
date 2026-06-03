import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine,
} from 'recharts';

// ─── DATA ────────────────────────────────────────────────────────────────────

const performanceData = [
  { day: 'Mon', recovery: 78, production: 2450, antiscalant: 12.4 },
  { day: 'Tue', recovery: 81, production: 2680, antiscalant: 13.1 },
  { day: 'Wed', recovery: 76, production: 2390, antiscalant: 11.8 },
  { day: 'Thu', recovery: 83, production: 2750, antiscalant: 13.5 },
  { day: 'Fri', recovery: 79, production: 2580, antiscalant: 12.7 },
  { day: 'Sat', recovery: 82, production: 2690, antiscalant: 13.0 },
  { day: 'Sun', recovery: 80, production: 2520, antiscalant: 12.5 },
];

const monthlyData = [
  { month: 'Jan', antiscalant: 380 },
  { month: 'Feb', antiscalant: 395 },
  { month: 'Mar', antiscalant: 365 },
  { month: 'Apr', antiscalant: 420 },
];

const liveStations = [
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

// ─── PALETTE ─────────────────────────────────────────────────────────────────

const C = {
  bg:     '#060D18',
  panel:  '#0B1628',
  card:   '#0F1E30',
  border: '#162336',
  borderHi: '#1E3347',
  text:   '#94b8d0',
  hi:     '#cde4f0',
  dim:    '#3d6070',
  teal:   '#14b8a6',
  cyan:   '#22d3ee',
  blue:   '#3b82f6',
  amber:  '#f59e0b',
  red:    '#ef4444',
  green:  '#22c55e',
  orange: '#f97316',
};

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const tt = {
  contentStyle: {
    background: '#0B1628', border: '1px solid #1E3347',
    borderRadius: 8, color: '#94b8d0', fontSize: 11,
    fontFamily: "'DM Mono','Courier New',monospace",
  },
  labelStyle: { color: '#3d6070', fontSize: 10 },
  itemStyle:  { color: '#cde4f0' },
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: C.dim, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-block', width: 16, height: 1, background: C.borderHi }} />
      {children}
      <span style={{ display: 'inline-block', flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function KpiCard({ label, value, sub, subColor, valueColor, accent, icon }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderTop: `2px solid ${accent}`, borderRadius: 12,
      padding: '18px 20px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 14, right: 16,
        fontSize: 20, opacity: 0.08, color: accent,
      }}>{icon}</div>
      <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.12em', marginBottom: 10 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: valueColor || C.hi, lineHeight: 1, marginBottom: 8, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 11, color: subColor || C.dim }}>{sub}</div>
    </div>
  );
}

function GaugeArc({ pct, color, size = 100 }) {
  const r = 38, cx = 50, cy = 54;
  const circ = Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 100 62" style={{ overflow: 'visible' }}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={C.border} strokeWidth="7" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  );
}

function StatusDot({ status }) {
  const col = status === 'normal' ? C.green : status === 'warn' ? C.amber : C.red;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: col,
        boxShadow: status === 'alarm' ? `0 0 6px ${col}` : 'none',
        animation: status === 'alarm' ? 'pulse 1.5s infinite' : 'none',
      }} />
      <span style={{ fontSize: 10, letterSpacing: '0.1em', fontWeight: 700, color: col }}>
        {status.toUpperCase()}
      </span>
    </span>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);

  const timeStr = time.toTimeString().slice(0, 8);

  return (
    <div style={{
      background: C.bg, minHeight: '100vh', color: C.text,
      fontFamily: "'DM Mono','Courier New',monospace",
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes blink { 0%,100%{opacity:1} 49%{opacity:1} 50%{opacity:0} 99%{opacity:0} }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${C.border}`,
      }}>
        <div>
          <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.18em', marginBottom: 6 }}>
            AQUASYNC SCADA · WATER MONITORING SYSTEM
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.hi, margin: 0, letterSpacing: '-0.02em' }}>
            System Overview
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.cyan, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' }}>
              {timeStr}
            </div>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.12em' }}>UTC+03:00 · LIVE</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '8px 14px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
            <span style={{ fontSize: 10, color: C.green, letterSpacing: '0.1em' }}>ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard label="System Recovery Rate"    value="81.4%"    sub="↑ 2.3% from yesterday" subColor={C.green}  valueColor={C.teal}  accent={C.teal}   icon="◈" />
        <KpiCard label="Total Production Today"  value="2,680 m³" sub="Borehole 3 · 1,240 m³"  subColor={C.dim}   valueColor={C.hi}    accent={C.blue}   icon="⬡" />
        <KpiCard label="Antiscalant Consumption" value="13.1 L"   sub="Today · 395 L this month" subColor={C.dim}  valueColor={C.amber} accent={C.amber}  icon="◬" />
        <KpiCard label="System Runtime"          value="142 hrs"  sub="⚠ Maintenance in 18 hrs" subColor={C.red}  valueColor={C.hi}    accent={C.red}    icon="◉" />
      </div>

      {/* ── Recovery + Production ── */}
      <SectionLabel>PERFORMANCE CHARTS</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, marginBottom: 24 }}>

        {/* Area chart: production */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 20px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.12em' }}>DAILY PRODUCTION · m³</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 10 }}>
              <span style={{ color: C.teal }}>— Recovery %</span>
              <span style={{ color: C.blue }}>▪ Production</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.blue} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={C.border} />
              <XAxis dataKey="day" stroke={C.dim} tick={{ fontSize: 10, fill: C.dim }} axisLine={false} tickLine={false} />
              <YAxis stroke={C.dim} tick={{ fontSize: 10, fill: C.dim }} axisLine={false} tickLine={false} />
              <Tooltip {...tt} />
              <Area type="monotone" dataKey="production" stroke={C.blue} strokeWidth={2} fill="url(#prodGrad)" dot={false} name="Production m³" />
              <Line type="monotone" dataKey="recovery"   stroke={C.teal} strokeWidth={2} dot={false} name="Recovery %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recovery rate trend with reference band */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 20px 12px' }}>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.12em', marginBottom: 20 }}>RECOVERY RATE TREND · %</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="2 4" stroke={C.border} />
              <XAxis dataKey="day" stroke={C.dim} tick={{ fontSize: 10, fill: C.dim }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 90]} stroke={C.dim} tick={{ fontSize: 10, fill: C.dim }} axisLine={false} tickLine={false} />
              <Tooltip {...tt} />
              <ReferenceLine y={85} stroke={C.red}   strokeDasharray="3 3" label={{ value: 'MAX', fill: C.red,   fontSize: 9, position: 'right' }} />
              <ReferenceLine y={78} stroke={C.green} strokeDasharray="3 3" label={{ value: 'MIN', fill: C.green, fontSize: 9, position: 'right' }} />
              <Line type="monotone" dataKey="recovery" stroke={C.cyan} strokeWidth={2.5}
                dot={{ r: 4, fill: C.cyan, stroke: C.bg, strokeWidth: 2 }} name="Recovery %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Antiscalant + Pressure + Gauges ── */}
      <SectionLabel>CHEMICAL & PRESSURE MONITORING</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, marginBottom: 24 }}>

        {/* Antiscalant bar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 20px 12px' }}>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.12em', marginBottom: 20 }}>ANTISCALANT DOSING · L / MONTH</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barSize={36}>
              <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false} />
              <XAxis dataKey="month" stroke={C.dim} tick={{ fontSize: 10, fill: C.dim }} axisLine={false} tickLine={false} />
              <YAxis stroke={C.dim} tick={{ fontSize: 10, fill: C.dim }} axisLine={false} tickLine={false} domain={[340, 440]} />
              <Tooltip {...tt} />
              <Bar dataKey="antiscalant" fill={C.amber} radius={[5,5,0,0]} name="Antiscalant L" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 10, textAlign: 'center', gap: 8 }}>
            {[['13.1 L','Today'],['395 L','This Month'],['4,820 L','Projected Yearly']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.amber, letterSpacing: '-0.01em' }}>{v}</div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Differential pressure */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.12em', marginBottom: 22 }}>DIFFERENTIAL PRESSURE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {pressureStages.map(({ label, pct, val, color, warn }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 11, color: C.text }}>{label}</span>
                  {warn && <span style={{ fontSize: 9, color: C.orange, letterSpacing: '0.1em', fontWeight: 700 }}>HIGH</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: 12, color, fontFamily: 'monospace', minWidth: 56, textAlign: 'right' }}>{val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recovery gauge */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.12em', marginBottom: 12, alignSelf: 'flex-start' }}>RECOVERY RATE</div>
          <GaugeArc pct={81.4} color={C.cyan} size={140} />
          <div style={{ textAlign: 'center', marginTop: -4 }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: C.cyan, letterSpacing: '-0.03em', lineHeight: 1 }}>81.4%</div>
            <div style={{ fontSize: 10, color: C.dim, marginTop: 6 }}>Target: 78 – 85 %</div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20, fontSize: 10 }}>
            <span style={{ color: C.green }}>▼ MIN 78%</span>
            <span style={{ color: C.red }}>▲ MAX 85%</span>
          </div>
        </div>
      </div>

      {/* ── Borehole + Runtime ── */}
      <SectionLabel>BOREHOLE & RUNTIME</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.12em', marginBottom: 14 }}>BOREHOLE PRODUCTION</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: C.hi, letterSpacing: '-0.03em' }}>1,240</span>
            <span style={{ fontSize: 18, color: C.dim }}>m³</span>
          </div>
          <div style={{ color: C.teal, fontSize: 12, marginBottom: 18 }}>Borehole #3 · Active</div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <div><div style={{ color: C.dim, marginBottom: 3 }}>Daily Avg</div><div style={{ color: C.hi }}>1,180 m³</div></div>
            <div><div style={{ color: C.dim, marginBottom: 3 }}>This Month</div><div style={{ color: C.hi }}>36,400 m³</div></div>
            <div><div style={{ color: C.dim, marginBottom: 3 }}>Efficiency</div><div style={{ color: C.green }}>94.8%</div></div>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.red}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.12em', marginBottom: 14 }}>SYSTEM RUNTIME</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: C.hi, letterSpacing: '-0.03em' }}>142</span>
            <span style={{ fontSize: 18, color: C.dim }}>hrs</span>
          </div>
          <div style={{ color: C.dim, fontSize: 12, marginBottom: 18 }}>This Month</div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 14, animation: 'blink 1s infinite' }}>⚠</span>
              <span style={{ fontSize: 12, color: C.red, fontWeight: 700 }}>Maintenance due in 18 hours</span>
            </div>
            <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '88%', background: `linear-gradient(90deg, ${C.amber}, ${C.red})`, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 10, color: C.dim, marginTop: 5, textAlign: 'right' }}>142 / 160 hrs cycle</div>
          </div>
        </div>
      </div>

      {/* ── Live Station Feed ── */}
      <SectionLabel>LIVE STATION FEED</SectionLabel>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: C.panel }}>
              {['STATION ID','NAME','pH','TURBIDITY NTU','TEMP °C','STATUS','LAST PING'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: C.dim, fontWeight: 400, letterSpacing: '0.1em', fontSize: 9, borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liveStations.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < liveStations.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '13px 16px', color: C.dim, fontFamily: 'monospace', fontSize: 11 }}>{s.id}</td>
                <td style={{ padding: '13px 16px', color: C.hi, fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '13px 16px', color: s.ph < 6.5 || s.ph > 8.5 ? C.red : C.green, fontFamily: 'monospace' }}>{s.ph}</td>
                <td style={{ padding: '13px 16px', color: s.turbidity > 10 ? C.red : s.turbidity > 6 ? C.amber : C.text, fontFamily: 'monospace' }}>{s.turbidity}</td>
                <td style={{ padding: '13px 16px', fontFamily: 'monospace' }}>{s.temp}</td>
                <td style={{ padding: '13px 16px' }}><StatusDot status={s.status} /></td>
                <td style={{ padding: '13px 16px', color: C.dim }}>{s.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}