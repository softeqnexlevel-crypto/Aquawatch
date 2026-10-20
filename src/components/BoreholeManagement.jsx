// components/FeedTankManagement.jsx
// Card grid of tanks. Tapping a card opens a detail view (full screen on
// phones, centred panel on larger screens) with level, 24h usage and history.

import React, { useState, useMemo, useEffect } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

import { ChevronLeft, X } from "lucide-react";
import { format } from "date-fns";

import { API_BASE_URL } from "../config";
import { useData } from "../contexts/DataContext";

import { rawToPercent } from "./dashboardComponents/feedTankCalibration";

/* ============================================================
   CALIBRATION
   ============================================================ */

// Flush tank (tag RO5-FlushTank): RAW 0 = 0%, RAW 126 = 100%
const FLUSH_RAW_EMPTY = 0;
const FLUSH_RAW_FULL = 126;

function flushRawToPercent(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const pct =
    ((n - FLUSH_RAW_EMPTY) / (FLUSH_RAW_FULL - FLUSH_RAW_EMPTY)) * 100;
  return Math.min(100, Math.max(0, pct));
}

const clampPct = (p) =>
  p !== null && Number.isFinite(p) ? Math.min(100, Math.max(0, p)) : null;

/* ============================================================
   STATUS + COLOURS
   ============================================================ */

const STATUS_COLORS = {
  Active: "#22c55e",
  Standby: "#94a3b8",
  Warning: "#f59e0b",
  Empty: "#ef4444",
  Offline: "#64748b",
};

const getStatus = (level, hasData) => {
  if (!hasData) return "Offline";
  if (level <= 0) return "Empty";
  if (level > 70) return "Active";
  if (level > 40) return "Standby";
  if (level > 15) return "Warning";
  return "Empty";
};

// Tank colour by fill level: full = green, mid = blue, low = red
const getLevelColor = (level, hasData) => {
  if (!hasData) return "#64748b";
  if (level > 50) return "#22c55e";
  if (level > 25) return "#0ea5e9";
  return "#ef4444";
};

const FILTERS = ["All", "Active", "Standby", "Warning", "Empty"];

const CYAN = "#00e5ff";
const LABEL = "var(--muted-foreground, #94a3b8)";
const CARD_BG = "var(--card, #0b1220)";
const CARD_BORDER = "var(--border, rgba(148,163,184,0.15))";

/* ============================================================
   24H LEVEL POINTS + WATER USED
   ============================================================ */

// Sensor jitter smaller than this (in % of tank) is ignored, otherwise
// tiny up/down wobbles add up to a huge fake "usage" figure.
const NOISE_DEADBAND_PCT = 0.5;
const DAY_MS = 24 * 60 * 60 * 1000;

// history entries look like { time: Date, value: rawNumber } (DataContext).
function toLevelPoints(history, toPercent) {
  if (!Array.isArray(history)) return [];
  const cutoff = Date.now() - DAY_MS;
  return history
    .map((d) => ({ ts: new Date(d.time).getTime(), pct: toPercent(d.value) }))
    .filter((p) => Number.isFinite(p.ts) && p.pct !== null && p.ts >= cutoff);
}

// Returns { used: m³, spanHours: how much history was actually available }.
function computeWaterUsed(points, capacity) {
  if (points.length < 2) return { used: 0, spanHours: 0 };

  // Hysteresis: only count a drop once it exceeds the deadband.
  // Rises (refills) just move the reference level up.
  let ref = points[0].pct;
  let dropPct = 0;
  for (let i = 1; i < points.length; i++) {
    const p = points[i].pct;
    if (p > ref) {
      ref = p;
    } else if (ref - p >= NOISE_DEADBAND_PCT) {
      dropPct += ref - p;
      ref = p;
    }
  }

  const spanHours =
    (points[points.length - 1].ts - points[0].ts) / (60 * 60 * 1000);

  return { used: (dropPct / 100) * capacity, spanHours };
}

