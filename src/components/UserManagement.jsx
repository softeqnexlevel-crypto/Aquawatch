// frontend/src/components/UserManagement.jsx - FULLY MOBILE RESPONSIVE

import { useState, useEffect } from "react";
import { User, Plus, Trash2, Edit2, CheckCircle, X, Shield, Eye, EyeOff, Lock, RefreshCw, Dices, Pause, Play } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// ==================== ROLE PERMISSIONS ====================
const ROLE_PERMISSIONS = {
  admin: [
   "dashboard", "mimic", "production", "antiscalant", "system recovery", "alerts", "tag manager", "billing", "analytics", "reports", "maintenance","filtration", "tank level", "settings", "user-management", 
  ],
  operator: [
    "dashboard", "mimic", "maintenance", "reports"
  ],
  client: [
    "dashboard", "analytics"
  ],
};

// Same list and order as the client's SCADA. Tag Manager / Billing / Settings stay
// admin-only and are not shown here (any already saved on a user are preserved).
const PAGE_OPTIONS = [
  ['dashboard','Dashboard'],['mimic','Mimic'],['tank level','Tanks'],['production','Production'],['antiscalant','Antiscalant'],
  ['filtration','Filtration'],['system recovery','System Recovery'],['maintenance','Maintenance'],['analytics','Analytics'],
  ['reports','Reports'],['alerts','Alerts'],
];

const   ALL_PAGES = [
  "dashboard", "mimic", "production", "antiscalant", "system recovery", "alerts", "tag manager", "billing", "analytics", "reports", "maintenance","filtration", "tank level", "settings", "user-management",
];

const ROLE_COLORS = {
  admin:    { bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9"  },
  operator: { bg: "rgba(34,197,94,0.1)",   color: "#22c55e"  },
  client:   { bg: "rgba(167,139,250,0.1)", color: "#a78bfa"  },
};

const DEFAULT_PASSWORD = "temp123456";
const EMPTY = {
  firstName: "", lastName: "", email: "", password: DEFAULT_PASSWORD,
  role: "operator", isActive: true, permissions: ROLE_PERMISSIONS.operator,
};

// ==================== API SERVICE ====================
const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}`;

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API call failed');
  }

  return response.json();
}

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// ==================== PERMISSIONS MATRIX ====================
function PermissionsMatrix({ isMobile }) {
  return (
    <div className="rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 400 : 'auto' }}>
          <thead>
            <tr style={{ background: "var(--muted)" }}>
              <th style={{ padding: isMobile ? "6px 8px" : "8px 12px", textAlign: "left", fontSize: isMobile ? 8 : 9, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--border)" }}>Page</th>
              {["admin", "operator", "client"].map(r => (
                <th key={r} style={{ padding: isMobile ? "6px 8px" : "8px 12px", textAlign: "center", fontSize: isMobile ? 8 : 9, fontWeight: 600, color: ROLE_COLORS[r].color, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--border)" }}>
                  {isMobile ? r.charAt(0).toUpperCase() : r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PAGES.map((page, i) => (
              <tr key={page} style={{ background: i % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                <td style={{ padding: isMobile ? "6px 8px" : "8px 12px", fontSize: isMobile ? 9 : 11, fontFamily: "var(--font-mono)", color: "var(--foreground)", borderBottom: "1px solid var(--border)", textTransform: "capitalize" }}>
                  {isMobile ? page.substring(0, 4) : page}
                </td>
                {["admin", "operator", "client"].map(role => (
                  <td key={role} style={{ padding: isMobile ? "6px 8px" : "8px 12px", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                    {ROLE_PERMISSIONS[role]?.includes(page)
                      ? <CheckCircle size={isMobile ? 10 : 13} style={{ color: ROLE_COLORS[role].color, margin: "0 auto" }} />
                      : <X size={isMobile ? 10 : 13} style={{ color: "var(--muted-foreground)", opacity: 0.3, margin: "0 auto" }} />
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== USER DRAWER ====================
function UserDrawer({ open, onClose, onSave, initial, isEdit = false }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [showPassword, setShowPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (initial) {
      setForm({
        ...initial,
        // If this user has no custom permissions saved yet, seed the
        // checkboxes from their role's defaults so the UI isn't empty —
        // but keep whatever they actually have stored if present.
        permissions: (initial.permissions && initial.permissions.length > 0)
          ? initial.permissions
          : (ROLE_PERMISSIONS[initial.role] || []),
      });
    } else {
      setForm({ ...EMPTY, password: DEFAULT_PASSWORD });
    }
    setError('');
  }, [initial, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Changing role resets permissions to that role's defaults — admin can
  // still fine-tune individual pages afterward via the checkboxes below.
  const setRole = (role) => {
    setForm(f => ({ ...f, role, permissions: ROLE_PERMISSIONS[role] || [] }));
  };

  const togglePage = (page) => {
    setForm(f => {
      const has = f.permissions?.includes(page);
      const next = has
        ? f.permissions.filter(p => p !== page)
        : [...(f.permissions || []), page];
      return { ...f, permissions: next };
    });
  };

  async function handleSave() {
    if (!form.firstName || !form.email) {
      setError('Name and Email are required');
      return;
    }

    if (!isEdit && (!form.password || form.password.length < 8)) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = isEdit 
        ? await apiCall(`/auth/users/${form.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              firstName: form.firstName,
              lastName: form.lastName || '',
              role: form.role,
              isActive: form.isActive,
              permissions: form.permissions,
            })
          })
        : await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              firstName: form.firstName,
              lastName: form.lastName || '',
              email: form.email,
              password: form.password,
              role: form.role,
              permissions: form.permissions,
            })
          });

      onSave(data.user || data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    background: "var(--secondary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: isMobile ? "6px 8px" : "8px 10px",
    fontSize: isMobile ? 11 : 12,
    color: "var(--foreground)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "var(--font-sans)"
  };

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />}
      <div style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100%",
        width: isMobile ? "100%" : 380,
        maxWidth: "100%",
        background: "var(--card)",
        borderLeft: "1px solid var(--border)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s ease",
        boxShadow: open ? "-8px 0 32px rgba(0,0,0,0.15)" : "none"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: "var(--foreground)" }}>
            {isEdit ? "Edit User" : "New User"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
            <X size={isMobile ? 14 : 15} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 20, display: "flex", flexDirection: "column", gap: isMobile ? 10 : 14 }}>
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 4,
              padding: "8px 12px",
              color: "#ef4444",
              fontSize: isMobile ? 11 : 12
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: isMobile ? 9 : 10, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>First Name</label>
            <input type="text" value={form.firstName || ''} onChange={e => set("firstName", e.target.value)} placeholder="e.g. Grace" style={inp} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: isMobile ? 9 : 10, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Last Name</label>
            <input type="text" value={form.lastName || ''} onChange={e => set("lastName", e.target.value)} placeholder="e.g. Wanjiku" style={inp} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: isMobile ? 9 : 10, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Email</label>
            <input type="email" value={form.email || ''} onChange={e => set("email", e.target.value)} placeholder="grace@utility.co.ke" style={inp} disabled={isEdit} />
          </div>

          {!isEdit && (
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: isMobile ? 9 : 10, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
                <span>Password</span>
                <button
                  type="button"
                  onClick={() => set("password", generatePassword())}
                  style={{
                    display: "flex", alignItems: "center", gap: 3,
                    background: "none", border: "none", cursor: "pointer",
                    color: "#0ea5e9", fontSize: isMobile ? 9 : 10, fontWeight: 600, textTransform: "none", letterSpacing: 0
                  }}
                >
                  <Dices size={isMobile ? 10 : 11} /> Generate
                </button>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  placeholder="Set a password"
                  style={{ ...inp, paddingRight: 32 }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)",
                    display: "flex", alignItems: "center"
                  }}
                >
                  {showPassword ? <EyeOff size={isMobile ? 12 : 14} /> : <Eye size={isMobile ? 12 : 14} />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: isMobile ? 9 : 10, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Role</label>
            <select value={form.role || 'operator'} onChange={e => setRole(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="client">Client</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: isMobile ? 9 : 10, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Status</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Active", v: true },
                { label: "Paused", v: false }
              ].map(s => (
                <button
                  key={s.label}
                  onClick={() => set("isActive", s.v)}
                  style={{
                    flex: 1,
                    padding: isMobile ? "6px 0" : "8px 0",
                    borderRadius: 6,
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: `1.5px solid ${form.isActive === s.v ? (s.v ? "#22c55e" : "#ef4444") : "var(--border)"}`,
                    background: form.isActive === s.v ? (s.v ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)") : "transparent",
                    color: form.isActive === s.v ? (s.v ? "#22c55e" : "#ef4444") : "var(--muted-foreground)"
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: isMobile ? 9 : 10, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Pages this user can access
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? "6px 12px" : "8px 16px" }}>
              {ALL_PAGES.map(page => {
                const has = form.permissions?.includes(page);
                return (
                  <label
                    key={page}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: isMobile ? 10 : 12, textTransform: "capitalize", color: has ? "var(--foreground)" : "var(--muted-foreground)" }}
                  >
                    <input
                      type="checkbox"
                      checked={!!has}
                      onChange={() => togglePage(page)}
                      style={{ width: 15, height: 15, accentColor: "#c6ff00", cursor: "pointer" }}
                    />
                    {page}
                  </label>
                );
              })}
            </div>
            <div style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", marginTop: 6 }}>
              Defaults come from the selected role — click to customize per-user.
            </div>
          </div>
        </div>
        <div style={{ padding: isMobile ? "12px 16px" : "16px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: isMobile ? "8px 0" : "9px 0", borderRadius: 6, border: "1px solid var(--border)", background: "var(--muted)", fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ flex: 2, padding: isMobile ? "8px 0" : "9px 0", borderRadius: 6, border: "none", background: loading ? "var(--muted)" : "#c6ff00", fontSize: isMobile ? 10 : 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: loading ? "var(--muted-foreground)" : "#000", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? 'Saving...' : 'Save User'}
          </button>
        </div>
      </div>
    </>
  );
}

// ==================== USER MANAGEMENT PAGE ====================
// ==================== SHARED STYLES ====================
const fld = {
  background: "var(--input-background, #050a12)", border: "1px solid var(--border)", borderRadius: 12,
  padding: "10px 14px", fontSize: 14, color: "var(--foreground)", outline: "none", boxSizing: "border-box",
};
const pill = (bg, color, extra = {}) => ({
  background: bg, color, border: "1px solid transparent", borderRadius: 999, padding: "10px 20px", cursor: "pointer",
  fontWeight: 800, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", ...extra,
});

function PagePicker({ value, onToggle, disabled }) {
  return (
    <>
      <div style={{ fontSize: 12.5, color: "var(--muted-foreground)", margin: "10px 0 6px" }}>Pages</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px" }}>
        {PAGE_OPTIONS.map(([key, label]) => (
          <label key={key} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--foreground)", cursor: disabled ? "default" : "pointer" }}>
            <input type="checkbox" disabled={disabled} checked={value.includes(key)} onChange={() => onToggle(key)} style={{ width: 16, height: 16, colorScheme: "dark" }} />
            {label}
          </label>
        ))}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--muted-foreground)", margin: "12px 0 6px" }}>Systems</div>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--foreground)" }}>
        <input type="checkbox" checked readOnly style={{ width: 16, height: 16, colorScheme: "dark" }} /> Reverse Osmosis
      </label>
    </>
  );
}

