import { useState, useRef, useEffect } from "react";
import { User, RefreshCw, CheckCircle, Download, Upload, Settings as SettingsIcon } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { format } from 'date-fns';

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 999,
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "10px 14px", minWidth: 220,
      boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", gap: 8,
      opacity: toast.visible ? 1 : 0, transition: "opacity 0.3s",
    }}>
      {toast.done
        ? <CheckCircle size={15} style={{ color: "#22c55e", flexShrink: 0 }} />
        : <RefreshCw size={15} style={{ color: "#0ea5e9", flexShrink: 0, animation: "spin 1s linear infinite" }} />
      }
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>{toast.msg}</span>
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const t = useRef(null);
  function show(msg, done = false) {
    if (t.current) clearTimeout(t.current);
    setToast({ msg, done, visible: true });
    t.current = setTimeout(() => setToast(null), 2200);
  }
  return { toast, show };
}

// ── Defaults ───────────────────────────────────────────────────────────────────
const DEFAULTS = {
  plantName: "Nairobi Water Treatment Plant",
  operatorId: "WTP-2024-NBI-001",
  productionTarget: "4200",
  recoveryTarget: "78",
  filterDpWarn: "0.50",
  filterDpCrit: "0.65",
  lowRecoveryWarn: "76",
  lowChemAlert: "20",
  minDosing: "2.0",
  maxDosing: "3.0",
};

const DEFAULT_USERS = [
  { name: "John Mwangi",   role: "Operations Manager",       email: "j.mwangi@utility.co.ke",  active: true  },
  { name: "Grace Wanjiku", role: "Plant Operator",           email: "g.wanjiku@utility.co.ke", active: true  },
  { name: "Peter Ochieng", role: "Maintenance Technician",   email: "p.ochieng@utility.co.ke", active: true  },
  { name: "Mary Achieng",  role: "Plant Operator",           email: "m.achieng@utility.co.ke", active: false },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="rounded p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>{label}</div>
        {desc && <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 1 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ label, value, warning, critical, unit }) {
  const isCritical = value >= critical;
  const isWarning = value >= warning && value < critical;
  const color = isCritical ? '#ef4444' : isWarning ? '#eab308' : '#22c55e';
  
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{label}:</span>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color }}>
        {value.toFixed(1)} {unit}
      </span>
      <span style={{ 
        fontSize: 8, 
        color, 
        background: `${color}15`,
        padding: '1px 6px',
        borderRadius: 3
      }}>
        {isCritical ? '⚠️ CRITICAL' : isWarning ? '⚠️ WARNING' : '✅ NORMAL'}
      </span>
    </div>
  );
}

