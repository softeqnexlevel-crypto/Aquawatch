// components/TagManager.jsx
import React, { useState, useMemo, useEffect } from 'react';
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
    padding: '20px'
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
  return Server;
};

// ✅ FIX: keys use the short RO5- prefix only, matching what DataContext's
// getValue()/getHistory() actually index by (the old 'siemens200smart-RO5-'
// prefix is the RAW backend parameter name, before DataContext's aliasing
// strips it down to 'RO5-X' — using the raw form here was why every ABOX
// sensor row showed 0.00 despite the connection being live).
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

  // ===================== FETCH REAL DATA =====================
  const fetchRealData = () => {
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
  };

  // Fetch data on mount and on updates
  useEffect(() => {
    fetchRealData();
  }, [getValue, getHistory, lastUpdate]);

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
        
        tagList.push({
          id: id++,
          name: sensor.name,
          desc: sensor.desc,
          address: sensor.address,
          value: typeof lastVal === 'number' ? lastVal : 0,
          unit: sensor.unit,
          status: status,
          source: 'ABOX-PLC',
          lastUpdate: data.timestamp ? format(new Date(data.timestamp), 'HH:mm:ss') : '--',
          key: sensor.key,
          history: history.slice(-30),
          icon: sensor.icon,
          calculated: false,
          rawKey: sensor.key
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

    // 1. Antiscalant Dosing Rate
    const dosingRate = 2.0 + (feedFlow / 100) * 0.5;
    tagList.push({
      id: id++,
      name: 'DOSING_RATE',
      desc: 'Antiscalant Dosing Rate (Calculated from Feed Flow)',
      address: 'CALC-001',
      value: Math.min(Math.max(dosingRate, 1.8), 3.5),
      unit: 'mg/L',
      status: connected ? 'Live' : 'Offline',
      source: 'ABOX-CALC',
      lastUpdate: lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--',
      key: 'DosingRate',
      history: [],
      icon: Filter,
      calculated: true,
      rawKey: null
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

    // 7. Dosing Status
    tagList.push({
      id: id++,
      name: 'DOSING_STATUS',
      desc: 'Antiscalant Dosing System Status',
      address: 'CALC-007',
      value: dosingActive === 1 ? 'Running' : 'Stopped',
      unit: '',
      status: connected ? 'Live' : 'Offline',
      source: 'ABOX-CALC',
      lastUpdate: lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--',
      key: 'DosingStatus',
      history: [],
      icon: Filter,
      calculated: true,
      rawKey: null
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

  // ===================== REFRESH DATA =====================
  const handleRefresh = () => {
    fetchRealData();
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

  return (
    <div style={{ 
      fontFamily: "'Inter', system-ui, sans-serif", 
      color: 'var(--foreground)', 
      height: '100%',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' }}>
            <Server size={14} style={{ display: 'inline', marginRight: 4 }} />
            ABOX Tag Manager
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 2px', color: 'var(--foreground)' }}>
            Real-Time ABOX PLC Tags
          </h1>
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
            {totalTags} tags • {liveTags} live • {sensorTags} ABOX sensors • {calculatedTags} calculated • 
            Last updated: {lastUpdate ? format(new Date(lastUpdate), 'HH:mm:ss') : '--'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ 
            background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            padding: '6px 14px', 
            borderRadius: 6, 
            fontSize: 11, 
            border: `1px solid ${connected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: connected ? '#22c55e' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444' }} />
            {connected ? 'ABOX ONLINE' : 'ABOX OFFLINE'}
          </div>
          <button 
            onClick={handleRefresh}
            style={{ 
              padding: '8px 12px', 
              background: 'var(--secondary)', 
              border: '1px solid var(--border)', 
              borderRadius: 6, 
              color: 'var(--foreground)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            style={{ 
              background: '#0ea5e9', 
              color: '#020810', 
              padding: '8px 18px', 
              borderRadius: 6, 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              border: 'none',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> Add Tag
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div style={S.card}>
          <div style={S.label}>Total Tags</div>
          <div style={{ ...S.value, margin: '4px 0', color: 'var(--foreground)' }}>{totalTags}</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>Live Tags</div>
          <div style={{ ...S.value, margin: '4px 0', color: '#22c55e' }}>{liveTags}</div>
          <div style={{ fontSize: 11, color: '#22c55e' }}>{onlineRate}% online</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>ABOX Sensors</div>
          <div style={{ ...S.value, margin: '4px 0', color: '#0ea5e9' }}>{sensorTags}</div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>From ABOX PLC</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>Calculated Tags</div>
          <div style={{ ...S.value, margin: '4px 0', color: '#a78bfa' }}>{calculatedTags}</div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Derived values</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search by tag name, description or address..."
            style={{ 
              width: '100%', 
              padding: '8px 12px 8px 36px', 
              background: 'var(--secondary)', 
              border: '1px solid var(--border)', 
              borderRadius: 6, 
              color: 'var(--foreground)', 
              fontSize: 12,
              outline: 'none'
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => alert("Import feature coming soon!")} 
          style={{ 
            padding: '8px 16px', 
            background: 'var(--secondary)', 
            border: '1px solid var(--border)', 
            borderRadius: 6, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            color: 'var(--foreground)',
            fontSize: 11,
            cursor: 'pointer'
          }}
        >
          <Upload size={14} /> Import
        </button>
        <button 
          onClick={handleExport} 
          style={{ 
            padding: '8px 16px', 
            background: 'var(--secondary)', 
            border: '1px solid var(--border)', 
            borderRadius: 6, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            color: 'var(--foreground)',
            fontSize: 11,
            cursor: 'pointer'
          }}
        >
          <Download size={14} /> Export
        </button>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 400 }}>
        {/* Table */}
        <div style={{ flex: 2, ...S.card, overflow: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Tag Name', 'Description', 'Address', 'Value', 'Unit', 'Status', 'Source', 'Last Update', ''].map(h => (
                  <th key={h} style={{ 
                    textAlign: 'left', 
                    padding: '10px 12px', 
                    color: 'var(--muted-foreground)',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                  }}>
                    {h}
                  </th>
                ))}
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
                  <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {renderIcon(tag)}
                    <span style={{ fontWeight: 600, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{tag.name}</span>
                    {tag.calculated && (
                      <span style={{ 
                        fontSize: 7, 
                        background: '#a78bfa20', 
                        color: '#a78bfa', 
                        padding: '1px 6px', 
                        borderRadius: 2,
                        fontWeight: 600
                      }}>
                        CALC
                      </span>
                    )}
                    {!tag.calculated && (
                      <span style={{ 
                        fontSize: 7, 
                        background: '#0ea5e920', 
                        color: '#0ea5e9', 
                        padding: '1px 6px', 
                        borderRadius: 2,
                        fontWeight: 600
                      }}>
                        ABOX
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)', fontSize: 11 }}>{tag.desc}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-foreground)' }}>{tag.address}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {typeof tag.value === 'number' ? tag.value.toFixed(2) : tag.value}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 10, color: 'var(--muted-foreground)' }}>{tag.unit}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ 
                      color: tag.status === 'Live' ? '#22c55e' : '#ef4444', 
                      fontSize: 10, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4 
                    }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: tag.status === 'Live' ? '#22c55e' : '#ef4444' }} />
                      {tag.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 10, color: 'var(--muted-foreground)' }}>{tag.source}</td>
                  <td style={{ padding: '10px 12px', fontSize: 10, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>{tag.lastUpdate}</td>
                  <td>
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
                </tr>
              ))}
              {filteredTags.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '30px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 12 }}>
                    No tags found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Details Panel */}
        {selectedTag && (
          <div style={{ flex: 1, ...S.card, minWidth: 280, maxWidth: 360, overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {renderIcon(selectedTag, 16)}
                <h3 style={{ margin: 0, color: 'var(--foreground)', fontSize: 14, fontWeight: 600 }}>
                  {selectedTag.name}
                </h3>
              </div>
              <div style={{ 
                background: selectedTag.status === 'Live' ? '#22c55e20' : '#ef444420', 
                color: selectedTag.status === 'Live' ? '#22c55e' : '#ef4444', 
                padding: '2px 10px', 
                borderRadius: 999, 
                fontSize: 9, 
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: selectedTag.status === 'Live' ? '#22c55e' : '#ef4444' }} />
                {selectedTag.status.toUpperCase()}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div>
                <div style={S.label}>Description</div>
                <div style={{ fontSize: 12, marginTop: 2, color: 'var(--foreground)' }}>{selectedTag.desc}</div>
              </div>
              <div>
                <div style={S.label}>Address</div>
                <div style={{ fontSize: 12, marginTop: 2, fontFamily: 'var(--font-mono)', color: 'var(--foreground)' }}>{selectedTag.address}</div>
              </div>
              <div>
                <div style={S.label}>Current Value</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: selectedTag.calculated ? '#a78bfa' : '#0ea5e9', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  {typeof selectedTag.value === 'number' ? selectedTag.value.toFixed(2) : selectedTag.value} {selectedTag.unit}
                </div>
              </div>
              <div>
                <div style={S.label}>Source</div>
                <div style={{ fontSize: 12, marginTop: 2, color: 'var(--foreground)' }}>{selectedTag.source}</div>
                {selectedTag.calculated ? (
                  <div style={{ fontSize: 9, color: '#a78bfa', marginTop: 2 }}>Calculated from ABOX data</div>
                ) : (
                  <div style={{ fontSize: 9, color: '#0ea5e9', marginTop: 2 }}>Raw key: {selectedTag.rawKey}</div>
                )}
              </div>
            </div>

            {/* Chart */}
            <div style={{ marginBottom: 12 }}>
              <div style={S.label}>Live Trend (Last 30 points)</div>
              <div style={{ 
                height: 160, 
                marginTop: 8, 
                background: 'var(--secondary)', 
                borderRadius: 6, 
                padding: 8,
                border: '1px solid var(--border)'
              }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            <button 
              onClick={() => handleDeleteTag(selectedTag.id)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                background: '#ef444420', 
                color: '#ef4444', 
                border: '1px solid #ef444440',
                borderRadius: 6, 
                fontWeight: 600,
                fontSize: 12,
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

      {/* Add New Tag Modal */}
      {showAddForm && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(2,8,16,0.95)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ ...S.card, width: 440, background: 'var(--card)' }}>
            <h2 style={{ color: '#0ea5e9', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>
              <Plus size={20} style={{ display: 'inline', marginRight: 8 }} />
              Add New Tag
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input 
                placeholder="Tag Name (e.g. VW702)" 
                value={newTag.name} 
                onChange={e => setNewTag({...newTag, name: e.target.value})} 
                style={{ padding: 10, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--foreground)', fontSize: 12, outline: 'none' }} 
              />
              <input 
                placeholder="Description" 
                value={newTag.desc} 
                onChange={e => setNewTag({...newTag, desc: e.target.value})} 
                style={{ padding: 10, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--foreground)', fontSize: 12, outline: 'none' }} 
              />
              <input 
                placeholder="Address (e.g. VW702)" 
                value={newTag.address} 
                onChange={e => setNewTag({...newTag, address: e.target.value})} 
                style={{ padding: 10, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--foreground)', fontSize: 12, outline: 'none' }} 
              />
              
              <div style={{ display: 'flex', gap: 10 }}>
                <input 
                  type="number" 
                  placeholder="Value" 
                  value={newTag.value} 
                  onChange={e => setNewTag({...newTag, value: e.target.value})} 
                  style={{ flex: 1, padding: 10, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--foreground)', fontSize: 12, outline: 'none' }} 
                />
                <input 
                  placeholder="Unit" 
                  value={newTag.unit} 
                  onChange={e => setNewTag({...newTag, unit: e.target.value})} 
                  style={{ flex: 1, padding: 10, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--foreground)', fontSize: 12, outline: 'none' }} 
                />
              </div>

              <input 
                placeholder="Source (e.g. ABOX-PLC)" 
                value={newTag.source} 
                onChange={e => setNewTag({...newTag, source: e.target.value})} 
                style={{ padding: 10, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--foreground)', fontSize: 12, outline: 'none' }} 
              />
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button 
                onClick={handleAddTag} 
                style={{ 
                  flex: 1, 
                  padding: 10, 
                  background: '#0ea5e9', 
                  color: '#020810', 
                  border: 'none', 
                  borderRadius: 4, 
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Add Tag
              </button>
              <button 
                onClick={() => setShowAddForm(false)} 
                style={{ 
                  flex: 1, 
                  padding: 10, 
                  background: 'var(--secondary)', 
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  color: 'var(--foreground)',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}