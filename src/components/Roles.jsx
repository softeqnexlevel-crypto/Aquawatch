// ── Role definitions ──────────────────────────────────────────────────────────
export const ROLES = {
  admin:    "admin",
  operator: "operator",
  client:   "client",
};

// Pages each role can access
export const ROLE_PERMISSIONS = {
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

// Pages that are read-only for specific roles
export const READ_ONLY = {
  client: ["analytics", "dashboard"],
};

export function canAccess(role, page) {
  return (ROLE_PERMISSIONS[role] || []).includes(page);
}

export function isReadOnly(role, page) {
  return (READ_ONLY[role] || []).includes(page);
}