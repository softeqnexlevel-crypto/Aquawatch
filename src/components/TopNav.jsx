// components/TopNav.jsx - FULLY RESPONSIVE

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Bell, Search, Sun, Moon, User, ChevronDown, X, Settings, LogOut, UserCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// ── Brand Colors ──────────────────────────────────────────────────────────────
const BRAND = {
  blue: "#0077B6",
  blueLight: "#0ea5e9",
  blueDark: "#023E8A",
};

// ── Sample alerts ──────────────────────────────────────────────────────────────
const ALERTS = [
  { id: 1, type: "warning", icon: AlertTriangle, color: "#f97316", title: "Filter ΔP High", desc: "BH-003 differential pressure at 0.61 bar", time: "2 min ago", read: false },
  { id: 2, type: "error",   icon: AlertTriangle, color: "#ef4444", title: "Low Chemical Level", desc: "Antiscalant tank below 20% — refill required", time: "14 min ago", read: false },
  { id: 3, type: "info",    icon: Info,          color: "#0ea5e9", title: "Scheduled Maintenance", desc: "BH-005 inspection due tomorrow", time: "1 hr ago", read: true },
  { id: 4, type: "success", icon: CheckCircle,   color: "#22c55e", title: "Work Order Completed", desc: "WO-005 Dosing pump seal replacement done", time: "3 hrs ago", read: true },
];

// ── Search modal ───────────────────────────────────────────────────────────────
function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const PAGES = [
    "Dashboard Overview", "Reports Archive", "Analytics & Charts",
    "Maintenance Work Orders", "Maintenance Calendar", "System Settings",
    "Chemical Usage", "Production Summary", "Recovery Metrics",
  ];

  const results = query.trim()
    ? PAGES.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : PAGES;

  useEffect(() => {
    if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 60); }
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
        background: "rgba(0,0,0,0.5)", 
        zIndex: 200, 
        display: "flex", 
        alignItems: "flex-start", 
        justifyContent: "center", 
        paddingTop: 80,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ 
          background: "var(--card)", 
          border: "1px solid var(--border)", 
          borderRadius: 12, 
          width: "100%", 
          maxWidth: 520, 
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)", 
          overflow: "hidden" 
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Search size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, reports, settings…"
            style={{ 
              flex: 1, 
              background: "none", 
              border: "none", 
              outline: "none", 
              fontSize: 14, 
              color: "var(--foreground)", 
              fontFamily: "var(--font-sans)" 
            }}
          />
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2 }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ maxHeight: 320, overflowY: "auto", padding: "8px 0" }}>
          {results.length === 0
            ? <div style={{ padding: "20px 16px", fontSize: 13, color: "var(--muted-foreground)", textAlign: "center" }}>No results for "{query}"</div>
            : results.map((r, i) => (
              <button
                key={i}
                onClick={onClose}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 10, 
                  width: "100%", 
                  padding: "10px 16px", 
                  background: "none", 
                  border: "none", 
                  cursor: "pointer", 
                  textAlign: "left" 
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--muted)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <Search size={13} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--foreground)" }}>{r}</span>
              </button>
            ))
          }
        </div>

        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 12 }}>
          {[["↵", "select"], ["esc", "close"]].map(([key, label]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: "var(--muted-foreground)", border: "1px solid var(--border)", borderRadius: 3, padding: "0 4px", fontFamily: "var(--font-mono)" }}>{key}</span>
              <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Notifications dropdown ─────────────────────────────────────────────────
function NotifDropdown({ open, onClose, alerts, onMarkAllRead }) {
  const ref = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
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
        right: isMobile ? -60 : 0, 
        width: isMobile ? window.innerWidth - 32 : 320, 
        maxWidth: isMobile ? window.innerWidth - 32 : 320,
        background: "var(--card)", 
        border: "1px solid var(--border)", 
        borderRadius: 10, 
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)", 
        zIndex: 100, 
        overflow: "hidden" 
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Notifications</span>
        <button onClick={onMarkAllRead} style={{ fontSize: 10, color: BRAND.blue, background: "none", border: "none", cursor: "pointer" }}>Mark all read</button>
      </div>
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {alerts.map(a => (
          <div key={a.id} style={{ display: "flex", gap: 10, padding: "11px 14px", borderBottom: "1px solid var(--border)", background: a.read ? "transparent" : "rgba(14,165,233,0.04)" }}>
            <a.icon size={14} style={{ color: a.color, flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: a.read ? 400 : 600, color: "var(--foreground)" }}>{a.title}</span>
                {!a.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: BRAND.blue, flexShrink: 0, marginTop: 4 }} />}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.4 }}>{a.desc}</div>
              <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 3 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 14px", textAlign: "center" }}>
        <button onClick={onClose} style={{ fontSize: 11, color: BRAND.blue, background: "none", border: "none", cursor: "pointer" }}>View all alerts</button>
      </div>
    </div>
  );
}

