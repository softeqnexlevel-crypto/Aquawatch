// components/AlertsCenter.jsx
import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Bell, Filter, ChevronRight, RefreshCw, Power } from "lucide-react";
import { useData } from "../contexts/DataContext";

const severityColors = {
  Critical: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", text: "#ef4444", dot: "#ef4444" },
  High: { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.3)", text: "#f97316", dot: "#f97316" },
  Medium: { bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.3)", text: "#eab308", dot: "#eab308" },
  Low: { bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.3)", text: "#0ea5e9", dot: "#0ea5e9" },
  Info: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.3)", text: "#22c55e", dot: "#22c55e" },
};

// ==================== ROBUST TYPE NORMALIZATION ====================
/**
 * Normalize any value to a boolean representing "active/on" state
 * Handles: 1, true, "1", "true", "on", "active", "yes" → true
 * Everything else → false
 */
const isActive = (value) => {
  if (value === undefined || value === null) return false;
  
  // Already a boolean
  if (typeof value === 'boolean') return value;
  
  // Number: 1 = active, 0 = inactive
  if (typeof value === 'number') return value === 1;
  
  // String: check against common active indicators
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    return ['1', 'true', 'on', 'active', 'yes', 'running', 'enabled', 'online'].includes(normalized);
  }
  
  // Fallback: truthy
  return !!value;
};

/**
 * Normalize any value to a number for threshold comparisons
 * Handles: number, string number, boolean → number
 */
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

/**
 * Get a display string for a value (for alert messages)
 */
const toDisplayString = (value) => {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'boolean') return value ? 'ON' : 'OFF';
  if (typeof value === 'number') return value.toFixed(1);
  if (typeof value === 'string') {
    // If it's a numeric string, format it nicely
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed.toFixed(1);
    return value;
  }
  return String(value);
};

// ==================== THRESHOLD CONFIGURATION ====================
const ALERT_THRESHOLDS = {
  'RO5-ROPressure': {
    high: { value: 15, severity: 'Critical', message: 'High RO Pressure' },
    low: { value: 10, severity: 'High', message: 'Low RO Pressure' }
  },
  'RO5-Stage1Delta': {
    critical: { value: 0.60, severity: 'Critical', message: 'High Differential Pressure - Stage 1' },
    warning: { value: 0.50, severity: 'High', message: 'High Differential Pressure - Stage 1' }
  },
  'RO5-Stage2Delta': {
    high: { value: 0.55, severity: 'High', message: 'High Differential Pressure - Stage 2' }
  },
  'RO5-MediaFilterDeltaP': {
    critical: { value: 0.40, severity: 'Critical', message: 'High Filter Delta P' },
    warning: { value: 0.30, severity: 'Medium', message: 'High Filter Delta P' }
  },
  'RO5-SystemRecovery': {
    critical: { value: 68, severity: 'Critical', message: 'Low System Recovery' },
    warning: { value: 72, severity: 'Medium', message: 'Low System Recovery' }
  },
  'RO5-FeedTankLevel': {
    critical: { value: 20, severity: 'Critical', message: 'Low Feed Tank Level' },
    warning: { value: 30, severity: 'Medium', message: 'Low Feed Tank Level' }
  },
  'RO5-FEEDFlow': {
    low: { value: 50, severity: 'High', message: 'Low Feed Flow' }
  },
  'RO5-PureWaterEc': {
    high: { value: 50, severity: 'Medium', message: 'High Product Water EC' }
  },
  'RO5-ConcetrateFlow': {
    low: { value: 10, severity: 'Medium', message: 'Low Concentrate Flow' }
  },
  'RO5-InterstagePress': {
    high: { value: 10, severity: 'Medium', message: 'High Interstage Pressure' }
  },
  'RO5-ConcetratePress': {
    high: { value: 8, severity: 'Low', message: 'High Concentrate Pressure' }
  }
};

