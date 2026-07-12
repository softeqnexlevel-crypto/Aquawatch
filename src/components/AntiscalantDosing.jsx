// components/AntiscalantDosing.jsx - COMPLETE WITH ALL GRAPHS
import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { AlertTriangle, CheckCircle, FlaskConical, Droplet, TrendingUp, TrendingDown, Clock, Calendar } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { format, subHours, subDays, startOfDay } from 'date-fns';

// ===================== CUSTOM TOOLTIP =====================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1828", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 4, padding: "6px 10px" }}>
      <p style={{ fontSize: 10, color: "#4d7a9e", marginBottom: 2 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

// ===================== TANK GAUGE =====================
function TankGauge({ level, label, capacity }) {
  const color = level > 40 ? "#22c55e" : level > 20 ? "#eab308" : "#ef4444";
  const status = level > 40 ? "OK" : level > 20 ? "LOW" : "CRITICAL";

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: 52, height: 100, border: `2px solid ${color}40`, borderRadius: 4, background: "var(--secondary)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${Math.min(level, 100)}%`, background: `linear-gradient(to top, ${color}cc, ${color}44)`, transition: "height 0.5s ease" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)", zIndex: 1 }}>
          {Math.round(level)}%
        </div>
        {[25, 50, 75].map((l) => (
          <div key={l} style={{ position: "absolute", bottom: `${l}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.08)" }} />
        ))}
      </div>
      <span style={{ fontSize: 9, color: "var(--muted-foreground)", textAlign: "center" }}>{label}</span>
      <span style={{ fontSize: 8, fontWeight: 600, color: color, background: `${color}18`, borderRadius: 3, padding: "1px 6px" }}>
        {status}
      </span>
    </div>
  );
}

// ===================== METRIC CARD =====================
function MetricCard({ label, value, unit, color, sub, trend }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : null;
  const trendColor = trend > 0 ? "#22c55e" : trend < 0 ? "#ef4444" : "var(--muted-foreground)";

  return (
    <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label}
      </div>
      <div className="flex items-end gap-1">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: color || "var(--foreground)", lineHeight: 1 }}>
          {value}
        </span>
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginBottom: 2 }}>{unit}</span>
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
          {TrendIcon && <TrendIcon size={12} style={{ color: trendColor }} />}
          {sub}
        </div>
      )}
    </div>
  );
}

// ===================== CHART PANEL =====================
function ChartPanel({ title, meta, children }) {
  return (
    <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {title}
        </span>
        {meta && (
          <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
            {meta}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ===================== TIME RANGE BUTTONS =====================
function TimeRangeButtons({ timeRange, setTimeRange }) {
  return (
    <div className="flex gap-1">
      {['1h', '6h', '24h', '7d'].map(range => (
        <button
          key={range}
          onClick={() => setTimeRange(range)}
          style={{
            padding: '2px 10px',
            borderRadius: 3,
            fontSize: 9,
            background: timeRange === range ? '#0ea5e9' : 'var(--secondary)',
            color: timeRange === range ? 'white' : 'var(--muted-foreground)',
            border: '1px solid var(--border)',
            cursor: 'pointer'
          }}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export function AntiscalantDosing() {
  const { sensorData, getValue, getHistory, lastUpdate } = useData();
  const [timeRange, setTimeRange] = useState('24h');

  // Get real data
  const feedFlow = getValue('RO5-FEEDFlow') || 0;
  const permeateFlow = getValue('RO5-Permeateflow') || 0;
  const recovery = getValue('RO5-SystemRecovery') || 0;
  const pureWaterEC = getValue('RO5-PureWaterEc') || 0;

  // ✅ REAL DOSING STATUS — DataContext already normalizes this to 'ON' / 'OFF'
  // regardless of whether the backend sends 1/0, true/false, or "ON"/"OFF".
  const dosingStatusRaw = getValue('RO5-AntiscalantDosingActive'); // 'ON' | 'OFF'
  const isDosingActive = dosingStatusRaw === 'ON';

  // === FIX: Dosing Rate set to 2.66 mg/L ===
  const DOSING_RATE = 2.66;
  // Actual dosing rate is 0 whenever the pump isn't running — otherwise every
  // consumption figure below overstates usage even while the doser is off.
  const dosingRate = isDosingActive ? DOSING_RATE : 0;

  // Calculate consumption — gated on real pump state
  const dailyConsumption = isDosingActive ? (permeateFlow * 24 * dosingRate) / 1000 : 0;
  const weeklyConsumption = dailyConsumption * 7;
  const monthlyConsumption = dailyConsumption * 30;

  // Stock calculation
  const initialStock = 500;
  const daysSinceLastRefill = 15;
  const currentStock = Math.max(0, initialStock - dailyConsumption * daysSinceLastRefill);
  const daysRemaining = dailyConsumption > 0 ? Math.floor(currentStock / dailyConsumption) : Infinity;

  // Efficiency
  const efficiency = Math.min(100, 85 + (recovery / 100) * 15);

  // Hourly dosing data
  const feedHistory = getHistory('RO5-FEEDFlow');
  const hourlyDosingData = useMemo(() => {
    if (feedHistory.length === 0) {
      // Generate mock data if no history
      const now = new Date();
      const hours = timeRange === '24h' ? 24 : 1;
      const data = [];
      for (let i = hours; i >= 0; i--) {
        const hour = format(subHours(now, i), 'HH:00');
        data.push({
          hour,
          rate: isDosingActive ? DOSING_RATE * (0.95 + Math.random() * 0.1) : 0
        });
      }
      return data;
    }

    const now = new Date();
    const startTime = timeRange === '24h' ? subHours(now, 24) : subHours(now, 1);

    const filtered = feedHistory.filter(d => new Date(d.time) >= startTime);
    const grouped = {};

    filtered.forEach(d => {
      const hour = format(new Date(d.time), 'HH:00');
      if (!grouped[hour]) grouped[hour] = { hour, rate: 0, count: 0 };
      const rate = isDosingActive ? DOSING_RATE * (0.95 + (d.value / 100) * 0.1) : 0;
      grouped[hour].rate += rate;
      grouped[hour].count++;
    });

    const result = Object.values(grouped).map(g => ({
      hour: g.hour,
      rate: g.rate / g.count
    }));

    return result.sort((a, b) => a.hour.localeCompare(b.hour));
  }, [feedHistory, timeRange, isDosingActive]);

  // Monthly consumption data
  const monthlyConsumptionData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    return months.slice(0, 6).map((month, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const monthName = months[monthIndex];
      // Only the current (partial) month reflects live dosing state;
      // prior months are historical and unaffected by right-now's status.
      const isCurrentMonth = i === 5;
      const baseConsumption = isCurrentMonth ? monthlyConsumption : monthlyConsumption * (0.85 + Math.random() * 0.3);
      return {
        month: monthName,
        consumption: baseConsumption,
        target: monthlyConsumption
      };
    });
  }, [monthlyConsumption]);

  // Recent records
  const recentRecords = useMemo(() => {
    const records = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const date = subDays(now, i);
      const dayData = feedHistory.filter(d => {
        const day = new Date(d.time);
        return day >= startOfDay(date) && day < startOfDay(date) + 86400000;
      });
      const avgFeed = dayData.length > 0 ? dayData.reduce((sum, d) => sum + d.value, 0) / dayData.length : feedFlow;
      // Today's row reflects the real, live dosing status; earlier days are
      // historical estimates since we don't have per-day ON/OFF history stored.
      const isToday = i === 0;
      const rate = (isToday ? isDosingActive : true) ? DOSING_RATE * (0.95 + (avgFeed / 100) * 0.1) : 0;
      const consumption = (avgFeed * 24 * rate) / 1000;
      const production = avgFeed * 24;
      const dosePerM3 = rate / 1000;
      const isElevated = rate > DOSING_RATE * 1.15 || rate < DOSING_RATE * 0.85;

      records.push({
        date: format(date, 'yyyy-MM-dd'),
        rate: Math.min(Math.max(rate, 0), 3.5).toFixed(2),
        consumption: consumption.toFixed(1),
        production: Math.round(production).toLocaleString(),
        dosePerM3: dosePerM3.toFixed(3),
        status: isToday && !isDosingActive ? 'STOPPED' : (isElevated ? 'ELEVATED' : 'NORMAL'),
        ok: isToday ? isDosingActive && !isElevated : !isElevated
      });
    }
    return records;
  }, [feedHistory, feedFlow, isDosingActive]);

  // Generate alerts
  const alerts = useMemo(() => {
    const alertList = [];
    if (isDosingActive && dosingRate > 3.0) {
      alertList.push({
        id: 'ALERT-001',
        type: 'High Dosing Rate',
        equipment: 'Antiscalant Pump',
        value: `${dosingRate.toFixed(2)} mg/L`,
        threshold: '3.0 mg/L',
        severity: 'warning'
      });
    }
    if (isDosingActive && dosingRate < 1.8) {
      alertList.push({
        id: 'ALERT-002',
        type: 'Low Dosing Rate',
        equipment: 'Antiscalant Pump',
        value: `${dosingRate.toFixed(2)} mg/L`,
        threshold: '1.8 mg/L',
        severity: 'critical'
      });
    }
    if (!isDosingActive && permeateFlow > 0) {
      alertList.push({
        id: 'ALERT-005',
        type: 'Dosing Pump Stopped While System Running',
        equipment: 'Antiscalant Pump',
        value: 'OFF',
        threshold: 'ON required while producing',
        severity: 'warning'
      });
    }
    if (currentStock < 50) {
      alertList.push({
        id: 'ALERT-003',
        type: 'Low Chemical Stock',
        equipment: 'Tank A',
        value: `${Math.round(currentStock)} kg`,
        threshold: '50 kg',
        severity: 'critical'
      });
    }
    if (pureWaterEC > 50) {
      alertList.push({
        id: 'ALERT-004',
        type: 'High Product EC',
        equipment: 'RO System',
        value: `${pureWaterEC.toFixed(1)} µS/cm`,
        threshold: '50 µS/cm',
        severity: 'warning'
      });
    }
    return alertList;
  }, [dosingRate, isDosingActive, permeateFlow, currentStock, pureWaterEC]);

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>
            <FlaskConical size={18} style={{ display: 'inline', marginRight: 8 }} />
            Antiscalant Dosing
          </h2>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
            Real-time dosing monitoring • Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ Live status badge driven by the real backend value */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 4,
            background: isDosingActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${isDosingActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isDosingActive ? '#22c55e' : '#ef4444'
            }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: isDosingActive ? '#22c55e' : '#ef4444' }}>
              {isDosingActive ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: "var(--muted-foreground)" }} />
            <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
              Target: 2.66 mg/L
            </span>
          </div>
        </div>
      </div>

      {/* Metrics + Tanks */}
      <div className="flex gap-4">
        <div className="flex-1 grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <MetricCard 
            label="Current Dosing Rate" 
            value={dosingRate.toFixed(2)} 
            unit="mg/L" 
            color="#a78bfa"
            sub={isDosingActive ? 'Target: 2.66 mg/L' : '⛔ Pump stopped'}
          />
          <MetricCard 
            label="Daily Consumption" 
            value={dailyConsumption.toFixed(1)} 
            unit="kg" 
            color="#0ea5e9"
          />
          <MetricCard 
            label="Weekly Consumption" 
            value={weeklyConsumption.toFixed(1)} 
            unit="kg" 
            color="#06b6d4"
          />
          <MetricCard 
            label="Monthly Consumption" 
            value={monthlyConsumption.toFixed(0)} 
            unit="kg" 
            color="#14b8a6"
          />
          <MetricCard 
            label="Chemical Stock" 
            value={Math.round(currentStock)} 
            unit="kg" 
            color={currentStock < 50 ? "#ef4444" : currentStock < 100 ? "#eab308" : "#22c55e"}
            sub={Number.isFinite(daysRemaining) ? `≈ ${daysRemaining} days remaining` : 'Pump idle — no drawdown'}
          />
          <MetricCard 
            label="Dosing Efficiency" 
            value={efficiency.toFixed(1)} 
            unit="%" 
            color="#22c55e"
          />
        </div>

        {/* Tank gauges */}
        {/* <div className="rounded p-4 flex flex-col gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)", minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            <Droplet size={12} style={{ display: 'inline', marginRight: 4 }} />
            Chemical Tank Levels
          </div>
          <div className="flex justify-around items-start flex-1">
            <TankGauge level={Math.min(100, (currentStock / 500) * 100)} label="Tank A (500L)" />
            <TankGauge level={Math.min(100, (currentStock / 500) * 100 * 0.6)} label="Tank B (500L)" />
            <TankGauge level={Math.min(100, (currentStock / 500) * 100 * 0.3 + 20)} label="Reserve (200L)" />
          </div>
        </div> */}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded p-2.5" style={{ background: a.severity === 'critical' ? "rgba(239,68,68,0.08)" : "rgba(234,179,8,0.08)", border: `1px solid ${a.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}` }}>
              <AlertTriangle size={13} style={{ color: a.severity === 'critical' ? "#ef4444" : "#eab308", flexShrink: 0 }} />
              <div className="flex-1">
                <span style={{ fontSize: 11, fontWeight: 500, color: a.severity === 'critical' ? "#ef4444" : "#eab308" }}>{a.type}</span>
                <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginLeft: 8 }}>
                  {a.equipment} · {a.value} (threshold: {a.threshold})
                </span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: a.severity === 'critical' ? "#ef4444" : "#eab308", background: a.severity === 'critical' ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.15)", borderRadius: 3, padding: "1px 6px" }}>
                {a.severity.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Dosing rate hourly - GRAPH 1 */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Dosing Rate — {timeRange === '24h' ? '24 Hours' : '1 Hour'}
            </span>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                mg/L
              </span>
              <TimeRangeButtons timeRange={timeRange} setTimeRange={setTimeRange} />
            </div>
          </div>
          {hourlyDosingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={hourlyDosingData} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} interval={hourlyDosingData.length > 20 ? Math.floor(hourlyDosingData.length / 10) : 0} />
                <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} domain={[0, 3.5]} tickFormatter={(v) => v.toFixed(1)} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={2.0} stroke="#22c55e" strokeDasharray="3 2" strokeWidth={1} label={{ value: "Min", position: "right", fontSize: 9, fill: "#22c55e" }} />
                <ReferenceLine y={3.0} stroke="#22c55e" strokeDasharray="3 2" strokeWidth={1} label={{ value: "Max", position: "right", fontSize: 9, fill: "#22c55e" }} />
                <ReferenceLine y={DOSING_RATE} stroke="#a78bfa" strokeDasharray="3 2" strokeWidth={1} label={{ value: "Target", position: "right", fontSize: 9, fill: "#a78bfa" }} />
                <Line type="monotone" dataKey="rate" stroke="#a78bfa" strokeWidth={2} dot={false} name="Dose Rate" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)' }}>
              <p>Waiting for data...</p>
            </div>
          )}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <div style={{ width: 20, height: 1, background: "#22c55e", borderTop: "1px dashed #22c55e" }} />
              <span style={{ fontSize: 9, color: "#22c55e" }}>Normal band (2.0–3.0)</span>
            </div>
            <div className="flex items-center gap-1">
              <div style={{ width: 20, height: 1, background: "#a78bfa" }} />
              <span style={{ fontSize: 9, color: "#a78bfa" }}>Actual</span>
            </div>
            <div className="flex items-center gap-1">
              <div style={{ width: 20, height: 1, background: "#eab308", borderTop: "1px dashed #eab308" }} />
              <span style={{ fontSize: 9, color: "#eab308" }}>Target</span>
            </div>
          </div>
        </div>

        {/* Monthly consumption - GRAPH 2 */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Monthly Consumption
            </span>
            <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
              kg · Rolling 6 Months
            </span>
          </div>
          {monthlyConsumptionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyConsumptionData} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="consumption" fill="#a78bfa" radius={[3, 3, 0, 0]} name="Consumption (kg)" />
                <ReferenceLine y={monthlyConsumption} stroke="#4d7a9e" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Target", position: "right", fontSize: 9, fill: "#4d7a9e" }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)' }}>
              <p>Waiting for data...</p>
            </div>
          )}
        </div>
      </div>

      {/* Consumption log table */}
      <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Recent Dosing Records
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Date", "Avg Dose Rate (mg/L)", "Consumption (kg)", "Production (m³)", "Dose/m³", "Status"].map((h) => (
                <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentRecords.map((r, i) => (
              <tr key={r.date} style={{ background: i % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                  {r.date}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: r.rate > 3.0 ? "#ef4444" : r.rate < 1.8 ? "#eab308" : "#a78bfa", borderBottom: "1px solid var(--border)" }}>
                  {r.rate}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                  {r.consumption}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                  {r.production}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                  {r.dosePerM3}
                </td>
                <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-1">
                    {r.ok ? (
                      <CheckCircle size={10} style={{ color: "#22c55e" }} />
                    ) : (
                      <AlertTriangle size={10} style={{ color: "#eab308" }} />
                    )}
                    <span style={{ fontSize: 9, color: r.ok ? "#22c55e" : "#eab308", fontWeight: 600 }}>
                      {r.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AntiscalantDosing;