// frontend/src/components/UserManagement.jsx - FULLY MOBILE RESPONSIVE

import { useState, useEffect } from "react";
import { User, Plus, Trash2, Edit2, CheckCircle, X, Shield, Eye, EyeOff, Lock, RefreshCw, Dices } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// ==================== ROLE PERMISSIONS ====================
const ROLE_PERMISSIONS = {
  admin: [
    "dashboard", "analytics", "reports", "maintenance",
    "chemical", "borehole", "settings", "user-management"
  ],
  operator: [
    "dashboard", "maintenance", "reports"
  ],
  client: [
    "dashboard", "analytics"
  ],
};

const ALL_PAGES = [
  "dashboard", "analytics", "reports", "maintenance",
  "chemical", "borehole", "settings", "user-management"
];

const ROLE_COLORS = {
  admin:    { bg: "rgba(14,165,233,0.1)",  color: "#0ea5e9"  },
  operator: { bg: "rgba(34,197,94,0.1)",   color: "#22c55e"  },
  client:   { bg: "rgba(167,139,250,0.1)", color: "#a78bfa"  },
};

const DEFAULT_PASSWORD = "temp123456";
const EMPTY = { firstName: "", lastName: "", email: "", password: DEFAULT_PASSWORD, role: "operator", isActive: true };

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
      setForm(initial);
    } else {
      setForm({ ...EMPTY, password: DEFAULT_PASSWORD });
    }
    setError('');
  }, [initial, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
              isActive: form.isActive
            })
          })
        : await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              firstName: form.firstName,
              lastName: form.lastName || '',
              email: form.email,
              password: form.password,
              role: form.role
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
            <select value={form.role || 'operator'} onChange={e => set("role", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
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
                { label: "Inactive", v: false }
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
            <label style={{ display: "block", fontSize: isMobile ? 9 : 10, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Pages this role can access</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {ALL_PAGES.map(page => {
                const has = ROLE_PERMISSIONS[form.role]?.includes(page);
                return (
                  <span
                    key={page}
                    style={{
                      fontSize: isMobile ? 8 : 9,
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: 4,
                      textTransform: "capitalize",
                      background: has ? "rgba(34,197,94,0.1)" : "var(--muted)",
                      color: has ? "#22c55e" : "var(--muted-foreground)",
                      border: `1px solid ${has ? "rgba(34,197,94,0.2)" : "var(--border)"}`
                    }}
                  >
                    {isMobile ? page.substring(0, 5) : page}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ padding: isMobile ? "12px 16px" : "16px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: isMobile ? "8px 0" : "9px 0", borderRadius: 6, border: "1px solid var(--border)", background: "var(--muted)", fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ flex: 2, padding: isMobile ? "8px 0" : "9px 0", borderRadius: 6, border: "none", background: loading ? "var(--muted)" : "#0ea5e9", fontSize: isMobile ? 10 : 11, fontWeight: 600, color: loading ? "var(--muted-foreground)" : "#020810", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? 'Saving...' : 'Save User'}
          </button>
        </div>
      </div>
    </>
  );
}

// ==================== USER MANAGEMENT PAGE ====================
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

  // ==================== HANDLE TOGGLE ACTIVE ====================
  async function handleToggleActive(id) {
    if (!isAdmin) return;
    
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    try {
      await apiCall(`/auth/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: !user.is_active
        })
      });
      await fetchUsers();
    } catch (err) {
      alert('Failed to update user: ' + err.message);
    }
  }

  // ==================== OPEN EDIT ====================
  function openEdit(user) {
    if (!isAdmin) return;
    setEditing({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      isActive: user.is_active
    });
    setDrawerOpen(true);
  }

  // ==================== OPEN NEW ====================
  function openNew() {
    if (!isAdmin) return;
    setEditing(null);
    setDrawerOpen(true);
  }

  // ==================== STATS ====================
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === "admin").length,
    operators: users.filter(u => u.role === "operator").length,
    clients: users.filter(u => u.role === "client").length,
  };

  // ==================== RENDER ====================
  return (
    <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4 overflow-auto h-full">
      {/* Read-only banner */}
      {!isAdmin && (
        <div className="flex items-center gap-2 rounded p-2 sm:p-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <Lock size={isMobile ? 11 : 13} style={{ color: "#ef4444" }} />
          <span style={{ fontSize: isMobile ? 10 : 11, color: "#ef4444" }}>
            {isMobile ? "Read-only mode" : "You're viewing in read-only mode. Only Admins can manage users."}
          </span>
        </div>
      )}

      {/* KPIs - Responsive */}
      <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)" }}>
        {[
          { label: isMobile ? "Total" : "Total Users", value: stats.total, color: "#0ea5e9" },
          { label: isMobile ? "Active" : "Active", value: stats.active, color: "#22c55e" },
          { label: isMobile ? "Admins" : "Admins", value: stats.admins, color: "#0ea5e9" },
          { label: isMobile ? "Ops" : "Operators", value: stats.operators, color: "#22c55e" },
          { label: isMobile ? "Clients" : "Clients", value: stats.clients, color: "#a78bfa" },
        ].filter((_, idx) => isMobile ? idx < 4 : true).map(c => (
          <div key={c.label} className="rounded p-2 sm:p-3 flex gap-2 sm:gap-3 items-start" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="rounded p-1 sm:p-1.5 mt-0.5" style={{ background: `${c.color}15` }}>
              <User size={isMobile ? 12 : 14} style={{ color: c.color }} />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</div>
            </div>
          </div>
        ))}
        {isMobile && (
          <div key="clients-mobile" className="rounded p-2 sm:p-3 flex gap-2 sm:gap-3 items-start" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="rounded p-1 sm:p-1.5 mt-0.5" style={{ background: `rgba(167,139,250,0.1)` }}>
              <User size={isMobile ? 12 : 14} style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? 8 : 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Clients</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#a78bfa", lineHeight: 1.2 }}>{stats.clients}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tab bar - Responsive */}
      <div className="flex items-center gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
        {[
          { id: "users", label: isMobile ? "Users" : "Users" },
          { id: "permissions", label: isMobile ? "Roles" : "Role Permissions" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: isMobile ? "6px 10px" : "8px 14px",
              fontSize: isMobile ? 10 : 11,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "#0ea5e9" : "var(--muted-foreground)",
              borderBottom: tab === t.id ? "2px solid #0ea5e9" : "2px solid transparent",
              marginBottom: -1,
              background: "none",
              border: "none",
              cursor: "pointer"
            }}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        {isAdmin && (
          <button
            onClick={openNew}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded mb-1"
            style={{ background: "#0ea5e9", color: "#020810", fontSize: isMobile ? 10 : 11, fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            <Plus size={isMobile ? 10 : 12} /> {isMobile ? "Add" : "New User"}
          </button>
        )}
      </div>

      {tab === "users" ? (
        <div className="rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted-foreground)" }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
              <p>Loading users...</p>
            </div>
          ) : error ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
              <p>{error}</p>
              <button onClick={fetchUsers} style={{ marginTop: 8, padding: "6px 16px", background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer" }}>
                Retry
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 500 : 'auto' }}>
                <thead>
                  <tr style={{ background: "var(--muted)" }}>
                    {isMobile ? (
                      <>
                        <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>User</th>
                        <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Role</th>
                        <th style={{ padding: "6px 8px", textAlign: "center", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Status</th>
                        {isAdmin && <th style={{ padding: "6px 8px", textAlign: "center", fontSize: 8, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Actions</th>}
                      </>
                    ) : (
                      <>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>User</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Email</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Role</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Pages</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Joined</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Status</th>
                        {isAdmin && <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Actions</th>}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const rc = ROLE_COLORS[u.role] || ROLE_COLORS.operator;
                    const pages = ROLE_PERMISSIONS[u.role] || [];
                    
                    if (isMobile) {
                      return (
                        <tr key={u.id} style={{ background: i % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                          <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${rc.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <User size={10} style={{ color: rc.color }} />
                              </div>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 500, color: "var(--foreground)" }}>
                                  {u.first_name} {u.last_name}
                                </div>
                                <div style={{ fontSize: 8, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>
                            <span style={{ fontSize: 8, fontWeight: 700, color: rc.color, background: rc.bg, borderRadius: 4, padding: "1px 6px", textTransform: "uppercase" }}>{u.role}</span>
                          </td>
                          <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
                            {isAdmin ? (
                              <button
                                onClick={() => handleToggleActive(u.id)}
                                style={{
                                  fontSize: 8,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  color: u.is_active ? "#22c55e" : "#4d7a9e",
                                  background: u.is_active ? "rgba(34,197,94,0.1)" : "rgba(77,122,158,0.1)",
                                  border: `1px solid ${u.is_active ? "rgba(34,197,94,0.25)" : "rgba(77,122,158,0.25)"}`,
                                  borderRadius: 4,
                                  padding: "1px 6px"
                                }}
                              >
                                {u.is_active ? "ACTIVE" : "INACTIVE"}
                              </button>
                            ) : (
                              <span style={{ fontSize: 8, fontWeight: 600, color: u.is_active ? "#22c55e" : "#4d7a9e" }}>
                                {u.is_active ? "✓" : "✗"}
                              </span>
                            )}
                          </td>
                          {isAdmin && (
                            <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                <button
                                  onClick={() => openEdit(u)}
                                  style={{
                                    padding: "2px 4px",
                                    borderRadius: 4,
                                    fontSize: 8,
                                    color: "#0ea5e9",
                                    background: "rgba(14,165,233,0.1)",
                                    border: "1px solid rgba(14,165,233,0.2)",
                                    cursor: "pointer"
                                  }}
                                >
                                  <Edit2 size={8} />
                                </button>
                                {u.id !== me?.id && (
                                  <button
                                    onClick={() => handleDelete(u.id)}
                                    style={{
                                      padding: "2px 4px",
                                      borderRadius: 4,
                                      fontSize: 8,
                                      color: "#ef4444",
                                      background: "rgba(239,68,68,0.08)",
                                      border: "1px solid rgba(239,68,68,0.2)",
                                      cursor: "pointer"
                                    }}
                                  >
                                    <Trash2 size={8} />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    }
                    
                    return (
                      <tr key={u.id} style={{ background: i % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                          <div className="flex items-center gap-2">
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${rc.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <User size={12} style={{ color: rc.color }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>
                              {u.first_name} {u.last_name}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", borderBottom: "1px solid var(--border)" }}>{u.email}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: rc.color, background: rc.bg, borderRadius: 4, padding: "2px 8px", textTransform: "uppercase" }}>{u.role}</span>
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                          <div className="flex items-center gap-1">
                            <Eye size={11} style={{ color: "var(--muted-foreground)" }} />
                            <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{pages.length} pages</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                          {isAdmin ? (
                            <button
                              onClick={() => handleToggleActive(u.id)}
                              style={{
                                fontSize: 9,
                                fontWeight: 600,
                                cursor: "pointer",
                                color: u.is_active ? "#22c55e" : "#4d7a9e",
                                background: u.is_active ? "rgba(34,197,94,0.1)" : "rgba(77,122,158,0.1)",
                                border: `1px solid ${u.is_active ? "rgba(34,197,94,0.25)" : "rgba(77,122,158,0.25)"}`,
                                borderRadius: 4,
                                padding: "2px 8px"
                              }}
                            >
                              {u.is_active ? "ACTIVE" : "INACTIVE"}
                            </button>
                          ) : (
                            <span
                              title="Only Admins can change user status"
                              style={{
                                fontSize: 9,
                                fontWeight: 600,
                                cursor: "not-allowed",
                                color: u.is_active ? "#22c55e" : "#4d7a9e",
                                background: u.is_active ? "rgba(34,197,94,0.1)" : "rgba(77,122,158,0.1)",
                                border: `1px solid ${u.is_active ? "rgba(34,197,94,0.25)" : "rgba(77,122,158,0.25)"}`,
                                borderRadius: 4,
                                padding: "2px 8px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4
                              }}
                            >
                              <Lock size={8} />{u.is_active ? "ACTIVE" : "INACTIVE"}
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEdit(u)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "4px 8px",
                                  borderRadius: 5,
                                  fontSize: 10,
                                  color: "#0ea5e9",
                                  background: "rgba(14,165,233,0.1)",
                                  border: "1px solid rgba(14,165,233,0.2)",
                                  cursor: "pointer"
                                }}
                              >
                                <Edit2 size={10} />Edit
                              </button>
                              {u.id !== me?.id && (
                                <button
                                  onClick={() => handleDelete(u.id)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "4px 8px",
                                    borderRadius: 5,
                                    fontSize: 10,
                                    color: "#ef4444",
                                    background: "rgba(239,68,68,0.08)",
                                    border: "1px solid rgba(239,68,68,0.2)",
                                    cursor: "pointer"
                                  }}
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              {isMobile ? "Role Permissions" : "Role → Page Access Matrix"}
            </div>
            <PermissionsMatrix isMobile={isMobile} />
          </div>
          <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)" }}>
            {["admin", "operator", "client"].map(role => {
              const rc = ROLE_COLORS[role];
              return (
                <div key={role} className="rounded p-2 sm:p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Shield size={isMobile ? 11 : 13} style={{ color: rc.color }} />
                    <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: rc.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{role}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {ALL_PAGES.map(page => {
                      const has = ROLE_PERMISSIONS[role]?.includes(page);
                      return (
                        <div key={page} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {has ? <CheckCircle size={isMobile ? 10 : 11} style={{ color: rc.color }} /> : <X size={isMobile ? 10 : 11} style={{ color: "var(--muted-foreground)", opacity: 0.3 }} />}
                          <span style={{ fontSize: isMobile ? 10 : 11, color: has ? "var(--foreground)" : "var(--muted-foreground)", textTransform: "capitalize", opacity: has ? 1 : 0.4 }}>{page}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Drawer */}
      {isAdmin && (
        <UserDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSave={handleSave}
          initial={editing}
          isEdit={!!editing?.id}
        />
      )}
    </div>
  );
}

export default UserManagement;