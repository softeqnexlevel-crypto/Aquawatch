// src/tenantFetch.js — makes every API call (and the live socket) belong to the client picked in the
// top bar. Import it once, early (DataContext does). It adds X-Tenant-Id to requests to our API.
import { useEffect, useState } from 'react';
import { API_BASE_URL } from './config';

const ID_KEY = 'activeTenantId';
const CFG_KEY = 'activeTenantConfig';

export function getActiveTenantId() {
  try { return localStorage.getItem(ID_KEY) || ''; } catch { return ''; }
}
export function setActiveTenantId(id) {
  try { localStorage.setItem(ID_KEY, String(id)); localStorage.removeItem(CFG_KEY); } catch { /* ignore */ }
}
export function setTenantConfig(cfg) {
  try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg || null)); } catch { /* ignore */ }
  window.dispatchEvent(new Event('tenant-config'));
}
export function getTenantConfig() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); } catch { return null; }
}
/** The active client's saved config (pages, systems, targets) — re-renders when it loads. null until known. */
export function useTenantConfig() {
  const [cfg, setCfg] = useState(getTenantConfig);
  useEffect(() => {
    const h = () => setCfg(getTenantConfig());
    window.addEventListener('tenant-config', h);
    return () => window.removeEventListener('tenant-config', h);
  }, []);
  return cfg;
}

if (typeof window !== 'undefined' && !window.__tenantFetchInstalled) {
  window.__tenantFetchInstalled = true;
  const original = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    try {
      const url = typeof input === 'string' ? input : input && input.url;
      const id = getActiveTenantId();
      if (id && url && url.startsWith(`${API_BASE_URL}/api`) && !/\/api\/auth\/(login|refresh)/.test(url)) {
        const headers = new Headers(init.headers || (typeof input !== 'string' && input.headers) || {});
        if (!headers.has('X-Tenant-Id')) headers.set('X-Tenant-Id', id);
        return original(input, { ...init, headers });
      }
    } catch { /* fall through to a normal request */ }
    return original(input, init);
  };
}
