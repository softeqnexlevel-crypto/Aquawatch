// components/Dashboard.jsx - COMPLETE FIXED VERSION - REAL DATA ONLY

import React, { useState, useEffect, useRef } from 'react';
import {
  Droplets, Activity, FlaskConical, AlertTriangle,
  CheckCircle, Gauge, Zap, Filter, TrendingUp, TrendingDown,
  Minus, RefreshCw, Power, Clock, AlertCircle
} from "lucide-react";
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

import { AdvancedGauge } from './dashboardComponents/AdvancedGauge';
import { LiveTrendChart } from './dashboardComponents/LiveTrendChart';
import { SystemHealthRadar } from './dashboardComponents/SystemHealthRadar';
import { FlowBalanceChart } from './dashboardComponents/FlowBalanceChart';
import { DistributionHistogram } from './dashboardComponents/DistributionHistogram';


/* ============================================================
  Shared color palette
  ============================================================ */

export const COLORS = {
  primary: '#0ea5e9',
  secondary: '#06b6d4',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a78bfa',
  indigo: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
  yellow: '#eab308',
};

/* ============================================================
  ROBUST TYPE NORMALIZATION
  ============================================================ */

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

const toNumber = (value) => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return 0;
};

const safeFormat = (value, decimals = 1, fallback = '0.0') => {
  if (value === undefined || value === null) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num) || !isFinite(num)) return fallback;
  return num.toFixed(decimals);
};

const safeNumber = (value, fallback = 0) => {
  if (value === undefined || value === null) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return (isNaN(num) || !isFinite(num)) ? fallback : num;
};

/* ============================================================
  Sensor mapping
  ============================================================ */

export const SENSOR_MAP = {
  'RO5-FEEDFlow': { label: 'Feed Flow', unit: 'm³/h', icon: Droplets, color: COLORS.primary, shortName: 'FEEDFlow' },
  'RO5-Permeateflow': { label: 'Permeate Flow', unit: 'm³/h', icon: Droplets, color: COLORS.secondary, shortName: 'Permeateflow' },
  'RO5-ConcetrateFlow': { label: 'Concentrate Flow', unit: 'm³/h', icon: Activity, color: COLORS.warning, shortName: 'ConcentrateFlow' },
  'RO5-ROPressure': { label: 'RO Pressure', unit: 'bar', icon: Gauge, color: COLORS.danger, shortName: 'ROPressure' },
  'RO5-InterstagePress': { label: 'Interstage Pressure', unit: 'bar', icon: Gauge, color: COLORS.orange, shortName: 'InterstagePress' },
  'RO5-ConcetratePress': { label: 'Concentrate Pressure', unit: 'bar', icon: Gauge, color: COLORS.yellow, shortName: 'ConcetratePress' },
  'RO5-Stage1Delta': { label: 'Stage 1 Delta P', unit: 'bar', icon: Zap, color: COLORS.success, shortName: 'Stage1Delta' },
  'RO5-Stage2Delta': { label: 'Stage 2 Delta P', unit: 'bar', icon: Zap, color: '#14b8a6', shortName: 'Stage2Delta' },
  'RO5-MediaFilterInPress': { label: 'Filter Inlet Pressure', unit: 'bar', icon: Filter, color: COLORS.purple, shortName: 'MediaFilterInPress' },
  'RO5-MediaFilterOutPress': { label: 'Filter Outlet Pressure', unit: 'bar', icon: Filter, color: COLORS.indigo, shortName: 'MediaFilterOutPress' },
  'RO5-MediaFilterDeltaP': { label: 'Filter Delta P', unit: 'bar', icon: Filter, color: '#7c3aed', shortName: 'MediaFilterDeltaP' },
  'RO5-SystemRecovery': { label: 'System Recovery', unit: '%', icon: Activity, color: COLORS.success, shortName: 'SystemRecovery' },
  'RO5-PureWaterEc': { label: 'Product Water EC', unit: 'µS/cm', icon: FlaskConical, color: COLORS.purple, shortName: 'PureWaterEC' },
  'RO5-FeedTankLevel': { label: 'Feed Tank Level', unit: '%', icon: Droplets, color: '#14b8a6', shortName: 'FeedTankLevel' },
  'RO5-SystemOperation': { label: 'System Operation', unit: '', icon: Power, color: COLORS.success, shortName: 'SystemOperation' },
  'RO5-SystemMode': { label: 'System Mode', unit: '', icon: Power, color: COLORS.primary, shortName: 'SystemMode' },
  'RO5-AntiscalantDosingActive': { label: 'Dosing Active', unit: '', icon: FlaskConical, color: COLORS.purple, shortName: 'DosingActive' },
};

