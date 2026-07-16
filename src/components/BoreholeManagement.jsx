// components/FeedTankManagement.jsx - FULLY RESPONSIVE WITH ALL FEATURES

import React, { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { MapPin, ChevronRight, Activity, Clock, Wrench, Droplet, Filter, AlertCircle, ChevronLeft } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { format, subDays } from 'date-fns';

// ===================== STATUS BADGE =====================
const StatusBadge = ({ status }) => {
  const cfg = {
    Active: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", dot: "#22c55e" },
    Maintenance: { bg: "rgba(234,179,8,0.1)", color: "#eab308", dot: "#eab308" },
    Standby: { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9", dot: "#0ea5e9" },
    Offline: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", dot: "#ef4444" },
    Warning: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", dot: "#f59e0b" },
    Empty: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", dot: "#ef4444" },
    Refilling: { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9", dot: "#0ea5e9" },
  }[status] || { bg: "rgba(77,122,158,0.1)", color: "#4d7a9e", dot: "#4d7a9e" };

  return (
    <span className="flex items-center gap-1 rounded px-1.5 py-0.5" style={{ background: cfg.bg }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      <span style={{ fontSize: 10, color: cfg.color, fontWeight: 500 }}>{status}</span>
    </span>
  );
};

// ===================== HEALTH BAR =====================
const HealthBar = ({ value }) => {
  const color = value >= 80 ? "#22c55e" : value >= 60 ? "#eab308" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 60, height: 4, background: "var(--secondary)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color, minWidth: 28 }}>{Math.round(value)}%</span>
    </div>
  );
};

// ===================== TOOLTIP =====================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1828", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 4, padding: "6px 10px" }}>
      <p style={{ fontSize: 10, color: "#4d7a9e" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: p.color }}>
          {p.value?.toLocaleString()} m³
        </p>
      ))}
    </div>
  );
};

// ===================== SCALE HELPER =====================
const scaleTankLevel = (rawValue) => {
  if (rawValue === undefined || rawValue === null) return 0;
  const clamped = Math.min(Math.max(rawValue, 5), 10);
  return ((clamped - 5) / (10 - 5)) * 95 + 5;
};

