
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useData } from './DataContext';
import { evaluateSensorAlerts, mergeAlerts } from '../utils/alertEngine';

const AlertsContext = createContext();
const MAX_HISTORY = 200;

export function AlertsProvider({ children }) {
  const { sensorData, getValue } = useData();

  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);

  // Tracks which rule IDs were active last evaluation, for hysteresis.
  const activeIdsRef = useRef(new Set());
  // Lets other pages (e.g. AntiscalantDosing) report page-local derived
  // alerts (not backed by one raw sensor key, e.g. "dosing rate too high")
  // into this same ledger so they get IDs/acknowledgment/history too.
  const extraSourcesRef = useRef({});

  const pushHistory = useCallback((events) => {
    if (!events.length) return;
    setHistory((prev) => [...events, ...prev].slice(0, MAX_HISTORY));
  }, []);

  const recompute = useCallback(() => {
    const sensorCandidates = evaluateSensorAlerts(getValue, activeIdsRef.current);
    const extraCandidates = Object.values(extraSourcesRef.current).flat();
    const allCandidates = [...sensorCandidates, ...extraCandidates];

    setAlerts((prevAlerts) => {
      const { alerts: merged, events } = mergeAlerts(allCandidates, prevAlerts);
      activeIdsRef.current = new Set(allCandidates.filter((c) => c.active).map((c) => c.id));
      pushHistory(events);
      return merged;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getValue, pushHistory]);

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