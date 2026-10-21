// src/components/MimicEditor.jsx
// Process mimic (P&ID) page: drag-and-drop widgets bound to live tags, neon-on-black look.
//  - Everyone sees the live diagram. Only admins get the "Edit" button.
//  - Widgets: tank, vessel, pump, gauge, value card, pipe, status pill, text.
//  - A widget turns red and pulses when its value is outside its Low / High limit.
//  - Pumps spin and pipes flow when their tag is ON (or a number above 0).
//  - Layout is saved in this browser (localStorage) and can be exported / imported as a .json file.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Eye, Trash2, Copy, Download, Upload, LayoutTemplate, RotateCcw } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { rawToPercent } from './dashboardComponents/feedTankCalibration';

const STORAGE_KEY = 'mimic-layout-v2';
const STORAGE_KEY_P = 'mimic-layout-portrait-v1';   // phone (vertical) layout
const PORTRAIT_BELOW = 640;                           // px of available width
const PAD = 24;
const CANVAS_W = 1340;
const CANVAS_H = 560;
const CANVAS_PW = 400;
const CANVAS_PH = 1060;

const NEON = {
  cyan: '#00e5ff',
  green: '#39ff88',
  lime: '#b8ff00',
  amber: '#ffae00',
  red: '#ff3355',
  magenta: '#ff2bd6',
  violet: '#b48cff',
  white: '#e8eef8',
  grey: '#4a5b6b',
};
// pipes use flatter, darker tones
const PIPE = { blue: '#0b6fb0', teal: '#0b8fa3', magenta: '#a2229a', olive: '#6f9a10', cyan: '#0b6fb0' };
const COLOR_CHOICES = ['cyan', 'lime', 'amber', 'magenta', 'white'];
const PIPE_CHOICES = ['blue', 'teal', 'magenta', 'olive'];
const LABEL_COLOR = '#9fd0ff';
const MONO = 'var(--font-mono, ui-monospace, monospace)';

/* ------------------------------------------------------------------ helpers */

const snap = (n, step = 10) => Math.round(n / step) * step;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const uid = () => Math.random().toString(36).slice(2, 9);