function UserRow({ u, me, isAdmin, isMobile, busy, onChanged, onDelete, onPause }) {
  const [email, setEmail] = useState(u.email || '');
  const [role, setRole] = useState(u.isSuperAdmin ? 'superadmin' : u.role);
  const [alerts, setAlerts] = useState(u.emailAlerts !== false);
  const [perms, setPerms] = useState((u.permissions && u.permissions.length) ? u.permissions : (ROLE_PERMISSIONS[u.role] || []));
  const [pw, setPw] = useState('');
  const [saving, setSaving] = useState(false);
  const isMe = u.id === me?.id;
  const iAmSuper = !!me?.isSuperAdmin;
  // normal admins cannot touch other admins / super admins
  const locked = !isMe && u.role === 'admin' && !iAmSuper;
  const paused = u.isActive === false;
  const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email.split('@')[0];

  const changeRole = (r) => { setRole(r); setPerms(ROLE_PERMISSIONS[r] || []); };
  const toggle = (k) => setPerms(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);

  async function save() {
    if (pw && pw.length < 8) { window.alert('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await apiCall(`/auth/users/${u.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          email, role: role === 'superadmin' ? 'admin' : role, emailAlerts: alerts,
          permissions: (role === 'admin' || role === 'superadmin') ? ROLE_PERMISSIONS.admin : perms,
          ...(iAmSuper && (role === 'superadmin' || role === 'admin') ? { superAdmin: role === 'superadmin' } : {}),
          ...(pw ? { password: pw } : {}),
        }),
      });
      setPw('');
      window.alert('Saved');
      await onChanged();
    } catch (e) { window.alert('Failed to save: ' + e.message); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 16, padding: isMobile ? 12 : 14, marginBottom: 12, opacity: paused ? 0.6 : 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto 1fr auto", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--foreground)" }}>
          {name}{paused && <span style={{ marginLeft: 8, fontSize: 10, color: "#ffb938", letterSpacing: "0.1em" }}>PAUSED</span>}
        </div>
        <input value={email} disabled={!isAdmin || locked} onChange={e => setEmail(e.target.value)} style={{ ...fld, minWidth: isMobile ? 0 : 230 }} />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, justifySelf: "center", fontSize: 15, color: "var(--muted-foreground)" }}>
          <input type="checkbox" disabled={!isAdmin} checked={alerts} onChange={e => setAlerts(e.target.checked)} style={{ width: 16, height: 16, colorScheme: "dark" }} /> alerts
        </label>
        <select value={role} disabled={!isAdmin || isMe || locked} onChange={e => changeRole(e.target.value)} style={{ ...fld, minWidth: 150 }}>
          {iAmSuper && <option value="superadmin">superadmin</option>}
          <option value="admin" disabled={!iAmSuper && role !== 'admin'}>{iAmSuper ? 'admin' : 'admin'}</option>
          <option value="operator">operator</option>
          <option value="client">client</option>
        </select>
      </div>

      {(role === 'admin' || role === 'superadmin') ? (
        <div style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "10px 0 8px" }}>
          {role === 'superadmin' ? 'Super admins see every page and system, and are the only ones who can manage admin accounts.' : 'Admins see every page and system enabled for the tenant.'}
        </div>
      ) : (
        <PagePicker value={perms} onToggle={toggle} disabled={!isAdmin || locked} />
      )}

      {isAdmin && !locked && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <input type="text" placeholder="New password (min 8)" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" style={{ ...fld, width: 225 }} />
          <button type="button" onClick={() => setPw(generatePassword())} style={pill("var(--secondary)", "var(--foreground)", { border: "1px solid var(--border)" })}>Gen</button>
          <div style={{ flex: 1 }} />
          {!isMe && (
            <button type="button" disabled={busy} onClick={onPause} style={pill("var(--secondary)", "var(--foreground)", { border: "1px solid var(--border)" })}>{paused ? 'Resume' : 'Pause'}</button>
          )}
          <button type="button" disabled={saving} onClick={save} style={pill("#c6ff00", "#000")}>{saving ? 'Saving…' : 'Save'}</button>
          {!isMe && <button type="button" onClick={onDelete} style={pill("#ff3355", "#fff")}>Delete</button>}
        </div>
      )}
    </div>
  );
}

