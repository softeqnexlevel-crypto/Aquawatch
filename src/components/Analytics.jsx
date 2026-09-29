

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Download, RefreshCw, CheckCircle, Activity, Droplet, Filter, Wrench,
  Database, Trash2, Printer, Calendar, ArrowUp, ArrowDown, Minus, AlertTriangle
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { API_BASE_URL } from "../config";
import { format } from 'date-fns';

// ===================== CONFIG =====================
const COLORS = {
  success: '#22c55e',
  warning: '#f59e0b',
  danger:  '#ef4444',
  primary: '#0ea5e9',
  purple:  '#a78bfa',
  muted:   '#4d7a9e',
};

const SAMPLE_INTERVAL_MS   = 10_000;
const MAX_ARCHIVE_SAMPLES  = 20_000;
const ARCHIVE_STORAGE_KEY  = 'aquasystem_analytics_archive_v1';
const DOSING_RATE          = 2.7;   // mg/L
const RECOVERY_TARGET      = 70;    // %
const PURITY_EC_TARGET     = 50;    // µS/cm — above this, water quality degrades
const STALE_THRESHOLD_MS   = 60_000;// 60s without data = stale
const PLANT_NAME           = 'RO5 Desalination Plant';

// ===================== DATE RANGE =====================
function rangeFor(preset) {
  const now = new Date();
  const end = now;
  let start;
  switch (preset) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      start = d;
      break;
    }
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'prev-today':
    case 'prev-week':
    case 'prev-month': {
      const base = rangeFor(preset.replace('prev-', ''));
      const span = end - base.start;
      return { start: new Date(base.start - span), end: base.start };
    }
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start, end };
}

const RANGE_LABEL = {
  today: 'Today',
  week: 'Last 7 days',
  month: 'This month',
};

// ===================== PERSISTENCE (offline fallback) =====================
function loadArchive() {
  try {
    const raw = window.localStorage?.getItem(ARCHIVE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_ARCHIVE_SAMPLES) : [];
  } catch { return []; }
}
function saveArchive(samples) {
  try {
    window.localStorage?.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(samples.slice(-MAX_ARCHIVE_SAMPLES)));
  } catch {
    try {
      window.localStorage?.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(samples.slice(-Math.floor(MAX_ARCHIVE_SAMPLES / 4))));
    } catch { /* give up */ }
  }
}

// ===================== HELPERS =====================
const ON_VALUES = ['1', 'true', 'on', 'active', 'yes', 'running', 'enabled', 'online'];
const isOn = (raw) => {
  if (raw === true) return true;
  if (typeof raw === 'number') return raw === 1;
  if (typeof raw === 'string') return ON_VALUES.includes(raw.trim().toLowerCase());
  return false;
};
const isSystemRunning = (getValue) =>
  isOn(getValue('RO5-SystemActive')) && !isOn(getValue('RO5-PrefilterBackwash'));

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function rowsToCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) lines.push(headers.map(h => csvEscape(row[h])).join(','));
  return lines.join('\n');
}
function computeStats(values) {
  if (!values.length) return { min: 0, max: 0, avg: 0, count: 0 };
  let min = Infinity, max = -Infinity, sum = 0;
  for (const v of values) { if (v < min) min = v; if (v > max) max = v; sum += v; }
  return { min, max, avg: sum / values.length, count: values.length };
}
function pctDelta(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
function fmtDelta(d) {
  if (d === null) return { text: '—', color: COLORS.muted, Icon: Minus };
  if (Math.abs(d) < 0.5) return { text: '0%', color: COLORS.muted, Icon: Minus };
  return d > 0
    ? { text: `+${d.toFixed(1)}%`, color: COLORS.success, Icon: ArrowUp }
    : { text: `${d.toFixed(1)}%`,  color: COLORS.danger,  Icon: ArrowDown };
}
function dateStamp(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ===================== API =====================
const api = {
  getProductionSummary: async () => {
    const token = localStorage.getItem('accessToken');
    const r = await fetch(`${API_BASE_URL}/api/production-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  // Returns null if the endpoint isn't deployed yet — the caller falls back
  // to the local archive transparently. This lets us ship the frontend
  // before the backend endpoint lands.
  getMeasurementsRange: async (from, to, keys) => {
    const token = localStorage.getItem('accessToken');
    const params = new URLSearchParams({
      from: from.toISOString(),
      to:   to.toISOString(),
      keys: keys.join(','),
    });
    const r = await fetch(`${API_BASE_URL}/api/measurements/range?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
};

// ===================== HOOKS =====================
function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  function showToast(title, sub, iconColor, onComplete) {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setToast({ title, sub, iconColor, progress: 0, done: false, visible: true });
    let progress = 0;
    intervalRef.current = setInterval(() => {
      progress = Math.min(progress + 2, 100);
      setToast(prev => prev ? { ...prev, progress } : prev);
      if (progress >= 100) {
        clearInterval(intervalRef.current);
        onComplete?.();
        setToast(prev => prev ? { ...prev, done: true } : prev);
        timerRef.current = setTimeout(() => setToast(null), 2000);
      }
    }, 30);
  }
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);
  return { toast, showToast };
}

// ===================== PRESENTATIONAL =====================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0a1828', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 4, padding: '6px 10px' }}>
      <p style={{ fontSize: 10, color: '#4d7a9e', marginBottom: 2 }}>{label}</p>
      {payload.map((p, idx) => (
        <p key={idx} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: p.color || '#d4e4f7' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 999,
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', minWidth: 200, maxWidth: 280,
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      display: 'flex', alignItems: 'flex-start', gap: 8,
      opacity: toast.visible ? 1 : 0, transition: 'opacity 0.3s',
    }}>
      <div style={{ marginTop: 1 }}>
        {toast.done
          ? <CheckCircle size={16} style={{ color: '#22c55e' }} />
          : <RefreshCw size={16} style={{ color: toast.iconColor, animation: 'spin 1s linear infinite' }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{toast.title}</div>
        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>
          {toast.done ? 'File downloaded' : toast.sub}
        </div>
        <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', marginTop: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: '#0ea5e9', width: `${toast.progress}%`, transition: 'width 0.05s linear' }} />
        </div>
      </div>
    </div>
  );
}

function DeltaBadge({ delta, isMobile }) {
  const { text, color, Icon } = fmtDelta(delta);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      fontSize: isMobile ? 8 : 9, fontFamily: 'var(--font-mono)',
      color, fontWeight: 700,
    }}>
      <Icon size={isMobile ? 8 : 9} /> {text}
    </span>
  );
}

