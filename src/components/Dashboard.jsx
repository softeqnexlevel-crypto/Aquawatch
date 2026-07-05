import React, { useState, useEffect } from 'react';
import {
  Droplets, Activity, FlaskConical, AlertTriangle,
  CheckCircle, Gauge, Zap, Filter, TrendingUp, TrendingDown,
  Minus, RefreshCw, Power, Clock, AlertCircle
} from "lucide-react";
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

import { AdvancedGauge } from './dashboardComponents/AdvancedGauge';
import { LiveTrendChart } from './dashboardComponents/LiveTrendChart';
import { MultiSensorChart } from './dashboardComponents/MultiSensorChart';
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
   Sensor mapping — includes RO5- prefix sensors
   ============================================================ */

export const SENSOR_MAP = {
  // RO5 Sensors (from backend)
  'RO5-FEEDFlow': { label: 'Feed Flow', unit: 'm³/h', icon: Droplets, color: COLORS.primary, shortName: 'FEEDFlow' },
  'RO5-Permeateflow': { label: 'Permeate Flow', unit: 'm³/h', icon: Droplets, color: COLORS.secondary, shortName: 'Permeateflow' },
  'RO5-ConcetrateFlow': { label: 'Concentrate Flow', unit: 'm³/h', icon: Activity, color: COLORS.warning, shortName: 'ConcentrateFlow' },
  'RO5-ROPressure': { label: 'RO Pressure', unit: 'bar', icon: Gauge, color: COLORS.danger, shortName: 'ROPressure' },
  'RO5-InterstagePress': { label: 'Interstage Pressure', unit: 'bar', icon: Gauge, color: COLORS.orange, shortName: 'InterstagePress' },
  'RO5-ConcetratePress': { label: 'Concentrate Pressure', unit: 'bar', icon: Gauge, color: COLORS.yellow, shortName: 'ConcentratePress' },
  'RO5-Stage1Delta': { label: 'Stage 1 Delta P', unit: 'bar', icon: Zap, color: COLORS.success, shortName: 'Stage1Delta' },
  'RO5-Stage2Delta': { label: 'Stage 2 Delta P', unit: 'bar', icon: Zap, color: '#14b8a6', shortName: 'Stage2Delta' },
  'RO5-MediaFilterInPress': { label: 'Filter Inlet Pressure', unit: 'bar', icon: Filter, color: COLORS.purple, shortName: 'MediaFilterInPress' },
  'RO5-MediaFilterOutPress': { label: 'Filter Outlet Pressure', unit: 'bar', icon: Filter, color: COLORS.indigo, shortName: 'MediaFilterOutPress' },
  'RO5-MediaFilterDeltaP': { label: 'Filter Delta P', unit: 'bar', icon: Filter, color: '#7c3aed', shortName: 'MediaFilterDeltaP' },
  'RO5-SystemRecovery': { label: 'System Recovery', unit: '%', icon: Activity, color: COLORS.success, shortName: 'SystemRecovery' },
  'RO5-PureWaterEc': { label: 'Product Water EC', unit: 'µS/cm', icon: FlaskConical, color: COLORS.purple, shortName: 'PureWaterEC' },
  'RO5-FeedTankLevel': { label: 'Feed Tank Level', unit: '%', icon: Droplets, color: '#14b8a6', shortName: 'FeedTankLevel' },
  
  // System status sensors
  'RO5-SystemOperation': { label: 'System Operation', unit: '', icon: Power, color: COLORS.success, shortName: 'SystemOperation' },
  'RO5-SystemMode': { label: 'System Mode', unit: '', icon: Power, color: COLORS.primary, shortName: 'SystemMode' },
  'RO5-AntiscalantDosingActive': { label: 'Dosing Active', unit: '', icon: FlaskConical, color: COLORS.purple, shortName: 'DosingActive' },
};

// Map raw backend keys to short names
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
   KPICard Component
   ============================================================ */