function AddLogin({ isMobile, onCreated, iAmSuper }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [role, setRole] = useState('client');
  const [perms, setPerms] = useState(ROLE_PERMISSIONS.client);
  const [busy, setBusy] = useState(false);

  const changeRole = (r) => { setRole(r); setPerms(ROLE_PERMISSIONS[r] || []); };
  const toggle = (k) => setPerms(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);

  async function create() {
    if (!email || !email.includes('@')) { window.alert('Enter a valid email'); return; }
    if (pw.length < 8) { window.alert('Password must be at least 8 characters'); return; }
    setBusy(true);
    try {
      await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ firstName: email.split('@')[0], lastName: '', email, password: pw, role: role === 'superadmin' ? 'admin' : role, superAdmin: role === 'superadmin', permissions: (role === 'admin' || role === 'superadmin') ? ROLE_PERMISSIONS.admin : perms }),
      });
      setEmail(''); setPw('');
      window.alert('Login created');
      await onCreated();
    } catch (e) { window.alert('Failed to create login: ' + e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 16, padding: isMobile ? 12 : 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input placeholder="email (used to log in)" value={email} onChange={e => setEmail(e.target.value)} style={{ ...fld, flex: 1, minWidth: 200 }} />
        <input type="text" placeholder="password (min 8)" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" style={{ ...fld, width: 225 }} />
        <button type="button" onClick={() => setPw(generatePassword())} style={pill("var(--secondary)", "var(--foreground)", { border: "1px solid var(--border)" })}>Gen</button>
        <select value={role} onChange={e => changeRole(e.target.value)} style={{ ...fld, minWidth: 150 }}>
          {iAmSuper && <option value="superadmin">superadmin</option>}
          {iAmSuper && <option value="admin">admin</option>}
          <option value="operator">operator</option>
          <option value="client">client</option>
        </select>
      </div>
      {(role === 'admin' || role === 'superadmin')
        ? <div style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "10px 0 8px" }}>{role === 'superadmin' ? 'Super admins see every page and system, and can manage admin accounts.' : 'Admins see every page and system enabled for the tenant.'}</div>
        : <PagePicker value={perms} onToggle={toggle} />}
      <button type="button" disabled={busy} onClick={create} style={pill("#c6ff00", "#000", { marginTop: 14 })}>{busy ? 'Creating…' : 'Create login'}</button>
    </div>
  );
}