function readNumber(sensorData, tag) {
  if (!tag) return null;
  const v = sensorData?.[tag]?.value;
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const s = String(v).trim().toUpperCase();
  if (s === 'ON' || s === 'TRUE' || s === 'RUNNING') return 1;
  if (s === 'OFF' || s === 'FALSE' || s === 'STOPPED') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Same numbers the Dashboard shows, built from the same MQTT tags:
 *  - RO5-FeedTankLevel  = calibrated % from the raw transmitter (RO5-FeedTankLevelRaw, 4.9 = 0 %, 10.0 = 100 %)
 *  - RO5-FlushTankPct   = % from RO5-FlushTank (0 = 0 %, 126 = 100 %)
 *  - MIMIC-Running      = 1 when the feed pump, HP pump, backwash or the SystemActive bit is on
 */
const FLUSH_FULL_RAW = 126;
function withDerived(sensorData) {
  const out = { ...sensorData };
  const raw = readNumber(sensorData, 'RO5-FeedTankLevelRaw');
  if (raw !== null) out['RO5-FeedTankLevel'] = { ...(sensorData['RO5-FeedTankLevelRaw'] || {}), value: rawToPercent(raw) };
  const fl = readNumber(sensorData, 'RO5-FlushTank');
  if (fl !== null) out['RO5-FlushTankPct'] = { value: clamp((fl / FLUSH_FULL_RAW) * 100, 0, 100) };
  const bits = ['RO5-Feedpump', 'RO5-HPPpump', 'RO5-SystemActive', 'RO5-PrefilterBackwash', 'RO5-PrefilterBackwashing']
    .map((t) => readNumber(sensorData, t));
  if (bits.some((b) => b !== null)) out['MIMIC-Running'] = { value: bits.some((b) => (b || 0) > 0) ? 1 : 0 };
  return out;
}

/** 'nodata' | 'alarm' | 'ok' for one widget. */
function statusOf(w, v) {
  if (!w.tag) return 'ok';
  if (v === null) return 'nodata';
  const lo = w.lo === '' || w.lo === undefined || w.lo === null ? null : Number(w.lo);
  const hi = w.hi === '' || w.hi === undefined || w.hi === null ? null : Number(w.hi);
  if (lo !== null && Number.isFinite(lo) && v < lo) return 'alarm';
  if (hi !== null && Number.isFinite(hi) && v > hi) return 'alarm';
  return 'ok';
}

function fmt(v, digits = 1) {
  if (v === null || v === undefined) return '--';
  return Number.isInteger(v) ? String(v) : v.toFixed(digits);
}

/* ------------------------------------------------------------------ defaults */

const DEFAULTS = {
  tank:   { w: 125, h: 214, label: 'Tank',       unit: '%',    min: 0, max: 100, color: 'cyan' },
  vessel: { w: 91,  h: 152, label: 'Vessel',     unit: 'bar',  min: 0, max: 20,  color: 'white' },
  ro2:    { w: 212, h: 208, label: 'Two Stage RO System\n(Concentrate Staging)', unit: 'bar', min: 0, max: 25, color: 'white', tag: 'RO5-ROPressure', tag2: 'RO5-InterstagePress', tag3: 'RO5-ConcetratePress' },
  pump:   { w: 80,  h: 100, label: 'Pump',       unit: '',     min: 0, max: 1,   color: 'lime', pumpAnim: 'rotate' },
  gauge:  { w: 140, h: 130, label: 'Pressure',   unit: 'bar',  min: 0, max: 20,  color: 'amber' },
  data:   { w: 170, h: 32,  label: 'FLOW',       unit: 'm³/h', min: 0, max: 100, color: 'cyan' },
  pipe:   { w: 140, h: 14,  label: '',           unit: '',     min: 0, max: 1,   color: 'blue' },
  pill:   { w: 150, h: 32,  label: 'Status',     unit: '',     min: 0, max: 1,   color: 'lime' },
  text:   { w: 200, h: 24,  label: 'Label',      unit: '',     min: 0, max: 1,   color: 'cyan' },
};

const PALETTE = [
  ['tank', 'Tank'], ['vessel', 'Vessel'], ['ro2', 'Two-stage RO'], ['pump', 'Pump'], ['gauge', 'Gauge'],
  ['data', 'Data pill'], ['pipe', 'Pipe'], ['pill', 'Status'], ['text', 'Text'],
];

function makeWidget(type, x = 40, y = 40, over = {}) {
  return { id: uid(), type, x: Math.round(x), y: Math.round(y), tag: '', tag2: '', tag3: '', animTag: '', lo: '', hi: '', ...DEFAULTS[type], ...over };
}

/** The RO train, laid out like the client's SCADA and bound to the tags your plant already publishes. */
function roTemplate() {
  const W = (type, x, y, over) => makeWidget(type, x, y, over);
  return [
    // pipes first so equipment draws on top of them
    W('pipe', 156, 263, { w: 705, h: 14, color: 'blue', tag: 'MIMIC-Running' }),
    W('pipe', 899, 113, { w: 137, h: 10, color: 'teal', tag: 'RO5-Permeateflow' }),
    W('pipe', 960, 396, { w: 10, h: 44, color: 'magenta', tag: 'RO5-ConcetrateFlow' }),
    W('pipe', 331, 275, { w: 11, h: 210, color: 'olive', tag: 'RO5-AntiscalantDosingActive' }),

    W('tank', 34, 167, { w: 125, h: 214, label: 'Feed tank', tag: 'RO5-FeedTankLevel', unit: '%', lo: 20 }),
    W('pump', 223, 230, { w: 80, h: 100, label: 'Feed pump', tag: 'RO5-Feedpump', color: 'lime' }),
    W('vessel', 368, 179, { w: 91, h: 152, label: 'Media filter', tag: 'RO5-MediaFilterInPress', unit: 'bar', max: 10 }),
    W('vessel', 524, 190, { w: 58, h: 130, label: 'Cartridge', unit: '' }),
    W('pump', 655, 225, { w: 96, h: 112, label: 'HP pump', tag: 'RO5-HPPpump', color: 'amber' }),
    W('gauge', 770, 20, { w: 140, h: 150, label: '', tag: 'RO5-ROPressure', unit: 'bar', max: 20, hi: 18, color: 'amber' }),
    W('ro2', 859, 190, { w: 212, h: 208 }),
    W('data', 1036, 96, { w: 170, h: 32, label: 'PERM', tag: 'RO5-Permeateflow', unit: 'm³/h', color: 'cyan' }),
    W('data', 870, 436, { w: 191, h: 32, label: 'CONC → DRAIN', tag: 'RO5-ConcetrateFlow', unit: 'm³/h', color: 'magenta' }),
    W('tank', 246, 391, { w: 67, h: 113, label: 'Antiscalant', tag: 'RO5-AntiscalantDaily', unit: 'ml', min: 0, max: 5000, color: 'lime' }),
  ];
}

/** Same plant, stacked top-to-bottom for phones. */
function roTemplatePortrait() {
  const W = (type, x, y, over) => makeWidget(type, x, y, over);
  return [
    W('pipe', 193, 170, { w: 14, h: 610, color: 'blue', tag: 'MIMIC-Running' }),
    W('pipe', 90, 380, { w: 106, h: 11, color: 'olive', tag: 'RO5-AntiscalantDosingActive' }),
    W('pipe', 195, 970, { w: 10, h: 42, color: 'magenta', tag: 'RO5-ConcetrateFlow' }),

    W('tank', 145, 10, { w: 110, h: 170, label: 'Feed tank', tag: 'RO5-FeedTankLevel', unit: '%', lo: 20 }),
    W('pump', 160, 205, { w: 80, h: 100, label: 'Feed pump', tag: 'RO5-Feedpump', color: 'lime' }),
    W('vessel', 155, 320, { w: 91, h: 130, label: 'Media filter', tag: 'RO5-MediaFilterInPress', unit: 'bar', max: 10 }),
    W('tank', 14, 350, { w: 72, h: 120, label: 'Antiscalant', tag: 'RO5-AntiscalantDaily', unit: 'ml', min: 0, max: 5000, color: 'lime' }),
    W('vessel', 171, 470, { w: 58, h: 110, label: 'Cartridge', unit: '' }),
    W('pump', 152, 600, { w: 96, h: 112, label: 'HP pump', tag: 'RO5-HPPpump', color: 'amber' }),
    W('gauge', 262, 585, { w: 130, h: 150, label: '', tag: 'RO5-ROPressure', unit: 'bar', max: 20, hi: 18, color: 'amber' }),
    W('ro2', 80, 770, { w: 240, h: 200 }),
    W('data', 215, 718, { w: 170, h: 30, label: 'PERM', tag: 'RO5-Permeateflow', unit: 'm³/h', color: 'cyan' }),
    W('data', 105, 1012, { w: 191, h: 32, label: 'CONC → DRAIN', tag: 'RO5-ConcetrateFlow', unit: 'm³/h', color: 'magenta' }),
  ];
}

/* ------------------------------------------------------------------ widget drawings */

function useColors(w, v) {
  const status = statusOf(w, v);
  const base = NEON[w.color] || NEON.cyan;
  const color = status === 'alarm' ? NEON.red : base;
  return { status, color, base };
}
const glowOf = (c, r = 6) => `drop-shadow(0 0 ${r}px ${c}) drop-shadow(0 0 ${r * 2.2}px ${c}55)`;
const pulse = (status) => (status === 'alarm' ? 'neon-pulse 1s infinite' : 'none');

function Label({ children, style }) {
  if (!children) return null;
  return (
    <div style={{
      color: LABEL_COLOR, fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase',
      textAlign: 'center', whiteSpace: 'nowrap', lineHeight: '14px', ...style,
    }}>{children}</div>
  );
}

function Tank({ w, v }) {
  const { status, color } = useColors(w, v);
  const W = w.w, H = w.h - 22;
  const range = (Number(w.max) - Number(w.min)) || 1;
  const pct = v === null ? 0 : clamp(((v - Number(w.min)) / range) * 100, 0, 100);
  const showPct = w.unit === '%' || w.unit === '';
  const big = v === null ? '--' : showPct ? `${Math.round(pct)}%` : (Math.abs(v) >= 100 ? String(Math.round(v)) : fmt(v));
  const unitLine = v !== null && !showPct ? w.unit : '';
  const gid = `tg-${w.id}`;
  const fillH = ((H - 8) * pct) / 100;
  const small = W < 90;
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', filter: glowOf(color, small ? 4 : 6), animation: pulse(status), overflow: 'visible' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b323f" />
            <stop offset="0.55" stopColor="#0d1119" />
            <stop offset="1" stopColor="#04060a" />
          </linearGradient>
          <clipPath id={`${gid}-c`}><rect x="2" y="2" width={W - 4} height={H - 4} rx={small ? 14 : 18} /></clipPath>
        </defs>
        <rect x="2" y="2" width={W - 4} height={H - 4} rx={small ? 14 : 18} fill={`url(#${gid})`} stroke={color} strokeWidth="3" />
        <g clipPath={`url(#${gid}-c)`}>
          <rect x="2" y={H - 2 - fillH} width={W - 4} height={fillH} fill={color} opacity="0.22" />
        </g>
        <text x={W / 2} y={H / 2 + (unitLine ? 2 : small ? 6 : 8)} textAnchor="middle" fontSize={small ? 18 : 23} fontWeight="800" fill="#ffffff" fontFamily="Inter, system-ui, sans-serif">{big}</text>
        {unitLine ? <text x={W / 2} y={H / 2 + 18} textAnchor="middle" fontSize="11" fontWeight="700" fill={color} fontFamily="Inter, system-ui, sans-serif">{unitLine}</text> : null}
      </svg>
      <Label style={{ marginTop: 6 }}>{w.label}</Label>
    </div>
  );
}

