

import React, { useState, useMemo, useEffect } from "react";
import { AlertTriangle, FlaskConical, AlertCircle, Recycle } from "lucide-react";
import { API_BASE_URL } from "../config";
import { useData } from "../contexts/DataContext";
import { rawToPercent } from "./dashboardComponents/feedTankCalibration";
import { format } from 'date-fns';
import { useDailySummary } from "./dashboardComponents/useDailySummary";

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

function formatHours(hrs) {
  if (!Number.isFinite(hrs) || hrs < 0) return '0h 0m';
  const totalMinutes = Math.round(hrs * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
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

// ─── Look (matches the rest of the neon dashboard) ──────────────────────────
const card = () => ({ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 18 });
const cap = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)' };
const big = (color, size = 34) => ({ fontFamily: 'var(--font-mono)', fontSize: size, fontWeight: 800, color, lineHeight: 1 });
const unit = { fontSize: 13, color: 'var(--muted-foreground)', fontWeight: 700 };
const sub = { fontSize: 12.5, color: 'var(--muted-foreground)' };

// minutes of dosing per 2h interval + dose rate, computed on the server from stored readings
function useDosingOverview() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let stop = false;
    const root = String(API_BASE_URL || '').replace(/\/api\/?$/, '');
    const load = async () => {
      try {
        let token = null;
        try { token = localStorage.getItem('accessToken'); } catch { /* ignore */ }
        const r = await fetch(`${root}/api/dosing-overview`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!r.ok) return;
        const d = await r.json();
        if (!stop) setData(d);
      } catch { /* keep last */ }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { stop = true; clearInterval(t); };
  }, []);
  return data;
}

