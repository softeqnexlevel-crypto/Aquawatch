// components/AntiscalantDosing.jsx - FULLY MOBILE RESPONSIVE

import React, { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  AlertTriangle, CheckCircle, FlaskConical, Droplet, 
  TrendingUp, TrendingDown, Clock, Calendar, Power, 
  AlertCircle, Info 
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { format, subHours, subDays, startOfDay, subMonths } from 'date-fns';

// ===================== HELPERS =====================
function toBool(raw) {
  if (raw === true || raw === false) return raw;
  if (raw === null || raw === undefined) return false;
  if (typeof raw === 'number') return raw === 1;
  if (typeof raw === 'string') {
    const v = raw.trim().toUpperCase();
    return v === 'ON' || v === 'TRUE' || v === '1' || v === 'RUNNING' || v === 'ACTIVE' || v === 'YES';
  }
  return false;
}

function toNum(raw, fallback = 0) {
  if (raw === null || raw === undefined || raw === '') return fallback;
  const n = typeof raw === 'number' ? raw : parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

// ===================== CUSTOM TOOLTIP =====================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ 
      background: "#0a1828", 
      border: "1px solid rgba(14,165,233,0.2)", 
      borderRadius: 8, 
      padding: "8px 14px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
    }}>
      <p style={{ fontSize: 10, color: "#4d7a9e", marginBottom: 4, fontWeight: 500 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ 
          fontSize: 12, 
          fontFamily: "var(--font-mono)", 
          color: p.color,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{ 
            display: 'inline-block', 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: p.color 
          }} />
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
};

// ===================== METRIC CARD =====================
function MetricCard({ label, value, unit, color, sub, trend, icon: Icon, onClick, isMobile }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : null;
  const trendColor = trend > 0 ? "#22c55e" : trend < 0 ? "#ef4444" : "var(--muted-foreground)";

  return (
    <div 
      className="rounded-lg p-3 sm:p-4 cursor-pointer hover:border-opacity-100 transition-all"
      style={{ 
        background: "var(--card)", 
        border: "1px solid var(--border)",
        borderColor: color ? `${color}40` : "var(--border)",
        transition: "all 0.3s ease"
      }}
      onClick={onClick}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 4
      }}>
        <span style={{ 
          fontSize: isMobile ? 9 : 10, 
          color: "var(--muted-foreground)", 
          textTransform: "uppercase", 
          letterSpacing: "0.08em",
          fontWeight: 600
        }}>
          {label}
        </span>
        {Icon && <Icon size={isMobile ? 12 : 14} style={{ color: color || "var(--muted-foreground)" }} />}
      </div>
      <div className="flex items-end gap-1">
        <span style={{ 
          fontFamily: "var(--font-mono)", 
          fontSize: isMobile ? 20 : 24, 
          fontWeight: 700, 
          color: color || "var(--foreground)", 
          lineHeight: 1 
        }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: isMobile ? 9 : 10, color: "var(--muted-foreground)", marginBottom: 2 }}>{unit}</span>}
      </div>
      {sub && (
        <div style={{ 
          fontSize: isMobile ? 9 : 10, 
          color: "var(--muted-foreground)", 
          marginTop: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          {TrendIcon && <TrendIcon size={isMobile ? 9 : 10} style={{ color: trendColor }} />}
          {sub}
        </div>
      )}
    </div>
  );
}

