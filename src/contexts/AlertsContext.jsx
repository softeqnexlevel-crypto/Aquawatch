// contexts/AlertsContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useData } from './DataContext';
import { evaluateSensorAlerts, mergeAlerts } from '../utils/alertEngine';
import {
  evaluateBackwashFilterDpAlert,
  evaluateBackwashModeAlert,
} from '../utils/backwashAlert';
import { API_BASE_URL } from '../config';

const AlertsContext = createContext();

// History is kept until an operator clears it by hand, so the cap is generous.
// It is stored in the browser (localStorage), so it survives page reloads.
const MAX_HISTORY = 5000;
const HISTORY_STORAGE_KEY = 'aquasystem_alert_history_v1';

function loadHistory() {
  try {
    const raw = window.localStorage?.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    window.localStorage?.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Storage full: keep the most recent events instead of losing everything
    try {
      window.localStorage?.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 1000)));
    } catch {
      /* nothing more we can do */
    }
  }
}

// ==================== ALERT ALLOWLIST ====================
// Only the alert types listed here are shown. Everything else is suppressed,
// including any new rules added to alertEngine later, until added here.
// Matched against the candidate's `message` (the text shown as the alert type).
const ALLOWED_ALERT_TYPES = ['Power Problem', 'Feed Tank Low Signal', 'PLC Data Lost']
const SERVER_TYPES = ['power problem', 'feed tank low signal','PLC Data Lost' ];
const SEVERITY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 };

const norm = (s) => String(s ?? '').trim().toLowerCase();

