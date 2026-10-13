// components/ChangePasswordModal.jsx
// Lets ANY signed-in user change their own password (calls POST /api/auth/change-password).
import { useState } from "react";
import { X, Eye, EyeOff, Lock, CheckCircle } from "lucide-react";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}`;

const field = {
  width: "100%", padding: "9px 36px 9px 10px", fontSize: 13, borderRadius: 8,
  border: "1px solid var(--border)", background: "var(--background)",
  color: "var(--foreground)", outline: "none", boxSizing: "border-box",
};

function PasswordField({ label, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "var(--foreground)" }}>{label}</span>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          style={field}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex" }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </label>
  );
}

export default function ChangePasswordModal({ open, onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const close = () => {
    setCurrent(""); setNext(""); setConfirm(""); setError(""); setDone(false); setLoading(false);
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!current || !next || !confirm) return setError("Please fill in all fields");
    if (next.length < 8) return setError("New password must be at least 8 characters");
    if (next !== confirm) return setError("New passwords do not match");
    if (next === current) return setError("New password must be different from the current one");

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not change password");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div style={{ width: "100%", maxWidth: 400, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>
            <Lock size={16} /> Change Password
          </div>
          <button onClick={close} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <CheckCircle size={36} color="#22c55e" />
            <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>Password changed</div>
            <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted-foreground)" }}>
              Your other devices will be asked to sign in again.
            </div>
            <button onClick={close} style={{ marginTop: 16, padding: "8px 18px", borderRadius: 8, border: "none", background: "#0077B6", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <PasswordField label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
            <PasswordField label="New password (min 8 characters)" value={next} onChange={setNext} autoComplete="new-password" />
            <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />

            {error && (
              <div style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: 6, padding: "8px 10px", marginBottom: 12 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={close} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--foreground)", cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#0077B6", color: "#fff", fontWeight: 600, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Saving…" : "Change Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
