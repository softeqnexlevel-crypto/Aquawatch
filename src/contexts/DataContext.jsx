// frontend/src/contexts/DataContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

const DataContext = createContext();

// No live PLC message for this long = the feed is considered dead.
// (Analog tags such as flow change constantly, so 60 s is generous.)
const LIVE_TIMEOUT_MS = 60000;

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
  'RO5-SystemActive': 'RO5-SystemOperation',
  'siemens200smart-RO5-SystemActive': 'RO5-SystemOperation',

  'siemens200smart-RO5-SystemMode': 'RO5-SystemMode',
  'RO5-SystemMode': 'RO5-SystemMode',
  'SystemMode': 'RO5-SystemMode',

  // ANTISCALANT DOSER MAPPINGS
  'siemens200smart-RO5-AntiscalantDosingActive': 'RO5-AntiscalantDosingActive',
  'RO5-AntiscalantDoser': 'RO5-AntiscalantDosingActive',
  'siemens200smart-RO5-AntiscalantDoser': 'RO5-AntiscalantDosingActive',
  'RO5-AntiscalantDosingActive': 'RO5-AntiscalantDosingActive',
  'AntiscalantDoser': 'RO5-AntiscalantDosingActive',
  'AntiscalantDosingActive': 'RO5-AntiscalantDosingActive',
  'RO5/AntiscalantDoser': 'RO5-AntiscalantDosingActive',

  'RO5-HighPrefilterDeltaP': 'RO5-HighPrefilterDeltaP',
  'RO5-PowerProblem': 'RO5-PowerProblem',
  'RO5-HighMediaDeltaP': 'RO5-HighMediaDeltaP',
  'RO5-S2DeltaHigh': 'RO5-S2DeltaHigh',
  'RO5-S1DeltaHigh': 'RO5-S1DeltaHigh',
  'RO5-HighROPressure': 'RO5-HighROPressure',
  'RO5-FeedTankLow': 'RO5-FeedTankLow',
};

// Equipment/flow tags that must read as stopped when the feed is dead or the
// plant itself reports "not operating". Pressures, levels and EC are NOT in
// this list: they keep their last value (use `isLive` to mark them stale).
const RUN_GATED = new Set([
  'RO5-FEEDFlow',
  'RO5-Permeateflow',
  'RO5-ConcetrateFlow',
  'RO5-Feedpump',
  'RO5-AntiscalantDosingActive',
]);

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
    'RO5-SystemOperation': '',
    'RO5-SystemMode': '',
    'RO5-AntiscalantDosingActive': '',
  };
  return units[param] || '';
};

// Generic "is this status value ON?" (booleans, 1/0, "ON", "RUNNING", ...)
const isTruthyStatus = (raw) => {
  if (raw === true) return true;
  if (raw === false || raw === null || raw === undefined) return false;
  if (typeof raw === 'number') return raw !== 0;
  const s = String(raw).trim().toUpperCase();
  if (['ON', 'TRUE', 'RUN', 'RUNNING', 'ACTIVE', 'YES'].includes(s)) return true;
  const n = Number(s);
  return s !== '' && Number.isFinite(n) ? n !== 0 : false;
};

/** Normalize Antiscalant Doser value to 'ON' / 'OFF' */
const normalizeAntiscalantValue = (value) => (isTruthyStatus(value) ? 'ON' : 'OFF');