// Real volume that left the tank = feed flow (m³/h) integrated over time.
// Gaps longer than FLOW_MAX_GAP_MS (data outage) are skipped, not guessed.
const FLOW_MAX_GAP_MS = 15 * 60 * 1000;

function computeFlowVolume(history) {
  if (!Array.isArray(history)) return { used: 0, spanHours: 0, ok: false };
  const cutoff = Date.now() - DAY_MS;
  const pts = history
    .map((d) => ({ ts: new Date(d.time).getTime(), v: Number(d.value) }))
    .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.v) && p.ts >= cutoff)
    .sort((a, b) => a.ts - b.ts);
  if (pts.length < 2) return { used: 0, spanHours: 0, ok: false };

  let used = 0;
  for (let i = 1; i < pts.length; i++) {
    const dt = pts[i].ts - pts[i - 1].ts;
    if (dt <= 0 || dt > FLOW_MAX_GAP_MS) continue;
    const avg = (Math.max(0, pts[i - 1].v) + Math.max(0, pts[i].v)) / 2; // m³/h
    used += (avg * dt) / (60 * 60 * 1000);
  }
  const spanHours = (pts[pts.length - 1].ts - pts[0].ts) / (60 * 60 * 1000);
  return { used, spanHours, ok: true };
}

// A refill = the level climbs by at least REFILL_RISE_PCT from its lowest point
// since the last refill. It then has to fall by the same amount before the next
// one can count, so sensor wobble is not counted.
const REFILL_RISE_PCT = 20;

function countRefills(points) {
  if (!points || points.length < 2) return 0;
  let refills = 0;
  let state = "down";
  let lo = points[0].pct;
  let hi = points[0].pct;
  for (let i = 1; i < points.length; i++) {
    const p = points[i].pct;
    if (state === "down") {
      if (p < lo) lo = p;
      else if (p - lo >= REFILL_RISE_PCT) {
        refills += 1;
        state = "up";
        hi = p;
      }
    } else if (p > hi) {
      hi = p;
    } else if (hi - p >= REFILL_RISE_PCT) {
      state = "down";
      lo = p;
    }
  }
  return refills;
}

/* ============================================================
   STORED HISTORY (same route LiveTrendChart uses)
   GET /api/history/:tag?hours=24  ->  [{ t, value }, ...]
   ============================================================ */

// config may or may not end with /api, so strip it before adding our own.
const API_ROOT = String(API_BASE_URL || "").replace(/\/api\/?$/, "");