const inputStyle = { background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", fontSize: 11, color: "var(--foreground)", outline: "none" };
const monoInput  = { ...inputStyle, fontFamily: "var(--font-mono)" };

// ── Settings ───────────────────────────────────────────────────────────────────
export function Settings() {
  const { getValue, lastUpdate } = useData();
  const [form, setForm]   = useState({ ...DEFAULTS });
  const [users, setUsers] = useState(DEFAULT_USERS.map((u, i) => ({ ...u, id: i })));
  const { toast, show }   = useToast();

  // Get real-time values
  const currentRecovery = getValue('RO5-SystemRecovery') || 0;
  const currentFlow = getValue('RO5-FEEDFlow') || 0;
  const currentDosing = 2.0 + (currentFlow / 100) * 0.5;
  const filterDelta = getValue('RO5-MediaFilterDeltaP') || 0;
  const systemOperation = getValue('RO5-SystemOperation') || 0;

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  function validateSettings() {
    const errors = [];
    
    if (parseFloat(form.productionTarget) < 1000) {
      errors.push('Production target should be at least 1000 m³/day');
    }
    
    if (parseFloat(form.recoveryTarget) < 50 || parseFloat(form.recoveryTarget) > 95) {
      errors.push('Recovery target should be between 50% and 95%');
    }
    
    if (parseFloat(form.minDosing) >= parseFloat(form.maxDosing)) {
      errors.push('Min dosing rate must be less than max dosing rate');
    }
    
    if (parseFloat(form.filterDpWarn) >= parseFloat(form.filterDpCrit)) {
      errors.push('Filter warning threshold must be less than critical threshold');
    }
    
    return errors;
  }

  function handleSave() {
    const errors = validateSettings();
    if (errors.length > 0) {
      show(`❌ ${errors.join('. ')}`, true);
      return;
    }
    
    show("Saving changes…");
    setTimeout(() => show("✅ Settings saved successfully", true), 1400);
  }

  function handleReset() {
    if (window.confirm('Reset all settings to defaults?')) {
      setForm({ ...DEFAULTS });
      setUsers(DEFAULT_USERS.map((u, i) => ({ ...u, id: i })));
      show("Settings reset to defaults", true);
    }
  }

  function toggleUser(id) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  }

  function handleExportSettings() {
    const data = {
      ...form,
      users: users,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    show('✅ Settings exported successfully', true);
  }

  function handleImportSettings(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setForm(data);
        if (data.users) setUsers(data.users);
        show('✅ Settings imported successfully', true);
      } catch (err) {
        show('❌ Invalid settings file', true);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" >
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>

      <div className="flex items-center justify-between">
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <SettingsIcon size={14} style={{ display: 'inline', marginRight: 6 }} />
          System Settings
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            style={{ display: 'none' }}
            id="importSettings"
          />
          <label htmlFor="importSettings" style={{ cursor: 'pointer' }}>
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", fontSize: 10, color: "var(--muted-foreground)", cursor: "pointer" }}
            >
              <Upload size={12} /> Import
            </button>
          </label>
          <button
            onClick={handleExportSettings}
            className="flex items-center gap-1 px-3 py-1.5 rounded"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", fontSize: 10, color: "var(--muted-foreground)", cursor: "pointer" }}
          >
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* System Status Section */}
      <Section title="System Status (Live)">
        <SettingRow label="System Operation">
          <StatusBadge 
            label="Status"
            value={systemOperation}
            warning={0.5}
            critical={0.8}
            unit=""
          />
        </SettingRow>
        <SettingRow label="Current Recovery">
          <StatusBadge 
            label="Recovery"
            value={currentRecovery}
            warning={parseFloat(form.lowRecoveryWarn)}
            critical={parseFloat(form.lowRecoveryWarn) - 5}
            unit="%"
          />
        </SettingRow>
        <SettingRow label="Current Dosing Rate">
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#a78bfa' }}>
            {currentDosing.toFixed(2)} mg/L
          </span>
        </SettingRow>
        <SettingRow label="Filter Delta P">
          <StatusBadge 
            label="ΔP"
            value={filterDelta}
            warning={parseFloat(form.filterDpWarn)}
            critical={parseFloat(form.filterDpCrit)}
            unit="bar"
          />
        </SettingRow>
        <SettingRow label="Last Updated">
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>
            {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </span>
        </SettingRow>
      </Section>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* Plant Configuration */}
        <Section title="Plant Configuration">
          <SettingRow label="Plant Name" desc="Display name for the facility">
            <input value={form.plantName} onChange={set("plantName")} style={{ ...inputStyle, width: 220 }} />
          </SettingRow>
          <SettingRow label="Operator ID" desc="Licensed operator number">
            <input value={form.operatorId} onChange={set("operatorId")} style={{ ...monoInput, width: 180 }} />
          </SettingRow>
          <SettingRow label="Production Target" desc="Daily target in m³">
            <div className="flex items-center gap-1">
              <input value={form.productionTarget} onChange={set("productionTarget")} style={{ ...monoInput, width: 80 }} />
              <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>m³/day</span>
            </div>
          </SettingRow>
          <SettingRow label="Recovery Target" desc="System recovery percentage">
            <div className="flex items-center gap-1">
              <input value={form.recoveryTarget} onChange={set("recoveryTarget")} style={{ ...monoInput, width: 60 }} />
              <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>%</span>
            </div>
          </SettingRow>
        </Section>

        {/* Alert Thresholds */}
        <Section title="Alert Thresholds">
          {[
            { label: "Filter ΔP Warning",   key: "filterDpWarn",    unit: "bar" },
            { label: "Filter ΔP Critical",  key: "filterDpCrit",    unit: "bar" },
            { label: "Low Recovery Warning", key: "lowRecoveryWarn", unit: "%" },
            { label: "Low Chemical Alert",  key: "lowChemAlert",    unit: "%" },
            { label: "Min Dosing Rate",     key: "minDosing",       unit: "mg/L" },
            { label: "Max Dosing Rate",     key: "maxDosing",       unit: "mg/L" },
          ].map(t => (
            <SettingRow key={t.key} label={t.label}>
              <div className="flex items-center gap-1">
                <input value={form[t.key]} onChange={set(t.key)} style={{ ...monoInput, width: 70 }} />
                <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{t.unit}</span>
              </div>
            </SettingRow>
          ))}
        </Section>

        {/* User Management */}
        <Section title="User Management">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: u.active ? "rgba(14,165,233,0.2)" : "rgba(77,122,158,0.2)", flexShrink: 0 }}>
                <User size={12} style={{ color: u.active ? "#0ea5e9" : "#4d7a9e" }} />
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--foreground)" }}>{u.name}</div>
                <div style={{ fontSize: 9, color: "var(--muted-foreground)" }}>{u.role} · {u.email}</div>
              </div>
              <button
                onClick={() => toggleUser(u.id)}
                title={u.active ? "Click to deactivate" : "Click to activate"}
                style={{
                  fontSize: 8, fontWeight: 600, cursor: "pointer",
                  color: u.active ? "#22c55e" : "#4d7a9e",
                  background: u.active ? "rgba(34,197,94,0.1)" : "rgba(77,122,158,0.1)",
                  border: `1px solid ${u.active ? "rgba(34,197,94,0.25)" : "rgba(77,122,158,0.25)"}`,
                  borderRadius: 3, padding: "2px 7px", transition: "all 0.15s",
                }}
              >
                {u.active ? "ACTIVE" : "INACTIVE"}
              </button>
            </div>
          ))}
        </Section>

        {/* System Information */}
        <Section title="System Information">
          {[
            { label: "Software Version", value: "AquaOps v2.4.1" },
            { label: "Database",         value: "PostgreSQL 16.2" },
            { label: "Last Backup",      value: "2026-06-06 02:00" },
            { label: "Uptime",           value: "47 days, 6 hrs" },
            { label: "Data Retention",   value: "5 years" },
            { label: "License Expires",  value: "2027-12-31" },
          ].map(s => (
            <SettingRow key={s.label} label={s.label}>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#0ea5e9" }}>{s.value}</span>
            </SettingRow>
          ))}
        </Section>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)", fontSize: 11, color: "var(--muted-foreground)", cursor: "pointer" }}
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded"
          style={{ background: "#0ea5e9", color: "#020810", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" }}
        >
          Save Changes
        </button>
      </div>

      <Toast toast={toast} />
    </div>
  );
}