export const DataProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState({});
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null); // LIVE messages only
  const [connected, setConnected] = useState(false);
  const [liveFresh, setLiveFresh] = useState(true);   // true during the grace period after mount

  const connectedRef = useRef(false);
  const lastLiveAtRef = useRef(Date.now());

  // Snapshot from the backend cache. It is NOT live data: it never resets the
  // freshness clock and never overwrites values received live.
  const fetchInitialData = async (opts) => {
    const silent = opts && opts.silent === true; // (a click event has no .silent)
    try {
      if (!silent) setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/current`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch data`);
      const readings = await response.json();

      const formattedData = {};
      Object.entries(readings).forEach(([rawKey, value]) => {
        const key = KEY_MAPPING[rawKey] || rawKey;
        const finalValue = key === 'RO5-AntiscalantDosingActive' || rawKey.includes('Antiscalant')
          ? normalizeAntiscalantValue(value)
          : value;
        formattedData[key] = {
          value: finalValue,
          timestamp: new Date().toISOString(),
          unit: getUnitForParameter(key),
          snapshot: true,
        };
      });

      console.log('🔍 SystemOperation snapshot value:', formattedData['RO5-SystemOperation']?.value,
        '(undefined = raw key not in KEY_MAPPING; raw keys:', Object.keys(readings), ')');

      setSensorData((prev) => {
        const next = { ...formattedData };
        // keep anything already received live
        Object.entries(prev).forEach(([k, v]) => { if (!v.snapshot) next[k] = v; });
        return next;
      });
      setLoading(false);
      setError(null);
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
      reconnectionAttempts: Infinity, // never give up
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('✅ DataContext connected to backend');
      connectedRef.current = true;
      lastLiveAtRef.current = Date.now(); // grace period after (re)connecting
      setLiveFresh(true);
      setConnected(true);
      setError(null);
      fetchInitialData({ silent: true });
    });

    socket.on('plc-data', (newData) => {
      const rawKey = newData && newData.parameter;
      if (!rawKey) return;
      const key = KEY_MAPPING[rawKey] || rawKey;
      const timestamp = newData.timestamp || new Date().toISOString();

      let value = newData.value;
      if (key === 'RO5-AntiscalantDosingActive' || String(rawKey).includes('Antiscalant')) {
        value = normalizeAntiscalantValue(newData.value);
      }

      // Freshness is measured by WHEN WE RECEIVED the message (browser clock),
      // so a wrong PLC/server clock can't make dead data look alive.
      lastLiveAtRef.current = Date.now();
      setLiveFresh(true);

      setSensorData((prev) => ({
        ...prev,
        [key]: {
          value,
          timestamp,
          unit: newData.unit || getUnitForParameter(key),
          simulated: newData.simulated || false,
        },
      }));

      setHistory((prev) => {
        const currentHistory = prev[key] || [];
        const newHistory = [...currentHistory, { time: new Date(timestamp), value }];
        return { ...prev, [key]: newHistory.slice(-500) };
      });

      setLastUpdate(timestamp);
    });

    socket.on('disconnect', () => {
      console.log('❌ DataContext disconnected from backend');
      connectedRef.current = false;
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      connectedRef.current = false;
      setError('Failed to connect to backend via WebSocket');
    });

    // Every 5 s: has the live feed gone quiet?
    const liveCheck = setInterval(() => {
      setLiveFresh(Date.now() - lastLiveAtRef.current < LIVE_TIMEOUT_MS);
    }, 5000);

    // While the socket is down, keep a (non-live) snapshot for the non-gated tags
    const poll = setInterval(() => {
      if (!connectedRef.current) fetchInitialData({ silent: true });
    }, 30000);

    return () => {
      socket.disconnect();
      clearInterval(liveCheck);
      clearInterval(poll);
    };
  }, []);

  // ── Derived state ────────────────────────────────────────────────────────
  const isLive = connected && liveFresh;

  // null = the plant never sent a SystemOperation tag (unknown → don't gate on it)
  const sysEntry = sensorData['RO5-SystemOperation'];
  const systemOn = sysEntry === undefined ? null : isTruthyStatus(sysEntry.value);

  const getValue = (key) => {
    const isDoser = key === 'RO5-AntiscalantDosingActive';
    const offValue = isDoser ? 'OFF' : 0;

    // Feed dead, or the plant says it is not operating → gated equipment is OFF
    if (RUN_GATED.has(key) && (!isLive || systemOn === false)) return offValue;

    const value = sensorData[key]?.value;
    return value !== undefined && value !== null ? value : offValue;
  };

  const getHistory = (key) => history[key] || [];

  return (
    <DataContext.Provider value={{
      sensorData,
      history,
      loading,
      error,
      lastUpdate,
      connected,
      isLive,     // true only if connected AND a live message arrived in the last 60 s
      systemOn,   // true / false / null (unknown)
      getValue,
      getHistory,
      refresh: fetchInitialData,
    }}>
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