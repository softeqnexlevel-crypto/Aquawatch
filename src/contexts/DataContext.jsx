// frontend/src/contexts/DataContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

const DataContext = createContext();

// ── History tuning ─────────────────────────────────────────────────────────
const MAX_HISTORY_POINTS = 2000;       // per sensor (~5.5 h at 10 s sampling)
const HEARTBEAT_MS = 10_000;           // sample-and-hold interval while connected
const FALLBACK_POLL_MS = 30_000;       // /api/current polling while socket is down

// Map backend keys to frontend keys
const KEY_MAPPING = {
  'siemens200smart-RO5-FEEDFlow': 'RO5-FEEDFlow',
  'siemens200smart-RO5-Permeateflow': 'RO5-Permeateflow',
  'siemens200smart-RO5-ConcetrateFlow': 'RO5-ConcetrateFlow',
  'siemens200smart-RO5-ROPressure': 'RO5-ROPressure',
  'siemens200smart-RO5-InterstagePress': 'RO5-InterstagePress',
  'siemens200smart-RO5-ConcetratePress': 'RO5-ConcetratePress',
  'siemens200smart-RO5-Stage1Delta': 'RO5-Stage1Delta',
  'siemens200smart-RO5-Stage2Delta': 'RO5-Stage2Delta',
  'siemens200smart-RO5-MediaFilterInPress': 'RO5-MediaFilterInPress',
  'siemens200smart-RO5-MediaFilterOutPress': 'RO5-MediaFilterOutPress',
  'siemens200smart-RO5-MediaFilterDeltaP': 'RO5-MediaFilterDeltaP',
  'siemens200smart-RO5-SystemRecovery': 'RO5-SystemRecovery',
  'siemens200smart-RO5-PureWaterEc': 'RO5-PureWaterEc',
  'siemens200smart-RO5-FeedTankLevel': 'RO5-FeedTankLevel',

  // Raw (uncalibrated) transmitter signal, 4.9-10.0. The correct
  // percentage is derived from this on the frontend via
  // dashboardComponents/feedTankCalibration.js — see that file for why.
  'siemens200smart-RO5-FeedTankLevelRaw': 'RO5-FeedTankLevelRaw',
  'RO5-FeedTankLevelRaw': 'RO5-FeedTankLevelRaw',

  'RO5-Feedpump': 'RO5-Feedpump',
  'siemens200smart-RO5-Feedpump': 'RO5-Feedpump',

  'RO5-PrefilterBackwash': 'RO5-PrefilterBackwash',
  'siemens200smart-RO5-PrefilterBackwash': 'RO5-PrefilterBackwash',

  'RO5-PrefilterBackwashing': 'RO5-PrefilterBackwashing',
  'siemens200smart-RO5-PrefilterBackwashing': 'RO5-PrefilterBackwashing',

  'siemens200smart-RO5-SystemOperation': 'RO5-SystemOperation',
  'RO5-SystemOperation': 'RO5-SystemOperation',
  'RO5-SystemOn': 'RO5-SystemOperation',
  'siemens200smart-RO5-SystemOn': 'RO5-SystemOperation',
  'SystemOperation': 'RO5-SystemOperation',

  'siemens200smart-RO5-SystemMode': 'RO5-SystemMode',
  'RO5-SystemMode': 'RO5-SystemMode',
  'SystemMode': 'RO5-SystemMode',

  // ✅ ANTISCALANT DOSER MAPPINGS
  'siemens200smart-RO5-AntiscalantDosingActive': 'RO5-AntiscalantDosingActive',
  'RO5-AntiscalantDoser': 'RO5-AntiscalantDosingActive',
  'siemens200smart-RO5-AntiscalantDoser': 'RO5-AntiscalantDosingActive',
  'RO5-AntiscalantDosingActive': 'RO5-AntiscalantDosingActive',
  'AntiscalantDoser': 'RO5-AntiscalantDosingActive',
  'AntiscalantDosingActive': 'RO5-AntiscalantDosingActive',
  'RO5/AntiscalantDoser': 'RO5-AntiscalantDosingActive',

  // ✅ ANTISCALANT DAILY TOTAL (PLC-reported)
  'siemens200smart-RO5-AntiscalantDaily': 'RO5-AntiscalantDaily',
  'RO5-AntiscalantDaily': 'RO5-AntiscalantDaily',
  'AntiscalantDaily': 'RO5-AntiscalantDaily',

  // ✅ SYSTEM RUN HOURS
  'siemens200smart-RO5-SystemRunhrs': 'RO5-SystemRunhrs',
  'RO5-SystemRunhrs': 'RO5-SystemRunhrs',
  'SystemRunhrs': 'RO5-SystemRunhrs',

  // ✅ SYSTEM ACTIVE (master ON/OFF signal — must NOT be collapsed into
  // RO5-SystemOperation. It was previously mapped to that key, which meant
  // getValue('RO5-SystemActive') in Dashboard.jsx always fell back to 0
  // (undefined -> isActive(0) -> false), forcing the dashboard to show
  // "OFF" permanently regardless of the PLC's real state, and the two
  // tags silently overwrote each other in sensorData on every message.
  'RO5-SystemActive': 'RO5-SystemActive',
  'siemens200smart-RO5-SystemActive': 'RO5-SystemActive',
  'SystemActive': 'RO5-SystemActive',

  'RO5-HighPrefilterDeltaP': 'RO5-HighPrefilterDeltaP',
  'RO5-PowerProblem': 'RO5-PowerProblem',
  'RO5-HighMediaDeltaP': 'RO5-HighMediaDeltaP',
  'RO5-S2DeltaHigh': 'RO5-S2DeltaHigh',
  'RO5-S1DeltaHigh': 'RO5-S1DeltaHigh',
  'RO5-HighROPressure': 'RO5-HighROPressure',
  'RO5-FeedTankLow': 'RO5-FeedTankLow',
};

