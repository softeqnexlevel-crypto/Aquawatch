import { useState, useRef } from "react";
import { FileText, Download, Calendar, BarChart2, Droplets, FlaskConical, Wrench, RefreshCw, CheckCircle } from "lucide-react";

const reports = [
  { id: "RPT-06-001", title: "Daily Operations Report", date: "2026-06-06", type: "Daily", category: "Production", size: "142 KB", file: "daily_ops_report.csv" },
  { id: "RPT-06-002", title: "Weekly Production Summary", date: "2026-06-02", type: "Weekly", category: "Production", size: "380 KB", file: "weekly_production_summary.csv" },
  { id: "RPT-06-003", title: "Chemical Usage Report — June", date: "2026-06-01", type: "Monthly", category: "Chemical", size: "218 KB", file: "chemical_usage_june.csv" },
  { id: "RPT-05-004", title: "Monthly System Performance — May", date: "2026-05-31", type: "Monthly", category: "Performance", size: "654 KB", file: "system_performance_may.csv" },
  { id: "RPT-05-005", title: "Maintenance Summary — May", date: "2026-05-31", type: "Monthly", category: "Maintenance", size: "290 KB", file: "maintenance_may.csv" },
  { id: "RPT-05-006", title: "Q1 2026 Annual Report", date: "2026-03-31", type: "Quarterly", category: "Performance", size: "1.2 MB", file: "q1_2026_annual.csv" },
];

const categoryIcons = {
  Production: Droplets,
  Chemical: FlaskConical,
  Performance: BarChart2,
  Maintenance: Wrench,
};

const typeColors = {
  Daily:     { bg: "rgba(34,197,94,0.1)",   color: "#22c55e" },
  Weekly:    { bg: "rgba(6,182,212,0.1)",   color: "#06b6d4" },
  Monthly:   { bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9" },
  Quarterly: { bg: "rgba(167,139,250,0.1)", color: "#a78bfa" },
};

const generateButtons = [
  { label: "Daily Report",   desc: "Today's operations",    icon: Calendar,  color: "#22c55e", file: "daily_ops_report.csv",        size: "142 KB" },
  { label: "Weekly Report",  desc: "Last 7 days summary",   icon: BarChart2, color: "#06b6d4", file: "weekly_production_summary.csv", size: "380 KB" },
  { label: "Monthly Report", desc: "June 2026 summary",     icon: FileText,  color: "#0ea5e9", file: "june_2026_monthly.csv",         size: "218 KB" },
  { label: "Custom Report",  desc: "Select date range",     icon: Calendar,  color: "#a78bfa", file: "custom_report.csv",             size: "—"     },
];

function downloadCSV(filename, label, size) {
  const content = `Report: ${label}\nGenerated: ${new Date().toISOString()}\nSize: ${size}\n\nID,Timestamp,Value\n1,2026-06-01,100\n2,2026-06-02,120\n3,2026-06-03,115`;
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 999,
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 8, padding: "10px 14px", minWidth: 240, maxWidth: 280,
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        display: "flex", alignItems: "flex-start", gap: 8,
        transition: "opacity 0.3s",
        opacity: toast.visible ? 1 : 0,
      }}
    >
      <div style={{ marginTop: 1 }}>
        {toast.done
          ? <CheckCircle size={16} style={{ color: "#22c55e" }} />
          : <RefreshCw size={16} style={{ color: toast.iconColor, animation: "spin 1s linear infinite" }} />
        }
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{toast.title}</div>
        <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 2 }}>
          {toast.done ? "File downloaded" : toast.sub}
        </div>
        <div style={{ height: 3, borderRadius: 2, background: "var(--border)", marginTop: 6, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 2, background: "#0ea5e9",
            width: `${toast.progress}%`, transition: "width 0.05s linear",
          }} />
        </div>
      </div>
    </div>
  );
}

export function Reports() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

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
        onComplete?.();
        setToast(prev => prev ? { ...prev, done: true } : prev);
        timerRef.current = setTimeout(() => setToast(null), 2000);
      }
    }, 30);
  }

  function handleDownload(file, size, title) {
    showToast(`Downloading ${file}`, size, "#0ea5e9", () => downloadCSV(file, title, size));
  }

  function handleGenerate(label, file, size) {
    showToast(`Generating ${label}…`, "Preparing export", "#a78bfa", () => downloadCSV(file, label, size));
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Quick generate */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {generateButtons.map((r, idx) => (
          <button
            key={idx}
            onClick={() => handleGenerate(r.label, r.file, r.size)}
            className="rounded p-3 text-left transition-all"
            style={{ background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded p-1.5" style={{ background: `${r.color}15` }}>
                <r.icon size={13} style={{ color: r.color }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)" }}>{r.label}</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{r.desc}</div>
            <div className="mt-2 flex items-center gap-1" style={{ fontSize: 9, color: r.color }}>
              <Download size={10} />Generate & Export
            </div>
          </button>
        ))}
      </div>

      {/* Report list */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Report Archive
        </div>
        <div className="rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--muted)" }}>
                {["Report ID", "Title", "Category", "Type", "Generated", "Size", "Actions"].map((h, idx) => (
                  <th key={idx} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => {
                const Icon = categoryIcons[r.category] || FileText;
                const tc = typeColors[r.type] || typeColors.Monthly;
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                    <td style={{ padding: "8px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "#0ea5e9", borderBottom: "1px solid var(--border)" }}>{r.id}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2">
                        <Icon size={12} style={{ color: "var(--muted-foreground)" }} />
                        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--foreground)" }}>{r.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 10, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.category}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: tc.color, background: tc.bg, borderRadius: 3, padding: "1px 6px" }}>{r.type.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.date}</td>
                    <td style={{ padding: "8px 10px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{r.size}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
                      <button
                        onClick={() => handleDownload(r.file, r.size, r.title)}
                        className="flex items-center gap-1 px-2 py-1 rounded"
                        style={{ fontSize: 9, color: "#0ea5e9", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", cursor: "pointer" }}
                      >
                        <Download size={10} />Download
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}