// ── User dropdown ──────────────────────────────────────────────────────────────
function UserDropdown({ open, onClose, onLogout, onNavigateProfile, onNavigateSettings, user }) {
  const ref = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
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
        right: isMobile ? -40 : 0, 
        width: isMobile ? window.innerWidth - 32 : 200, 
        maxWidth: isMobile ? window.innerWidth - 32 : 200,
        background: "var(--card)", 
        border: "1px solid var(--border)", 
        borderRadius: 10, 
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)", 
        zIndex: 100, 
        overflow: "hidden", 
        padding: "6px 0" 
      }}
    >
      <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
        <div style={{ fontSize: isMobile ? 13 : 12, fontWeight: 600, color: "var(--foreground)" }}>{user?.name || "Guest"}</div>
        <div style={{ fontSize: isMobile ? 11 : 10, color: "var(--muted-foreground)" }}>{user?.email || ""}</div>
        <div style={{ 
          fontSize: isMobile ? 10 : 9, 
          marginTop: 3, 
          color: "#22c55e", 
          background: "rgba(34,197,94,0.1)", 
          display: "inline-block", 
          borderRadius: 3, 
          padding: "1px 6px", 
          fontWeight: 600 
        }}>
          {user?.title || ""}
        </div>
      </div>

      <button
        onClick={() => { onNavigateProfile(); onClose(); }}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          width: "100%", 
          padding: "9px 14px", 
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          fontSize: isMobile ? 13 : 12, 
          color: "var(--foreground)", 
          textAlign: "left" 
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--muted)"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        <UserCircle size={isMobile ? 15 : 13} /> My Profile
      </button>

      <button
        onClick={() => { onNavigateSettings(); onClose(); }}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          width: "100%", 
          padding: "9px 14px", 
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          fontSize: isMobile ? 13 : 12, 
          color: "var(--foreground)", 
          textAlign: "left" 
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--muted)"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        <Settings size={isMobile ? 15 : 13} /> Settings
      </button>

      <button
        onClick={onLogout}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          width: "100%", 
          padding: "9px 14px", 
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          fontSize: isMobile ? 13 : 12, 
          color: "#ef4444", 
          textAlign: "left" 
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--muted)"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        <LogOut size={isMobile ? 15 : 13} /> Sign Out
      </button>
    </div>
  );
}