function Vessel({ w, v }) {
  const { status, color } = useColors(w, v);
  const W = w.w, H = w.h - 16;
  const gid = `vg-${w.id}`;
  const lines = [];
  for (let y = 22; y < H - 26; y += 15.5) lines.push(y);
  const text = v === null ? `– ${w.unit}` : `${fmt(v)} ${w.unit}`;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Label style={{ height: 16, marginBottom: 0 }}>{w.label}</Label>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', filter: glowOf(color, 5), animation: pulse(status), overflow: 'visible' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#323a49" />
            <stop offset="0.6" stopColor="#10151f" />
            <stop offset="1" stopColor="#070a10" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width={W - 4} height={H - 4} rx={Math.min(14, W / 3)} fill={`url(#${gid})`} stroke={color} strokeWidth="2.5" />
        {lines.map((y) => (
          <line key={y} x1="10" y1={y} x2={W - 10} y2={y} stroke="#566074" strokeOpacity="0.7" strokeWidth="1.2" />
        ))}
        {w.unit !== '' && (
          <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="11" fontWeight="800" fill="#ffffff" fontFamily="Inter, system-ui, sans-serif">{text}</text>
        )}
      </svg>
    </div>
  );
}

function Pump({ w, v, anim }) {
  const { status, color } = useColors(w, v);
  const on = (anim ?? v ?? 0) > 0;
  const mode = w.pumpAnim || 'rotate';           // 'rotate' | 'blink' | 'none'
  const area = w.h - 22;
  const r = Math.min(w.w, area) / 2 - 4;
  const cx = w.w / 2, cy = area / 2;
  // triangle drawn around its own centre so it turns on the spot
  const tri = `0,${-r * 0.61} ${r * 0.47},${r * 0.31} ${-r * 0.47},${r * 0.31}`;
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <svg width={w.w} height={area} viewBox={`0 0 ${w.w} ${area}`} style={{ display: 'block', filter: glowOf(color, 6), animation: pulse(status), overflow: 'visible' }}>
        <circle cx={cx} cy={cy} r={r} fill="#050a10" stroke={color} strokeWidth="4"
          style={{ animation: on && mode === 'blink' ? 'neon-run 2.4s ease-in-out infinite' : 'none' }} />
        <g transform={`translate(${cx} ${cy})`}>
          <g>
            <polygon points={tri} fill={color} />
            {on && mode === 'rotate' && (
              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.6s" repeatCount="indefinite" />
            )}
          </g>
        </g>
      </svg>
      <Label style={{ marginTop: 6 }}>{w.label}</Label>
    </div>
  );
}

