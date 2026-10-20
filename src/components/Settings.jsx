// frontend/src/components/Settings.jsx — client-style settings page (AquaSystemTech)
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getActiveTenantId, setActiveTenantId, setTenantConfig } from "../tenantFetch";
import { MqttFields, SystemsEditor, PagesEditor } from "./TenantForms";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}`;

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ---------- shared look ----------
const fld = { width: "100%", background: "var(--input-background, #050a12)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontSize: 15, color: "var(--foreground)", outline: "none", boxSizing: "border-box" };
const lbl = { fontSize: 13.5, color: "var(--muted-foreground)", margin: "12px 0 6px", display: "block" };
const pill = (bg, color, extra = {}) => ({ background: bg, color, border: "1px solid transparent", borderRadius: 999, padding: "11px 22px", cursor: "pointer", fontWeight: 800, fontSize: 12.5, letterSpacing: "0.08em", textTransform: "uppercase", ...extra });
const ghost = { background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" };

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.18em", color: "var(--muted-foreground)", margin: "0 4px 8px", textTransform: "uppercase" }}>{title}</div>
      {children}
    </div>
  );
}
function Card({ title, badge, children }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 18, marginBottom: 14 }}>
      {(title || badge) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--foreground)" }}>{title}</div>
          {badge}
        </div>
      )}
      {children}
    </div>
  );
}
const Badge = ({ children, color = "#00e5ff" }) => (
  <span style={{ fontSize: 12, fontWeight: 800, color, border: `1px solid ${color}66`, background: `${color}1a`, borderRadius: 999, padding: "4px 12px", whiteSpace: "nowrap" }}>{children}</span>
);
const Note = ({ children }) => <div style={{ fontSize: 15, color: "var(--muted-foreground)", margin: "4px 0 12px", lineHeight: 1.5 }}>{children}</div>;
const Check = ({ checked, onChange, disabled, children }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5, color: "var(--foreground)", margin: "8px 0", cursor: disabled ? "default" : "pointer" }}>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16, colorScheme: "dark" }} />
    {children}
  </label>
);

function useToast() {
  const [msg, setMsg] = useState(null);
  const show = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };
  const node = msg && (
    <div style={{ position: "fixed", top: 70, right: 20, zIndex: 300, padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700,
      background: msg.ok ? "#0d2b1a" : "#2b0d14", color: msg.ok ? "#39ff88" : "#ff3355", border: `1px solid ${msg.ok ? "#39ff8855" : "#ff335555"}` }}>{msg.text}</div>
  );
  return [show, node];
}

// ================= CONNECTION =================
const tid = () => Number(getActiveTenantId()) || 1;

function Connection({ isSuper, toast }) {
  const [t, setT] = useState(null);
  const [st, setSt] = useState({});
  const [form, setForm] = useState({ url: "", username: "", password: "", topicRoot: "", commandTopic: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const d = await apiCall(`/tenants/${tid()}`);
      setT(d.tenant); setSt(d.status || {}); setErr("");
      if (d.tenant?.mqtt) setForm({ ...d.tenant.mqtt, password: "" });
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function save() {
    setBusy(true);
    try {
      const d = await apiCall(`/tenants/${tid()}`, { method: "PUT", body: JSON.stringify({ mqtt: form }) });
      setT(d.tenant); setSt(d.status || {}); setForm({ ...d.tenant.mqtt, password: "" }); toast("Saved — connecting to the broker…");
      setTimeout(load, 4000);
    } catch (e) { toast(e.message, false); } finally { setBusy(false); }
  }
  const connected = st.connected === true;
  const age = st.secondsSinceLastMessage;
  return (
    <Card title="MQTT connection" badge={<Badge color={err ? "#ff3355" : connected ? "#39ff88" : "#ffb938"}>{err ? "unavailable" : connected ? "connected" : "disconnected"}</Badge>}>
      <Note>
        {isSuper ? "This client's data gateway. Save the broker details here and the platform connects straight away — nothing to change on the server."
                 : "Status of this plant's data gateway."}
      </Note>
      {st.shared && <div style={{ marginBottom: 10 }}><Badge color="#ffb938">shared platform broker</Badge></div>}
      {isSuper && t ? (
        <>
          <MqttFields value={form} onChange={setForm} hasPassword={t.mqtt?.hasPassword} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button disabled={busy} style={pill("#c6ff00", "#000")} onClick={save}>{busy ? "Connecting…" : "Save & connect"}</button>
            <button style={pill("var(--secondary)", "var(--foreground)", { border: "1px solid var(--border)" })} onClick={load}>Refresh status</button>
          </div>
        </>
      ) : (
        <>
          <span style={lbl}>Broker</span><input style={{ ...fld, opacity: 0.8 }} readOnly value={st.brokerHost || "Shared platform broker"} />
          <div style={{ marginTop: 14 }}><button style={pill("var(--secondary)", "var(--foreground)", { border: "1px solid var(--border)" })} onClick={load}>Refresh status</button></div>
        </>
      )}
      <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 14, lineHeight: 1.6 }}>
        Topic: <b>{st.topicRoot ? `${st.topicRoot}/#` : "—"}</b> · Tags received: <b>{st.dataPoints ?? 0}</b> · Last message: <b>{age == null ? "none yet" : age < 90 ? `${age}s ago` : `${Math.round(age / 60)} min ago`}</b>
      </div>
      {err && <div style={{ color: "#ff3355", fontSize: 13, marginTop: 10 }}>{err}</div>}
    </Card>
  );
}

