import { Bell, Search, Sun, Moon, User, Wifi, ChevronDown } from "lucide-react";

export function TopNav({ darkMode, onToggleDark, alertCount, title }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit", 
    hour12: false 
  });
  
  const dateStr = now.toLocaleDateString("en-US", { 
    weekday: "short", 
    day: "2-digit", 
    month: "short", 
    year: "numeric" 
  });

  return (
    <header
      className="flex items-center gap-3 px-4"
      style={{
        height: 56,
        background: "var(--card)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {/* Title */}
      <div className="flex-1">
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
          {title}
        </span>
      </div>

      {/* Plant status */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded"
        style={{ 
          background: "rgba(34,197,94,0.1)", 
          border: "1px solid rgba(34,197,94,0.2)" 
        }}
      >
        <Wifi size={11} style={{ color: "#22c55e" }} />
        <span style={{ 
          fontSize: 10, 
          color: "#22c55e", 
          fontFamily: "var(--font-mono)", 
          fontWeight: 500, 
          letterSpacing: "0.05em" 
        }}>
          PLANT ONLINE
        </span>
      </div>

      {/* Date/time */}
      <div style={{ textAlign: "right" }}>
        <div style={{ 
          fontSize: 11, 
          fontFamily: "var(--font-mono)", 
          color: "var(--muted-foreground)", 
          lineHeight: 1 
        }}>
          {dateStr}
        </div>
        <div style={{ 
          fontSize: 12, 
          fontFamily: "var(--font-mono)", 
          color: "var(--foreground)", 
          fontWeight: 600, 
          lineHeight: 1.3 
        }}>
          {timeStr}
        </div>
      </div>

      {/* Search */}
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors"
        style={{ 
          background: "var(--secondary)", 
          border: "1px solid var(--border)", 
          color: "var(--muted-foreground)" 
        }}
      >
        <Search size={13} />
        <span style={{ fontSize: 11 }}>Search...</span>
        <span style={{ 
          fontSize: 9, 
          marginLeft: 4, 
          color: "var(--muted-foreground)", 
          border: "1px solid var(--border)", 
          borderRadius: 3, 
          padding: "0 3px" 
        }}>
          ⌘K
        </span>
      </button>

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDark}
        className="flex items-center justify-center rounded transition-colors p-1.5"
        style={{ 
          background: "var(--secondary)", 
          border: "1px solid var(--border)", 
          color: "var(--muted-foreground)" 
        }}
      >
        {darkMode ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {/* Notifications */}
      <button
        className="flex items-center justify-center rounded p-1.5 relative"
        style={{ 
          background: "var(--secondary)", 
          border: "1px solid var(--border)", 
          color: "var(--muted-foreground)" 
        }}
      >
        <Bell size={14} />
        {alertCount > 0 && (
          <span
            className="absolute"
            style={{ 
              top: 2, 
              right: 2, 
              width: 7, 
              height: 7, 
              background: "#ef4444", 
              borderRadius: "50%" 
            }}
          />
        )}
      </button>

      {/* User */}
      <button
        className="flex items-center gap-2 px-2 py-1 rounded"
        style={{ 
          background: "var(--secondary)", 
          border: "1px solid var(--border)" 
        }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{ 
            width: 24, 
            height: 24, 
            background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)" 
          }}
        >
          <User size={12} style={{ color: "#020810" }} />
        </div>
        <div>
          <div style={{ 
            fontSize: 11, 
            fontWeight: 500, 
            color: "var(--foreground)", 
            lineHeight: 1 
          }}>
            J. Mwangi
          </div>
          <div style={{ 
            fontSize: 9, 
            color: "var(--muted-foreground)", 
            lineHeight: 1.2 
          }}>
            Ops Manager
          </div>
        </div>
        <ChevronDown size={11} style={{ color: "var(--muted-foreground)" }} />
      </button>
    </header>
  );
}