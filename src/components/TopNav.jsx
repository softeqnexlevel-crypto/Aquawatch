import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router"; // 🔑 added
import { Bell, Search, Sun, Moon, User, Wifi, ChevronDown, X, Settings, LogOut, UserCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

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
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, width: "100%", maxWidth: 520, boxShadow: "0 24px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Search size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, reports, settings…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
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
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
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
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div ref={ref} style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 320, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 100, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Notifications</span>
        <button onClick={onMarkAllRead} style={{ fontSize: 10, color: "#0ea5e9", background: "none", border: "none", cursor: "pointer" }}>Mark all read</button>
      </div>
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {alerts.map(a => (
          <div key={a.id} style={{ display: "flex", gap: 10, padding: "11px 14px", borderBottom: "1px solid var(--border)", background: a.read ? "transparent" : "rgba(14,165,233,0.04)" }}>
            <a.icon size={14} style={{ color: a.color, flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: a.read ? 400 : 600, color: "var(--foreground)" }}>{a.title}</span>
                {!a.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", flexShrink: 0, marginTop: 4 }} />}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.4 }}>{a.desc}</div>
              <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 3 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 14px", textAlign: "center" }}>
        <button onClick={onClose} style={{ fontSize: 11, color: "#0ea5e9", background: "none", border: "none", cursor: "pointer" }}>View all alerts</button>
      </div>
    </div>
  );
}

// ── User dropdown ──────────────────────────────────────────────────────────────
function UserDropdown({ open, onClose, onLogout, onNavigateProfile, onNavigateSettings, user }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={ref} style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 200, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 100, overflow: "hidden", padding: "6px 0" }}>
      <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{user?.name || "Guest"}</div>
        <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{user?.email || ""}</div>
        <div style={{ fontSize: 9, marginTop: 3, color: "#22c55e", background: "rgba(34,197,94,0.1)", display: "inline-block", borderRadius: 3, padding: "1px 6px", fontWeight: 600 }}>{user?.title || ""}</div>
      </div>

      {/* 🔑 Fixed — added onClick + onClose so the dropdown closes after navigating */}
      <button
        onClick={() => { onNavigateProfile(); onClose(); }}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--foreground)", textAlign: "left" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--muted)"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        <UserCircle size={13} /> My Profile
      </button>

      {/* 🔑 Fixed — same here */}
      <button
        onClick={() => { onNavigateSettings(); onClose(); }}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--foreground)", textAlign: "left" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--muted)"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        <Settings size={13} /> Settings
      </button>

      <button
        onClick={onLogout}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444", textAlign: "left" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--muted)"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        <LogOut size={13} /> Sign Out
      </button>
    </div>
  );
}

// ── TopNav ─────────────────────────────────────────────────────────────────────
export function TopNav({ darkMode, onToggleDark, alertCount, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // 🔑 added

  const [searchOpen, setSearchOpen]   = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [userOpen, setUserOpen]       = useState(false);
  const [alerts, setAlerts]           = useState(ALERTS);
  const notifRef = useRef(null);
  const userRef  = useRef(null);

  const unread = alerts.filter(a => !a.read).length;

  function markAllRead() { setAlerts(a => a.map(x => ({ ...x, read: true }))); }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
      navigate("/"); // 🔑 fixed — was window.location.href, which wiped auth state on reload
    }
  };

  // 🔑 Added — both go to the same Settings page, per your requirements
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

  return (
    <>
      <header
        className="flex items-center gap-3 px-4"
        style={{ height: 56, background: "var(--card)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}
      >
        {/* Title */}
        <div className="flex-1">
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{title}</span>
        </div>

        {/* Plant status */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <Wifi size={11} style={{ color: "#22c55e" }} />
          <span style={{ fontSize: 10, color: "#22c55e", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.05em" }}>PLANT ONLINE</span>
        </div>

        {/* Date/time */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", lineHeight: 1 }}>{dateStr}</div>
          <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--foreground)", fontWeight: 600, lineHeight: 1.3 }}>{timeStr}</div>
        </div>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", cursor: "pointer" }}
        >
          <Search size={13} />
          <span style={{ fontSize: 11 }}>Search...</span>
          <span style={{ fontSize: 9, marginLeft: 4, color: "var(--muted-foreground)", border: "1px solid var(--border)", borderRadius: 3, padding: "0 3px" }}>⌘K</span>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="flex items-center justify-center rounded transition-colors p-1.5"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", cursor: "pointer" }}
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }}
            className="flex items-center justify-center rounded p-1.5 relative"
            style={{ background: notifOpen ? "var(--muted)" : "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", cursor: "pointer" }}
          >
            <Bell size={14} />
            {unread > 0 && (
              <span className="absolute" style={{ top: 2, right: 2, width: 7, height: 7, background: "#ef4444", borderRadius: "50%" }} />
            )}
          </button>
          <NotifDropdown
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            alerts={alerts}
            onMarkAllRead={markAllRead}
          />
        </div>

        {/* User */}
        <div ref={userRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1 rounded"
            style={{ background: userOpen ? "var(--muted)" : "var(--secondary)", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            <div className="flex items-center justify-center rounded-full" style={{ width: 24, height: 24, background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)" }}>
              <User size={12} style={{ color: "#020810" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--foreground)", lineHeight: 1 }}>{user?.name || "Guest"}</div>
              <div style={{ fontSize: 9, color: "var(--muted-foreground)", lineHeight: 1.2 }}>{user?.title || "User"}</div>
            </div>
            <ChevronDown size={11} style={{ color: "var(--muted-foreground)", transform: userOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          <UserDropdown
            open={userOpen}
            onClose={() => setUserOpen(false)}
            onLogout={handleLogout}
            onNavigateProfile={handleNavigateProfile}
            onNavigateSettings={handleNavigateSettings}
            user={user}
          />
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}