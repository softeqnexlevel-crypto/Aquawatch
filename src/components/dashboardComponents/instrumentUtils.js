// components/dashboardComponents/instrumentUtils.js
//
// Shared helpers for the instrument-style widgets (PressureGauge,
// TankLevelGauge). Centralised so the Dashboard and the FeedTank screen
// use the *same* rules and can never disagree.

// isActive lives here (not in Dashboard.jsx) to avoid a circular import.
// Dashboard.jsx re-exports it, so existing `import { isActive } from '../Dashboard'`
// statements elsewhere keep working.
export const isActive = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    return ['1', 'true', 'on', 'active', 'yes', 'running', 'enabled', 'online'].includes(normalized);
  }
  return !!value;
};

// How long a tag value is trusted before we consider it stale.
export const DATA_FRESHNESS_WINDOW_MS = 60 * 1000;

// Decides whether the system counts as OFF.
//  - New path: caller passes `systemOn` (the master SystemActive signal).
//  - Legacy path: callers that still pass systemOperationRaw / feedPumpRaw
//    keep the old behaviour so other screens don't break.
function resolveSystemOff({ systemOn, systemOperationRaw, feedPumpRaw }) {
  if (typeof systemOn === 'boolean') return !systemOn;
  return !isActive(systemOperationRaw) || !isActive(feedPumpRaw);
}

// ---------------------------------------------------------------
// Returns:
//   number in [0, 100]  -> live reading (system ON, fresh data)
//   0                   -> system OFF, tank is empty by definition
//   null                -> system ON but tag stale/unavailable (No Data)
// ---------------------------------------------------------------
export function getDisplayedTankLevelPct({
  rawTankLevel,
  lastUpdate,
  systemOn,
  systemOperationRaw,
  feedPumpRaw,
  freshnessWindowMs = DATA_FRESHNESS_WINDOW_MS,
} = {}) {
  if (resolveSystemOff({ systemOn, systemOperationRaw, feedPumpRaw })) return 0;

  const isStale =
    !lastUpdate ||
    Date.now() - new Date(lastUpdate).getTime() > freshnessWindowMs;
  if (isStale) return null;

  const n = Number(rawTankLevel);
  if (!Number.isFinite(n)) return null;

  return Math.min(100, Math.max(0, n));
}

// Same rule for pressure: a stopped system has zero discharge pressure.
export function getDisplayedPressure({
  rawPressure,
  lastUpdate,
  systemOn,
  systemOperationRaw,
  feedPumpRaw,
  freshnessWindowMs = DATA_FRESHNESS_WINDOW_MS,
} = {}) {
  if (resolveSystemOff({ systemOn, systemOperationRaw, feedPumpRaw })) return 0;

  const isStale =
    !lastUpdate ||
    Date.now() - new Date(lastUpdate).getTime() > freshnessWindowMs;
  if (isStale) return null;

  const n = Number(rawPressure);
  if (!Number.isFinite(n)) return null;

  return n;
}