// utils/backwashAlert.js
// Derived alert: raised while the system is in BACKWASH mode, because a
// backwash cycle is triggered by high media-filter differential pressure.
//
// The mode logic mirrors Dashboard.jsx. It is duplicated here on purpose:
// AlertsContext importing from Dashboard would create a circular import
// (Dashboard -> AlertsContext -> Dashboard).

export const BACKWASH_FILTER_DP_ALERT_ID = 'derived-backwash-high-filter-dp';
export const BACKWASH_FILTER_DP_ALERT_TYPE = 'High Media Filter Differential Pressure';

// Keep in sync with FILTER_DIFFERENTIAL_PRESSURE_CRITICAL_BAR in Dashboard.jsx
const FILTER_DP_LIMIT_BAR = 0.40;

const ON_VALUES = ['1', 'true', 'on', 'active', 'yes', 'running', 'enabled', 'online'];

const isOn = (raw) => {
  if (raw === true) return true;
  if (typeof raw === 'number') return raw === 1;
  if (typeof raw === 'string') return ON_VALUES.includes(raw.trim().toLowerCase());
  return false;
};

// Same resolution order as Dashboard: PLC SystemMode first, otherwise infer
// from the feed pump / backwash valve bits. SystemActive is the master switch.
function isBackwashMode(getValue) {
  if (!isOn(getValue('RO5-SystemActive'))) return false;

  const mode = String(getValue('RO5-SystemMode') ?? '').trim().toUpperCase();
  if (mode.includes('BACKWASH') || mode.includes('BACK WASH')) return true;

  const plcKnown =
    mode.includes('FILTER') ||
    mode.includes('STANDBY') ||
    mode.includes('STAND BY') ||
    mode === 'OFF' ||
    mode === 'STOP' ||
    mode === 'STOPPED';
  if (plcKnown) return false;

  // Mode unknown/other (e.g. "AUTO"/"MANUAL" control mode): infer from I/O
  return isOn(getValue('RO5-Feedpump')) && isOn(getValue('RO5-PrefilterBackwash'));
}

export function evaluateBackwashFilterDpAlert(getValue) {
  const active = isBackwashMode(getValue);

  const dp = Number(getValue('RO5-MediaFilterDeltaP'));
  const dpKnown = Number.isFinite(dp);
  const plcHighDpBit = isOn(getValue('RO5-HighPrefilterDeltaP'));

  const trigger = plcHighDpBit
    ? 'PLC high filter ΔP bit is set'
    : dpKnown && dp >= FILTER_DP_LIMIT_BAR
      ? `Filter ΔP at or above ${FILTER_DP_LIMIT_BAR.toFixed(2)} bar`
      : 'Backwash cycle running';

  return {
    id: BACKWASH_FILTER_DP_ALERT_ID,
    type: BACKWASH_FILTER_DP_ALERT_TYPE,
    // Deliberately NOT 'Critical': Dashboard treats any active Critical alert
    // as a standby reason, and a normal backwash must not do that.
    severity: 'Medium',
    active,
    source: 'derived',
    // "Area - Signal" format: RecentAlarmItem shows the part after " - "
    equipment: 'Media Filter - Delta P',
    message: `System in backwash mode — ${trigger}`,
    value: dpKnown ? `${dp.toFixed(2)} bar` : undefined,
  };
}