// src/components/TagMapEditor.jsx
// "Edit tags": a client may call its tags something else (e.g. "Feed_Pr" instead of "RO5-ROPressure").
// Type that client's own tag name next to each dashboard role. The server then renames the client's
// incoming readings to the standard names, so every page (Visualization, Tanks, Production...) works
// for that client without any other change. Super admin only. Applies to the client that is open.
import { useEffect, useMemo, useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { getActiveTenantId } from "../tenantFetch";

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

// The roles the dashboard, Visualization and tank pages read. [standard tag, what it is]
const ROLES = [
  ["Tanks", [
    ["RO5-FeedTankLevelRaw", "Feed tank level (raw sensor)"],
    ["RO5-FeedTankLevel", "Feed tank level (%)"],
    ["RO5-FlushTank", "Flush tank level (raw sensor)"],
  ]],
  ["Flows", [
    ["RO5-FEEDFlow", "Feed flow"],
    ["RO5-Permeateflow", "Permeate (product) flow"],
    ["RO5-ConcetrateFlow", "Concentrate (reject) flow"],
  ]],
  ["Pressures", [
    ["RO5-MediaFilterInPress", "Media filter inlet pressure"],
    ["RO5-MediaFilterOutPress", "Media filter outlet pressure"],
    ["RO5-ROPressure", "Feed / RO pressure (high-pressure pump)"],
    ["RO5-InterstagePress", "Interstage pressure"],
    ["RO5-ConcetratePress", "Concentrate pressure"],
  ]],
  ["Pumps & status", [
    ["RO5-Feedpump", "Feed pump (ON/OFF)"],
    ["RO5-HPPpump", "High-pressure pump (ON/OFF)"],
    ["RO5-SystemActive", "System active"],
    ["RO5-SystemOperation", "System operation"],
    ["RO5-SystemMode", "System mode"],
    ["RO5-AntiscalantDosingActive", "Antiscalant dosing pump (ON/OFF)"],
  ]],
  ["Performance", [
    ["RO5-SystemRecovery", "System recovery (%)"],
    ["RO5-PureWaterEc", "Permeate conductivity (EC)"],
    ["RO5-MediaFilterDeltaP", "Media filter ΔP"],
    ["RO5-Stage1Delta", "Stage-1 ΔP"],
    ["RO5-Stage2Delta", "Stage-2 ΔP"],
  ]],
  ["Hours & dosing", [
    ["RO5-SystemRunhrs", "Service run hours"],
    ["RO5-SystemDailyRunHrs", "Daily run hours"],
    ["RO5-AntiscalantDaily", "Antiscalant dosed today (ml)"],
  ]],
];

const fld = { width: "100%", background: "var(--input-background, #050a12)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 12px", fontSize: 14, color: "var(--foreground)", outline: "none", boxSizing: "border-box" };
const pill = (bg, color, extra = {}) => ({ background: bg, color, border: "1px solid transparent", borderRadius: 999, padding: "10px 22px", cursor: "pointer", fontWeight: 800, fontSize: 12.5, letterSpacing: "0.08em", textTransform: "uppercase", ...extra });

export function TagMapEditor({ liveTags = [], onClose }) {
  const tid = Number(getActiveTenantId()) || 1;
  const [map, setMap] = useState({});
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    apiCall(`/tenants/${tid}`).then((d) => { setMap(d.tenant?.config?.tagMap || {}); setName(d.tenant?.name || ""); })
      .catch((e) => setMsg({ ok: false, text: e.message }));
  }, [tid]);

  const standard = useMemo(() => new Set(ROLES.flatMap(([, rows]) => rows.map(([k]) => k))), []);
  // tags this client is sending that are not one of the standard names: the likely candidates
  const suggestions = useMemo(() => liveTags.filter((t) => !standard.has(t)).sort(), [liveTags, standard]);
  const receiving = (k) => liveTags.includes(k);

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      await apiCall(`/tenants/${tid}`, { method: "PUT", body: JSON.stringify({ config: { tagMap: map } }) });
      setMsg({ ok: true, text: "Saved. New readings use these names straight away; give it a minute to see the values appear." });
    } catch (e) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  };

  if (tid === 1) {
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: 22, color: "var(--foreground)" }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Main plant</div>
          <div style={{ fontSize: 13.5, color: "var(--muted-foreground)" }}>The main plant's tag names are fixed and can't be changed. Switch to a client in the top bar to edit its tags.</div>
          <button onClick={onClose} style={{ ...pill("var(--secondary)", "var(--foreground)", { border: "1px solid var(--border)" }), marginTop: 16 }}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 760, maxHeight: "92vh", display: "flex", flexDirection: "column", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--foreground)" }}>Edit tags{name ? ` · ${name}` : ""}</div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>
              Type this client's own tag name next to each item. Leave a box empty if the client already uses the standard name.
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer" }}><X size={20} /></button>
        </div>

        <div style={{ overflow: "auto", padding: "6px 18px 12px" }}>
          <datalist id="client-tags">{suggestions.map((t) => <option key={t} value={t} />)}</datalist>
          {ROLES.map(([group, rows]) => (
            <div key={group} style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", color: "var(--muted-foreground)", textTransform: "uppercase", marginBottom: 6 }}>{group}</div>
              {rows.map(([key, label]) => (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", gap: 10, alignItems: "center", padding: "5px 0" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 6 }}>
                      {label}{receiving(key) && <CheckCircle size={13} color="#39ff88" title="receiving data" />}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "monospace" }}>{key}</div>
                  </div>
                  <input
                    list="client-tags"
                    style={fld}
                    placeholder="client's tag name"
                    value={map[key] || ""}
                    onChange={(e) => setMap((m) => ({ ...m, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          ))}
          {suggestions.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 16 }}>
              Tags this client is sending right now that the dashboard doesn't know: <span style={{ fontFamily: "monospace" }}>{suggestions.slice(0, 40).join(", ")}</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <div style={{ flex: 1, fontSize: 12.5, color: msg ? (msg.ok ? "#39ff88" : "#ff3355") : "var(--muted-foreground)" }}>
            {msg ? msg.text : "Only readings that arrive after you save are renamed; older stored readings keep their old names."}
          </div>
          <button onClick={onClose} style={pill("var(--secondary)", "var(--foreground)", { border: "1px solid var(--border)" })}>Close</button>
          <button onClick={save} disabled={busy} style={pill("#c6ff00", "#000", { opacity: busy ? 0.6 : 1 })}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}