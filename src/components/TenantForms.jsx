// components/TenantForms.jsx — the pieces used to describe a client: MQTT connection, what they offer, pages.
import { useState } from "react";

export const SYSTEM_TYPES = ["Reverse Osmosis", "Water Treatment", "Borehole", "Wastewater", "Boiler / Cooling", "Other"];
export const CHEMICALS = ["Alum", "Ferric Chloride", "PAC", "Polymer", "Lime", "Caustic Soda", "Chlorine", "Antiscalant", "Citric Acid", "Sodium Bisulfite"];
export const PAGE_LABELS = [
  ["dashboard", "Dashboard"], ["mimic", "Mimic"], ["tank level", "Tanks"], ["production", "Production"], ["antiscalant", "Antiscalant"],
  ["filtration", "Filtration"], ["system recovery", "System Recovery"], ["maintenance", "Maintenance"], ["analytics", "Analytics"],
  ["reports", "Reports"], ["alerts", "Alerts"],
];

export const fld = { width: "100%", background: "var(--input-background, #050a12)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontSize: 15, color: "var(--foreground)", outline: "none", boxSizing: "border-box" };
export const lbl = { fontSize: 13.5, color: "var(--muted-foreground)", margin: "12px 0 6px", display: "block" };
export const pill = (bg, color, extra = {}) => ({ background: bg, color, border: "1px solid transparent", borderRadius: 999, padding: "11px 22px", cursor: "pointer", fontWeight: 800, fontSize: 12.5, letterSpacing: "0.08em", textTransform: "uppercase", ...extra });
const hint = { fontSize: 12.5, color: "var(--muted-foreground)", marginTop: 6, lineHeight: 1.45 };

/** Broker fields. `value` = { url, username, password, topicRoot, commandTopic }. */
export function MqttFields({ value, onChange, hasPassword }) {
  const [show, setShow] = useState(false);
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <>
      <span style={lbl}>Broker URL</span>
      <input style={fld} value={value.url || ""} onChange={set("url")} placeholder="mqtts://broker.example.com:8883" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      <div style={hint}>Leave empty to use the platform's shared broker (the client then publishes under their own topic root).</div>
      <span style={lbl}>Username</span>
      <input style={fld} value={value.username || ""} onChange={set("username")} autoComplete="off" autoCapitalize="off" />
      <span style={lbl}>Password</span>
      <div style={{ position: "relative" }}>
        <input style={{ ...fld, paddingRight: 70 }} type={show ? "text" : "password"} value={value.password || ""} onChange={set("password")}
          placeholder={hasPassword ? "•••••••• (saved — type to replace)" : ""} autoComplete="new-password" />
        <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>{show ? "Hide" : "Show"}</button>
      </div>
      <span style={lbl}>Topic root</span>
      <input style={fld} value={value.topicRoot || ""} onChange={set("topicRoot")} placeholder="RO5" autoCapitalize="off" spellCheck={false} />
      <div style={hint}>The platform subscribes to <b>{(value.topicRoot || "<root>")}/#</b>.</div>
      <span style={lbl}>Command topic (optional)</span>
      <input style={fld} value={value.commandTopic || ""} onChange={set("commandTopic")} placeholder="RO5/commands" autoCapitalize="off" spellCheck={false} />
    </>
  );
}

const chip = (on) => ({
  cursor: "pointer", fontSize: 13, fontWeight: 700, padding: "7px 13px", borderRadius: 999,
  border: `1px solid ${on ? "#00e5ff" : "var(--border)"}`, background: on ? "rgba(0,229,255,0.12)" : "var(--secondary)", color: on ? "#00e5ff" : "var(--foreground)",
});

/** What the client offers: list of { type, name, chemicals[] }. */
export function SystemsEditor({ value, onChange }) {
  const systems = value || [];
  const upd = (i, patch) => onChange(systems.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const toggleChem = (i, c) => { const cur = systems[i].chemicals || []; upd(i, { chemicals: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] }); };
  return (
    <div>
      {systems.map((s, i) => (
        <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 16, padding: 14, margin: "10px 0" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={s.type} onChange={(e) => upd(i, { type: e.target.value, name: s.name && s.name !== s.type ? s.name : e.target.value })} style={{ ...fld, flex: 1 }}>
              {SYSTEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="button" onClick={() => onChange(systems.filter((_, j) => j !== i))} style={pill("var(--secondary)", "#ff3355", { border: "1px solid var(--border)", padding: "8px 14px" })}>Remove</button>
          </div>
          <span style={lbl}>Dashboard name</span>
          <input style={fld} value={s.name || ""} onChange={(e) => upd(i, { name: e.target.value })} />
          <span style={lbl}>Chemicals dosed</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CHEMICALS.map((c) => <span key={c} role="button" onClick={() => toggleChem(i, c)} style={chip((s.chemicals || []).includes(c))}>{c}</span>)}
          </div>
        </div>
      ))}
      <button type="button" style={pill("var(--secondary)", "var(--foreground)", { border: "1px solid var(--border)", marginTop: 6 })}
        onClick={() => onChange([...systems, { type: "Reverse Osmosis", name: "Reverse Osmosis", chemicals: [] }])}>+ Add treatment system</button>
    </div>
  );
}

/** Which pages this client's dashboard shows. */
export function PagesEditor({ value, onChange }) {
  const pages = value || [];
  const toggle = (k) => onChange(pages.includes(k) ? pages.filter((p) => p !== k) : [...pages, k]);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
      {PAGE_LABELS.map(([k, l]) => <span key={k} role="button" onClick={() => toggle(k)} style={chip(pages.includes(k))}>{l}</span>)}
    </div>
  );
}
