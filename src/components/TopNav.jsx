// components/TopNav.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Bell, Search, Sun, Moon, User, ChevronDown, X, Settings, LogOut, UserCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// ── Sample Alerts ─────────────────────────────────────────────────────────────
const ALERTS = [
  { id: 1, type: "warning", icon: AlertTriangle, color: "#f97316", title: "Filter ΔP High", desc: "BH-003 differential pressure at 0.61 bar", time: "2 min ago", read: false },
  { id: 2, type: "error",   icon: AlertTriangle, color: "#ef4444", title: "Low Chemical Level", desc: "Antiscalant tank below 20% — refill required", time: "14 min ago", read: false },
  { id: 3, type: "info",    icon: Info,          color: "#0ea5e9", title: "Scheduled Maintenance", desc: "BH-005 inspection due tomorrow", time: "1 hr ago", read: true },
  { id: 4, type: "success", icon: CheckCircle,   color: "#22c55e", title: "Work Order Completed", desc: "WO-005 Dosing pump seal replacement done", time: "3 hrs ago", read: true },
];

// ── Search Modal ─────────────────────────────────────────────────────────────
function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const PAGES = [
    "Dashboard Overview", "Reports Archive", "Analytics & Charts",
    "Maintenance Work Orders", "Maintenance Calendar", "System Settings",
    "Chemical Usage", "Production Summary", "Recovery Metrics", "Tag Manager",
  ];

  const results = query.trim()
    ? PAGES.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : PAGES;

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "80px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          width: "100%",
          maxWidth: 520,
          margin: "0 12px",
          boxShadow: "0 25px 70px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          <Search size={18} style={{ color: "var(--muted-foreground)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, reports, tags..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 15,
              color: "var(--foreground)",
            }}
          />
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted-foreground)" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ maxHeight: 340, overflowY: "auto", padding: "6px 0" }}>
          {results.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--muted-foreground)" }}>
              No results found for "{query}"
            </div>
          ) : (
            results.map((page, i) => (
              <button
                key={i}
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "12px 18px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 14,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <Search size={15} style={{ color: "var(--muted-foreground)" }} />
                {page}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Notifications Dropdown ───────────────────────────────────────────────────
function NotifDropdown({ open, onClose, alerts, onMarkAllRead }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: 340,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
        zIndex: 150,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600 }}>Notifications</span>
        <button onClick={onMarkAllRead} style={{ fontSize: 12, color: "#0ea5e9", background: "none", border: "none" }}>
          Mark all read
        </button>
      </div>

      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              background: alert.read ? "transparent" : "rgba(14,165,233,0.05)",
              display: "flex",
              gap: 12,
            }}
          >
            <alert.icon size={18} style={{ color: alert.color, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: alert.read ? 400 : 600, marginBottom: 3 }}>{alert.title}</div>
              <div style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.4 }}>{alert.desc}</div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 6 }}>{alert.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── User Dropdown ─────────────────────────────────────────────────────────────
function UserDropdown({ open, onClose, onLogout, onNavigateProfile, onNavigateSettings, user }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: 210,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
        zIndex: 150,
        padding: "6px 0",
      }}
    >
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 600 }}>{user?.name || "Guest"}</div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{user?.email}</div>
      </div>

      <button onClick={() => { onNavigateProfile(); onClose(); }} style={{ width: "100%", textAlign: "left", padding: "10px 16px", border: "none", background: "none", display: "flex", alignItems: "center", gap: 10 }}>
        <UserCircle size={16} /> My Profile
      </button>
      <button onClick={() => { onNavigateSettings(); onClose(); }} style={{ width: "100%", textAlign: "left", padding: "10px 16px", border: "none", background: "none", display: "flex", alignItems: "center", gap: 10 }}>
        <Settings size={16} /> Settings
      </button>
      <button onClick={onLogout} style={{ width: "100%", textAlign: "left", padding: "10px 16px", border: "none", background: "none", display: "flex", alignItems: "center", gap: 10, color: "#ef4444" }}>
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}

// ── Main TopNav Component ─────────────────────────────────────────────────────
export function TopNav({ darkMode, onToggleDark, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [alerts, setAlerts] = useState(ALERTS);

  const unread = alerts.filter((a) => !a.read).length;

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
      navigate("/");
    }
  };

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email?.split("@")[0] || "Guest";

  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User";

  // Keyboard Shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header
        style={{
          height: 56,
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 10,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{title}</div>

        {/* Right Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              padding: "8px",
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--muted-foreground)",
            }}
          >
            <Search size={18} />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDark}
            style={{
              padding: "8px",
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--muted-foreground)",
            }}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setUserOpen(false);
              }}
              style={{
                padding: "8px",
                background: notifOpen ? "var(--muted)" : "var(--secondary)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                position: "relative",
              }}
            >
              <Bell size={18} />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    right: 3,
                    width: 8,
                    height: 8,
                    background: "#ef4444",
                    borderRadius: "50%",
                  }}
                />
              )}
            </button>
            <NotifDropdown
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              alerts={alerts}
              onMarkAllRead={markAllRead}
            />
          </div>

          {/* User Menu */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                setUserOpen(!userOpen);
                setNotifOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 8px 4px 4px",
                background: userOpen ? "var(--muted)" : "var(--secondary)",
                border: "1px solid var(--border)",
                borderRadius: 999,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User size={16} style={{ color: "#fff" }} />
              </div>
              <div style={{ display: "none" }} className="md:block">
                <div style={{ fontSize: 13, fontWeight: 500 }}>{displayName}</div>
                <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{displayRole}</div>
              </div>
              <ChevronDown size={14} />
            </button>

            <UserDropdown
              open={userOpen}
              onClose={() => setUserOpen(false)}
              onLogout={handleLogout}
              onNavigateProfile={() => navigate("/app/settings")}
              onNavigateSettings={() => navigate("/app/settings")}
              user={{ name: displayName, email: user?.email, role: displayRole }}
            />
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}