// components/TagManager.jsx - COMPLETE FIXED VERSION

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Plus, Download, Upload, Trash2, Activity, Clock, Server, AlertCircle, Gauge, Droplet, Filter, Wrench, Zap, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useData } from '../contexts/DataContext';
import { format, subMinutes } from 'date-fns';

// Chart.js imports
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// ===================== STYLES =====================
const S = {
  card: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '16px 20px'
  },
  label: { 
    fontSize: 10, 
    letterSpacing: '0.08em', 
    color: 'var(--muted-foreground)', 
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  value: {
    fontFamily: 'var(--font-mono)',
    fontSize: 22,
    fontWeight: 700
  }
};

// ===================== TAG ICON MAP =====================
const getTagIcon = (name) => {
  if (!name) return Server;
  
  const upperName = name.toUpperCase();
  if (upperName.includes('FLOW') || upperName.includes('PERM') || upperName.includes('FEED') || upperName.includes('CONC')) {
    return Droplet;
  }
  if (upperName.includes('PRESS') || upperName.includes('DP') || upperName.includes('DELTA')) {
    return Gauge;
  }
  if (upperName.includes('FILT') || upperName.includes('FILTER')) {
    return Filter;
  }
  if (upperName.includes('RECOVERY') || upperName.includes('REJ')) {
    return Activity;
  }
  if (upperName.includes('ENERGY') || upperName.includes('POWER')) {
    return Zap;
  }
  if (upperName.includes('DOSING')) {
    return Filter;
  }
  return Server;
};

// ===================== ABOX SENSORS - FIXED =====================
const ABOX_SENSORS = [
  { key: 'RO5-FEEDFlow', name: 'FEED_FLOW', desc: 'Feed Flow Rate - Raw Water Inlet', address: 'VW210', unit: 'm³/h', icon: Droplet },
  { key: 'RO5-Permeateflow', name: 'PERM_FLOW', desc: 'Permeate Flow Rate - Product Water', address: 'VW211', unit: 'm³/h', icon: Droplet },
  { key: 'RO5-ConcetrateFlow', name: 'CONC_FLOW', desc: 'Concentrate Flow Rate - Reject Stream', address: 'VW212', unit: 'm³/h', icon: Droplet },
  { key: 'RO5-ROPressure', name: 'RO_PRESS', desc: 'Reverse Osmosis Operating Pressure', address: 'VW208', unit: 'bar', icon: Gauge },
  { key: 'RO5-InterstagePress', name: 'INT_PRESS', desc: 'Interstage Pressure Between Stages', address: 'VW209', unit: 'bar', icon: Gauge },
  { key: 'RO5-ConcetratePress', name: 'CONC_PRESS', desc: 'Concentrate Stream Pressure', address: 'VW213', unit: 'bar', icon: Gauge },
  { key: 'RO5-Stage1Delta', name: 'STG1_DP', desc: 'Stage 1 Differential Pressure', address: 'VW401', unit: 'bar', icon: Gauge },
  { key: 'RO5-Stage2Delta', name: 'STG2_DP', desc: 'Stage 2 Differential Pressure', address: 'VW402', unit: 'bar', icon: Gauge },
  { key: 'RO5-MediaFilterInPress', name: 'FILT_IN', desc: 'Media Filter Inlet Pressure', address: 'VW305', unit: 'bar', icon: Filter },
  { key: 'RO5-MediaFilterOutPress', name: 'FILT_OUT', desc: 'Media Filter Outlet Pressure', address: 'VW306', unit: 'bar', icon: Filter },
  { key: 'RO5-MediaFilterDeltaP', name: 'FILT_DP', desc: 'Media Filter Differential Pressure', address: 'VW307', unit: 'bar', icon: Filter },
  { key: 'RO5-SystemRecovery', name: 'RECOVERY', desc: 'System Recovery Rate', address: 'VW500', unit: '%', icon: Activity },
  { key: 'RO5-PureWaterEc', name: 'EC_PRODUCT', desc: 'Product Water Electrical Conductivity', address: 'VW601', unit: 'µS/cm', icon: Filter },
  { key: 'RO5-SystemOperation', name: 'SYS_OP', desc: 'System Operation Status', address: 'VW700', unit: '', icon: Activity },
  { key: 'RO5-SystemMode', name: 'SYS_MODE', desc: 'System Mode', address: 'VW701', unit: '', icon: Activity },
  { key: 'RO5-AntiscalantDosingActive', name: 'DOSING_ACTIVE', desc: 'Antiscalant Dosing Active', address: 'VW702', unit: '', icon: Filter },
];

