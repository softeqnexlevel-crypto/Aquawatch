// components/Dashboard.jsx - WITH LIVETRENDCHART & NO TOPNAV

import React, { useState, useEffect, useMemo } from 'react';
import {
  Droplets, Activity, FlaskConical, AlertTriangle,
  CheckCircle, Gauge, Zap, Filter, TrendingUp, TrendingDown,
  Minus, RefreshCw, Power, Clock, AlertCircle, Settings,
  User, ChevronDown, Wrench, Sun, ShieldCheck, Radio
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

// Import custom chart components
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
  dark: '#0f172a',
  card: '#1e293b',
  border: '#334155',
  muted: '#64748b',
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
  'RO5-SystemMode': { label: 'System Mode', unit: '', icon: Power, color: COLORS.success, shortName: 'SystemMode' },
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
    label: shortName, unit: '', icon: Activity, color: '#4d7a9e', shortName,
  };
}

const MAX_HISTORY_POINTS = 500;

/* ============================================================
  Derived metrics
  ============================================================ */

function getTrend(history, key, windowMs = 5 * 60 * 1000) {
  const arr = history[key];
  if (!arr || arr.length < 2) return null;
  const latest = arr[arr.length - 1];
  const latestTime = new Date(latest.time).getTime();
  const cutoff = latestTime - windowMs;
  let ref = arr[0];
  for (let i = 0; i < arr.length; i++) {
    if (new Date(arr[i].time).getTime() >= cutoff) { ref = arr[i]; break; }
  }
  if (ref === latest || ref.value === 0 || ref.value === null || ref.value === undefined) return null;
  const pct = ((latest.value - ref.value) / Math.abs(ref.value)) * 100;
  if (!isFinite(pct)) return null;
  return { pct, direction: pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat' };
}

function computeHealthScore(alarms) {
  let score = 100;
  alarms.filter(a => a.status === 'Active').forEach(a => {
    if (a.severity === 'Critical') score -= 15;
    else if (a.severity === 'High') score -= 10;
    else if (a.severity === 'Medium') score -= 5;
  });
  return Math.max(0, Math.min(100, score));
}

const RANGE_OPTIONS = [
  { key: '1H', ms: 60 * 60 * 1000 },
  { key: '6H', ms: 6 * 60 * 60 * 1000 },
  { key: '24H', ms: 24 * 60 * 60 * 1000 },
  { key: '7D', ms: 7 * 24 * 60 * 60 * 1000 },
  { key: '30D', ms: 30 * 24 * 60 * 60 * 1000 },
];

/* ============================================================
  UI Components
  ============================================================ */

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
      {children}
    </h2>
  );
}

function CircularGauge({ value, size = 88, strokeWidth = 7, color, label, statusLabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const actualSize = isMobile ? 64 : size;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: isMobile ? 4 : 6 }}>
      <div style={{ position: "relative", width: actualSize, height: actualSize }}>
        <svg width={actualSize} height={actualSize} viewBox={`0 0 ${actualSize} ${actualSize}`}>
          <circle cx={actualSize / 2} cy={actualSize / 2} r={(actualSize - strokeWidth) / 2} stroke="var(--border)" strokeWidth={strokeWidth * (isMobile ? 0.7 : 1)} fill="none" />
          <circle
            cx={actualSize / 2} cy={actualSize / 2} r={(actualSize - strokeWidth) / 2}
            stroke={color} strokeWidth={strokeWidth * (isMobile ? 0.7 : 1)} fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            transform={`rotate(-90 ${actualSize / 2} ${actualSize / 2})`}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: actualSize * 0.22, color }}>{Math.round(clamped)}%</span>
        </div>
      </div>
      <div style={{ fontSize: isMobile ? 8 : 10, color: "var(--muted-foreground)", textAlign: "center" }}>{label}</div>
      {statusLabel && <div style={{ fontSize: isMobile ? 8 : 10, fontWeight: 700, color }}>{statusLabel}</div>}
    </div>
  );
}