const getUnitForParameter = (param) => {
  const units = {
    'RO5-FEEDFlow': 'm³/h',
    'RO5-Permeateflow': 'm³/h',
    'RO5-ConcetrateFlow': 'm³/h',
    'RO5-ROPressure': 'bar',
    'RO5-InterstagePress': 'bar',
    'RO5-ConcetratePress': 'bar',
    'RO5-Stage1Delta': 'bar',
    'RO5-Stage2Delta': 'bar',
    'RO5-MediaFilterInPress': 'bar',
    'RO5-MediaFilterOutPress': 'bar',
    'RO5-MediaFilterDeltaP': 'bar',
    'RO5-SystemRecovery': '%',
    'RO5-PureWaterEc': 'µS/cm',
    'RO5-FeedTankLevel': '%',
    'RO5-FeedTankLevelRaw': '',
    'RO5-SystemActive': '',
    'RO5-SystemOperation': '',
    'RO5-SystemMode': '',
    'RO5-AntiscalantDosingActive': '',
    'RO5-AntiscalantDaily': 'ml',
    'RO5-SystemRunhrs': 'hrs',
  };
  return units[param] || '';
};

/**
 * Normalize Antiscalant Doser value to ON/OFF
 * Handles: 1, true, "1", "true", "ON", "on" → "ON"
 *          0, false, "0", "false", "OFF", "off" → "OFF"
 */
const normalizeAntiscalantValue = (value) => {
  if (value === undefined || value === null) return 'OFF';

  if (typeof value === 'string') {
    const normalized = value.toUpperCase().trim();
    if (normalized === 'ON' || normalized === 'TRUE' || normalized === '1') return 'ON';
    if (normalized === 'OFF' || normalized === 'FALSE' || normalized === '0') return 'OFF';
    return 'OFF';
  }

  if (typeof value === 'boolean') return value ? 'ON' : 'OFF';
  if (typeof value === 'number') return value === 1 ? 'ON' : 'OFF';

  return 'OFF';
};

/**
 * Converts a sensor value into something chartable, or null if it isn't
 * chartable. Numbers and numeric strings pass through, ON/OFF-style flags
 * become 1/0, and text states such as "FILTER" are skipped.
 */
const toHistoryNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const v = value.trim().toUpperCase();
    if (v === 'ON' || v === 'TRUE') return 1;
    if (v === 'OFF' || v === 'FALSE') return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

/**
 * Appends points to the history map without mutating it.
 * entries: [[key, rawValue, Date], ...]
 */
const appendHistory = (prev, entries) => {
  const next = { ...prev };
  entries.forEach(([key, rawValue, time]) => {
    const value = toHistoryNumber(rawValue);
    if (value === null) return;
    const arr = next[key] || [];
    const last = arr[arr.length - 1];
    if (last && new Date(last.time).getTime() === time.getTime()) return; // de-dupe
    next[key] = [...arr, { time, value }].slice(-MAX_HISTORY_POINTS);
  });
  return next;
};