const PARAMETER_ALIASES = {
  'siemens200smart-RO5-FEEDFlow': 'RO5-FEEDFlow',
  'siemens200smart-RO5-Permeateflow': 'RO5-Permeateflow',
  'siemens200smart-RO5-ConcetrateFlow': 'RO5-ConcetrateFlow',
  'siemens200smart-RO5-ROPressure': 'RO5-ROPressure',
  'siemens200smart-RO5-InterstagePress': 'RO5-InterstagePress',
  'siemens200smart-RO5-ConcetratePress': 'RO5-ConcetratePress',
  'siemens200smart-RO5-Stage1Delta': 'RO5-Stage1Delta',
  'siemens200smart-RO5-Stage2Delta': 'RO5-Stage2Delta',
  'siemens200smart-RO5-MediaFilterInPress': 'RO5-MediaFilterInPress',
  'siemens200smart-RO5-MediaFilterOutPress': 'RO5-MediaFilterOutPress',
  'siemens200smart-RO5-MediaFilterDeltaP': 'RO5-MediaFilterDeltaP',
  'siemens200smart-RO5-SystemRecovery': 'RO5-SystemRecovery',
  'siemens200smart-RO5-PureWaterEc': 'RO5-PureWaterEc',
  'siemens200smart-RO5-FeedTankLevel': 'RO5-FeedTankLevel',
  'siemens200smart-RO5-SystemOperation': 'RO5-SystemOperation',
  'siemens200smart-RO5-SystemMode': 'RO5-SystemMode',
  'siemens200smart-RO5-AntiscalantDosingActive': 'RO5-AntiscalantDosingActive',
};

function toShortName(parameter) {
  return PARAMETER_ALIASES[parameter] || parameter;
}

function getSensorInfo(parameter) {
  const shortName = toShortName(parameter);
  return SENSOR_MAP[shortName] || {
    label: shortName,
    unit: '',
    icon: Activity,
    color: '#4d7a9e',
    shortName: shortName,
  };
}

const MAX_HISTORY_POINTS = 500;

/* ============================================================
  KPICard Component - Updated with dynamic colors
  ============================================================ */

function KPICard({ label, value, unit, icon: Icon, trend, trendValue, color, sub }) {
  const displayValue = typeof value === 'string' && isNaN(parseFloat(value)) 
    ? value 
    : value;
  
  const trendColor = trend === "up" ? COLORS.success : trend === "down" ? COLORS.danger : "#4d7a9e";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  
  return (
    <div className="rounded p-3 flex flex-col gap-1" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
        {Icon && <Icon size={13} style={{ color: color || "var(--muted-foreground)" }} />}
      </div>
      <div className="flex items-end gap-1">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: color || "var(--foreground)", lineHeight: 1 }}>
          {displayValue}
        </span>
        {unit && typeof displayValue === 'number' && <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginBottom: 2 }}>{unit}</span>}
      </div>
      {(trendValue || sub) && (
        <div className="flex items-center gap-1">
          {trend && <TrendIcon size={10} style={{ color: trendColor }} />}
          <span style={{ fontSize: 10, color: trendValue ? trendColor : "var(--muted-foreground)" }}>
            {trendValue || sub}
          </span>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
      {children}
    </h2>
  );
}

/* ============================================================
  System Status Indicators
  ============================================================ */

function SystemStatus({ isOn, label, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 rounded p-2" style={{ 
      background: isOn ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${isOn ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
    }}>
      <Icon size={16} style={{ color: isOn ? COLORS.success : COLORS.danger }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: isOn ? COLORS.success : COLORS.danger }}>
        {label}: {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}

/* ============================================================
  Dosing Runtime Card
  ============================================================ */

function DosingRuntimeCard({ isActive, rate, runtimeHours, totalDosed }) {
  const formatDosingValue = (value) => {
    const num = safeNumber(value);
    return num.toFixed(2);
  };

  return (
    <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <FlaskConical size={12} style={{ display: 'inline', marginRight: 4 }} />
          Antiscalant Dosing
        </span>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 4,
          padding: '2px 8px',
          borderRadius: 4,
          background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
        }}>
          <div style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            background: isActive ? COLORS.success : COLORS.danger 
          }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: isActive ? COLORS.success : COLORS.danger }}>
            {isActive ? 'RUNNING' : 'STOPPED'}
          </span>
        </div>
      </div>
      
      <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div>
          <div style={{ fontSize: 8, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Rate</div>
          <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 700, color: COLORS.purple }}>
            {formatDosingValue(rate)} <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>mg/L</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Runtime</div>
          <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 700, color: COLORS.primary }}>
            {formatDosingValue(runtimeHours)} <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>hrs</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Total Dosed</div>
          <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 700, color: COLORS.purple }}>
            {formatDosingValue(totalDosed)} <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>mL</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
  Alarms Card
  ============================================================ */

function AlarmsCard({ alarms }) {
  const activeAlarms = alarms.filter(a => a.status === 'Active');
  const powerAlarms = activeAlarms.filter(a => a.isPowerProblem);
  
  return (
    <div className="rounded p-3 flex flex-col gap-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <SectionTitle>Live Alerts & Events</SectionTitle>
      
      {powerAlarms.length > 0 && (
        <div className="flex items-center gap-2 rounded p-2" style={{ 
          background: 'rgba(239,68,68,0.1)', 
          border: '1px solid rgba(239,68,68,0.2)',
          animation: 'pulse 2s infinite'
        }}>
          <AlertTriangle size={16} style={{ color: COLORS.danger }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.danger }}>
            ⚡ Power Problem Alarm
          </span>
        </div>
      )}
      
      <div className="flex flex-col gap-1.5 flex-1 overflow-auto" >
        {activeAlarms.length > 0 ? activeAlarms.slice(0, 5).map((alert) => {
          const color = alert.severity === "Critical" ? COLORS.danger : 
                      alert.severity === "High" ? COLORS.orange : 
                      alert.severity === "Medium" ? COLORS.yellow : 
                      alert.severity === "Info" ? COLORS.success : COLORS.primary;
          return (
            <div key={alert.id} className="flex items-start gap-2 rounded p-2" style={{ background: "var(--muted)", border: `1px solid ${color}22` }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, marginTop: 3, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 10, fontWeight: 500, color: "var(--foreground)" }}>{alert.type}</div>
                <div style={{ fontSize: 9, color: "var(--muted-foreground)" }}>{alert.equipment} · {alert.time}</div>
                {alert.value && (
                  <div style={{ fontSize: 8, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
                    Value: {alert.value}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 8, fontWeight: 600, color, letterSpacing: "0.06em", background: `${color}18`, borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>
                {alert.severity.toUpperCase()}
              </span>
            </div>
          );
        }) : (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>
            <CheckCircle size={12} style={{ marginRight: 6, color: COLORS.success }} />
            All systems operating normally
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
  API service
  ============================================================ */

const api = {
  getCurrentReadings: async () => {
    const response = await fetch(`${API_BASE_URL}/api/current`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  getMqttStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/api/mqtt-status`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  getAlarms: async () => {
    const response = await fetch(`${API_BASE_URL}/api/alarms`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
};

/* ============================================================
  Dashboard - COMPLETE FIXED VERSION - REAL DATA ONLY
  ============================================================ */

export function Dashboard() {
  const [sensorData, setSensorData] = useState({});
  const [history, setHistory] = useState({});
  const [connected, setConnected] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedSensors, setSelectedSensors] = useState(['RO5-Permeateflow']);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Raw value — use for status/boolean-style parameters via isActive().
  const getValue = (key) => {
    const val = sensorData[key]?.value;
    return val !== undefined && val !== null ? val : 0;
  };

  // Numeric-coerced value — ALWAYS use for anything rendered with
  // .toFixed()/safeFormat(). Safe even if a bit/boolean value ever ends up
  // here, since safeNumber() falls back to 0 rather than throwing.
  const getNumber = (key) => safeNumber(getValue(key));

  // ==================== DAILY PRODUCTION ====================
  const [dailyProductionM3, setDailyProductionM3] = useState(0);
  const permeateFlowRef = useRef(0);
  const dailyProductionRef = useRef({ total: 0, day: new Date().toDateString() });

  useEffect(() => {
    permeateFlowRef.current = getNumber('RO5-Permeateflow');
  }, [sensorData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().toDateString();
      if (dailyProductionRef.current.day !== today) {
        dailyProductionRef.current = { total: 0, day: today };
      }
      const flowM3PerHr = permeateFlowRef.current;
      if (flowM3PerHr > 0) {
        const incrementM3 = flowM3PerHr / 3600;
        dailyProductionRef.current.total += incrementM3;
        setDailyProductionM3(dailyProductionRef.current.total);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ==================== GENERATE ALERTS ====================
  const generateAlerts = () => {
    const newAlerts = [];
    let id = 1;
    const now = new Date();

    const addAlert = (type, severity, equipment, value, threshold, isPowerProblem = false) => {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: type,
        severity: severity,
        status: 'Active',
        equipment: equipment,
        value: typeof value === 'number' ? value.toFixed(1) : String(value),
        threshold: threshold,
        time: now.toLocaleTimeString(),
        date: now.toLocaleDateString(),
        isPowerProblem: isPowerProblem
      });
    };

    const systemOp = getValue('RO5-SystemOperation');
    const isSystemOn = isActive(systemOp);
    if (!isSystemOn) {
      addAlert('Power Problem - System Offline', 'Critical', 'RO5 - SystemOperation', 'OFF', 'ON required', true);
    }

    const roPressure = getNumber('RO5-ROPressure');
    if (roPressure > 16 && roPressure > 0) {
      addAlert('High RO Pressure', 'Critical', 'RO5 - ROPressure', roPressure, '> 16 bar');
    }

    const stage1Delta = getNumber('RO5-Stage1Delta');
    if (stage1Delta > 0.60 && stage1Delta > 0) {
      addAlert('High Differential Pressure - Stage 1', 'Critical', 'RO5 - Stage1Delta', stage1Delta, '> 0.60 bar');
    } else if (stage1Delta > 0.50 && stage1Delta > 0) {
      addAlert('High Differential Pressure - Stage 1', 'High', 'RO5 - Stage1Delta', stage1Delta, '> 0.50 bar');
    }

    const stage2Delta = getNumber('RO5-Stage2Delta');
    if (stage2Delta > 0.55 && stage2Delta > 0) {
      addAlert('High Differential Pressure - Stage 2', 'High', 'RO5 - Stage2Delta', stage2Delta, '> 0.55 bar');
    }

    const filterDeltaP = getNumber('RO5-MediaFilterDeltaP');
    if (filterDeltaP > 0.40 && filterDeltaP > 0) {
      addAlert('High Filter Delta P', 'Critical', 'RO5 - MediaFilterDeltaP', filterDeltaP, '> 0.40 bar');
    } else if (filterDeltaP > 0.30 && filterDeltaP > 0) {
      addAlert('High Filter Delta P', 'Medium', 'RO5 - MediaFilterDeltaP', filterDeltaP, '> 0.30 bar');
    }

    const systemRecovery = getNumber('RO5-SystemRecovery');
    if (systemRecovery < 68 && systemRecovery > 0) {
      addAlert('Low System Recovery', 'Critical', 'RO5 - SystemRecovery', systemRecovery, '< 68%');
    } else if (systemRecovery < 72 && systemRecovery > 0) {
      addAlert('Low System Recovery', 'Medium', 'RO5 - SystemRecovery', systemRecovery, '< 72%');
    }

    const feedTankLevel = getNumber('RO5-FeedTankLevel');
    if (feedTankLevel < 20 && feedTankLevel > 0) {
      addAlert('Low Feed Tank Level', 'Critical', 'RO5 - FeedTankLevel', feedTankLevel, '< 20%');
    } else if (feedTankLevel < 30 && feedTankLevel > 0) {
      addAlert('Low Feed Tank Level', 'Medium', 'RO5 - FeedTankLevel', feedTankLevel, '< 30%');
    }

    const feedFlow = getNumber('RO5-FEEDFlow');
    if (feedFlow < 50 && feedFlow > 0) {
      addAlert('Low Feed Flow', 'High', 'RO5 - FEEDFlow', feedFlow, '< 50 m³/h');
    }

    const pureWaterEC = getNumber('RO5-PureWaterEc');
    if (pureWaterEC > 50 && pureWaterEC > 0) {
      addAlert('High Product Water EC', 'Medium', 'RO5 - PureWaterEc', pureWaterEC, '> 50 µS/cm');
    }

    if (newAlerts.length === 0) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: 'All Systems Operating Normally',
        severity: 'Info',
        status: 'Acknowledged',
        equipment: 'RO5 - System Health',
        value: 'All systems go',
        threshold: 'N/A',
        time: now.toLocaleTimeString(),
        date: now.toLocaleDateString(),
        isPowerProblem: false
      });
    }

    return newAlerts;
  };

  const updateAlerts = () => {
    const newAlerts = generateAlerts();
    setAlarms(newAlerts);
  };

  // ==================== FETCH REAL DATA ====================
  const fetchRealData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const readings = await api.getCurrentReadings();
      
      if (!readings || Object.keys(readings).length === 0) {
        throw new Error('No data received from backend');
      }

      const formatted = {};
      Object.entries(readings).forEach(([key, value]) => {
        const shortName = toShortName(key);
        const info = getSensorInfo(key);
        // Preserve the raw value as-is here (could be a number, or "ON"/"OFF"
        // for bit-type parameters) — do NOT coerce with safeNumber(), or
        // dosing/system status values get silently zeroed out.
        formatted[shortName] = {
          value: value,
          timestamp: new Date().toISOString(),
          simulated: false,
          unit: info.unit,
          label: info.label,
        };
      });
      
      setSensorData(formatted);
      setLastUpdate(new Date().toISOString());

      setHistory(prev => {
        const newHistory = { ...prev };
        Object.keys(formatted).forEach(key => {
          if (!newHistory[key]) {
            newHistory[key] = [];
          }
          // History is used for charting, so always store a numeric
          // representation there (ON/1 -> 1, OFF/0 -> 0 via safeNumber/isActive
          // fallback), even though sensorData itself keeps the raw value.
          const rawVal = formatted[key].value;
          const numValue = typeof rawVal === 'string' && isNaN(parseFloat(rawVal))
            ? (isActive(rawVal) ? 1 : 0)
            : safeNumber(rawVal);
          newHistory[key].push({
            time: new Date().toISOString(),
            value: numValue
          });
          if (newHistory[key].length > MAX_HISTORY_POINTS) {
            newHistory[key] = newHistory[key].slice(-MAX_HISTORY_POINTS);
          }
        });
        return newHistory;
      });

      try {
        const mqttStatus = await api.getMqttStatus();
        setConnected(mqttStatus.connected || false);
        setSimulationMode(mqttStatus.simulationMode || false);
      } catch (err) {
        console.warn('Could not fetch MQTT status:', err);
      }

      updateAlerts();
      setDataInitialized(true);
      setRetryCount(0);
      
    } catch (err) {
      console.error('Failed to fetch real data:', err);
      setError(err.message || 'Failed to connect to backend');
      setRetryCount(prev => prev + 1);
      setDataInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  // ==================== INITIALIZE ====================
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ Dashboard connected to backend');
      setConnected(true);
      fetchRealData();
    });

    socket.on('disconnect', () => {
      console.log('❌ Dashboard disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setError('WebSocket connection failed - check if backend is running');
      fetchRealData();
    });

    socket.on('plc-data', (data) => {
      const shortName = toShortName(data.parameter);
      const info = getSensorInfo(data.parameter);
      const timestamp = data.timestamp || new Date().toISOString();

      // ✅ FIX: only coerce numeric readings to a number. Bit/boolean
      // parameters (dosing status, system operation/mode) come through with
      // dataType: 'bit' and a value of "ON"/"OFF" from the backend — running
      // safeNumber() on those turns them into 0 and silently breaks
      // isActive()/isDosingActive on every live update after the first fetch.
      const value = data.dataType === 'bit' ? data.value : safeNumber(data.value);

      setSensorData(prev => ({
        ...prev,
        [shortName]: {
          value,
          timestamp,
          simulated: data.simulated || false,
          unit: data.unit || info.unit,
          label: info.label,
        }
      }));

      setHistory(prev => {
        const existing = prev[shortName] || [];
        // History is for charts — always store a numeric representation,
        // converting ON/OFF to 1/0, regardless of dataType.
        const historyValue = data.dataType === 'bit' ? (isActive(data.value) ? 1 : 0) : value;
        const updated = [...existing, { time: timestamp, value: historyValue }].slice(-MAX_HISTORY_POINTS);
        return { ...prev, [shortName]: updated };
      });

      setLastUpdate(timestamp);
      setTimeout(() => updateAlerts(), 100);
    });

    socket.on('plc-alarm', (alarmData) => {
      const newAlarms = alarmData.alarms.map(alarm => ({
        id: `${alarm.parameter}-${Date.now()}-${Math.random()}`,
        type: alarm.message || 'Alarm',
        equipment: `RO5 - ${alarm.parameter}`,
        severity: alarm.severity === 'high' ? 'Critical' :
                alarm.severity === 'warning' ? 'High' : 'Medium',
        time: new Date().toLocaleTimeString(),
        status: 'Active',
        value: alarmData.value,
        isPowerProblem: alarm.parameter?.toLowerCase().includes('power') || false
      }));
      setAlarms(prev => [...newAlarms, ...prev].slice(0, 20));
    });

    socket.on('mqtt-status', (status) => {
      setConnected(status.connected || false);
      setSimulationMode(status.simulationMode || false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ==================== PERIODIC ALERT UPDATE ====================
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(sensorData).length > 0) {
        updateAlerts();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [sensorData]);

  // ==================== REFRESH ====================
  const handleRefresh = () => {
    fetchRealData();
  };

  // ==================== TOGGLE SENSOR ====================
  const toggleSensor = (key) => {
    setSelectedSensors([key]);
  };

  // ==================== GET VALUES ====================
  const feedFlow = getNumber('RO5-FEEDFlow');
  const permeateFlow = getNumber('RO5-Permeateflow');
  const concentrateFlow = getNumber('RO5-ConcetrateFlow');
  const roPressure = getNumber('RO5-ROPressure');
  const systemRecovery = getNumber('RO5-SystemRecovery');
  const pureWaterEC = getNumber('RO5-PureWaterEc');
  const stage1Delta = getNumber('RO5-Stage1Delta');
  const stage2Delta = getNumber('RO5-Stage2Delta');
  const filterDeltaP = getNumber('RO5-MediaFilterDeltaP');
  const interstagePress = getNumber('RO5-InterstagePress');
  const concentratePress = getNumber('RO5-ConcetratePress');
  const feedTankLevel = getNumber('RO5-FeedTankLevel');
  
  const systemOperation = getValue('RO5-SystemOperation');
  const systemMode = getValue('RO5-SystemMode');
  const dosingActive = getValue('RO5-AntiscalantDosingActive');
  
  // ✅ Better system detection - if data is flowing, system is ON
  const isSystemOn = isActive(systemOperation) || feedFlow > 5 || permeateFlow > 5;
  const isAutoMode = isActive(systemMode);
  // isActive() already covers 1 / 'ON' / true / etc. — no need to OR them in again.
  const isDosingActive = isActive(dosingActive);
  
  const dosingRate = isDosingActive ? 2.4 : 0;
  const dosingRuntime = isDosingActive ? 3.5 : 0;
  const totalDosed = dosingRuntime * dosingRate * 10;

  const dailyProduction = Math.round(dailyProductionM3);
  const activeSensors = Object.keys(sensorData).filter(
    key => sensorData[key]?.value !== undefined && sensorData[key]?.value !== null
  ).length;
  const totalSensors = 15;

  const chartData = { ...sensorData, history };

  // ==================== LOADING STATE ====================
  if (loading && !dataInitialized) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div style={{ color: "var(--muted-foreground)", textAlign: "center" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px", color: "#0ea5e9" }} />
          <p>Connecting to backend...</p>
          <p style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
            {retryCount > 0 ? `Retry ${retryCount}...` : 'Fetching real-time data...'}
          </p>
        </div>
      </div>
    );
  }

  // ==================== ERROR STATE ====================
  if (error && !dataInitialized) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div style={{ color: COLORS.danger, textAlign: "center", maxWidth: 500 }}>
          <AlertTriangle size={48} style={{ margin: "0 auto 16px" }} />
          <p style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>No Data Available</p>
          <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>
            {error}
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>
            Make sure the backend server is running at {API_BASE_URL}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRefresh}
              style={{
                padding: "10px 24px", borderRadius: 6, background: "#0ea5e9",
                border: "none", color: "white",
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                fontWeight: 600
              }}
            >
              <RefreshCw size={16} />
              Retry Connection
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 24px", borderRadius: 6, background: "var(--card)",
                border: "1px solid var(--border)", color: "var(--foreground)",
                cursor: "pointer"
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isDataStale = lastUpdate && (Date.now() - new Date(lastUpdate).getTime() > 60000);

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full">

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 rounded" style={{
        background: connected ? (simulationMode ? '#1e293b' : '#064e3b20') : '#450a0a20',
        border: `1px solid ${connected ? (simulationMode ? '#334155' : '#064e3b40') : '#450a0a40'}`,
      }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? (simulationMode ? COLORS.warning : COLORS.success) : COLORS.danger,
            boxShadow: connected ? `0 0 8px ${simulationMode ? '#f59e0b80' : '#22c55e80'}` : 'none'
          }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: connected ? (simulationMode ? COLORS.warning : COLORS.success) : COLORS.danger }}>
            {connected ? (simulationMode ? '🎮 SIMULATION MODE' : '📡 LIVE DATA') : '🔴 DISCONNECTED'}
          </span>
          {isDataStale && (
            <span style={{ fontSize: 9, color: COLORS.warning }}>
              ⚠️ Data stale ({Math.round((Date.now() - new Date(lastUpdate).getTime()) / 1000)}s)
            </span>
          )}
          {!connected && dataInitialized && (
            <span style={{ fontSize: 9, color: COLORS.danger }}>
              Showing cached data - reconnecting...
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              padding: '4px 12px', borderRadius: 4, background: 'var(--secondary)',
              border: '1px solid var(--border)', color: 'var(--foreground)',
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: 10, 
              display: 'flex', alignItems: 'center', gap: 4,
              opacity: loading ? 0.5 : 1
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: COLORS.primary }}>{activeSensors}</span>/{totalSensors} sensors
          </span>
          {lastUpdate && (
            <span style={{ fontSize: 10, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
              Updated: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* System Status Row - FIXED */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <SystemStatus isOn={isSystemOn} label="System Operation" icon={Power} />
        <SystemStatus isOn={isAutoMode} label="System Mode" icon={Power} />
        
        {/* ✅ FIXED: Feed Tank - Show actual level */}
        <div className="flex items-center gap-2 rounded p-2" style={{ 
          background: feedTankLevel > 30 ? 'rgba(34,197,94,0.1)' : feedTankLevel > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${feedTankLevel > 30 ? 'rgba(34,197,94,0.2)' : feedTankLevel > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          <Droplets size={16} style={{ color: feedTankLevel > 30 ? COLORS.success : feedTankLevel > 0 ? COLORS.warning : COLORS.danger }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: feedTankLevel > 30 ? COLORS.success : feedTankLevel > 0 ? COLORS.warning : COLORS.danger }}>
            Feed Tank: {feedTankLevel > 0 ? `${safeFormat(feedTankLevel, 0)}%` : '⚠️ NO DATA'}
            {feedTankLevel > 0 && feedTankLevel < 30 && ' ⚠️ LOW'}
          </span>
        </div>
        
        <SystemStatus isOn={isDosingActive} label="Dosing Active" icon={FlaskConical} />
      </div>

      {/* ============================================================
          KPI Grid - COMPLETE FIX WITH PROPER THRESHOLDS
          ============================================================ */}
      <div>
        <SectionTitle>Real-Time Key Performance Indicators</SectionTitle>
        
        {/* Row 1: Water Flows + Pressures - 6 columns */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
          <KPICard label="Feed Flow" value={safeFormat(feedFlow, 1)} unit="m³/h" icon={Droplets}
            trend={feedFlow > 50 ? "up" : feedFlow < 40 ? "down" : "flat"}
            trendValue={feedFlow > 50 ? "Normal" : feedFlow > 0 ? "Check flow" : "No flow"} 
            color={feedFlow > 40 ? COLORS.success : feedFlow > 0 ? COLORS.warning : COLORS.danger} />
            
          <KPICard label="Permeate Flow" value={safeFormat(permeateFlow, 1)} unit="m³/h" icon={Droplets}
            trend={permeateFlow > 30 ? "up" : permeateFlow > 0 ? "down" : "flat"}
            trendValue={permeateFlow > 30 ? "Normal" : permeateFlow > 0 ? "Low" : "No flow"} 
            color={permeateFlow > 30 ? COLORS.success : permeateFlow > 0 ? COLORS.warning : COLORS.danger} />
            
          <KPICard label="Concentrate Flow" value={safeFormat(concentrateFlow, 1)} unit="m³/h" icon={Activity}
            trend={concentrateFlow > 15 ? "up" : "down"}
            trendValue={concentrateFlow > 15 ? "Normal" : "Low"} 
            color={concentrateFlow > 15 ? COLORS.success : COLORS.warning} />
            
          {/* ✅ FIXED: RO Pressure - Safe range 8-16 bar, NOT LOW at 11.3 */}
          <KPICard label="RO Pressure" value={safeFormat(roPressure, 1)} unit="bar" icon={Gauge}
            trend={roPressure >= 8 && roPressure <= 16 ? "flat" : roPressure > 16 ? "up" : "down"}
            trendValue={
              roPressure >= 8 && roPressure <= 16 ? "✅ Normal" : 
              roPressure > 16 ? "⚠️ High" : 
              roPressure > 0 && roPressure < 8 ? "⚠️ Low" : 
              "---"
            } 
            color={
              roPressure >= 8 && roPressure <= 16 ? COLORS.success :
              roPressure > 16 ? COLORS.danger :
              roPressure > 0 && roPressure < 8 ? COLORS.warning :
              COLORS.primary
            } />
            
          <KPICard label="Stage 1 Delta P" value={safeFormat(stage1Delta, 2)} unit="bar" icon={Zap}
            trend={stage1Delta > 0.55 ? "up" : "flat"}
            trendValue={stage1Delta > 0.55 ? "Check membranes" : stage1Delta > 0 ? "Normal" : "---"} 
            color={stage1Delta > 0.55 ? COLORS.danger : stage1Delta > 0 ? COLORS.success : COLORS.primary} />
            
          <KPICard label="Stage 2 Delta P" value={safeFormat(stage2Delta, 2)} unit="bar" icon={Zap}
            trend={stage2Delta > 0.50 ? "up" : "flat"}
            trendValue={stage2Delta > 0.50 ? "Check stage 2" : stage2Delta > 0 ? "Normal" : "---"} 
            color={stage2Delta > 0.50 ? COLORS.warning : stage2Delta > 0 ? COLORS.success : COLORS.primary} />
        </div>
        
        {/* Row 2: Filter Delta P + System Recovery + Other KPIs - 5 columns */}
        <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <KPICard label="Filter Delta P" value={safeFormat(filterDeltaP, 2)} unit="bar" icon={Filter}
            trend={filterDeltaP > 0.4 ? "up" : "flat"}
            trendValue={filterDeltaP > 0.4 ? "Check filters" : filterDeltaP > 0 ? "Normal" : "---"} 
            color={filterDeltaP > 0.4 ? COLORS.danger : filterDeltaP > 0 ? COLORS.success : COLORS.primary} />
            
          <KPICard label="System Recovery" value={safeFormat(systemRecovery, 1)} unit="%" icon={Activity}
            trend={systemRecovery > 75 ? "up" : systemRecovery > 0 ? "down" : "flat"}
            trendValue={systemRecovery > 75 ? "Good" : systemRecovery > 0 ? "Check system" : "---"} 
            color={systemRecovery > 75 ? COLORS.success : systemRecovery > 0 ? COLORS.warning : COLORS.primary} />
            
          <KPICard label="Product Water EC" value={safeFormat(pureWaterEC, 0)} unit="µS/cm" icon={FlaskConical}
            trend={pureWaterEC > 150 ? "up" : "flat"}
            trendValue={pureWaterEC > 150 ? "High conductivity" : pureWaterEC > 0 ? "Within limits" : "---"} 
            color={pureWaterEC > 150 ? COLORS.danger : pureWaterEC > 0 ? COLORS.success : COLORS.primary} />
            
          <KPICard label="Daily Production" value={dailyProduction.toLocaleString()} unit="m³" icon={Droplets}
            trend={permeateFlow > 45 ? "up" : permeateFlow < 35 ? "down" : "flat"}
            trendValue={`${safeFormat(permeateFlow, 1)} m³/h now`} 
            color={dailyProduction > 0 ? COLORS.success : COLORS.primary} />
            
          <KPICard label="Active Alarms" value={alarms.filter(a => a.status === 'Active').length} icon={AlertTriangle}
            trend={alarms.length > 0 ? "up" : "down"}
            trendValue={alarms.length > 0 ? `${alarms.filter(a => a.severity === 'Critical').length} critical` : "All systems normal"}
            color={alarms.length > 0 ? COLORS.danger : COLORS.success} />
        </div>
      </div>

      {/* Dosing Runtime Card */}
      <DosingRuntimeCard 
        isActive={isDosingActive}
        rate={dosingRate}
        runtimeHours={dosingRuntime}
        totalDosed={totalDosed}
      />

      {/* Pressure Monitoring Row */}
      <div>
        <SectionTitle>Pressure Monitoring</SectionTitle>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <KPICard label="Interstage Pressure" value={safeFormat(interstagePress, 1)} unit="bar" icon={Gauge} 
            color={interstagePress >= 8 && interstagePress <= 14 ? COLORS.success : interstagePress > 14 ? COLORS.danger : COLORS.warning} 
            sub="Between stages" />
          <KPICard label="Concentrate Pressure" value={safeFormat(concentratePress, 1)} unit="bar" icon={Gauge} 
            color={concentratePress >= 7 && concentratePress <= 13 ? COLORS.success : concentratePress > 13 ? COLORS.danger : COLORS.warning} 
            sub="Reject stream" />
          <KPICard label="Stage 2 Delta P" value={safeFormat(stage2Delta, 2)} unit="bar" icon={Zap} color="#14b8a6"
            sub={stage2Delta > 0.50 ? "Check stage 2" : "Normal"} />
          <KPICard label="Concentrate Flow" value={safeFormat(concentrateFlow, 1)} unit="m³/h" icon={Activity} color={COLORS.warning}
            sub={`${safeFormat((concentrateFlow / (feedFlow || 1)) * 100, 1)}% of feed`} />
        </div>
      </div>

      {/* Live trend + system health */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <LiveTrendChart data={chartData} sensorKey={selectedSensors[0] || 'RO5-Permeateflow'} height={220} />
        <SystemHealthRadar data={sensorData} />
      </div>

      {/* Sensor Selector */}
      <div>
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
            Select Sensor for Comparison
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.keys(SENSOR_MAP).map(key => {
              const sensor = SENSOR_MAP[key];
              const isSelected = selectedSensors.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleSensor(key)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    background: isSelected ? sensor.color : 'var(--secondary)',
                    color: isSelected ? 'white' : 'var(--muted-foreground)',
                    border: isSelected ? `2px solid ${sensor.color}` : '1px solid var(--border)',
                    fontSize: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: isSelected ? 600 : 400,
                    opacity: isSelected ? 1 : 0.7,
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  {sensor.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Flow balance, distribution, live alerts */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <FlowBalanceChart data={sensorData} />
        <DistributionHistogram data={chartData} sensorKey="RO5-ROPressure" />
        <AlarmsCard alarms={alarms} />
      </div>

      {/* Second distribution view */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <DistributionHistogram data={chartData} sensorKey="RO5-FEEDFlow" />
        <DistributionHistogram data={chartData} sensorKey="RO5-Permeateflow" />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;