export function UserManagement() {
  const { user: me } = useAuth();
  const isAdmin = me?.role === "admin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("users");
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ==================== FETCH USERS ====================
  const fetchUsers = async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError('');

    try {
      const data = await apiCall('/auth/users');
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // ==================== HANDLE SAVE ====================
  async function handleSave(form) {
    if (!isAdmin) return;
    try {
      await fetchUsers();
    } catch (err) {
      console.error('Failed to refresh users:', err);
    }
  }

  // ==================== HANDLE DELETE ====================
  async function handleDelete(id) {
    if (!isAdmin || id === me?.id) return;

    if (!window.confirm('Delete this user permanently?')) return;

    try {
      await apiCall(`/auth/users/${id}`, {
        method: 'DELETE'
      });
      await fetchUsers();
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  }

  // ==================== HANDLE PAUSE / RESUME ====================
  // Pausing blocks login and cuts off the user's current session; nothing is deleted.
  const [busyId, setBusyId] = useState(null);

  async function handlePauseToggle(user) {
    if (!isAdmin || !user || user.id === me?.id) return;
    const pausing = user.isActive !== false;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    const ok = window.confirm(
      pausing
        ? `Pause ${name}?\n\nThey will be signed out and cannot access the site (or receive alert emails) until you resume them.`
        : `Resume ${name}?\n\nThey will be able to sign in again.`
    );
    if (!ok) return;

    setBusyId(user.id);
    try {
      await apiCall(`/auth/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !pausing }),
      });
      await fetchUsers();
    } catch (err) {
      alert(`Failed to ${pausing ? 'pause' : 'resume'} user: ` + err.message);
    } finally {
      setBusyId(null);
    }
  }

  // ==================== OPEN EDIT ====================
  function openEdit(user) {
    if (!isAdmin) return;
    setEditing({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive !== false,
      permissions: user.permissions || [],
    });
    setDrawerOpen(true);
  }

  // ==================== OPEN NEW ====================
  function openNew() {
    if (!isAdmin) return;
    setEditing(null);
    setDrawerOpen(true);
  }

  // ==================== RENDER ====================
  return (
    <div className="flex flex-col gap-3 p-2 sm:p-4 overflow-auto h-full" style={{ paddingBottom: 40 }}>
      {!isAdmin && (
        <div className="flex items-center gap-2 rounded p-2 sm:p-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <Lock size={13} style={{ color: "#ef4444" }} />
          <span style={{ fontSize: 11, color: "#ef4444" }}>You're viewing in read-only mode. Only Admins can manage users.</span>
        </div>
      )}
      {error && <div style={{ fontSize: 12, color: "#ff3355" }}>{error}</div>}

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: isMobile ? 12 : 18, maxWidth: 1400, width: "100%", margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", color: "var(--muted-foreground)", marginBottom: 14, textTransform: "uppercase" }}>
          Users &amp; Logins{(me?.clientName || me?.tenantName) ? <> &middot; <span style={{ letterSpacing: "0.1em" }}>{me.clientName || me.tenantName}</span></> : null}
        </div>

        {loading ? (
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", padding: 16 }}>Loading users…</div>
        ) : users.map(u => (
          <UserRow key={u.id + ':' + (u.updatedAt || '')} u={u} me={me} isAdmin={isAdmin} isMobile={isMobile}
            busy={busyId === u.id} onChanged={fetchUsers} onDelete={() => handleDelete(u.id)} onPause={() => handlePauseToggle(u)} />
        ))}

        {isAdmin && (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", color: "var(--muted-foreground)", margin: "18px 0 8px", textTransform: "uppercase" }}>Add Login</div>
            <AddLogin isMobile={isMobile} onCreated={fetchUsers} iAmSuper={!!me?.isSuperAdmin} />
          </>
        )}
      </div>
    </div>
  );
}

export default UserManagement;