function TopStatusCard({ icon: Icon, iconBg, iconColor, title, value, valueColor, sub, subColor, gauge, action }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  return (
    <div className="rounded-lg p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div style={{ display: "flex", gap: isMobile ? 8 : 12, alignItems: "flex-start" }}>
        {Icon && (
          <div style={{ width: isMobile ? 30 : 38, height: isMobile ? 30 : 38, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={isMobile ? 14 : 17} color={iconColor} />
          </div>
        )}
        <div>
          <div style={{ fontSize: isMobile ? 9 : 11, color: "var(--muted-foreground)", marginBottom: 2 }}>{title}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: valueColor || "var(--foreground)", lineHeight: 1.1 }}>{value}</div>
          {sub && <div style={{ fontSize: isMobile ? 9 : 10.5, color: subColor || "var(--muted-foreground)", marginTop: 2 }}>{sub}</div>}
          {action}
        </div>
      </div>
      {gauge}
    </div>
  );
}

function KPICardV2({ label, value, unit, icon: Icon, color, trend, statusText, statusOk }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const TrendIcon = !trend ? Minus : trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;
  const trendColor = !trend ? "var(--muted-foreground)" : trend.direction === "up" ? COLORS.success : trend.direction === "down" ? COLORS.danger : "var(--muted-foreground)";
  
  return (
    <div className="rounded-lg p-2 sm:p-3 flex flex-col gap-1 sm:gap-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 6 }}>
          {Icon && <Icon size={isMobile ? 10 : 13} style={{ color }} />}
          <span style={{ fontSize: isMobile ? 8 : 10.5, color: "var(--muted-foreground)", fontWeight: 600 }}>{label}</span>
        </div>
        {unit && <span style={{ fontSize: isMobile ? 7 : 9, color: "var(--muted-foreground)", background: "var(--secondary)", padding: "1px 5px", borderRadius: 4 }}>{unit}</span>}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: isMobile ? 18 : 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div className="flex items-center justify-between">
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TrendIcon size={isMobile ? 9 : 11} style={{ color: trendColor }} />
          <span style={{ fontSize: isMobile ? 8 : 10, color: trendColor, fontFamily: "var(--font-mono)" }}>{trend ? `${trend.pct > 0 ? '+' : ''}${trend.pct.toFixed(1)}%` : '—'}</span>
        </div>
        {statusText && (
          <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: isMobile ? 8 : 10, color: statusOk ? COLORS.success : COLORS.warning }}>
            {statusOk ? <CheckCircle size={isMobile ? 8 : 10} /> : <AlertCircle size={isMobile ? 8 : 10} />}
            {statusText}
          </div>
        )}
      </div>
    </div>
  );
}

function EquipmentStatusItem({ icon: Icon, label, state }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const color = state === 'on' ? COLORS.success : state === 'off' ? COLORS.danger : 'var(--muted-foreground)';
  const bg = state === 'on' ? 'rgba(34,197,94,0.1)' : state === 'off' ? 'rgba(239,68,68,0.1)' : 'var(--secondary)';
  const text = state === 'on' ? 'Running' : state === 'off' ? 'Stopped' : 'No data';
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, padding: isMobile ? "6px 8px" : "8px 10px", borderRadius: 8, background: bg, border: `1px solid ${color}30` }}>
      <div style={{ width: isMobile ? 22 : 26, height: isMobile ? 22 : 26, borderRadius: 6, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={isMobile ? 11 : 13} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? 9 : 10.5, color: "var(--foreground)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
        <div style={{ fontSize: isMobile ? 8 : 9.5, color, fontWeight: 600 }}>{text}</div>
      </div>
    </div>
  );
}