// ================= WHAT THIS CLIENT OFFERS (super admin) =================
function TenantSetup({ toast }) {
  const [t, setT] = useState(null);
  const [name, setName] = useState("");
  const [pages, setPages] = useState([]);
  const [systems, setSystems] = useState([]);
  useEffect(() => {
    apiCall(`/tenants/${tid()}`).then((d) => { setT(d.tenant); setName(d.tenant.name); setPages(d.tenant.config.pages); setSystems(d.tenant.config.systems); }).catch(() => {});
  }, []);
  if (!t) return null;
  async function save() {
    try {
      const d = await apiCall(`/tenants/${tid()}`, { method: "PUT", body: JSON.stringify({ name, config: { pages, systems } }) });
      setTenantConfig(d.tenant.config); toast("Client saved — reload to see the new menu");
    } catch (e) { toast(e.message, false); }
  }
  async function del() {
    const typed = window.prompt(`This deletes "${t.name}" and ALL of its stored readings. It cannot be undone.\n\nType the client's name to confirm:`);
    if (typed === null) return;
    if (typed.trim() !== t.name) { toast("Name did not match — nothing was deleted", false); return; }
    try {
      await apiCall(`/tenants/${tid()}`, { method: "DELETE" });
      setActiveTenantId(1); window.location.reload();
    } catch (e) { toast(e.message, false); }
  }
  return (
    <>
      <Card title="CLIENT">
        <span style={lbl}>Client name</span><input style={fld} value={name} onChange={(e) => setName(e.target.value)} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16, justifyContent: "space-between" }}>
          <button style={pill("#c6ff00", "#000")} onClick={save}>Save</button>
          {tid() !== 1
            ? <button style={pill("#ff3355", "#fff")} onClick={del}>Delete client</button>
            : <span style={{ fontSize: 12.5, color: "var(--muted-foreground)", alignSelf: "center" }}>The main plant can't be deleted.</span>}
        </div>
      </Card>
      <Card title="TENANT PAGE ACCESS"><Note>Pages this client's dashboard shows. Their users can only open what is ticked here.</Note>
        <PagesEditor value={pages} onChange={setPages} />
      </Card>
      <Card title="TREATMENT SYSTEMS"><Note>What this client offers and which chemicals each system doses.</Note>
        <SystemsEditor value={systems} onChange={setSystems} />
        <button style={pill("#c6ff00", "#000", { marginTop: 16 })} onClick={save}>Save</button>
      </Card>
    </>
  );
}

