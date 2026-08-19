// utils/alertEngine.js
//
// Single source of truth for alarm/alert logic. Plain functions only —
// no React, no state of its own. Callers (AlertsContext) own the state
// and pass in whatever "previous" info the engine needs (previous active
// rule IDs for hysteresis, previous alert list for merge/acknowledgment).

// ==================== VALUE NORMALIZATION ====================

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

export const toNumber = (value, fallback = 0) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'number') return isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return fallback;
};

export const toDisplayString = (value, decimals = 1) => {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'boolean') return value ? 'ON' : 'OFF';
  if (typeof value === 'number') return value.toFixed(decimals);
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && String(parsed) !== value.trim().toUpperCase()) return parsed.toFixed(decimals);
    return value;
  }
  return String(value);
};

// ==================== CANONICAL THRESHOLD TABLE ====================

export const THRESHOLDS = {
  'RO5-ROPressure': {
    equipment: 'RO5 - ROPressure',
    rules: [
      { type: 'critical', direction: 'high', value: 16, clear: 15.5, severity: 'Critical', message: 'High RO Pressure' },
      { type: 'low', direction: 'low', value: 10, clear: 10.5, severity: 'High', message: 'Low RO Pressure' },
    ],
  },
  'RO5-Stage1Delta': {
    equipment: 'RO5 - Stage1Delta',
    rules: [
      { type: 'critical', direction: 'high', value: 0.60, clear: 0.55, severity: 'Critical', message: 'High Differential Pressure - Stage 1' },
      { type: 'warning', direction: 'high', value: 0.50, clear: 0.45, severity: 'High', message: 'High Differential Pressure - Stage 1' },
    ],
  },
  'RO5-Stage2Delta': {
    equipment: 'RO5 - Stage2Delta',
    rules: [
      { type: 'high', direction: 'high', value: 0.55, clear: 0.50, severity: 'High', message: 'High Differential Pressure - Stage 2' },
    ],
  },
  'RO5-MediaFilterDeltaP': {
    equipment: 'RO5 - MediaFilterDeltaP',
    rules: [
      { type: 'critical', direction: 'high', value: 0.40, clear: 0.35, severity: 'Critical', message: 'High Filter Delta P' },
      { type: 'warning', direction: 'high', value: 0.30, clear: 0.26, severity: 'Medium', message: 'High Filter Delta P' },
    ],
  },
  'RO5-SystemRecovery': {
    equipment: 'RO5 - SystemRecovery',
    rules: [
      { type: 'critical', direction: 'low', value: 68, clear: 69.5, severity: 'Critical', message: 'Low System Recovery' },
      { type: 'warning', direction: 'low', value: 72, clear: 73.5, severity: 'Medium', message: 'Low System Recovery' },
    ],
  },
  'RO5-FeedTankLevel': {
    equipment: 'RO5 - FeedTankLevel',
    rules: [
      { type: 'critical', direction: 'low', value: 20, clear: 23, severity: 'Critical', message: 'Low Feed Tank Level' },
      { type: 'warning', direction: 'low', value: 30, clear: 33, severity: 'Medium', message: 'Low Feed Tank Level' },
    ],
  },
  'RO5-FEEDFlow': {
    equipment: 'RO5 - FEEDFlow',
    rules: [
      { type: 'low', direction: 'low', value: 50, clear: 53, severity: 'High', message: 'Low Feed Flow' },
    ],
  },
  'RO5-PureWaterEc': {
    equipment: 'RO5 - PureWaterEc',
    rules: [
      { type: 'high', direction: 'high', value: 50, clear: 45, severity: 'Medium', message: 'High Product Water EC' },
    ],
  },
  'RO5-ConcetrateFlow': {
    equipment: 'RO5 - ConcetrateFlow',
    rules: [
      { type: 'low', direction: 'low', value: 10, clear: 11, severity: 'Medium', message: 'Low Concentrate Flow' },
    ],
  },
  'RO5-InterstagePress': {
    equipment: 'RO5 - InterstagePress',
    rules: [
      { type: 'high', direction: 'high', value: 10, clear: 9.3, severity: 'Medium', message: 'High Interstage Pressure' },
    ],
  },
  'RO5-ConcetratePress': {
    equipment: 'RO5 - ConcetratePress',
    rules: [
      { type: 'high', direction: 'high', value: 8, clear: 7.4, severity: 'Low', message: 'High Concentrate Pressure' },
    ],
  },
};