function RecentAlarmItem({ alarm }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const color = alarm.severity === "Critical" ? COLORS.danger :
    alarm.severity === "High" ? COLORS.orange :
      alarm.severity === "Medium" ? COLORS.yellow :
        alarm.severity === "Info" ? COLORS.success : COLORS.primary;
  
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: isMobile ? 6 : 8, padding: isMobile ? "6px 8px" : "8px 10px", borderRadius: 8, background: "var(--secondary)", border: `1px solid ${color}25` }}>
      <AlertTriangle size={isMobile ? 11 : 13} style={{ color, marginTop: 1, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? 9 : 11, fontWeight: 600, color: "var(--foreground)" }}>{alarm.type}</div>
        <div style={{ fontSize: isMobile ? 8 : 9.5, color: "var(--muted-foreground)" }}>
          {alarm.time} {alarm.value ? `· ${alarm.equipment.split(' - ')[1] || alarm.equipment} has exceeded limit (${alarm.value})` : `· ${alarm.equipment}`}
        </div>
      </div>
      <span style={{ fontSize: isMobile ? 7 : 8.5, fontWeight: 700, color: 'white', background: color, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>
        {alarm.severity}
      </span>
    </div>
  );
}

/* ============================================================
  API service
  ============================================================ */

const api = {
  getCurrentReadings: async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/current`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  getMqttStatus: async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/mqtt-status`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  getAlarms: async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/alarms`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  getProductionSummary: async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/production-summary`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
};

/* ============================================================
  Dashboard Component
  ============================================================ */

