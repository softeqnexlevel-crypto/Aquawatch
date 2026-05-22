import { useState, useEffect, useRef } from "react";

const stations = [
  {
    name: "Intake A — Nairobi River",
    type: "Intake",
    status: "Normal",
    prefilterDP: 0.42,
    stage1DP: 1.15,
    stage2DP: 0.88,
    antiscalantRate: 3.2,
    systemRecovery: 78,
    antiscalantPerDay: 19.2,
    dpHistory: [0.38, 0.40, 0.42, 0.41, 0.43, 0.44, 0.42, 0.45, 0.43, 0.42, 0.44, 0.42],
    stage1History: [1.10, 1.12, 1.14, 1.13, 1.15, 1.16, 1.15, 1.17, 1.14, 1.15, 1.16, 1.15],
    stage2History: [0.82, 0.84, 0.86, 0.85, 0.87, 0.88, 0.87, 0.89, 0.86, 0.88, 0.87, 0.88],
    recoveryHistory: [76, 77, 78, 78, 79, 78, 77, 78, 79, 78, 78, 78],
  },
  {
    name: "Treatment Plant 1",
    type: "Treatment",
    status: "Warning",
    prefilterDP: 0.91,
    stage1DP: 1.82,
    stage2DP: 1.45,
    antiscalantRate: 4.1,
    systemRecovery: 71,
    antiscalantPerDay: 24.6,
    dpHistory: [0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.84, 0.87, 0.89, 0.90, 0.91, 0.91],
    stage1History: [1.20, 1.30, 1.40, 1.50, 1.58, 1.65, 1.70, 1.74, 1.78, 1.80, 1.82, 1.82],
    stage2History: [0.90, 1.00, 1.10, 1.18, 1.25, 1.32, 1.37, 1.40, 1.42, 1.44, 1.45, 1.45],
    recoveryHistory: [75, 74, 74, 73, 73, 72, 72, 72, 71, 71, 71, 71],
  },
  {
    name: "Reservoir Westside",
    type: "Reservoir",
    status: "Critical",
    prefilterDP: 1.38,
    stage1DP: 2.54,
    stage2DP: 2.11,
    antiscalantRate: 5.8,
    systemRecovery: 62,
    antiscalantPerDay: 34.8,
    dpHistory: [0.60, 0.72, 0.84, 0.96, 1.04, 1.12, 1.20, 1.26, 1.30, 1.34, 1.36, 1.38],
    stage1History: [1.40, 1.60, 1.78, 1.92, 2.04, 2.14, 2.22, 2.34, 2.42, 2.48, 2.52, 2.54],
    stage2History: [0.95, 1.10, 1.28, 1.44, 1.56, 1.68, 1.78, 1.88, 1.96, 2.04, 2.08, 2.11],
    recoveryHistory: [74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 63, 62],
  },
];

const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];

const dpStatus = (v, warn, crit) => v >= crit ? "Critical" : v >= warn ? "Warning" : "Normal";
const recoveryStatus = (v) => v < 65 ? "Critical" : v < 72 ? "Warning" : "Normal";

const STATUS_STYLES = {
  Normal: {
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    text: "text-emerald-400",
    pulse: "",
  },
  Warning: {
    dot: "bg-amber-400 animate-pulse",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    text: "text-amber-400",
    pulse: "animate-pulse",
  },
  Critical: {
    dot: "bg-red-500 animate-ping",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    text: "text-red-400",
    pulse: "",
  },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Normal;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
}

