// frontend/src/contexts/DataContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

const DataContext = createContext();

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


  'RO5-SystemActive': 'RO5-SystemOperation',
'siemens200smart-RO5-SystemActive': 'RO5-SystemOperation',

'RO5-Feedpump': 'RO5-Feedpump',
'siemens200smart-RO5-Feedpump': 'RO5-Feedpump',
'RO5-PrefilterBackwash': 'RO5-PrefilterBackwash',
'siemens200smart-RO5-PrefilterBackwash': 'RO5-PrefilterBackwash',
'RO5-PrefilterBackwashing': 'RO5-PrefilterBackwashing',

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
    'RO5-SystemOperation': '',
    'RO5-SystemMode': '',
    'RO5-AntiscalantDosingActive': '',
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

export const DataProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState({});
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connected, setConnected] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true); // ✅ so the Dashboard "Refresh" button visibly shows a loading state again
      const response = await fetch(`${API_BASE_URL}/api/current`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch data`);
      const readings = await response.json();

      console.log('📊 Fetched readings (raw backend keys):', readings);
      console.log('📊 Raw keys list:', Object.keys(readings));

      const formattedData = {};
      Object.entries(readings).forEach(([rawKey, value]) => {
        let key = KEY_MAPPING[rawKey] || rawKey;

        let finalValue = value;
        if (key === 'RO5-AntiscalantDosingActive' || rawKey.includes('Antiscalant')) {
          finalValue = normalizeAntiscalantValue(value);
          console.log(`🔍 Antiscalant normalized: ${rawKey} → ${key} = ${value} → ${finalValue}`);
        }

        formattedData[key] = {
          value: finalValue,
          timestamp: new Date().toISOString(),
          unit: getUnitForParameter(key)
        };
      });

      console.log('📊 Formatted sensor data keys:', Object.keys(formattedData));
      console.log('🔍 SystemOperation value:', formattedData['RO5-SystemOperation']?.value, '(undefined here means the raw key from your backend is not yet in KEY_MAPPING — check the raw keys list above)');
      console.log('🔍 Antiscalant value:', formattedData['RO5-AntiscalantDosingActive']?.value);

      setSensorData(formattedData);
      setLoading(false);
      setError(null);
      setLastUpdate(new Date().toISOString());
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
      fetchInitialData();
    });

    socket.on('plc-data', (newData) => {
      const rawKey = newData.parameter;
      let key = KEY_MAPPING[rawKey] || rawKey;
      const timestamp = newData.timestamp || new Date().toISOString();

      let value = newData.value;
      if (key === 'RO5-AntiscalantDosingActive' || rawKey.includes('Antiscalant')) {
        value = normalizeAntiscalantValue(newData.value);
      }

      setSensorData(prev => ({
        ...prev,
        [key]: {
          value: value,
          timestamp: timestamp,
          unit: newData.unit || getUnitForParameter(key),
          simulated: newData.simulated || false
        }
      }));

      setHistory(prev => {
        const currentHistory = prev[key] || [];
        const newHistory = [...currentHistory, {
          time: new Date(timestamp),
          value: value
        }];
        return {
          ...prev,
          [key]: newHistory.slice(-500)
        };
      });

      setLastUpdate(timestamp);
    });

    socket.on('disconnect', () => {
      console.log('❌ DataContext disconnected from backend');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to backend via WebSocket');
      fetchInitialData();
    });

    const interval = setInterval(() => {
      if (!connected) {
        fetchInitialData();
      }
    }, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const getValue = (key) => {
    const value = sensorData[key]?.value;
    if (key === 'RO5-AntiscalantDosingActive') {
      return value !== undefined && value !== null ? value : 'OFF';
    }
    return value !== undefined && value !== null ? value : 0;
  };

  const getHistory = (key) => {
    return history[key] || [];
  };

  return (
    <DataContext.Provider value={{
      sensorData,
      history,
      loading,
      error,
      lastUpdate,
      connected,
      getValue,
      getHistory,
      refresh: fetchInitialData
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