// Dark neon arc dial (0 - max), orange danger zone near the top end, white needle.
function Gauge({ w, v }) {
  const { status } = useColors(w, v);
  const size = Math.max(60, Math.min(w.w, w.h));
  const min = Number(w.min) || 0;
  const max = Number(w.max) > min ? Number(w.max) : 20;
  const frac = (x) => clamp((x - min) / (max - min), 0, 1);
  const ang = (x) => ((135 + 270 * frac(x)) * Math.PI) / 180;
  const C = 100, R = 82;
  const pt = (x, r) => [C + r * Math.cos(ang(x)), C + r * Math.sin(ang(x))];
  const arc = (x0, x1) => {
    const [ax, ay] = pt(x0, R), [bx, by] = pt(x1, R);
    const large = 270 * (frac(x1) - frac(x0)) > 180 ? 1 : 0;
    return `M ${ax} ${ay} A ${R} ${R} 0 ${large} 1 ${bx} ${by}`;
  };
  const zoneFrom = min + (max - min) * 0.8;
  const step = (max - min) / 10;
  const ticks = Array.from({ length: 11 }, (_, i) => min + i * step);
  const shown = v === null ? min : v;
  const [nx, ny] = pt(shown, 64);
  const valueColor = status === 'alarm' ? NEON.red : NEON.amber;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: pulse(status) }}>
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ display: 'block', overflow: 'visible' }}>
        <path d={arc(min, max)} fill="none" stroke="#151c2a" strokeWidth="13" strokeLinecap="round" />
        <path d={arc(zoneFrom, max)} fill="none" stroke={NEON.amber} strokeWidth="13" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${NEON.amber})` }} />
        {ticks.map((t, i) => {
          const major = i % 2 === 0;
          const [x1, y1] = pt(t, R - 11), [x2, y2] = pt(t, R - (major ? 19 : 16));
          const [lx, ly] = pt(t, R - 30);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5b6b82" strokeWidth={major ? 1.6 : 1} />
              {major && <text x={lx} y={ly + 3} textAnchor="middle" fontSize="9" fill="#7d8aa0" fontFamily="Inter, system-ui, sans-serif">{Math.round(t)}</text>}
            </g>
          );
        })}
        <line x1={C} y1={C} x2={nx} y2={ny} stroke="#e8eef8" strokeWidth="3" strokeLinecap="round" />
        <circle cx={C} cy={C} r="6" fill={NEON.amber} style={{ filter: `drop-shadow(0 0 5px ${NEON.amber})` }} />
        <text x={C} y="150" textAnchor="middle" fontSize="30" fontWeight="800" fill={valueColor} fontFamily="Inter, system-ui, sans-serif" style={{ filter: `drop-shadow(0 0 5px ${valueColor}88)` }}>{v === null ? '--' : fmt(v)}</text>
        <text x={C} y="168" textAnchor="middle" fontSize="11" fontWeight="800" fill={NEON.magenta} fontFamily="Inter, system-ui, sans-serif">{String(w.unit || 'bar').toUpperCase()}</text>
      </svg>
      {w.label ? <Label>{w.label}</Label> : null}
    </div>
  );
}

// One vessel for the whole two-stage train: inlet -> interstage -> concentrate pressures and the drop across each stage.
function TwoStageVessel({ w, v1, v2, v3 }) {
  const W = w.w, H = w.h;
  const gid = `rg-${w.id}`;
  const lines = [];
  for (let y = 18; y < H - 12; y += 15.5) lines.push(y);
  const [l1, l2] = String(w.label || '').split('\n');
  const d = (a, b) => (a === null || b === null ? null : Math.max(0, a - b));
  const stage = (x, title, a, b) => (
    <g>
      <text x={x} y={H * 0.58} textAnchor="middle" fontSize="11" fontWeight="800" fill={LABEL_COLOR} fontFamily="Inter, system-ui, sans-serif">{title}</text>
      <text x={x} y={H * 0.58 + 22} textAnchor="middle" fontSize="15" fontWeight="800" fill="#ffffff" fontFamily="Inter, system-ui, sans-serif">{a === null ? '--' : fmt(a)} → {b === null ? '--' : fmt(b)}</text>
      <text x={x} y={H * 0.58 + 38} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#8fa3bd" fontFamily="Inter, system-ui, sans-serif">bar</text>
      <text x={x} y={H * 0.58 + 56} textAnchor="middle" fontSize="12" fontWeight="800" fill={NEON.cyan} fontFamily="Inter, system-ui, sans-serif">ΔP {d(a, b) === null ? '--' : d(a, b).toFixed(2)}</text>
    </g>
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', filter: glowOf('#e8eef8', 5), overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#323a49" /><stop offset="0.6" stopColor="#10151f" /><stop offset="1" stopColor="#070a10" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width={W - 4} height={H - 4} rx="16" fill={`url(#${gid})`} stroke="#e8eef8" strokeWidth="2.5" />
      {lines.map((y) => <line key={y} x1="10" y1={y} x2={W - 10} y2={y} stroke="#566074" strokeOpacity="0.55" strokeWidth="1.1" />)}
      <rect x="10" y="16" width={W - 20} height="50" rx="8" fill="#0a0f18" fillOpacity="0.82" />
      <text x={W / 2} y="38" textAnchor="middle" fontSize="15.5" fontWeight="800" fill="#ffc400" fontFamily="Inter, system-ui, sans-serif" style={{ filter: 'drop-shadow(0 0 5px #ff8c0099)' }}>{l1}</text>
      {l2 ? <text x={W / 2} y="57" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#ff9a1f" fontFamily="Inter, system-ui, sans-serif">{l2}</text> : null}
      <line x1={W / 2} y1={H * 0.5} x2={W / 2} y2={H - 14} stroke="#566074" strokeWidth="1.2" />
      {stage(W * 0.25, 'STAGE-1', v1, v2)}
      {stage(W * 0.75, 'STAGE-2', v2, v3)}
    </svg>
  );
}