function MetricCard({ label, value, unit, status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Normal;
  return (
    <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-4 flex flex-col gap-2">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold font-mono tracking-tight ${s.text}`}>{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

function ProjectionCard({ label, value, unit }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/40 rounded-lg p-3 flex-1 min-w-[100px]">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold font-mono text-slate-200">{value.toLocaleString()}</span>
        <span className="text-[10px] text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

/* ─── Tiny canvas line chart ─────────────────────────────────────── */
function LineChart({ datasets, labels, yMin, yMax, height = 160 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 12, right: 12, bottom: 28, left: 36 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const allVals = datasets.flatMap((d) => d.data);
    const lo = yMin ?? Math.min(...allVals) * 0.95;
    const hi = yMax ?? Math.max(...allVals) * 1.05;

    const xScale = (i) => pad.left + (i / (labels.length - 1)) * plotW;
    const yScale = (v) => pad.top + plotH - ((v - lo) / (hi - lo)) * plotH;

    // grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
    }

    // x-axis labels
    ctx.fillStyle = "rgba(148,163,184,0.6)";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    labels.forEach((l, i) => {
      if (i % 2 === 0 || i === labels.length - 1)
        ctx.fillText(l, xScale(i), H - 6);
    });

    // y-axis labels
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const v = lo + ((hi - lo) * (4 - i)) / 4;
      ctx.fillText(v.toFixed(2), pad.left - 4, pad.top + (i / 4) * plotH + 3);
    }

    // lines
    datasets.forEach(({ data, color, dash = [] }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(dash);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      data.forEach((v, i) => {
        i === 0 ? ctx.moveTo(xScale(i), yScale(v)) : ctx.lineTo(xScale(i), yScale(v));
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // dots
      data.forEach((v, i) => {
        ctx.beginPath();
        ctx.arc(xScale(i), yScale(v), 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    });
  }, [datasets, labels, yMin, yMax, height]);

  return <canvas ref={canvasRef} style={{ width: "100%", height }} className="block" />;
}

/* ─── Tiny canvas bar chart ──────────────────────────────────────── */
function BarChart({ data, labels, color = "#378ADD", height = 140 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 12, right: 8, bottom: 28, left: 44 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const lo = 0;
    const hi = Math.max(...data) * 1.1;
    const barW = plotW / data.length;

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
    }

    // y labels
    ctx.fillStyle = "rgba(148,163,184,0.6)";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const v = hi * (1 - i / 4);
      ctx.fillText(Math.round(v), pad.left - 4, pad.top + (i / 4) * plotH + 3);
    }

    // bars
    data.forEach((v, i) => {
      const barH = ((v - lo) / (hi - lo)) * plotH;
      const x = pad.left + i * barW + barW * 0.15;
      const y = pad.top + plotH - barH;
      ctx.fillStyle = color + "99";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, barW * 0.7, barH, [3, 3, 0, 0]);
      ctx.fill();
      ctx.stroke();
    });

    // x labels
    ctx.fillStyle = "rgba(148,163,184,0.6)";
    ctx.textAlign = "center";
    labels.forEach((l, i) => {
      if (i % 2 === 0 || i === labels.length - 1)
        ctx.fillText(l, pad.left + i * barW + barW / 2, H - 6);
    });
  }, [data, labels, color, height]);

  return <canvas ref={canvasRef} style={{ width: "100%", height }} className="block" />;
}

/* ─── Station Panel ──────────────────────────────────────────────── */
function StationPanel({ st }) {
  const pfS = dpStatus(st.prefilterDP, 0.7, 1.1);
  const s1S = dpStatus(st.stage1DP, 1.5, 2.2);
  const s2S = dpStatus(st.stage2DP, 1.2, 1.8);
  const recS = recoveryStatus(st.systemRecovery);

  const perMonth = +(st.antiscalantPerDay * 30).toFixed(0);
  const perYear = +(st.antiscalantPerDay * 365).toFixed(0);
  const projMonth = +(perMonth * 1.03).toFixed(0);
  const projYear = +(perYear * 1.04).toFixed(0);

  const antMonthly = MONTHS.map((_, i) =>
    +(st.antiscalantPerDay * 30 * (1 + i * 0.005)).toFixed(0)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="Prefilter ΔP" value={st.prefilterDP.toFixed(2)} unit="bar" status={pfS} />
        <MetricCard label="1st Stage ΔP" value={st.stage1DP.toFixed(2)} unit="bar" status={s1S} />
        <MetricCard label="2nd Stage ΔP" value={st.stage2DP.toFixed(2)} unit="bar" status={s2S} />
        <MetricCard label="Antiscalant dose" value={st.antiscalantRate.toFixed(1)} unit="mg/L" status="Normal" />
        <MetricCard label="System recovery" value={`${st.systemRecovery}%`} unit="" status={recS} />
      </div>

      {/* Antiscalant consumption */}
      <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Antiscalant consumption
        </p>
        <div className="flex gap-3 flex-wrap">
          <ProjectionCard label="Per day" value={+st.antiscalantPerDay.toFixed(1)} unit="L/day" />
          <ProjectionCard label="Per month" value={perMonth} unit="L" />
          <ProjectionCard label="Per year" value={perYear} unit="L" />
          <ProjectionCard label="Proj. next month" value={projMonth} unit="L" />
          <ProjectionCard label="Proj. next year" value={projYear} unit="L" />
        </div>
      </div>

      {/* ΔP trend chart */}
      <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Differential pressure trend — 12 months
        </p>
        <div className="flex gap-4 flex-wrap mb-3">
          {[
            { label: "Prefilter ΔP", color: "#378ADD", dash: [] },
            { label: "1st stage ΔP", color: "#1D9E75", dash: [4, 3] },
            { label: "2nd stage ΔP", color: "#BA7517", dash: [2, 3] },
          ].map(({ label, color, dash }) => (
            <span key={label} className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <svg width="22" height="10" aria-hidden="true">
                <line
                  x1="0" y1="5" x2="22" y2="5"
                  stroke={color} strokeWidth="2"
                  strokeDasharray={dash.join(",")}
                  strokeLinecap="round"
                />
              </svg>
              {label}
            </span>
          ))}
        </div>
        <LineChart
          datasets={[
            { data: st.dpHistory, color: "#378ADD", dash: [] },
            { data: st.stage1History, color: "#1D9E75", dash: [4, 3] },
            { data: st.stage2History, color: "#BA7517", dash: [2, 3] },
          ]}
          labels={MONTHS}
          height={180}
        />
      </div>

      {/* Recovery trend */}
      <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          System recovery — 12 months
        </p>
        <LineChart
          datasets={[{ data: st.recoveryHistory, color: "#7F77DD" }]}
          labels={MONTHS}
          yMin={55}
          yMax={85}
          height={160}
        />
      </div>

      {/* Antiscalant bar chart */}
      <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Antiscalant consumption — monthly estimate (L)
        </p>
        <BarChart data={antMonthly} labels={MONTHS} color="#378ADD" height={160} />
      </div>
    </div>
  );
}

/* ─── Root component ─────────────────────────────────────────────── */
export default function StationShowcase() {
  const [active, setActive] = useState(0);

  const featureList = [
    "Grid, list or interactive map view",
    "Inline threshold editing with WHO presets",
    "Per-station drill-down with 12-month history",
    "Offline heartbeat detection & auto-alert",
  ];

  return (
    <section className="w-full bg-[#0A0F1D] text-slate-200 py-12 md:py-20 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-12">
          <div className="lg:col-span-5 flex flex-col items-start text-left space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Station Management
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Every station, every reading,<br />instantly
            </h2>
            <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
              Add a station in 60 seconds. Configure thresholds per parameter. Get status at a glance — and drill into full history for any node.
            </p>
            <div className="w-full space-y-3 pt-2">
              {featureList.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  </div>
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Station selector cards */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {stations.map((st, i) => {
              const theme = STATUS_STYLES[st.status];
              const isActive = i === active;
              return (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                    isActive
                      ? "bg-slate-800/80 border-slate-600/60 shadow-lg"
                      : "bg-[#0E1626] border-slate-800/80 hover:border-slate-700/60 hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${theme.dot}`} />
                      <div>
                        <p className="font-bold text-sm text-white">{st.name}</p>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">{st.type}</p>
                      </div>
                    </div>
                    <StatusBadge status={st.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active station detail ── */}
        <div className="border-t border-slate-800/60 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <span className={`w-3 h-3 rounded-full ${STATUS_STYLES[stations[active].status].dot}`} />
            <h3 className="text-lg font-bold text-white">{stations[active].name}</h3>
            <span className="text-xs text-slate-500 uppercase tracking-wider">{stations[active].type}</span>
            <StatusBadge status={stations[active].status} />
          </div>
          <StationPanel st={stations[active]} />
        </div>

      </div>
    </section>
  );
}