// ==================== MQTT ALARM DEFINITIONS ====================
// These correspond to the PLC bits from your MQTT data:
// HighPrefilterDeltaP, PowerProblem, HighMediaDeltaP, S2DeltaHigh,
// S1DeltaHigh, HighROPressure, FeedTankLow

export const MQTT_ALARMS = [
  {
    id: 'RO5-HighPrefilterDeltaP',
    sensorKey: 'RO5-HighPrefilterDeltaP',
    equipment: 'RO5 - Prefilter',
    severity: 'Critical',
    message: 'High Prefilter Delta P - Prefilter Blocked',
    description: 'Prefilter is blocked and needs immediate cleaning or replacement',
  },
  {
    id: 'RO5-PowerProblem',
    sensorKey: 'RO5-PowerProblem',
    equipment: 'RO5 - Power System',
    severity: 'Critical',
    message: 'Power Problem - System Offline',
    description: 'Power supply issue detected. System may be offline.',
    isPowerProblem: true,
  },
  {
    id: 'RO5-HighMediaDeltaP',
    sensorKey: 'RO5-HighMediaDeltaP',
    equipment: 'RO5 - Media Filter',
    severity: 'Critical',
    message: 'High Media Filter Delta P',
    description: 'Media filter differential pressure is too high. Filter may be clogged.',
  },
  {
    id: 'RO5-S2DeltaHigh',
    sensorKey: 'RO5-S2DeltaHigh',
    equipment: 'RO5 - Stage 2',
    severity: 'High',
    message: 'Stage 2 Delta P High',
    description: 'Stage 2 differential pressure has exceeded the acceptable limit.',
  },
  {
    id: 'RO5-S1DeltaHigh',
    sensorKey: 'RO5-S1DeltaHigh',
    equipment: 'RO5 - Stage 1',
    severity: 'High',
    message: 'Stage 1 Delta P High',
    description: 'Stage 1 differential pressure has exceeded the acceptable limit.',
  },
  {
    id: 'RO5-HighROPressure',
    sensorKey: 'RO5-HighROPressure',
    equipment: 'RO5 - RO System',
    severity: 'Critical',
    message: 'High RO Pressure',
    description: 'RO system pressure is dangerously high. Immediate action required.',
  },
  {
    id: 'RO5-FeedTankLow',
    sensorKey: 'RO5-FeedTankLow',
    equipment: 'RO5 - Feed Tank',
    severity: 'Critical',
    message: 'Feed Tank Low Level',
    description: 'Feed tank level is critically low. Refill required immediately.',
  },
];

// ==================== CORE EVALUATION ====================

/**
 * Evaluate every canonical sensor-threshold rule and the standing binary
 * status rules against the current live readings.
 *
 * @param {(key: string) => any} getValue - from DataContext
 * @param {Set<string>} previousActiveIds - rule IDs that were active last
 *   time this ran, used for hysteresis (so a value sitting right on the
 *   line doesn't flicker in and out).
 * @returns {Array<Candidate>} every rule's current state (active or not)
 */