// ── TopNav ─────────────────────────────────────────────────────────────────────
export function TopNav({ darkMode, onToggleDark, alertCount, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen]   = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [userOpen, setUserOpen]       = useState(false);
  const [alerts, setAlerts]           = useState(ALERTS);
  const [isMobile, setIsMobile]       = useState(false);

  // ── Mobile detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const unread = alerts.filter(a => !a.read).length;

  function markAllRead() { setAlerts(a => a.map(x => ({ ...x, read: true }))); }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
      navigate("/");
    }
  };

  const handleNavigateProfile  = () => navigate("/app/settings");
  const handleNavigateSettings = () => navigate("/app/settings");

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const now     = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("en-US",  { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  // ✅ Get user display name
  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.firstName 
      ? user.firstName
      : user?.email 
        ? user.email.split('@')[0] 
        : "Guest";
  
  // ✅ Get user role
  const displayRole = user?.role 
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1) 
    : "User";

  const userEmail = user?.email || "";
  const userInitial = displayName !== "Guest" ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <>
      <header
        style={{ 
          height: isMobile ? 52 : 56,
          background: "var(--card)", 
          borderBottom: "1px solid var(--border)", 
          display: "flex",
          alignItems: "center",
          padding: isMobile ? "0 8px" : "0 16px",
          gap: isMobile ? 4 : 8,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ 
            fontSize: isMobile ? 12 : 13, 
            fontWeight: 600, 
            color: "var(--foreground)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "block",
          }}>
            {title}
          </span>
        </div>

        {/* Welcome message - Hidden on small mobile */}
        {!isMobile && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 6, 
            padding: "4px 10px", 
            borderRadius: 6, 
            background: "rgba(14,165,233,0.08)", 
            border: "1px solid rgba(14,165,233,0.15)" 
          }}>
            <User size={11} style={{ color: BRAND.blueLight }} />
            <span style={{ 
              fontSize: 10, 
              color: BRAND.blueLight, 
              fontFamily: "var(--font-mono)", 
              fontWeight: 500, 
              letterSpacing: "0.05em" 
            }}>
              Welcome, {displayName}
            </span>
          </div>
        )}

        {/* Date/time - Hidden on small mobile */}
        {!isMobile && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", lineHeight: 1 }}>{dateStr}</div>
            <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600, lineHeight: 1.3 }}>{timeStr}</div>
          </div>
        )}

        {/* Search - Icon only on mobile */}
        <button
          onClick={() => setSearchOpen(true)}
          style={{ 
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 0 : 6,
            padding: isMobile ? "6px" : "6px 12px",
            borderRadius: 6,
            background: "var(--secondary)", 
            border: "1px solid var(--border)", 
            color: "var(--muted-foreground)", 
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Search size={isMobile ? 14 : 13} />
          {!isMobile && (
            <>
              <span style={{ fontSize: 11 }}>Search...</span>
              <span style={{ fontSize: 9, marginLeft: 4, color: "var(--muted-foreground)", border: "1px solid var(--border)", borderRadius: 3, padding: "0 3px" }}>⌘K</span>
            </>
          )}
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          style={{ 
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: isMobile ? "6px" : "6px",
            borderRadius: 6,
            background: "var(--secondary)", 
            border: "1px solid var(--border)", 
            color: "var(--muted-foreground)", 
            cursor: "pointer",
            width: isMobile ? 32 : 32,
            height: isMobile ? 32 : 32,
            flexShrink: 0,
          }}
        >
          {darkMode ? <Sun size={isMobile ? 14 : 14} /> : <Moon size={isMobile ? 14 : 14} />}
        </button>

        {/* Notifications */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }}
            style={{ 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isMobile ? "6px" : "6px",
              borderRadius: 6,
              background: notifOpen ? "var(--muted)" : "var(--secondary)", 
              border: "1px solid var(--border)", 
              color: "var(--muted-foreground)", 
              cursor: "pointer",
              width: isMobile ? 32 : 32,
              height: isMobile ? 32 : 32,
              position: "relative",
            }}
          >
            <Bell size={isMobile ? 14 : 14} />
            {unread > 0 && (
              <span style={{ 
                position: "absolute", 
                top: 4, 
                right: 4, 
                width: 7, 
                height: 7, 
                background: "#ef4444", 
                borderRadius: "50%" 
              }} />
            )}
          </button>
          <NotifDropdown
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            alerts={alerts}
            onMarkAllRead={markAllRead}
          />
        </div>

        {/* User - Simplified on mobile */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
            style={{ 
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 4 : 8,
              padding: isMobile ? "4px 6px" : "4px 10px",
              borderRadius: 6,
              background: userOpen ? "var(--muted)" : "var(--secondary)", 
              border: "1px solid var(--border)", 
              cursor: "pointer",
            }}
          >
            <div 
              style={{ 
                width: isMobile ? 26 : 28, 
                height: isMobile ? 26 : 28, 
                borderRadius: "50%", 
                background: `linear-gradient(135deg, ${BRAND.blue} 0%, ${BRAND.blueLight} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ 
                color: "#fff", 
                fontSize: isMobile ? 10 : 11, 
                fontWeight: 600 
              }}>
                {userInitial}
              </span>
            </div>
            
            {!isMobile && (
              <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--foreground)" }}>{displayName}</div>
                <div style={{ fontSize: 9, color: "var(--muted-foreground)" }}>{displayRole}</div>
              </div>
            )}
            
            <ChevronDown 
              size={isMobile ? 12 : 11} 
              style={{ 
                color: "var(--muted-foreground)", 
                transform: userOpen ? "rotate(180deg)" : "none", 
                transition: "transform 0.2s",
                flexShrink: 0,
              }} 
            />
          </button>

          <UserDropdown
            open={userOpen}
            onClose={() => setUserOpen(false)}
            onLogout={handleLogout}
            onNavigateProfile={handleNavigateProfile}
            onNavigateSettings={handleNavigateSettings}
            user={{ 
              ...user, 
              name: displayName, 
              title: displayRole,
              email: userEmail 
            }}
          />
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export default TopNav;