// Returns history entries shaped like DataContext's { time: Date, value },
// made of the stored readings plus any live readings newer than the last stored one.
function useMergedHistory(tag, liveHistory, hours = 24) {
  const [stored, setStored] = useState([]);

  useEffect(() => {
    let stop = false;

    const load = async () => {
      try {
        let token = null;
        try { token = localStorage.getItem("accessToken"); } catch { /* ignore */ }
        const r = await fetch(
          `${API_ROOT}/api/history/${encodeURIComponent(tag)}?hours=${hours}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (!r.ok) return;
        const rows = await r.json();
        if (stop || !Array.isArray(rows)) return;
        setStored(
          rows
            .map((row) => ({ time: new Date(row.t), value: Number(row.value) }))
            .filter((p) => Number.isFinite(p.time.getTime()) && Number.isFinite(p.value))
            .sort((a, b) => a.time - b.time)
        );
      } catch {
        /* keep whatever we already have */
      }
    };

    load();
    const timer = setInterval(load, 60000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [tag, hours]);

  return useMemo(() => {
    const live = Array.isArray(liveHistory) ? liveHistory : [];
    if (stored.length === 0) return live;
    const lastT = stored[stored.length - 1].time.getTime();
    return [
      ...stored,
      ...live.filter((d) => new Date(d.time).getTime() > lastT),
    ];
  }, [stored, liveHistory]);
}

/* ============================================================
   SMALL COMPONENTS
   ============================================================ */

/* Exact 24h usage (from the server) and the capacities saved in Settings */
function useTankUsage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        let token = null;
        try { token = localStorage.getItem("accessToken"); } catch { /* ignore */ }
        const r = await fetch(`${API_ROOT}/api/tank-usage?hours=24`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!r.ok) return;
        const d = await r.json();
        if (!stop) setData(d);
      } catch { /* keep the last result */ }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => { stop = true; clearInterval(timer); };
  }, []);
  return data;
}

const StatusPill = ({ status }) => {
  const color = STATUS_COLORS[status] || STATUS_COLORS.Offline;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        border: `1px solid ${color}55`,
        background: `${color}14`,
        color,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 8, lineHeight: 1 }}>●</span>
      {status}
    </span>
  );
};

const TankIcon = ({ level, color, width = 62, height = 105, ticks = false }) => (
  <div
    aria-hidden="true"
    style={{
      position: "relative",
      width,
      height,
      flexShrink: 0,
      borderRadius: Math.round(width * 0.26),
      border: `3px solid ${ticks ? `${color}99` : "rgba(148,163,184,0.55)"}`,
      background: "rgba(0,12,20,0.9)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: `${level}%`,
        background: `linear-gradient(180deg, ${color}cc, ${color}77)`,
        borderTop: level > 0 && level < 100 ? `2px solid ${color}` : "none",
        transition: "height 0.6s ease",
      }}
    />
    {ticks &&
      [25, 50, 75].map((t) => (
        <div
          key={t}
          style={{
            position: "absolute",
            left: 0,
            width: 10,
            bottom: `${t}%`,
            height: 2,
            background: "rgba(255,255,255,0.35)",
          }}
        />
      ))}
  </div>
);

/* ============================================================
   TANK CARD (grid item)
   ============================================================ */

const TankCard = ({ tank, onOpen, isMobile }) => {
  const color = getLevelColor(tank.level, tank.hasData);
  const level = tank.hasData ? tank.level : 0;
  const left = tank.hasData ? tank.volume : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(tank.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(tank.id);
        }
      }}
      aria-label={`Open details for ${tank.name}`}
      style={{
        position: "relative",
        padding: isMobile ? "12px 14px 12px 16px" : "16px 18px 16px 20px",
        borderRadius: 16,
        background: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        borderLeft: `3px solid ${color}`,
        boxShadow: `0 0 22px ${color}14`,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 6,
            background: "rgba(14,165,233,0.15)",
            color: "#38bdf8",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
          }}
        >
          {tank.id}
        </span>
        <StatusPill status={tank.status} />
      </div>

      <div style={{ display: "flex", gap: isMobile ? 14 : 18, alignItems: "center" }}>
        <TankIcon
          level={level}
          color={color}
          width={isMobile ? 54 : 72}
          height={isMobile ? 92 : 120}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--foreground, #fff)",
            }}
          >
            {tank.name}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginTop: 6,
            }}
          >
            <span
              style={{
                fontSize: isMobile ? 28 : 34,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: tank.hasData ? color : "#64748b",
                lineHeight: 1,
              }}
            >
              {tank.hasData ? Math.round(level) : "--"}
            </span>
            <span style={{ fontSize: 12, color: LABEL }}>
              % of {tank.capacity} m³
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={Math.round(level)}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: 8,
              marginTop: 14,
              borderRadius: 999,
              background: "rgba(148,163,184,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${level}%`,
                height: "100%",
                borderRadius: 999,
                background: color,
                transition: "width 0.6s ease",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              fontSize: 12,
              color: LABEL,
            }}
          >
            <span>
              ≈ {left < 10 ? left.toFixed(1) : left.toFixed(0)} m³ left
            </span>
            <span>Used 24h: {tank.waterUsed24h.toFixed(1)} m³</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   TANK DETAIL VIEW
   ============================================================ */

const StatBox = ({ label, value, accent }) => (
  <div
    style={{
      padding: "14px 16px",
      borderRadius: 14,
      background: CARD_BG,
      border: `1px solid ${CARD_BORDER}`,
    }}
  >
    <div
      style={{
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: LABEL,
        marginBottom: 8,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 24,
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        color: accent || "var(--foreground, #fff)",
      }}
    >
      {value}
    </div>
  </div>
);

const TankDetail = ({ tank, lastUpdate, isMobile, onClose }) => {
  const color = getLevelColor(tank.level, tank.hasData);
  const level = tank.hasData ? tank.level : 0;
  const left = tank.hasData ? tank.volume : 0;

  const shareOfCapacity =
    tank.capacity > 0 ? (tank.waterUsed24h / tank.capacity) * 100 : 0;
  const methodText =
    tank.usageMethod === "flow"
      ? "Used = water that flowed out to the plant (feed flow m³/h × time). The tank is refilled continuously, so this can be many times its capacity."
      : "Used = level drop × tank capacity.";

  // Chart data: real history points, thinned so the chart stays light.
  const end = Date.now();
  const step = Math.max(1, Math.ceil(tank.levelPoints.length / 120));
  const chartData = tank.levelPoints
    .filter((_, i) => i % step === 0)
    .map((p) => ({ ts: p.ts, pct: Math.round(p.pct * 10) / 10 }));

  // The history only exists since this page was opened, so zoom the time axis
  // to the data we really have (up to 24h) instead of squeezing it into a corner.
  const firstTs = chartData.length ? chartData[0].ts : end;
  const hasFullDay = end - firstTs >= DAY_MS * 0.95;
  const start = hasFullDay ? end - DAY_MS : firstTs;
  const tickCount = 5;
  const ticks = Array.from(
    { length: tickCount },
    (_, i) => Math.round(start + ((end - start) * i) / (tickCount - 1))
  );
  const spanLabel = hasFullDay
    ? null
    : (() => {
        const mins = Math.max(1, Math.round((end - firstTs) / 60000));
        return mins < 90 ? `${mins} min` : `${(mins / 60).toFixed(1)} h`;
      })();

  // Zoom the level axis to the data so small changes are visible
  const pcts = chartData.map((d) => d.pct);
  const dataMin = pcts.length ? Math.min(...pcts) : 0;
  const dataMax = pcts.length ? Math.max(...pcts) : 100;
  let yMin = Math.max(0, Math.floor(dataMin - 3));
  let yMax = Math.min(100, Math.ceil(dataMax + 3));
  if (yMax - yMin < 10) {
    yMin = Math.max(0, Math.min(yMin, yMax - 10));
    yMax = Math.min(100, yMin + 10);
  }

  const panelStyle = isMobile
    ? {
        position: "absolute",
        inset: 0,
        overflowY: "auto",
        padding: "16px 16px 32px",
        background: "var(--background, #04070d)",
      }
    : {
        position: "relative",
        width: "100%",
        maxWidth: 480,
        maxHeight: "92vh",
        overflowY: "auto",
        padding: "18px 20px 24px",
        borderRadius: 20,
        background: "var(--background, #060b14)",
        border: `1px solid ${CARD_BORDER}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
      };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${tank.name} details`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 16,
        background: isMobile ? "transparent" : "rgba(0,0,0,0.65)",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={panelStyle}>
        {/* Back + close */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              color: LABEL,
              fontSize: 15,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <ChevronLeft size={20} />
            Back to Tanks
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: LABEL,
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 26,
              fontWeight: 700,
              color: "#38bdf8",
              letterSpacing: "0.04em",
            }}
          >
            {tank.id}
          </span>
          <StatusPill status={tank.status} />
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--foreground, #fff)",
            marginTop: 2,
          }}
        >
          {tank.name}
        </div>
        <div style={{ fontSize: 13, color: LABEL, marginTop: 4 }}>
          Live sensor · Updated:{" "}
          {lastUpdate ? format(new Date(lastUpdate), "HH:mm") : "--"}
        </div>

        {/* Tank level */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginTop: 18,
            padding: "22px 22px",
            borderRadius: 16,
            background: `linear-gradient(135deg, ${color}2e, ${color}0f)`,
            border: `1px solid ${color}66`,
          }}
        >
          <div style={{ alignSelf: "flex-start", marginBottom: 6 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: LABEL,
                marginBottom: 12,
              }}
            >
              Tank level
            </div>
            <TankIcon level={level} color={color} width={100} height={170} ticks />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                lineHeight: 1,
                color: tank.hasData ? color : "#64748b",
              }}
            >
              {tank.hasData ? `${Math.round(level)}%` : "--"}
            </div>
            <div style={{ marginTop: 14, fontSize: 14, color: LABEL }}>
              ≈ {left < 10 ? left.toFixed(1) : left.toFixed(0)} m³ left of{" "}
              {tank.capacity} m³
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: LABEL }}>
              Raw:{" "}
              <span style={{ color: "var(--foreground, #fff)" }}>
                {tank.rawDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginTop: 14,
          }}
        >
          <StatBox
            label="Used · last 24h"
            value={`${tank.waterUsed24h.toFixed(1)} m³`}
            accent="#38bdf8"
          />
          {tank.showRefills ? (
            <StatBox label="Refills · last 24h" value={`${tank.refills}`} />
          ) : (
            <StatBox
              label={tank.usageMethod === "flow" ? "Times refilled · 24h" : "Share of capacity"}
              value={
                tank.usageMethod === "flow"
                  ? `${(tank.capacity > 0 ? tank.waterUsed24h / tank.capacity : 0).toFixed(1)}×`
                  : `${shareOfCapacity.toFixed(1)}%`
              }
            />
          )}
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: LABEL }}>{methodText}</div>

        {/* Level history */}
        <div
          style={{
            marginTop: 14,
            padding: "16px 12px 10px 16px",
            borderRadius: 14,
            background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: LABEL,
              marginBottom: 10,
            }}
          >
            Level history · last 24h
          </div>

          {chartData.length < 2 ? (
            <div style={{ padding: "40px 8px", textAlign: "center", fontSize: 13, color: LABEL }}>
              Collecting data. The history builds up while this page is open.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={chartData}
                margin={{ top: 6, right: 16, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="ts"
                  type="number"
                  scale="time"
                  domain={[start, end]}
                  ticks={ticks}
                  tickFormatter={(v) => format(new Date(v), "HH:mm")}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                />
                <YAxis
                  domain={[yMin, yMax]}
                  allowDecimals={false}
                  tickCount={4}
                  tickFormatter={(v) => `${Math.round(v)}%`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  width={40}
                />
                <Tooltip
                  labelFormatter={(v) => format(new Date(v), "HH:mm:ss")}
                  formatter={(v) => [`${v}%`, "Level"]}
                  contentStyle={{
                    background: "#0b1220",
                    border: "1px solid rgba(148,163,184,0.25)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={chartData.length <= 12 ? { r: 3, fill: "#06b6d4" } : false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {spanLabel && chartData.length >= 2 && (
            <div style={{ marginTop: 6, fontSize: 11, color: LABEL }}>
              Showing the last {spanLabel} of data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   FEED TANK MANAGEMENT
   ============================================================ */

export function FeedTankManagement() {
  const { sensorData, getValue, getHistory, lastUpdate } = useData();

  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Escape closes the detail view
  useEffect(() => {
    if (!selectedId) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  /* ---------- Feed tank (Tank A) ---------- */
  // RAW transmitter is the single source of truth (same as Dashboard).
  const rawTankValue = getValue("RO5-FeedTankLevelRaw");
  const rawTankNum =
    typeof rawTankValue === "number" ? rawTankValue : parseFloat(rawTankValue);
  const tankALevelPct = Number.isFinite(rawTankNum)
    ? clampPct(rawToPercent(rawTankNum))
    : null;
  const tankARawText = Number.isFinite(rawTankNum) ? rawTankNum.toFixed(3) : "--";

  /* ---------- Flush tank (Tank B) ---------- */
  // getValue() turns a missing tag into 0, so read sensorData directly
  const flushRawValue = sensorData?.["RO5-FlushTank"]?.value;
  const flushRawNum =
    typeof flushRawValue === "number"
      ? flushRawValue
      : parseFloat(flushRawValue);
  const tankBLevelPct = Number.isFinite(flushRawNum)
    ? clampPct(flushRawToPercent(flushRawNum))
    : null;
  const tankBRawText = Number.isFinite(flushRawNum) ? flushRawNum.toFixed(1) : "--";

  /* ---------- History ---------- */
  const liveFeedHistory = getHistory("RO5-FeedTankLevelRaw");
  const liveFlushHistory = getHistory("RO5-FlushTank");
  // Stored readings from the database + live ones, so the 24h views survive a page refresh
  const feedHistory = useMergedHistory("RO5-FeedTankLevelRaw", liveFeedHistory);
  const flushHistory = useMergedHistory("RO5-FlushTank", liveFlushHistory);
  // Feed flow (m³/h) = water leaving the feed tank; used for the real 24h volume
  const feedFlowHistory = useMergedHistory("RO5-FEEDFlow", getHistory("RO5-FEEDFlow"));
  const usageApi = useTankUsage();
  const feedCap = Number(usageApi?.capacities?.feed) || 300;
  const flushCap = Number(usageApi?.capacities?.flush) || 2;

  /* ---------- Tank definitions ---------- */
  const feedTanks = useMemo(() => {
    const build = (
      id,
      name,
      capacity,
      levelPct,
      history,
      toPercent,
      rawDisplay,
      opts = {}
    ) => {
      const hasData = levelPct !== null;
      const level = hasData ? levelPct : 0;
      const levelPoints = toLevelPoints(history, toPercent);
      const levelUsage = computeWaterUsed(levelPoints, capacity);
      // Feed tank: real flow x time when flow history exists, else level drop.
      const flow = opts.flowHistory ? computeFlowVolume(opts.flowHistory) : null;
      const useFlow = Boolean(flow && flow.ok);
      let usage = useFlow ? flow : levelUsage;
      let method = useFlow ? "flow" : "level";
      let refills = countRefills(levelPoints);
      // The server works on every stored reading (no averaging), so prefer its figure.
      const srv = opts.server;
      if (srv && srv.points > 1) {
        usage = { used: srv.used, spanHours: srv.spanHours };
        method = opts.serverMethod;
        if (Number.isFinite(srv.refills)) refills = srv.refills;
      }
      return {
        id,
        name,
        capacity,
        hasData,
        level,
        volume: (level / 100) * capacity,
        status: getStatus(level, hasData),
        rawDisplay,
        levelPoints,
        waterUsed24h: usage.used,
        spanHours: usage.spanHours,
        usageMethod: method,
        refills,
        showRefills: Boolean(opts.showRefills),
      };
    };

    return [
      build(
        "FT-A",
        "Main Feed Tank A",
        feedCap,
        tankALevelPct,
        feedHistory,
        (v) => {
          const n = Number(v);
          return Number.isFinite(n) ? clampPct(rawToPercent(n)) : null;
        },
        tankARawText,
        { flowHistory: feedFlowHistory, server: usageApi?.feed, serverMethod: "flow" }
      ),
      build(
        "FT-B",
        "Flush Tank",
        flushCap,
        tankBLevelPct,
        flushHistory,
        (v) => clampPct(flushRawToPercent(v)),
        tankBRawText,
        { showRefills: true, server: usageApi?.flush, serverMethod: "level" }
      ),
    ];
  }, [
    tankALevelPct,
    tankBLevelPct,
    feedHistory,
    flushHistory,
    tankARawText,
    tankBRawText,
    feedFlowHistory,
    usageApi,
    feedCap,
    flushCap,
  ]);

  const filteredTanks = useMemo(
    () =>
      filterStatus === "All"
        ? feedTanks
        : feedTanks.filter((t) => t.status === filterStatus),
    [feedTanks, filterStatus]
  );

  const chartData = useMemo(
    () =>
      filteredTanks.map((t) => ({
        id: t.id,
        used: Math.round(t.waterUsed24h * 10) / 10,
      })),
    [filteredTanks]
  );

  // History lives in memory (500 points, cleared on page refresh), so the
  // chart may cover less than 24h. Tell the user how much it really covers.
  const spanHours = Math.max(0, ...feedTanks.map((t) => t.spanHours));
  const methodNote = filteredTanks
    .map(
      (t) =>
        `${t.id}: ${t.usageMethod === "flow" ? "feed flow × time" : "level drop × capacity"}`
    )
    .join(" · ");

  // Always the live version of the selected tank
  const selectedTank = feedTanks.find((t) => t.id === selectedId) || null;

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div
      className="h-full overflow-auto"
      style={{
        padding: isMobile ? 12 : 20,
        scrollbarWidth: "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Fills the screen height; the chart card takes all leftover space.
          If the screen is too short, the page scrolls instead of squashing. */}
      <div
        style={{
          flex: "1 0 auto",
          width: "100%",
          maxWidth: 1080,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 10 : 14,
        }}
      >
        {/* ---------- Pill filters ---------- */}
        <div
          role="group"
          aria-label="Filter tanks by status"
          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
        >
          {FILTERS.map((f) => {
            const active = filterStatus === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilterStatus(f)}
                aria-pressed={active}
                style={{
                  padding: "7px 16px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: active
                    ? `1px solid ${CYAN}`
                    : `1px solid var(--border, rgba(148,163,184,0.2))`,
                  background: active ? CYAN : CARD_BG,
                  color: active ? "#00141a" : LABEL,
                  boxShadow: active ? `0 0 14px ${CYAN}66` : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* ---------- Tank cards: 2 columns on desktop, 1 on phones ---------- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
            gap: 14,
            alignItems: "stretch",
          }}
        >
          {filteredTanks.map((t) => (
            <TankCard key={t.id} tank={t} onOpen={setSelectedId} isMobile={isMobile} />
          ))}
        </div>

        {filteredTanks.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              borderRadius: 16,
              border: `1px solid ${CARD_BORDER}`,
              color: LABEL,
              fontSize: 13,
            }}
          >
            No tanks with status “{filterStatus}”. Choose All to see every tank.
          </div>
        )}

        {/* ---------- Water used chart ---------- */}
        {filteredTanks.length > 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: isMobile ? 260 : 240,
              padding: isMobile ? 12 : 16,
              borderRadius: 16,
              background: CARD_BG,
              border: `1px solid ${CARD_BORDER}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: LABEL,
                marginBottom: 8,
              }}
            >
              Water used · last 24h
            </div>

            <div style={{ position: "relative", flex: 1, minHeight: isMobile ? 180 : 160 }}>
            <div style={{ position: "absolute", inset: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 28, right: isMobile ? 8 : 24, left: isMobile ? 8 : 24, bottom: 0 }}
                barCategoryGap="30%"
              >
                <XAxis
                  dataKey="id"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 14, fill: "#64748b" }}
                />
                {/* Minimum scale of 1 m³ so a tiny use (e.g. 0.1) does not fill the chart */}
                <YAxis
                  hide
                  domain={[0, (dataMax) => Math.max(dataMax * 1.25, 1)]}
                />
                <Bar
                  dataKey="used"
                  radius={[8, 8, 0, 0]}
                  minPointSize={2}
                  barSize={isMobile ? 56 : 90}
                  isAnimationActive={false}
                >
                  {chartData.map((d) => (
                    <Cell
                      key={d.id}
                      fill={CYAN}
                      style={{ filter: `drop-shadow(0 0 8px ${CYAN}99)` }}
                    />
                  ))}
                  <LabelList
                    dataKey="used"
                    position="top"
                    formatter={(v) => `${Number(v).toFixed(1)} m³`}
                    style={{ fill: "#fff", fontSize: isMobile ? 12 : 14 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: LABEL }}>
              {methodNote}
              {spanHours < 23.5 &&
                ` · based on the last ${spanHours.toFixed(1)}h of data available`}
            </div>
          </div>
        )}
      </div>

      {/* ---------- Detail view ---------- */}
      {selectedTank && (
        <TankDetail
          tank={selectedTank}
          lastUpdate={lastUpdate}
          isMobile={isMobile}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

export default FeedTankManagement;