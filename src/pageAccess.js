// src/pageAccess.js
// ONE place that decides which pages a user sees. It uses exactly what User Management saves
// (user.permissions), with the same page names, so ticking/unticking a page there is what the menus follow.
import { useAuth } from "./contexts/AuthContext";

// Same defaults User Management uses when a user has no saved list.
const ROLE_DEFAULTS = {
  admin: ["dashboard","mimic","production","antiscalant","system recovery","alerts","tag manager","billing","analytics","reports","maintenance","filtration","tank level","settings","user-management"],
  operator: ["dashboard","mimic","maintenance","reports"],
  client: ["dashboard","analytics"],
};
// Old saved names that mean exactly one page now. ("dashboard" is NOT aliased: it only ever meant the dashboard.)
const LEGACY = { borehole: "tank level", boreholes: "tank level", chemical: "antiscalant", recovery: "system recovery", tagmanager: "tag manager", user: "user-management" };

const norm = (p) => { const k = String(p || "").trim().toLowerCase(); return LEGACY[k] || k; };

export function allowedPages(user) {
  if (!user) return [];
  const role = String(user.role || "").toLowerCase();
  if (role === "admin" || user.isSuperAdmin) return ROLE_DEFAULTS.admin;
  const saved = (Array.isArray(user.permissions) ? user.permissions : []).map(norm).filter(Boolean);
  return saved.length ? saved : (ROLE_DEFAULTS[role] || ROLE_DEFAULTS.client);
}

export function usePageAccess() {
  const { user } = useAuth();
  const pages = allowedPages(user);
  return { user, pages, can: (page) => pages.includes(norm(page)) };
}