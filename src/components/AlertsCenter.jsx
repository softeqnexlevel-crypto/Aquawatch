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

export function AlertsCenter() {
  const { sensorData, getValue, connected } = useData();
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==================== GENERATE ALERTS FROM REAL DATA ====================
  const generateAlerts = () => {
    const newAlerts = [];
    let id = 1;
    const now = new Date();

    // 1. Check RO Pressure
    const roPressure = getValue('RO5-ROPressure');
    if (roPressure > 15) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "High RO Pressure",
        severity: "Critical",
        status: "Active",
        equipment: "RO5 - ROPressure",
        value: `${roPressure.toFixed(1)} bar`,
        threshold: "> 15 bar",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    } else if (roPressure < 10) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "Low RO Pressure",
        severity: "High",
        status: "Active",
        equipment: "RO5 - ROPressure",
        value: `${roPressure.toFixed(1)} bar`,
        threshold: "< 10 bar",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    }

    // 2. Check Stage 1 Delta P
    const stage1Delta = getValue('RO5-Stage1Delta');
    if (stage1Delta > 0.60) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "High Differential Pressure - Stage 1",
        severity: "Critical",
        status: "Active",
        equipment: "RO5 - Stage1Delta",
        value: `${stage1Delta.toFixed(2)} bar`,
        threshold: "> 0.60 bar",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    } else if (stage1Delta > 0.50) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "High Differential Pressure - Stage 1",
        severity: "High",
        status: "Active",
        equipment: "RO5 - Stage1Delta",
        value: `${stage1Delta.toFixed(2)} bar`,
        threshold: "> 0.50 bar",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    }

    // 3. Check Stage 2 Delta P
    const stage2Delta = getValue('RO5-Stage2Delta');
    if (stage2Delta > 0.55) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "High Differential Pressure - Stage 2",
        severity: "High",
        status: "Active",
        equipment: "RO5 - Stage2Delta",
        value: `${stage2Delta.toFixed(2)} bar`,
        threshold: "> 0.55 bar",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    }

    // 4. Check Filter Delta P
    const filterDeltaP = getValue('RO5-MediaFilterDeltaP');
    if (filterDeltaP > 0.40) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "High Filter Delta P",
        severity: "Critical",
        status: "Active",
        equipment: "RO5 - MediaFilterDeltaP",
        value: `${filterDeltaP.toFixed(2)} bar`,
        threshold: "> 0.40 bar",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    } else if (filterDeltaP > 0.30) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "High Filter Delta P",
        severity: "Medium",
        status: "Active",
        equipment: "RO5 - MediaFilterDeltaP",
        value: `${filterDeltaP.toFixed(2)} bar`,
        threshold: "> 0.30 bar",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    }

    // 5. Check System Recovery
    const systemRecovery = getValue('RO5-SystemRecovery');
    if (systemRecovery < 68) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "Low System Recovery",
        severity: "Critical",
        status: "Active",
        equipment: "RO5 - SystemRecovery",
        value: `${systemRecovery.toFixed(1)}%`,
        threshold: "< 68%",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    } else if (systemRecovery < 72) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "Low System Recovery",
        severity: "Medium",
        status: "Active",
        equipment: "RO5 - SystemRecovery",
        value: `${systemRecovery.toFixed(1)}%`,
        threshold: "< 72%",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    }

    // 6. Check Feed Tank Level
    const feedTankLevel = getValue('RO5-FeedTankLevel');
    if (feedTankLevel < 20) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "Low Feed Tank Level",
        severity: "Critical",
        status: "Active",
        equipment: "RO5 - FeedTankLevel",
        value: `${feedTankLevel.toFixed(0)}%`,
        threshold: "< 20%",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    } else if (feedTankLevel < 30) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "Low Feed Tank Level",
        severity: "Medium",
        status: "Active",
        equipment: "RO5 - FeedTankLevel",
        value: `${feedTankLevel.toFixed(0)}%`,
        threshold: "< 30%",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    }

    // 7. Check Feed Flow
    const feedFlow = getValue('RO5-FEEDFlow');
    if (feedFlow < 50) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "Low Feed Flow",
        severity: "High",
        status: "Active",
        equipment: "RO5 - FEEDFlow",
        value: `${feedFlow.toFixed(1)} m³/h`,
        threshold: "< 50 m³/h",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    }

    // 8. Check Pure Water EC
    const pureWaterEC = getValue('RO5-PureWaterEc');
    if (pureWaterEC > 50) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "High Product Water EC",
        severity: "Medium",
        status: "Active",
        equipment: "RO5 - PureWaterEc",
        value: `${pureWaterEC.toFixed(1)} µS/cm`,
        threshold: "> 50 µS/cm",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    }

    // 9. Check System Operation (Power Problem)
    const systemOperation = getValue('RO5-SystemOperation');
    if (systemOperation === 0) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "Power Problem - System Offline",
        severity: "Critical",
        status: "Active",
        equipment: "RO5 - SystemOperation",
        value: "OFF",
        threshold: "ON required",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor',
        isPowerProblem: true
      });
    }

    // 10. Check Dosing Active
    const dosingActive = getValue('RO5-AntiscalantDosingActive');
    if (dosingActive === 0 && systemOperation === 1) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "Antiscalant Dosing Stopped",
        severity: "High",
        status: "Active",
        equipment: "RO5 - AntiscalantDosingActive",
        value: "OFF",
        threshold: "ON required",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'sensor'
      });
    }

    // 11. Check Mass Balance
    const permeateFlow = getValue('RO5-Permeateflow');
    const concentrateFlow = getValue('RO5-ConcetrateFlow');
    const massBalance = Math.abs(feedFlow - (permeateFlow + concentrateFlow));
    if (massBalance > 5 && feedFlow > 0) {
      newAlerts.push({
        id: `ALT-${String(id++).padStart(3, '0')}`,
        type: "Mass Balance Error",
        severity: "Medium",
        status: "Active",
        equipment: "RO5 - Mass Balance",
        value: `${massBalance.toFixed(1)} m³/h`,
        threshold: "< 5 m³/h",
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        source: 'calculated'
      });
    }

    // If no alerts, add a "Systems Normal" informational alert
    if (newAlerts.length === 0) {
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
        source: 'system'
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
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
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

      {/* Power Problem Alert Banner */}
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
          const isActive = alert.status === "Active";

          return (
            <div
              key={alert.id}
              className="rounded p-3 flex items-start gap-3 cursor-pointer transition-all hover:opacity-90"
              style={{ 
                background: cfg.bg, 
                border: `1px solid ${alert.isPowerProblem ? '#ef4444' : cfg.border}`,
                opacity: isActive ? 1 : 0.65,
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
                    color: isActive ? "#22c55e" : "#4d7a9e",
                    background: isActive ? "rgba(34,197,94,0.1)" : "rgba(77,122,158,0.1)",
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
                {isActive && (
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