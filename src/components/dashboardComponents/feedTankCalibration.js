// components/dashboardComponents/feedTankCalibration.js
//
// Calibration for the feed tank level transmitter's raw signal.
//   raw 4.9  -> 0%   (tank empty / low end of transmitter range)
//   raw 10.0 -> 100% (tank full / high end of transmitter range)
//
// NOTE: the low end was previously 4.9 -> 10%. It was changed to 4.9 -> 0%
// by request. The standalone "Abox Calibrator" tool still uses the old
// 10% low end, so it will no longer match this module until it is updated.
//
// This REPLACES the old backend calibration in plcService.js, which
// multiplied the raw value by a flat factor of 7.83 -- that factor does
// not match this curve at all (4.9 * 7.83 = 38.4%, not 0%; 10.0 * 7.83
// = 78.3%, not 100%). Until plcService.js is updated to stop pre-scaling
// RO5-FeedTankLevel, the frontend recomputes the correct percentage
// directly from the raw signal (RO5-FeedTankLevelRaw) using this module,
// and only falls back to the backend-scaled value if the raw tag hasn't
// arrived yet (e.g. on first connect).

const RAW_MIN = 4.9;   // raw signal at 0% tank level
const RAW_MAX = 10.0;  // raw signal at 100% tank level
const PCT_MIN = 0;
const PCT_MAX = 100;

/**
 * Convert a raw transmitter reading to a tank level percentage.
 * Clamps to the transmitter's valid range [4.9, 10.0] -> [0%, 100%].
 * Returns null for non-finite input so callers can distinguish
 * "no reading yet" from "reading is exactly 0".
 */
export function rawToPercent(raw) {
  if (!Number.isFinite(raw)) return null;
  const clamped = Math.min(RAW_MAX, Math.max(RAW_MIN, raw));
  return PCT_MIN + ((clamped - RAW_MIN) * (PCT_MAX - PCT_MIN)) / (RAW_MAX - RAW_MIN);
}

/**
 * Inverse of rawToPercent: given a target percentage, what raw signal
 * would produce it. Useful for calibration/verification UIs.
 */
export function percentToRaw(pct) {
  if (!Number.isFinite(pct)) return null;
  const clamped = Math.min(PCT_MAX, Math.max(PCT_MIN, pct));
  return RAW_MIN + ((clamped - PCT_MIN) * (RAW_MAX - RAW_MIN)) / (PCT_MAX - PCT_MIN);
}

export const FEED_TANK_CALIBRATION = { RAW_MIN, RAW_MAX, PCT_MIN, PCT_MAX };