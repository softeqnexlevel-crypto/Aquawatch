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
  'siemens200smart-RO5-SystemOperation': 'RO5-SystemOperation',
  'siemens200smart-RO5-SystemMode': 'RO5-SystemMode',
  
  // ✅ ANTISCALANT DOSER MAPPINGS
  'siemens200smart-RO5-AntiscalantDosingActive': 'RO5-AntiscalantDosingActive',
  'RO5-AntiscalantDoser': 'RO5-AntiscalantDosingActive',
  'siemens200smart-RO5-AntiscalantDoser': 'RO5-AntiscalantDosingActive',
  'RO5-AntiscalantDosingActive': 'RO5-AntiscalantDosingActive',
  'AntiscalantDoser': 'RO5-AntiscalantDosingActive',
  'AntiscalantDosingActive': 'RO5-AntiscalantDosingActive',
  'RO5/AntiscalantDoser': 'RO5-AntiscalantDosingActive',
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
  
  // If it's already a string "ON" or "OFF"
  if (typeof value === 'string') {
    const normalized = value.toUpperCase().trim();
    if (normalized === 'ON' || normalized === 'TRUE' || normalized === '1') return 'ON';
    if (normalized === 'OFF' || normalized === 'FALSE' || normalized === '0') return 'OFF';
    // If it's any other string, treat as OFF
    return 'OFF';
  }
  
  // If it's a boolean
  if (typeof value === 'boolean') {
    return value ? 'ON' : 'OFF';
  }
  
  // If it's a number
  if (typeof value === 'number') {
    return value === 1 ? 'ON' : 'OFF';
  }
  
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
      const response = await fetch(`${API_BASE_URL}/api/current`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch data`);
      const readings = await response.json();
      
      console.log('📊 Fetched readings:', readings);
      
      const formattedData = {};
      Object.entries(readings).forEach(([rawKey, value]) => {
        // Try to find the key in KEY_MAPPING
        let key = KEY_MAPPING[rawKey] || rawKey;
        
        // ✅ Special handling for Antiscalant - normalize the value
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
      console.log('🔍 Antiscalant value:', formattedData['RO5-AntiscalantDosingActive']?.value);
      
      setSensorData(formattedData);
      setLoading(false);
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
      
      // ✅ Special handling for Antiscalant - normalize the value
      let value = newData.value;
      if (key === 'RO5-AntiscalantDosingActive' || rawKey.includes('Antiscalant')) {
        value = normalizeAntiscalantValue(newData.value);
        console.log(`🔴 Antiscalant received: ${rawKey} → ${key} = ${newData.value} → ${value}`);
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
    // If value is undefined or null, return 0 for numeric or 'OFF' for Antiscalant
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