export const DataProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState({});
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connected, setConnected] = useState(false);

  // Refs so long-lived intervals always see current values
  // (a plain `connected` inside the interval was stuck at its initial false).
  const sensorDataRef = useRef(sensorData);
  const connectedRef = useRef(connected);
  sensorDataRef.current = sensorData;
  connectedRef.current = connected;

  const fetchInitialData = async () => {
    try {
      setLoading(true); // so the Dashboard "Refresh" button visibly shows a loading state
      const response = await fetch(`${API_BASE_URL}/api/current`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch data`);
      const readings = await response.json();

      const now = new Date();
      const formattedData = {};
      Object.entries(readings).forEach(([rawKey, value]) => {
        const key = KEY_MAPPING[rawKey] || rawKey;

        let finalValue = value;
        if (key === 'RO5-AntiscalantDosingActive' || rawKey.includes('Antiscalant')) {
          // Only normalize the ON/OFF bit — not the daily total, which is
          // a numeric ml value, not a boolean state.
          if (key !== 'RO5-AntiscalantDaily') {
            finalValue = normalizeAntiscalantValue(value);
          }
        }

        formattedData[key] = {
          value: finalValue,
          timestamp: now.toISOString(),
          unit: getUnitForParameter(key),
        };
      });

      // Merge instead of replace, so keys that arrived over the socket but
      // are missing from /api/current aren't wiped out.
      setSensorData((prev) => ({ ...prev, ...formattedData }));

      // Seed history so charts have a starting point immediately.
      setHistory((prev) =>
        appendHistory(
          prev,
          Object.entries(formattedData).map(([key, d]) => [key, d.value, now])
        )
      );

      setLoading(false);
      setError(null);
      setLastUpdate(now.toISOString());
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ DataContext connected to backend');
      setConnected(true);
      connectedRef.current = true;
      fetchInitialData();
    });

    socket.on('plc-data', (newData) => {
      const rawKey = newData.parameter;
      const key = KEY_MAPPING[rawKey] || rawKey;
      const timestamp = newData.timestamp || new Date().toISOString();

      let value = newData.value;
      if ((key === 'RO5-AntiscalantDosingActive' || rawKey.includes('Antiscalant')) && key !== 'RO5-AntiscalantDaily') {
        value = normalizeAntiscalantValue(newData.value);
      }

      setSensorData((prev) => ({
        ...prev,
        [key]: {
          value,
          timestamp,
          unit: newData.unit || getUnitForParameter(key),
          simulated: newData.simulated || false,
        },
      }));

      setHistory((prev) => appendHistory(prev, [[key, value, new Date(timestamp)]]));

      setLastUpdate(timestamp);
    });

    socket.on('disconnect', () => {
      console.log('❌ DataContext disconnected from backend');
      setConnected(false);
      connectedRef.current = false;
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to backend via WebSocket');
      fetchInitialData();
    });

    // Fallback polling: only while the socket is down.
    const pollInterval = setInterval(() => {
      if (!connectedRef.current) fetchInitialData();
    }, FALLBACK_POLL_MS);

    // Heartbeat: PLCs often emit only on change, so a steady signal would
    // otherwise leave a single point. While connected, record the latest
    // value of every chartable sensor on a fixed cadence (sample-and-hold).
    const heartbeatInterval = setInterval(() => {
      if (!connectedRef.current) return; // never fabricate points while offline
      const now = new Date();
      const entries = Object.entries(sensorDataRef.current).map(([key, d]) => [key, d?.value, now]);
      if (entries.length === 0) return;
      setHistory((prev) => appendHistory(prev, entries));
    }, HEARTBEAT_MS);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getValue = (key) => {
    const value = sensorData[key]?.value;
    if (key === 'RO5-AntiscalantDosingActive') {
      return value !== undefined && value !== null ? value : 'OFF';
    }
    return value !== undefined && value !== null ? value : 0;
  };

  const getHistory = (key) => history[key] || [];

  return (
    <DataContext.Provider
      value={{
        sensorData,
        history,
        loading,
        error,
        lastUpdate,
        connected,
        getValue,
        getHistory,
        refresh: fetchInitialData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};