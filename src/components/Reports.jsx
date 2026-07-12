// pages/Reports.jsx
import React, { useState, useRef, useMemo } from "react";
import { 
  FileText, Download, Calendar, BarChart2, Droplets, 
  FlaskConical, Wrench, RefreshCw, CheckCircle, 
  TrendingUp, TrendingDown, Minus, Clock, Filter,
  Plus, X, Eye, EyeOff, Maximize2, Minimize2
} from "lucide-react";
import { useData } from '../contexts/DataContext';
import { format, subDays, subWeeks, subMonths } from 'date-fns';

// ===================== CATEGORY ICONS =====================
const categoryIcons = {
  Production: Droplets,
  Chemical: FlaskConical,
  Performance: BarChart2,
  Maintenance: Wrench,
  Quality: Filter,
  Operations: Clock,
};

// ===================== TYPE COLORS =====================
const typeColors = {
  Daily:     { bg: "rgba(34,197,94,0.1)",   color: "#22c55e", icon: Calendar },
  Weekly:    { bg: "rgba(6,182,212,0.1)",   color: "#06b6d4", icon: BarChart2 },
  Monthly:   { bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9", icon: FileText },
  Quarterly: { bg: "rgba(167,139,250,0.1)", color: "#a78bfa", icon: Calendar },
  Yearly:    { bg: "rgba(34,197,94,0.1)",   color: "#22c55e", icon: TrendingUp },
};

// ===================== TOAST COMPONENT =====================
function Toast({ toast }) {
  if (!toast) return null;
  
  return (
    <div
      style={{
        position: "fixed", 
        bottom: 24, 
        right: 24, 
        zIndex: 9999,
        background: "var(--card)", 
        border: "1px solid var(--border)",
        borderRadius: 8, 
        padding: "12px 16px", 
        minWidth: 260, 
        maxWidth: 320,
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        display: "flex", 
        alignItems: "flex-start", 
        gap: 10,
        transition: "all 0.3s ease",
        opacity: toast.visible ? 1 : 0,
        transform: toast.visible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      <div style={{ marginTop: 1, flexShrink: 0 }}>
        {toast.done ? (
          <CheckCircle size={18} style={{ color: "#22c55e" }} />
        ) : (
          <RefreshCw size={18} style={{ color: toast.iconColor, animation: "spin 1s linear infinite" }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
          {toast.title}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
          {toast.done ? "✓ Download complete" : toast.sub}
        </div>
        <div style={{ 
          height: 3, 
          borderRadius: 3, 
          background: "var(--border)", 
          marginTop: 8, 
          overflow: "hidden" 
        }}>
          <div style={{
            height: "100%", 
            borderRadius: 3, 
            background: toast.done ? "#22c55e" : "#0ea5e9",
            width: `${toast.progress}%`, 
            transition: "width 0.1s linear",
          }} />
        </div>
      </div>
    </div>
  );
}

// ===================== REPORT GENERATION FUNCTIONS =====================
function generateCSV(reportData, title) {
  const headers = Object.keys(reportData[0] || {}).join(',');
  const rows = reportData.map(row => Object.values(row).join(',')).join('\n');
  const content = `Report: ${title}\nGenerated: ${new Date().toISOString()}\n\n${headers}\n${rows}`;
  return content;
}

function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ===================== MAIN COMPONENT =====================
export function Reports() {
  const { sensorData, history, getValue, getHistory, lastUpdate } = useData();
  const [toast, setToast] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [generatingReport, setGeneratingReport] = useState(null);
  
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  // ===================== GENERATE REAL REPORTS FROM DATA =====================
  const generateReportsFromData = useMemo(() => {
    // ✅ FIX: every key below now uses the "RO5-" prefix, matching how
    // DataContext.jsx actually stores sensor readings (see KEY_MAPPING /
    // toShortName there). Without the prefix, getValue() never found a
    // match and silently fell back to 0 for every single field — which is
    // why every generated/exported report showed all zeros.
    const feedFlow = getValue('RO5-FEEDFlow') || 0;
    const permeateFlow = getValue('RO5-Permeateflow') || 0;
    const concentrateFlow = getValue('RO5-ConcetrateFlow') || 0;
    const roPressure = getValue('RO5-ROPressure') || 0;
    const recovery = getValue('RO5-SystemRecovery') || 0;
    const pureWaterEC = getValue('RO5-PureWaterEc') || 0;
    const stage1Delta = getValue('RO5-Stage1Delta') || 0;
    const stage2Delta = getValue('RO5-Stage2Delta') || 0;
    const filterDeltaP = getValue('RO5-MediaFilterDeltaP') || 0;

    const feedHistory = getHistory('RO5-FEEDFlow');
    const permeateHistory = getHistory('RO5-Permeateflow');

    // Calculate daily averages
    const dailyAvg = (data) => {
      if (data.length === 0) return 0;
      const last24h = data.filter(d => new Date(d.time) >= subDays(new Date(), 1));
      return last24h.reduce((sum, d) => sum + d.value, 0) / (last24h.length || 1);
    };

    const avgFeed = dailyAvg(feedHistory);
    const avgPermeate = dailyAvg(permeateHistory);

    // Generate reports
    return [
      {
        id: "RPT-DAILY-001",
        title: "Daily Operations Report",
        date: format(new Date(), 'yyyy-MM-dd'),
        type: "Daily",
        category: "Operations",
        size: "156 KB",
        summary: `Feed: ${feedFlow.toFixed(1)} m³/h | Permeate: ${permeateFlow.toFixed(1)} m³/h | Recovery: ${recovery.toFixed(1)}%`,
        data: {
          feed: feedFlow,
          permeate: permeateFlow,
          concentrate: concentrateFlow,
          recovery: recovery,
          pressure: roPressure,
          ec: pureWaterEC
        }
      },
      {
        id: "RPT-DAILY-002",
        title: "System Performance Report",
        date: format(new Date(), 'yyyy-MM-dd'),
        type: "Daily",
        category: "Performance",
        size: "218 KB",
        summary: `RO Pressure: ${roPressure.toFixed(1)} bar | Stage 1 ΔP: ${stage1Delta.toFixed(2)} bar | Filter ΔP: ${filterDeltaP.toFixed(2)} bar`,
        data: {
          roPressure: roPressure,
          interstagePress: getValue('RO5-InterstagePress') || 0,
          concentratePress: getValue('RO5-ConcetratePress') || 0,
          stage1Delta: stage1Delta,
          stage2Delta: stage2Delta,
          filterDeltaP: filterDeltaP
        }
      },
      {
        id: "RPT-DAILY-003",
        title: "Water Quality Report",
        date: format(new Date(), 'yyyy-MM-dd'),
        type: "Daily",
        category: "Quality",
        size: "89 KB",
        summary: `Product EC: ${pureWaterEC.toFixed(1)} µS/cm | Recovery: ${recovery.toFixed(1)}%`,
        data: {
          pureWaterEC: pureWaterEC,
          recovery: recovery,
          feedFlow: feedFlow,
          permeateFlow: permeateFlow
        }
      },
      {
        id: "RPT-WEEKLY-001",
        title: "Weekly Production Summary",
        date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        type: "Weekly",
        category: "Production",
        size: "380 KB",
        summary: `Avg Feed: ${avgFeed.toFixed(1)} m³/h | Avg Permeate: ${avgPermeate.toFixed(1)} m³/h`,
        data: {
          avgFeed: avgFeed,
          avgPermeate: avgPermeate,
          avgRecovery: recovery,
          totalProduction: avgPermeate * 24 * 7
        }
      },
      {
        id: "RPT-WEEKLY-002",
        title: "Maintenance Summary",
        date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        type: "Weekly",
        category: "Maintenance",
        size: "290 KB",
        summary: `Stage 1 ΔP: ${stage1Delta.toFixed(2)} bar | Filter ΔP: ${filterDeltaP.toFixed(2)} bar`,
        data: {
          stage1Delta: stage1Delta,
          stage2Delta: stage2Delta,
          filterDeltaP: filterDeltaP,
          roPressure: roPressure
        }
      },
      {
        id: "RPT-MONTHLY-001",
        title: "Monthly Chemical Usage",
        date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        type: "Monthly",
        category: "Chemical",
        size: "654 KB",
        summary: `Based on ${permeateFlow.toFixed(1)} m³/h production rate`,
        data: {
          antiscalant: (permeateFlow * 24 * 30 * 0.02).toFixed(1),
          biocide: (permeateFlow * 24 * 30 * 0.005).toFixed(1),
          permeateFlow: permeateFlow,
          recovery: recovery
        }
      },
      {
        id: "RPT-QUARTERLY-001",
        title: "Q2 2026 Performance Report",
        date: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
        type: "Quarterly",
        category: "Performance",
        size: "1.2 MB",
        summary: `Avg Recovery: ${recovery.toFixed(1)}% | System Efficiency: ${(recovery * 0.95).toFixed(1)}%`,
        data: {
          avgRecovery: recovery,
          avgProduction: permeateFlow * 24 * 90,
          efficiency: recovery * 0.95
        }
      },
    ];
  }, [getValue, getHistory]);

  // ===================== FILTER REPORTS =====================
  const filteredReports = useMemo(() => {
    let filtered = generateReportsFromData;
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [generateReportsFromData, selectedCategory, searchQuery]);

  // ===================== CATEGORIES =====================
  const categories = ['All', 'Production', 'Performance', 'Quality', 'Maintenance', 'Chemical', 'Operations'];

  // ===================== TOAST FUNCTIONS =====================
  function showToast(title, sub, iconColor, onComplete) {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setToast({ title, sub, iconColor, progress: 0, done: false, visible: true });

    let progress = 0;
    intervalRef.current = setInterval(() => {
      progress = Math.min(progress + 2, 100);
      setToast(prev => prev ? { ...prev, progress } : prev);
      if (progress >= 100) {
        clearInterval(intervalRef.current);
        if (onComplete) onComplete();
        setToast(prev => prev ? { ...prev, done: true } : prev);
        timerRef.current = setTimeout(() => setToast(null), 2500);
      }
    }, 30);
  }

  // ===================== DOWNLOAD HANDLERS =====================
  function handleDownload(report) {
    const filename = `${report.id}_${report.title.replace(/\s+/g, '_')}.csv`;
    
    showToast(
      `Downloading ${report.title}`, 
      report.size, 
      "#0ea5e9", 
      () => {
        const content = generateCSV([report.data], report.title);
        downloadCSV(filename, content);
      }
    );
  }

  function handleGenerateReport(type, label) {
    const report = generateReportsFromData.find(r => r.type === type) || generateReportsFromData[0];
    const filename = `${type.toLowerCase()}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    
    showToast(
      `Generating ${label}`, 
      "Preparing export...", 
      "#a78bfa",
      () => {
        const content = generateCSV([report.data], label);
        downloadCSV(filename, content);
      }
    );
  }

  // ===================== GENERATE BUTTONS =====================
  const generateButtons = [
    { 
      label: "Daily Report", 
      desc: "Today's operations", 
      icon: Calendar,  
      color: "#22c55e", 
      type: "Daily",
      size: "156 KB" 
    },
    { 
      label: "Weekly Report",  
      desc: "Last 7 days summary",   
      icon: BarChart2, 
      color: "#06b6d4", 
      type: "Weekly",
      size: "380 KB" 
    },
    { 
      label: "Monthly Report", 
      desc: "Current month summary",     
      icon: FileText,  
      color: "#0ea5e9", 
      type: "Monthly",
      size: "654 KB" 
    },
    { 
      label: "Custom Report",  
      desc: "Select parameters",     
      icon: Calendar,  
      color: "#a78bfa", 
      type: "Custom",
      size: "—"     
    },
  ];

  // ===================== RENDER =====================
  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>
            Reports & Analytics
          </h2>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
            {generateReportsFromData.length} reports available • Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              background: 'var(--secondary)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              fontSize: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {viewMode === 'table' ? <EyeOff size={14} /> : <Eye size={14} />}
            {viewMode === 'table' ? 'Cards' : 'Table'}
          </button>
        </div>
      </div>

      {/* Quick Generate Buttons */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {generateButtons.map((r) => (
          <button
            key={r.label}
            onClick={() => handleGenerateReport(r.type, r.label)}
            className="rounded p-3 text-left transition-all hover:scale-[1.02]"
            style={{ 
              background: "var(--card)", 
              border: "1px solid var(--border)", 
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded p-1.5" style={{ background: `${r.color}15` }}>
                <r.icon size={14} style={{ color: r.color }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{r.label}</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{r.desc}</div>
            <div className="mt-2 flex items-center gap-1" style={{ fontSize: 9, color: r.color }}>
              <Download size={10} /> Generate & Export
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter size={14} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 500 }}>
            Category:
          </span>
        </div>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '3px 12px',
              borderRadius: 12,
              background: selectedCategory === cat ? '#0ea5e9' : 'var(--secondary)',
              color: selectedCategory === cat ? 'white' : 'var(--muted-foreground)',
              border: '1px solid var(--border)',
              fontSize: 9,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {cat}
          </button>
        ))}
        
        <div style={{ flex: 1, minWidth: 150, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '4px 10px',
              borderRadius: 4,
              background: 'var(--secondary)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              fontSize: 10,
              outline: 'none'
            }}
          />
        </div>
        
        <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
          {filteredReports.length} reports
        </span>
      </div>

      {/* Report List */}
      {viewMode === 'table' ? (
        <div className="rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--muted)" }}>
                {["Report ID", "Title", "Category", "Type", "Generated", "Size", "Actions"].map((h) => (
                  <th key={h} style={{ 
                    padding: "8px 10px", 
                    textAlign: "left", 
                    fontSize: 9, 
                    fontWeight: 600, 
                    color: "var(--muted-foreground)", 
                    letterSpacing: "0.08em", 
                    textTransform: "uppercase", 
                    borderBottom: "1px solid var(--border)" 
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r, i) => {
                const Icon = categoryIcons[r.category] || FileText;
                const tc = typeColors[r.type] || typeColors.Monthly;
                return (
                  <tr key={r.id} style={{ 
                    background: i % 2 === 0 ? "var(--card)" : "var(--muted)",
                    transition: 'background 0.2s'
                  }}>
                    <td style={{ 
                      padding: "8px 10px", 
                      fontSize: 10, 
                      fontFamily: "var(--font-mono)", 
                      color: "#0ea5e9", 
                      borderBottom: "1px solid var(--border)" 
                    }}>
                      {r.id}
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2">
                        <Icon size={12} style={{ color: "var(--muted-foreground)" }} />
                        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--foreground)" }}>{r.title}</span>
                      </div>
                      <div style={{ fontSize: 9, color: "var(--muted-foreground)", marginTop: 2 }}>
                        {r.summary}
                      </div>
                    </td>
                    <td style={{ 
                      padding: "8px 10px", 
                      fontSize: 10, 
                      color: "var(--muted-foreground)", 
                      borderBottom: "1px solid var(--border)" 
                    }}>
                      {r.category}
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ 
                        fontSize: 9, 
                        fontWeight: 600, 
                        color: tc.color, 
                        background: tc.bg, 
                        borderRadius: 3, 
                        padding: "1px 8px" 
                      }}>
                        {r.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ 
                      padding: "8px 10px", 
                      fontSize: 10, 
                      fontFamily: "var(--font-mono)", 
                      color: "var(--muted-foreground)", 
                      borderBottom: "1px solid var(--border)" 
                    }}>
                      {r.date}
                    </td>
                    <td style={{ 
                      padding: "8px 10px", 
                      fontSize: 10, 
                      fontFamily: "var(--font-mono)", 
                      color: "var(--muted-foreground)", 
                      borderBottom: "1px solid var(--border)" 
                    }}>
                      {r.size}
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
                      <button
                        onClick={() => handleDownload(r)}
                        className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-cyan-500/20"
                        style={{ 
                          fontSize: 9, 
                          color: "#0ea5e9", 
                          background: "rgba(14,165,233,0.08)", 
                          border: "1px solid rgba(14,165,233,0.15)", 
                          cursor: "pointer" 
                        }}
                      >
                        <Download size={10} /> Download
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // Card View
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {filteredReports.map((r) => {
            const Icon = categoryIcons[r.category] || FileText;
            const tc = typeColors[r.type] || typeColors.Monthly;
            return (
              <div
                key={r.id}
                className="rounded p-4 transition-all hover:scale-[1.02]"
                style={{ 
                  background: "var(--card)", 
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onClick={() => handleDownload(r)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded p-2" style={{ background: `${tc.color}15` }}>
                      <Icon size={16} style={{ color: tc.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
                        {r.title}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--muted-foreground)" }}>
                        {r.id} • {r.date}
                      </div>
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: 8, 
                    fontWeight: 600, 
                    color: tc.color, 
                    background: tc.bg, 
                    borderRadius: 3, 
                    padding: "1px 8px" 
                  }}>
                    {r.type.toUpperCase()}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: 10, 
                  color: "var(--muted-foreground)", 
                  marginTop: 8,
                  padding: 8,
                  background: "var(--muted)",
                  borderRadius: 4
                }}>
                  {r.summary}
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>
                    {r.category} • {r.size}
                  </span>
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-cyan-500/20"
                    style={{ 
                      fontSize: 9, 
                      color: "#0ea5e9", 
                      background: "rgba(14,165,233,0.08)", 
                      border: "1px solid rgba(14,165,233,0.15)", 
                      cursor: "pointer" 
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(r);
                    }}
                  >
                    <Download size={10} /> Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8" style={{ color: "var(--muted-foreground)" }}>
          <FileText size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>No reports found</p>
          <p style={{ fontSize: 11, marginTop: 4 }}>Try adjusting your filters or generating a new report</p>
        </div>
      )}

      {/* Toast Notification */}
      <Toast toast={toast} />
    </div>
  );
}

export default Reports;