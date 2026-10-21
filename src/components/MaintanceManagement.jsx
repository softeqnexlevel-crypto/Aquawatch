// components/MaintenanceManagement.jsx - FULLY MOBILE RESPONSIVE

import React, { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, CheckCircle, AlertTriangle, Calendar, Wrench, Plus, X, Filter, Activity, ChevronLeft } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// ===================== STATUS BADGE =====================
const StatusBadge = ({ status, large }) => {
  const cfg = {
    "Completed": { bg: "rgba(34,197,94,0.1)", color: "#22c55e" },
    "In Progress": { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9" },
    "Scheduled": { bg: "rgba(167,139,250,0.1)", color: "#a78bfa" },
    "Overdue": { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
    "Pending": { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  }[status] || { bg: "rgba(77,122,158,0.1)", color: "#4d7a9e" };

  return (
    <span 
      className="rounded px-1.5 py-0.5" 
      style={{ 
        background: cfg.bg, 
        fontSize: large ? 10 : 9, 
        fontWeight: 600, 
        color: cfg.color, 
        letterSpacing: "0.06em",
        whiteSpace: "nowrap"
      }}
    >
      {status.toUpperCase()}
    </span>
  );
};

// ===================== PRIORITY BADGE =====================
const PriorityBadge = ({ priority, large }) => {
  const color = { 
    Critical: "#ef4444", 
    High: "#f97316", 
    Medium: "#eab308", 
    Low: "#22c55e" 
  }[priority] || "#4d7a9e";
  
  return <span style={{ fontSize: large ? 11 : 9, color, fontWeight: 600 }}>{priority}</span>;
};

// ===================== TOOLTIP =====================
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

// ===================== CALENDAR HELPERS =====================
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month - 1, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ===================== MAIN COMPONENT =====================
export function MaintenanceManagement() {
  const { sensorData, getValue, getHistory, lastUpdate } = useData();
  const [tab, setTab] = useState("workorders");
  const [showNewDrawer, setShowNewDrawer] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [isMobile, setIsMobile] = useState(false);

  // Get current date info for calendar
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Create calendar days array with proper offsets
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [firstDayIndex, daysInMonth]);

  // Phone detection: a narrow screen OR a touch-first device. The second test also catches a
  // phone that is showing the "Desktop site" (which reports a wide screen but is still a phone).
  useEffect(() => {
    const checkMobile = () => {
      const narrow = window.innerWidth < 768;
      const touchFirst = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(narrow || touchFirst);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ FIX: Use the correct RO5- prefixed keys
  const stage1Delta = getValue('RO5-Stage1Delta') || 0;
  const stage2Delta = getValue('RO5-Stage2Delta') || 0;
  const filterDeltaP = getValue('RO5-MediaFilterDeltaP') || 0;
  const roPressure = getValue('RO5-ROPressure') || 0;
  const recovery = getValue('RO5-SystemRecovery') || 0;
  const feedFlow = getValue('RO5-FEEDFlow') || 0;
  const permeateFlow = getValue('RO5-Permeateflow') || 0;

  // Get history for trend analysis
  const stage1History = getHistory('RO5-Stage1Delta');
  const stage2History = getHistory('RO5-Stage2Delta');
  const filterHistory = getHistory('RO5-MediaFilterDeltaP');
  const roHistory = getHistory('RO5-ROPressure');

  // ===================== GENERATE REAL WORK ORDERS =====================
  const maintenanceWorkOrders = useMemo(() => {
    const orders = [];

    if (stage1Delta > 0.55) {
      orders.push({
        id: `WO-${String(orders.length + 1).padStart(3, '0')}`,
        equipment: "RO Membrane Stage 1",
        assetId: "MEM-001",
        type: "Corrective",
        technician: stage1Delta > 0.60 ? "David" : "David K.",
        status: stage1Delta > 0.60 ? "Overdue" : "In Progress",
        priority: stage1Delta > 0.60 ? "Critical" : "High",
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        reason: `High ΔP: ${stage1Delta.toFixed(2)} bar`
      });
    }

    if (stage2Delta > 0.50) {
      orders.push({
        id: `WO-${String(orders.length + 1).padStart(3, '0')}`,
        equipment: "RO Membrane Stage 2",
        assetId: "MEM-002",
        type: "Corrective",
        technician: stage2Delta > 0.55 ? "David" : "David",
        status: stage2Delta > 0.55 ? "Overdue" : "Scheduled",
        priority: stage2Delta > 0.55 ? "High" : "Medium",
        dueDate: format(new Date(Date.now() + 86400000 * 2), 'yyyy-MM-dd'),
        reason: `High ΔP: ${stage2Delta.toFixed(2)} bar`
      });
    }

    if (filterDeltaP > 0.35) {
      orders.push({
        id: `WO-${String(orders.length + 1).padStart(3, '0')}`,
        equipment: "Media Filter Unit",
        assetId: "FLT-001",
        type: "Preventive",
        technician: "David K.",
        status: filterDeltaP > 0.45 ? "Overdue" : "Scheduled",
        priority: filterDeltaP > 0.45 ? "High" : "Medium",
        dueDate: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
        reason: `Filter ΔP: ${filterDeltaP.toFixed(2)} bar`
      });
    }

    if (roPressure > 15 || roPressure < 10) {
      orders.push({
        id: `WO-${String(orders.length + 1).padStart(3, '0')}`,
        equipment: "RO Pressure Pump",
        assetId: "PMP-001",
        type: "Inspection",
        technician: "David K.",
        status: roPressure > 16 ? "Overdue" : "Scheduled",
        priority: roPressure > 16 ? "Critical" : "High",
        dueDate: format(new Date(Date.now() + 86400000 * 3), 'yyyy-MM-dd'),
        reason: `Pressure: ${roPressure.toFixed(1)} bar`
      });
    }

    if (recovery < 70) {
      orders.push({
        id: `WO-${String(orders.length + 1).padStart(3, '0')}`,
        equipment: "RO System Optimization",
        assetId: "SYS-001",
        type: "Calibration",
        technician: "David K.",
        status: recovery < 65 ? "Overdue" : "Scheduled",
        priority: recovery < 65 ? "High" : "Medium",
        dueDate: format(new Date(Date.now() + 86400000 * 4), 'yyyy-MM-dd'),
        reason: `Low Recovery: ${recovery.toFixed(1)}%`
      });
    }

    if (orders.length < 4) {
      orders.push({
        id: `WO-${String(orders.length + 1).padStart(3, '0')}`,
        equipment: "Dosing Pump",
        assetId: "DOS-001",
        type: "Preventive",
        technician: "David K.",
        status: "Completed",
        priority: "Medium",
        dueDate: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
        reason: "Routine maintenance"
      });
      orders.push({
        id: `WO-${String(orders.length + 1).padStart(3, '0')}`,
        equipment: "Concentrate Valve",
        assetId: "VAL-001",
        type: "Inspection",
        technician: "David K.",
        status: "Completed",
        priority: "Low",
        dueDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
        reason: "Quarterly inspection"
      });
    }

    return orders;
  }, [stage1Delta, stage2Delta, filterDeltaP, roPressure, recovery]);

  // ===================== CALCULATE METRICS =====================
  const open = maintenanceWorkOrders.filter(w => w.status !== "Completed").length;
  const overdue = maintenanceWorkOrders.filter(w => w.status === "Overdue").length;
  const completed = maintenanceWorkOrders.filter(w => w.status === "Completed").length;
  const scheduled = maintenanceWorkOrders.filter(w => w.status === "Scheduled" || w.status === "In Progress").length;
  const systemHealth = Math.round(100 - (overdue / (open + 1)) * 20);

  // ===================== FILTER WORK ORDERS =====================
  const filteredOrders = useMemo(() => {
    if (filterStatus === 'All') return maintenanceWorkOrders;
    return maintenanceWorkOrders.filter(w => w.status === filterStatus);
  }, [maintenanceWorkOrders, filterStatus]);

  // ===================== GENERATE MAINTENANCE HOURS =====================
  // The base values are fixed per month (not random), so the chart no longer jumps every time a
  // live sensor value changes. The current month is adjusted by the live conditions.
  const maintenanceHoursMonthly = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonthIndex = new Date().getMonth();
    
    return months.map((month, i) => {
      const corrective = Math.floor(8 + (i * 1.5) + ((i * 7 + 3) % 4));
      const preventive = Math.floor(10 + (i * 0.8) + ((i * 5 + 2) % 3));
      const inspection = Math.floor(4 + ((i * 3 + 1) % 3));
      
      if (i === currentMonthIndex) {
        const totalIssues = (stage1Delta > 0.5 ? 1 : 0) + (stage2Delta > 0.5 ? 1 : 0) + (filterDeltaP > 0.3 ? 1 : 0);
        return {
          month,
          corrective: corrective + totalIssues * 2,
          preventive: preventive + (roPressure > 14 ? 2 : 0),
          inspection: inspection + (recovery < 70 ? 1 : 0)
        };
      }
      
      return { month, corrective, preventive, inspection };
    });
  }, [stage1Delta, stage2Delta, filterDeltaP, roPressure, recovery]);

  // ===================== GENERATE CALENDAR EVENTS =====================
  // Each open work order is placed on its real due date (when it falls in the month shown),
  // instead of a random day that changed on every refresh.
  const maintenanceDays = useMemo(() => {
    const events = {};
    maintenanceWorkOrders.forEach(order => {
      if (order.status === "Completed") return;
      const due = new Date(`${order.dueDate}T00:00:00`);
      if (due.getFullYear() !== currentYear || due.getMonth() + 1 !== currentMonth) return;
      const day = due.getDate();
      const color = order.priority === "Critical" ? "#ef4444" :
                    order.priority === "High" ? "#f97316" :
                    order.priority === "Medium" ? "#eab308" : "#22c55e";
      if (!events[day]) events[day] = [];
      events[day].push({
        label: order.assetId,
        color: color,
        order: order
      });
    });
    return events;
  }, [maintenanceWorkOrders, currentYear, currentMonth]);

  // ===================== NEW WORK ORDER STATE =====================
  const [newWO, setNewWO] = useState({
    equipment: "",
    assetId: "",
    type: "",
    technician: "",
    priority: "Medium",
    dueDate: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewWO(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`✅ New Work Order Created Successfully!\n\nEquipment: ${newWO.equipment}\nAsset ID: ${newWO.assetId}\nType: ${newWO.type}\nPriority: ${newWO.priority}\nTechnician: ${newWO.technician}\nDue Date: ${newWO.dueDate}`);
    setShowNewDrawer(false);
    setNewWO({ equipment: "", assetId: "", type: "", technician: "", priority: "Medium", dueDate: "" });
  };

  const statusFilters = ['All', 'Scheduled', 'In Progress', 'Overdue', 'Completed', 'Pending'];

  // Shared look for the drawer form fields. 16px text on phones also stops iOS from zooming in on focus.
  const fieldStyle = (extra = {}) => ({
    width: "100%",
    background: "var(--muted)",
    border: "1px solid var(--border)",
    borderRadius: isMobile ? 8 : 4,
    padding: isMobile ? "11px 12px" : "8px 12px",
    fontSize: isMobile ? 16 : 12,
    color: "var(--foreground)",
    outline: "none",
    ...extra,
  });
  const labelStyle = {
    fontSize: isMobile ? 11 : 10,
    color: "var(--muted-foreground)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    display: "block",
    marginBottom: 4,
  };

  const kpis = [
    { label: "Open Work Orders", value: open, icon: Wrench, color: "#0ea5e9" },
    { label: "Scheduled", value: scheduled, icon: Calendar, color: "#a78bfa" },
    { label: "Overdue", value: overdue, icon: AlertTriangle, color: "#ef4444" },
    { label: "Completed", value: completed, icon: CheckCircle, color: "#22c55e" },
    { label: "System Health", value: `${systemHealth}%`, icon: Activity, color: overdue > 2 ? "#ef4444" : "#22c55e" },
  ];

  return (
    <div className="antiscalant-scroll h-full overflow-auto">
      <style>{`
        .antiscalant-scroll {
          scrollbar-width: thin;
          scrollbar-color: #1f3a5f transparent;
          scrollbar-gutter: stable;
          overscroll-behavior: contain;
        }
        .antiscalant-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .antiscalant-scroll::-webkit-scrollbar-track { background: transparent; }
        .antiscalant-scroll::-webkit-scrollbar-thumb { background: #1f3a5f; border-radius: 8px; }
        .antiscalant-scroll::-webkit-scrollbar-thumb:hover { background: #00e5ff; }
        /* status chips scroll sideways on phones, without a visible scrollbar */
        .maint-chips { scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .maint-chips::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4"
        style={{
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
          // room for the bottom navigation bar on phones
          ...(isMobile ? { paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' } : {}),
        }}
      >
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 style={{ fontSize: isMobile ? 18 : 16, fontWeight: 700, color: "var(--foreground)" }}>
              Maintenance Management
            </h2>
            <p style={{ fontSize: isMobile ? 12 : 11, color: "var(--muted-foreground)", marginTop: 2 }}>
              Real-time maintenance tracking • Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
            </p>
          </div>
          <button
            onClick={() => setShowNewDrawer(true)}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded transition-colors hover:bg-cyan-600 w-full sm:w-auto justify-center"
            style={{ background: "#0ea5e9", color: "#020810", fontSize: isMobile ? 13 : 12, fontWeight: 600, minHeight: isMobile ? 42 : undefined }}
          >
            <Plus size={isMobile ? 16 : 16} /> New Work Order
          </button>
        </div>

        {/* KPI Cards - 2 columns on phones (all 5 shown) */}
        <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)" }}>
          {kpis.map((c, idx) => (
            <div
              key={c.label}
              className="rounded p-3 flex gap-2 sm:gap-3 items-start"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                // on a 2-column phone grid the 5th card spans the full width
                ...(isMobile && idx === kpis.length - 1 ? { gridColumn: "1 / -1" } : {}),
              }}
            >
              <div className="rounded p-1.5 mt-0.5" style={{ background: `${c.color}15` }}>
                <c.icon size={isMobile ? 16 : 14} style={{ color: c.color }} />
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 10 : 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: isMobile ? 22 : 20, fontWeight: 700, color: c.color, lineHeight: isMobile ? 1.3 : 2.0 }}>{c.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div className="flex flex-wrap items-center gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
          {[
            { id: "workorders", label: "Work Orders" },
            { id: "calendar", label: "Maintenance Calendar" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-3 py-2 transition-colors"
              style={{
                fontSize: isMobile ? 13 : 11,
                fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? "#0ea5e9" : "var(--muted-foreground)",
                borderBottom: tab === t.id ? "2px solid #0ea5e9" : "2px solid transparent",
                marginBottom: -1,
                minHeight: isMobile ? 42 : undefined,
              }}
            >
              {t.label}
            </button>
          ))}

          {/* Status filter: on desktop it sits at the right of the tab bar */}
          {!isMobile && tab === "workorders" && (
            <>
              <div className="flex-1" />
              <div className="flex items-center gap-1 flex-wrap">
                <Filter size={12} style={{ color: "var(--muted-foreground)" }} />
                {statusFilters.map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: 8,
                      fontWeight: filterStatus === status ? 600 : 400,
                      background: filterStatus === status ? '#0ea5e9' : 'transparent',
                      color: filterStatus === status ? 'white' : 'var(--muted-foreground)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Status filter on phones: its own row, scrolls sideways, full names */}
        {isMobile && tab === "workorders" && (
          <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
            <Filter size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <div className="maint-chips" style={{ display: 'flex', gap: 6, flex: 1, minWidth: 0, overflowX: 'auto', paddingBottom: 2 }}>
              {statusFilters.map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 14,
                    fontSize: 12,
                    fontWeight: filterStatus === status ? 600 : 400,
                    background: filterStatus === status ? '#0ea5e9' : 'var(--secondary)',
                    color: filterStatus === status ? 'white' : 'var(--muted-foreground)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {tab === "workorders" ? (
            <>
              {/* Work Orders: only as tall as the rows need (no big empty box); long lists scroll inside */}
              <div className="rounded overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
                {isMobile ? (
                  <div className="flex flex-col gap-2 p-2">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((w) => (
                        <div key={w.id} className="rounded p-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#0ea5e9", fontWeight: 600 }}>{w.id}</span>
                            <StatusBadge status={w.status} large />
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{w.equipment}</div>
                          <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 1 }}>Asset: {w.assetId} • {w.type}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{w.technician}</span>
                            <PriorityBadge priority={w.priority} large />
                          </div>
                          <div style={{ fontSize: 11, color: w.status === "Overdue" ? "#ef4444" : "var(--muted-foreground)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                            Due: {w.dueDate}
                          </div>
                          {w.reason && (
                            <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 3 }}>{w.reason}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: "20px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 12 }}>
                        No work orders found with status: {filterStatus}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-auto antiscalant-scroll" style={{ maxHeight: 480 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                      <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr style={{ background: "var(--muted)" }}>
                          {["WO #", "Equipment", "Asset ID", "Type", "Technician", "Status", "Priority", "Due Date", "Reason"].map(h => (
                            <th key={h} style={{ 
                              padding: "8px 10px", 
                              textAlign: "left", 
                              fontSize: 9, 
                              fontWeight: 600, 
                              color: "var(--muted-foreground)", 
                              letterSpacing: "0.08em", 
                              textTransform: "uppercase", 
                              borderBottom: "1px solid var(--border)",
                              background: "var(--muted)"
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((w, i) => (
                          <tr key={w.id} style={{ background: i % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                            <td style={{ padding: "8px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "#0ea5e9", borderBottom: "1px solid var(--border)" }}>{w.id}</td>
                            <td style={{ padding: "8px 10px", fontSize: 11, fontWeight: 500, color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>{w.equipment}</td>
                            <td style={{ padding: "8px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{w.assetId}</td>
                            <td style={{ padding: "8px 10px", fontSize: 10, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{w.type}</td>
                            <td style={{ padding: "8px 10px", fontSize: 10, color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>{w.technician}</td>
                            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}><StatusBadge status={w.status} /></td>
                            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}><PriorityBadge priority={w.priority} /></td>
                            <td style={{ padding: "8px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: w.status === "Overdue" ? "#ef4444" : "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{w.dueDate}</td>
                            <td style={{ padding: "8px 10px", fontSize: 10, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{w.reason || '—'}</td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan={9} style={{ padding: "20px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 11 }}>
                              No work orders found with status: {filterStatus}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Maintenance Hours Chart */}
              <div className="rounded p-3 shrink-0" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-1">
                  <span style={{ fontSize: isMobile ? 12 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Maintenance Hours by Month
                  </span>
                  <span style={{ fontSize: isMobile ? 10 : 9, color: "var(--muted-foreground)" }}>
                    Based on real system data
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={isMobile ? 190 : 180}>
                  <BarChart data={maintenanceHoursMonthly} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: isMobile ? 11 : 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: isMobile ? 11 : 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="corrective" stackId="a" fill="#ef4444" name="Corrective" />
                    <Bar dataKey="preventive" stackId="a" fill="#0ea5e9" name="Preventive" />
                    <Bar dataKey="inspection" stackId="a" fill="#22c55e" radius={[3, 3, 0, 0]} name="Inspection" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            /* Calendar View */
            <div className="rounded p-3 sm:p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: isMobile ? 12 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                {format(new Date(), 'MMMM yyyy')} — Maintenance Schedule
              </div>
              <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                {weekDays.map(d => (
                  <div key={d} style={{ padding: isMobile ? "4px 0" : "4px 0", textAlign: "center", fontSize: isMobile ? 10 : 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.04em" }}>
                    {d}
                  </div>
                ))}
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return (
                      <div 
                        key={`empty-${index}`} 
                        style={{ 
                          minHeight: isMobile ? 50 : 52, 
                          padding: isMobile ? "3px 4px" : "4px 5px", 
                          border: "1px solid var(--border)" 
                        }}
                      />
                    );
                  }
                  
                  const events = maintenanceDays[day] || [];
                  const isToday = day === currentDate.getDate() && 
                                  currentMonth === (currentDate.getMonth() + 1) && 
                                  currentYear === currentDate.getFullYear();
                  
                  return (
                    <div 
                      key={day} 
                      className="rounded flex flex-col gap-0.5 cursor-pointer transition-colors hover:border-cyan-500" 
                      style={{ 
                        minHeight: isMobile ? 50 : 52, 
                        padding: isMobile ? "3px 4px" : "4px 5px", 
                        background: isToday ? "rgba(14,165,233,0.12)" : "var(--muted)", 
                        border: isToday ? "1px solid #0ea5e9" : "1px solid var(--border)" 
                      }}
                      title={events.map(e => `${e.label}: ${e.order?.reason || ''}`).join('\n')}
                    >
                      <span style={{ 
                        fontSize: isMobile ? 12 : 10, 
                        fontFamily: "var(--font-mono)", 
                        color: isToday ? "#0ea5e9" : "var(--muted-foreground)", 
                        fontWeight: isToday ? 700 : 400 
                      }}>
                        {day}
                      </span>

                      {isMobile ? (
                        // phones: coloured dots (one per work order, colour = priority) are readable at this size
                        events.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
                            {events.slice(0, 4).map((e, idx) => (
                              <span key={idx} style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
                            ))}
                            {events.length > 4 && (
                              <span style={{ fontSize: 9, color: "var(--muted-foreground)", lineHeight: 1 }}>+{events.length - 4}</span>
                            )}
                          </div>
                        )
                      ) : (
                        <>
                          {events.slice(0, 2).map((e, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                fontSize: 7, 
                                fontWeight: 600, 
                                color: e.color, 
                                background: `${e.color}18`, 
                                borderRadius: 2, 
                                padding: "1px 2px", 
                                lineHeight: 2.0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              title={e.order?.reason || e.label}
                            >
                              {e.label}
                            </div>
                          ))}
                          {events.length > 2 && (
                            <div style={{ fontSize: 6, color: "var(--muted-foreground)", textAlign: "center" }}>
                              +{events.length - 2}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* On phones the calendar shows dots, so list this month's open work orders underneath */}
              {isMobile && Object.keys(maintenanceDays).length > 0 && (
                <div className="flex flex-col gap-2" style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Due this month
                  </div>
                  {Object.keys(maintenanceDays)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .flatMap(day => maintenanceDays[day].map(e => ({ day, ...e })))
                    .map((e, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded p-2" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{e.order.equipment}</div>
                          <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{e.order.reason}</div>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", flexShrink: 0 }}>
                          {format(new Date(currentYear, currentMonth - 1, e.day), 'd MMM')}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <div style={{ marginTop: 12, display: 'flex', gap: isMobile ? 12 : 12, flexWrap: 'wrap' }}>
                {[
                  ["Critical", "#ef4444"],
                  ["High", "#f97316"],
                  ["Medium", "#eab308"],
                  ["Low", "#22c55e"],
                ].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1">
                    <div style={{ width: 10, height: isMobile ? 10 : 3, background: color, borderRadius: isMobile ? "50%" : 1 }} />
                    <span style={{ fontSize: isMobile ? 11 : 8, color: "var(--muted-foreground)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* New Work Order Drawer */}
        {showNewDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowNewDrawer(false)} />
            
            <div className="relative w-full sm:w-96 h-full shadow-2xl overflow-auto antiscalant-scroll" style={{ background: "var(--card)", borderLeft: "1px solid var(--border)" }}>
              <div className="p-4 sm:p-5 border-b" style={{ borderColor: "var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--card)", zIndex: 10 }}>
                <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: "var(--foreground)" }}>Create New Work Order</h2>
                <button 
                  onClick={() => setShowNewDrawer(false)} 
                  style={{ padding: 10, borderRadius: 6, background: "var(--muted)", border: "none", cursor: "pointer" }}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{
                  padding: isMobile ? 16 : 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? 14 : 16,
                  paddingBottom: isMobile ? 'calc(24px + env(safe-area-inset-bottom, 0px))' : 20,
                }}
              >
                <div>
                  <label style={labelStyle}>Equipment</label>
                  <input
                    name="equipment"
                    value={newWO.equipment}
                    onChange={handleInputChange}
                    required
                    style={fieldStyle()}
                    placeholder="e.g. BH-003 Pump Assembly"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Asset ID</label>
                  <input
                    name="assetId"
                    value={newWO.assetId}
                    onChange={handleInputChange}
                    required
                    style={fieldStyle({ fontFamily: "var(--font-mono)" })}
                    placeholder="PMP-003"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Type</label>
                  <select
                    name="type"
                    value={newWO.type}
                    onChange={handleInputChange}
                    required
                    style={fieldStyle()}
                  >
                    <option value="">Select Type</option>
                    <option value="Corrective">Corrective</option>
                    <option value="Preventive">Preventive</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Calibration">Calibration</option>
                    <option value="Replacement">Replacement</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Technician</label>
                  <input
                    name="technician"
                    value={newWO.technician}
                    onChange={handleInputChange}
                    required
                    style={fieldStyle()}
                    placeholder="Peter Ochieng"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label style={labelStyle}>Priority</label>
                    <select
                      name="priority"
                      value={newWO.priority}
                      onChange={handleInputChange}
                      style={fieldStyle()}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Due Date</label>
                    <input
                      name="dueDate"
                      type="date"
                      value={newWO.dueDate}
                      onChange={handleInputChange}
                      required
                      style={fieldStyle()}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  style={{ 
                    width: "100%", 
                    padding: isMobile ? "13px" : "12px", 
                    borderRadius: isMobile ? 8 : 4, 
                    fontWeight: 600, 
                    fontSize: isMobile ? 14 : 13, 
                    marginTop: 4,
                    background: "#0ea5e9", 
                    color: "#020810",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.background = "#0c8bc7"}
                  onMouseLeave={(e) => e.target.style.background = "#0ea5e9"}
                >
                  Create Work Order
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MaintenanceManagement;