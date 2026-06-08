import { useState } from "react";
import { alerts } from "../data/mockData";
import { AlertTriangle, CheckCircle, Bell, Filter, ChevronRight } from "lucide-react";

const severityColors = {
  Critical: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", text: "#ef4444", dot: "#ef4444" },
  High: { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.3)", text: "#f97316", dot: "#f97316" },
  Medium: { bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.3)", text: "#eab308", dot: "#eab308" },
  Low: { bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.3)", text: "#0ea5e9", dot: "#0ea5e9" },
};

export function AlertsCenter() {
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = alerts.filter(a =>
    (severityFilter === "All" || a.severity === severityFilter) &&
    (statusFilter === "All" || a.status === statusFilter)
  );

  const counts = {
    Critical: alerts.filter(a => a.severity === "Critical" && a.status === "Active").length,
    High: alerts.filter(a => a.severity === "High" && a.status === "Active").length,
    Medium: alerts.filter(a => a.severity === "Medium").length,
    Low: alerts.filter(a => a.severity === "Low").length,
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
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
                  {counts[sev]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
          const cfg = severityColors[alert.severity];
          const isActive = alert.status === "Active";

          return (
            <div
              key={alert.id}
              className="rounded p-3 flex items-start gap-3 cursor-pointer transition-all"
              style={{ 
                background: cfg.bg, 
                border: `1px solid ${cfg.border}`, 
                opacity: isActive ? 1 : 0.65 
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
                <AlertTriangle size={13} style={{ color: cfg.dot }} />
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
                    className="flex items-center gap-1 px-2 py-1 rounded transition-colors"
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
          Alert Configuration
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { type: "High Differential Pressure", threshold: "> 0.60 bar", severity: "Critical" },
            { type: "Low Recovery Rate", threshold: "< 76%", severity: "Medium" },
            { type: "Low Chemical Inventory", threshold: "< 20%", severity: "Medium" },
            { type: "Borehole Offline", threshold: "Flow = 0", severity: "High" },
            { type: "Maintenance Overdue", threshold: "> 0 days", severity: "High" },
            { type: "Production Below Target", threshold: "< 90%", severity: "Low" },
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
    </div>
  );
}