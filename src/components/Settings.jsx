import { useState, useRef } from "react";
import { User, RefreshCw, CheckCircle } from "lucide-react";

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

const inputStyle = { background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", fontSize: 11, color: "var(--foreground)", outline: "none" };
const monoInput  = { ...inputStyle, fontFamily: "var(--font-mono)" };

// ── Settings ───────────────────────────────────────────────────────────────────
export function Settings() {
  const [form, setForm]   = useState({ ...DEFAULTS });
  const [users, setUsers] = useState(DEFAULT_USERS.map((u, i) => ({ ...u, id: i })));
  const { toast, show }   = useToast();

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  function handleSave() {
    show("Saving changes…");
    setTimeout(() => show("Settings saved successfully", true), 1400);
  }

  function handleReset() {
    setForm({ ...DEFAULTS });
    setUsers(DEFAULT_USERS.map((u, i) => ({ ...u, id: i })));
    show("Settings reset to defaults", true);
  }

  function toggleUser(id) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>

      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        System Settings
      </div>

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