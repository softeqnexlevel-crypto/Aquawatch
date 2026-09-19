// components/dashboardComponents/instrumentUtils.js
//
// Shared helpers for the instrument-style widgets (PressureGauge,
// TankLevelGauge). Centralised so both the Dashboard and the FeedTank
// screen use the *same* rules and can never disagree again.

import { isActive } from '../Dashboard'; // re-exported from Dashboard.jsx

// How long a tag value is trusted before we consider it stale.
// Match this to your PLC publish interval; 60 s is safe for most plants.
export const DATA_FRESHNESS_WINDOW_MS = 60 * 1000;

// ---------------------------------------------------------------
// DECISION: client rule — when the RO system is OFF the feed tank is
// physically empty (0%). The PLC's last-published level is stale and
// MUST NOT be shown. System-OFF check wins over staleness and over the
// raw tag value.
//
// Returns:
//   number in [0, 100]  -> live reading (system ON, fresh data)
//   0                   -> system OFF, tank is empty by definition
//   null                -> system ON but tag stale/unavailable (No Data)
// ---------------------------------------------------------------
export function getDisplayedTankLevelPct({
  rawTankLevel,
  lastUpdate,
  systemOperationRaw,
  feedPumpRaw,
  freshnessWindowMs = DATA_FRESHNESS_WINDOW_MS,
} = {}) {
  const systemOff =
    !isActive(systemOperationRaw) || !isActive(feedPumpRaw);

  if (systemOff) return 0;

  const isStale =
    !lastUpdate ||
    Date.now() - new Date(lastUpdate).getTime() > freshnessWindowMs;

  if (isStale) return null;

  const n = Number(rawTankLevel);
  if (!Number.isFinite(n)) return null;

  return Math.min(100, Math.max(0, n));
}

// ---------------------------------------------------------------
// Same rule for pressure. A stopped system has zero discharge
// pressure; showing the last-known 12 bar reading while the plant is
// idle is misleading and can trigger false "High" states.
// ---------------------------------------------------------------
export function getDisplayedPressure({
  rawPressure,
  lastUpdate,
  systemOperationRaw,
  feedPumpRaw,
  freshnessWindowMs = DATA_FRESHNESS_WINDOW_MS,
} = {}) {
  const systemOff =
    !isActive(systemOperationRaw) || !isActive(feedPumpRaw);

  if (systemOff) return 0;

  const isStale =
    !lastUpdate ||
    Date.now() - new Date(lastUpdate).getTime() > freshnessWindowMs;

  if (isStale) return null;

  const n = Number(rawPressure);
  if (!Number.isFinite(n)) return null;

  return n;
}