export function Dashboard() {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState({});
  const [history, setHistory] = useState({});
  const [connected, setConnected] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [trendRange, setTrendRange] = useState('1H');
  const [selectedSensors, setSelectedSensors] = useState(['RO5-Permeateflow']);
  const [isMobile, setIsMobile] = useState(false);

  const [productionSummary, setProductionSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchProductionSummary = async () => {
    try {
      const data = await api.getProductionSummary();
      setProductionSummary(data);
      setSummaryLoading(false);
    } catch (err) {
      console.error('Failed to fetch production summary:', err);
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionSummary();
    const interval = setInterval(fetchProductionSummary, 60000);
    return () => clearInterval(interval);
  }, []);

  const getValue = (key) => {
    const val = sensorData[key]?.value;
    return val !== undefined && val !== null ? val : 0;
  };
  const getNumber = (key) => safeNumber(getValue(key));

  const dailyProduction = productionSummary?.permeate?.daily ?? 0;

  const generateAlerts = () => {
    const newAlerts = [];
    let id = 1;
    const now = new Date();
    const addAlert = (type, severity, equipment, value, threshold, isPowerProblem = false) => {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type, severity, status: 'Active', equipment,
        value: typeof value === 'number' ? value.toFixed(1) : String(value),
        threshold, time: now.toLocaleTimeString(), date: now.toLocaleDateString(), isPowerProblem,
      });
    };

    const isSystemOnLocal = isActive(getValue('RO5-SystemOperation'));
    if (!isSystemOnLocal) addAlert('Power Problem - System Offline', 'Critical', 'RO5 - SystemOperation', 'OFF', 'ON required', true);

    const roPressure = getNumber('RO5-ROPressure');
    if (roPressure > 16 && roPressure > 0) addAlert('High RO Pressure', 'Critical', 'RO5 - ROPressure', roPressure, '> 16 bar');

    const stage1Delta = getNumber('RO5-Stage1Delta');
    if (stage1Delta > 0.60 && stage1Delta > 0) addAlert('High Differential Pressure - Stage 1', 'Critical', 'RO5 - Stage1Delta', stage1Delta, '> 0.60 bar');
    else if (stage1Delta > 0.50 && stage1Delta > 0) addAlert('High Differential Pressure - Stage 1', 'High', 'RO5 - Stage1Delta', stage1Delta, '> 0.50 bar');

    const stage2Delta = getNumber('RO5-Stage2Delta');
    if (stage2Delta > 0.55 && stage2Delta > 0) addAlert('High Differential Pressure - Stage 2', 'High', 'RO5 - Stage2Delta', stage2Delta, '> 0.55 bar');

    const filterDeltaP = getNumber('RO5-MediaFilterDeltaP');
    if (filterDeltaP > 0.40 && filterDeltaP > 0) addAlert('High Filter Delta P', 'Critical', 'RO5 - MediaFilterDeltaP', filterDeltaP, '> 0.40 bar');
    else if (filterDeltaP > 0.30 && filterDeltaP > 0) addAlert('High Filter Delta P', 'Medium', 'RO5 - MediaFilterDeltaP', filterDeltaP, '> 0.30 bar');

    const systemRecovery = getNumber('RO5-SystemRecovery');
    if (systemRecovery < 68 && systemRecovery > 0) addAlert('Low System Recovery', 'Critical', 'RO5 - SystemRecovery', systemRecovery, '< 68%');
    else if (systemRecovery < 72 && systemRecovery > 0) addAlert('Low System Recovery', 'Medium', 'RO5 - SystemRecovery', systemRecovery, '< 72%');

    const feedTankLevel = getNumber('RO5-FeedTankLevel');
    if (feedTankLevel < 20 && feedTankLevel > 0) addAlert('Low Feed Tank Level', 'Critical', 'RO5 - FeedTankLevel', feedTankLevel, '< 20%');
    else if (feedTankLevel < 30 && feedTankLevel > 0) addAlert('Low Feed Tank Level', 'Medium', 'RO5 - FeedTankLevel', feedTankLevel, '< 30%');

    const feedFlow = getNumber('RO5-FEEDFlow');
    if (feedFlow < 50 && feedFlow > 0) addAlert('Low Feed Flow', 'High', 'RO5 - FEEDFlow', feedFlow, '< 50 m³/h');

    const pureWaterEC = getNumber('RO5-PureWaterEc');
    if (pureWaterEC > 50 && pureWaterEC > 0) addAlert('High Product Water EC', 'Medium', 'RO5 - PureWaterEc', pureWaterEC, '> 50 µS/cm');

    if (newAlerts.length === 0) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`, type: 'All Systems Operating Normally', severity: 'Info',
        status: 'Acknowledged', equipment: 'RO5 - System Health', value: 'All systems go', threshold: 'N/A',
        time: now.toLocaleTimeString(), date: now.toLocaleDateString(), isPowerProblem: false,
      });
    }
    return newAlerts;
  };

  const updateAlerts = () => setAlarms(generateAlerts());

  const fetchRealData = async () => {
    try {
      setLoading(true);
      setError(null);
      const readings = await api.getCurrentReadings();
      if (!readings || Object.keys(readings).length === 0) throw new Error('No data received from backend');

      const formatted = {};
      Object.entries(readings).forEach(([key, value]) => {
        const shortName = toShortName(key);
        const info = getSensorInfo(key);
        formatted[shortName] = { value, timestamp: new Date().toISOString(), simulated: false, unit: info.unit, label: info.label };
      });
      setSensorData(formatted);
      setLastUpdate(new Date().toISOString());

      setHistory(prev => {
        const newHistory = { ...prev };
        Object.keys(formatted).forEach(key => {
          if (!newHistory[key]) newHistory[key] = [];
          const rawVal = formatted[key].value;
          const numValue = typeof rawVal === 'string' && isNaN(parseFloat(rawVal)) ? (isActive(rawVal) ? 1 : 0) : safeNumber(rawVal);
          newHistory[key].push({ time: new Date().toISOString(), value: numValue });
          if (newHistory[key].length > MAX_HISTORY_POINTS) newHistory[key] = newHistory[key].slice(-MAX_HISTORY_POINTS);
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

  // WebSocket connection
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'], 
      reconnection: true, 
      reconnectionAttempts: 5, 
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => { 
      setConnected(true); 
      fetchRealData(); 
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => { 
      console.error('WebSocket connection error:', err); 
      setError('WebSocket connection failed - check if backend is running'); 
      fetchRealData(); 
    });

    socket.on('plc-data', (data) => {
      const shortName = toShortName(data.parameter);
      const info = getSensorInfo(data.parameter);
      const timestamp = data.timestamp || new Date().toISOString();
      const value = data.dataType === 'bit' ? data.value : safeNumber(data.value);

      setSensorData(prev => ({ 
        ...prev, 
        [shortName]: { value, timestamp, simulated: data.simulated || false, unit: data.unit || info.unit, label: info.label } 
      }));

      setHistory(prev => {
        const existing = prev[shortName] || [];
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
        type: alarm.message || 'Alarm', equipment: `RO5 - ${alarm.parameter}`,
        severity: alarm.severity === 'high' ? 'Critical' : alarm.severity === 'warning' ? 'High' : 'Medium',
        time: new Date().toLocaleTimeString(), status: 'Active', value: alarmData.value,
        isPowerProblem: alarm.parameter?.toLowerCase().includes('power') || false,
      }));
      setAlarms(prev => [...newAlarms, ...prev].slice(0, 20));
    });

    socket.on('mqtt-status', (status) => { 
      setConnected(status.connected || false); 
      setSimulationMode(status.simulationMode || false); 
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { 
      if (Object.keys(sensorData).length > 0) updateAlerts(); 
    }, 10000);
    return () => clearInterval(interval);
  }, [sensorData]);

  const handleRefresh = () => { 
    fetchRealData(); 
    fetchProductionSummary(); 
  };

  // ==================== VALUES ====================
  const feedFlow = getNumber('RO5-FEEDFlow');
  const permeateFlow = getNumber('RO5-Permeateflow');
  const concentrateFlow = getNumber('RO5-ConcetrateFlow');
  const roPressure = getNumber('RO5-ROPressure');
  const systemRecovery = getNumber('RO5-SystemRecovery');
  const pureWaterEC = getNumber('RO5-PureWaterEc');
  const stage1Delta = getNumber('RO5-Stage1Delta');
  const stage2Delta = getNumber('RO5-Stage2Delta');
  const filterDeltaP = getNumber('RO5-MediaFilterDeltaP');
  const feedTankLevel = getNumber('RO5-FeedTankLevel');
  const systemOperation = getValue('RO5-SystemOperation');
  const systemMode = getValue('RO5-SystemMode');
  const dosingActive = getValue('RO5-AntiscalantDosingActive');

  const isSystemOn = isActive(systemOperation) || feedFlow > 5 || permeateFlow > 5;
  const isAutoMode = isActive(systemMode);
  const isDosingOn = isActive(dosingActive);

  const dailyProdDisplay = summaryLoading ? '...' : Math.round(dailyProduction).toLocaleString();
  const activeSensors = Object.keys(sensorData).filter(key => sensorData[key]?.value !== undefined && sensorData[key]?.value !== null).length;
  const totalSensors = 15;

  const activeAlarmsList = alarms.filter(a => a.status === 'Active');
  const criticalAlarmsCount = activeAlarmsList.filter(a => a.severity === 'Critical').length;
  const roHealthScore = computeHealthScore(alarms);

  // ==================== LOADING / ERROR STATES ====================
  if (loading && !dataInitialized) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div style={{ color: "var(--muted-foreground)", textAlign: "center" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px", color: COLORS.primary }} />
          <p>Connecting to backend...</p>
          <p style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>{retryCount > 0 ? `Retry ${retryCount}...` : 'Fetching real-time data...'}</p>
        </div>
      </div>
    );
  }

  if (error && !dataInitialized) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div style={{ color: COLORS.danger, textAlign: "center", maxWidth: 500 }}>
          <AlertTriangle size={48} style={{ margin: "0 auto 16px" }} />
          <p style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>No Data Available</p>
          <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>{error}</p>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>Make sure the backend server is running at {API_BASE_URL}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleRefresh} style={{ padding: "10px 24px", borderRadius: 6, background: COLORS.primary, border: "none", color: "white", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
              <RefreshCw size={16} /> Retry Connection
            </button>
            <button onClick={() => window.location.reload()} style={{ padding: "10px 24px", borderRadius: 6, background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", cursor: "pointer" }}>
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto" style={{ background: 'var(--background)' }}>
      
      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-4">

        {/* Status Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3 sm:mb-4 p-2 sm:p-3 rounded" style={{ 
          background: connected ? (simulationMode ? '#1e293b' : 'rgba(34,197,94,0.05)') : 'rgba(239,68,68,0.05)',
          border: `1px solid ${connected ? (simulationMode ? '#334155' : 'rgba(34,197,94,0.15)') : 'rgba(239,68,68,0.15)'}` 
        }}>
          <div className="flex items-center gap-3 flex-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ 
                width: 8, height: 8, borderRadius: '50%',
                background: connected ? (simulationMode ? COLORS.warning : COLORS.success) : COLORS.danger,
                boxShadow: connected ? `0 0 8px ${simulationMode ? '#f59e0b80' : '#22c55e80'}` : 'none'
              }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: connected ? (simulationMode ? COLORS.warning : COLORS.success) : COLORS.danger }}>
                {connected ? (simulationMode ? 'SIMULATION MODE' : 'LIVE DATA') : 'DISCONNECTED'}
              </span>
              {connected && !simulationMode && (
                <span style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>· All systems online</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
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
                Updated: {new Date(lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* ── Top status cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <TopStatusCard
            icon={Settings} iconBg="rgba(34,197,94,0.12)" iconColor={COLORS.success}
            title="System Operation" value={isSystemOn ? "ON" : "OFF"} valueColor={isSystemOn ? COLORS.success : COLORS.danger}
            sub={isSystemOn ? "All systems normal" : "System offline"} subColor="var(--muted-foreground)"
          />
          <TopStatusCard
            icon={Settings} iconBg="rgba(14,165,233,0.12)" iconColor={COLORS.primary}
            title="System Mode" value={isAutoMode ? "AUTO" : "ON"} valueColor={isAutoMode ? COLORS.warning : COLORS.success}
            sub={isAutoMode ? "Automatic control" : "Standby Mode"} subColor="var(--muted-foreground)"
          />
          <TopStatusCard
            icon={Droplets} iconBg="rgba(14,165,233,0.12)" iconColor={COLORS.primary}
            title="Feed Tank Level" value="" gauge={<CircularGauge value={feedTankLevel} size={isMobile ? 56 : 64} strokeWidth={5} color={feedTankLevel > 30 ? COLORS.success : feedTankLevel > 0 ? COLORS.warning : COLORS.danger} label="" />}
          />
          <TopStatusCard
            icon={AlertTriangle} iconBg="rgba(239,68,68,0.12)" iconColor={COLORS.danger}
            title="Active Alarms" value={activeAlarmsList.length} valueColor={activeAlarmsList.length > 0 ? COLORS.danger : COLORS.success}
            sub={criticalAlarmsCount > 0 ? `${criticalAlarmsCount} Critical` : 'All clear'} subColor={criticalAlarmsCount > 0 ? COLORS.danger : COLORS.success}
          />
        </div>

        {/* ── KPI grid ── */}
        <div className="mb-3 sm:mb-4">
          <SectionTitle>Key Performance Indicators</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-3">
            <KPICardV2 label="Feed Flow" unit="m³/h" icon={Droplets} value={safeFormat(feedFlow, 1)}
              color={feedFlow > 40 ? COLORS.success : feedFlow > 0 ? COLORS.warning : COLORS.danger}
              trend={getTrend(history, 'FEEDFlow')} statusText={feedFlow > 40 ? "Normal" : feedFlow > 0 ? "Check" : "No flow"} statusOk={feedFlow > 40} />
            <KPICardV2 label="Permeate Flow" unit="m³/h" icon={Droplets} value={safeFormat(permeateFlow, 1)}
              color={permeateFlow > 30 ? COLORS.success : permeateFlow > 0 ? COLORS.warning : COLORS.danger}
              trend={getTrend(history, 'Permeateflow')} statusText={permeateFlow > 30 ? "Normal" : permeateFlow > 0 ? "Low" : "No flow"} statusOk={permeateFlow > 30} />
            <KPICardV2 label="System Recovery" unit="%" icon={Activity} value={safeFormat(systemRecovery, 1)}
              color={systemRecovery > 75 ? COLORS.success : systemRecovery > 0 ? COLORS.warning : COLORS.primary}
              trend={getTrend(history, 'SystemRecovery')} statusText={systemRecovery > 75 ? "Good" : systemRecovery > 0 ? "Check" : "—"} statusOk={systemRecovery > 75} />
            <KPICardV2 label="RO Pressure" unit="bar" icon={Gauge} value={safeFormat(roPressure, 1)}
              color={roPressure >= 8 && roPressure <= 16 ? COLORS.success : roPressure > 16 ? COLORS.danger : roPressure > 0 ? COLORS.warning : COLORS.primary}
              trend={getTrend(history, 'ROPressure')} statusText={roPressure >= 8 && roPressure <= 16 ? "Normal" : roPressure > 0 ? "Check" : "—"} statusOk={roPressure >= 8 && roPressure <= 16} />
            <KPICardV2 label="Concentrate Flow" unit="m³/h" icon={Activity} value={safeFormat(concentrateFlow, 1)}
              color={concentrateFlow > 15 ? COLORS.success : COLORS.warning}
              trend={getTrend(history, 'ConcentrateFlow')} statusText={concentrateFlow > 15 ? "Normal" : "Low"} statusOk={concentrateFlow > 15} />
            <KPICardV2 label="Filter Delta P" unit="bar" icon={Filter} value={safeFormat(filterDeltaP, 2)}
              color={filterDeltaP > 0.4 ? COLORS.danger : filterDeltaP > 0 ? COLORS.success : COLORS.primary}
              trend={getTrend(history, 'MediaFilterDeltaP')} statusText={filterDeltaP > 0.4 ? "Check" : filterDeltaP > 0 ? "Normal" : "—"} statusOk={filterDeltaP <= 0.4 && filterDeltaP > 0} />
            <KPICardV2 label="Stage 1 Delta P" unit="bar" icon={Zap} value={safeFormat(stage1Delta, 2)}
              color={stage1Delta > 0.55 ? COLORS.danger : stage1Delta > 0 ? COLORS.success : COLORS.primary}
              trend={getTrend(history, 'Stage1Delta')} statusText={stage1Delta > 0.55 ? "Check" : stage1Delta > 0 ? "Normal" : "—"} statusOk={stage1Delta <= 0.55 && stage1Delta > 0} />
            <KPICardV2 label="Stage 2 Delta P" unit="bar" icon={Zap} value={safeFormat(stage2Delta, 2)}
              color={stage2Delta > 0.50 ? COLORS.warning : stage2Delta > 0 ? COLORS.success : COLORS.primary}
              trend={getTrend(history, 'Stage2Delta')} statusText={stage2Delta > 0.50 ? "Check" : stage2Delta > 0 ? "Normal" : "—"} statusOk={stage2Delta <= 0.50 && stage2Delta > 0} />
            <KPICardV2 label="Product Water EC" unit="µS/cm" icon={FlaskConical} value={safeFormat(pureWaterEC, 0)}
              color={pureWaterEC > 150 ? COLORS.danger : pureWaterEC > 0 ? COLORS.success : COLORS.primary}
              trend={getTrend(history, 'PureWaterEC')} statusText={pureWaterEC > 150 ? "High" : pureWaterEC > 0 ? "Within limits" : "—"} statusOk={pureWaterEC <= 150 && pureWaterEC > 0} />
            <KPICardV2 label="Daily Production" unit="m³" icon={TrendingUp} value={dailyProdDisplay}
              color={dailyProduction > 0 ? COLORS.success : COLORS.primary}
              trend={getTrend(history, 'Permeateflow', 60 * 60 * 1000)} statusText={summaryLoading ? "Loading" : `${safeFormat(permeateFlow, 1)} m³/h now`} statusOk={true} />
          </div>
        </div>

        {/* ── Performance Trends using LiveTrendChart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="lg:col-span-2 rounded-lg p-3 sm:p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <LiveTrendChart 
              data={{ ...sensorData, history }} 
              sensorKey={selectedSensors[0] || 'RO5-Permeateflow'} 
              height={isMobile ? 180 : 220} 
            />
          </div>

          {/* System Status panel */}
          <div className="flex flex-col gap-3">
            <div className="rounded-lg p-3 sm:p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <SectionTitle>System Status</SectionTitle>
              <div className="flex justify-around">
                <CircularGauge value={feedTankLevel} color={feedTankLevel > 30 ? COLORS.success : COLORS.warning} label="Feed Tank" statusLabel={feedTankLevel > 30 ? "Normal" : "Low"} />
                <CircularGauge value={systemRecovery} color={systemRecovery > 75 ? COLORS.success : COLORS.warning} label="Recovery" statusLabel={systemRecovery > 75 ? "Good" : "Check"} />
                <CircularGauge value={roHealthScore} color={roHealthScore > 80 ? COLORS.success : roHealthScore > 50 ? COLORS.warning : COLORS.danger} label="RO Health" statusLabel={roHealthScore > 80 ? "Excellent" : roHealthScore > 50 ? "Fair" : "Poor"} />
              </div>

              <div style={{ marginTop: 12 }}>
                <SectionTitle>Equipment Status</SectionTitle>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <EquipmentStatusItem icon={Wrench} label="High Pressure Pump" state={isSystemOn ? 'on' : 'off'} />
                  <EquipmentStatusItem icon={Wrench} label="Booster Pump" state={isSystemOn ? 'on' : 'off'} />
                  <EquipmentStatusItem icon={FlaskConical} label="Dosing Pump" state={isDosingOn ? 'on' : 'off'} />
                  {/* <EquipmentStatusItem icon={Sun} label="UV System" state="unknown" /> */}
                </div>
              </div>
            </div>

            <div id="alarms-panel" className="rounded-lg p-3 sm:p-4 flex flex-col gap-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <SectionTitle>Recent Alarms</SectionTitle>
                <span style={{ fontSize: 10.5, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>View All →</span>
              </div>
              <div className="flex flex-col gap-1.5 sm:gap-2 max-h-[150px] overflow-auto">
                {activeAlarmsList.length > 0 ? activeAlarmsList.slice(0, isMobile ? 2 : 4).map(a => <RecentAlarmItem key={a.id} alarm={a} />) : (
                  <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>
                    <CheckCircle size={13} style={{ color: COLORS.success }} /> All systems operating normally
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Advanced Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <LiveTrendChart data={{ ...sensorData, history }} sensorKey={selectedSensors[0] || 'RO5-Permeateflow'} height={isMobile ? 180 : 220} />
          <SystemHealthRadar data={sensorData} />
        </div>

        {/* ── Sensor Selector ── */}
        <div className="mb-3 sm:mb-4">
          <div className="rounded-lg p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: isMobile ? 9 : 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
              Select Sensor for Comparison
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 4 : 8 }}>
              {Object.keys(SENSOR_MAP).slice(0, isMobile ? 8 : 15).map(key => {
                const sensor = SENSOR_MAP[key];
                const isSelected = selectedSensors.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedSensors([key])}
                    style={{
                      padding: isMobile ? '2px 8px' : '4px 12px',
                      borderRadius: isMobile ? 8 : 12,
                      background: isSelected ? sensor.color : 'var(--secondary)',
                      color: isSelected ? 'white' : 'var(--muted-foreground)',
                      border: isSelected ? `2px solid ${sensor.color}` : '1px solid var(--border)',
                      fontSize: isMobile ? 8 : 10,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: isSelected ? 600 : 400,
                      opacity: isSelected ? 1 : 0.7,
                    }}
                  >
                    {isMobile ? sensor.shortName || sensor.label : sensor.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Flow balance, distribution charts ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <FlowBalanceChart data={sensorData} />
          <DistributionHistogram data={{ ...sensorData, history }} sensorKey="RO5-ROPressure" />
          <DistributionHistogram data={{ ...sensorData, history }} sensorKey="RO5-FEEDFlow" />
        </div>

        {/* ── Footer ── */}
        <div style={{ 
          textAlign: "center", 
          padding: "12px 0", 
          borderTop: "1px solid var(--border)", 
          display: "flex", 
          justifyContent: "space-between", 
          fontSize: 10, 
          color: "var(--muted-foreground)",
          flexWrap: "wrap",
          gap: 8
        }}>
         
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </div>
  );
}

export default Dashboard;