// ===================== MAIN COMPONENT =====================
export function FeedTankManagement() {
  const { sensorData, getValue, getHistory, lastUpdate } = useData();
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [isMobile, setIsMobile] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get real data from sensors
  const feedFlow = getValue('RO5-FEEDFlow') || 0;
  const recovery = getValue('RO5-SystemRecovery') || 0;
  const stage1Delta = getValue('RO5-Stage1Delta') || 0;
  const rawTankLevel = getValue('RO5-FeedTankLevel');
  const scaledTankLevel = scaleTankLevel(rawTankLevel);
  const tankHistory = getHistory('RO5-FeedTankLevel');

  // ===================== GENERATE FEED TANKS =====================
  const feedTanks = useMemo(() => {
    const now = new Date();
    
    const tankALevel = Math.min(100, Math.max(0, scaledTankLevel));
    const tankBLevel = Math.min(100, Math.max(0, Math.min(100, scaledTankLevel * 0.85 + 2)));
    const tankCLevel = Math.min(100, Math.max(0, Math.min(100, scaledTankLevel * 0.65 + 1)));
    const tankDLevel = Math.min(100, Math.max(0, Math.min(100, scaledTankLevel * 0.45 + 0.5)));

    const getStatus = (level) => {
      if (level > 70) return "Active";
      if (level > 40) return "Standby";
      if (level > 15) return "Warning";
      return "Empty";
    };

    const getHealth = (level) => {
      const baseHealth = (level / 100) * 70 + 30;
      const recoveryBonus = Math.min(20, (recovery / 100) * 20);
      return Math.min(100, baseHealth + recoveryBonus - (stage1Delta > 0.5 ? 10 : 0));
    };

    return [
      {
        id: "FT-A",
        name: "Main Feed Tank A",
        location: "North Plant",
        status: getStatus(tankALevel),
        level: tankALevel,
        capacity: 500,
        volume: (tankALevel / 100) * 500,
        dailyConsumption: feedFlow * 24 * 0.4,
        monthlyConsumption: feedFlow * 24 * 30 * 0.4,
        runtimeHours: 22.5,
        health: getHealth(tankALevel),
        lastMaintenance: format(subDays(now, 45), 'yyyy-MM-dd'),
        nextMaintenance: format(subDays(now, -15), 'yyyy-MM-dd'),
      },
      {
        id: "FT-B",
        name: "Secondary Feed Tank B",
        location: "East Plant",
        status: getStatus(tankBLevel),
        level: tankBLevel,
        capacity: 400,
        volume: (tankBLevel / 100) * 400,
        dailyConsumption: feedFlow * 24 * 0.35,
        monthlyConsumption: feedFlow * 24 * 30 * 0.35,
        runtimeHours: 18.2,
        health: getHealth(tankBLevel),
        lastMaintenance: format(subDays(now, 30), 'yyyy-MM-dd'),
        nextMaintenance: format(subDays(now, -20), 'yyyy-MM-dd'),
      },
      {
        id: "FT-C",
        name: "Reserve Feed Tank C",
        location: "South Plant",
        status: getStatus(tankCLevel),
        level: tankCLevel,
        capacity: 300,
        volume: (tankCLevel / 100) * 300,
        dailyConsumption: feedFlow * 24 * 0.25,
        monthlyConsumption: feedFlow * 24 * 30 * 0.25,
        runtimeHours: 14.8,
        health: getHealth(tankCLevel),
        lastMaintenance: format(subDays(now, 25), 'yyyy-MM-dd'),
        nextMaintenance: format(subDays(now, -10), 'yyyy-MM-dd'),
      },
      {
        id: "FT-D",
        name: "Emergency Feed Tank D",
        location: "West Plant",
        status: getStatus(tankDLevel),
        level: tankDLevel,
        capacity: 200,
        volume: (tankDLevel / 100) * 200,
        dailyConsumption: feedFlow * 24 * 0.15,
        monthlyConsumption: feedFlow * 24 * 30 * 0.15,
        runtimeHours: 12.5,
        health: getHealth(tankDLevel),
        lastMaintenance: format(subDays(now, 50), 'yyyy-MM-dd'),
        nextMaintenance: format(subDays(now, -5), 'yyyy-MM-dd'),
      }
    ];
  }, [scaledTankLevel, feedFlow, recovery, stage1Delta]);

  // ===================== SET INITIAL SELECTION =====================
  useEffect(() => {
    if (feedTanks.length > 0 && !selected) {
      setSelected(feedTanks[0]);
    }
  }, [feedTanks]);

  // ===================== FILTER TANKS =====================
  const filteredTanks = useMemo(() => {
    if (filterStatus === 'All') return feedTanks;
    return feedTanks.filter(t => t.status === filterStatus);
  }, [feedTanks, filterStatus]);

  // ===================== GENERATE HISTORY =====================
  const tankHistoryData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, 6).map((month, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const monthName = months[monthIndex];
      
      let consumption = 30000 + Math.random() * 5000;
      if (tankHistory && tankHistory.length > 0) {
        const avgLevel = tankHistory.reduce((sum, d) => sum + d.value, 0) / tankHistory.length;
        consumption = avgLevel * 100 * (0.8 + Math.random() * 0.4);
      }
      
      return { month: monthName, consumption: Math.round(consumption) };
    });
  }, [tankHistory]);

  // ===================== STATUS FILTERS =====================
  const statusFilters = ['All', 'Active', 'Standby', 'Warning', 'Empty', 'Maintenance'];

  // Calculate totals
  const totalCapacity = feedTanks.reduce((sum, t) => sum + t.capacity, 0);
  const totalVolume = feedTanks.reduce((sum, t) => sum + t.volume, 0);
  const overallLevel = totalCapacity > 0 ? (totalVolume / totalCapacity) * 100 : 0;

  // Handle tank selection
  const handleTankSelect = (tank) => {
    setSelected(tank);
    if (isMobile) {
      setShowDetail(true);
    }
  };

  // Handle back from detail
  const handleBack = () => {
    setShowDetail(false);
  };

  return (
    <div className="flex h-full overflow-hidden flex-col md:flex-row">
      
      {/* Table panel */}
      <div className={`flex flex-col flex-1 min-w-0 overflow-auto p-2 sm:p-4 ${isMobile && showDetail ? 'hidden' : 'flex'}`} style={{ scrollbarWidth: "none" }}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-3 gap-2">
          <div>
            <h2 style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <Droplet size={isMobile ? 12 : 14} style={{ display: 'inline', marginRight: 4 }} />
              Feed Tank Overview · {feedTanks.length} Tanks
            </h2>
            <div style={{ fontSize: isMobile ? 8 : 10, color: "var(--muted-foreground)", marginTop: 2 }}>
              Total Capacity: {totalCapacity.toLocaleString()} m³ · Current Volume: {totalVolume.toFixed(0)} m³ · 
              Overall Level: <span style={{ color: overallLevel > 50 ? '#22c55e' : overallLevel > 25 ? '#eab308' : '#ef4444', fontWeight: 600 }}>
                {overallLevel.toFixed(0)}%
              </span>
              {!isMobile && (
                <span style={{ fontSize: 9, color: "var(--muted-foreground)", marginLeft: 8 }}>
                  (PLC Raw: {typeof rawTankLevel === 'number' ? rawTankLevel.toFixed(2) : '--'} → Scaled: {scaledTankLevel.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Filter size={isMobile ? 10 : 12} style={{ color: "var(--muted-foreground)" }} />
            {statusFilters.map(f => (
              <button 
                key={f} 
                onClick={() => setFilterStatus(f)}
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs transition-colors" 
                style={{ 
                  background: filterStatus === f ? "#0ea5e9" : "var(--secondary)", 
                  color: filterStatus === f ? "white" : "var(--muted-foreground)", 
                  border: "1px solid var(--border)", 
                  fontSize: isMobile ? 7 : 9,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {isMobile && f !== 'All' ? f.charAt(0) : f}
              </button>
            ))}
            <span style={{ fontSize: isMobile ? 7 : 9, color: "var(--muted-foreground)", marginLeft: 2 }}>
              {filteredTanks.length} shown
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded overflow-hidden" style={{ border: "1px solid var(--border)", flex: 1 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 500 : 'auto' }}>
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  {isMobile ? (
                    <>
                      <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>ID</th>
                      <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>Status</th>
                      <th style={{ padding: "6px 8px", textAlign: "right", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>Level</th>
                      <th style={{ padding: "6px 8px", textAlign: "right", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>Volume</th>
                      <th style={{ padding: "6px 8px", textAlign: "right", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>Consumption</th>
                      <th style={{ padding: "6px 8px", textAlign: "center", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>Health</th>
                      <th style={{ padding: "6px 8px", textAlign: "center", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}></th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>ID</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Name</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Location</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Status</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Level</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Volume</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Capacity</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Consumption</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Health</th>
                      <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}></th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredTanks.map((t, i) => (
                  <tr
                    key={t.id}
                    onClick={() => handleTankSelect(t)}
                    className="cursor-pointer transition-colors"
                    style={{
                      background: selected?.id === t.id ? "rgba(14,165,233,0.06)" : i % 2 === 0 ? "var(--card)" : "var(--muted)",
                      borderLeft: selected?.id === t.id ? "2px solid #0ea5e9" : "2px solid transparent",
                    }}
                  >
                    {isMobile ? (
                      <>
                        <td style={{ padding: "5px 8px", fontSize: 10, fontFamily: "var(--font-mono)", color: "#0ea5e9", borderBottom: "1px solid var(--border)" }}>
                          {t.id}
                        </td>
                        <td style={{ padding: "5px 8px", borderBottom: "1px solid var(--border)" }}>
                          <StatusBadge status={t.status} />
                        </td>
                        <td style={{ padding: "5px 8px", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600, textAlign: "right", color: t.level > 50 ? "#22c55e" : t.level > 25 ? "#eab308" : "#ef4444", borderBottom: "1px solid var(--border)" }}>
                          {t.level.toFixed(0)}%
                        </td>
                        <td style={{ padding: "5px 8px", fontSize: 10, fontFamily: "var(--font-mono)", textAlign: "right", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                          {t.volume.toFixed(0)}
                        </td>
                        <td style={{ padding: "5px 8px", fontSize: 10, fontFamily: "var(--font-mono)", textAlign: "right", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                          {t.dailyConsumption.toFixed(0)}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                          <HealthBar value={t.health} />
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                          <ChevronRight size={14} style={{ color: "var(--muted-foreground)" }} />
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#0ea5e9", borderBottom: "1px solid var(--border)" }}>
                          {t.id}
                        </td>
                        <td style={{ padding: "7px 10px", fontSize: 11, color: "var(--foreground)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>
                          {t.name}
                        </td>
                        <td style={{ padding: "7px 10px", fontSize: 10, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                          <div className="flex items-center gap-1">
                            <MapPin size={9} />{t.location}
                          </div>
                        </td>
                        <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)" }}>
                          <StatusBadge status={t.status} />
                        </td>
                        <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600, color: t.level > 50 ? "#22c55e" : t.level > 25 ? "#eab308" : "#ef4444", borderBottom: "1px solid var(--border)" }}>
                          {t.level.toFixed(1)}%
                        </td>
                        <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                          {t.volume.toFixed(0)}
                        </td>
                        <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                          {t.capacity}
                        </td>
                        <td style={{ padding: "7px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                          {t.dailyConsumption.toFixed(0)} m³/day
                        </td>
                        <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)" }}>
                          <HealthBar value={t.health} />
                        </td>
                        <td style={{ padding: "7px 10px", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                          <ChevronRight size={12} style={{ color: "var(--muted-foreground)" }} />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {filteredTanks.length === 0 && (
                  <tr>
                    <td colSpan={isMobile ? 7 : 10} style={{ padding: "20px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 11 }}>
                      No tanks found with status: {filterStatus}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consumption comparison chart */}
        <div className="rounded p-3 mt-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Daily Consumption by Tank
            </h3>
            <span style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)" }}>
              Based on real-time feed flow data
            </span>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 120 : 150}>
            <BarChart data={filteredTanks.filter(t => t.dailyConsumption > 0)} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis dataKey="id" tick={{ fontSize: isMobile ? 8 : 9, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fontSize: isMobile ? 8 : 9, fill: "#4d7a9e", fontFamily: "var(--font-mono)" }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={v => v + " m³"} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="dailyConsumption" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Daily Consumption (m³)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div 
          className={`flex flex-col overflow-auto p-3 sm:p-4 gap-3 sm:gap-4 ${isMobile ? 'fixed inset-0 z-50' : ''}`}
          style={{ 
            width: isMobile ? '100%' : 280, 
            background: "var(--muted)", 
            borderLeft: isMobile ? 'none' : "1px solid var(--border)", 
            flexShrink: 0,
            display: isMobile && !showDetail ? 'none' : 'flex'
          }}
        >
          {/* Mobile back button */}
          {isMobile && (
            <button 
              onClick={handleBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 0',
                background: 'none',
                border: 'none',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              <ChevronLeft size={18} />
              Back to Tanks
            </button>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: isMobile ? 18 : 16, fontWeight: 700, color: "#0ea5e9" }}>
                {selected.id}
              </span>
              <StatusBadge status={selected.status} />
            </div>
            <div style={{ fontSize: isMobile ? 15 : 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 2 }}>
              {selected.name}
            </div>
            <div className="flex items-center gap-1" style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
              <MapPin size={9} />{selected.location}
            </div>
            <div style={{ fontSize: 9, color: "var(--muted-foreground)", marginTop: 2 }}>
              Updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
            </div>
          </div>

          {/* Level gauge */}
          <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Tank Level
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 8, background: "var(--secondary)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ 
                  width: `${Math.min(selected.level, 100)}%`, 
                  height: "100%", 
                  background: selected.level > 50 ? "#22c55e" : selected.level > 25 ? "#eab308" : "#ef4444",
                  borderRadius: 4,
                  transition: "width 0.5s ease"
                }} />
              </div>
              <span style={{ fontSize: isMobile ? 18 : 16, fontFamily: "var(--font-mono)", fontWeight: 700, color: selected.level > 50 ? "#22c55e" : selected.level > 25 ? "#eab308" : "#ef4444" }}>
                {selected.level.toFixed(0)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 8, color: "var(--muted-foreground)" }}>{selected.volume.toFixed(0)} m³</span>
              <span style={{ fontSize: 8, color: "var(--muted-foreground)" }}>Capacity: {selected.capacity} m³</span>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {[
              { label: "Daily Consumption", value: `${selected.dailyConsumption.toFixed(0)} m³`, icon: Droplet },
              { label: "Runtime", value: `${selected.runtimeHours}h`, icon: Clock },
              { label: "Monthly Usage", value: `${Math.round(selected.monthlyConsumption).toLocaleString()} m³`, icon: Activity },
              { label: "Health Score", value: `${Math.round(selected.health)}%`, icon: Activity },
            ].map(m => (
              <div key={m.label} className="rounded p-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {m.label}
                </div>
                <div style={{ fontSize: isMobile ? 14 : 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)" }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Consumption history mini chart */}
          <div className="rounded p-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Consumption History
            </div>
            <ResponsiveContainer width="100%" height={isMobile ? 100 : 90}>
              <LineChart data={tankHistoryData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 8, fill: "#4d7a9e" }} axisLine={false} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 8, fill: "#4d7a9e" }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={v => (v / 1000).toFixed(0) + "k"} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="consumption" 
                  stroke="#06b6d4" 
                  strokeWidth={1.5} 
                  dot={{ r: 2, fill: "#06b6d4" }} 
                  name="Consumption" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Maintenance info */}
          <div className="rounded p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <Wrench size={12} style={{ display: 'inline', marginRight: 4 }} />
              Maintenance
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Last Service</span>
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                  {selected.lastMaintenance}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Next Due</span>
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#eab308" }}>
                  {selected.nextMaintenance}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedTankManagement;