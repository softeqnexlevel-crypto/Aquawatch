// components/TenantSwitcher.jsx — client (tenant) picker in the top bar. Super admins can add a new client
// here: name + MQTT broker + what they offer. No backend work needed for a new client.
import { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getActiveTenantId, setActiveTenantId, setTenantConfig } from "../tenantFetch";
import { MqttFields, SystemsEditor, PagesEditor, PAGE_LABELS, fld, lbl, pill } from "./TenantForms";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}`;
async function api(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function NewClientModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [mqtt, setMqtt] = useState({ url: "", username: "", password: "", topicRoot: "", commandTopic: "" });
  const [systems, setSystems] = useState([{ type: "Reverse Osmosis", name: "Reverse Osmosis", chemicals: ["Antiscalant"] }]);
  const [pages, setPages] = useState(PAGE_LABELS.map(([k]) => k));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setErr("Enter the client's name"); return; }
    setBusy(true); setErr("");
    try {
      const d = await api("/tenants", { method: "POST", body: JSON.stringify({ name: name.trim(), mqtt, config: { systems, pages } }) });
      onCreated(d.tenant);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }
  const h = { fontSize: 11.5, fontWeight: 800, letterSpacing: "0.18em", color: "var(--muted-foreground)", margin: "22px 0 4px", textTransform: "uppercase" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "4vh 12px" }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 22, padding: 22, width: "100%", maxWidth: 560, boxShadow: "0 0 40px rgba(0,229,255,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Add new client</div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer" }}><X size={20} /></button>
        </div>
        <span style={lbl}>Client name</span>
        <input autoFocus style={fld} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kitengela Water Works" />

        <div style={h}>MQTT connection</div>
        <MqttFields value={mqtt} onChange={setMqtt} />

        <div style={h}>What they offer</div>
        <SystemsEditor value={systems} onChange={setSystems} />

        <div style={h}>Pages on their dashboard</div>
        <PagesEditor value={pages} onChange={setPages} />

        {err && <div style={{ color: "#ff3355", fontSize: 13.5, marginTop: 14 }}>{err}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={pill("var(--secondary)", "var(--foreground)", { border: "1px solid var(--border)" })}>Cancel</button>
          <button type="submit" disabled={busy} style={pill("#c6ff00", "#000")}>{busy ? "Connecting…" : "Create & connect"}</button>
        </div>
      </form>
    </div>
  );
}

export function TenantSwitcher({ compact }) {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [canCreate, setCanCreate] = useState(false);
  const [modal, setModal] = useState(false);
  const active = getActiveTenantId();

  useEffect(() => {
    if (!user) return;
    api("/tenants").then((d) => {
      const list = d.tenants || [];
      setTenants(list); setCanCreate(!!d.canCreate);
      const cur = list.find((t) => String(t.id) === active);
      if (!cur && list[0]) { setActiveTenantId(list[0].id); window.location.reload(); return; } // saved client no longer allowed
      if (cur) setTenantConfig(cur.config);
    }).catch(() => { /* hidden when unavailable */ });
  }, [user?.id]);

  function switchTo(id) { setActiveTenantId(id); window.location.reload(); }

  if (!user || tenants.length === 0 || (tenants.length < 2 && !canCreate)) return null;
  const value = tenants.some((t) => String(t.id) === active) ? active : String(tenants[0].id);

  return (
    <>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <select
          value={value}
          onChange={(e) => (e.target.value === "__new__" ? setModal(true) : e.target.value !== value && switchTo(e.target.value))}
          style={{
            appearance: "none", WebkitAppearance: "none", cursor: "pointer", fontWeight: 700,
            fontSize: compact ? 12 : 14, color: "var(--foreground)", background: "var(--input-background, #050a12)",
            border: "1px solid #00e5ff", borderRadius: 14, padding: compact ? "6px 22px 6px 8px" : "9px 36px 9px 14px",
            boxShadow: "0 0 10px rgba(0,229,255,0.25)", outline: "none", maxWidth: compact ? 96 : 220,
          }}
        >
          {tenants.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
          {canCreate && <option value="__new__">+ New client…</option>}
        </select>
        <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--foreground)" }} />
      </div>
      {modal && <NewClientModal onClose={() => setModal(false)} onCreated={(t) => switchTo(t.id)} />}
    </>
  );
}

export default TenantSwitcher;
