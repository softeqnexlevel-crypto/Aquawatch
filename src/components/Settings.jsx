import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";  // ✅ ADD THIS IMPORT
import { RefreshCw, CheckCircle, Download, Upload, Settings as SettingsIcon, Users, ExternalLink } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { format } from 'date-fns';
import { API_BASE_URL } from '../config';

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
        ? <CheckCircle size={15} style={{ color: toast.error ? "#ef4444" : "#22c55e", flexShrink: 0 }} />
        : <RefreshCw size={15} style={{ color: "#0ea5e9", flexShrink: 0, animation: "spin 1s linear infinite" }} />
      }
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>{toast.msg}</span>
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const t = useRef(null);
  function show(msg, done = false, error = false) {
    if (t.current) clearTimeout(t.current);
    setToast({ msg, done, error, visible: true });
    t.current = setTimeout(() => setToast(null), 2800);
  }
  return { toast, show };
}

// ── API helper ───────────────────────────────────────────────────────────────
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

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

// ── Sub-components ─────────────────────────────────────────────────────────────
function Section({ title, children, action }) {
  return (
    <div className="rounded p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {title}
        </div>
        {action}
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
  const { user: me } = useAuth();
  const isAdmin = me?.role === "admin";

  const [form, setForm] = useState({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsMeta, setSettingsMeta] = useState(null);
  const { toast, show } = useToast();

  const [systemInfo, setSystemInfo] = useState(null);
  const [mqttStatus, setMqttStatus] = useState(null);

  // ==================== FETCH REAL SETTINGS ====================
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/settings');
      const s = data.settings;
      setForm({
        plantName: s.plantName ?? DEFAULTS.plantName,
        operatorId: s.operatorId ?? DEFAULTS.operatorId,
        productionTarget: String(s.productionTarget ?? DEFAULTS.productionTarget),
        recoveryTarget: String(s.recoveryTarget ?? DEFAULTS.recoveryTarget),
        filterDpWarn: String(s.filterDpWarn ?? DEFAULTS.filterDpWarn),
        filterDpCrit: String(s.filterDpCrit ?? DEFAULTS.filterDpCrit),
        lowRecoveryWarn: String(s.lowRecoveryWarn ?? DEFAULTS.lowRecoveryWarn),
        lowChemAlert: String(s.lowChemAlert ?? DEFAULTS.lowChemAlert),
        minDosing: String(s.minDosing ?? DEFAULTS.minDosing),
        maxDosing: String(s.maxDosing ?? DEFAULTS.maxDosing),
      });
      setSettingsMeta({ updatedAt: s.updatedAt, updatedBy: s.updatedBy });
    } catch (err) {
      show(`❌ Failed to load settings: ${err.message}`, true, true);
    } finally {
      setLoading(false);
    }
  };

  // ==================== FETCH REAL SYSTEM INFO ====================
  const fetchSystemInfo = async () => {
    try {
      const health = await apiCall('/health');
      setSystemInfo(health);
    } catch (err) {
      console.warn('Could not fetch system health:', err);
    }
    try {
      const mqtt = await apiCall('/mqtt-status');
      setMqttStatus(mqtt);
    } catch (err) {
      console.warn('Could not fetch MQTT status:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchSystemInfo();
  }, []);

  // Get real-time values
  const currentRecovery = getValue('RO5-SystemRecovery') || 0;
  const currentFlow = getValue('RO5-FEEDFlow') || 0;
  const currentDosing = 2.0 + (currentFlow / 100) * 0.5;
  const filterDelta = getValue('RO5-MediaFilterDeltaP') || 0;
  const systemOperation = getValue('RO5-SystemOperation') || 0;

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  function validateSettings() {
    const errors = [];
    if (parseFloat(form.productionTarget) < 1000) errors.push('Production target should be at least 1000 m³/day');
    if (parseFloat(form.recoveryTarget) < 50 || parseFloat(form.recoveryTarget) > 95) errors.push('Recovery target should be between 50% and 95%');
    if (parseFloat(form.minDosing) >= parseFloat(form.maxDosing)) errors.push('Min dosing rate must be less than max dosing rate');
    if (parseFloat(form.filterDpWarn) >= parseFloat(form.filterDpCrit)) errors.push('Filter warning threshold must be less than critical threshold');
    return errors;
  }

  // ==================== REAL SAVE ====================
  async function handleSave() {
    if (!isAdmin) {
      show('❌ Only admins can change settings', true, true);
      return;
    }

    const errors = validateSettings();
    if (errors.length > 0) {
      show(`❌ ${errors.join('. ')}`, true, true);
      return;
    }

    setSaving(true);
    show("Saving changes…");
    try {
      const data = await apiCall('/settings', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setSettingsMeta({ updatedAt: data.settings.updatedAt, updatedBy: data.settings.updatedBy });
      show("✅ Settings saved successfully", true);
    } catch (err) {
      show(`❌ ${err.message}`, true, true);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (window.confirm('Reload settings from the server, discarding unsaved changes?')) {
      fetchSettings();
      show("Reloaded from server", true);
    }
  }

  function handleExportSettings() {
    const data = { ...form, exportedAt: new Date().toISOString(), version: '2.0' };
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
        setForm(f => ({ ...f, ...data }));
        show('Imported — click "Save Changes" to persist this to the server', true);
      } catch (err) {
        show('❌ Invalid settings file', true, true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
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

      {!isAdmin && (
        <div className="rounded p-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 11 }}>
          You're viewing in read-only mode. Only Admins can change these settings.
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <p>Loading settings…</p>
        </div>
      ) : (
        <>
          {/* System Status Section */}
          <Section title="System Status (Live)">
            <SettingRow label="System Operation">
              <StatusBadge label="Status" value={systemOperation} warning={0.5} critical={0.8} unit="" />
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
              <StatusBadge label="ΔP" value={filterDelta} warning={parseFloat(form.filterDpWarn)} critical={parseFloat(form.filterDpCrit)} unit="bar" />
            </SettingRow>
            <SettingRow label="Last Sensor Update">
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>
                {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
              </span>
            </SettingRow>
            {settingsMeta?.updatedAt && (
              <SettingRow label="Settings Last Saved">
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>
                  {format(new Date(settingsMeta.updatedAt), 'yyyy-MM-dd HH:mm:ss')}
                </span>
              </SettingRow>
            )}
          </Section>

          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>

            {/* Plant Configuration */}
            <Section title="Plant Configuration">
              <SettingRow label="Plant Name" desc="Display name for the facility">
                <input value={form.plantName} onChange={set("plantName")} disabled={!isAdmin} style={{ ...inputStyle, width: 220 }} />
              </SettingRow>
              <SettingRow label="Operator ID" desc="Licensed operator number">
                <input value={form.operatorId} onChange={set("operatorId")} disabled={!isAdmin} style={{ ...monoInput, width: 180 }} />
              </SettingRow>
              <SettingRow label="Production Target" desc="Daily target in m³">
                <div className="flex items-center gap-1">
                  <input value={form.productionTarget} onChange={set("productionTarget")} disabled={!isAdmin} style={{ ...monoInput, width: 80 }} />
                  <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>m³/day</span>
                </div>
              </SettingRow>
              <SettingRow label="Recovery Target" desc="System recovery percentage">
                <div className="flex items-center gap-1">
                  <input value={form.recoveryTarget} onChange={set("recoveryTarget")} disabled={!isAdmin} style={{ ...monoInput, width: 60 }} />
                  <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>%</span>
                </div>
              </SettingRow>
            </Section>

            {/* Alert Thresholds */}
            <Section title="Alert Thresholds">
              {[
                { label: "Filter ΔP Warning", key: "filterDpWarn", unit: "bar" },
                { label: "Filter ΔP Critical", key: "filterDpCrit", unit: "bar" },
                { label: "Low Recovery Warning", key: "lowRecoveryWarn", unit: "%" },
                { label: "Low Chemical Alert", key: "lowChemAlert", unit: "%" },
                { label: "Min Dosing Rate", key: "minDosing", unit: "mg/L" },
                { label: "Max Dosing Rate", key: "maxDosing", unit: "mg/L" },
              ].map(t => (
                <SettingRow key={t.key} label={t.label}>
                  <div className="flex items-center gap-1">
                    <input value={form[t.key]} onChange={set(t.key)} disabled={!isAdmin} style={{ ...monoInput, width: 70 }} />
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{t.unit}</span>
                  </div>
                </SettingRow>
              ))}
            </Section>

            {/* ✅ FIXED: User Management - Uses React Router Link */}
            <Section
              title="User Management"
              action={
                <Link 
                  to="/app/user" 
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#0ea5e9", textDecoration: "none" }}
                >
                  Open <ExternalLink size={11} />
                </Link>
              }
            >
              <div className="flex flex-col items-center justify-center gap-2" style={{ padding: "24px 0", color: "var(--muted-foreground)" }}>
                <Users size={22} style={{ opacity: 0.4 }} />
                <p style={{ fontSize: 11, textAlign: "center" }}>
                  User accounts, roles, and access are managed on the dedicated User Management page.
                </p>
              </div>
            </Section>

            {/* System Information */}
            <Section title="System Information">
              <SettingRow label="Environment">
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#0ea5e9" }}>
                  {systemInfo?.environment ?? '—'}
                </span>
              </SettingRow>
              <SettingRow label="Server Uptime">
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#0ea5e9" }}>
                  {systemInfo?.uptime != null ? formatUptime(systemInfo.uptime) : '—'}
                </span>
              </SettingRow>
              <SettingRow label="MQTT Connection">
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: mqttStatus?.connected ? "#22c55e" : "#ef4444" }}>
                  {mqttStatus ? (mqttStatus.connected ? 'Connected' : 'Disconnected') : '—'}
                </span>
              </SettingRow>
              <SettingRow label="Broker">
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                  {mqttStatus?.broker ?? '—'}
                </span>
              </SettingRow>
              <SettingRow label="Data Points Received">
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                  {mqttStatus?.dataPoints?.toLocaleString() ?? '—'}
                </span>
              </SettingRow>
              <SettingRow label="Server Timestamp">
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                  {systemInfo?.timestamp ? format(new Date(systemInfo.timestamp), 'yyyy-MM-dd HH:mm:ss') : '—'}
                </span>
              </SettingRow>
            </Section>
          </div>

          {/* Actions */}
          {isAdmin && (
            <div className="flex justify-end gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", fontSize: 11, color: "var(--muted-foreground)", cursor: "pointer" }}
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded"
                style={{ background: saving ? "var(--muted)" : "#0ea5e9", color: saving ? "var(--muted-foreground)" : "#020810", fontSize: 11, fontWeight: 600, border: "none", cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </>
      )}

      <Toast toast={toast} />
    </div>
  );
}

export default Settings;