// ─── Main ───────────────────────────────────────────────────────────────────
export function AntiscalantDosing() {
  const { getValue, getHistory, lastUpdate, connected } = useData();
  const [isMobile, setIsMobile] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Live plant signals from DataContext (WebSocket-fed) ──────────────────
  const feedFlow       = toNum(getValue('RO5-FEEDFlow'));
  const permeateFlow   = toNum(getValue('RO5-Permeateflow'));
  const recovery       = toNum(getValue('RO5-SystemRecovery'));
  const pureWaterEC    = toNum(getValue('RO5-PureWaterEc'));
  const isDosingActive = toBool(getValue('RO5-AntiscalantDosingActive'));

  // Feed tank: calibrate from the raw transmitter signal (same as Dashboard).
  // Falls back to the backend-scaled value only if the raw tag hasn't arrived.
  const feedTankRawValue = getValue('RO5-FeedTankLevelRaw');
  const feedTankRawNum = typeof feedTankRawValue === 'number'
    ? feedTankRawValue
    : parseFloat(feedTankRawValue);
  const calibratedTankPct = Number.isFinite(feedTankRawNum) ? rawToPercent(feedTankRawNum) : null;
  const hasTankReading = calibratedTankPct !== null;
  const feedTankLevel = hasTankReading
    ? calibratedTankPct
    : toNum(getValue('RO5-FeedTankLevel'));

  // PLC-reported tags
  const antiscalantDailyPLC = toNum(getValue('RO5-AntiscalantDaily'));   // ml, PLC's own running daily total
  // const systemRunHrs        = toNum(getValue('RO5-SystemRunhrs'));       // hrs, PLC's own running total

  const dailyConsumptionL = antiscalantDailyPLC / 1000;

  // Saved daily record: what happened over the previous day (before the PLC reset to zero)
  const dailySummary = useDailySummary();
  const ml24hAgo = dailySummary?.yesterday?.antiscalantMl;
  const hasMl24hAgo = Number.isFinite(ml24hAgo);
  const overview = useDosingOverview();
  const intervals = overview?.intervals || [];
  const doseRate = overview?.rateMlPerMin;
  const unitKey = overview?.unit === 'ml' ? 'ml' : 'min';
  const scaleMax = unitKey === 'ml' ? Math.max(1, ...intervals.map((i) => i.minutes)) : Math.max(60, ...intervals.map((i) => i.minutes));
  const allZero = intervals.length > 0 && intervals.every((i) => !i.minutes);

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

    // 4.9 raw now maps to exactly 0%, so also alert when a real reading exists
    if ((hasTankReading || feedTankLevel > 0) && feedTankLevel < 20) {
      list.push({
        id: 'ALERT-LOW-TANK',
        type: 'Feed Tank Low',
        description: 'Feed tank level is low; system may stop shortly',
        equipment: 'Feed Tank',
        value: `${feedTankLevel.toFixed(1)} %`,
        threshold: '20 %',
        severity: 'warning',
      });
    }

    return list;
  }, [isDosingActive, permeateFlow, pureWaterEC, feedTankLevel, hasTankReading]);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');

  // ── Render ──────────────────────────────────────────────────────────────
 return (
  <div className="h-full overflow-auto antiscalant-scroll">
    <style>{`
      .antiscalant-scroll { scrollbar-width: thin; scrollbar-color: #1f3a5f transparent; }
      .antiscalant-scroll::-webkit-scrollbar { width: 8px; }
      .antiscalant-scroll::-webkit-scrollbar-track { background: transparent; }
      .antiscalant-scroll::-webkit-scrollbar-thumb { background: #1f3a5f; border-radius: 8px; }
      .antiscalant-scroll::-webkit-scrollbar-thumb:hover { background: #00e5ff; }
    `}</style>

    <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4" style={{ maxWidth: 1080, width: '100%', margin: '0 auto' }}>

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
            {connected ? '✅ Connected' : '⚠️ Disconnected'} · PLC-reported · Last updated:{' '}
            {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <StatusBadge isActive={isDosingActive} size="lg" isMobile={isMobile} />
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

      {/* Dosing today + dose rate */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 12 }}>
        <div style={card()}>
          <div style={cap}><FlaskConical size={13} style={{ color: '#a78bfa' }} /> Dosing today</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
            <span style={big('#00e5ff')}>{antiscalantDailyPLC.toFixed(0)}</span>
            <span style={unit}>ml</span>
          </div>
          <div style={{ marginTop: 12 }}><StatusBadge isActive={isDosingActive} size="sm" isMobile={isMobile} /></div>
        </div>
        <div style={card()}>
          <div style={cap}><FlaskConical size={13} style={{ color: '#a78bfa' }} /> Antiscalant dosed 24hrs ago</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
            <span style={big('#a78bfa')}>{hasMl24hAgo ? ml24hAgo.toFixed(0) : '--'}</span>
            <span style={unit}>ml</span>
          </div>
          
        </div>
      </div>

      {/* Recovery + feed tank */}
      <div style={{ ...card(), display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={cap}><Recycle size={13} style={{ color: '#00e5ff' }} /> Recovery</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
            <span style={big(recovery > 75 ? '#39ff88' : recovery > 65 ? '#ffb938' : '#ff3355', 28)}>{recovery.toFixed(1)}</span>
            <span style={unit}>%</span>
          </div>
        </div>
        <div>
          <div style={cap}>Feed tank</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
            <span style={big(feedTankLevel > 30 ? '#c6ff00' : feedTankLevel > 20 ? '#ffb938' : '#ff3355', 28)}>{feedTankLevel.toFixed(1)}</span>
            <span style={unit}>%</span>
          </div>
        </div>
      </div>

      {/* Minutes dosing per interval */}
      <div style={card()}>
        <div style={cap}>{unitKey === 'ml' ? 'Antiscalant dosed per interval (ml)' : 'Minutes dosing per interval'}</div>
        {intervals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)', fontSize: 13 }}>Loading dosing history...</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? 4 : 12, height: isMobile ? 220 : 300, marginTop: 14, padding: '0 4px' }}>
            {intervals.map((it, i) => {
              const h = Math.max(2, (it.minutes / scaleMax) * (isMobile ? 160 : 230));
              return (
                <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <div style={{ fontSize: isMobile ? 10 : 15, color: 'var(--foreground)', marginBottom: 6 }}>{Number(it.minutes) % 1 === 0 ? it.minutes : it.minutes.toFixed(1)}</div>
                  <div style={{ width: '100%', maxWidth: 56, height: h, borderRadius: 10, background: '#00e5ff', boxShadow: '0 0 16px rgba(0,229,255,0.55)' }} />
                  <div style={{ fontSize: isMobile ? 9 : 15, color: 'var(--muted-foreground)', marginTop: 10, whiteSpace: 'nowrap' }}>{it.label}</div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ ...sub, marginTop: 10 }}>
          {unitKey === 'ml' ? 'Each bar = ml dosed in a 2-hour interval.' : 'Each bar = minutes the pump ran in a 2-hour interval.'} Last bar is the current, still running interval.
          {allZero && overview?.debug ? ` No dosing found in the stored history (pump records: ${overview.debug.stateRows}, counter records: ${overview.debug.mlRows}).` : ''}
        </div>
      </div>

      {/* System status */}
      <div style={card()}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={cap}>System status</span>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#c6ff00' }}>LIVE</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          {[
            ['Dosing pump', isDosingActive ? 'ON' : 'OFF', isDosingActive ? '#39ff88' : '#ff3355'],
            ['Product EC', pureWaterEC.toFixed(1), pureWaterEC < 30 ? '#c6ff00' : pureWaterEC < 50 ? '#ffb938' : '#ff3355'],
            ['Feed flow', feedFlow.toFixed(1), '#00e5ff'],
            ['Permeate', permeateFlow.toFixed(1), '#39ff88'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ padding: '16px 10px', background: 'var(--secondary)', borderRadius: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{l}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c, marginTop: 6 }}>{v}</div>
            </div>
          ))}
        </div>
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
    </div>
  );
}

export default AntiscalantDosing;