function KPICard({ label, value, unit, icon: Icon, trend, trendValue, color, sub }) {
  const trendColor = trend === "up" ? COLORS.success : trend === "down" ? COLORS.danger : "#4d7a9e";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <div className="rounded p-3 flex flex-col gap-1" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
        {Icon && <Icon size={13} style={{ color: color || "var(--muted-foreground)" }} />}
      </div>
      <div className="flex items-end gap-1">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: color || "var(--foreground)", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginBottom: 2 }}>{unit}</span>}
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
            {rate.toFixed(2)} <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>mg/L</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Runtime</div>
          <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 700, color: COLORS.primary }}>
            {runtimeHours.toFixed(1)} <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>hrs</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Total Dosed</div>
          <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 700, color: COLORS.purple }}>
            {totalDosed.toFixed(1)} <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>mL</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Alarms Card with Power Problem
   ============================================================ */

function AlarmsCard({ alarms }) {
  const activeAlarms = alarms.filter(a => a.status === 'Active');
  const powerAlarms = activeAlarms.filter(a => a.type.toLowerCase().includes('power'));
  
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
      
      <div className="flex flex-col gap-1.5 flex-1 overflow-auto" style={{ scrollbarWidth: "none" }}>
        {activeAlarms.length > 0 ? activeAlarms.slice(0, 5).map((alert) => {
          const color = alert.severity === "Critical" ? COLORS.danger : 
                       alert.severity === "High" ? COLORS.orange : 
                       alert.severity === "Medium" ? COLORS.yellow : COLORS.primary;
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
   Dashboard
   ============================================================ */

export function Dashboard() {
  const [sensorData, setSensorData] = useState({});
  const [history, setHistory] = useState({});
  const [connected, setConnected] = useState(false);
  const [simulationMode, setSimulationMode] = useState(true);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedSensors, setSelectedSensors] = useState(['RO5-FEEDFlow', 'RO5-Permeateflow', 'RO5-ConcetrateFlow']);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const readings = await api.getCurrentReadings();

      const formatted = {};
      Object.entries(readings).forEach(([key, value]) => {
        const shortName = toShortName(key);
        const info = getSensorInfo(key);
        formatted[shortName] = {
          value,
          timestamp: new Date().toISOString(),
          simulated: false,
          unit: info.unit,
          label: info.label,
        };
      });
      setSensorData(prev => ({ ...prev, ...formatted }));
      setLastUpdate(new Date().toISOString());

      try {
        const mqttStatus = await api.getMqttStatus();
        setConnected(mqttStatus.connected || false);
        setSimulationMode(mqttStatus.simulationMode || false);
      } catch (err) {
        console.warn('Could not fetch MQTT status:', err);
      }

      try {
        const alarmsData = await api.getAlarms();
        setAlarms(alarmsData || []);
      } catch (err) {
        console.warn('Could not fetch alarms:', err);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      if (!isMounted) return;
      console.log('✅ Dashboard connected to backend');
      setConnected(true);
      fetchInitialData();
    });

    socket.on('disconnect', () => {
      if (!isMounted) return;
      console.log('❌ Dashboard disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      if (!isMounted) return;
      console.error('WebSocket connection error:', err);
      setError('WebSocket connection failed');
      fetchInitialData();
    });

    socket.on('plc-data', (data) => {
      if (!isMounted) return;
      const shortName = toShortName(data.parameter);
      const info = getSensorInfo(data.parameter);
      const timestamp = data.timestamp || new Date().toISOString();

      setSensorData(prev => ({
        ...prev,
        [shortName]: {
          value: data.value,
          timestamp,
          simulated: data.simulated || false,
          unit: data.unit || info.unit,
          label: info.label,
        }
      }));

      setHistory(prev => {
        const existing = prev[shortName] || [];
        const updated = [...existing, { time: timestamp, value: data.value }].slice(-MAX_HISTORY_POINTS);
        return { ...prev, [shortName]: updated };
      });

      setLastUpdate(timestamp);
    });

    socket.on('plc-alarm', (alarmData) => {
      if (!isMounted) return;
      const newAlarms = alarmData.alarms.map(alarm => ({
        id: `${alarm.parameter}-${Date.now()}-${Math.random()}`,
        type: alarm.message || 'Alarm',
        equipment: `RO5 - ${alarm.parameter}`,
        severity: alarm.severity === 'high' ? 'Critical' :
                 alarm.severity === 'warning' ? 'High' : 'Medium',
        time: new Date().toLocaleTimeString(),
        status: 'Active',
        value: alarmData.value,
      }));
      setAlarms(prev => [...newAlarms, ...prev].slice(0, 20));
    });

    socket.on('mqtt-status', (status) => {
      if (!isMounted) return;
      setConnected(status.connected || false);
      setSimulationMode(status.simulationMode || false);
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!connected && !loading) {
      const interval = setInterval(() => {
        console.log('🔄 Refreshing via REST API (WebSocket disconnected)');
        fetchInitialData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, loading]);

  const handleRefresh = () => fetchInitialData();

  const toggleSensor = (key) => {
    setSelectedSensors(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getValue = (shortName) => sensorData[shortName]?.value ?? 0;

  // Get values using RO5- prefixed keys
  const feedFlow = getValue('RO5-FEEDFlow');
  const permeateFlow = getValue('RO5-Permeateflow');
  const concentrateFlow = getValue('RO5-ConcetrateFlow');
  const roPressure = getValue('RO5-ROPressure');
  const systemRecovery = getValue('RO5-SystemRecovery');
  const pureWaterEC = getValue('RO5-PureWaterEc');
  const stage1Delta = getValue('RO5-Stage1Delta');
  const stage2Delta = getValue('RO5-Stage2Delta');
  const filterDeltaP = getValue('RO5-MediaFilterDeltaP');
  const interstagePress = getValue('RO5-InterstagePress');
  const concentratePress = getValue('RO5-ConcetratePress');
  const feedTankLevel = getValue('RO5-FeedTankLevel');
  
  // System status sensors
  const systemOperation = getValue('RO5-SystemOperation');
  const systemMode = getValue('RO5-SystemMode');
  const dosingActive = getValue('RO5-AntiscalantDosingActive');
  
  // Calculate dosing runtime and total dosed
  const dosingRate = 2.4; // mg/L (from sensor)
  const dosingRuntime = dosingActive ? 3.5 : 0; // hours (would come from actual runtime sensor)
  const totalDosed = dosingRuntime * dosingRate * 10; // mL (example calculation)

  const dailyProduction = Math.round(permeateFlow * 24);
  const activeSensors = Object.keys(sensorData).filter(
    key => sensorData[key]?.value !== undefined && sensorData[key]?.value !== null
  ).length;
  const totalSensors = 15; // Updated to include new sensors
  const plantAvailability = activeSensors > 0 ? ((activeSensors / totalSensors) * 100).toFixed(1) : 0;

  const chartData = { ...sensorData, history };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div style={{ color: "var(--muted-foreground)", textAlign: "center" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px", color: "#0ea5e9" }} />
          <p>Loading dashboard data...</p>
          <p style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>Connecting to backend...</p>
        </div>
      </div>
    );
  }

  if (error && Object.keys(sensorData).length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div style={{ color: COLORS.danger, textAlign: "center" }}>
          <AlertTriangle size={32} style={{ margin: "0 auto 12px" }} />
          <p style={{ fontWeight: 500, marginBottom: 8 }}>Connection Error</p>
          <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>{error}</p>
          <button
            onClick={handleRefresh}
            style={{
              padding: "8px 20px", borderRadius: 4, background: "var(--card)",
              border: "1px solid var(--border)", color: "var(--foreground)",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8
            }}
          >
            <RefreshCw size={16} />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const isDataStale = lastUpdate && (Date.now() - new Date(lastUpdate).getTime() > 60000);

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>

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
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            style={{
              padding: '4px 12px', borderRadius: 4, background: 'var(--secondary)',
              border: '1px solid var(--border)', color: 'var(--foreground)',
              cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            <RefreshCw size={12} />
            Refresh
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

      {/* System Status Row */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <SystemStatus isOn={systemOperation === 1} label="System Operation" icon={Power} />
        <SystemStatus isOn={systemMode === 1} label="System Mode" icon={Power} />
        <div className="flex items-center gap-2 rounded p-2" style={{ 
          background: feedTankLevel > 20 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${feedTankLevel > 20 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          <Droplets size={16} style={{ color: feedTankLevel > 20 ? COLORS.success : COLORS.danger }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: feedTankLevel > 20 ? COLORS.success : COLORS.danger }}>
            Feed Tank: {feedTankLevel > 20 ? `${feedTankLevel.toFixed(0)}%` : '⚠️ LOW'}
          </span>
        </div>
        <SystemStatus isOn={dosingActive === 1} label="Dosing Active" icon={FlaskConical} />
      </div>

      {/* KPI Grid */}
      <div>
        <SectionTitle>Real-Time Key Performance Indicators</SectionTitle>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <KPICard label="Daily Production" value={dailyProduction.toLocaleString()} unit="m³" icon={Droplets}
            trend={permeateFlow > 45 ? "up" : permeateFlow < 35 ? "down" : "flat"}
            trendValue={`${permeateFlow.toFixed(1)} m³/h`} color={COLORS.primary} />
          <AdvancedGauge value={roPressure} label="RO Pressure" unit="bar" min={0} max={20} color={COLORS.danger} fullWidth />
          <AdvancedGauge value={systemRecovery} label="System Recovery" unit="%" min={0} max={100} color={COLORS.success} fullWidth />
          <KPICard label="Permeate Flow" value={permeateFlow.toFixed(1)} unit="m³/h" icon={Droplets}
            trend="up" trendValue={`${concentrateFlow.toFixed(1)} m³/h concentrate`} color={COLORS.secondary} />
          <KPICard label="Active Alarms" value={alarms.filter(a => a.status === 'Active').length} icon={AlertTriangle}
            trend={alarms.length > 0 ? "up" : "down"}
            trendValue={alarms.length > 0 ? `${alarms.filter(a => a.severity === 'Critical').length} critical` : "All systems normal"}
            color={alarms.length > 0 ? COLORS.danger : COLORS.success} />
        </div>
        <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <AdvancedGauge value={feedFlow} label="Feed Flow" unit="m³/h" min={0} max={100} color={COLORS.primary} fullWidth />
          <KPICard label="Stage 1 Delta P" value={stage1Delta.toFixed(2)} unit="bar" icon={Zap}
            trend={stage1Delta > 3.8 ? "up" : "flat"}
            trendValue={stage1Delta > 3.8 ? "Check membranes" : "Normal"} color={COLORS.success} />
          <KPICard label="Product Water EC" value={pureWaterEC.toFixed(0)} unit="µS/cm" icon={FlaskConical}
            trend={pureWaterEC > 150 ? "up" : "flat"}
            trendValue={pureWaterEC > 150 ? "High conductivity" : "Within limits"} color={COLORS.purple} />
          <KPICard label="Filter Delta P" value={filterDeltaP.toFixed(2)} unit="bar" icon={Filter}
            trend={filterDeltaP > 0.5 ? "up" : "flat"}
            trendValue={filterDeltaP > 0.5 ? "Check filters" : "Normal"} color={COLORS.warning} />
          <KPICard label="Plant Availability" value={plantAvailability} unit="%" icon={CheckCircle}
            trend="up" trendValue={`${activeSensors} sensors online`} color={COLORS.success} />
        </div>
      </div>

      {/* Dosing Runtime Card */}
      <DosingRuntimeCard 
        isActive={dosingActive === 1}
        rate={dosingRate}
        runtimeHours={dosingRuntime}
        totalDosed={totalDosed}
      />

      {/* Pressure Monitoring Row */}
      <div>
        <SectionTitle>Pressure Monitoring</SectionTitle>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <KPICard label="Interstage Pressure" value={interstagePress.toFixed(1)} unit="bar" icon={Gauge} color={COLORS.orange} sub="Between stages" />
          <KPICard label="Concentrate Pressure" value={concentratePress.toFixed(1)} unit="bar" icon={Gauge} color={COLORS.yellow} sub="Reject stream" />
          <KPICard label="Stage 2 Delta P" value={stage2Delta.toFixed(2)} unit="bar" icon={Zap} color="#14b8a6"
            sub={stage2Delta > 3.1 ? "Check stage 2" : "Normal"} />
          <KPICard label="Concentrate Flow" value={concentrateFlow.toFixed(1)} unit="m³/h" icon={Activity} color={COLORS.warning}
            sub={`${((concentrateFlow / (feedFlow || 1)) * 100).toFixed(1)}% of feed`} />
        </div>
      </div>

      {/* Live trend + system health */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <LiveTrendChart data={chartData} sensorKey={selectedSensors[0] || 'RO5-Permeateflow'} height={220} />
        <SystemHealthRadar data={sensorData} />
      </div>

      {/* Multi-sensor comparison + selector */}
      <div>
        <MultiSensorChart data={chartData} sensors={selectedSensors} height={220} />
        <div className="rounded p-3 mt-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
            Select Sensors for Comparison
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
                    border: '1px solid var(--border)',
                    fontSize: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
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
    </div>
  );
}

export default Dashboard;