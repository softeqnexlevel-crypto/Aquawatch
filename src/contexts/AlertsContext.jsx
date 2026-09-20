import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useData } from './DataContext';
import { evaluateSensorAlerts, mergeAlerts } from '../utils/alertEngine';

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

// ==================== ALERT RULE OVERRIDES ====================
// Applied on top of alertEngine's candidates, matched by the alert's `type`
// text (the same text shown in the Alerts Center).

// Alerts that are switched off completely
const REMOVED_ALERT_TYPES = ['Antiscalant Dosing Stopped'];

// Alerts that only count while the pumps are running, and optionally only
// after the condition has stayed true for `delayMs` without a break.
const GATED_ALERTS = [
  // Low pressure is expected when the pumps are stopped or backwashing.
  // The PLC's own "Low RO Pressure" bit is left alone (skipSources).
  { type: 'Low RO Pressure', skipSources: ['plc'], requirePumpsRunning: true, delayMs: 0 },
  // Recovery reads low while the system starts up, so wait 1 minute.
  { type: 'Low System Recovery', requirePumpsRunning: true, delayMs: 60 * 1000 },
];

const norm = (s) => String(s ?? '').trim().toLowerCase();

function isOn(raw) {
  if (raw === true) return true;
  if (typeof raw === 'number') return raw === 1;
  if (typeof raw === 'string') {
    return ['1', 'true', 'on', 'active', 'yes', 'running', 'enabled', 'online'].includes(raw.trim().toLowerCase());
  }
  return false;
}

export function AlertsProvider({ children }) {
  const { sensorData, getValue } = useData();

  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState(loadHistory);

  // Tracks which rule IDs were active last evaluation, for hysteresis.
  const activeIdsRef = useRef(new Set());
  // Lets other pages (e.g. AntiscalantDosing) report page-local derived
  // alerts (not backed by one raw sensor key, e.g. "dosing rate too high")
  // into this same ledger so they get IDs/acknowledgment/history too.
  const extraSourcesRef = useRef({});
  // When each delayed alert's condition first became true (id -> ms)
  const pendingSinceRef = useRef({});
  const delayTimerRef = useRef(null);
  const recomputeRef = useRef(null);

  const pushHistory = useCallback((events) => {
    if (!events.length) return;
    setHistory((prev) => [...events, ...prev].slice(0, MAX_HISTORY));
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => () => {
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
  }, []);

  // Removes / gates / delays alerts according to the rules above
  const applyAlertRules = useCallback((candidates) => {
    const now = Date.now();
    const pumpsRunning = isOn(getValue('RO5-Feedpump')) && !isOn(getValue('RO5-PrefilterBackwash'));
    const removed = new Set(REMOVED_ALERT_TYPES.map(norm));
    let soonestDeadline = null;
    const out = [];

    for (const c of candidates) {
      const type = norm(c.type);
      if (removed.has(type)) continue;

      const rule = GATED_ALERTS.find(
        (r) => norm(r.type) === type && !(r.skipSources || []).map(norm).includes(norm(c.source))
      );
      if (!rule) {
        out.push(c);
        continue;
      }

      // Condition gone, or pumps not running: reset and treat as not active
      if (!c.active || (rule.requirePumpsRunning && !pumpsRunning)) {
        delete pendingSinceRef.current[c.id];
        out.push(c.active ? { ...c, active: false } : c);
        continue;
      }

      // Condition true and pumps running: wait out the delay, if any
      if (rule.delayMs > 0) {
        if (pendingSinceRef.current[c.id] === undefined) pendingSinceRef.current[c.id] = now;
        const remaining = rule.delayMs - (now - pendingSinceRef.current[c.id]);
        if (remaining > 0) {
          out.push({ ...c, active: false });
          soonestDeadline = soonestDeadline === null ? remaining : Math.min(soonestDeadline, remaining);
          continue;
        }
      }
      out.push(c);
    }

    // Re-check right when the soonest delay ends, even if no new sensor data arrives
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    delayTimerRef.current = soonestDeadline === null
      ? null
      : setTimeout(() => recomputeRef.current?.(), soonestDeadline + 50);

    return out;
  }, [getValue]);

  const recompute = useCallback(() => {
    const sensorCandidates = evaluateSensorAlerts(getValue, activeIdsRef.current);
    const extraCandidates = Object.values(extraSourcesRef.current).flat();
    const allCandidates = applyAlertRules([...sensorCandidates, ...extraCandidates]);

    setAlerts((prevAlerts) => {
      const { alerts: merged, events } = mergeAlerts(allCandidates, prevAlerts);
      activeIdsRef.current = new Set(allCandidates.filter((c) => c.active).map((c) => c.id));
      pushHistory(events);
      return merged;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getValue, pushHistory, applyAlertRules]);
  recomputeRef.current = recompute;

  useEffect(() => {
    if (Object.keys(sensorData).length > 0) recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorData]);

  // ==================== ACTIONS ====================

  const acknowledgeAlert = useCallback((id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id && a.status === 'Active' ? { ...a, status: 'Acknowledged' } : a))
    );
    pushHistory([{ id: `${id}-ack-${Date.now()}`, alertId: id, kind: 'acknowledged', time: new Date().toISOString() }]);
  }, [pushHistory]);

  // Manually removes an alert from the live list — for clearing stale or
  // handled items. If the underlying condition is still actually true,
  // it will simply re-trigger on the next evaluation (by design: you
  // can't permanently silence a real, ongoing critical condition this
  // way, only dismiss the current notification for it).
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
        history,
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