// components/AntiscalantDosing.jsx - FULLY MOBILE RESPONSIVE
//
// Server-authoritative. This component never counts, never writes to
// localStorage, and never invents data. It polls /api/dosing/* every 5 s
// and interpolates the display between polls (cosmetic only).

import React, { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  AlertTriangle, CheckCircle, FlaskConical, Droplet,
  TrendingUp, TrendingDown, Clock, Calendar, AlertCircle, Info
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { API_BASE_URL } from "../config";
import { format, subHours, subDays } from 'date-fns';

// ─── Fallback constants (only used until the first server fetch returns) ────
const FALLBACK_RATE_ML_MIN = 2.7;
const FALLBACK_RATE_ML_SEC = FALLBACK_RATE_ML_MIN / 60;

// ─── Helpers ────────────────────────────────────────────────────────────────
function toBool(raw) {
  if (raw === true || raw === 1 || raw === '1') return true;
  if (raw === false || raw === 0 || raw === '0') return false;
  if (typeof raw === 'string') {
    const v = raw.trim().toUpperCase();
    return v === 'ON' || v === 'TRUE' || v === 'RUNNING' || v === 'ACTIVE' || v === 'YES';
  }
  return false;
}

function toNum(raw, fallback = 0) {
  if (raw === null || raw === undefined || raw === '') return fallback;
  const n = typeof raw === 'number' ? raw : parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function formatDuration(totalSeconds) {
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

function monthKeyNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Tooltip ────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0a1828", border: "1px solid rgba(14,165,233,0.2)",
      borderRadius: 8, padding: "8px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
    }}>
      <p style={{ fontSize: 10, color: "#4d7a9e", marginBottom: 4, fontWeight: 500 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{
          fontSize: 12, fontFamily: "var(--font-mono)", color: p.color,
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(3) : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Presentational ─────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, color, sub, icon: Icon, isMobile }) {
  return (
    <div className="rounded-lg p-3 sm:p-4" style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderColor: color ? `${color}40` : "var(--border)"
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{
          fontSize: isMobile ? 9 : 10, color: "var(--muted-foreground)",
          textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600
        }}>{label}</span>
        {Icon && <Icon size={isMobile ? 12 : 14} style={{ color: color || "var(--muted-foreground)" }} />}
      </div>
      <div className="flex items-end gap-1">
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: isMobile ? 20 : 24,
          fontWeight: 700, color: color || "var(--foreground)", lineHeight: 1
        }}>{value}</span>
        {unit && <span style={{ fontSize: isMobile ? 9 : 10, color: "var(--muted-foreground)", marginBottom: 2 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: isMobile ? 9 : 10, color: "var(--muted-foreground)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ isActive, size = 'md', isMobile }) {
  const pad = size === 'lg' ? '4px 14px' : size === 'sm' ? '2px 6px' : '3px 10px';
  const txt = size === 'lg' ? 12 : size === 'sm' ? 8 : 10;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: isMobile ? '2px 8px' : pad, borderRadius: 20,
      background: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      border: `1px solid ${isActive ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#22c55e' : '#ef4444' }} />
      <span style={{
        fontSize: isMobile ? 8 : txt, fontWeight: 700,
        color: isActive ? '#22c55e' : '#ef4444', letterSpacing: '0.05em'
      }}>
        {isActive ? 'RUNNING' : 'STOPPED'}
      </span>
    </div>
  );
}

function ChartPanel({ title, meta, children, isMobile }) {
  return (
    <div className="rounded-lg p-3 sm:p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span style={{
          fontSize: isMobile ? 10 : 12, fontWeight: 600,
          color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em"
        }}>{title}</span>
        {meta && <span style={{
          fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)"
        }}>{meta}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export function AntiscalantDosing() {
  const { getValue, getHistory, lastUpdate, connected } = useData();
  const [isMobile, setIsMobile] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  // Server state
  const [totals, setTotals] = useState(null);
  const [monthSummary, setMonthSummary] = useState(null);
  const [monthHistory, setMonthHistory] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Poll /api/dosing/* every 5 s ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = async () => {
      try {
        const month = monthKeyNow();
        const [tRes, mRes, hRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/dosing/totals`, { headers }),
          fetch(`${API_BASE_URL}/api/dosing/month`, { headers }),
          fetch(`${API_BASE_URL}/api/dosing/history?month=${month}`, { headers }),
        ]);
        if (cancelled) return;
        if (tRes.ok) setTotals(await tRes.json());
        if (mRes.ok) setMonthSummary(await mRes.json());
        if (hRes.ok) setMonthHistory(await hRes.json());
        setFetchError(null);
      } catch (err) {
        if (!cancelled) setFetchError(err.message);
      }
    };

    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // ── Live plant signals from DataContext (WebSocket-fed) ──────────────────
  const feedFlow       = toNum(getValue('RO5-FEEDFlow'));
  const permeateFlow   = toNum(getValue('RO5-Permeateflow'));
  const recovery       = toNum(getValue('RO5-SystemRecovery'));
  const pureWaterEC    = toNum(getValue('RO5-PureWaterEc'));
  const feedTankLevel  = toNum(getValue('RO5-FeedTankLevel'));
  const isDosingActive = toBool(getValue('RO5-AntiscalantDosingActive'));

  // ── Server-driven values ────────────────────────────────────────────────
  const rateMlPerSec     = totals?.rateMlPerSec ?? FALLBACK_RATE_ML_SEC;
  const rateMlPerMin     = totals?.rateMlPerMin ?? FALLBACK_RATE_ML_MIN;
  const secondsOnToday   = totals?.secondsOn ?? 0;
  const dosedTodayMl     = totals?.mlDosed ?? 0;
  const primedToday      = totals?.primedToday ?? false;
  const dosedThisMonthMl = monthSummary?.mlDosed ?? 0;
  const dosedThisMonthL  = dosedThisMonthMl / 1000;
  const dosingRateMlMin  = isDosingActive ? rateMlPerMin : 0;

  // ── Cosmetic live interpolation between polls ───────────────────────────
  const [displayMl, setDisplayMl] = useState(0);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  useEffect(() => {
    if (!isDosingActive) {
      setDisplayMl(dosedTodayMl);
      setDisplaySeconds(secondsOnToday);
      return;
    }
    const baseMl = dosedTodayMl;
    const baseSec = secondsOnToday;
    const startedAt = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setDisplayMl(baseMl + elapsed * rateMlPerSec);
      setDisplaySeconds(baseSec + elapsed);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dosedTodayMl, secondsOnToday, isDosingActive, rateMlPerSec]);

  const dailyConsumptionL = displayMl / 1000;

  // ── Chart: daily consumption for the current month (REAL) ───────────────
  const monthlyConsumptionData = useMemo(() => {
    const now = new Date();
    const thisMonth = monthKeyNow();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const byDay = new Map();
    (monthHistory?.days ?? []).forEach((d) => {
      byDay.set(d.day, (Number(d.mlDosed) || 0) / 1000);
    });
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const key = `${thisMonth}-${String(day).padStart(2, '0')}`;
      const isToday = day === now.getDate();
      const consumption = byDay.has(key)
        ? byDay.get(key)
        : (isToday ? dailyConsumptionL : 0);
      return { day: String(day), consumption, isToday };
    });
  }, [monthHistory, dailyConsumptionL]);

  // ── Chart: hourly feed flow over selected range (from client-side ring buffer) ──
  const feedHistory = getHistory('RO5-FEEDFlow');
  const hourlyFlowData = useMemo(() => {
    const now = new Date();
    const hours = timeRange === '24h' ? 24 : timeRange === '6h' ? 6 : 1;
    const startTime = subHours(now, hours);
    const filtered = (feedHistory || []).filter(d => new Date(d.time) >= startTime);
    const grouped = {};
    filtered.forEach(d => {
      const hour = format(new Date(d.time), 'HH:00');
      if (!grouped[hour]) grouped[hour] = { hour, flow: 0, count: 0 };
      grouped[hour].flow += toNum(d.value);
      grouped[hour].count++;
    });
    return Object.values(grouped)
      .map(g => ({ hour: g.hour, flow: g.count ? g.flow / g.count : 0 }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [feedHistory, timeRange]);

  // ── Projections (only meaningful if the plant runs 24/7) ────────────────
  const projectedDailyL = (rateMlPerSec * 86400) / 1000;
  const monthlyProjectedL = projectedDailyL * 30;
  const yearlyProjectedL = projectedDailyL * 365;

  // ── Alerts derived from real signals ────────────────────────────────────
  const alerts = useMemo(() => {
    const list = [];

    if (!isDosingActive && permeateFlow > 1) {
      list.push({
        id: 'ALERT-DOSE-OFF',
        type: 'Pump Stopped While System Running',
        description: 'Dosing pump is OFF but system is producing water',
        equipment: 'Antiscalant Pump',
        value: 'OFF',
        threshold: 'ON required',
        severity: 'critical',
      });
    }

    if (secondsOnToday > 60 && !primedToday) {
      list.push({
        id: 'ALERT-NO-PRIME',
        type: 'Startup Prime Missing',
        description: 'Pump has run today but the startup prime has not been recorded',
        equipment: 'Antiscalant Pump',
        value: `${Math.round(secondsOnToday)} s ON`,
        threshold: 'prime expected on first ON',
        severity: 'warning',
      });
    }

    if (pureWaterEC > 50) {
      list.push({
        id: 'ALERT-HIGH-EC',
        type: 'High Product Conductivity',
        description: 'Product water EC exceeds limit; check dosing and membranes',
        equipment: 'RO System',
        value: `${pureWaterEC.toFixed(1)} µS/cm`,
        threshold: '50 µS/cm',
        severity: 'critical',
      });
    }

    if (feedTankLevel > 0 && feedTankLevel < 20) {
      list.push({
        id: 'ALERT-LOW-TANK',
        type: 'Feed Tank Low',
        description: 'Feed tank level is low; system may stop shortly',
        equipment: 'Feed Tank',
        value: `${feedTankLevel.toFixed(0)} %`,
        threshold: '20 %',
        severity: 'warning',
      });
    }

    return list;
  }, [isDosingActive, permeateFlow, pureWaterEC, feedTankLevel, secondsOnToday, primedToday]);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 style={{
            fontSize: isMobile ? 18 : 20, fontWeight: 700, color: "var(--foreground)",
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <FlaskConical size={isMobile ? 16 : 20} style={{ color: "#a78bfa" }} />
            Antiscalant Dosing
          </h2>
          <p style={{ fontSize: isMobile ? 10 : 12, color: "var(--muted-foreground)", marginTop: 2 }}>
            {connected ? '✅ Connected' : '⚠️ Disconnected'} · server totalizer · Last updated:{' '}
            {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <StatusBadge isActive={isDosingActive} size="lg" isMobile={isMobile} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '2px 10px',
            background: 'var(--secondary)', borderRadius: 20,
            fontSize: isMobile ? 9 : 11, color: 'var(--muted-foreground)'
          }}>
            <Clock size={isMobile ? 10 : 14} />
            Rate: {rateMlPerMin.toFixed(2)} ml/min ({rateMlPerSec.toFixed(3)} ml/s)
          </div>
          {fetchError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3, padding: '2px 10px',
              background: 'rgba(239,68,68,0.12)', borderRadius: 20,
              border: '1px solid rgba(239,68,68,0.2)'
            }}>
              <AlertCircle size={isMobile ? 10 : 14} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: isMobile ? 9 : 11, color: '#ef4444' }}>sync offline</span>
            </div>
          )}
          {alerts.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3, padding: '2px 10px',
              background: criticalAlerts.length > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.12)',
              borderRadius: 20,
              border: `1px solid ${criticalAlerts.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}`
            }}>
              <AlertCircle size={isMobile ? 10 : 14} style={{ color: criticalAlerts.length > 0 ? '#ef4444' : '#eab308' }} />
              <span style={{
                fontSize: isMobile ? 9 : 11, fontWeight: 600,
                color: criticalAlerts.length > 0 ? '#ef4444' : '#eab308'
              }}>{alerts.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && showAlerts && (
        <div className="flex flex-col gap-2">
          {alerts.slice(0, isMobile ? 2 : 5).map((a) => (
            <div key={a.id} className="flex items-start sm:items-center gap-2 sm:gap-3 rounded-lg p-2 sm:p-3" style={{
              background: a.severity === 'critical' ? "rgba(239,68,68,0.08)" : "rgba(234,179,8,0.08)",
              border: `1px solid ${a.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}`,
              borderLeft: `4px solid ${a.severity === 'critical' ? '#ef4444' : '#eab308'}`
            }}>
              <AlertTriangle size={isMobile ? 12 : 16} style={{
                color: a.severity === 'critical' ? "#ef4444" : "#eab308",
                flexShrink: 0, marginTop: isMobile ? 2 : 0
              }} />
              <div className="flex-1 min-w-0">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: isMobile ? 11 : 13, fontWeight: 600,
                    color: a.severity === 'critical' ? "#ef4444" : "#eab308"
                  }}>{a.type}</span>
                  <span style={{ fontSize: isMobile ? 9 : 11, color: "var(--muted-foreground)" }}>{a.equipment}</span>
                </div>
                <div style={{ fontSize: isMobile ? 9 : 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  {a.description} · {a.value}
                </div>
              </div>
              <span style={{
                fontSize: isMobile ? 7 : 9, fontWeight: 700,
                color: a.severity === 'critical' ? "#ef4444" : "#eab308",
                background: a.severity === 'critical' ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.15)",
                borderRadius: 4, padding: "1px 6px", letterSpacing: "0.05em", flexShrink: 0
              }}>{a.severity.toUpperCase()}</span>
            </div>
          ))}
          {alerts.length > (isMobile ? 2 : 5) && (
            <div style={{ fontSize: isMobile ? 9 : 11, color: "var(--muted-foreground)", textAlign: 'center', padding: '4px' }}>
              + {alerts.length - (isMobile ? 2 : 5)} more alerts
            </div>
          )}
          <button
            onClick={() => setShowAlerts(false)}
            style={{
              alignSelf: 'flex-end', fontSize: isMobile ? 9 : 11,
              color: 'var(--muted-foreground)', background: 'transparent',
              border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4
            }}
          >
            Dismiss All
          </button>
        </div>
      )}

      {/* KPI cards — all from server / live context */}
      <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <MetricCard
          label="Dosing Rate"
          value={dosingRateMlMin.toFixed(2)}
          unit="ml/min"
          color="#a78bfa"
          icon={FlaskConical}
          sub={isDosingActive ? `✅ Active · ${rateMlPerSec.toFixed(3)} ml/s` : '⛔ Stopped'}
          isMobile={isMobile}
        />
        <MetricCard
          label="Dosed Today"
          value={displayMl.toFixed(2)}
          unit="ml"
          color="#0ea5e9"
          icon={Droplet}
          sub={`${formatDuration(displaySeconds)} ON · ${dailyConsumptionL.toFixed(3)} L${primedToday ? ' · primed' : ''}`}
          isMobile={isMobile}
        />
        <MetricCard
          label="Month to Date"
          value={dosedThisMonthL.toFixed(3)}
          unit="L"
          color="#06b6d4"
          icon={Calendar}
          sub={`${dosedThisMonthMl.toFixed(1)} ml · ${monthSummary?.month ?? '—'}`}
          isMobile={isMobile}
        />
        <MetricCard
          label="Projected Month"
          value={monthlyProjectedL.toFixed(1)}
          unit="L"
          color="#22c55e"
          icon={TrendingUp}
          sub={`at 24/7 · ${yearlyProjectedL.toFixed(0)} L/yr`}
          isMobile={isMobile}
        />
        <MetricCard
          label="Recovery"
          value={recovery.toFixed(1)}
          unit="%"
          color={recovery > 75 ? '#22c55e' : recovery > 65 ? '#eab308' : '#ef4444'}
          icon={TrendingUp}
          sub={`${feedFlow.toFixed(1)} m³/h feed`}
          isMobile={isMobile}
        />
        <MetricCard
          label="Feed Tank"
          value={feedTankLevel.toFixed(0)}
          unit="%"
          color={feedTankLevel > 30 ? '#22c55e' : feedTankLevel > 20 ? '#eab308' : '#ef4444'}
          icon={Info}
          sub={feedTankLevel > 30 ? 'Normal' : 'Low'}
          isMobile={isMobile}
        />
      </div>

      {/* Row: Daily consumption chart + System status */}
      <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr" }}>
        <ChartPanel title="Daily Consumption" meta={`${monthSummary?.month ?? monthKeyNow()} · L/day`} isMobile={isMobile}>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
            <BarChart data={monthlyConsumptionData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} interval={isMobile ? 2 : 0} />
              <YAxis tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="consumption" fill="#a78bfa" radius={[3, 3, 0, 0]} name="Consumption (L)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="System Status" meta="live" isMobile={isMobile}>
          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: isMobile ? '6px' : '10px', background: 'var(--secondary)', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 8 : 9, color: 'var(--muted-foreground)' }}>Dosing Pump</div>
              <div style={{
                fontSize: isMobile ? 14 : 16, fontWeight: 700,
                color: isDosingActive ? '#22c55e' : '#ef4444', marginTop: 2
              }}>{isDosingActive ? 'ON' : 'OFF'}</div>
            </div>
            <div style={{ padding: isMobile ? '6px' : '10px', background: 'var(--secondary)', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 8 : 9, color: 'var(--muted-foreground)' }}>Product EC</div>
              <div style={{
                fontSize: isMobile ? 14 : 16, fontWeight: 700,
                color: pureWaterEC < 30 ? '#22c55e' : pureWaterEC < 50 ? '#eab308' : '#ef4444',
                marginTop: 2
              }}>{pureWaterEC.toFixed(1)}</div>
            </div>
            <div style={{ padding: isMobile ? '6px' : '10px', background: 'var(--secondary)', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 8 : 9, color: 'var(--muted-foreground)' }}>Feed Flow</div>
              <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: '#0ea5e9', marginTop: 2 }}>
                {feedFlow.toFixed(1)}
              </div>
            </div>
            <div style={{ padding: isMobile ? '6px' : '10px', background: 'var(--secondary)', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 8 : 9, color: 'var(--muted-foreground)' }}>Permeate</div>
              <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: '#22c55e', marginTop: 2 }}>
                {permeateFlow.toFixed(1)}
              </div>
            </div>
          </div>
        </ChartPanel>
      </div>

      {/* Row: Feed flow (last N hours) */}
      <ChartPanel
        title="Feed Flow"
        meta={`${timeRange === '24h' ? '24 Hours' : timeRange === '6h' ? '6 Hours' : '1 Hour'} · m³/h`}
        isMobile={isMobile}
      >
        <div className="flex items-center gap-2 mb-2">
          {['1h', '6h', '24h'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: isMobile ? '2px 8px' : '3px 10px',
                borderRadius: 4,
                fontSize: isMobile ? 9 : 10,
                fontWeight: 600,
                background: timeRange === range ? '#0ea5e9' : 'var(--secondary)',
                color: timeRange === range ? 'white' : 'var(--muted-foreground)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >{range}</button>
          ))}
        </div>
        {hourlyFlowData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted-foreground)', fontSize: 11 }}>
            Waiting for feed flow history...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 140 : 160}>
            <LineChart data={hourlyFlowData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis dataKey="hour" tick={{ fontSize: isMobile ? 7 : 8, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: isMobile ? 7 : 8, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="flow" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Feed Flow" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>

      {/* Daily records table — real data from /api/dosing/history */}
      <div className="rounded-lg p-3 sm:p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{
          fontSize: isMobile ? 10 : 12, fontWeight: 600, color: "var(--muted-foreground)",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10
        }}>
          Daily Dosing Records — {monthSummary?.month ?? monthKeyNow()}
        </div>

        {!monthHistory || monthHistory.days.length === 0 ? (
          <div style={{
            padding: '20px', textAlign: 'center',
            color: 'var(--muted-foreground)', fontSize: isMobile ? 10 : 11
          }}>
            No dosing records yet for this month.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 11 : 12 }}>
              <thead>
                <tr>
                  {[
                    { key: 'date', label: 'Date', showMobile: true },
                    { key: 'on', label: 'ON Time', showMobile: false },
                    { key: 'ml', label: 'Volume (ml)', showMobile: true },
                    { key: 'l', label: 'Volume (L)', showMobile: false },
                    { key: 'primed', label: 'Primed', showMobile: true },
                  ].filter(c => !isMobile || c.showMobile).map(col => (
                    <th key={col.key} style={{
                      padding: isMobile ? "6px 8px" : "8px 12px", textAlign: "left",
                      fontSize: isMobile ? 8 : 10, fontWeight: 600,
                      color: "var(--muted-foreground)", letterSpacing: "0.06em",
                      textTransform: "uppercase", borderBottom: "1px solid var(--border)"
                    }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...monthHistory.days].reverse().map((r, i) => (
                  <tr key={r.day} style={{ background: i % 2 === 0 ? "var(--card)" : "var(--secondary)" }}>
                    <td style={{
                      padding: isMobile ? "6px 8px" : "8px 12px",
                      fontFamily: "var(--font-mono)", color: "var(--foreground)",
                      borderBottom: "1px solid var(--border)"
                    }}>{r.day}</td>
                    {!isMobile && (
                      <td style={{
                        padding: "8px 12px", fontFamily: "var(--font-mono)",
                        color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)"
                      }}>{formatDuration(r.secondsOn)}</td>
                    )}
                    <td style={{
                      padding: isMobile ? "6px 8px" : "8px 12px",
                      fontFamily: "var(--font-mono)", color: "#a78bfa",
                      borderBottom: "1px solid var(--border)"
                    }}>{Number(r.mlDosed).toFixed(2)}</td>
                    {!isMobile && (
                      <td style={{
                        padding: "8px 12px", fontFamily: "var(--font-mono)",
                        color: "#0ea5e9", borderBottom: "1px solid var(--border)"
                      }}>{(Number(r.mlDosed) / 1000).toFixed(4)}</td>
                    )}
                    <td style={{ padding: isMobile ? "6px 8px" : "8px 12px", borderBottom: "1px solid var(--border)" }}>
                      {r.primedToday
                        ? <CheckCircle size={isMobile ? 11 : 13} style={{ color: '#22c55e' }} />
                        : <span style={{ fontSize: isMobile ? 9 : 10, color: 'var(--muted-foreground)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!showAlerts && alerts.length > 0 && (
        <button
          onClick={() => setShowAlerts(true)}
          style={{
            padding: isMobile ? '6px 12px' : '8px 16px',
            background: 'var(--secondary)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--foreground)',
            fontSize: isMobile ? 11 : 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center'
          }}
        >
          <AlertTriangle size={isMobile ? 12 : 14} style={{ color: '#eab308' }} />
          Show {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
        </button>
      )}

    </div>
  );
}

export default AntiscalantDosing;