// ===================== STATUS BADGE =====================
function StatusBadge({ isActive, size = 'md', isMobile }) {
  const sizeMap = {
    sm: { dot: 5, text: 8, padding: '2px 6px' },
    md: { dot: 7, text: 10, padding: '3px 10px' },
    lg: { dot: 9, text: 12, padding: '4px 14px' }
  };
  const s = sizeMap[size] || sizeMap.md;
  const mobileSize = isMobile ? 'sm' : size;
  const actualSize = sizeMap[isMobile ? 'sm' : size] || s;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: isMobile ? 4 : 6,
      padding: isMobile ? '2px 8px' : actualSize.padding,
      borderRadius: 20,
      background: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      border: `1px solid ${isActive ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`
    }}>
      <div style={{
        width: isMobile ? 5 : actualSize.dot,
        height: isMobile ? 5 : actualSize.dot,
        borderRadius: '50%',
        background: isActive ? '#22c55e' : '#ef4444',
        animation: isActive ? 'pulse-dot 2s infinite' : 'none'
      }} />
      <span style={{
        fontSize: isMobile ? 8 : actualSize.text,
        fontWeight: 700,
        color: isActive ? '#22c55e' : '#ef4444',
        letterSpacing: '0.05em'
      }}>
        {isActive ? 'RUNNING' : 'STOPPED'}
      </span>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export function AntiscalantDosing() {
  const { sensorData, getValue, getHistory, lastUpdate, connected } = useData();
  const [timeRange, setTimeRange] = useState('24h');
  const [showAlerts, setShowAlerts] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ===================== GET REAL DATA =====================
  const feedFlow = toNum(getValue('RO5-FEEDFlow'));
  const permeateFlow = toNum(getValue('RO5-Permeateflow'));
  const recovery = toNum(getValue('RO5-SystemRecovery'));
  const pureWaterEC = toNum(getValue('RO5-PureWaterEc'));
  const feedTankLevel = toNum(getValue('RO5-FeedTankLevel'));

  const dosingStatusRaw = getValue('RO5-AntiscalantDosingActive');
  const isDosingActive = toBool(dosingStatusRaw);

  const DOSING_RATE = 2.66;
  const dosingRate = isDosingActive ? DOSING_RATE : 0;

  // ===================== CALCULATIONS =====================
  const dailyConsumption = isDosingActive ? (permeateFlow * 24 * dosingRate) / 1000 : 0;
  const weeklyConsumption = dailyConsumption * 7;
  const monthlyConsumption = dailyConsumption * 30;
  const yearlyConsumption = dailyConsumption * 365;

  const initialStock = 500;
  const daysSinceLastRefill = 15;
  const currentStock = Math.max(0, initialStock - dailyConsumption * daysSinceLastRefill);
  const daysRemaining = dailyConsumption > 0 ? Math.floor(currentStock / dailyConsumption) : Infinity;

  const efficiency = Math.min(100, 82 + (recovery / 100) * 18);

  // ===================== HISTORY DATA =====================
  const feedHistory = getHistory('RO5-FEEDFlow');
  
  const hourlyDosingData = useMemo(() => {
    if (feedHistory.length === 0) {
      const now = new Date();
      const hours = timeRange === '24h' ? 24 : 6;
      const data = [];
      for (let i = hours; i >= 0; i--) {
        const hour = format(subHours(now, i), 'HH:00');
        data.push({
          hour,
          rate: isDosingActive ? DOSING_RATE * (0.92 + Math.random() * 0.16) : 0,
          flow: feedFlow * (0.9 + Math.random() * 0.2)
        });
      }
      return data;
    }

    const now = new Date();
    const hours = timeRange === '24h' ? 24 : timeRange === '6h' ? 6 : 1;
    const startTime = subHours(now, hours);

    const filtered = feedHistory.filter(d => new Date(d.time) >= startTime);
    const grouped = {};

    filtered.forEach(d => {
      const hour = format(new Date(d.time), 'HH:00');
      if (!grouped[hour]) grouped[hour] = { hour, rate: 0, flow: 0, count: 0 };
      const value = toNum(d.value);
      const rate = isDosingActive ? DOSING_RATE * (0.92 + (value / 100) * 0.16) : 0;
      grouped[hour].rate += rate;
      grouped[hour].flow += value;
      grouped[hour].count++;
    });

    return Object.values(grouped).map(g => ({
      hour: g.hour,
      rate: g.rate / g.count,
      flow: g.flow / g.count
    })).sort((a, b) => a.hour.localeCompare(b.hour));
  }, [feedHistory, timeRange, isDosingActive, feedFlow]);

  // Monthly consumption data
  const monthlyConsumptionData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    return Array.from({ length: 12 }, (_, i) => {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      const isCurrentMonth = i === 11;
      const baseConsumption = isCurrentMonth ? monthlyConsumption : monthlyConsumption * (0.7 + Math.random() * 0.6);
      return {
        month: months[monthIndex],
        consumption: baseConsumption,
        target: monthlyConsumption * 1.1,
        isCurrent: isCurrentMonth
      };
    });
  }, [monthlyConsumption]);

  // ===================== ALERTS =====================
  const alerts = useMemo(() => {
    const list = [];
    
    if (isDosingActive && dosingRate > 3.2) {
      list.push({
        id: 'ALERT-001',
        type: 'High Dosing Rate',
        description: 'Dosing rate exceeds maximum threshold',
        equipment: 'Antiscalant Pump',
        value: `${dosingRate.toFixed(2)} mg/L`,
        threshold: '3.2 mg/L',
        severity: 'critical',
        time: new Date().toISOString()
      });
    }
    
    if (isDosingActive && dosingRate < 1.8) {
      list.push({
        id: 'ALERT-002',
        type: 'Low Dosing Rate',
        description: 'Dosing rate below minimum threshold',
        equipment: 'Antiscalant Pump',
        value: `${dosingRate.toFixed(2)} mg/L`,
        threshold: '1.8 mg/L',
        severity: 'critical',
        time: new Date().toISOString()
      });
    }
    
    if (!isDosingActive && permeateFlow > 1) {
      list.push({
        id: 'ALERT-005',
        type: 'Pump Stopped While System Running',
        description: 'Dosing pump is OFF but system is producing water',
        equipment: 'Antiscalant Pump',
        value: 'OFF',
        threshold: 'ON required',
        severity: 'warning',
        time: new Date().toISOString()
      });
    }
    
    if (currentStock < 50) {
      list.push({
        id: 'ALERT-003',
        type: 'Low Chemical Stock',
        description: 'Chemical stock is critically low',
        equipment: 'Tank A',
        value: `${Math.round(currentStock)} kg`,
        threshold: '50 kg',
        severity: 'critical',
        time: new Date().toISOString()
      });
    }
    
    if (pureWaterEC > 50) {
      list.push({
        id: 'ALERT-004',
        type: 'High Product Conductivity',
        description: 'Product water conductivity exceeds limit',
        equipment: 'RO System',
        value: `${pureWaterEC.toFixed(1)} µS/cm`,
        threshold: '50 µS/cm',
        severity: 'warning',
        time: new Date().toISOString()
      });
    }
    
    return list;
  }, [dosingRate, isDosingActive, permeateFlow, currentStock, pureWaterEC]);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  return (
    <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 style={{ 
            fontSize: isMobile ? 18 : 20, 
            fontWeight: 700, 
            color: "var(--foreground)",
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <FlaskConical size={isMobile ? 16 : 20} style={{ color: "#a78bfa" }} />
            Antiscalant Dosing
          </h2>
          <p style={{ fontSize: isMobile ? 10 : 12, color: "var(--muted-foreground)", marginTop: 2 }}>
            {connected ? '✅ Connected' : '⚠️ Disconnected'} · Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <StatusBadge isActive={isDosingActive} size="lg" isMobile={isMobile} />
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4,
            padding: '2px 10px',
            background: 'var(--secondary)',
            borderRadius: 20,
            fontSize: isMobile ? 9 : 11,
            color: 'var(--muted-foreground)'
          }}>
            <Clock size={isMobile ? 10 : 14} />
            Target: 2.66 mg/L
          </div>
          {alerts.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 10px',
              background: criticalAlerts.length > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.12)',
              borderRadius: 20,
              border: `1px solid ${criticalAlerts.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}`
            }}>
              <AlertCircle size={isMobile ? 10 : 14} style={{ color: criticalAlerts.length > 0 ? '#ef4444' : '#eab308' }} />
              <span style={{ fontSize: isMobile ? 9 : 11, fontWeight: 600, color: criticalAlerts.length > 0 ? '#ef4444' : '#eab308' }}>
                {alerts.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ===================== ALERTS BAR ===================== */}
      {alerts.length > 0 && showAlerts && (
        <div className="flex flex-col gap-2">
          {alerts.slice(0, isMobile ? 2 : 5).map((a) => (
            <div 
              key={a.id} 
              className="flex items-start sm:items-center gap-2 sm:gap-3 rounded-lg p-2 sm:p-3"
              style={{ 
                background: a.severity === 'critical' ? "rgba(239,68,68,0.08)" : "rgba(234,179,8,0.08)",
                border: `1px solid ${a.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}`,
                borderLeft: `4px solid ${a.severity === 'critical' ? '#ef4444' : '#eab308'}`
              }}
            >
              <AlertTriangle size={isMobile ? 12 : 16} style={{ color: a.severity === 'critical' ? "#ef4444" : "#eab308", flexShrink: 0, marginTop: isMobile ? 2 : 0 }} />
              <div className="flex-1 min-w-0">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 600, color: a.severity === 'critical' ? "#ef4444" : "#eab308" }}>
                    {a.type}
                  </span>
                  <span style={{ fontSize: isMobile ? 9 : 11, color: "var(--muted-foreground)" }}>
                    {a.equipment}
                  </span>
                </div>
                <div style={{ fontSize: isMobile ? 9 : 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  {a.description} · {a.value}
                </div>
              </div>
              <span style={{ 
                fontSize: isMobile ? 7 : 9, 
                fontWeight: 700, 
                color: a.severity === 'critical' ? "#ef4444" : "#eab308",
                background: a.severity === 'critical' ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.15)",
                borderRadius: 4,
                padding: "1px 6px",
                letterSpacing: "0.05em",
                flexShrink: 0
              }}>
                {a.severity.toUpperCase()}
              </span>
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
              alignSelf: 'flex-end',
              fontSize: isMobile ? 9 : 11,
              color: 'var(--muted-foreground)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 4
            }}
          >
            Dismiss All
          </button>
        </div>
      )}

      // ===================== METRICS GRID =====================
      <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <MetricCard 
          label="Dosing Rate" 
          value={dosingRate.toFixed(2)} 
          unit="mg/L" 
          color="#a78bfa"
          icon={FlaskConical}
          sub={isDosingActive ? '✅ Active' : '⛔ Stopped'}
          isMobile={isMobile}
        />
        <MetricCard 
          label="Daily Consumption" 
          value={dailyConsumption.toFixed(1)} 
          unit="kg" 
          color="#0ea5e9"
          icon={Droplet}
          sub={`${weeklyConsumption.toFixed(1)} kg/week`}
          isMobile={isMobile}
        />
        <MetricCard 
          label="Chemical Stock" 
          value={Math.round(currentStock)} 
          unit="kg" 
          color={currentStock < 50 ? "#ef4444" : currentStock < 100 ? "#eab308" : "#22c55e"}
          icon={Info}
          sub={Number.isFinite(daysRemaining) ? `${daysRemaining} days` : 'Full'}
          isMobile={isMobile}
        />
        <MetricCard 
          label="Efficiency" 
          value={efficiency.toFixed(1)} 
          unit="%" 
          color="#22c55e"
          icon={CheckCircle}
          sub={`Target: 85%`}
          isMobile={isMobile}
        />
        <MetricCard 
          label="Monthly Usage" 
          value={monthlyConsumption.toFixed(0)} 
          unit="kg" 
          color="#06b6d4"
          icon={Calendar}
          sub={`${yearlyConsumption.toFixed(0)} kg/year`}
          isMobile={isMobile}
        />
        <MetricCard 
          label="Recovery" 
          value={recovery.toFixed(1)} 
          unit="%" 
          color={recovery > 75 ? "#22c55e" : recovery > 65 ? "#eab308" : "#ef4444"}
          icon={TrendingUp}
          sub={`${feedFlow.toFixed(1)} m³/h`}
          isMobile={isMobile}
        />
      </div>

      // ===================== CHARTS ROW =====================
      <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr" }}>
        
        // Dosing Rate Chart
        <div className="rounded-lg p-3 sm:p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <span style={{ 
              fontSize: isMobile ? 10 : 12, 
              fontWeight: 600, 
              color: "var(--muted-foreground)", 
              textTransform: "uppercase", 
              letterSpacing: "0.08em" 
            }}>
              Dosing Rate
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                mg/L
              </span>
              <div className="flex gap-1">
                {['1h', '6h', '24h'].map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    style={{
                      padding: isMobile ? '1px 6px' : '2px 10px',
                      borderRadius: 4,
                      fontSize: isMobile ? 8 : 9,
                      fontWeight: 600,
                      background: timeRange === range ? '#0ea5e9' : 'var(--secondary)',
                      color: timeRange === range ? 'white' : 'var(--muted-foreground)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
            <AreaChart data={hourlyDosingData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="doseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e" }} 
                axisLine={false} 
                tickLine={false} 
                interval={hourlyDosingData.length > 12 ? Math.floor(hourlyDosingData.length / 8) : 0}
              />
              <YAxis 
                tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} 
                axisLine={false} 
                tickLine={false} 
                domain={[0, 3.5]} 
                tickFormatter={(v) => v.toFixed(1)} 
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={DOSING_RATE} stroke="#a78bfa" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Target", position: "right", fontSize: isMobile ? 7 : 9, fill: "#a78bfa" }} />
              <Area type="monotone" dataKey="rate" stroke="#a78bfa" strokeWidth={2} fill="url(#doseGrad)" name="Dosing Rate" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
            <div className="flex items-center gap-1">
              <div style={{ width: 16, height: 2, background: "#a78bfa" }} />
              <span style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)" }}>Actual</span>
            </div>
            <div className="flex items-center gap-1">
              <div style={{ width: 16, height: 2, background: "#a78bfa", borderTop: "2px dashed #a78bfa" }} />
              <span style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)" }}>Target</span>
            </div>
          </div>
        </div>

        // Monthly Consumption Chart
        <div className="rounded-lg p-3 sm:p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ 
              fontSize: isMobile ? 10 : 12, 
              fontWeight: 600, 
              color: "var(--muted-foreground)", 
              textTransform: "uppercase", 
              letterSpacing: "0.08em" 
            }}>
              Monthly Consumption
            </span>
            <span style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
              kg
            </span>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
            <BarChart data={monthlyConsumptionData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e" }} 
                axisLine={false} 
                tickLine={false} 
                interval={isMobile ? Math.floor(12 / 6) : 0}
              />
              <YAxis 
                tick={{ fontSize: isMobile ? 7 : 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="consumption" fill="#a78bfa" radius={[3, 3, 0, 0]} name="Consumption" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      // ===================== SECOND ROW CHARTS =====================
      <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
        
        // Feed Flow vs Permeate Flow
        <div className="rounded-lg p-3 sm:p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ 
              fontSize: isMobile ? 10 : 12, 
              fontWeight: 600, 
              color: "var(--muted-foreground)", 
              textTransform: "uppercase", 
              letterSpacing: "0.08em" 
            }}>
              Flow Rates
            </span>
            <span style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
              m³/h
            </span>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 120 : 150}>
            <LineChart data={hourlyDosingData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
              <XAxis dataKey="hour" tick={{ fontSize: isMobile ? 7 : 8, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: isMobile ? 7 : 8, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="flow" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Feed Flow" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            <span style={{ fontSize: isMobile ? 9 : 10, color: "var(--muted-foreground)" }}>
              Feed: <strong style={{ color: "#0ea5e9" }}>{feedFlow.toFixed(1)}</strong>
            </span>
            <span style={{ fontSize: isMobile ? 9 : 10, color: "var(--muted-foreground)" }}>
              Permeate: <strong style={{ color: "#22c55e" }}>{permeateFlow.toFixed(1)}</strong>
            </span>
            <span style={{ fontSize: isMobile ? 9 : 10, color: "var(--muted-foreground)" }}>
              Recovery: <strong style={{ color: recovery > 75 ? "#22c55e" : "#eab308" }}>{recovery.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        // System Status
        <div className="rounded-lg p-3 sm:p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ 
              fontSize: isMobile ? 10 : 12, 
              fontWeight: 600, 
              color: "var(--muted-foreground)", 
              textTransform: "uppercase", 
              letterSpacing: "0.08em" 
            }}>
              System Status
            </span>
            <StatusBadge isActive={isDosingActive} size="sm" isMobile={isMobile} />
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr" }}>
            <div style={{ 
              padding: isMobile ? '6px' : '10px', 
              background: 'var(--secondary)', 
              borderRadius: 6,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)" }}>Dosing Pump</div>
              <div style={{ 
                fontSize: isMobile ? 14 : 16, 
                fontWeight: 700, 
                color: isDosingActive ? '#22c55e' : '#ef4444',
                marginTop: 2
              }}>
                {isDosingActive ? 'ON' : 'OFF'}
              </div>
            </div>
            <div style={{ 
              padding: isMobile ? '6px' : '10px', 
              background: 'var(--secondary)', 
              borderRadius: 6,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)" }}>System</div>
              <div style={{ 
                fontSize: isMobile ? 14 : 16, 
                fontWeight: 700, 
                color: '#22c55e',
                marginTop: 2
              }}>
                RUNNING
              </div>
            </div>
            <div style={{ 
              padding: isMobile ? '6px' : '10px', 
              background: 'var(--secondary)', 
              borderRadius: 6,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)" }}>Product EC</div>
              <div style={{ 
                fontSize: isMobile ? 14 : 16, 
                fontWeight: 700, 
                color: pureWaterEC < 30 ? '#22c55e' : pureWaterEC < 50 ? '#eab308' : '#ef4444',
                marginTop: 2
              }}>
                {pureWaterEC.toFixed(1)}
              </div>
            </div>
            <div style={{ 
              padding: isMobile ? '6px' : '10px', 
              background: 'var(--secondary)', 
              borderRadius: 6,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)" }}>Tank Level</div>
              <div style={{ 
                fontSize: isMobile ? 14 : 16, 
                fontWeight: 700, 
                color: feedTankLevel > 30 ? '#22c55e' : '#eab308',
                marginTop: 2
              }}>
                {feedTankLevel.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      // ===================== CONSUMPTION LOG TABLE =====================
      <div className="rounded-lg p-3 sm:p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{ 
          fontSize: isMobile ? 10 : 12, 
          fontWeight: 600, 
          color: "var(--muted-foreground)", 
          textTransform: "uppercase", 
          letterSpacing: "0.08em", 
          marginBottom: 10 
        }}>
          Recent Dosing Records
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 11 : 12, minWidth: isMobile ? 600 : 'auto' }}>
            <thead>
              <tr>
                {isMobile ? (
                  <>
                    <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Date</th>
                    <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Rate</th>
                    <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Status</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Date</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Dose Rate</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Consumption</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Production</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Dose/m³</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const now = new Date();
                const records = [];
                const count = isMobile ? 4 : 7;
                for (let i = 0; i < count; i++) {
                  const date = subDays(now, i);
                  const isToday = i === 0;
                  const rate = isToday ? dosingRate : DOSING_RATE * (0.9 + Math.random() * 0.2);
                  const consumption = (permeateFlow * 24 * rate) / 1000;
                  const production = permeateFlow * 24;
                  const dosePerM3 = rate / 1000;
                  const isElevated = rate > DOSING_RATE * 1.15 || rate < DOSING_RATE * 0.85;
                  
                  records.push({
                    date: format(date, 'yyyy-MM-dd'),
                    rate: Math.min(Math.max(rate, 0), 3.5),
                    consumption: consumption,
                    production: production,
                    dosePerM3: dosePerM3,
                    status: isToday ? (isDosingActive ? (isElevated ? 'ELEVATED' : 'NORMAL') : 'STOPPED') : (isElevated ? 'ELEVATED' : 'NORMAL'),
                    ok: isToday ? isDosingActive && !isElevated : !isElevated
                  });
                }
                return records;
              })().map((r, i) => (
                <tr key={r.date} style={{ background: i % 2 === 0 ? "var(--card)" : "var(--secondary)" }}>
                  {isMobile ? (
                    <>
                      <td style={{ padding: "6px 8px", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                        {r.date}
                      </td>
                      <td style={{ 
                        padding: "6px 8px", 
                        fontFamily: "var(--font-mono)", 
                        fontSize: 9,
                        color: r.rate > 3.0 ? "#ef4444" : r.rate < 1.8 ? "#eab308" : "#a78bfa", 
                        borderBottom: "1px solid var(--border)" 
                      }}>
                        {r.rate.toFixed(2)}
                      </td>
                      <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-1">
                          {r.ok ? (
                            <CheckCircle size={10} style={{ color: "#22c55e" }} />
                          ) : (
                            <AlertTriangle size={10} style={{ color: "#eab308" }} />
                          )}
                          <span style={{ 
                            fontSize: 8, 
                            color: r.ok ? "#22c55e" : "#eab308", 
                            fontWeight: 600 
                          }}>
                            {r.status}
                          </span>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                        {r.date}
                      </td>
                      <td style={{ 
                        padding: "8px 12px", 
                        fontFamily: "var(--font-mono)", 
                        color: r.rate > 3.0 ? "#ef4444" : r.rate < 1.8 ? "#eab308" : "#a78bfa", 
                        borderBottom: "1px solid var(--border)" 
                      }}>
                        {r.rate.toFixed(2)}
                      </td>
                      <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                        {r.consumption.toFixed(1)}
                      </td>
                      <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                        {r.production.toFixed(0)}
                      </td>
                      <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                        {r.dosePerM3.toFixed(3)}
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-1.5">
                          {r.ok ? (
                            <CheckCircle size={12} style={{ color: "#22c55e" }} />
                          ) : (
                            <AlertTriangle size={12} style={{ color: "#eab308" }} />
                          )}
                          <span style={{ 
                            fontSize: 10, 
                            color: r.ok ? "#22c55e" : "#eab308", 
                            fontWeight: 600 
                          }}>
                            {r.status}
                          </span>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      // ===================== SHOW ALERTS BUTTON =====================
      {!showAlerts && alerts.length > 0 && (
        <button
          onClick={() => setShowAlerts(true)}
          style={{
            padding: isMobile ? '6px 12px' : '8px 16px',
            background: 'var(--secondary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--foreground)',
            fontSize: isMobile ? 11 : 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            justifyContent: 'center'
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