function DataPill({ w, v }) {
  const { status, color } = useColors(w, v);
  return (
    <div style={{
      width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: 999, border: `2.5px solid ${color}`, color,
      background: '#050a14', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap',
      filter: glowOf(color, 5), fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12.5, fontWeight: 800, letterSpacing: '0.02em',
      animation: pulse(status),
    }}>
      {w.label} {v === null ? '–' : fmt(v)} {w.unit}
    </div>
  );
}

function ValueStatusPill({ w, v }) {
  const { color } = useColors({ ...w, lo: '', hi: '' }, v);
  const on = (v ?? 0) > 0;
  const c = v === null ? NEON.grey : on ? color : NEON.grey;
  return (
    <div style={{
      width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: 999, border: `2.5px solid ${c}`, color: c,
      background: '#050a14', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, filter: glowOf(c, 4),
      fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, fontWeight: 800, letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}` }} />
      {w.label}: {v === null ? '--' : on ? 'ON' : 'OFF'}
    </div>
  );
}

function Pipe({ w, v, anim }) {
  const flowing = (anim ?? v ?? 0) > 0;
  const col = PIPE[w.color] || PIPE.blue;
  const horizontal = w.w >= w.h;
  const t = horizontal ? w.h : w.w;
  const len = horizontal ? w.w : w.h;
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w.w} ${w.h}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <rect x="0" y="0" width={w.w} height={w.h} rx={Math.min(t / 2, 4)} fill={col} />
      {flowing && (
        <line
          x1={horizontal ? 4 : w.w / 2} y1={horizontal ? w.h / 2 : 4}
          x2={horizontal ? len - 4 : w.w / 2} y2={horizontal ? w.h / 2 : len - 4}
          stroke="#ffffff" strokeOpacity="0.28" strokeWidth={Math.max(2, t / 5)} strokeLinecap="round" strokeDasharray="8 16"
          style={{ animation: 'neon-flow 0.9s linear infinite' }}
        />
      )}
    </svg>
  );
}

function ValueCard({ w, v }) {
  const { status, color } = useColors(w, v);
  return (
    <div style={{
      width: '100%', height: '100%', boxSizing: 'border-box', border: `2px solid ${color}`, borderRadius: 12,
      background: '#050a14', color, filter: glowOf(color, 4), padding: '6px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif', animation: pulse(status),
    }}>
      <div style={{ fontSize: 11, color: LABEL_COLOR, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>
        {fmt(v)}<span style={{ fontSize: 11, marginLeft: 4 }}>{v !== null ? w.unit : ''}</span>
      </div>
    </div>
  );
}

function TextLabel({ w }) {
  const c = w.tcolor ? NEON[w.tcolor] || LABEL_COLOR : LABEL_COLOR;
  const centre = w.align === 'center';
  return (
    <Label style={{
      textAlign: centre ? 'center' : 'left', fontSize: w.tcolor ? 14 : 13, color: c, whiteSpace: 'pre-line', lineHeight: '18px',
      textShadow: w.tcolor ? `0 0 8px ${c}88, 0 1px 2px #000` : 'none', letterSpacing: '0.02em',
    }}>{w.label}</Label>
  );
}

function WidgetBody({ w, sensorData }) {
  const v = readNumber(sensorData, w.tag);
  const anim = w.animTag ? readNumber(sensorData, w.animTag) : null;
  switch (w.type) {
    case 'tank': return <Tank w={w} v={v} />;
    case 'vessel': return <Vessel w={w} v={v} />;
    case 'pump': return <Pump w={w} v={v} anim={anim} />;
    case 'gauge': return <Gauge w={w} v={v} />;
    case 'ro2': return <TwoStageVessel w={w} v1={readNumber(sensorData, w.tag)} v2={readNumber(sensorData, w.tag2)} v3={readNumber(sensorData, w.tag3)} />;
    case 'data': return <DataPill w={w} v={v} />;
    case 'value': return <ValueCard w={w} v={v} />;
    case 'pipe': return <Pipe w={w} v={v} anim={anim} />;
    case 'pill': return <ValueStatusPill w={w} v={v} />;
    case 'text': return <TextLabel w={w} />;
    default: return null;
  }
}

/* ------------------------------------------------------------------ page */

const field = {
  width: '100%', boxSizing: 'border-box', background: 'var(--muted)', color: 'var(--foreground)',
  border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', fontSize: 12, fontFamily: 'var(--font-mono, monospace)',
};
const btn = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
  background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', fontSize: 12,
};

function loadLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const mapped = arr.map((w) => {
          if (w.type === 'tank' && /antiscalant/i.test(w.label || '') && !w.tag) return { ...w, tag: 'RO5-AntiscalantDaily', unit: 'ml', max: 5000 };
          // older layouts drove everything from SystemActive; use the real pump bits like the Dashboard
          if (w.type === 'gauge' && w.w === 140 && w.h === 130) return { ...w, x: 742, y: 27, w: 180, h: 206 };
          if (w.type === 'pump' && w.tag === 'RO5-SystemActive' && /feed/i.test(w.label || '')) return { ...w, tag: 'RO5-Feedpump' };
          if (w.type === 'pump' && w.tag === 'RO5-SystemActive' && /hp|high/i.test(w.label || '')) return { ...w, tag: 'RO5-HPPpump' };
          if (w.type === 'pipe' && w.tag === 'RO5-SystemActive') return { ...w, tag: 'MIMIC-Running' };
          if (w.type === 'pump' && !w.pumpAnim) return { ...w, pumpAnim: 'rotate' };
          return w;
        });
        const s1 = mapped.find((w) => w.type === 'vessel' && /stage-?\s*1/i.test(w.label || ''));
        const s2 = mapped.find((w) => w.type === 'vessel' && /stage-?\s*2/i.test(w.label || ''));
        if (s1 && s2) {
          // two separate stage vessels -> one "Two Stage RO System" vessel showing both stages
          const left = Math.min(s1.x, s2.x);
          const out = mapped.filter((w) => w !== s1 && w !== s2 && !(w.type === 'text' && /two stage/i.test(w.label || '')));
          out.push(makeWidget('ro2', left, Math.max(190, Math.min(s1.y, s2.y)), { w: 212, h: Math.max(s1.h, 208) }));
          return out.map((w) => (w.type === 'gauge' ? { ...w, max: 20, ...(w.w === 180 && w.h === 206 ? { x: 770, y: 20, w: 140, h: 150 } : {}) } : w));
        }
        return mapped;
      }
    }
  } catch { /* ignore */ }
  return roTemplate();
}

function loadPortrait() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_P);
    if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr.some((w) => w.type === 'vessel' && /stage-?\s*[12]/i.test(w.label || '')) ? roTemplatePortrait() : arr; }
  } catch { /* ignore */ }
  return roTemplatePortrait();
}