export function evaluateSensorAlerts(getValue, previousActiveIds = new Set()) {
  const candidates = [];

  const push = (id, active, meta) => candidates.push({ id, active, source: 'sensor', ...meta });

  // -------------------- MQTT Alarm Rules --------------------
  // Evaluate each MQTT alarm bit. When the bit is ON (active), trigger the alert.
  // When OFF, the alert clears automatically.
  
  MQTT_ALARMS.forEach((alarm) => {
    const value = getValue(alarm.sensorKey);
    const isAlarmActive = isActive(value);
    
    push(alarm.id, isAlarmActive, {
      sensorKey: alarm.sensorKey,
      severity: alarm.severity,
      message: alarm.message,
      equipment: alarm.equipment,
      value: isAlarmActive ? 'ON' : 'OFF',
      threshold: 'ON',
      isPowerProblem: alarm.isPowerProblem || false,
      description: alarm.description,
    });
  });

  // -------------------- Binary / status rules --------------------
  const systemOperation = getValue('RO5-SystemOperation');
  const isSystemOn = isActive(systemOperation);

  const systemMode = getValue('RO5-SystemMode');
  const isAutoMode = isActive(systemMode);
  push('RO5-SystemMode:manual', isSystemOn && !isAutoMode, {
    sensorKey: 'RO5-SystemMode',
    severity: 'High',
    message: 'System in Manual Mode',
    equipment: 'RO5 - SystemMode',
    value: toDisplayString(systemMode),
    threshold: 'Auto mode required',
  });

  const dosingActive = getValue('RO5-AntiscalantDosingActive');
  const isDosingActive = isActive(dosingActive);
  push('RO5-AntiscalantDosingActive:stopped', isSystemOn && !isDosingActive, {
    sensorKey: 'RO5-AntiscalantDosingActive',
    severity: 'High',
    message: 'Antiscalant Dosing Stopped',
    equipment: 'RO5 - AntiscalantDosingActive',
    value: toDisplayString(dosingActive),
    threshold: 'Running required',
  });

  // -------------------- Numeric threshold rules (with hysteresis) --------------------
  Object.entries(THRESHOLDS).forEach(([sensorKey, config]) => {
    const raw = getValue(sensorKey);
    if (raw === undefined || raw === null) return;
    const value = toNumber(raw);

    config.rules.forEach((rule) => {
      const id = `${sensorKey}:${rule.type}`;
      const wasActive = previousActiveIds.has(id);
      const isHigh = rule.direction === 'high';

      const nowActive = wasActive
        ? (isHigh ? value > rule.clear : value < rule.clear)
        : (isHigh ? value > rule.value : value < rule.value);

      push(id, nowActive, {
        sensorKey,
        severity: rule.severity,
        message: rule.message,
        equipment: config.equipment,
        value: toDisplayString(value, sensorKey === 'RO5-PureWaterEc' ? 0 : sensorKey.includes('Delta') ? 2 : 1),
        threshold: `${isHigh ? '>' : '<'} ${rule.value}`,
      });
    });
  });

  // -------------------- Calculated rules --------------------
  const feedFlow = toNumber(getValue('RO5-FEEDFlow'));
  const permeateFlow = toNumber(getValue('RO5-Permeateflow'));
  const concentrateFlow = toNumber(getValue('RO5-ConcetrateFlow'));
  const massBalance = Math.abs(feedFlow - (permeateFlow + concentrateFlow));
  push('calc-mass-balance', feedFlow > 0 && massBalance > 5, {
    sensorKey: 'calc-mass-balance',
    severity: 'Medium',
    message: 'Mass Balance Error',
    equipment: 'RO5 - Mass Balance',
    value: toDisplayString(massBalance),
    threshold: '< 5 m³/h',
  });

  push('RO5-Permeateflow:low-production', isSystemOn && permeateFlow > 0 && permeateFlow < 20, {
    sensorKey: 'RO5-Permeateflow',
    severity: 'Medium',
    message: 'Low Permeate Production',
    equipment: 'RO5 - Permeateflow',
    value: toDisplayString(permeateFlow),
    threshold: '> 20 m³/h',
  });

  return candidates;
}

// ==================== MERGE / ACKNOWLEDGMENT-PRESERVING LOGIC ====================

/**
 * Merge freshly-evaluated candidates against the previous alert list.
 */
export function mergeAlerts(candidates, previousAlerts = []) {
  const prevById = new Map(previousAlerts.map((a) => [a.id, a]));
  const nowIso = new Date().toISOString();
  const merged = [];
  const events = [];

  candidates.forEach((c) => {
    const prev = prevById.get(c.id);

    if (c.active) {
      if (prev) {
        // Still firing — keep its status
        merged.push({ 
          ...prev, 
          value: c.value, 
          threshold: c.threshold, 
          lastSeen: nowIso,
          // Update description if it exists
          description: c.description || prev.description,
        });
      } else {
        // Brand new trigger
        const alert = {
          id: c.id,
          type: c.message,
          severity: c.severity,
          status: 'Active',
          equipment: c.equipment,
          value: c.value,
          threshold: c.threshold,
          source: c.source,
          isPowerProblem: !!c.isPowerProblem,
          description: c.description || '',
          firstTriggered: nowIso,
          lastSeen: nowIso,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
        };
        merged.push(alert);
        events.push({ 
          id: `${c.id}-trig-${Date.now()}`, 
          alertId: c.id, 
          kind: 'triggered', 
          type: c.message, 
          severity: c.severity, 
          time: nowIso,
          description: c.description || '',
        });
      }
    } else if (prev) {
      // Was active, now cleared
      events.push({ 
        id: `${c.id}-clear-${Date.now()}`, 
        alertId: c.id, 
        kind: 'cleared', 
        type: c.message, 
        severity: c.severity, 
        time: nowIso 
      });
    }
  });

  return { alerts: merged, events };
}

// Export MQTT_ALARMS for use in other components
export const getMQTTAlarmDescriptions = () => {
  return MQTT_ALARMS.reduce((acc, alarm) => {
    acc[alarm.id] = alarm.description;
    return acc;
  }, {});
};