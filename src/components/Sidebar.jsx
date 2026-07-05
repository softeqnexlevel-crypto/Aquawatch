import { useState } from "react";
import {
  LayoutDashboard, Droplets, Activity, FlaskConical, Filter,
  RotateCcw, Wrench, BarChart3, FileText, Bell, Settings,
  ChevronLeft, ChevronRight, Zap,
  Tags,
  Receipt,
  UserPenIcon
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";


const navItems = [
  { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard, group: "Operations",    page: "dashboard" },
  { id: "boreholes",    label: "Tank level",    icon: Droplets,        group: "Operations",    page: "borehole" },
  { id: "production",   label: "Production",    icon: Activity,        group: "Operations",    page: "dashboard" },
  { id: "antiscalant",  label: "Antiscalant",   icon: FlaskConical,    group: "Operations",    page: "chemical" },
  { id: "filtration",   label: "Filtration",    icon: Filter,          group: "Operations",    page: "dashboard" },
  { id: "recovery",     label: "System Recovery",      icon: RotateCcw,       group: "Operations",    page: "dashboard" },
  { id: "maintenance",  label: "Maintenance",   icon: Wrench,          group: "Management",    page: "maintenance" },
  { id: "analytics",    label: "Analytics",     icon: BarChart3,       group: "Management",    page: "analytics" },
  { id: "reports",      label: "Reports",       icon: FileText,        group: "Management",    page: "reports" },
  { id: "alerts",       label: "Alerts",        icon: Bell,            group: "System",         page: "dashboard" },
  { id: "settings",     label: "Settings",      icon: Settings,        group: "System",         page: "settings" },
  { id: "Tagmanager",   label: "Tag Manager",   icon: Tags,            group: "Configuration", page: "settings" },
  { id: "billing",      label: "Billing",       icon: Receipt,         group: "Configuration", page: "settings" },
  { id: "user",         label: "User",          icon: UserPenIcon,     group: "Configuration", page: "user-management" },
];

export function Sidebar({ activePage, onNavigate, alertCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const { canAccess } = useAuth(); // 🔑 this was missing before

  const groups = ["Operations", "Management", "System", "Configuration"];

  // 🔑 This is the actual fix: filter out anything the current role can't access
  // BEFORE grouping/rendering, instead of rendering navItems unconditionally.
  const visibleItems = navItems.filter(item => canAccess(item.page));

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300"
      style={{
        width: collapsed ? 56 : 220,
        background: "var(--sidebar)",
        borderRight: "1px solid rgba(14,165,233,0.08)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-3 py-4 gap-2"
        style={{ borderBottom: "1px solid rgba(14,165,233,0.08)", minHeight: 56 }}
      >
        <div
          className="flex items-center justify-center rounded"
          style={{ width: 30, height: 30, background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)" }}
        >
          <Zap size={16} color="#020810" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "#0ea5e9", letterSpacing: "0.08em", lineHeight: 1 }}>
              AQUAOPS
            </div>
            <div style={{ fontSize: 9, color: "var(--muted-foreground)", letterSpacing: "0.12em", lineHeight: 1.2, marginTop: 1 }}>
              WATER MANAGEMENT
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {groups.map((group) => {
          // 🔑 Now filtering from visibleItems, not the raw navItems list
          const items = visibleItems.filter((i) => i.group === group);
          if (items.length === 0) return null; // hide empty group headers entirely

          return (
            <div key={group} className="mb-1">
              {!collapsed && (
                <div style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "var(--muted-foreground)",
                  letterSpacing: "0.12em",
                  padding: "8px 12px 4px",
                  textTransform: "uppercase"
                }}>
                  {group}
                </div>
              )}
              {collapsed && <div style={{ height: 4 }} />}

              {items.map((item) => {
                const active = activePage === item.id;
                const Icon = item.icon;
                const isAlerts = item.id === "alerts";

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="w-full flex items-center gap-2.5 transition-all duration-150 relative"
                    style={{
                      padding: collapsed ? "8px 0" : "7px 12px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      background: active ? "rgba(14,165,233,0.1)" : "transparent",
                      borderLeft: active ? "2px solid #0ea5e9" : "2px solid transparent",
                      color: active ? "#0ea5e9" : "var(--sidebar-foreground)",
                      opacity: active ? 1 : 0.7,
                    }}
                  >
                    <Icon size={15} strokeWidth={1.8} />
                    {!collapsed && (
                      <span style={{ fontSize: 12.5, fontWeight: active ? 500 : 400 }}>
                        {item.label}
                      </span>
                    )}
                    {isAlerts && alertCount > 0 && (
                      <span
                        className="absolute"
                        style={{
                          right: collapsed ? 6 : 10,
                          top: collapsed ? 4 : "50%",
                          transform: collapsed ? "none" : "translateY(-50%)",
                          background: "#ef4444",
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 700,
                          borderRadius: 10,
                          padding: "1px 5px",
                          lineHeight: 1.4,
                        }}
                      >
                        {alertCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 transition-colors"
        style={{ borderTop: "1px solid rgba(14,165,233,0.08)", color: "var(--muted-foreground)" }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        {!collapsed && <span style={{ fontSize: 11, marginLeft: 6 }}>Collapse</span>}
      </button>
    </aside>
  );
}