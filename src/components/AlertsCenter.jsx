

import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Bell, Filter, ChevronRight, X, Trash2, Power, History } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useAlerts } from "../contexts/AlertsContext";
import { useAuth } from "../contexts/AuthContext";
import { MQTT_ALARMS } from "../utils/alertEngine";

const severityColors = {
  Critical: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", text: "#ef4444", dot: "#ef4444" },
  High: { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.3)", text: "#f97316", dot: "#f97316" },
  Medium: { bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.3)", text: "#eab308", dot: "#eab308" },
  Low: { bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.3)", text: "#0ea5e9", dot: "#0ea5e9" },
  Info: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.3)", text: "#22c55e", dot: "#22c55e" },
};

const ALERT_REFERENCE = [
  // Sensor threshold alerts
  { type: "High RO Pressure", threshold: "> 16 bar", severity: "Critical", source: "Sensor" },
  { type: "Low RO Pressure", threshold: "< 10 bar", severity: "High", source: "Sensor" },
  { type: "High Differential Pressure - Stage 1", threshold: "> 2.0 bar", severity: "Critical", source: "Sensor" },
  { type: "High Differential Pressure - Stage 2", threshold: "> 2.0 bar", severity: "Critical", source: "Sensor" },
  { type: "High Filter Delta P", threshold: "> 0.40 bar", severity: "Critical", source: "Sensor" },
  { type: "High Filter Delta P", threshold: "> 0.30 bar", severity: "Medium", source: "Sensor" },
  { type: "Low System Recovery", threshold: "< 70%", severity: "Critical", source: "Sensor" },
  { type: "Low Feed Tank Level", threshold: "< 20%", severity: "Critical", source: "Sensor" },
  { type: "Low Feed Tank Level", threshold: "< 30%", severity: "Medium", source: "Sensor" },
  { type: "Low Feed Flow", threshold: "< 50 m³/h", severity: "High", source: "Sensor" },
  { type: "High Product Water EC", threshold: "> 50 µS/cm", severity: "Medium", source: "Sensor" },
  { type: "Low Concentrate Flow", threshold: "< 10 m³/h", severity: "Medium", source: "Sensor" },

  // PLC Bit Alarms (digital)
  { type: "High Prefilter Delta P", threshold: "PLC Bit = ON", severity: "High", source: "PLC" },
  { type: "High Media Filter Delta P", threshold: "PLC Bit = ON", severity: "High", source: "PLC" },
  { type: "High RO Pressure", threshold: "PLC Bit = ON", severity: "Critical", source: "PLC" },
  { type: "Low RO Pressure", threshold: "PLC Bit = ON", severity: "High", source: "PLC" },
  { type: "Low Feed Tank Level", threshold: "PLC Bit = ON", severity: "Critical", source: "PLC" },
  { type: "Power Problem", threshold: "PLC Bit = ON", severity: "Critical", source: "PLC" },

  // Status alerts
  { type: "Antiscalant Dosing Stopped", threshold: "Running required", severity: "High", source: "Status" },
  { type: "Low Permeate Production", threshold: "< 20 m³/h", severity: "Medium", source: "Status" },
  { type: "Mass Balance Error", threshold: "> 5 m³/h", severity: "Medium", source: "Status" },
];

// MQTT alarm icon mapping
const getAlarmIcon = (alertId) => {
  if (alertId?.includes('Prefilter')) return '🔧';
  if (alertId?.includes('PowerProblem')) return '⚡';
  if (alertId?.includes('Media')) return '🧹';
  if (alertId?.includes('S1Delta')) return '📊';
  if (alertId?.includes('S2Delta')) return '📊';
  if (alertId?.includes('HighROPressure')) return '💨';
  if (alertId?.includes('FeedTankLow')) return '📉';
  return '🔔';
};

function formatHistoryLine(event) {
  const time = new Date(event.time).toLocaleString();
  switch (event.kind) {
    case 'triggered': return `⚠️ ${event.type || event.alertId} triggered · ${time}`;
    case 'cleared': return `✅ ${event.type || event.alertId} cleared automatically · ${time}`;
    case 'acknowledged': return `👍 Alert acknowledged · ${time}`;
    case 'dismissed': return `🗑️ Alert cleared by admin · ${time}`;
    default: return `${event.kind} · ${time}`;
  }
}