function ReportCard({ title, items, onExport, icon: Icon, isMobile, deltas }) {
  return (
    <div className="rounded p-2 sm:p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {Icon && <Icon size={isMobile ? 12 : 14} style={{ color: 'var(--muted-foreground)' }} />}
          <span style={{
            fontSize: isMobile ? 10 : 11, fontWeight: 600,
            color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>{title}</span>
        </div>
        <button onClick={onExport} className="flex items-center gap-1"
          style={{ fontSize: isMobile ? 8 : 9, color: '#0ea5e9', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
          <Download size={isMobile ? 8 : 10} />{!isMobile && 'Export'}
        </button>
      </div>
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-0.5 sm:py-1"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: isMobile ? 9 : 10, color: 'var(--muted-foreground)' }}>{item.label}</span>
              {deltas && deltas[item.label] !== undefined && (
                <DeltaBadge delta={deltas[item.label]} isMobile={isMobile} />
              )}
            </div>
            <div className="flex items-center gap-1">
              <span style={{ fontSize: isMobile ? 10 : 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: item.color || 'var(--foreground)' }}>{item.value}</span>
              {item.unit && <span style={{ fontSize: isMobile ? 8 : 9, color: 'var(--muted-foreground)' }}>{item.unit}</span>}
            </div>
          </div>
        ))}
        {items[0]?.spark && (
          <div style={{ height: 26, marginTop: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={items[0].spark}>
                <Line type="monotone" dataKey="v" stroke={items[0].sparkColor || COLORS.primary} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export function Analytics() {
  const { sensorData, getValue, getHistory, lastUpdate } = useData();
  const { toast, showToast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  const [productionSummary, setProductionSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [archive, setArchive] = useState(loadArchive);
  const [rangePreset, setRangePreset] = useState('today');
  const [customRange, setCustomRange] = useState(null);
  const [serverSamples, setServerSamples] = useState(null); // null = not fetched / not available
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Re-render every 5s so the "last data received" indicator ticks.
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const activeRange = useMemo(
    () => customRange || rangeFor(rangePreset),
    [rangePreset, customRange]
  );
  const prevRange = useMemo(() => {
    const span = activeRange.end - activeRange.start;
    return { start: new Date(activeRange.start - span), end: new Date(activeRange.start) };
  }, [activeRange]);

  const fetchProductionSummary = useCallback(async () => {
    try {
      const data = await api.getProductionSummary();
      setProductionSummary(data);
    } catch (err) {
      console.error('Failed to fetch production summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductionSummary();
    const id = setInterval(fetchProductionSummary, 60_000);
    return () => clearInterval(id);
  }, [fetchProductionSummary]);

  // ── Client-side archive sampling ───────────────────────────────────────
  const getValueRef = useRef(getValue);
  useEffect(() => { getValueRef.current = getValue; }, [getValue]);

  useEffect(() => {
    const tick = () => {
      const g = getValueRef.current;
      if (!isSystemRunning(g)) return;
      const sample = {
        t: new Date().toISOString(),
        feedFlow: Number(g('RO5-FEEDFlow')) || 0,
        permeateFlow: Number(g('RO5-Permeateflow')) || 0,
        concentrateFlow: Number(g('RO5-ConcetrateFlow')) || 0,
        recovery: Number(g('RO5-SystemRecovery')) || 0,
        roPressure: Number(g('RO5-ROPressure')) || 0,
        stage1Delta: Number(g('RO5-Stage1Delta')) || 0,
        stage2Delta: Number(g('RO5-Stage2Delta')) || 0,
        mediaFilterDp: Number(g('RO5-MediaFilterDeltaP')) || 0,
        feedTankLevel: Number(g('RO5-FeedTankLevel')) || 0,
      };
      setArchive(prev => {
        const next = [...prev, sample].slice(-MAX_ARCHIVE_SAMPLES);
        saveArchive(next);
        return next;
      });
    };
    const id = setInterval(tick, SAMPLE_INTERVAL_MS);
    tick();
    return () => clearInterval(id);
  }, []);

  // ── Backend range fetch (soft-optional) ────────────────────────────────
  const RANGE_KEYS = [
    'RO5-FEEDFlow', 'RO5-Permeateflow', 'RO5-ConcetrateFlow',
    'RO5-SystemRecovery', 'RO5-ROPressure', 'RO5-Stage1Delta',
    'RO5-Stage2Delta', 'RO5-MediaFilterDeltaP', 'RO5-FeedTankLevel',
  ];
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getMeasurementsRange(activeRange.start, activeRange.end, RANGE_KEYS);
        if (cancelled) return;
        setServerSamples(data); // null → fall back to archive
      } catch (err) {
        if (!cancelled) setServerSamples(null);
      }
    })();
    return () => { cancelled = true; };
  }, [activeRange.start, activeRange.end]);

  // ── Unified samples: prefer server, fall back to local archive ─────────
  const samples = useMemo(() => {
    if (Array.isArray(serverSamples)) {
      return serverSamples.map(s => ({
        t: s.time ?? s.t,
        feedFlow: Number(s['RO5-FEEDFlow'] ?? s.feedFlow) || 0,
        permeateFlow: Number(s['RO5-Permeateflow'] ?? s.permeateFlow) || 0,
        concentrateFlow: Number(s['RO5-ConcetrateFlow'] ?? s.concentrateFlow) || 0,
        recovery: Number(s['RO5-SystemRecovery'] ?? s.recovery) || 0,
        roPressure: Number(s['RO5-ROPressure'] ?? s.roPressure) || 0,
        stage1Delta: Number(s['RO5-Stage1Delta'] ?? s.stage1Delta) || 0,
        stage2Delta: Number(s['RO5-Stage2Delta'] ?? s.stage2Delta) || 0,
        mediaFilterDp: Number(s['RO5-MediaFilterDeltaP'] ?? s.mediaFilterDp) || 0,
        feedTankLevel: Number(s['RO5-FeedTankLevel'] ?? s.feedTankLevel) || 0,
      }));
    }
    return archive.filter(s => {
      const t = new Date(s.t).getTime();
      return t >= activeRange.start.getTime() && t <= activeRange.end.getTime();
    });
  }, [serverSamples, archive, activeRange]);

  const prevSamples = useMemo(() => {
    if (!Array.isArray(serverSamples)) {
      return archive.filter(s => {
        const t = new Date(s.t).getTime();
        return t >= prevRange.start.getTime() && t <= prevRange.end.getTime();
      });
    }
    // For server mode we don't re-fetch prev — the delta badge just stays "—"
    // until a dedicated prev-range fetch is added (see notes below).
    return [];
  }, [serverSamples, archive, prevRange]);

  const isServerBacked = Array.isArray(serverSamples);
  const dataSourceLabel = isServerBacked ? 'server' : 'local archive';

  // ── Live readings ──────────────────────────────────────────────────────
  const feedFlow = getValue('RO5-FEEDFlow') || 0;
  const permeateFlow = getValue('RO5-Permeateflow') || 0;
  const concentrateFlow = getValue('RO5-ConcetrateFlow') || 0;
  const recovery = getValue('RO5-SystemRecovery') || 0;
  const roPressure = getValue('RO5-ROPressure') || 0;
  const stage1Delta = getValue('RO5-Stage1Delta') || 0;
  const stage2Delta = getValue('RO5-Stage2Delta') || 0;
  const pureWaterEc = getValue('RO5-PureWaterEc') || 0;

  const recoveryHistory = getHistory('RO5-SystemRecovery');

  const dailyVolume = productionSummary?.permeate?.daily ?? 0;
  const weeklyVolume = productionSummary?.permeate?.weekly ?? 0;
  const monthlyVolume = productionSummary?.permeate?.monthly ?? 0;
  const chemicalDaily = (dailyVolume * DOSING_RATE) / 1000;
  const chemicalWeekly = (weeklyVolume * DOSING_RATE) / 1000;
  const chemicalMonthly = (monthlyVolume * DOSING_RATE) / 1000;

  const recoveryAvg = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayReadings = recoveryHistory.filter(d => new Date(d.time) >= dayStart);
    if (!todayReadings.length) return recovery;
    return todayReadings.reduce((sum, d) => sum + d.value, 0) / todayReadings.length;
  }, [recoveryHistory, recovery]);

  const operatingDistribution = useMemo(() => {
    const total = feedFlow + permeateFlow + concentrateFlow || 1;
    return [
      { name: 'Feed Flow',   value: (feedFlow / total * 100),        color: '#0ea5e9' },
      { name: 'Permeate',    value: (permeateFlow / total * 100),    color: '#22c55e' },
      { name: 'Concentrate', value: (concentrateFlow / total * 100), color: '#f59e0b' },
    ];
  }, [feedFlow, permeateFlow, concentrateFlow]);

  // ── Archive stats (for report + KPI derivation) ────────────────────────
  const archiveStats = useMemo(() => {
    const rec   = samples.map(s => s.recovery).filter(Number.isFinite);
    const dp1   = samples.map(s => s.stage1Delta).filter(Number.isFinite);
    const dp2   = samples.map(s => s.stage2Delta).filter(Number.isFinite);
    const press = samples.map(s => s.roPressure).filter(Number.isFinite);
    return {
      recovery:    computeStats(rec),
      stage1Delta: computeStats(dp1),
      stage2Delta: computeStats(dp2),
      roPressure:  computeStats(press),
      firstSample: samples[0]?.t,
      lastSample:  samples[samples.length - 1]?.t,
    };
  }, [samples]);

  // ── Real KPIs, no hardcoded values ─────────────────────────────────────
  const uptimePct = useMemo(() => {
    const windowStart = Math.max(activeRange.start.getTime(), Date.now() - 24 * 3600 * 1000);
    const all = archive.filter(s => new Date(s.t).getTime() >= windowStart);
    if (!all.length) return null;
    const running = all.filter(s => s.recovery > 0 || s.permeateFlow > 0).length;
    return (running / all.length) * 100;
  }, [archive, activeRange]);

  const waterQualityPct = useMemo(() => {
    if (!Number.isFinite(pureWaterEc) || pureWaterEc <= 0) return null;
    return Math.max(0, Math.min(100, 100 * (1 - pureWaterEc / PURITY_EC_TARGET)));
  }, [pureWaterEc]);

  const kpis = [
    { label: 'System Recovery', value: recovery,            color: recovery >= RECOVERY_TARGET ? COLORS.success : COLORS.warning },
    { label: 'Uptime (24h)',    value: uptimePct,           color: COLORS.success },
    { label: 'Water Quality',   value: waterQualityPct,     color: COLORS.primary },
    { label: 'Archive Coverage',value: (samples.length > 0 ? Math.min(100, (samples.length / 100) * 100) : null), color: COLORS.purple },
  ].filter(k => k.value !== null);

  // ── Period-over-period deltas ──────────────────────────────────────────
  const currentAverages = useMemo(() => {
    if (!samples.length) return null;
    return {
      recovery:    archiveStats.recovery.avg,
      stage1Delta: archiveStats.stage1Delta.avg,
      stage2Delta: archiveStats.stage2Delta.avg,
      roPressure:  archiveStats.roPressure.avg,
    };
  }, [samples, archiveStats]);

  const prevAverages = useMemo(() => {
    if (!prevSamples.length) return null;
    return {
      recovery:    computeStats(prevSamples.map(s => s.recovery)).avg,
      stage1Delta: computeStats(prevSamples.map(s => s.stage1Delta)).avg,
      stage2Delta: computeStats(prevSamples.map(s => s.stage2Delta)).avg,
      roPressure:  computeStats(prevSamples.map(s => s.roPressure)).avg,
    };
  }, [prevSamples]);

  const deltas = useMemo(() => {
    if (!currentAverages || !prevAverages) return {};
    return {
      Current: pctDelta(currentAverages.recovery,    prevAverages.recovery),
      'Stage 1 ΔP': pctDelta(currentAverages.stage1Delta, prevAverages.stage1Delta),
      'Stage 2 ΔP': pctDelta(currentAverages.stage2Delta, prevAverages.stage2Delta),
      'RO Pressure': pctDelta(currentAverages.roPressure,  prevAverages.roPressure),
    };
  }, [currentAverages, prevAverages]);

  // ── ΔP sparklines ──────────────────────────────────────────────────────
  const dpSpark = useMemo(() => {
    const tail = samples.slice(-60);
    return {
      stage1: tail.map(s => ({ v: s.stage1Delta })),
      stage2: tail.map(s => ({ v: s.stage2Delta })),
    };
  }, [samples]);

  const productionByPeriod = [
    { period: 'Daily',   volume: dailyVolume },
    { period: 'Weekly',  volume: weeklyVolume },
    { period: 'Monthly', volume: monthlyVolume },
  ];
  const chemicalByPeriod = [
    { period: 'Daily',   consumption: chemicalDaily },
    { period: 'Weekly',  consumption: chemicalWeekly },
    { period: 'Monthly', consumption: chemicalMonthly },
  ];

  // ── Stale-data indicator ───────────────────────────────────────────────
  const msSinceUpdate = lastUpdate ? nowTick - new Date(lastUpdate).getTime() : null;
  const isStale = msSinceUpdate === null || msSinceUpdate > STALE_THRESHOLD_MS;
  const freshnessLabel =
    msSinceUpdate === null ? 'no data yet'
    : msSinceUpdate < 5_000 ? 'just now'
    : msSinceUpdate < 60_000 ? `${Math.round(msSinceUpdate / 1000)}s ago`
    : `${Math.round(msSinceUpdate / 60_000)}m ago`;

  // ── Report builder ─────────────────────────────────────────────────────
  const reportLabel = `${RANGE_LABEL[rangePreset] ?? 'Custom'} (${dateStamp(activeRange.start)} → ${dateStamp(activeRange.end)})`;

  function buildReportCSV(sections = 'all') {
    const want = (n) => sections === 'all' || sections.includes(n);
    const blocks = [];

    if (want('meta')) {
      blocks.push({
        title: 'Report Metadata',
        rows: [
          { Field: 'Report',            Value: reportLabel },
          { Field: 'Generated',         Value: new Date().toISOString() },
          { Field: 'Plant',             Value: PLANT_NAME },
          { Field: 'Data Source',       Value: dataSourceLabel },
          { Field: 'Range Start',       Value: activeRange.start.toISOString() },
          { Field: 'Range End',         Value: activeRange.end.toISOString() },
          { Field: 'Samples',           Value: samples.length },
          { Field: 'Sample Interval (s)', Value: SAMPLE_INTERVAL_MS / 1000 },
          { Field: 'Dosing Rate (mg/L)',  Value: DOSING_RATE },
        ],
      });
    }
    if (want('production')) {
      blocks.push({
        title: 'Accumulated Production',
        rows: [
          { Period: 'Daily',   Volume_m3: Number(dailyVolume.toFixed(2)) },
          { Period: 'Weekly',  Volume_m3: Number(weeklyVolume.toFixed(2)) },
          { Period: 'Monthly', Volume_m3: Number(monthlyVolume.toFixed(2)) },
        ],
      });
    }
    if (want('chemical')) {
      blocks.push({
        title: 'Chemical Consumption (Antiscalant)',
        rows: [
          { Period: 'Daily',   Consumption_kg: Number(chemicalDaily.toFixed(3)) },
          { Period: 'Weekly',  Consumption_kg: Number(chemicalWeekly.toFixed(3)) },
          { Period: 'Monthly', Consumption_kg: Number(chemicalMonthly.toFixed(3)) },
          { Period: 'Dosing Rate (mg/L)', Consumption_kg: DOSING_RATE },
        ],
      });
    }
    if (want('recovery')) {
      const r = archiveStats.recovery;
      blocks.push({
        title: 'Recovery Statistics',
        rows: [
          { Metric: 'Current_%',        Value: Number(recovery.toFixed(2)) },
          { Metric: 'DailyAverage_%',   Value: Number(recoveryAvg.toFixed(2)) },
          { Metric: 'RangeMin_%',       Value: Number(r.min.toFixed(2)) },
          { Metric: 'RangeMax_%',       Value: Number(r.max.toFixed(2)) },
          { Metric: 'RangeAvg_%',       Value: Number(r.avg.toFixed(2)) },
          { Metric: 'Target_%',         Value: RECOVERY_TARGET },
          { Metric: 'Samples',          Value: r.count },
        ],
      });
    }
    if (want('maintenance')) {
      const s1 = archiveStats.stage1Delta, s2 = archiveStats.stage2Delta, p = archiveStats.roPressure;
      blocks.push({
        title: 'Maintenance / Membrane Health',
        rows: [
          { Metric: 'Stage1DeltaP_Current_bar', Value: Number(stage1Delta.toFixed(3)) },
          { Metric: 'Stage1DeltaP_Max_bar',     Value: Number(s1.max.toFixed(3)) },
          { Metric: 'Stage1DeltaP_Avg_bar',     Value: Number(s1.avg.toFixed(3)) },
          { Metric: 'Stage2DeltaP_Current_bar', Value: Number(stage2Delta.toFixed(3)) },
          { Metric: 'Stage2DeltaP_Max_bar',     Value: Number(s2.max.toFixed(3)) },
          { Metric: 'Stage2DeltaP_Avg_bar',     Value: Number(s2.avg.toFixed(3)) },
          { Metric: 'ROPressure_Current_bar',   Value: Number(roPressure.toFixed(3)) },
          { Metric: 'ROPressure_Min_bar',       Value: Number(p.min.toFixed(3)) },
          { Metric: 'ROPressure_Max_bar',       Value: Number(p.max.toFixed(3)) },
        ],
      });
    }
    if (want('timeseries') && samples.length) {
      const tail = samples.slice(-500).map(s => ({
        Timestamp: s.t,
        FeedFlow_m3ph: Number(s.feedFlow.toFixed(3)),
        PermeateFlow_m3ph: Number(s.permeateFlow.toFixed(3)),
        ConcentrateFlow_m3ph: Number(s.concentrateFlow.toFixed(3)),
        Recovery_pct: Number(s.recovery.toFixed(2)),
        ROPressure_bar: Number(s.roPressure.toFixed(3)),
        Stage1DeltaP_bar: Number(s.stage1Delta.toFixed(3)),
        Stage2DeltaP_bar: Number(s.stage2Delta.toFixed(3)),
        MediaFilterDeltaP_bar: Number(s.mediaFilterDp.toFixed(3)),
        FeedTankLevel_pct: Number(s.feedTankLevel.toFixed(1)),
      }));
      blocks.push({ title: `Time Series (most recent ${tail.length} of ${samples.length})`, rows: tail });
    }

    let out = '';
    for (const block of blocks) {
      out += `# ${block.title}\n${rowsToCSV(block.rows)}\n\n`;
    }
    return out;
  }

  function downloadFile(filename, content, mime = 'text/csv;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function handleExport(label, filename, sections = 'all') {
    showToast(`Preparing ${label}…`, 'Compiling report', '#0ea5e9', () => {
      downloadFile(filename, buildReportCSV(sections));
    });
  }

  function handlePrintReport() {
    showToast('Preparing PDF report…', 'Opening print dialog', '#0ea5e9', () => {
      setTimeout(() => window.print(), 200);
    });
  }

  const filenameFor = (kind) =>
    `RO5_${kind}_${dateStamp(activeRange.start)}_to_${dateStamp(activeRange.end)}.csv`;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4 overflow-auto h-full" style={{ scrollbarWidth: 'none' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .print-report { display: none; }
        @media print {
          body * { visibility: hidden !important; }
          .print-report, .print-report * { visibility: visible !important; }
          .print-report {
            display: block !important;
            position: absolute; inset: 0;
            background: #ffffff; color: #0f172a;
            padding: 24mm 16mm; font-family: 'Inter', system-ui, sans-serif;
          }
          .print-report h1 { font-size: 22px; margin: 0 0 2px; color: #0f172a; }
          .print-report h2 { font-size: 13px; margin: 22px 0 8px; color: #0f172a;
                             text-transform: uppercase; letter-spacing: 0.08em;
                             border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          .print-report table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .print-report th, .print-report td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
          .print-report th { background: #f1f5f9; font-weight: 600; color: #334155; }
          .print-report .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 12px; }
          .print-report .kpi { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; }
          .print-report .kpi .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
          .print-report .kpi .value { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 2px; }
          .print-report .kpi .unit  { font-size: 10px; color: #64748b; margin-left: 4px; }
          .print-report .header-row { display: flex; justify-content: space-between; align-items: flex-start;
                                       border-bottom: 3px solid #0ea5e9; padding-bottom: 12px; }
          .print-report .footer { margin-top: 24px; font-size: 9px; color: #94a3b8; text-align: center; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      {/* ── On-screen header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: 'var(--foreground)' }}>
            <Activity size={isMobile ? 14 : 18} style={{ display: 'inline', marginRight: 6 }} />
            Analytics & Reports
          </h2>
          <p style={{ fontSize: isMobile ? 10 : 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
            {summaryLoading ? 'Loading accumulated totals…' : 'Real-time analytics'} •{' '}
            <span style={{ color: isStale ? COLORS.danger : 'var(--muted-foreground)', fontWeight: isStale ? 600 : 400 }}>
              last data {freshnessLabel}
            </span>{' '}
            • source: <span style={{ fontFamily: 'var(--font-mono)' }}>{dataSourceLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Range selector */}
          <div style={{
            display: 'inline-flex', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden',
          }}>
            {['today', 'week', 'month'].map(p => (
              <button key={p} onClick={() => { setRangePreset(p); setCustomRange(null); }}
                style={{
                  padding: '5px 10px', fontSize: isMobile ? 10 : 11, fontWeight: 600,
                  background: rangePreset === p && !customRange ? 'var(--secondary)' : 'transparent',
                  color: rangePreset === p && !customRange ? COLORS.primary : 'var(--muted-foreground)',
                  border: 'none', cursor: 'pointer',
                }}>{RANGE_LABEL[p]}</button>
            ))}
          </div>

          <div title={`Samples captured every ${SAMPLE_INTERVAL_MS / 1000}s while the system is running.`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', borderRadius: 6,
              background: 'var(--card)', border: '1px solid var(--border)',
              fontSize: isMobile ? 9 : 10, color: 'var(--muted-foreground)',
            }}>
            <Database size={isMobile ? 10 : 12} color={COLORS.primary} />
            <span style={{ fontFamily: 'var(--font-mono)' }}>{samples.length} samples</span>
          </div>

          <button onClick={handlePrintReport} className="flex items-center gap-1.5"
            style={{
              padding: '5px 10px', fontSize: isMobile ? 10 : 11, fontWeight: 600,
              background: 'transparent', color: COLORS.primary,
              border: `1px solid ${COLORS.primary}`, borderRadius: 6, cursor: 'pointer',
            }}>
            <Printer size={isMobile ? 11 : 12} /> {isMobile ? 'PDF' : 'Print / PDF'}
          </button>

          <button onClick={() => handleExport('Full Analytics Report', filenameFor('full_report'), 'all')}
            className="flex items-center gap-1.5"
            style={{
              padding: '5px 10px', fontSize: isMobile ? 10 : 11, fontWeight: 600,
              background: COLORS.primary, color: 'white', border: 'none',
              borderRadius: 6, cursor: 'pointer',
            }}>
            <Download size={isMobile ? 11 : 12} /> {isMobile ? 'CSV' : 'Download CSV'}
          </button>

          {archive.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear the locally archived analytics samples? This cannot be undone.')) {
                  setArchive([]);
                  try { window.localStorage?.removeItem(ARCHIVE_STORAGE_KEY); } catch {}
                }
              }}
              title="Clear local archive"
              style={{
                padding: '5px 8px', fontSize: isMobile ? 10 : 11,
                background: 'transparent', color: COLORS.danger,
                border: `1px solid ${COLORS.danger}40`, borderRadius: 6, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
              <Trash2 size={isMobile ? 11 : 12} />
            </button>
          )}
        </div>
      </div>

      {/* Stale banner */}
      {isStale && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 6,
          background: `${COLORS.danger}15`, border: `1px solid ${COLORS.danger}40`,
          color: COLORS.danger, fontSize: 11, fontWeight: 600,
        }}>
          <AlertTriangle size={14} />
          No data received from the plant in over {Math.round(STALE_THRESHOLD_MS / 1000)}s. Numbers below may be stale.
        </div>
      )}

      {/* ── Summary cards ───────────────────────────────────────────── */}
      <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
        <ReportCard title="Production" icon={Droplet} isMobile={isMobile}
          items={[
            { label: 'Today',        value: summaryLoading ? '…' : Math.round(dailyVolume).toLocaleString(),   unit: 'm³',   color: '#0ea5e9' },
            { label: 'This Week',    value: summaryLoading ? '…' : Math.round(weeklyVolume).toLocaleString(),  unit: 'm³',   color: '#06b6d4' },
            { label: 'This Month',   value: summaryLoading ? '…' : Math.round(monthlyVolume).toLocaleString(), unit: 'm³',   color: '#22c55e' },
            { label: 'Current Flow', value: permeateFlow.toFixed(1), unit: 'm³/h', color: '#f59e0b' },
          ]}
          onExport={() => handleExport('Production Summary', filenameFor('production'), ['meta', 'production'])} />

        <ReportCard title="Recovery" icon={Activity} isMobile={isMobile}
          items={[
            { label: 'Current',   value: recovery.toFixed(1), unit: '%', color: recovery >= RECOVERY_TARGET ? '#22c55e' : '#eab308' },
            { label: 'Daily Avg', value: recoveryAvg.toFixed(1), unit: '%', color: '#0ea5e9' },
            { label: 'Target',    value: RECOVERY_TARGET.toFixed(1), unit: '%', color: '#eab308' },
            { label: 'Status',    value: recovery >= RECOVERY_TARGET ? 'ON TARGET' : 'BELOW', unit: '', color: recovery >= RECOVERY_TARGET ? '#22c55e' : '#ef4444' },
          ]}
          deltas={deltas}
          onExport={() => handleExport('Recovery Summary', filenameFor('recovery'), ['meta', 'recovery'])} />

        <ReportCard title="Chemical" icon={Filter} isMobile={isMobile}
          items={[
            { label: 'Daily',       value: summaryLoading ? '…' : chemicalDaily.toFixed(1),   unit: 'kg', color: '#a78bfa' },
            { label: 'Weekly',      value: summaryLoading ? '…' : chemicalWeekly.toFixed(1),  unit: 'kg', color: '#8b5cf6' },
            { label: 'Monthly',     value: summaryLoading ? '…' : chemicalMonthly.toFixed(0), unit: 'kg', color: '#7c3aed' },
            { label: 'Dosing Rate', value: DOSING_RATE.toFixed(2), unit: 'mg/L', color: '#a78bfa' },
          ]}
          onExport={() => handleExport('Chemical Usage', filenameFor('chemical'), ['meta', 'chemical'])} />

        <ReportCard title="Maintenance" icon={Wrench} isMobile={isMobile}
          items={[
            { label: 'Stage 1 ΔP', value: stage1Delta.toFixed(2), unit: 'bar',
              color: stage1Delta > 2.0 ? '#ef4444' : '#22c55e',
              spark: dpSpark.stage1, sparkColor: stage1Delta > 2.0 ? '#ef4444' : '#22c55e' },
            { label: 'Stage 2 ΔP', value: stage2Delta.toFixed(2), unit: 'bar',
              color: stage2Delta > 2.0 ? '#ef4444' : '#22c55e' },
            { label: 'RO Pressure', value: roPressure.toFixed(1), unit: 'bar',
              color: roPressure > 10 && roPressure < 16 ? '#22c55e' : '#eab308' },
          ]}
          deltas={deltas}
          onExport={() => handleExport('Maintenance Summary', filenameFor('maintenance'), ['meta', 'maintenance'])} />
      </div>

      {/* ── Charts row 1 ───────────────────────────────────────────── */}
      <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr' }}>
        <div className="rounded p-2 sm:p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Accumulated Production
            </span>
            <span style={{ fontSize: isMobile ? 8 : 9, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>m³</span>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 150 : 190}>
            <BarChart data={productionByPeriod} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: isMobile ? 8 : 10, fill: '#4d7a9e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: isMobile ? 7 : 9, fill: '#4d7a9e', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="volume" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Volume (m³)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded p-2 sm:p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="mb-2 sm:mb-3">
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Flow Distribution
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            <ResponsiveContainer width="100%" height={isMobile ? 120 : 140}>
              <PieChart>
                <Pie data={operatingDistribution} cx="50%" cy="50%"
                  innerRadius={isMobile ? 28 : 38} outerRadius={isMobile ? 45 : 60}
                  dataKey="value" strokeWidth={0}>
                  {operatingDistribution.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid gap-1 w-full" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {operatingDistribution.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div style={{ width: 7, height: 7, borderRadius: 1, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: isMobile ? 8 : 9, color: 'var(--muted-foreground)', flex: 1 }}>
                    {isMobile && d.name.length > 8 ? d.name.substring(0, 8) : d.name}
                  </span>
                  <span style={{ fontSize: isMobile ? 9 : 10, fontFamily: 'var(--font-mono)', color: 'var(--foreground)', fontWeight: 600 }}>{d.value.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts row 2 ───────────────────────────────────────────── */}
      <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        <div className="rounded p-2 sm:p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Chemical Consumption
            </span>
            <span style={{ fontSize: isMobile ? 8 : 9, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>kg</span>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 120 : 150}>
            <BarChart data={chemicalByPeriod} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: isMobile ? 7 : 9, fill: '#4d7a9e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: isMobile ? 7 : 9, fill: '#4d7a9e', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="consumption" fill="#a78bfa" radius={[3, 3, 0, 0]} name="Consumption (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded p-2 sm:p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              System Efficiency KPIs
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:gap-3">
            {kpis.map((kpi, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: isMobile ? 9 : 10, color: 'var(--muted-foreground)' }}>{kpi.label}</span>
                  <span style={{ fontSize: isMobile ? 9 : 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: kpi.color }}>
                    {kpi.value.toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: isMobile ? 4 : 6, background: 'var(--secondary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(kpi.value, 100)}%`, height: '100%', background: kpi.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
            {kpis.length === 0 && (
              <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Not enough data yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Hidden print-report — becomes the PDF ─────────────────── */}
      <PrintReport
        label={reportLabel}
        plant={PLANT_NAME}
        range={activeRange}
        samples={samples}
        dataSource={dataSourceLabel}
        production={{ daily: dailyVolume, weekly: weeklyVolume, monthly: monthlyVolume }}
        chemical={{ daily: chemicalDaily, weekly: chemicalWeekly, monthly: chemicalMonthly }}
        recovery={{ current: recovery, avg: recoveryAvg, stats: archiveStats.recovery }}
        maintenance={{
          stage1: stage1Delta, stage2: stage2Delta, roPressure,
          s1Stats: archiveStats.stage1Delta, s2Stats: archiveStats.stage2Delta, pStats: archiveStats.roPressure,
        }}
        kpis={kpis}
        distribution={operatingDistribution}
      />

      <Toast toast={toast} />
    </div>
  );
}

// ===================== PRINT REPORT =====================
function PrintReport({ label, plant, range, samples, dataSource, production, chemical, recovery, maintenance, kpis, distribution }) {
  const tsSample = samples.slice(-40);
  const tsRows = tsSample.map(s => ({
    t: s.t,
    feed: s.feedFlow,
    perm: s.permeateFlow,
    conc: s.concentrateFlow,
    rec:  s.recovery,
    p:    s.roPressure,
    d1:   s.stage1Delta,
    d2:   s.stage2Delta,
  }));

  return (
    <div className="print-report">
      {/* Header — mirrors the "Report Library" card style from the mockup */}
      <div className="header-row">
        <div>
          <h1>{plant}</h1>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            Analytics Report • {label}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 10, color: '#64748b' }}>
          <div>Generated {new Date().toLocaleString()}</div>
          <div>Source: {dataSource}</div>
          <div>{samples.length} samples</div>
        </div>
      </div>

      {/* KPI strip */}
      <h2>Key Performance Indicators</h2>
      <div className="meta-grid">
        {kpis.length === 0 && (
          <div className="kpi"><div className="label">No data</div><div className="value">—</div></div>
        )}
        {kpis.map((k, i) => (
          <div key={i} className="kpi">
            <div className="label">{k.label}</div>
            <div className="value">{k.value.toFixed(1)}<span className="unit">%</span></div>
          </div>
        ))}
      </div>

      {/* Production + chemical side by side */}
      <h2>Production &amp; Chemical Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th><th>Daily</th><th>Weekly</th><th>Monthly</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Permeate Volume (m³)</td>
            <td>{production.daily.toFixed(1)}</td>
            <td>{production.weekly.toFixed(1)}</td>
            <td>{production.monthly.toFixed(1)}</td>
          </tr>
          <tr>
            <td>Antiscalant Consumption (kg)</td>
            <td>{chemical.daily.toFixed(2)}</td>
            <td>{chemical.weekly.toFixed(2)}</td>
            <td>{chemical.monthly.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Recovery */}
      <h2>Recovery</h2>
      <table>
        <tbody>
          <tr><th style={{ width: '40%' }}>Current</th><td>{recovery.current.toFixed(2)} %</td></tr>
          <tr><th>Daily Average</th><td>{recovery.avg.toFixed(2)} %</td></tr>
          <tr><th>Range Min / Avg / Max</th>
              <td>{recovery.stats.min.toFixed(2)} / {recovery.stats.avg.toFixed(2)} / {recovery.stats.max.toFixed(2)} %</td></tr>
          <tr><th>Target</th><td>{RECOVERY_TARGET} %</td></tr>
        </tbody>
      </table>

      {/* Maintenance */}
      <h2>Maintenance / Membrane Health</h2>
      <table>
        <thead>
          <tr><th>Metric</th><th>Current</th><th>Range Avg</th><th>Range Max</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Stage 1 ΔP (bar)</td>
            <td>{maintenance.stage1.toFixed(3)}</td>
            <td>{maintenance.s1Stats.avg.toFixed(3)}</td>
            <td>{maintenance.s1Stats.max.toFixed(3)}</td>
          </tr>
          <tr>
            <td>Stage 2 ΔP (bar)</td>
            <td>{maintenance.stage2.toFixed(3)}</td>
            <td>{maintenance.s2Stats.avg.toFixed(3)}</td>
            <td>{maintenance.s2Stats.max.toFixed(3)}</td>
          </tr>
          <tr>
            <td>RO Pressure (bar)</td>
            <td>{maintenance.roPressure.toFixed(3)}</td>
            <td>{maintenance.pStats.avg.toFixed(3)}</td>
            <td>{maintenance.pStats.max.toFixed(3)}</td>
          </tr>
        </tbody>
      </table>

      {/* Distribution */}
      <h2>Flow Distribution</h2>
      <table>
        <thead><tr><th>Stream</th><th>Share (%)</th></tr></thead>
        <tbody>
          {distribution.map(d => (
            <tr key={d.name}><td>{d.name}</td><td>{d.value.toFixed(1)}%</td></tr>
          ))}
        </tbody>
      </table>

      {/* Time series tail */}
      {tsRows.length > 0 && (
        <>
          <h2>Recent Measurements (last {tsRows.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Time</th><th>Feed</th><th>Perm.</th><th>Conc.</th>
                <th>Rec%</th><th>P(bar)</th><th>ΔP1</th><th>ΔP2</th>
              </tr>
            </thead>
            <tbody>
              {tsRows.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.t).toLocaleTimeString()}</td>
                  <td>{r.feed.toFixed(1)}</td>
                  <td>{r.perm.toFixed(1)}</td>
                  <td>{r.conc.toFixed(1)}</td>
                  <td>{r.rec.toFixed(1)}</td>
                  <td>{r.p.toFixed(2)}</td>
                  <td>{r.d1.toFixed(2)}</td>
                  <td>{r.d2.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="footer">
        {plant} • Analytics Report • {label} • End of report
      </div>
    </div>
  );
}

export default Analytics;