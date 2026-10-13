// components/dashboardComponents/flushTankCalibration.js
//
// Flush tank sensor (MQTT tag: RO5-FlushTank) -> percentage.
// The sensor is NOT in the feed tank's 4.9-10.0 range (it is sending values like 115.3),
// so it needs its own calibration.
//
// >>> SET THESE TWO NUMBERS to what the sensor reads when the tank is EMPTY and FULL. <<<
// Empty = 4.9, Full = 200.
export const FLUSH_RAW_EMPTY = 0;   // confirmed: 0 = 0%
export const FLUSH_RAW_FULL = 200;    // full tank = 200 (capacity)

export function flushRawToPercent(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || FLUSH_RAW_FULL === FLUSH_RAW_EMPTY) return null;
  const pct = ((n - FLUSH_RAW_EMPTY) / (FLUSH_RAW_FULL - FLUSH_RAW_EMPTY)) * 100;
  return Math.min(100, Math.max(0, pct));
}