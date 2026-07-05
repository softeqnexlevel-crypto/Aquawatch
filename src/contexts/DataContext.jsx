// src/contexts/DataContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const DataContext = createContext();

const API_BASE_URL = 'http://localhost:4000/api';

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
  'siemens200smart-RO5-AntiscalantDosingActive': 'RO5-AntiscalantDosingActive',
};

export const DataProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState({});
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('✅ Connected to backend');
      setConnected(true);
      fetchInitialData();
    });

    socket.on('plc-data', (newData) => {
      const rawKey = newData.parameter;
      const key = KEY_MAPPING[rawKey] || rawKey;
      
      setSensorData(prev => ({
        ...prev,
        [key]: {
          value: newData.value,
          timestamp: newData.timestamp,
          unit: newData.unit || getUnitForParameter(key),
        }
      }));

      setHistory(prev => {
        const currentHistory = prev[key] || [];
        const newHistory = [...currentHistory, {
          time: new Date(newData.timestamp),
          value: newData.value
        }];
        return {
          ...prev,
          [key]: newHistory.slice(-500)
        };
      });

      setLastUpdate(newData.timestamp);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from backend');
      setConnected(false);
    });

    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/current`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const readings = await response.json();
        
        const formattedData = {};
        Object.entries(readings).forEach(([rawKey, value]) => {
          const key = KEY_MAPPING[rawKey] || rawKey;
          formattedData[key] = {
            value: value,
            timestamp: new Date().toISOString(),
            unit: getUnitForParameter(key)
          };
        });
        setSensorData(formattedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    return () => socket.disconnect();
  }, []);

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

  // Helper to get value by key
  const getValue = (key) => {
    return sensorData[key]?.value ?? 0;
  };

  // Helper to get history by key
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
      getHistory
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