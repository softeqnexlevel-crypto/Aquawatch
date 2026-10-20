// components/ProductionMonitoring.jsx — Today / Week / Month / Year production view
import React, { useState, useEffect, useCallback } from "react";
import { Droplets, Recycle } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { API_BASE_URL } from "../config";

const CYAN = "#00e5ff";
const LIME = "#b8ff00";
const AMBER = "#ffb938";
const RED = "#ff3355";

const PERIODS = [
  ["today", "Today"],
  ["week", "Week"],
  ["month", "Month"],
  ["year", "Year"],
];
const THIS = { today: "today", week: "this week", month: "this month", year: "this year" };
const PER = { today: "m³ per hour", week: "m³ per day", month: "m³ per day", year: "m³ per month" };

const card = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20 };

function paceStatus(actual, target, frac) {
  const expected = target * frac;
  if (expected <= 0) return { text: "ON PACE", color: LIME };
  const r = actual / expected;
  if (r >= 0.9) return { text: "ON PACE", color: LIME };
  if (r >= 0.5) return { text: "SLIGHTLY BEHIND", color: AMBER };
  return { text: "BEHIND", color: RED };
}

const fmtNum = (n) => (n >= 100 ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, ""));

function Kpi({ icon: Icon, label, value, unit, iconColor }) {
  const has = value !== null && value !== undefined && Number.isFinite(value);
  return (
    <div style={{ ...card, borderLeft: `4px solid ${CYAN}`, borderRadius: 18, padding: "14px 16px", boxShadow: "0 0 18px rgba(0,229,255,0.08)" }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(0,229,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <Icon size={17} color={iconColor || CYAN} />
      </div>
      <div style={{ fontSize: 14, color: "var(--muted-foreground)" }}>{label}</div>
      <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: CYAN, lineHeight: 1 }}>{has ? value.toFixed(1) : "—"}</span>
        <span style={{ fontSize: 13, color: "var(--muted-foreground)", fontWeight: 700 }}>{unit}</span>
      </div>
    </div>
  );
}