// ================= NOTIFICATIONS =================
function Notifications({ isAdmin, toast }) {
  const [me, setMe] = useState(null);
  const [mine, setMine] = useState(true);
  const [tenant, setTenant] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => { apiCall("/notifications/me").then((d) => { setMe(d); setMine(d.emailAlerts); setTenant(d.tenantEnabled); }).catch(() => {}); }, []);
  const smtp = me?.smtpConfigured;
  return (
    <Card title="Email alerts" badge={me && <Badge color={smtp ? "#39ff88" : "#ffb938"}>{smtp ? "SMTP ready" : "SMTP not set — logged on server"}</Badge>}>
      <Note>Alarms are emailed to registered users who have alerts on (default: operators and admins). The same alarm repeats at most every 15 min.</Note>
      <Check checked={mine} onChange={setMine}>Send alerts to my email ({me?.email || "…"})</Check>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, margin: "8px 0 4px" }}>
        <button disabled={busy} style={pill("var(--secondary)", "var(--foreground)", { border: "1px solid var(--border)" })}
          onClick={async () => { setBusy(true); try { await apiCall("/notifications/me", { method: "PUT", body: JSON.stringify({ emailAlerts: mine }) }); toast("Saved"); } catch (e) { toast(e.message, false); } finally { setBusy(false); } }}>Save</button>
        <button disabled={busy} style={pill("var(--secondary)", "var(--foreground)", { border: "1px solid var(--border)" })}
          onClick={async () => { setBusy(true); try { const d = await apiCall("/notifications/test", { method: "POST" }); toast(d.message); } catch (e) { toast(e.message, false); } finally { setBusy(false); } }}>Send test email</button>
      </div>
      {isAdmin && (
        <>
          <Check checked={tenant} onChange={setTenant}>Email alerts enabled for this plant</Check>
          <button style={pill("#c6ff00", "#000", { marginTop: 8 })}
            onClick={async () => { try { await apiCall("/settings-extra", { method: "PUT", body: JSON.stringify({ emailAlertsEnabled: tenant }) }); toast("Plant settings saved"); } catch (e) { toast(e.message, false); } }}>Save plant settings</button>
        </>
      )}
    </Card>
  );
}

// ================= ACCOUNT =================
function Account({ user, toast }) {
  const [cur, setCur] = useState(""); const [next, setNext] = useState(""); const [busy, setBusy] = useState(false);
  const role = user?.isSuperAdmin ? "superadmin" : user?.role;
  async function change() {
    if (!cur || next.length < 8) { toast("Enter your current password and a new one (min 8)", false); return; }
    setBusy(true);
    try { await apiCall("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword: cur, newPassword: next }) }); setCur(""); setNext(""); toast("Password changed"); }
    catch (e) { toast(e.message, false); } finally { setBusy(false); }
  }
  return (
    <Card title={user?.email} badge={<Badge>{role}</Badge>}>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.18em", color: "var(--muted-foreground)", margin: "10px 0 8px" }}>CHANGE PASSWORD</div>
      <input type="password" placeholder="Current password" value={cur} onChange={(e) => setCur(e.target.value)} style={{ ...fld, marginBottom: 10 }} autoComplete="current-password" />
      <input type="password" placeholder="New password (min 8)" value={next} onChange={(e) => setNext(e.target.value)} style={fld} autoComplete="new-password" />
      <button disabled={busy} onClick={change} style={pill("#c6ff00", "#000", { marginTop: 14 })}>{busy ? "Saving…" : "Change password"}</button>
    </Card>
  );
}

// ================= ADMINISTRATION =================
const NUM = (v) => (v === "" || v === null || v === undefined ? "" : String(v));

function Targets({ toast }) {
  const main = tid() === 1;
  const [s, setS] = useState(null); const [x, setX] = useState(null);
  useEffect(() => {
    if (main) Promise.all([apiCall("/settings"), apiCall("/settings-extra")]).then(([a, b]) => { setS(a.settings); setX(b.extra); }).catch((e) => toast(e.message, false));
    else apiCall(`/tenants/${tid()}`).then((d) => { const c = d.tenant.config; setS({ productionTarget: c.productionTarget, recoveryTarget: c.recoveryTarget }); setX({ feedTankCapacity: c.feedTankCapacity, flushTankCapacity: c.flushTankCapacity }); }).catch((e) => toast(e.message, false));
  }, []);
  if (!s || !x) return <Card title="Targets & capacity"><Note>Loading…</Note></Card>;
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });
  const setE = (k) => (e) => setX({ ...x, [k]: e.target.value });
  async function save() {
    try {
      if (main) {
        await apiCall("/settings", { method: "PUT", body: JSON.stringify({ productionTarget: s.productionTarget, recoveryTarget: s.recoveryTarget }) });
        await apiCall("/settings-extra", { method: "PUT", body: JSON.stringify({ feedTankCapacity: x.feedTankCapacity, flushTankCapacity: x.flushTankCapacity }) });
      } else {
        await apiCall(`/tenants/${tid()}`, { method: "PUT", body: JSON.stringify({ config: { productionTarget: s.productionTarget, recoveryTarget: s.recoveryTarget, feedTankCapacity: x.feedTankCapacity, flushTankCapacity: x.flushTankCapacity } }) });
      }
      toast("Targets & capacity saved");
    } catch (e) { toast(e.message, false); }
  }
  return (
    <Card title="TARGETS & CAPACITY">
      <span style={lbl}>Daily production target (m³)</span><input style={fld} type="number" value={NUM(s.productionTarget)} onChange={set("productionTarget")} />
      <span style={lbl}>Recovery target (%)</span><input style={fld} type="number" value={NUM(s.recoveryTarget)} onChange={set("recoveryTarget")} />
      <span style={lbl}>Feed tank capacity (m³)</span><input style={fld} type="number" value={NUM(x.feedTankCapacity)} onChange={setE("feedTankCapacity")} />
      <span style={lbl}>Flush tank capacity (m³)</span><input style={fld} type="number" value={NUM(x.flushTankCapacity)} onChange={setE("flushTankCapacity")} />
      <button style={pill("#c6ff00", "#000", { marginTop: 16 })} onClick={save}>Save</button>
    </Card>
  );
}