export function AlertsCenter() {
  const { sensorData, getValue, connected } = useData();
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==================== HELPER FUNCTIONS ====================
  
  const checkThreshold = (rawValue, thresholds, type) => {
    if (!thresholds) return null;
    const threshold = thresholds[type];
    if (!threshold) return null;
    
    const numericValue = toNumber(rawValue);
    const thresholdValue = threshold.value;
    
    // Determine if threshold is exceeded (high/critical = greater than, low = less than)
    const isExceeded = (type === 'high' || type === 'critical') 
      ? numericValue > thresholdValue 
      : numericValue < thresholdValue;
      
    if (isExceeded) {
      return {
        severity: threshold.severity,
        message: threshold.message,
        threshold: `${(type === 'high' || type === 'critical') ? '>' : '<'} ${thresholdValue}`,
        currentValue: numericValue
      };
    }
    return null;
  };

  // ==================== GENERATE ALERTS FROM REAL DATA ====================
  const generateAlerts = () => {
    const newAlerts = [];
    let id = 1;
    const now = new Date();

    // Helper to add alert
    const addAlert = (key, sensorKey, rawValue, threshold, severity, message, equipment, isPowerProblem = false) => {
      const displayValue = typeof rawValue === 'boolean' 
        ? (rawValue ? 'ON' : 'OFF')
        : toDisplayString(rawValue);
      
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: message,
        severity: severity,
        status: "Active",
        equipment: equipment || sensorKey,
        value: displayValue,
        threshold: threshold,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: key.includes('calc') ? 'calculated' : 'sensor',
        isPowerProblem: isPowerProblem,
        rawKey: sensorKey,
        rawValue: rawValue
      });
    };

    // -------------------- BINARY/STATUS SENSORS (Normalized) --------------------
    
    // 1. System Operation - Normalized with isActive()
    const systemOperation = getValue('RO5-SystemOperation');
    const isSystemOn = isActive(systemOperation);
    
    // ⚡ POWER PROBLEM: System is OFF (false/0/off)
    if (!isSystemOn) {
      addAlert(
        'RO5-SystemOperation',
        'RO5 - SystemOperation',
        systemOperation,
        'ON required',
        'Critical',
        'Power Problem - System Offline',
        'RO5 - SystemOperation',
        true  // isPowerProblem
      );
    }

    // 2. System Mode - Normalized with isActive()
    const systemMode = getValue('RO5-SystemMode');
    const isAutoMode = isActive(systemMode);
    
    // ⚠️ SYSTEM IN MANUAL: Not in Auto mode
    if (!isAutoMode && isSystemOn) {
      addAlert(
        'RO5-SystemMode',
        'RO5 - SystemMode',
        systemMode,
        'Auto mode required',
        'High',
        'System in Manual Mode',
        'RO5 - SystemMode'
      );
    }

    // 3. Dosing Active - Normalized with isActive()
    const dosingActive = getValue('RO5-AntiscalantDosingActive');
    const isDosingActive = isActive(dosingActive);
    
    // ⚠️ DOSING STOPPED: System is on but dosing is off
    if (!isDosingActive && isSystemOn) {
      addAlert(
        'RO5-AntiscalantDosingActive',
        'RO5 - AntiscalantDosingActive',
        dosingActive,
        'Running required',
        'High',
        'Antiscalant Dosing Stopped',
        'RO5 - AntiscalantDosingActive'
      );
    }

    // -------------------- NUMERIC SENSORS (Threshold-based) --------------------
    
    // Helper for numeric sensor checks
    const checkNumericAlert = (sensorKey, displayKey, thresholds) => {
      const rawValue = getValue(sensorKey);
      if (rawValue === undefined || rawValue === null) return;
      
      const numericValue = toNumber(rawValue);
      
      // Check high/critical thresholds
      ['critical', 'high'].forEach(type => {
        const result = checkThreshold(numericValue, thresholds, type);
        if (result) {
          addAlert(
            sensorKey,
            displayKey || sensorKey,
            numericValue,
            result.threshold,
            result.severity,
            result.message,
            displayKey || sensorKey
          );
        }
      });
      
      // Check low thresholds
      ['low', 'warning'].forEach(type => {
        const result = checkThreshold(numericValue, thresholds, type);
        if (result) {
          // For warnings, only add if no critical alert already exists for this sensor
          const existingCritical = newAlerts.some(a => 
            a.rawKey === sensorKey && 
            (a.severity === 'Critical' || a.type.includes('Critical'))
          );
          if (!existingCritical || type === 'low') {
            addAlert(
              sensorKey,
              displayKey || sensorKey,
              numericValue,
              result.threshold,
              result.severity,
              result.message,
              displayKey || sensorKey
            );
          }
        }
      });
    };

    // 4. RO Pressure
    checkNumericAlert('RO5-ROPressure', 'RO5 - ROPressure', ALERT_THRESHOLDS['RO5-ROPressure']);

    // 5. Stage 1 Delta P
    checkNumericAlert('RO5-Stage1Delta', 'RO5 - Stage1Delta', ALERT_THRESHOLDS['RO5-Stage1Delta']);

    // 6. Stage 2 Delta P
    checkNumericAlert('RO5-Stage2Delta', 'RO5 - Stage2Delta', ALERT_THRESHOLDS['RO5-Stage2Delta']);

    // 7. Filter Delta P
    checkNumericAlert('RO5-MediaFilterDeltaP', 'RO5 - MediaFilterDeltaP', ALERT_THRESHOLDS['RO5-MediaFilterDeltaP']);

    // 8. System Recovery
    checkNumericAlert('RO5-SystemRecovery', 'RO5 - SystemRecovery', ALERT_THRESHOLDS['RO5-SystemRecovery']);

    // 9. Feed Tank Level
    checkNumericAlert('RO5-FeedTankLevel', 'RO5 - FeedTankLevel', ALERT_THRESHOLDS['RO5-FeedTankLevel']);

    // 10. Feed Flow
    checkNumericAlert('RO5-FEEDFlow', 'RO5 - FEEDFlow', ALERT_THRESHOLDS['RO5-FEEDFlow']);

    // 11. Pure Water EC
    checkNumericAlert('RO5-PureWaterEc', 'RO5 - PureWaterEc', ALERT_THRESHOLDS['RO5-PureWaterEc']);

    // 12. Concentrate Flow
    checkNumericAlert('RO5-ConcetrateFlow', 'RO5 - ConcetrateFlow', ALERT_THRESHOLDS['RO5-ConcetrateFlow']);

    // 13. Interstage Pressure
    checkNumericAlert('RO5-InterstagePress', 'RO5 - InterstagePress', ALERT_THRESHOLDS['RO5-InterstagePress']);

    // 14. Concentrate Pressure
    checkNumericAlert('RO5-ConcetratePress', 'RO5 - ConcetratePress', ALERT_THRESHOLDS['RO5-ConcetratePress']);

    // 15. Mass Balance (calculated)
    const feedFlow = toNumber(getValue('RO5-FEEDFlow'));
    const permeateFlow = toNumber(getValue('RO5-Permeateflow'));
    const concentrateFlow = toNumber(getValue('RO5-ConcetrateFlow'));
    const massBalance = Math.abs(feedFlow - (permeateFlow + concentrateFlow));
    
    if (massBalance > 5 && feedFlow > 0) {
      addAlert(
        'calc-mass-balance',
        'RO5 - Mass Balance',
        massBalance,
        '< 5 m³/h',
        'Medium',
        'Mass Balance Error',
        'RO5 - Mass Balance'
      );
    }

    // 16. Permeate Flow - Low production
    if (permeateFlow > 0 && permeateFlow < 20 && isSystemOn) {
      addAlert(
        'RO5-Permeateflow',
        'RO5 - Permeateflow',
        permeateFlow,
        '> 20 m³/h',
        'Medium',
        'Low Permeate Production',
        'RO5 - Permeateflow'
      );
    }

    // If no active alerts, add a "Systems Normal" informational alert
    const activeAlerts = newAlerts.filter(a => a.status === 'Active' && a.severity !== 'Info');
    if (activeAlerts.length === 0) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "All Systems Operating Normally",
        severity: "Info",
        status: "Acknowledged",
        equipment: "RO5 - System Health",
        value: "All systems go",
        threshold: "N/A",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'system',
        isPowerProblem: false,
        rawValue: null
      });
    }

    return newAlerts;
  };

  // ==================== UPDATE ALERTS ====================
  useEffect(() => {
    if (Object.keys(sensorData).length > 0) {
      const newAlerts = generateAlerts();
      setAlerts(newAlerts);
      setLoading(false);
    }
  }, [sensorData, getValue]);

  // ==================== FILTER ALERTS ====================
  const filtered = alerts.filter(a =>
    (severityFilter === "All" || a.severity === severityFilter) &&
    (statusFilter === "All" || a.status === statusFilter)
  );

  const counts = {
    Critical: alerts.filter(a => a.severity === "Critical" && a.status === "Active").length,
    High: alerts.filter(a => a.severity === "High" && a.status === "Active").length,
    Medium: alerts.filter(a => a.severity === "Medium" && a.status === "Active").length,
    Low: alerts.filter(a => a.severity === "Low" && a.status === "Active").length,
  };

  // ==================== ACKNOWLEDGE ALERT ====================
  const acknowledgeAlert = (id) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === id && a.status === "Active"
          ? { ...a, status: "Acknowledged" }
          : a
      )
    );
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div style={{ color: "var(--muted-foreground)", textAlign: "center" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px", color: "#0ea5e9" }} />
          <p>Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>
            <Bell size={18} style={{ display: 'inline', marginRight: 8 }} />
            Alerts Center
          </h2>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
            {connected ? '🟢 Live monitoring' : '🔴 Offline'} • {alerts.filter(a => a.status === 'Active').length} active alerts
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 4,
          padding: '4px 12px',
          borderRadius: 4,
          background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${connected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: connected ? '#22c55e' : '#ef4444' }}>
            {connected ? 'REAL-TIME' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {["Critical", "High", "Medium", "Low"].map(sev => {
          const cfg = severityColors[sev];
          return (
            <div 
              key={sev} 
              className="rounded p-3 flex items-center gap-3" 
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <div 
                className="flex items-center justify-center rounded-full" 
                style={{ width: 32, height: 32, background: `${cfg.dot}20` }}
              >
                <AlertTriangle size={14} style={{ color: cfg.dot }} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: cfg.text, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {sev}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color: cfg.text, lineHeight: 1 }}>
                  {counts[sev] || 0}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Power Problem Alert Banner - Shows when system is OFF */}
      {alerts.filter(a => a.isPowerProblem && a.status === 'Active').length > 0 && (
        <div className="flex items-center gap-3 rounded p-3" style={{ 
          background: 'rgba(239,68,68,0.1)', 
          border: '2px solid rgba(239,68,68,0.3)',
          animation: 'pulse 2s infinite'
        }}>
          <Power size={20} style={{ color: '#ef4444' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
              ⚡ POWER PROBLEM ALARM
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
              System is offline. Immediate attention required.
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={12} style={{ color: "var(--muted-foreground)" }} />
        <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Severity:</span>
        
        {["All", "Critical", "High", "Medium", "Low"].map(s => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className="px-2 py-1 rounded transition-colors"
            style={{
              fontSize: 10,
              fontWeight: severityFilter === s ? 600 : 400,
              color: severityFilter === s ? "#020810" : "var(--muted-foreground)",
              background: severityFilter === s 
                ? (s === "All" ? "#0ea5e9" : severityColors[s]?.dot || "#0ea5e9") 
                : "var(--secondary)",
              border: `1px solid ${severityFilter === s ? "transparent" : "var(--border)"}`,
            }}
          >
            {s}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: "var(--border)" }} />
        
        <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Status:</span>
        {["All", "Active", "Acknowledged"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-2 py-1 rounded transition-colors"
            style={{
              fontSize: 10,
              fontWeight: statusFilter === s ? 600 : 400,
              color: statusFilter === s ? "#020810" : "var(--muted-foreground)",
              background: statusFilter === s ? "#0ea5e9" : "var(--secondary)",
              border: `1px solid ${statusFilter === s ? "transparent" : "var(--border)"}`,
            }}
          >
            {s}
          </button>
        ))}

        <div className="flex-1" />
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
          {filtered.length} alert{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Alerts list */}
      <div className="flex flex-col gap-2">
        {filtered.map(alert => {
          const cfg = severityColors[alert.severity] || severityColors.Info;
          const isActiveStatus = alert.status === "Active";

          return (
            <div
              key={alert.id}
              className="rounded p-3 flex items-start gap-3 cursor-pointer transition-all hover:opacity-90"
              style={{ 
                background: cfg.bg, 
                border: `1px solid ${alert.isPowerProblem ? '#ef4444' : cfg.border}`,
                opacity: isActiveStatus ? 1 : 0.65,
                borderLeft: alert.isPowerProblem ? '4px solid #ef4444' : 'none'
              }}
            >
              {/* Severity dot */}
              <div 
                className="flex items-center justify-center mt-0.5 flex-shrink-0" 
                style={{ 
                  width: 28, 
                  height: 28, 
                  background: `${cfg.dot}15`, 
                  borderRadius: 4 
                }}
              >
                {alert.isPowerProblem ? (
                  <Power size={13} style={{ color: cfg.dot }} />
                ) : (
                  <AlertTriangle size={13} style={{ color: cfg.dot }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
                    {alert.type}
                  </span>
                  <span style={{ 
                    fontSize: 9, 
                    fontWeight: 700, 
                    color: cfg.text, 
                    background: `${cfg.dot}18`, 
                    borderRadius: 3, 
                    padding: "1px 6px", 
                    letterSpacing: "0.06em" 
                  }}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: 9, 
                    fontWeight: 600,
                    color: isActiveStatus ? "#22c55e" : "#4d7a9e",
                    background: isActiveStatus ? "rgba(34,197,94,0.1)" : "rgba(77,122,158,0.1)",
                    borderRadius: 3, 
                    padding: "1px 6px"
                  }}>
                    {alert.status.toUpperCase()}
                  </span>
                  {alert.source === 'calculated' && (
                    <span style={{
                      fontSize: 7,
                      fontWeight: 600,
                      color: "#a78bfa",
                      background: "rgba(167,139,250,0.1)",
                      borderRadius: 2,
                      padding: "1px 4px"
                    }}>
                      CALC
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  <span style={{ color: "var(--foreground)" }}>{alert.equipment}</span>
                  {" · "}Current: <span style={{ fontFamily: "var(--font-mono)", color: cfg.text }}>{alert.value}</span>
                  {" · "}Threshold: <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>{alert.threshold}</span>
                </div>

                <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 2 }}>
                  {alert.id} · {alert.date} {alert.time}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isActiveStatus && !alert.isPowerProblem && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-opacity-20"
                    style={{ 
                      fontSize: 9, 
                      fontWeight: 600, 
                      color: "#22c55e", 
                      background: "rgba(34,197,94,0.1)", 
                      border: "1px solid rgba(34,197,94,0.2)" 
                    }}
                  >
                    <CheckCircle size={10} /> Acknowledge
                  </button>
                )}
                <button 
                  className="p-1.5 rounded" 
                  style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Bell size={32} style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
            <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
              No alerts match the selected filters
            </span>
          </div>
        )}
      </div>

      {/* Alert types reference */}
      <div 
        className="rounded p-3" 
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div style={{ 
          fontSize: 11, 
          fontWeight: 600, 
          color: "var(--muted-foreground)", 
          textTransform: "uppercase", 
          letterSpacing: "0.1em", 
          marginBottom: 10 
        }}>
          Active Alert Configuration
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { type: "High RO Pressure", threshold: "> 15 bar", severity: "Critical" },
            { type: "Low RO Pressure", threshold: "< 10 bar", severity: "High" },
            { type: "High Stage 1 ΔP", threshold: "> 0.60 bar", severity: "Critical" },
            { type: "High Filter ΔP", threshold: "> 0.40 bar", severity: "Critical" },
            { type: "Low System Recovery", threshold: "< 68%", severity: "Critical" },
            { type: "Low Feed Tank Level", threshold: "< 20%", severity: "Critical" },
            { type: "Power Problem", threshold: "System Offline", severity: "Critical" },
            { type: "System Manual Mode", threshold: "Not Auto", severity: "High" },
            { type: "Dosing Stopped", threshold: "Dosing Off", severity: "High" },
            { type: "Low Permeate Production", threshold: "< 20 m³/h", severity: "Medium" },
            { type: "Mass Balance Error", threshold: "> 5 m³/h", severity: "Medium" },
          ].map(cfg => {
            const s = severityColors[cfg.severity];
            return (
              <div 
                key={cfg.type} 
                className="rounded p-2 flex justify-between items-center" 
                style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
              >
                <div>
                  <div style={{ fontSize: 10, fontWeight: 500, color: "var(--foreground)" }}>{cfg.type}</div>
                  <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                    Threshold: {cfg.threshold}
                  </div>
                </div>
                <span style={{ 
                  fontSize: 8, 
                  fontWeight: 700, 
                  color: s.text, 
                  background: s.bg, 
                  borderRadius: 3, 
                  padding: "1px 5px", 
                  marginLeft: 8, 
                  flexShrink: 0 
                }}>
                  {cfg.severity.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
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

export default AlertsCenter;