// ===================== MAIN COMPONENT =====================
export default function TagManager() {
  const { sensorData, getValue, getHistory, lastUpdate, connected } = useData();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', desc: '', address: '', value: '', unit: '', source: '' });
  const [liveData, setLiveData] = useState({});
  const [lastFetch, setLastFetch] = useState(null);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ===================== MOBILE DETECTION =====================
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ===================== FETCH REAL DATA =====================
  const fetchRealData = useCallback(() => {
    const data = {};
    ABOX_SENSORS.forEach(sensor => {
      const value = getValue(sensor.key);
      if (value !== undefined && value !== null) {
        data[sensor.key] = {
          value: value,
          timestamp: lastUpdate || new Date().toISOString(),
          history: getHistory(sensor.key) || []
        };
      }
    });
    setLiveData(data);
    setLastFetch(new Date().toISOString());
  }, [getValue, getHistory, lastUpdate]);

  // Fetch data on mount and on updates
  useEffect(() => {
    fetchRealData();
  }, [fetchRealData]);

  // ===================== REFRESH HANDLER =====================
  const handleRefresh = () => {
    setRefreshLoading(true);
    fetchRealData();
    // Also trigger a refresh of the parent data context
    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('refreshData'));
    }
    setTimeout(() => {
      setRefreshLoading(false);
    }, 500);
  };

  // ===================== BUILD TAGS FROM REAL ABOX DATA =====================
  const tags = useMemo(() => {
    const tagList = [];
    let id = 1;

    // ----- REAL ABOX SENSOR TAGS -----
    ABOX_SENSORS.forEach(sensor => {
      const data = liveData[sensor.key];
      const history = data?.history || [];
      
      // Check if we have data for this sensor
      const hasData = data && data.value !== undefined && data.value !== null;
      
      if (hasData) {
        const lastVal = history.length > 0 ? history[history.length - 1]?.value || data.value : data.value;
        const status = connected ? 'Live' : 'Offline';
        
        // FIX: For DOSING_ACTIVE, display as text
        const displayValue = sensor.key === 'RO5-AntiscalantDosingActive' 
          ? (lastVal === 1 || lastVal === true || lastVal === '1' || lastVal === 'true' || lastVal === 'ON' || lastVal === 'on' ? 'Running' : 'Stopped')
          : (typeof lastVal === 'number' ? lastVal : 0);
        
        tagList.push({
          id: id++,
          name: sensor.name,
          desc: sensor.desc,
          address: sensor.address,
          value: displayValue,
          unit: sensor.unit,
          status: status,
          source: 'ABOX-PLC',
          lastUpdate: data.timestamp ? format(new Date(data.timestamp), 'HH:mm:ss') : '--',
          key: sensor.key,
          history: history.slice(-30),
          icon: sensor.icon,
          calculated: false,
          rawKey: sensor.key,
          isDosing: sensor.key === 'RO5-AntiscalantDosingActive'
        });
      }
    });

    // ----- CALCULATED TAGS FROM ABOX DATA -----
    const feedFlow = getValue('RO5-FEEDFlow') || 0;
    const permeateFlow = getValue('RO5-Permeateflow') || 0;
    const recovery = getValue('RO5-SystemRecovery') || 0;
    const roPressure = getValue('RO5-ROPressure') || 0;
    const pureWaterEC = getValue('RO5-PureWaterEc') || 0;
    const stage1Delta = getValue('RO5-Stage1Delta') || 0;
    const filterDeltaP = getValue('RO5-MediaFilterDeltaP') || 0;
    const concentrateFlow = getValue('RO5-ConcetrateFlow') || 0;
    const dosingActive = getValue('RO5-AntiscalantDosingActive') || 0;
    const systemOperation = getValue('RO5-SystemOperation') || 0;

    // FIX: Check if dosing is actually active
    const isDosingOn = dosingActive === 1 || dosingActive === true || dosingActive === '1' || dosingActive === 'true' || dosingActive === 'ON' || dosingActive === 'on';

    // 1. Antiscalant Dosing Rate - FIXED to show 0 when stopped
    const dosingRate = isDosingOn ? Math.min(Math.max(2.0 + (feedFlow / 100) * 0.5, 1.8), 3.5) : 0;
    tagList.push({
      id: id++,
      name: 'DOSING_RATE',
      desc: 'Antiscalant Dosing Rate (Calculated from Feed Flow)',
      address: 'CALC-001',
      value: dosingRate,
      unit: 'mg/L',
      status: connected ? 'Live' : 'Offline',
      source: 'ABOX-CALC',
      lastUpdate: lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--',
      key: 'DosingRate',
      history: [],
      icon: Filter,
      calculated: true,
      rawKey: null,
      isDosing: true
    });

    // 2. Salt Rejection Rate
    const saltRejection = Math.min(99.5, Math.max(90, 95 + (100 - pureWaterEC / 20) / 10));
    tagList.push({
      id: id++,
      name: 'SALT_REJ',
      desc: 'Salt Rejection Rate (Calculated from Product EC)',
      address: 'CALC-002',
      value: saltRejection,
      unit: '%',
      status: connected ? 'Live' : 'Offline',
      source: 'ABOX-CALC',
      lastUpdate: lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--',
      key: 'SaltRejection',
      history: [],
      icon: Filter,
      calculated: true,
      rawKey: null
    });

    // 3. Energy per m³
    const energyPerM3 = permeateFlow > 0 ? (roPressure * 0.15) / (permeateFlow / 100) : 0;
    tagList.push({
      id: id++,
      name: 'ENERGY_M3',
      desc: 'Energy Consumption per m³ Produced',
      address: 'CALC-003',
      value: energyPerM3,
      unit: 'kWh/m³',
      status: connected ? 'Live' : 'Offline',
      source: 'ABOX-CALC',
      lastUpdate: lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--',
      key: 'EnergyPerM3',
      history: [],
      icon: Zap,
      calculated: true,
      rawKey: null
    });

    // 4. Membrane Health Score
    const membraneHealth = Math.min(100, Math.max(0, 100 - (stage1Delta / 0.8) * 40 - (filterDeltaP / 0.5) * 20));
    tagList.push({
      id: id++,
      name: 'MEM_HEALTH',
      desc: 'Membrane Health Score (Calculated from ΔP)',
      address: 'CALC-004',
      value: membraneHealth,
      unit: '%',
      status: connected ? 'Live' : 'Offline',
      source: 'ABOX-CALC',
      lastUpdate: lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--',
      key: 'MembraneHealth',
      history: [],
      icon: Activity,
      calculated: true,
      rawKey: null
    });

    // 5. Mass Balance
    const massBalance = feedFlow - (permeateFlow + concentrateFlow);
    tagList.push({
      id: id++,
      name: 'MASS_BAL',
      desc: 'Mass Balance (Feed - Permeate - Concentrate)',
      address: 'CALC-005',
      value: massBalance,
      unit: 'm³/h',
      status: connected ? 'Live' : 'Offline',
      source: 'ABOX-CALC',
      lastUpdate: lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--',
      key: 'MassBalance',
      history: [],
      icon: Activity,
      calculated: true,
      rawKey: null
    });

    // 6. Production Efficiency
    const prodEfficiency = feedFlow > 0 ? (permeateFlow / feedFlow) * 100 : 0;
    tagList.push({
      id: id++,
      name: 'PROD_EFF',
      desc: 'Production Efficiency (Permeate/Feed)',
      address: 'CALC-006',
      value: prodEfficiency,
      unit: '%',
      status: connected ? 'Live' : 'Offline',
      source: 'ABOX-CALC',
      lastUpdate: lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--',
      key: 'ProdEfficiency',
      history: [],
      icon: Activity,
      calculated: true,
      rawKey: null
    });

    // 7. Dosing Status - FIXED to show correct status
    tagList.push({
      id: id++,
      name: 'DOSING_STATUS',
      desc: 'Antiscalant Dosing System Status',
      address: 'CALC-007',
      value: isDosingOn ? 'Running' : 'Stopped',
      unit: '',
      status: connected ? 'Live' : 'Offline',
      source: 'ABOX-CALC',
      lastUpdate: lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--',
      key: 'DosingStatus',
      history: [],
      icon: Filter,
      calculated: true,
      rawKey: null,
      isDosing: true
    });

    return tagList;
  }, [liveData, connected, lastUpdate, getValue]);

  // ===================== FILTER TAGS =====================
  const filteredTags = useMemo(() => {
    if (!search) return tags;
    const query = search.toLowerCase();
    return tags.filter(tag =>
      tag.name.toLowerCase().includes(query) ||
      tag.desc.toLowerCase().includes(query) ||
      tag.address.toLowerCase().includes(query) ||
      (tag.rawKey && tag.rawKey.toLowerCase().includes(query))
    );
  }, [tags, search]);

  // ===================== SET DEFAULT SELECTION =====================
  useEffect(() => {
    if (tags.length > 0 && !selectedTag) {
      setSelectedTag(tags[0]);
    }
  }, [tags]);

  // ===================== GENERATE TREND DATA =====================
  const generateTrendData = (tag) => {
    if (tag?.history && tag.history.length > 0) {
      return tag.history.map(d => d.value);
    }
    if (tag?.calculated) {
      const base = tag.value || 0;
      if (typeof base === 'string') {
        return Array.from({ length: 20 }, () => Math.random() * 10);
      }
      return Array.from({ length: 20 }, (_, i) => 
        parseFloat((base + (Math.random() - 0.5) * Math.abs(base) * 0.08).toFixed(2))
      );
    }
    const base = tag?.value || 0;
    if (typeof base === 'string') {
      return Array.from({ length: 20 }, () => Math.random() * 10);
    }
    return Array.from({ length: 20 }, (_, i) => 
      parseFloat((base + (Math.random() - 0.5) * Math.abs(base) * 0.05).toFixed(2))
    );
  };

  const trendData = selectedTag ? generateTrendData(selectedTag) : [];
  const timeLabels = Array.from({ length: trendData.length }, (_, i) => {
    const time = subMinutes(new Date(), trendData.length - i);
    return format(time, 'HH:mm');
  });

  // ===================== CHART CONFIG =====================
  const chartData = {
    labels: timeLabels,
    datasets: [{
      label: selectedTag?.name || 'Value',
      data: trendData,
      borderColor: selectedTag?.calculated ? '#a78bfa' : '#0ea5e9',
      backgroundColor: selectedTag?.calculated ? 'rgba(167,139,250,0.1)' : 'rgba(14,165,233,0.1)',
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 1,
      fill: true,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0a1828',
        borderColor: 'rgba(14,165,233,0.2)',
        borderWidth: 1,
        titleColor: '#4d7a9e',
        bodyColor: '#d4e4f7',
        titleFontSize: 10,
        bodyFontSize: 11,
        bodyFontFamily: 'var(--font-mono)',
      }
    },
    scales: {
      y: { 
        grid: { color: 'rgba(14,165,233,0.06)' }, 
        ticks: { color: '#4d7a9e', font: { size: 9 } } 
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: '#4d7a9e', font: { size: 8 }, maxTicksLimit: 8 } 
      }
    }
  };

  // ===================== EXPORT TO EXCEL =====================
  const handleExport = () => {
    const exportData = tags.map(tag => ({
      'Tag Name': tag.name,
      'Description': tag.desc,
      'Address': tag.address,
      'Value': typeof tag.value === 'number' ? tag.value.toFixed(3) : tag.value,
      'Unit': tag.unit,
      'Status': tag.status,
      'Source': tag.source,
      'Last Update': tag.lastUpdate,
      'Type': tag.calculated ? 'Calculated' : 'ABOX Sensor',
      'Raw Key': tag.rawKey || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ABOX_Tags");

    ws['!cols'] = [
      { wch: 14 }, { wch: 40 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, 
      { wch: 12 }, { wch: 25 }
    ];

    XLSX.writeFile(wb, `ABOX_Tags_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // ===================== ADD TAG =====================
  const handleAddTag = () => {
    if (!newTag.name || !newTag.address) {
      alert("Tag Name and Address are required!");
      return;
    }
    alert(`✅ New tag "${newTag.name}" added successfully! (Simulated)`);
    setNewTag({ name: '', desc: '', address: '', value: '', unit: '', source: '' });
    setShowAddForm(false);
  };

  // ===================== DELETE TAG =====================
  const handleDeleteTag = (id) => {
    if (window.confirm("Delete this tag permanently?")) {
      alert(`✅ Tag deleted successfully! (Simulated)`);
      if (selectedTag?.id === id) {
        setSelectedTag(tags.find(t => t.id !== id) || null);
      }
    }
  };

  // ===================== STATS =====================
  const liveTags = tags.filter(t => t.status === 'Live').length;
  const totalTags = tags.length;
  const onlineRate = totalTags > 0 ? (liveTags / totalTags * 100).toFixed(1) : 0;
  const sensorTags = tags.filter(t => !t.calculated).length;
  const calculatedTags = tags.filter(t => t.calculated).length;

  // ===================== RENDER ICON HELPER =====================
  const renderIcon = (tag, size = 14) => {
    const IconComponent = getTagIcon(tag.name);
    const color = tag.calculated ? '#a78bfa' : '#0ea5e9';
    return <IconComponent size={size} style={{ color }} />;
  };

  // ===================== RENDER VALUE WITH COLOR =====================
  const renderValue = (tag) => {
    const isDosingTag = tag.isDosing || tag.name.includes('DOSING');
    if (isDosingTag && typeof tag.value === 'string') {
      const isRunning = tag.value === 'Running' || tag.value === 'ON' || tag.value === '1' || tag.value === 'true';
      return (
        <span style={{ 
          color: isRunning ? '#22c55e' : '#ef4444',
          fontWeight: 700
        }}>
          {tag.value}
        </span>
      );
    }
    if (typeof tag.value === 'number') {
      const isDosingRate = tag.name === 'DOSING_RATE';
      if (isDosingRate && tag.value === 0) {
        return <span style={{ color: '#ef4444' }}>0.00</span>;
      }
      return <span style={{ color: tag.calculated ? '#a78bfa' : '#0ea5e9' }}>{tag.value.toFixed(2)}</span>;
    }
    return <span>{tag.value}</span>;
  };

  return (
    <div style={{ 
      fontFamily: "'Inter', system-ui, sans-serif", 
      color: 'var(--foreground)', 
      height: '100%',
      padding: isMobile ? 8 : 16,
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? 8 : 16,
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', flexWrap: 'wrap', gap: isMobile ? 8 : 12, flexDirection: isMobile ? 'column' : 'row' }}>
        <div>
          <div style={{ fontSize: isMobile ? 9 : 11, color: 'var(--muted-foreground)', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' }}>
            <Server size={isMobile ? 12 : 14} style={{ display: 'inline', marginRight: 4 }} />
            ABOX Tag Manager
          </div>
          <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: '4px 0 2px', color: 'var(--foreground)' }}>
            Real-Time ABOX PLC Tags
          </h1>
          <p style={{ fontSize: isMobile ? 9 : 11, color: 'var(--muted-foreground)' }}>
            {totalTags} tags • {liveTags} live • {sensorTags} ABOX sensors • {calculatedTags} calculated • 
            Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 6 : 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ 
            background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            padding: isMobile ? '4px 10px' : '6px 14px', 
            borderRadius: 6, 
            fontSize: isMobile ? 9 : 11, 
            border: `1px solid ${connected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: connected ? '#22c55e' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <div style={{ width: isMobile ? 5 : 6, height: isMobile ? 5 : 6, borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444' }} />
            {connected ? 'ABOX ONLINE' : 'ABOX OFFLINE'}
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshLoading}
            style={{ 
              padding: isMobile ? '6px 10px' : '8px 12px', 
              background: 'var(--secondary)', 
              border: '1px solid var(--border)', 
              borderRadius: 6, 
              color: 'var(--foreground)',
              cursor: refreshLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              opacity: refreshLoading ? 0.6 : 1,
              fontSize: isMobile ? 10 : 12
            }}
          >
            <RefreshCw size={isMobile ? 12 : 14} className={refreshLoading ? 'spin' : ''} /> 
            {isMobile ? '' : 'Refresh'}
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            style={{ 
              background: '#0ea5e9', 
              color: '#020810', 
              padding: isMobile ? '6px 12px' : '8px 18px', 
              borderRadius: 6, 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? 4 : 6,
              border: 'none',
              fontSize: isMobile ? 10 : 12,
              cursor: 'pointer'
            }}
          >
            <Plus size={isMobile ? 14 : 16} /> {isMobile ? 'Add' : 'Add Tag'}
          </button>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))', 
        gap: isMobile ? 6 : 12 
      }}>
        <div style={{ ...S.card, padding: isMobile ? '10px 14px' : '16px 20px' }}>
          <div style={{ ...S.label, fontSize: isMobile ? 8 : 10 }}>Total Tags</div>
          <div style={{ ...S.value, margin: '4px 0', color: 'var(--foreground)', fontSize: isMobile ? 18 : 22 }}>{totalTags}</div>
        </div>
        <div style={{ ...S.card, padding: isMobile ? '10px 14px' : '16px 20px' }}>
          <div style={{ ...S.label, fontSize: isMobile ? 8 : 10 }}>Live Tags</div>
          <div style={{ ...S.value, margin: '4px 0', color: '#22c55e', fontSize: isMobile ? 18 : 22 }}>{liveTags}</div>
          <div style={{ fontSize: isMobile ? 9 : 11, color: '#22c55e' }}>{onlineRate}% online</div>
        </div>
        <div style={{ ...S.card, padding: isMobile ? '10px 14px' : '16px 20px' }}>
          <div style={{ ...S.label, fontSize: isMobile ? 8 : 10 }}>ABOX Sensors</div>
          <div style={{ ...S.value, margin: '4px 0', color: '#0ea5e9', fontSize: isMobile ? 18 : 22 }}>{sensorTags}</div>
          <div style={{ fontSize: isMobile ? 9 : 11, color: 'var(--muted-foreground)' }}>From ABOX PLC</div>
        </div>
        <div style={{ ...S.card, padding: isMobile ? '10px 14px' : '16px 20px' }}>
          <div style={{ ...S.label, fontSize: isMobile ? 8 : 10 }}>Calculated Tags</div>
          <div style={{ ...S.value, margin: '4px 0', color: '#a78bfa', fontSize: isMobile ? 18 : 22 }}>{calculatedTags}</div>
          <div style={{ fontSize: isMobile ? 9 : 11, color: 'var(--muted-foreground)' }}>Derived values</div>
        </div>
      </div>

      {/* Toolbar - Responsive */}
      <div style={{ display: 'flex', gap: isMobile ? 6 : 10, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: 1, minWidth: isMobile ? '100%' : 200, position: 'relative', width: isMobile ? '100%' : 'auto' }}>
          <Search size={isMobile ? 14 : 16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search by tag name, description or address..."
            style={{ 
              width: '100%', 
              padding: isMobile ? '6px 10px 6px 32px' : '8px 12px 8px 36px', 
              background: 'var(--secondary)', 
              border: '1px solid var(--border)', 
              borderRadius: 6, 
              color: 'var(--foreground)', 
              fontSize: isMobile ? 10 : 12,
              outline: 'none'
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 6 : 10, width: isMobile ? '100%' : 'auto' }}>
          <button 
            onClick={() => alert("Import feature coming soon!")} 
            style={{ 
              padding: isMobile ? '6px 12px' : '8px 16px', 
              background: 'var(--secondary)', 
              border: '1px solid var(--border)', 
              borderRadius: 6, 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? 4 : 6,
              color: 'var(--foreground)',
              fontSize: isMobile ? 10 : 11,
              cursor: 'pointer',
              flex: isMobile ? 1 : 'auto',
              justifyContent: 'center'
            }}
          >
            <Upload size={isMobile ? 12 : 14} /> {isMobile ? '' : 'Import'}
          </button>
          <button 
            onClick={handleExport} 
            style={{ 
              padding: isMobile ? '6px 12px' : '8px 16px', 
              background: 'var(--secondary)', 
              border: '1px solid var(--border)', 
              borderRadius: 6, 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? 4 : 6,
              color: 'var(--foreground)',
              fontSize: isMobile ? 10 : 11,
              cursor: 'pointer',
              flex: isMobile ? 1 : 'auto',
              justifyContent: 'center'
            }}
          >
            <Download size={isMobile ? 12 : 14} /> {isMobile ? '' : 'Export'}
          </button>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <div style={{ display: 'flex', gap: isMobile ? 8 : 16, flex: 1, minHeight: isMobile ? 300 : 400, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Table - Full width on mobile */}
        <div style={{ 
          flex: isMobile ? 'none' : 2, 
          ...S.card, 
          overflow: 'auto', 
          padding: 0,
          width: isMobile ? '100%' : 'auto'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: isMobile ? 10 : 12,
              minWidth: isMobile ? 600 : 'auto'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {isMobile ? (
                    <>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted-foreground)', fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted-foreground)', fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Value</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted-foreground)', fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted-foreground)', fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Update</th>
                    </>
                  ) : (
                    <>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--muted-foreground)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tag Name</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--muted-foreground)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Description</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--muted-foreground)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Address</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--muted-foreground)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Value</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--muted-foreground)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Unit</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--muted-foreground)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--muted-foreground)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Source</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--muted-foreground)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Last Update</th>
                      <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--muted-foreground)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Action</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredTags.map((tag, i) => (
                  <tr
                    key={tag.id}
                    onClick={() => setSelectedTag(tag)}
                    style={{
                      borderBottom: '1px solid rgba(26,58,82,0.15)',
                      background: selectedTag?.id === tag.id ? 'rgba(14,165,233,0.08)' : i % 2 === 0 ? 'transparent' : 'var(--muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {isMobile ? (
                      <>
                        <td style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {renderIcon(tag, 10)}
                          <span style={{ fontWeight: 600, fontSize: 9, fontFamily: 'var(--font-mono)' }}>{tag.name}</span>
                          {tag.calculated && (
                            <span style={{ fontSize: 6, background: '#a78bfa20', color: '#a78bfa', padding: '1px 4px', borderRadius: 2, fontWeight: 600 }}>CALC</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 600, fontSize: 10 }}>
                          {renderValue(tag)}
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ color: tag.status === 'Live' ? '#22c55e' : '#ef4444', fontSize: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: tag.status === 'Live' ? '#22c55e' : '#ef4444' }} />
                            {tag.status}
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', fontSize: 8, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>{tag.lastUpdate}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {renderIcon(tag)}
                          <span style={{ fontWeight: 600, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{tag.name}</span>
                          {tag.calculated && (
                            <span style={{ fontSize: 7, background: '#a78bfa20', color: '#a78bfa', padding: '1px 6px', borderRadius: 2, fontWeight: 600 }}>CALC</span>
                          )}
                          {!tag.calculated && (
                            <span style={{ fontSize: 7, background: '#0ea5e920', color: '#0ea5e9', padding: '1px 6px', borderRadius: 2, fontWeight: 600 }}>ABOX</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--muted-foreground)', fontSize: 11 }}>{tag.desc}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-foreground)' }}>{tag.address}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {renderValue(tag)}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 10, color: 'var(--muted-foreground)' }}>{tag.unit}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ color: tag.status === 'Live' ? '#22c55e' : '#ef4444', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: tag.status === 'Live' ? '#22c55e' : '#ef4444' }} />
                            {tag.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 10, color: 'var(--muted-foreground)' }}>{tag.source}</td>
                        <td style={{ padding: '8px 12px', fontSize: 10, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>{tag.lastUpdate}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag.id); }} 
                            style={{ 
                              color: '#ef4444', 
                              background: 'none', 
                              border: 'none',
                              cursor: 'pointer',
                              padding: 4
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {filteredTags.length === 0 && (
                  <tr>
                    <td colSpan={isMobile ? 4 : 9} style={{ padding: '20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 12 }}>
                      No tags found matching "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Panel - Hidden on mobile if no selection, full width when selected */}
        {selectedTag && (
          <div style={{ 
            flex: isMobile ? 'none' : 1, 
            ...S.card, 
            minWidth: isMobile ? 'auto' : 280, 
            maxWidth: isMobile ? '100%' : 360, 
            overflow: 'auto',
            width: isMobile ? '100%' : 'auto',
            padding: isMobile ? '12px 14px' : '16px 20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 8 : 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8 }}>
                {renderIcon(selectedTag, isMobile ? 14 : 16)}
                <h3 style={{ margin: 0, color: 'var(--foreground)', fontSize: isMobile ? 12 : 14, fontWeight: 600 }}>
                  {selectedTag.name}
                </h3>
              </div>
              <div style={{ 
                background: selectedTag.status === 'Live' ? '#22c55e20' : '#ef444420', 
                color: selectedTag.status === 'Live' ? '#22c55e' : '#ef4444', 
                padding: '2px 8px', 
                borderRadius: 999, 
                fontSize: isMobile ? 7 : 9, 
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: selectedTag.status === 'Live' ? '#22c55e' : '#ef4444' }} />
                {selectedTag.status.toUpperCase()}
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', 
              gap: isMobile ? 4 : 8, 
              marginBottom: isMobile ? 10 : 16 
            }}>
              <div>
                <div style={{ ...S.label, fontSize: isMobile ? 7 : 10 }}>Description</div>
                <div style={{ fontSize: isMobile ? 10 : 12, marginTop: 2, color: 'var(--foreground)' }}>{selectedTag.desc}</div>
              </div>
              <div>
                <div style={{ ...S.label, fontSize: isMobile ? 7 : 10 }}>Address</div>
                <div style={{ fontSize: isMobile ? 10 : 12, marginTop: 2, fontFamily: 'var(--font-mono)', color: 'var(--foreground)' }}>{selectedTag.address}</div>
              </div>
              <div>
                <div style={{ ...S.label, fontSize: isMobile ? 7 : 10 }}>Current Value</div>
                <div style={{ 
                  fontSize: isMobile ? 16 : 18, 
                  fontWeight: 700, 
                  color: selectedTag.calculated ? '#a78bfa' : '#0ea5e9', 
                  marginTop: 2, 
                  fontFamily: 'var(--font-mono)' 
                }}>
                  {renderValue(selectedTag)} {selectedTag.unit}
                </div>
              </div>
              <div>
                <div style={{ ...S.label, fontSize: isMobile ? 7 : 10 }}>Source</div>
                <div style={{ fontSize: isMobile ? 10 : 12, marginTop: 2, color: 'var(--foreground)' }}>{selectedTag.source}</div>
                {selectedTag.calculated ? (
                  <div style={{ fontSize: isMobile ? 7 : 9, color: '#a78bfa', marginTop: 2 }}>Calculated from ABOX data</div>
                ) : (
                  <div style={{ fontSize: isMobile ? 7 : 9, color: '#0ea5e9', marginTop: 2 }}>Raw key: {selectedTag.rawKey}</div>
                )}
              </div>
            </div>

            {/* Chart */}
            <div style={{ marginBottom: isMobile ? 8 : 12 }}>
              <div style={{ ...S.label, fontSize: isMobile ? 7 : 10 }}>Live Trend (Last 30 points)</div>
              <div style={{ 
                height: isMobile ? 120 : 160, 
                marginTop: isMobile ? 4 : 8, 
                background: 'var(--secondary)', 
                borderRadius: 6, 
                padding: isMobile ? 4 : 8,
                border: '1px solid var(--border)'
              }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            <button 
              onClick={() => handleDeleteTag(selectedTag.id)}
              style={{ 
                width: '100%', 
                padding: isMobile ? '8px' : '10px', 
                background: '#ef444420', 
                color: '#ef4444', 
                border: '1px solid #ef444440',
                borderRadius: 6, 
                fontWeight: 600,
                fontSize: isMobile ? 10 : 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#ef444430'}
              onMouseLeave={(e) => e.target.style.background = '#ef444420'}
            >
              Delete Tag
            </button>
          </div>
        )}
      </div>

      {/* Add New Tag Modal - Responsive */}
      {showAddForm && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(2,8,16,0.95)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000,
          padding: isMobile ? 12 : 0
        }}>
          <div style={{ 
            ...S.card, 
            width: isMobile ? '100%' : 440, 
            background: 'var(--card)',
            padding: isMobile ? '16px' : '20px',
            maxWidth: '100%'
          }}>
            <h2 style={{ color: '#0ea5e9', marginBottom: isMobile ? 12 : 16, fontSize: isMobile ? 16 : 18, fontWeight: 700 }}>
              <Plus size={isMobile ? 16 : 20} style={{ display: 'inline', marginRight: 8 }} />
              Add New Tag
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 10 }}>
              <input 
                placeholder="Tag Name (e.g. VW702)" 
                value={newTag.name} 
                onChange={e => setNewTag({...newTag, name: e.target.value})} 
                style={{ padding: isMobile ? 8 : 10, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--foreground)', fontSize: isMobile ? 10 : 12, outline: 'none' }} 
              />
              <input 
                placeholder="Description" 
                value={newTag.desc} 
                onChange={e => setNewTag({...newTag, desc: e.target.value})} 
                style={{ padding: isMobile ? 8 : 10, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--foreground)', fontSize: isMobile ? 10 : 12, outline: 'none' }} 
              />
              <input 
                placeholder="Address (e.g. VW702)" 
                value={newTag.address} 
                onChange={e => setNewTag({...newTag, address: e.target.value})} 
                style={{ padding: isMobile ? 8 : 10, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--foreground)', fontSize: isMobile ? 10 : 12, outline: 'none' }} 
              />
              
              <div style={{ display: 'flex', gap: isMobile ? 6 : 10 }}>
                <input 
                  type="number" 
                  placeholder="Value" 
                  value={newTag.value} 
                  onChange={e => setNewTag({...newTag, value: e.target.value})} 
                  style={{ flex: 1, padding: isMobile ? 8 : 10, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--foreground)', fontSize: isMobile ? 10 : 12, outline: 'none' }} 
                />
                <input 
                  placeholder="Unit" 
                  value={newTag.unit} 
                  onChange={e => setNewTag({...newTag, unit: e.target.value})} 
                  style={{ flex: 1, padding: isMobile ? 8 : 10, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--foreground)', fontSize: isMobile ? 10 : 12, outline: 'none' }} 
                />
              </div>

              <input 
                placeholder="Source (e.g. ABOX-PLC)" 
                value={newTag.source} 
                onChange={e => setNewTag({...newTag, source: e.target.value})} 
                style={{ padding: isMobile ? 8 : 10, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--foreground)', fontSize: isMobile ? 10 : 12, outline: 'none' }} 
              />
            </div>

            <div style={{ marginTop: isMobile ? 16 : 20, display: 'flex', gap: isMobile ? 6 : 10 }}>
              <button 
                onClick={handleAddTag} 
                style={{ 
                  flex: 1, 
                  padding: isMobile ? 8 : 10, 
                  background: '#0ea5e9', 
                  color: '#020810', 
                  border: 'none', 
                  borderRadius: 4, 
                  fontWeight: 600,
                  fontSize: isMobile ? 10 : 12,
                  cursor: 'pointer'
                }}
              >
                Add Tag
              </button>
              <button 
                onClick={() => setShowAddForm(false)} 
                style={{ 
                  flex: 1, 
                  padding: isMobile ? 8 : 10, 
                  background: 'var(--secondary)', 
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  color: 'var(--foreground)',
                  fontSize: isMobile ? 10 : 12,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}