function Thresholds({ toast }) {
  const [s, setS] = useState(null);
  useEffect(() => { apiCall("/settings").then((a) => setS(a.settings)).catch(() => {}); }, []);
  if (!s) return null;
  const f = (k, label) => (<div key={k}><span style={lbl}>{label}</span><input style={fld} type="number" step="any" value={NUM(s[k])} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></div>);
  async function save() {
    try {
      const body = {}; ["plantName", "operatorId", "filterDpWarn", "filterDpCrit", "lowRecoveryWarn", "lowChemAlert", "minDosing", "maxDosing"].forEach((k) => (body[k] = s[k]));
      await apiCall("/settings", { method: "PUT", body: JSON.stringify(body) }); toast("Alert thresholds saved");
    } catch (e) { toast(e.message, false); }
  }
  return (
    <Card title="ALERT THRESHOLDS & DOSING">
      <span style={lbl}>Plant name</span><input style={fld} value={s.plantName || ""} onChange={(e) => setS({ ...s, plantName: e.target.value })} />
      <span style={lbl}>Operator ID</span><input style={fld} value={s.operatorId || ""} onChange={(e) => setS({ ...s, operatorId: e.target.value })} />
      {f("filterDpWarn", "Filter ΔP warning (bar)")}{f("filterDpCrit", "Filter ΔP critical (bar)")}
      {f("lowRecoveryWarn", "Low recovery warning (%)")}{f("lowChemAlert", "Low chemical alert (%)")}
      {f("minDosing", "Min dosing rate")}{f("maxDosing", "Max dosing rate")}
      <button style={pill("#c6ff00", "#000", { marginTop: 16 })} onClick={save}>Save</button>
    </Card>
  );
}

// ================= PAGE =================
export function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [toast, toastNode] = useToast();
  return (
    <div className="overflow-auto h-full" style={{ padding: "4px 4px 40px" }}>
      {toastNode}
      <div style={{ maxWidth: 1080, width: "100%", margin: "0 auto" }}>
        <Section title="Connection"><Connection isSuper={!!user?.isSuperAdmin} toast={toast} /></Section>
        {tid() === 1 && <Section title="Notifications"><Notifications isAdmin={isAdmin} toast={toast} /></Section>}
        <Section title="Account"><Account user={user} toast={toast} /></Section>
        <Section title="About">
          <Card><div style={{ fontSize: 17, fontWeight: 800 }}>Aqua System Tech</div><div style={{ fontSize: 13.5, color: "var(--muted-foreground)", marginTop: 4 }}>Water Management · RO monitoring v1.0</div></Card>
        </Section>
        {user?.isSuperAdmin && <Section title="Client setup"><TenantSetup toast={toast} /></Section>}
        {isAdmin && (
          <Section title="Administration">
            <Targets toast={toast} />
            {tid() === 1 && <Thresholds toast={toast} />}
          </Section>
        )}
      </div>
    </div>
  );
}

export default Settings;
