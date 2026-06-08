import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { maintenanceWorkOrders, maintenanceHoursMonthly } from "../data/mockData";
import { Clock, CheckCircle, AlertTriangle, Calendar, Wrench, Plus } from "lucide-react";

const StatusBadge = ({ status }) => {
  const cfg = {
    "Completed": { bg: "rgba(34,197,94,0.1)", color: "#22c55e" },
    "In Progress": { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9" },
    "Scheduled": { bg: "rgba(167,139,250,0.1)", color: "#a78bfa" },
    "Overdue": { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
  }[status] || { bg: "rgba(77,122,158,0.1)", color: "#4d7a9e" };

  return (
    <span 
      className="rounded px-1.5 py-0.5" 
      style={{ 
        background: cfg.bg, 
        fontSize: 9, 
        fontWeight: 600, 
        color: cfg.color, 
        letterSpacing: "0.06em" 
      }}
    >
      {status.toUpperCase()}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const color = { 
    Critical: "#ef4444", 
    High: "#f97316", 
    Medium: "#eab308", 
    Low: "#22c55e" 
  }[priority] || "#4d7a9e";
  
  return <span style={{ fontSize: 9, color, fontWeight: 600 }}>{priority}</span>;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1828", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 4, padding: "6px 10px" }}>
      <p style={{ fontSize: 10, color: "#4d7a9e", marginBottom: 2 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: p.color }}>
          {p.name}: {p.value}h
        </p>
      ))}
    </div>
  );
};

const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

const maintenanceDays = {
  8: [{ label: "BH-003", color: "#ef4444" }],
  12: [{ label: "Filter 1", color: "#eab308" }],
  14: [{ label: "Dosing", color: "#a78bfa" }],
  20: [{ label: "BH-005", color: "#0ea5e9" }],
  25: [{ label: "BH-002", color: "#0ea5e9" }],
  28: [{ label: "BH-004", color: "#22c55e" }],
};