function BarChart({ buckets, isMobile }) {
  const max = Math.max(1, ...buckets.map((b) => b.value));
  const many = buckets.length > 12;
  const labelStep = isMobile && buckets.length > 24 ? 3 : isMobile && many ? 2 : 1;
  const H = isMobile ? 220 : 300;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: many ? (isMobile ? 2 : 4) : 12, height: H + 54, padding: "0 4px" }}>
      {buckets.map((b, i) => {
        const h = b.value > 0 ? Math.max(8, (b.value / max) * H) : 0;
        const showVal = !isMobile || !many || b.value > 0;
        return (
          <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
            {showVal && (
              <div style={{ fontSize: many ? (isMobile ? 9 : 14) : 18, color: "#ffffff", marginBottom: 6, whiteSpace: "nowrap" }}>{fmtNum(b.value)}</div>
            )}
            {b.value > 0 ? (
              <div style={{ width: many ? "62%" : "64%", maxWidth: 110, height: h, background: CYAN, borderRadius: many ? 8 : 10, boxShadow: "0 0 16px rgba(0,229,255,0.55)" }} />
            ) : (
              <div style={{ width: many ? "70%" : "64%", maxWidth: 110, height: 4, background: CYAN, borderRadius: 4, boxShadow: "0 0 10px rgba(0,229,255,0.6)" }} />
            )}
            <div style={{ fontSize: many ? (isMobile ? 10 : 16) : 20, color: "var(--muted-foreground)", marginTop: 10, height: 26, visibility: i % labelStep === 0 ? "visible" : "hidden" }}>{b.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export function ProductionMonitoring() {
  const { getValue, sensorData } = useData();
  const [period, setPeriod] = useState("week");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const load = useCallback(async (p) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/production-breakdown?period=${p}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.status === 401) throw new Error("Session expired - please sign in again");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setErr("");
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    setData(null);
    load(period);
    const t = setInterval(() => load(period), 60000);
    return () => clearInterval(t);
  }, [period, load]);

  const num = (tag) => {
    const v = sensorData?.[tag]?.value;
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const flowNow = num("RO5-Permeateflow");
  const recovery = num("RO5-SystemRecovery");
  const feedFlow = num("RO5-FEEDFlow");

  const total = data?.total ?? 0;
  const target = data?.target ?? 0;
  const pct = target > 0 ? (total / target) * 100 : 0;
  const status = data ? paceStatus(total, target, data.elapsedFraction) : null;
  const toGo = Math.max(0, target - total);
  const dLeft = data?.daysLeft ?? 0;

  return (
    <div className="overflow-auto h-full" style={{ padding: isMobile ? "4px 4px 24px" : "4px 4px 40px" }}>
      <div style={{ maxWidth: 1080, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* period pills */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: isMobile ? 6 : 12 }}>
          {PERIODS.map(([id, label]) => {
            const on = period === id;
            return (
              <button key={id} onClick={() => setPeriod(id)} style={{
                padding: isMobile ? "12px 0" : "15px 0", borderRadius: 999, cursor: "pointer", fontWeight: 800, fontSize: isMobile ? 12 : 14, letterSpacing: "0.04em",
                background: on ? CYAN : "var(--secondary)", color: on ? "#00131a" : "var(--foreground)",
                border: `1px solid ${on ? CYAN : "var(--border)"}`, boxShadow: on ? "0 0 16px rgba(0,229,255,0.55)" : "none",
              }}>{label}</button>
            );
          })}
        </div>

        {err && <div style={{ ...card, padding: 12, color: RED, fontSize: 13, borderColor: "#ff335544" }}>Couldn't load production totals ({err}).</div>}

        {/* progress */}
        <div style={{ ...card, padding: isMobile ? 14 : 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 14, color: "var(--muted-foreground)" }}>Produced {THIS[period]}</div>
            {status && (
              <span style={{ fontSize: 12, fontWeight: 800, color: status.color, border: `1px solid ${status.color}88`, background: `${status.color}1f`, borderRadius: 999, padding: "5px 14px", whiteSpace: "nowrap" }}>{status.text}</span>
            )}
          </div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: isMobile ? 32 : 38, fontWeight: 800, color: CYAN, lineHeight: 1 }}>{data ? Math.round(total) : "—"}</span>
            <span style={{ fontSize: 14, color: "var(--muted-foreground)", fontWeight: 700 }}>m³ of {data ? Math.round(target) : "—"} target</span>
          </div>
          <div style={{ position: "relative", height: 10, borderRadius: 999, background: "#18233d", margin: "14px 0 10px" }}>
            <div style={{ width: `${Math.min(100, pct)}%`, minWidth: total > 0 ? 10 : 0, height: "100%", borderRadius: 999, background: CYAN, boxShadow: "0 0 12px rgba(0,229,255,0.7)" }} />
            {data && <div style={{ position: "absolute", top: -4, left: `${data.elapsedFraction * 100}%`, width: 3, height: 18, background: "#ffffff", borderRadius: 2 }} />}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted-foreground)", gap: 8 }}>
            <span>{data ? Math.round(pct) : 0}% of target</span>
            <span>Marker = expected pace</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted-foreground)" }}>
            {data ? `${Math.round(toGo)} m³ to go · ${dLeft} day${dLeft === 1 ? "" : "s"} left` : "Loading…"}
          </div>
        </div>

        {/* kpis */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(3, 1fr)", gap: isMobile ? 8 : 12 }}>
          <Kpi icon={Droplets} label="Flow now" value={flowNow} unit="m³/h" iconColor="#7fb8ff" />
          <Kpi icon={Recycle} label="Recovery" value={recovery} unit="%" />
          <Kpi icon={Droplets} label="Feed flow" value={feedFlow} unit="m³/h" iconColor="#7fb8ff" />
        </div>

        {/* chart */}
        <div style={{ ...card, padding: isMobile ? 12 : 18 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.18em", color: "var(--muted-foreground)", marginBottom: 14 }}>
            PRODUCTION <span style={{ fontSize: 10.5, letterSpacing: "0.02em", marginLeft: 6 }}>{PER[period]}</span>
          </div>
          {data ? <BarChart buckets={data.buckets} isMobile={isMobile} /> : <div style={{ height: 260, color: "var(--muted-foreground)", fontSize: 13 }}>Loading…</div>}
        </div>
      </div>
    </div>
  );
}

export default ProductionMonitoring;