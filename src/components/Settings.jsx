import { Settings as SettingsIcon, User, Bell, Shield, Database, Monitor } from "lucide-react";

function Section({ title, children }) {
  return (
    <div className="rounded p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div style={{ 
        fontSize: 11, 
        fontWeight: 600, 
        color: "var(--muted-foreground)", 
        textTransform: "uppercase", 
        letterSpacing: "0.1em", 
        marginBottom: 12 
      }}>
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

export function Settings() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full" style={{ scrollbarWidth: "none" }}>
      <div style={{ 
        fontSize: 11, 
        fontWeight: 600, 
        color: "var(--muted-foreground)", 
        textTransform: "uppercase", 
        letterSpacing: "0.1em" 
      }}>
        System Settings
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Section title="Plant Configuration">
          <SettingRow label="Plant Name" desc="Display name for the facility">
            <input 
              defaultValue="Nairobi Water Treatment Plant" 
              style={{ 
                background: "var(--secondary)", 
                border: "1px solid var(--border)", 
                borderRadius: 4, 
                padding: "4px 8px", 
                fontSize: 11, 
                color: "var(--foreground)", 
                width: 220 
              }} 
            />
          </SettingRow>
          <SettingRow label="Operator ID" desc="Licensed operator number">
            <input 
              defaultValue="WTP-2024-NBI-001" 
              style={{ 
                background: "var(--secondary)", 
                border: "1px solid var(--border)", 
                borderRadius: 4, 
                padding: "4px 8px", 
                fontSize: 11, 
                fontFamily: "var(--font-mono)", 
                color: "var(--foreground)", 
                width: 180 
              }} 
            />
          </SettingRow>
          <SettingRow label="Production Target" desc="Daily target in m³">
            <div className="flex items-center gap-1">
              <input 
                defaultValue="4200" 
                style={{ 
                  background: "var(--secondary)", 
                  border: "1px solid var(--border)", 
                  borderRadius: 4, 
                  padding: "4px 8px", 
                  fontSize: 11, 
                  fontFamily: "var(--font-mono)", 
                  color: "var(--foreground)", 
                  width: 80 
                }} 
              />
              <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>m³/day</span>
            </div>
          </SettingRow>
          <SettingRow label="Recovery Target" desc="System recovery percentage">
            <div className="flex items-center gap-1">
              <input 
                defaultValue="78" 
                style={{ 
                  background: "var(--secondary)", 
                  border: "1px solid var(--border)", 
                  borderRadius: 4, 
                  padding: "4px 8px", 
                  fontSize: 11, 
                  fontFamily: "var(--font-mono)", 
                  color: "var(--foreground)", 
                  width: 60 
                }} 
              />
              <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>%</span>
            </div>
          </SettingRow>
        </Section>

        <Section title="Alert Thresholds">
          {[
            { label: "Filter ΔP Warning", value: "0.50", unit: "bar" },
            { label: "Filter ΔP Critical", value: "0.65", unit: "bar" },
            { label: "Low Recovery Warning", value: "76", unit: "%" },
            { label: "Low Chemical Alert", value: "20", unit: "%" },
            { label: "Min Dosing Rate", value: "2.0", unit: "mg/L" },
            { label: "Max Dosing Rate", value: "3.0", unit: "mg/L" },
          ].map(t => (
            <SettingRow key={t.label} label={t.label}>
              <div className="flex items-center gap-1">
                <input 
                  defaultValue={t.value} 
                  style={{ 
                    background: "var(--secondary)", 
                    border: "1px solid var(--border)", 
                    borderRadius: 4, 
                    padding: "4px 8px", 
                    fontSize: 11, 
                    fontFamily: "var(--font-mono)", 
                    color: "var(--foreground)", 
                    width: 70 
                  }} 
                />
                <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{t.unit}</span>
              </div>
            </SettingRow>
          ))}
        </Section>

        <Section title="User Management">
          {[
            { name: "John Mwangi", role: "Operations Manager", email: "j.mwangi@utility.co.ke", active: true },
            { name: "Grace Wanjiku", role: "Plant Operator", email: "g.wanjiku@utility.co.ke", active: true },
            { name: "Peter Ochieng", role: "Maintenance Technician", email: "p.ochieng@utility.co.ke", active: true },
            { name: "Mary Achieng", role: "Plant Operator", email: "m.achieng@utility.co.ke", active: false },
          ].map(u => (
            <div key={u.email} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <div 
                className="flex items-center justify-center rounded-full" 
                style={{ 
                  width: 28, 
                  height: 28, 
                  background: u.active ? "rgba(14,165,233,0.2)" : "rgba(77,122,158,0.2)", 
                  flexShrink: 0 
                }}
              >
                <User size={12} style={{ color: u.active ? "#0ea5e9" : "#4d7a9e" }} />
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--foreground)" }}>{u.name}</div>
                <div style={{ fontSize: 9, color: "var(--muted-foreground)" }}>{u.role} · {u.email}</div>
              </div>
              <span style={{
                fontSize: 8, 
                fontWeight: 600,
                color: u.active ? "#22c55e" : "#4d7a9e",
                background: u.active ? "rgba(34,197,94,0.1)" : "rgba(77,122,158,0.1)",
                borderRadius: 3, 
                padding: "1px 6px"
              }}>
                {u.active ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          ))}
        </Section>

        <Section title="System Information">
          {[
            { label: "Software Version", value: "AquaOps v2.4.1" },
            { label: "Database", value: "PostgreSQL 16.2" },
            { label: "Last Backup", value: "2026-06-06 02:00" },
            { label: "Uptime", value: "47 days, 6 hrs" },
            { label: "Data Retention", value: "5 years" },
            { label: "License Expires", value: "2027-12-31" },
          ].map(s => (
            <SettingRow key={s.label} label={s.label}>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#0ea5e9" }}>{s.value}</span>
            </SettingRow>
          ))}
        </Section>
      </div>

      {/* Save button */}
      <div className="flex justify-end gap-2">
        <button 
          className="px-4 py-2 rounded" 
          style={{ 
            background: "var(--secondary)", 
            border: "1px solid var(--border)", 
            fontSize: 11, 
            color: "var(--muted-foreground)" 
          }}
        >
          Reset
        </button>
        <button 
          className="px-4 py-2 rounded" 
          style={{ 
            background: "#0ea5e9", 
            color: "#020810", 
            fontSize: 11, 
            fontWeight: 600 
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}