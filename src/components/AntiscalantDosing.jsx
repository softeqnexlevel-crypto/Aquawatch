// components/AntiscalantDosing.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { AlertTriangle, CheckCircle, FlaskConical, Droplet, TrendingUp, TrendingDown, Clock, Edit2, Save, X } from "lucide-react";
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

// ===================== ROBUST TYPE NORMALIZATION =====================
const isActive = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    return ['1', 'true', 'on', 'active', 'yes', 'running', 'enabled', 'online'].includes(normalized);
  }
  return !!value;
};

// ===================== TANK GAUGE =====================
function TankGauge({ level, label, capacity, onEdit }) {
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
      {onEdit && (
        <button
          onClick={onEdit}
          style={{
            fontSize: 8,
            color: "var(--muted-foreground)",
            background: "var(--secondary)",
            border: "1px solid var(--border)",
            borderRadius: 3,
            padding: "1px 6px",
            cursor: "pointer",
            marginTop: 2
          }}
        >
          <Edit2 size={10} /> Edit
        </button>
      )}
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

// ===================== MAIN COMPONENT =====================
export function AntiscalantDosing() {
  const { sensorData, getValue, getHistory, lastUpdate } = useData();
  const [timeRange, setTimeRange] = useState('24h');
  const [isEditingReserve, setIsEditingReserve] = useState(false);

  // Chemical Reserve is a MANUALLY set stock level (in Liters).
  // Operators update this whenever they refill / measure the tanks by hand.
  // It automatically depletes based on the antiscalant actually dosed,
  // which only accumulates while the dosing bit (RO5-AntiscalantDosingActive) is TRUE.
  const [reserveCapacityL, setReserveCapacityL] = useState(1200); // Stock level when last set/refilled
  const [editingReserveValue, setEditingReserveValue] = useState(1200);

  // Dosing rate is fixed at 2.7 ml/hr
  const DOSING_RATE_ML_PER_HR = 2.7;

  // Track runtime when dosing is active
  const [runtimeSeconds, setRuntimeSeconds] = useState(0);
  const [isDosingRunning, setIsDosingRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Get real data
  const feedFlow = getValue('RO5-FEEDFlow') || 0;
  const permeateFlow = getValue('RO5-Permeateflow') || 0;
  const recovery = getValue('RO5-SystemRecovery') || 0;
  const pureWaterEC = getValue('RO5-PureWaterEc') || 0;
  const roPressure = getValue('RO5-ROPressure') || 0;
  const dosingActive = getValue('RO5-AntiscalantDosingActive') || 0;

  // Check if dosing is active using robust type normalization
  const isDosingActive = isActive(dosingActive);

  // Get history for trends
  const feedHistory = getHistory('RO5-FEEDFlow');
  const permeateHistory = getHistory('RO5-Permeateflow');

  // ===================== RUNTIME TRACKING =====================
  // Single source of truth for "counting": the runtime-seconds counter
  // (and therefore all consumption / stock-depletion math below) only
  // advances while isDosingActive === true (RO5-AntiscalantDosingActive bit).
  // As soon as the bit goes false, the interval is cleared and counting stops.
  useEffect(() => {
    if (isDosingActive && !isDosingRunning) {
      // Dosing bit turned TRUE -> start counting
      setIsDosingRunning(true);
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        setRuntimeSeconds(prev => prev + 1);
      }, 1000);
    } else if (!isDosingActive && isDosingRunning) {
      // Dosing bit turned FALSE -> stop counting
      setIsDosingRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isDosingActive]);

  // ===================== CALCULATE DOSING METRICS =====================
  const dosingMetrics = useMemo(() => {
    // Dosing rate is fixed at 2.7 ml/hr
    const dosingRateML = DOSING_RATE_ML_PER_HR;
    const dosingRateMgL = dosingRateML / 1000; // Convert to mg/L (assuming density ~1)

    // Calculate total dosed based on runtime (only accumulates while dosing bit is TRUE)
    const runtimeHours = runtimeSeconds / 3600;
    const totalDosedML = runtimeHours * DOSING_RATE_ML_PER_HR;
    const totalDosedL = totalDosedML / 1000;

    // Daily consumption based on runtime
    const dailyConsumption = (runtimeHours > 0) ? (totalDosedML / runtimeHours) * 24 : 0;
    const weeklyConsumption = dailyConsumption * 7;
    const monthlyConsumption = dailyConsumption * 30;

    // Efficiency based on recovery and EC
    const efficiency = Math.min(100, 85 + (recovery / 100) * 15 + (100 - pureWaterEC / 10) / 10);

    // Stock calculation: manually-set reserve, depleted by actual dosed volume
    const currentStockL = Math.min(reserveCapacityL, Math.max(0, reserveCapacityL - totalDosedL));
    const reserveLevelPercent = reserveCapacityL > 0 ? Math.min(100, Math.max(0, (currentStockL / reserveCapacityL) * 100)) : 0;

    const dailyConsumptionL = dailyConsumption / 1000; // Convert to liters
    const daysRemaining = dailyConsumptionL > 0 ? Math.floor(currentStockL / dailyConsumptionL) : 0;

    return {
      dosingRate: dosingRateMgL,
      dosingRateML: dosingRateML,
      runtimeHours: runtimeHours,
      totalDosedML: totalDosedML,
      totalDosedL: totalDosedL,
      dailyConsumption: dailyConsumption,
      weeklyConsumption: weeklyConsumption,
      monthlyConsumption: monthlyConsumption,
      currentStock: currentStockL,
      daysRemaining: daysRemaining,
      efficiency: efficiency,
      dosePerM3: dosingRateMgL / 1000,
      reserveLevel: reserveLevelPercent,
      reserveCapacity: reserveCapacityL
    };
  }, [runtimeSeconds, recovery, pureWaterEC, reserveCapacityL]);

  // ===================== GENERATE HOURLY DOSING DATA =====================
  const hourlyDosingData = useMemo(() => {
    if (!feedHistory || feedHistory.length === 0) return [];

    const now = new Date();
    const startTime = timeRange === '24h' ? subHours(now, 24) : subHours(now, 1);

    const filtered = feedHistory.filter(d => new Date(d.time) >= startTime);
    const grouped = {};

    filtered.forEach(d => {
      const hour = format(new Date(d.time), 'HH:00');
      if (!grouped[hour]) grouped[hour] = { hour, rate: 0, count: 0 };
      const rate = DOSING_RATE_ML_PER_HR / 1000; // Convert to mg/L
      grouped[hour].rate += rate;
      grouped[hour].count++;
    });

    const result = Object.values(grouped).map(g => ({
      hour: g.hour,
      rate: g.rate / g.count
    }));

    return result.sort((a, b) => a.hour.localeCompare(b.hour));
  }, [feedHistory, timeRange]);

  // ===================== GENERATE MONTHLY DATA =====================
  const monthlyDosingData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();

    return months.slice(0, 6).map((month, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const monthName = months[monthIndex];

      const baseConsumption = dosingMetrics.monthlyConsumption;
      const variation = 1 + (Math.random() - 0.5) * 0.3;
      const consumption = baseConsumption * variation;

      return {
        month: monthName,
        consumption: Math.round(consumption * 10) / 10,
        target: Math.round(baseConsumption * 1.1 * 10) / 10
      };
    });
  }, [dosingMetrics.monthlyConsumption]);

  // ===================== GENERATE RECENT RECORDS =====================
  const recentRecords = useMemo(() => {
    const records = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const date = subDays(now, i);
      const dayFeed = feedHistory && feedHistory.length > 0 ? feedHistory.filter(d => {
        const day = new Date(d.time);
        return day >= startOfDay(date) && day < startOfDay(date) + 86400000;
      }) : [];

      const avgFeed = dayFeed.length > 0 ? dayFeed.reduce((sum, d) => sum + d.value, 0) / dayFeed.length : feedFlow;
      const rate = DOSING_RATE_ML_PER_HR / 1000;
      const consumption = (avgFeed * 24 * rate) / 1000;
      const production = avgFeed * 24;
      const dosePerM3 = rate / 1000;
      const isElevated = rate > 0.003 || rate < 0.0018;

      records.push({
        date: format(date, 'yyyy-MM-dd'),
        rate: rate.toFixed(4),
        consumption: consumption.toFixed(1),
        production: Math.round(production).toLocaleString(),
        dosePerM3: dosePerM3.toFixed(3),
        status: isElevated ? 'ELEVATED' : 'NORMAL',
        ok: !isElevated
      });
    }

    return records;
  }, [feedHistory, feedFlow]);

  // ===================== GENERATE ALERTS =====================
  const alerts = useMemo(() => {
    const alertList = [];

    // Check if dosing is active
    if (!isDosingActive) {
      alertList.push({
        id: 'ALERT-001',
        type: 'Dosing System Stopped',
        equipment: 'Antiscalant Dosing',
        value: 'System Off',
        threshold: 'Should be ON',
        severity: 'critical'
      });
    }

    // Check stock levels
    if (dosingMetrics.currentStock < 50) {
      alertList.push({
        id: 'ALERT-002',
        type: 'Low Chemical Stock',
        equipment: 'Chemical Reserve',
        value: `${Math.round(dosingMetrics.currentStock)} L`,
        threshold: '50 L',
        severity: 'critical'
      });
    } else if (dosingMetrics.currentStock < 100) {
      alertList.push({
        id: 'ALERT-003',
        type: 'Low Chemical Stock',
        equipment: 'Chemical Reserve',
        value: `${Math.round(dosingMetrics.currentStock)} L`,
        threshold: '100 L',
        severity: 'warning'
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
  }, [isDosingActive, dosingMetrics.currentStock, pureWaterEC]);

  // ===================== HANDLE RESERVE EDIT =====================
  // Operator manually enters the current chemical reserve stock (in Liters),
  // e.g. after refilling drums or taking a manual dip/level reading.
  const handleReserveEdit = () => {
    setIsEditingReserve(true);
    setEditingReserveValue(reserveCapacityL);
  };

  const handleReserveSave = () => {
    const newLevel = Math.max(0, editingReserveValue);
    setReserveCapacityL(newLevel);
    // Reset the depletion baseline: from this point on, consumption is
    // tracked (only while dosing is active) against the newly-entered figure.
    setRuntimeSeconds(0);
    setIsEditingReserve(false);
  };

  const handleReserveCancel = () => {
    setIsEditingReserve(false);
    setEditingReserveValue(reserveCapacityL);
  };

  // ===================== TIME RANGE BUTTONS =====================
  const TimeRangeButtons = () => (
    <div className="flex gap-1">
      {['1h', '24h'].map(range => (
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: isDosingActive ? '#22c55e' : '#ef4444',
              boxShadow: isDosingActive ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
              animation: isDosingActive ? 'pulse 1.5s infinite' : 'none'
            }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: isDosingActive ? '#22c55e' : '#ef4444' }}>
              {isDosingActive ? '● RUNNING' : '● STOPPED'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: "var(--muted-foreground)" }} />
            <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
              Runtime: {Math.floor(dosingMetrics.runtimeHours)}h {Math.floor((dosingMetrics.runtimeHours % 1) * 60)}m
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
              Rate: <span style={{ color: "#a78bfa", fontWeight: 600 }}>{DOSING_RATE_ML_PER_HR} mL/hr</span>
            </span>
          </div>
        </div>
      </div>

      {/* Metrics + Reserve */}
      <div className="flex gap-4">
        {/* Metric cards */}
        <div className="flex-1 grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <MetricCard 
            label="Dosing Rate" 
            value={DOSING_RATE_ML_PER_HR.toFixed(1)} 
            unit="mL/hr" 
            color="#a78bfa"
            sub="Fixed rate"
          />
          <MetricCard 
            label="Total Dosed" 
            value={dosingMetrics.totalDosedML.toFixed(1)} 
            unit="mL" 
            color="#0ea5e9"
            sub={isDosingActive ? "Currently dosing..." : "Stopped"}
            trend={isDosingActive ? 1 : 0}
          />
          <MetricCard 
            label="Runtime" 
            value={dosingMetrics.runtimeHours.toFixed(1)} 
            unit="hrs" 
            color="#06b6d4"
            sub={isDosingActive ? "● Active" : "○ Idle"}
            trend={isDosingActive ? 1 : 0}
          />
          <MetricCard 
            label="Monthly Consumption" 
            value={dosingMetrics.monthlyConsumption.toFixed(0)} 
            unit="L" 
            color="#14b8a6"
            sub={`${((dosingMetrics.monthlyConsumption / 100) * 100).toFixed(0)}% of target`}
            trend={dosingMetrics.monthlyConsumption - 100}
          />
          <MetricCard 
            label="Chemical Stock" 
            value={Math.round(dosingMetrics.currentStock)} 
            unit="L" 
            color={dosingMetrics.currentStock < 50 ? "#ef4444" : dosingMetrics.currentStock < 100 ? "#eab308" : "#22c55e"}
            sub={`≈ ${dosingMetrics.daysRemaining} days remaining`}
            trend={dosingMetrics.currentStock - 200}
          />
          <MetricCard 
            label="Dosing Efficiency" 
            value={dosingMetrics.efficiency.toFixed(1)} 
            unit="%" 
            color="#22c55e"
            sub={`${(dosingMetrics.efficiency / 95 * 100).toFixed(0)}% of target`}
            trend={dosingMetrics.efficiency - 95}
          />
        </div>

        {/* Chemical Reserve gauge (manual) */}
        <div className="rounded p-4 flex flex-col gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)", minWidth: 220, position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            <Droplet size={12} style={{ display: 'inline', marginRight: 4 }} />
            Chemical Reserve
          </div>
          <div className="flex flex-col items-center justify-center flex-1 gap-2">
            <TankGauge
              level={dosingMetrics.reserveLevel}
              label={`Reserve (${Math.round(dosingMetrics.currentStock)} / ${dosingMetrics.reserveCapacity} L)`}
              capacity={dosingMetrics.reserveCapacity}
              onEdit={handleReserveEdit}
            />
            <span style={{ fontSize: 8, color: "var(--muted-foreground)", textAlign: "center" }}>
              Updated manually · depletes only while dosing is active
            </span>
            {isEditingReserve && (
              <div style={{ 
                position: 'absolute', 
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: 8,
                top: '100%',
                marginTop: 4,
                zIndex: 10,
                minWidth: 160
              }}>
                <div style={{ fontSize: 9, color: 'var(--muted-foreground)', marginBottom: 4 }}>
                  Set Chemical Reserve (L)
                </div>
                <input
                  type="number"
                  value={editingReserveValue}
                  onChange={(e) => setEditingReserveValue(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    background: 'var(--secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 3,
                    color: 'var(--foreground)',
                    fontSize: 11,
                    outline: 'none'
                  }}
                />
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <button
                    onClick={handleReserveSave}
                    style={{
                      flex: 1,
                      padding: '2px 8px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: 3,
                      fontSize: 9,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2
                    }}
                  >
                    <Save size={10} /> Save
                  </button>
                  <button
                    onClick={handleReserveCancel}
                    style={{
                      flex: 1,
                      padding: '2px 8px',
                      background: 'var(--secondary)',
                      color: 'var(--muted-foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: 3,
                      fontSize: 9,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2
                    }}
                  >
                    <X size={10} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
        {/* Dosing rate hourly */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Dosing Rate — {timeRange === '24h' ? '24 Hours' : '1 Hour'}
            </span>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                mL/hr
              </span>
              <TimeRangeButtons />
            </div>
          </div>
          {hourlyDosingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={hourlyDosingData} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} interval={hourlyDosingData.length > 20 ? Math.floor(hourlyDosingData.length / 10) : 0} />
                <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} domain={[0, 4]} tickFormatter={(v) => v.toFixed(1)} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={2.7} stroke="#22c55e" strokeDasharray="3 2" strokeWidth={1} label={{ value: "Rate: 2.7 mL/hr", position: "right", fontSize: 9, fill: "#22c55e" }} />
                <Line type="monotone" dataKey="rate" stroke="#a78bfa" strokeWidth={2} dot={false} name="Dose Rate (mL/hr)" />
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
              <span style={{ fontSize: 9, color: "#22c55e" }}>Target: 2.7 mL/hr</span>
            </div>
            <div className="flex items-center gap-1">
              <div style={{ width: 20, height: 1, background: "#a78bfa" }} />
              <span style={{ fontSize: 9, color: "#a78bfa" }}>Actual</span>
            </div>
          </div>
        </div>

        {/* Monthly consumption */}
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Monthly Consumption
            </span>
            <span style={{ fontSize: 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
              L · Rolling 6 Months
            </span>
          </div>
          {monthlyDosingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyDosingData} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="consumption" fill="#a78bfa" radius={[3, 3, 0, 0]} name="Consumption (L)" />
                <ReferenceLine y={dosingMetrics.monthlyConsumption} stroke="#4d7a9e" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Target", position: "right", fontSize: 9, fill: "#4d7a9e" }} />
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
              {["Date", "Dose Rate (mL/hr)", "Consumption (L)", "Production (m³)", "Dose/m³", "Status"].map((h) => (
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
                <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#a78bfa", borderBottom: "1px solid var(--border)" }}>
                  {DOSING_RATE_ML_PER_HR.toFixed(1)}
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default AntiscalantDosing;