export function MaintenanceManagement() {
  const [tab, setTab] = useState("workorders");

  const open = maintenanceWorkOrders.filter(w => w.status !== "Completed").length;
  const overdue = maintenanceWorkOrders.filter(w => w.status === "Overdue").length;
  const completed = maintenanceWorkOrders.filter(w => w.status === "Completed").length;
  const scheduled = maintenanceWorkOrders.filter(w => w.status === "Scheduled").length;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      {/* KPI Cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {[
          { label: "Open Work Orders", value: open, icon: Wrench, color: "#0ea5e9" },
          { label: "Scheduled", value: scheduled, icon: Calendar, color: "#a78bfa" },
          { label: "Overdue", value: overdue, icon: AlertTriangle, color: "#ef4444" },
          { label: "Completed (June)", value: completed, icon: CheckCircle, color: "#22c55e" },
          { label: "Downtime Hours (June)", value: "6.5h", icon: Clock, color: "#eab308" },
        ].map(c => (
          <div 
            key={c.label} 
            className="rounded p-3 flex gap-3 items-start" 
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="rounded p-1.5 mt-0.5" style={{ background: `${c.color}15` }}>
              <c.icon size={14} style={{ color: c.color }} />
            </div>
            <div>
              <div style={{ 
                fontSize: 9, 
                color: "var(--muted-foreground)", 
                textTransform: "uppercase", 
                letterSpacing: "0.06em" 
              }}>
                {c.label}
              </div>
              <div style={{ 
                fontFamily: "var(--font-mono)", 
                fontSize: 20, 
                fontWeight: 700, 
                color: c.color, 
                lineHeight: 1.2 
              }}>
                {c.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
        {[
          { id: "workorders", label: "Work Orders" },
          { id: "calendar", label: "Maintenance Calendar" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-2 transition-colors"
            style={{
              fontSize: 11, 
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "#0ea5e9" : "var(--muted-foreground)",
              borderBottom: tab === t.id ? "2px solid #0ea5e9" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded mb-1" 
          style={{ background: "#0ea5e9", color: "#020810", fontSize: 11, fontWeight: 600 }}
        >
          <Plus size={12} /> New Work Order
        </button>
      </div>

      {tab === "workorders" ? (
        <>
          {/* Work orders table */}
          <div className="rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  {["WO #", "Equipment", "Asset ID", "Type", "Technician", "Status", "Priority", "Due Date"].map(h => (
                    <th 
                      key={h} 
                      style={{ 
                        padding: "8px 10px", 
                        textAlign: "left", 
                        fontSize: 9, 
                        fontWeight: 600, 
                        color: "var(--muted-foreground)", 
                        letterSpacing: "0.08em", 
                        textTransform: "uppercase", 
                        borderBottom: "1px solid var(--border)" 
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {maintenanceWorkOrders.map((w, i) => (
                  <tr 
                    key={w.id} 
                    style={{ background: i % 2 === 0 ? "var(--card)" : "var(--muted)" }}
                  >
                    <td style={{ padding: "8px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#0ea5e9", borderBottom: "1px solid var(--border)" }}>
                      {w.id}
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 11, fontWeight: 500, color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                      {w.equipment}
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                      {w.assetId}
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 10, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                      {w.type}
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 10, color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                      {w.technician}
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
                      <StatusBadge status={w.status} />
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
                      <PriorityBadge priority={w.priority} />
                    </td>
                    <td style={{ 
                      padding: "8px 10px", 
                      fontSize: 10, 
                      fontFamily: "var(--font-mono)", 
                      color: w.status === "Overdue" ? "#ef4444" : "var(--muted-foreground)", 
                      borderBottom: "1px solid var(--border)" 
                    }}>
                      {w.dueDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Maintenance hours chart */}
          <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Maintenance Hours by Month
              </span>
              <div className="flex gap-3">
                {[
                  { color: "#ef4444", label: "Corrective" }, 
                  { color: "#0ea5e9", label: "Preventive" }, 
                  { color: "#22c55e", label: "Inspection" }
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div style={{ width: 8, height: 8, borderRadius: 1, background: l.color }} />
                    <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={maintenanceHoursMonthly} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="corrective" stackId="a" fill="#ef4444" name="Corrective" />
                <Bar dataKey="preventive" stackId="a" fill="#0ea5e9" name="Preventive" />
                <Bar dataKey="inspection" stackId="a" fill="#22c55e" radius={[3, 3, 0, 0]} name="Inspection" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        /* Calendar view */
        <div className="rounded p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div style={{ 
            fontSize: 11, 
            fontWeight: 600, 
            color: "var(--muted-foreground)", 
            textTransform: "uppercase", 
            letterSpacing: "0.1em", 
            marginBottom: 12 
          }}>
            June 2026 — Maintenance Schedule
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
              <div 
                key={d} 
                style={{ 
                  padding: "4px 0", 
                  textAlign: "center", 
                  fontSize: 9, 
                  fontWeight: 600, 
                  color: "var(--muted-foreground)", 
                  letterSpacing: "0.08em" 
                }}
              >
                {d}
              </div>
            ))}

            {calendarDays.map(day => {
              const events = maintenanceDays[day] || [];
              const isToday = day === 6;
              return (
                <div
                  key={day}
                  className="rounded flex flex-col gap-1 cursor-pointer transition-colors"
                  style={{
                    minHeight: 52,
                    padding: "4px 5px",
                    background: isToday ? "rgba(14,165,233,0.12)" : "var(--muted)",
                    border: isToday ? "1px solid #0ea5e9" : "1px solid var(--border)",
                  }}
                >
                  <span style={{ 
                    fontSize: 10, 
                    fontFamily: "var(--font-mono)", 
                    color: isToday ? "#0ea5e9" : "var(--muted-foreground)", 
                    fontWeight: isToday ? 700 : 400 
                  }}>
                    {day}
                  </span>
                  {events.map(e => (
                    <div 
                      key={e.label} 
                      style={{ 
                        fontSize: 8, 
                        fontWeight: 600, 
                        color: e.color, 
                        background: `${e.color}18`, 
                        borderRadius: 2, 
                        padding: "0 3px", 
                        lineHeight: 1.6 
                      }}
                    >
                      {e.label}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}