export function MimicEditor() {
  const { sensorData: rawSensorData = {} } = useData();
  const sensorData = useMemo(() => withDerived(rawSensorData), [rawSensorData]);
  const { user } = useAuth();
  const canEdit = !!user?.isSuperAdmin; // only a super admin can edit the Visualization

  const [layouts, setLayouts] = useState(() => ({ land: loadLayout(), port: loadPortrait() }));
  const [editing, setEditing] = useState(false);
  const [selId, setSelId] = useState(null);
  const [wrapW, setWrapW] = useState(1000);
  const portrait = wrapW < PORTRAIT_BELOW;          // phones get the vertical diagram, laptops the horizontal one
  const mode = portrait ? 'port' : 'land';
  const widgets = layouts[mode];
  const setWidgets = useCallback((fn) => setLayouts((l) => ({ ...l, [mode]: typeof fn === 'function' ? fn(l[mode]) : fn })), [mode]);
  const wrapRef = useRef(null);
  const dragRef = useRef(null);
  const fileRef = useRef(null);

  // Save every change in this browser.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts.land)); } catch { /* ignore */ }
  }, [layouts.land]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_P, JSON.stringify(layouts.port)); } catch { /* ignore */ }
  }, [layouts.port]);

  // Track the width we have; the diagram is scaled to fill it.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const fit = () => setWrapW(el.clientWidth || 1000);
    fit();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const editingOn = editing && canEdit;
  // Viewing: crop to the drawing itself so it fills the card. Editing: the whole canvas, so there is room to move things.
  const fullW = portrait ? CANVAS_PW : CANVAS_W;
  const fullH = portrait ? CANVAS_PH : CANVAS_H;
  const view = useMemo(() => {
    if (editingOn || widgets.length === 0) return { x: 0, y: 0, w: fullW, h: fullH };
    const x0 = Math.min(...widgets.map((w) => w.x)) - PAD;
    const y0 = Math.min(...widgets.map((w) => w.y)) - PAD;
    const x1 = Math.max(...widgets.map((w) => w.x + w.w)) + PAD;
    const y1 = Math.max(...widgets.map((w) => w.y + w.h)) + PAD;
    return { x: Math.max(0, x0), y: Math.max(0, y0), w: x1 - Math.max(0, x0), h: y1 - Math.max(0, y0) };
  }, [widgets, editingOn, fullW, fullH]);
  const scale = Math.min(portrait ? 1.25 : 1.5, wrapW / view.w) || 1;
  const selected = widgets.find((w) => w.id === selId) || null;
  const tagNames = useMemo(() => Object.keys(sensorData).sort(), [sensorData]);

  const patch = useCallback((id, p) => setWidgets((ws) => ws.map((w) => (w.id === id ? { ...w, ...p } : w))), []);
  const remove = useCallback((id) => { setWidgets((ws) => ws.filter((w) => w.id !== id)); setSelId(null); }, []);

  // Delete key removes the selected widget (not while typing in a field).
  useEffect(() => {
    if (!editingOn) return undefined;
    const onKey = (e) => {
      const t = e.target && e.target.tagName;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selId && t !== 'INPUT' && t !== 'SELECT' && t !== 'TEXTAREA') remove(selId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editingOn, selId, remove]);

  const startDrag = (e, w, mode) => {
    if (!editingOn) return;
    e.stopPropagation();
    e.preventDefault();
    setSelId(w.id);
    dragRef.current = { id: w.id, mode, sx: e.clientX, sy: e.clientY, ox: w.x, oy: w.y, ow: w.w, oh: w.h };
    const move = (ev) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = (ev.clientX - d.sx) / scale, dy = (ev.clientY - d.sy) / scale;
      const q = (n) => (ev.shiftKey ? snap(n) : Math.round(n));
      if (d.mode === 'move') patch(d.id, { x: clamp(q(d.ox + dx), 0, fullW - 10), y: clamp(q(d.oy + dy), 0, fullH - 10) });
      else patch(d.id, { w: Math.max(8, q(d.ow + dx)), h: Math.max(8, q(d.oh + dy)) });
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const add = (type) => {
    const w = makeWidget(type, 60 + (widgets.length % 8) * 20, 60 + (widgets.length % 8) * 20);
    setWidgets((ws) => [...ws, w]);
    setSelId(w.id);
  };
  const duplicate = () => {
    if (!selected) return;
    const c = { ...selected, id: uid(), x: selected.x + 20, y: selected.y + 20 };
    setWidgets((ws) => [...ws, c]);
    setSelId(c.id);
  };
  const loadTemplate = () => {
    if (widgets.length && !window.confirm('Replace the current diagram with the RO template?')) return;
    setWidgets(portrait ? roTemplatePortrait() : roTemplate());
    setSelId(null);
  };
  const clearAll = () => {
    if (window.confirm('Delete every widget on this diagram?')) { setWidgets([]); setSelId(null); }
  };
  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(widgets, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'mimic-layout.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const importJson = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const arr = JSON.parse(String(r.result));
        if (!Array.isArray(arr)) throw new Error('not a layout');
        setWidgets(arr.map((w) => ({ ...makeWidget(DEFAULTS[w.type] ? w.type : 'text'), ...w, id: uid() })));
        setSelId(null);
      } catch { window.alert('That file is not a valid mimic layout.'); }
    };
    r.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <div>
          <button
            type="button"
            onClick={() => { setEditing((e) => !e); setSelId(null); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 999, cursor: 'pointer',
              background: '#0b1526', color: '#f2f8ff', border: `1px solid ${editingOn ? NEON.cyan : '#17253d'}`,
              fontSize: 12, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase',
              boxShadow: editingOn ? `0 0 14px ${NEON.cyan}55` : 'none',
            }}
          >
            {editingOn ? <Eye size={14} /> : <Pencil size={14} />} {editingOn ? 'Done editing' : 'Edit visualization'}
          </button>
        </div>
      )}

      {editingOn && (
        <div className="flex flex-wrap items-center gap-2" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>ADD:</span>
          {PALETTE.map(([t, label]) => (
            <button key={t} type="button" style={btn} onClick={() => add(t)}>{label}</button>
          ))}
          <span style={{ flex: 1 }} />
          <button type="button" style={btn} onClick={loadTemplate}><LayoutTemplate size={14} /> RO template</button>
          <button type="button" style={btn} onClick={exportJson}><Download size={14} /> Export</button>
          <button type="button" style={btn} onClick={() => fileRef.current && fileRef.current.click()}><Upload size={14} /> Import</button>
          <button type="button" style={btn} onClick={clearAll}><RotateCcw size={14} /> Clear</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }}
            onChange={(e) => { importJson(e.target.files && e.target.files[0]); e.target.value = ''; }} />
        </div>
      )}

      <div className="grid gap-3" style={{ gridTemplateColumns: editingOn && selected ? 'minmax(0,1fr) 260px' : 'minmax(0,1fr)' }}>
        {/* canvas */}
        <div ref={wrapRef} style={{ width: '100%', overflow: 'hidden', borderRadius: 18, border: '1px solid #17253d', background: 'radial-gradient(900px 520px at 25% 0%, #0a1733 0%, #050913 55%, #03050a 100%)' }}>
          <div style={{ width: view.w * scale, height: view.h * scale, position: 'relative', margin: '0 auto' }}>
            <div
              onPointerDown={() => editingOn && setSelId(null)}
              style={{
                position: 'absolute', left: 0, top: 0, width: fullW, height: fullH, transform: `translate(${-view.x * scale}px, ${-view.y * scale}px) scale(${scale})`, transformOrigin: '0 0',
                backgroundImage: editingOn ? 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)' : 'none',
                backgroundSize: '20px 20px',
              }}
            >
              {widgets.map((w) => (
                <div
                  key={w.id}
                  onPointerDown={(e) => startDrag(e, w, 'move')}
                  style={{
                    position: 'absolute', left: w.x, top: w.y, width: w.w, height: w.h, zIndex: w.type === 'pipe' ? 1 : w.type === 'text' ? 3 : 2,
                    cursor: editingOn ? 'move' : 'default', touchAction: editingOn ? 'none' : 'auto',
                    outline: editingOn && w.id === selId ? `1px dashed ${NEON.cyan}` : 'none', outlineOffset: 3,
                  }}
                >
                  <WidgetBody w={w} sensorData={sensorData} />
                  {editingOn && w.id === selId && (
                    <div
                      onPointerDown={(e) => startDrag(e, w, 'resize')}
                      style={{ position: 'absolute', right: -7, bottom: -7, width: 12, height: 12, background: NEON.cyan, borderRadius: 3, cursor: 'nwse-resize', boxShadow: `0 0 8px ${NEON.cyan}` }}
                    />
                  )}
                </div>
              ))}
              {widgets.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
                  {canEdit ? 'Empty diagram. Press "Edit visualization", then add widgets or load the RO template.' : 'No diagram has been set up yet.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* properties */}
        {editingOn && selected && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'start' }}>
            <div style={{ fontSize: 12, color: NEON.cyan, fontFamily: 'var(--font-mono, monospace)' }}>{selected.type.toUpperCase()}</div>
            <label style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Label
              <input style={field} value={selected.label} onChange={(e) => patch(selected.id, { label: e.target.value })} />
            </label>
            {selected.type === 'ro2' && (
              <>
                {[['tag', 'Stage-1 inlet tag (RO pressure)'], ['tag2', 'Interstage tag (stage-1 out / stage-2 in)'], ['tag3', 'Concentrate tag (stage-2 out)']].map(([k, l]) => (
                  <label key={k} style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{l}
                    <input style={field} list="mimic-tags" value={selected[k] || ''} onChange={(e) => patch(selected.id, { [k]: e.target.value.trim() })} />
                  </label>
                ))}
              </>
            )}
            {selected.type !== 'text' && selected.type !== 'ro2' && (
              <>
                <label style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Tag (live value)
                  <input style={field} list="mimic-tags" value={selected.tag} onChange={(e) => patch(selected.id, { tag: e.target.value.trim() })} placeholder="e.g. RO5-ROPressure" />
                </label>
                {(selected.type === 'pump' || selected.type === 'pipe') && (
                  <label style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Animation tag (ON/OFF, optional)
                    <input style={field} list="mimic-tags" value={selected.animTag} onChange={(e) => patch(selected.id, { animTag: e.target.value.trim() })} placeholder="uses Tag if empty" />
                  </label>
                )}
                {selected.type === 'pump' && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>Pump animation (while running)</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[['rotate', 'Rotation'], ['blink', 'Blink'], ['none', 'None']].map(([k, l]) => (
                        <button key={k} type="button" onClick={() => patch(selected.id, { pumpAnim: k })}
                          style={{ ...btn, flex: 1, justifyContent: 'center', padding: '6px 4px', borderColor: (selected.pumpAnim || 'rotate') === k ? NEON.cyan : 'var(--border)', color: (selected.pumpAnim || 'rotate') === k ? NEON.cyan : 'var(--foreground)' }}>{l}</button>
                      ))}
                    </div>
                  </div>
                )}
                {selected.type !== 'pipe' && selected.type !== 'pill' && selected.type !== 'text' && (
                  <label style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Unit
                    <input style={field} value={selected.unit} onChange={(e) => patch(selected.id, { unit: e.target.value })} />
                  </label>
                )}
                {['tank', 'gauge', 'vessel', 'data'].includes(selected.type) && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <label style={{ fontSize: 11, color: 'var(--muted-foreground)', flex: 1 }}>Min
                      <input style={field} type="number" value={selected.min} onChange={(e) => patch(selected.id, { min: e.target.value === '' ? 0 : Number(e.target.value) })} />
                    </label>
                    <label style={{ fontSize: 11, color: 'var(--muted-foreground)', flex: 1 }}>Max
                      <input style={field} type="number" value={selected.max} onChange={(e) => patch(selected.id, { max: e.target.value === '' ? 100 : Number(e.target.value) })} />
                    </label>
                  </div>
                )}
                {!['pipe', 'pill'].includes(selected.type) && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <label style={{ fontSize: 11, color: 'var(--muted-foreground)', flex: 1 }}>Low alarm
                      <input style={field} type="number" value={selected.lo} onChange={(e) => patch(selected.id, { lo: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 11, color: 'var(--muted-foreground)', flex: 1 }}>High alarm
                      <input style={field} type="number" value={selected.hi} onChange={(e) => patch(selected.id, { hi: e.target.value })} />
                    </label>
                  </div>
                )}
              </>
            )}
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>Colour</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(selected.type === 'pipe' ? PIPE_CHOICES : COLOR_CHOICES).map((c) => (
                  <button key={c} type="button" aria-label={c} onClick={() => patch(selected.id, { color: c })}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: selected.type === 'pipe' ? PIPE[c] : NEON[c], cursor: 'pointer', border: selected.color === c ? '2px solid #fff' : '2px solid transparent', boxShadow: `0 0 8px ${selected.type === 'pipe' ? PIPE[c] : NEON[c]}` }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" style={{ ...btn, flex: 1, justifyContent: 'center' }} onClick={duplicate}><Copy size={14} /> Copy</button>
              <button type="button" style={{ ...btn, flex: 1, justifyContent: 'center', color: NEON.red, borderColor: NEON.red }} onClick={() => remove(selected.id)}><Trash2 size={14} /> Delete</button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Drag to move, drag the corner square to resize. Hold Shift to snap to a 10 px grid.</div>
          </div>
        )}
      </div>

      <datalist id="mimic-tags">
        {tagNames.map((t) => <option key={t} value={t} />)}
      </datalist>
    </div>
  );
}

export default MimicEditor;