export function AlertsCenter() {
  const { connected } = useData();
  const { alerts, activeAlerts, acknowledgeAlert, clearAlert, clearAllAcknowledged, history } = useAlerts();
  const { isExpired } = useAuth();

  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showHistory, setShowHistory] = useState(false);

  const filtered = alerts.filter(a =>
    (severityFilter === "All" || a.severity === severityFilter) &&
    (statusFilter === "All" || a.status === statusFilter)
  );

  const counts = {
    Critical: activeAlerts.filter(a => a.severity === "Critical").length,
    High: activeAlerts.filter(a => a.severity === "High").length,
    Medium: activeAlerts.filter(a => a.severity === "Medium").length,
    Low: activeAlerts.filter(a => a.severity === "Low").length,
  };

  const acknowledgedCount = alerts.filter(a => a.status === 'Acknowledged').length;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>
            <Bell size={18} style={{ display: 'inline', marginRight: 8 }} />
            Alerts Center
          </h2>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
            {connected ? '🟢 Live monitoring' : '🔴 Offline'} • {activeAlerts.length} active alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {acknowledgedCount > 0 && (
            <button
              onClick={clearAllAcknowledged}
              disabled={isExpired}
              title={isExpired ? 'Upgrade your plan to manage alerts' : undefined}
              className="flex items-center gap-1 px-3 py-1.5 rounded transition-colors"
              style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", background: "var(--secondary)", border: "1px solid var(--border)", opacity: isExpired ? 0.5 : 1, cursor: isExpired ? 'not-allowed' : 'pointer' }}
            >
              <Trash2 size={11} /> Clear {acknowledgedCount} Acknowledged
            </button>
          )}
          <button
            onClick={() => setShowHistory(s => !s)}
            className="flex items-center gap-1 px-3 py-1.5 rounded transition-colors"
            style={{ fontSize: 10, fontWeight: 600, color: showHistory ? "#0ea5e9" : "var(--muted-foreground)", background: showHistory ? "rgba(14,165,233,0.1)" : "var(--secondary)", border: `1px solid ${showHistory ? "rgba(14,165,233,0.3)" : "var(--border)"}` }}
          >
            <History size={11} /> History
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 4,
            background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${connected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444' }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: connected ? '#22c55e' : '#ef4444' }}>
              {connected ? 'REAL-TIME' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Alert History
          </div>
          {history.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>No events logged yet this session.</div>
          ) : (
            <div className="flex flex-col gap-1 max-h-[220px] overflow-auto">
              {history.map(ev => (
                <div key={ev.id} style={{ fontSize: 10.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                  {formatHistoryLine(ev)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {["Critical", "High", "Medium", "Low"].map(sev => {
          const cfg = severityColors[sev];
          return (
            <div key={sev} className="rounded p-3 flex items-center gap-3" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: `${cfg.dot}20` }}>
                <AlertTriangle size={14} style={{ color: cfg.dot }} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: cfg.text, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{sev}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color: cfg.text, lineHeight: 1 }}>{counts[sev] || 0}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Power Problem Alert Banner */}
      {activeAlerts.some(a => a.isPowerProblem) && (
        <div className="flex items-center gap-3 rounded p-3" style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', animation: 'pulse 2s infinite' }}>
          <Power size={20} style={{ color: '#ef4444' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>⚡ POWER PROBLEM ALARM</div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>System is offline. Immediate attention required.</div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={12} style={{ color: "var(--muted-foreground)" }} />
        <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Severity:</span>
        {["All", "Critical", "High", "Medium", "Low"].map(s => (
          <button key={s} onClick={() => setSeverityFilter(s)} className="px-2 py-1 rounded transition-colors" style={{
            fontSize: 10, fontWeight: severityFilter === s ? 600 : 400,
            color: severityFilter === s ? "#020810" : "var(--muted-foreground)",
            background: severityFilter === s ? (s === "All" ? "#0ea5e9" : severityColors[s]?.dot || "#0ea5e9") : "var(--secondary)",
            border: `1px solid ${severityFilter === s ? "transparent" : "var(--border)"}`,
          }}>{s}</button>
        ))}
        <div style={{ width: 1, height: 20, background: "var(--border)" }} />
        <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Status:</span>
        {["All", "Active", "Acknowledged"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="px-2 py-1 rounded transition-colors" style={{
            fontSize: 10, fontWeight: statusFilter === s ? 600 : 400,
            color: statusFilter === s ? "#020810" : "var(--muted-foreground)",
            background: statusFilter === s ? "#0ea5e9" : "var(--secondary)",
            border: `1px solid ${statusFilter === s ? "transparent" : "var(--border)"}`,
          }}>{s}</button>
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

          // Check if this is a PLC alarm — prefer the flag already set by
          // alertEngine.js's mergeAlerts (isPLCAlarm: c.source === 'PLC'),
          // fall back to the MQTT_ALARMS lookup for older/cached alert
          // objects that predate that field.
          const isPLCAlarm = alert.isPLCAlarm || MQTT_ALARMS.some(a => a.id === alert.id);

          // Get the MQTT alarm description if it exists
          const mqttAlarm = MQTT_ALARMS.find(a => a.id === alert.id);
          const description = alert.description || mqttAlarm?.description || '';
          const alarmIcon = getAlarmIcon(alert.id);

          // Determine border color based on alarm type
          let borderLeftColor = 'none';
          if (alert.isPowerProblem) {
            borderLeftColor = '#ef4444';
          } else if (isPLCAlarm) {
            borderLeftColor = '#a78bfa';
          } else {
            borderLeftColor = '#0ea5e9';
          }

          return (
            <div key={alert.id} className="rounded p-3 flex items-start gap-3 transition-all" style={{
              background: cfg.bg,
              border: `1px solid ${alert.isPowerProblem ? '#ef4444' : cfg.border}`,
              opacity: isActiveStatus ? 1 : 0.65,
              borderLeft: `4px solid ${borderLeftColor}`
            }}>
              <div className="flex items-center justify-center mt-0.5 flex-shrink-0" style={{ width: 28, height: 28, background: `${cfg.dot}15`, borderRadius: 4 }}>
                {alert.isPowerProblem ? <Power size={13} style={{ color: cfg.dot }} /> : <AlertTriangle size={13} style={{ color: cfg.dot }} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
                    {isPLCAlarm ? `${alarmIcon} ` : ''}{alert.type}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: cfg.text, background: `${cfg.dot}18`, borderRadius: 3, padding: "1px 6px", letterSpacing: "0.06em" }}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 600,
                    color: isActiveStatus ? "#22c55e" : "#4d7a9e",
                    background: isActiveStatus ? "rgba(34,197,94,0.1)" : "rgba(77,122,158,0.1)",
                    borderRadius: 3, padding: "1px 6px"
                  }}>{alert.status.toUpperCase()}</span>

                  {/* Source badges */}
                  {isPLCAlarm && (
                    <span style={{
                      fontSize: 7,
                      fontWeight: 600,
                      color: "#8b5cf6",
                      background: "rgba(139,92,246,0.1)",
                      borderRadius: 2,
                      padding: "1px 6px"
                    }}>
                      PLC ALARM
                    </span>
                  )}
                  {!isPLCAlarm && alert.source === 'sensor' && (
                    <span style={{
                      fontSize: 7,
                      fontWeight: 600,
                      color: "#0ea5e9",
                      background: "rgba(14,165,233,0.1)",
                      borderRadius: 2,
                      padding: "1px 6px"
                    }}>
                      SENSOR THRESHOLD
                    </span>
                  )}
                  {!isPLCAlarm && alert.source !== 'sensor' && (
                    <span style={{
                      fontSize: 7,
                      fontWeight: 600,
                      color: "#f59e0b",
                      background: "rgba(245,158,11,0.1)",
                      borderRadius: 2,
                      padding: "1px 6px"
                    }}>
                      STATUS
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  <span style={{ color: "var(--foreground)" }}>{alert.equipment}</span>
                  {" · "}Current: <span style={{ fontFamily: "var(--font-mono)", color: cfg.text }}>{alert.value}</span>
                  {" · "}Threshold: <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>{alert.threshold}</span>
                </div>

                {/* Show description for PLC alarms */}
                {isPLCAlarm && description && (
                  <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 2, fontStyle: 'italic' }}>
                    💡 {description}
                  </div>
                )}
                {!isPLCAlarm && alert.source === 'sensor' && (
                  <div style={{ fontSize: 9, color: "var(--muted-foreground)", marginTop: 2 }}>
                    📊 Alert triggered by sensor reading exceeding threshold
                  </div>
                )}

                <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 2 }}>
                  {alert.id} · {alert.date} {alert.time}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {isActiveStatus && !alert.isPowerProblem && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    disabled={isExpired}
                    title={isExpired ? 'Upgrade your plan to acknowledge alerts' : undefined}
                    className="flex items-center gap-1 px-2 py-1 rounded transition-colors" style={{
                    fontSize: 9, fontWeight: 600, color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                    opacity: isExpired ? 0.5 : 1, cursor: isExpired ? 'not-allowed' : 'pointer'
                  }}>
                    <CheckCircle size={10} /> Acknowledge
                  </button>
                )}
                <button
                  onClick={() => clearAlert(alert.id)}
                  disabled={isExpired}
                  title={isExpired ? 'Upgrade your plan to clear alerts' : "Clear this alert (it will reappear if the condition is still true)"}
                  className="flex items-center gap-1 px-2 py-1 rounded transition-colors"
                  style={{ fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", background: "var(--secondary)", border: "1px solid var(--border)", opacity: isExpired ? 0.5 : 1, cursor: isExpired ? 'not-allowed' : 'pointer' }}
                >
                  <X size={10} /> Clear
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Bell size={32} style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
            <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
              {alerts.length === 0 ? "No alerts — all systems operating normally" : "No alerts match the selected filters"}
            </span>
          </div>
        )}
      </div>

      {/* Alert types reference */}
      <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Active Alert Configuration
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {ALERT_REFERENCE.map((cfg, index) => {
            const s = severityColors[cfg.severity];
            // Use index as fallback key if type might duplicate
            const key = `${cfg.type}-${index}`;
            return (
              <div key={key} className="rounded p-2 flex justify-between items-center" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 500, color: "var(--foreground)" }}>{cfg.type}</div>
                  <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>Threshold: {cfg.threshold}</div>
                  <div style={{ fontSize: 8, color: "var(--muted-foreground)" }}>Source: {cfg.source || 'Sensor'}</div>
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color: s.text, background: s.bg, borderRadius: 3, padding: "1px 5px", marginLeft: 8, flexShrink: 0 }}>
                  {cfg.severity.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}

export default AlertsCenter;