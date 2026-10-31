import { usePageAccess } from "../pageAccess";
import { useState } from "react";
import { LayoutDashboard, Droplets, Activity, FlaskConical, MoreHorizontal, Filter, RotateCcw, Wrench, BarChart3, FileText, Bell, Settings, Tags, Receipt, UserPenIcon, X } from "lucide-react";
import { useNavigate } from "react-router";
import { ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const CYAN = "#00e5ff";

import { useTenantConfig } from "../tenantFetch";

// nav item id -> page key in a client's tenant settings (items not listed are always shown)
const TENANT_PAGE = { dashboard: "dashboard", boreholes: "tank level", production: "production", antiscalant: "antiscalant", filtration: "filtration", recovery: "system recovery", maintenance: "maintenance", analytics: "analytics", reports: "reports", alerts: "alerts", mimic: "mimic" };

// Main 4 tabs shown on the bar (same order as the client's app)
const MAIN = [
  { id: "dashboard",   label: "Dashboard",   icon: LayoutDashboard, page: "dashboard" },
  { id: "boreholes",   label: "Tanks",       icon: Droplets,        page: "tank level" },
  { id: "production",  label: "Production",  icon: Activity,        page: "production" },
  { id: "antiscalant", label: "Antiscalant", icon: FlaskConical,    page: "antiscalant" },
];

// Everything else lives under "More", grouped like the client's app
const MORE_GROUPS = [
  { title: "Operations", items: [
   // { id: "antiscalant", label: "Antiscalant",     icon: FlaskConical, page: "antiscalant" },
    { id: "filtration",  label: "Filtration",      icon: Filter,       page: "filtration" },
    { id: "recovery",    label: "System Recovery", icon: RotateCcw,    page: "system recovery" },
  ]},
  { title: "Management", items: [
    { id: "maintenance", label: "Maintenance",     icon: Wrench,       page: "maintenance" },
    { id: "analytics",   label: "Analytics",       icon: BarChart3,    page: "analytics" },
    { id: "reports",     label: "Reports",         icon: FileText,     page: "reports" },
    { id: "user",        label: "User Management", icon: UserPenIcon,  page: "user-management" },
  ]},
  { title: "System", items: [
    { id: "alerts",      label: "Alerts",          icon: Bell,         page: "alerts", color: "#ffb938" },
    { id: "settings",    label: "Settings",        icon: Settings,     page: "settings" },
  ]},
  { title: "Configuration", items: [
    { id: "Tagmanager",  label: "Tag Manager",     icon: Tags,         page: "tag manager" },
    { id: "billing",     label: "Billing",         icon: Receipt,      page: "billing" },
  ]},
];

export function BottomNav({ activePage, onNavigate, alertCount = 0 }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { can: canAccess } = usePageAccess(); // follows the pages ticked in User Management
  const navigate = useNavigate();
  const tcfg = useTenantConfig();
  // The active client's dashboard only shows the pages they were set up with.
  const offered = (i) => !tcfg?.pages || !TENANT_PAGE[i.id] || tcfg.pages.includes(TENANT_PAGE[i.id]);
  const main = MAIN.filter(i => canAccess(i.page) && offered(i));
  const groups = MORE_GROUPS.map(g => ({ ...g, items: g.items.filter(i => canAccess(i.page) && offered(i)) })).filter(g => g.items.length);
  const moreActive = groups.some(g => g.items.some(i => i.id === activePage));
  const email = user?.email || "";
  const roleLine = [user?.isSuperAdmin ? 'superadmin' : user?.role, user?.clientName || user?.tenantName].filter(Boolean).join(" · ");
  const signOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) { setOpen(false); logout(); navigate("/"); }
  };

  const go = (id) => { setOpen(false); onNavigate(id); };

  const Tab = ({ icon: Icon, label, active, onClick, badge }) => (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 3, padding: "8px 2px", background: "transparent", border: "none", cursor: "pointer",
        color: active ? CYAN : "var(--muted-foreground)", position: "relative",
      }}
    >
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 26, borderRadius: 999,
        background: active ? "rgba(0,229,255,0.14)" : "transparent",
        boxShadow: active ? "0 0 14px rgba(0,229,255,0.45)" : "none",
      }}>
        <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
      </span>
      <span style={{ fontSize: 10, fontWeight: active ? 800 : 600, letterSpacing: "0.02em" }}>{label}</span>
      {badge > 0 && (
        <span style={{ position: "absolute", top: 4, right: "calc(50% - 22px)", background: "#ff3355", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 10, padding: "0 5px", lineHeight: 1.5 }}>{badge}</span>
      )}
    </button>
  );

  return (
    <>
      {open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 62, background: "var(--background)", zIndex: 190, overflowY: "auto" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 16px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: CYAN, boxShadow: "0 0 18px rgba(0,229,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00131a", fontWeight: 800, fontSize: 18 }}>
                {(email[0] || "?").toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{roleLine}</div>
              </div>
            </div>

            {groups.map(g => (
              <div key={g.title} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "var(--muted-foreground)", padding: "0 4px 6px", textTransform: "uppercase" }}>{g.title}</div>
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                  {g.items.map(({ id, label, icon: Icon, color }, idx) => {
                    const active = activePage === id;
                    const c = color || CYAN;
                    return (
                      <button key={id} onClick={() => go(id)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: active ? "rgba(0,229,255,0.08)" : "transparent", border: "none", borderTop: idx ? "1px solid var(--border)" : "none", cursor: "pointer", color: "var(--foreground)", textAlign: "left" }}>
                        <span style={{ width: 32, height: 32, borderRadius: 10, background: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center", color: c, flexShrink: 0 }}><Icon size={16} /></span>
                        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>{label}</span>
                        {id === "alerts" && alertCount > 0 && (
                          <span style={{ background: "#ff3355", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 7px" }}>{alertCount}</span>
                        )}
                        <ChevronRight size={16} color="var(--muted-foreground)" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              <button onClick={signOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", color: "var(--foreground)", textAlign: "left" }}>
                <span style={{ width: 32, height: 32, borderRadius: 10, background: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff3355" }}><LogOut size={16} /></span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>Sign out</span>
                <ChevronRight size={16} color="var(--muted-foreground)" />
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, height: 62, zIndex: 200, display: "flex",
          background: "var(--sidebar)", borderTop: "1px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {main.map(i => <Tab key={i.id} icon={i.icon} label={i.label} active={activePage === i.id && !open} onClick={() => go(i.id)} />)}
        <Tab icon={MoreHorizontal} label="More" active={open || moreActive} onClick={() => setOpen(o => !o)} badge={alertCount} />
      </nav>
    </>
  );
}