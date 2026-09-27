// pages/AlertsCenter.jsx
import React, { useState, useMemo } from "react";
import {
  AlertTriangle, CheckCircle, Bell, BellOff, Clock, Filter,
  Search, X, ChevronDown, ChevronUp, Trash2, History as HistoryIcon,
  Activity, ShieldAlert, Info,
} from "lucide-react";
import { useAlerts } from "../contexts/AlertsContext";
import { COLORS } from "../components/Dashboard";

// ── Severity / status colour map — mirrors RecentAlarmItem in Dashboard.jsx ──
const SEVERITY_COLOR = {
  Critical: COLORS.danger,
  High:     COLORS.orange,
  Medium:   COLORS.yellow,
  Low:      COLORS.success,
  Info:     COLORS.primary,
};

const SEVERITY_ICON = {
  Critical: ShieldAlert,
  High:     AlertTriangle,
  Medium:   AlertTriangle,
  Low:      Info,
  Info:     Info,
};

const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 };

// ── Small helpers ─────────────────────────────────────────────────────────
function formatTime(iso) {
  if (!iso) return "--";
  try {
    const d = new Date(iso);
    return d.toLocaleString([], {
      month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function relativeTime(iso) {
  if (!iso) return "--";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "--";
  const s = Math.floor(ms / 1000);
  if (s < 60)    return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)    return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)    return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────

function CountChip({ label, count, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg transition-colors"
      style={{
        padding: "6px 10px",
        background: active ? `${color}22` : "var(--card)",
        border: `1px solid ${active ? color : "var(--border)"}`,
        color: active ? color : "var(--muted-foreground)",
        cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 11, fontWeight: 600,
      }}
    >
      {label}
      <span style={{
        background: color, color: "white",
        borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700,
      }}>
        {count}
      </span>
    </button>
  );
}

function AlertRow({ alert, onAck, onClear, expanded, onToggleExpand }) {
  const color = SEVERITY_COLOR[alert.severity] || COLORS.primary;
  const Icon  = SEVERITY_ICON[alert.severity]  || AlertTriangle;
  const isAcknowledged = alert.status === "Acknowledged";

  return (
    <div
      className="rounded-lg"
      style={{
        background: "var(--card)",
        border: `1px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
        marginBottom: 8,
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div
        onClick={onToggleExpand}
        style={{
          padding: "10px 12px",
          display: "flex", alignItems: "flex-start", gap: 10,
          cursor: "pointer",
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: `${color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={14} color={color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
              {alert.type}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, color: "white",
              background: color, borderRadius: 4, padding: "2px 6px",
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}>
              {alert.severity}
            </span>
            {isAcknowledged && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)",
                background: "var(--secondary)", borderRadius: 4, padding: "2px 6px",
                textTransform: "uppercase",
              }}>
                Ack
              </span>
            )}
          </div>

          <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 3 }}>
            {alert.message || alert.equipment || "—"}
          </div>

          <div style={{
            fontSize: 10, color: "var(--muted-foreground)", marginTop: 3,
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Clock size={10} /> {relativeTime(alert.time || alert.createdAt)}
            </span>
            {alert.value != null && (
              <span style={{ fontFamily: "var(--font-mono)" }}>
                value: {String(alert.value)}
              </span>
            )}
            {alert.equipment && (
              <span>· {alert.equipment}</span>
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0, color: "var(--muted-foreground)" }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Expanded details + actions */}
      {expanded && (
        <div style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--border)",
          background: "var(--muted)",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 11 }}>
            <span style={{ color: "var(--muted-foreground)" }}>ID</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{alert.id}</span>

            <span style={{ color: "var(--muted-foreground)" }}>Source</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{alert.source || "—"}</span>

            <span style={{ color: "var(--muted-foreground)" }}>Raised</span>
            <span style={{ color: "var(--foreground)" }}>{formatTime(alert.time || alert.createdAt)}</span>

            {alert.acknowledgedAt && (
              <>
                <span style={{ color: "var(--muted-foreground)" }}>Acknowledged</span>
                <span style={{ color: "var(--foreground)" }}>{formatTime(alert.acknowledgedAt)}</span>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            {alert.status === "Active" && onAck && (
              <button
                onClick={(e) => { e.stopPropagation(); onAck(alert.id); }}
                style={{
                  padding: "5px 10px", fontSize: 11, fontWeight: 600,
                  background: COLORS.primary, color: "white",
                  border: "none", borderRadius: 5, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}
              >
                <CheckCircle size={12} /> Acknowledge
              </button>
            )}
            {onClear && (
              <button
                onClick={(e) => { e.stopPropagation(); onClear(alert.id); }}
                style={{
                  padding: "5px 10px", fontSize: 11, fontWeight: 600,
                  background: "transparent", color: "var(--muted-foreground)",
                  border: "1px solid var(--border)", borderRadius: 5, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}
              >
                <Trash2 size={12} /> Dismiss
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export function AlertsCenter({ onBack } = {}) {
  const {
    alerts,
    activeAlerts,
    counts,
    history,
    acknowledgeAlert,
    clearAlert,
    clearAllAcknowledged,
    clearHistory,
  } = useAlerts();

  const [tab, setTab]                 = useState("active");   // 'active' | 'history'
  const [severityFilter, setFilter]   = useState("All");      // 'All' | 'Critical' | ...
  const [search, setSearch]           = useState("");
  const [expandedId, setExpandedId]   = useState(null);

  // ── Filtered + sorted active list ───────────────────────────────────
  const filteredActive = useMemo(() => {
    let list = alerts.filter((a) => a.status === "Active" || a.status === "Acknowledged");

    if (severityFilter !== "All") {
      list = list.filter((a) => a.severity === severityFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) =>
        String(a.type || "").toLowerCase().includes(q) ||
        String(a.equipment || "").toLowerCase().includes(q) ||
        String(a.message || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const sa = SEVERITY_ORDER[a.severity] ?? 99;
      const sb = SEVERITY_ORDER[b.severity] ?? 99;
      if (sa !== sb) return sa - sb;
      return new Date(b.time || b.createdAt || 0) - new Date(a.time || a.createdAt || 0);
    });
  }, [alerts, severityFilter, search]);

  // ── Filtered history ────────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    let list = history;

    if (severityFilter !== "All") {
      list = list.filter((h) => h.severity === severityFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((h) =>
        String(h.type || h.kind || "").toLowerCase().includes(q) ||
        String(h.equipment || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort(
      (a, b) => new Date(b.time || 0) - new Date(a.time || 0)
    );
  }, [history, severityFilter, search]);

  const totalActive = activeAlerts.length;
  const totalAck    = alerts.filter((a) => a.status === "Acknowledged").length;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "var(--background)" }}>

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>

        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  padding: "4px 10px", fontSize: 11,
                  background: "var(--secondary)", color: "var(--foreground)",
                  border: "1px solid var(--border)", borderRadius: 5, cursor: "pointer",
                }}
              >
                ← Back
              </button>
            )}
            <Bell size={18} color={COLORS.primary} />
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
              Alerts Center
            </h1>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {totalAck > 0 && (
              <button
                onClick={clearAllAcknowledged}
                style={{
                  padding: "5px 10px", fontSize: 11,
                  background: "transparent", color: "var(--muted-foreground)",
                  border: "1px solid var(--border)", borderRadius: 5, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}
              >
                <Trash2 size={12} /> Clear Acknowledged ({totalAck})
              </button>
            )}
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Clear all alert history? This cannot be undone.")) {
                    clearHistory();
                  }
                }}
                style={{
                  padding: "5px 10px", fontSize: 11,
                  background: "transparent", color: COLORS.danger,
                  border: `1px solid ${COLORS.danger}40`, borderRadius: 5, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}
              >
                <HistoryIcon size={12} /> Clear History
              </button>
            )}
          </div>
        </div>

        {/* ── Count chips ─────────────────────────────────────────────── */}
        <div style={{ padding: "0 16px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          <CountChip label="Critical" count={counts.Critical} color={COLORS.danger}
            active={severityFilter === "Critical"} onClick={() => setFilter(severityFilter === "Critical" ? "All" : "Critical")} />
          <CountChip label="High" count={counts.High} color={COLORS.orange}
            active={severityFilter === "High"} onClick={() => setFilter(severityFilter === "High" ? "All" : "High")} />
          <CountChip label="Medium" count={counts.Medium} color={COLORS.yellow}
            active={severityFilter === "Medium"} onClick={() => setFilter(severityFilter === "Medium" ? "All" : "Medium")} />
          <CountChip label="Low" count={counts.Low} color={COLORS.success}
            active={severityFilter === "Low"} onClick={() => setFilter(severityFilter === "Low" ? "All" : "Low")} />
          <CountChip label="All" count={totalActive} color={COLORS.primary}
            active={severityFilter === "All"} onClick={() => setFilter("All")} />
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setTab("active")}
            style={{
              flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 600,
              background: tab === "active" ? "var(--card)" : "transparent",
              color: tab === "active" ? COLORS.primary : "var(--muted-foreground)",
              border: "none",
              borderBottom: tab === "active" ? `2px solid ${COLORS.primary}` : "2px solid transparent",
              cursor: "pointer", whiteSpace: "nowrap",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Activity size={14} /> Active & Acknowledged
            {totalActive > 0 && (
              <span style={{
                background: COLORS.danger, color: "white",
                borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 700,
              }}>{totalActive}</span>
            )}
          </button>
          <button
            onClick={() => setTab("history")}
            style={{
              flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 600,
              background: tab === "history" ? "var(--card)" : "transparent",
              color: tab === "history" ? COLORS.primary : "var(--muted-foreground)",
              border: "none",
              borderBottom: tab === "history" ? `2px solid ${COLORS.primary}` : "2px solid transparent",
              cursor: "pointer", whiteSpace: "nowrap",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <HistoryIcon size={14} /> History
            {history.length > 0 && (
              <span style={{
                background: "var(--secondary)", color: "var(--muted-foreground)",
                borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 700,
              }}>{history.length}</span>
            )}
          </button>
        </div>

        {/* ── Search bar ───────────────────────────────────────────────── */}
        <div style={{ padding: "8px 16px", position: "relative" }}>
          <Search size={13} style={{
            position: "absolute", left: 26, top: "50%",
            transform: "translateY(-50%)", color: "var(--muted-foreground)",
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts…"
            style={{
              width: "100%", padding: "7px 30px 7px 30px",
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 6, fontSize: 12, color: "var(--foreground)", outline: "none",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", right: 26, top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--muted-foreground)", padding: 0,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-3 sm:p-4">

        {tab === "active" && (
          <>
            {filteredActive.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 20px",
                color: "var(--muted-foreground)",
              }}>
                <CheckCircle size={40} style={{ color: COLORS.success, marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                  No active alerts
                </div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  All systems operating normally
                </div>
              </div>
            ) : (
              filteredActive.map((a) => (
                <AlertRow
                  key={a.id}
                  alert={a}
                  expanded={expandedId === a.id}
                  onToggleExpand={() => setExpandedId(expandedId === a.id ? null : a.id)}
                  onAck={a.status === "Active" ? acknowledgeAlert : undefined}
                  onClear={clearAlert}
                />
              ))
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {filteredHistory.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 20px",
                color: "var(--muted-foreground)",
              }}>
                <HistoryIcon size={40} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                  No history yet
                </div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  Alert events will appear here as they occur
                </div>
              </div>
            ) : (
              filteredHistory.slice(0, 500).map((h) => {
                const color = SEVERITY_COLOR[h.severity] || COLORS.muted;
                const Icon  = h.kind === "activated" ? Bell
                            : h.kind === "acknowledged" ? CheckCircle
                            : h.kind === "resolved" ? CheckCircle
                            : h.kind === "dismissed" ? BellOff
                            : Clock;

                return (
                  <div key={h.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "8px 10px", marginBottom: 6,
                    background: "var(--card)", borderRadius: 6,
                    border: "1px solid var(--border)",
                  }}>
                    <Icon size={13} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
                        {h.type || h.kind || "Event"}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
                        {h.kind ? `[${h.kind}] ` : ""}{formatTime(h.time)}
                        {h.equipment ? ` · ${h.equipment}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default AlertsCenter;