export function AlertsProvider({ children }) {
 const { sensorData, getValue, lastUpdate } = useData();
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState(loadHistory);
  const [serverHistory, setServerHistory] = useState([]);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/alert-events`);
        if (!r.ok) return;
        const rows = await r.json();
        if (!stop) {
          setServerHistory(rows.map((e) => ({
            id: `srv-${e.id}`, alertId: e.alertId, kind: e.kind,
            type: e.type, severity: e.severity, equipment: e.equipment, time: e.time,
          })));
        }
      } catch { /* ignore */ }
    };
    load();
    const t = setInterval(load, 15000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  // Server stores Power Problem history, so skip the browser's own copy of it.
  const mergedHistory = [
    ...history.filter((h) => norm(h.type) !== 'power problem'),
    ...serverHistory,
  ];

  // Tracks which rule IDs were active last evaluation, for hysteresis.
  const activeIdsRef = useRef(new Set());
  // Lets other pages (e.g. AntiscalantDosing) report page-local derived
  // alerts into this same ledger so they get IDs/acknowledgment/history too.
  const extraSourcesRef = useRef({});

  const pushHistory = useCallback((events) => {
    if (!events.length) return;
    setHistory((prev) => [...events, ...prev].slice(0, MAX_HISTORY));
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Keeps only allowed alert types. If several rules of the same type are
  // active at once (e.g. critical + warning tiers), only the most severe
  // stays active so the operator sees one row, not duplicates.
  const applyAlertRules = useCallback((candidates) => {
    const allowed = new Set(ALLOWED_ALERT_TYPES.map(norm));
    // Candidates carry `message`; `type` only exists after mergeAlerts.
    const typeOf = (c) => norm(c.type ?? c.message);

    const kept = candidates.filter((c) => allowed.has(typeOf(c)));

    // Find the winning (most severe) active candidate per type
    const winners = new Map();
    kept.forEach((c) => {
      if (!c.active) return;
      const t = typeOf(c);
      const cur = winners.get(t);
      const rank = SEVERITY_RANK[c.severity] ?? 99;
      if (!cur || rank < (SEVERITY_RANK[cur.severity] ?? 99)) winners.set(t, c);
    });

    return kept.map((c) =>
      c.active && winners.get(typeOf(c)) !== c ? { ...c, active: false } : c
    );
  }, []);

  const recompute = useCallback(() => {
    const sensorCandidates = evaluateSensorAlerts(getValue, activeIdsRef.current);
    // Alerts derived from combined system state (not a single raw sensor).
    const derivedCandidates = [
      evaluateBackwashModeAlert(getValue),
      evaluateBackwashFilterDpAlert(getValue),
    ].filter(Boolean);
    const extraCandidates = Object.values(extraSourcesRef.current).flat();
    const allCandidates = applyAlertRules([
      ...sensorCandidates,
      ...derivedCandidates,
      ...extraCandidates,
    ]);

    setAlerts((prevAlerts) => {
      const { alerts: merged, events } = mergeAlerts(allCandidates, prevAlerts);
      activeIdsRef.current = new Set(allCandidates.filter((c) => c.active).map((c) => c.id));
      pushHistory(events);
      return merged;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getValue, pushHistory, applyAlertRules]);

  useEffect(() => {
    if (Object.keys(sensorData).length > 0) recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorData]);

  // ==================== ACTIONS ====================

  const acknowledgeAlert = useCallback((id) => {
    const nowIso = new Date().toISOString();
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id && a.status === 'Active'
          ? { ...a, status: 'Acknowledged', acknowledgedAt: nowIso }
          : a
      )
    );
    pushHistory([{ id: `${id}-ack-${Date.now()}`, alertId: id, kind: 'acknowledged', time: nowIso }]);
  }, [pushHistory]);

  // Manually removes an alert from the live list. If the underlying condition
  // is still true, it will re-trigger on the next evaluation (by design).
  const clearAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    activeIdsRef.current.delete(id);
    pushHistory([{ id: `${id}-dismiss-${Date.now()}`, alertId: id, kind: 'dismissed', time: new Date().toISOString() }]);
  }, [pushHistory]);

  const clearAllAcknowledged = useCallback(() => {
    setAlerts((prev) => {
      const toDismiss = prev.filter((a) => a.status === 'Acknowledged');
      toDismiss.forEach((a) => activeIdsRef.current.delete(a.id));
      pushHistory(toDismiss.map((a) => ({ id: `${a.id}-dismiss-${Date.now()}`, alertId: a.id, kind: 'dismissed', time: new Date().toISOString() })));
      return prev.filter((a) => a.status !== 'Acknowledged');
    });
  }, [pushHistory]);

  // Wipes the saved alert history. Only ever runs when someone asks for it.
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      window.localStorage?.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // Called by other pages to feed in page-local derived alerts.
  const reportExtraAlerts = useCallback((sourceKey, candidates) => {
    extraSourcesRef.current[sourceKey] = candidates;
    recompute();
  }, [recompute]);

    const reportRef = useRef(reportExtraAlerts);
  reportRef.current = reportExtraAlerts;

  useEffect(() => {
    const STALE_MS = 120000; // same as the backend notifier
    const check = () => {
      const last = lastUpdate ? new Date(lastUpdate).getTime() : 0;
      const age = Date.now() - last;
      const stale = last > 0 && age > STALE_MS;
      reportRef.current('plc-data-lost', [{
        id: 'derived-plc-data-lost',
        active: stale,
        source: 'derived',
        severity: 'Critical',
        message: 'PLC Data Lost',
        equipment: 'RO5 - MQTT Link',
        value: `${Math.round(age / 1000)}s since last data`,
        threshold: `> ${STALE_MS / 1000}s`,
        description: 'No data received from the PLC/ABox. Check its power and network.',
      }]);
    };
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, [lastUpdate]);

  const activeAlerts = alerts.filter((a) => a.status === 'Active');
  const counts = {
    Critical: activeAlerts.filter((a) => a.severity === 'Critical').length,
    High: activeAlerts.filter((a) => a.severity === 'High').length,
    Medium: activeAlerts.filter((a) => a.severity === 'Medium').length,
    Low: activeAlerts.filter((a) => a.severity === 'Low').length,
  };

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        activeAlerts,
        counts,
        history: mergedHistory,
        acknowledgeAlert,
        clearAlert,
        clearAllAcknowledged,
        clearHistory,
        reportExtraAlerts,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlerts must be used within an AlertsProvider');
  return ctx;
}