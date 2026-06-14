import { useState } from 'react';
import { Search, Plus, Download, Upload, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
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

const S = {
  card: {
    background: '#0D1F30',
    border: '1px solid #1A3A52',
    borderRadius: 12,
    padding: '20px'
  },
  label: { fontSize: 11, letterSpacing: '0.1em', color: '#4A8FA8', fontWeight: 600 }
};

const mockTags = [
  { id: 1, name: 'VW208', desc: 'Feed Pressure', address: 'VW208', value: 11.82, unit: 'Bar', status: 'Live', source: 'PLC-RO-1', lastUpdate: '19:40:52' },
  { id: 2, name: 'VW210', desc: 'Feed Flow', address: 'VW210', value: 72.40, unit: 'm³/h', status: 'Live', source: 'PLC-RO-1', lastUpdate: '19:40:52' },
  { id: 3, name: 'VW305', desc: 'Prefilter DP', address: 'VW305', value: 1.23, unit: 'Bar', status: 'Live', source: 'PLC-RO-1', lastUpdate: '19:40:52' },
  { id: 4, name: 'VW401', desc: '1st Stage DP', address: 'VW401', value: 2.80, unit: 'Bar', status: 'Live', source: 'PLC-RO-1', lastUpdate: '19:40:52' },
  { id: 5, name: 'VW500', desc: 'Recovery Rate', address: 'VW500', value: 78.60, unit: '%', status: 'Live', source: 'PLC-RO-1', lastUpdate: '19:40:52' },
  { id: 6, name: 'VW601', desc: 'Antiscalant Dosing Rate', address: 'VW601', value: 2.42, unit: 'mg/L', status: 'Live', source: 'PLC-CHEM', lastUpdate: '19:40:52' },
  { id: 7, name: 'VW601', desc: 'Antiscalant Dosing Rate', address: 'VW601', value: 2.42, unit: 'mg/L', status: 'Live', source: 'PLC-CHEM', lastUpdate: '19:40:52' },
  { id: 8, name: 'VW601', desc: 'Antiscalant Dosing Rate', address: 'VW601', value: 2.42, unit: 'mg/L', status: 'Live', source: 'PLC-CHEM', lastUpdate: '19:40:52' },
  { id: 9, name: 'VW601', desc: 'Antiscalant Dosing Rate', address: 'VW601', value: 2.42, unit: 'mg/L', status: 'Live', source: 'PLC-CHEM', lastUpdate: '19:40:52' },
  { id: 10, name: 'VW601', desc: 'Antiscalant Dosing Rate', address: 'VW601', value: 2.42, unit: 'mg/L', status: 'Live', source: 'PLC-CHEM', lastUpdate: '19:40:52' },
  { id: 11, name: 'VW601', desc: 'Antiscalant Dosing Rate', address: 'VW601', value: 2.42, unit: 'mg/L', status: 'Live', source: 'PLC-CHEM', lastUpdate: '19:40:52' },
  { id: 12, name: 'VW601', desc: 'Antiscalant Dosing Rate', address: 'VW601', value: 2.42, unit: 'mg/L', status: 'Live', source: 'PLC-CHEM', lastUpdate: '19:40:52' },
  { id: 13, name: 'VW601', desc: 'Antiscalant Dosing Rate', address: 'VW601', value: 2.42, unit: 'mg/L', status: 'Live', source: 'PLC-CHEM', lastUpdate: '19:40:52' },
  { id: 14, name: 'VW601', desc: 'Antiscalant Dosing Rate', address: 'VW601', value: 2.42, unit: 'mg/L', status: 'Live', source: 'PLC-CHEM', lastUpdate: '19:40:52' },
  { id: 15, name: 'VW601', desc: 'Antiscalant Dosing Rate', address: 'VW601', value: 2.42, unit: 'mg/L', status: 'Live', source: 'PLC-CHEM', lastUpdate: '19:40:52' },
];

export default function TagManager() {
  const [tags, setTags] = useState(mockTags);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(mockTags[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', desc: '', address: '', value: '', unit: '', source: '' });

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(search.toLowerCase()) ||
    tag.desc.toLowerCase().includes(search.toLowerCase())
  );

  // Generate fake live trend data
  const generateTrendData = (base) => {
    return Array.from({ length: 20 }, (_, i) => parseFloat((base + (Math.random() - 0.5) * 1.2).toFixed(2)));
  };

  const trendData = selectedTag ? generateTrendData(selectedTag.value) : [];

  const chartData = {
    labels: Array.from({ length: 20 }, (_, i) => `19:${40 + i}`),
    datasets: [{
      label: selectedTag?.name || 'Value',
      data: trendData,
      borderColor: '#00E6FF',
      backgroundColor: 'rgba(0, 230, 255, 0.1)',
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 2,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#1A3A52' }, ticks: { color: '#6BA3BC' } },
      x: { grid: { color: '#1A3A52' }, ticks: { color: '#6BA3BC', maxTicksLimit: 8 } }
    }
  };

 
  const handleExport = () => {
    const exportData = tags.map(tag => ({
      'Tag Name': tag.name,
      'Description': tag.desc,
      'Address': tag.address,
      'Value': tag.value,
      'Unit': tag.unit,
      'Status': tag.status,
      'Source': tag.source,
      'Last Update': tag.lastUpdate
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AquaWatch_Tags");

    ws['!cols'] = [
      { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 10 },
      { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
    ];

    XLSX.writeFile(wb, `AquaWatch_Tags_${new Date().toISOString().slice(0,10)}.xlsx`);
    alert("✅ Exported successfully as Excel file!");
  };

  const handleAddTag = () => {
    if (!newTag.name || !newTag.address) {
      alert("Tag Name and Address are required!");
      return;
    }

    const tagToAdd = {
      id: Date.now(),
      name: newTag.name.toUpperCase(),
      desc: newTag.desc || "No description",
      address: newTag.address.toUpperCase(),
      value: parseFloat(newTag.value) || 0,
      unit: newTag.unit || "",
      status: 'Live',
      source: newTag.source || 'PLC-RO-1',
      lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setTags([tagToAdd, ...tags]);
    setNewTag({ name: '', desc: '', address: '', value: '', unit: '', source: '' });
    setShowAddForm(false);
    alert("✅ New tag added successfully!");
  };

  const handleDeleteTag = (id) => {
    if (window.confirm("Delete this tag permanently?")) {
      const updatedTags = tags.filter(t => t.id !== id);
      setTags(updatedTags);
      if (selectedTag?.id === id) {
        setSelectedTag(updatedTags[0] || null);
      }
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#C8E6F5', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: '#00B4D8', letterSpacing: '0.08em', fontWeight: 600 }}>TAG MANAGER</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 4px' }}>Manage all system tags and connections</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ background: '#0A1725', padding: '6px 14px', borderRadius: 8, fontSize: 13, border: '1px solid #1A3A52' }}>
            PLANT ONLINE
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            style={{ background: '#00B4D8', color: '#07111F', padding: '10px 20px', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={18} /> Add Tag
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={S.card}>
          <div style={S.label}>TOTAL TAGS</div>
          <div style={{ fontSize: 32, fontWeight: 700, margin: '8px 0' }}>{tags.length}</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>CONNECTED TAGS</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#22FF88', margin: '8px 0' }}>278</div>
          <div style={{ color: '#22FF88', fontSize: 13 }}>97.1% of total</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>FAILED TAGS</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#FF5555', margin: '8px 0' }}>6</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>PLC CONNECTIONS</div>
          <div style={{ fontSize: 32, fontWeight: 700, margin: '8px 0' }}>4</div>
          <div style={{ color: '#22FF88', fontSize: 13 }}>Online</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 14, top: 12, color: '#4A8FA8' }} size={18} />
          <input
            type="text"
            placeholder="Search by tag name, description or address..."
            style={{ width: '100%', padding: '12px 16px 12px 48px', background: '#071320', border: '1px solid #1A3A52', borderRadius: 8, color: '#C8E6F5', fontSize: 14 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => alert("Import feature coming soon!")} style={{ padding: '10px 20px', background: '#1A3A52', border: '1px solid #1A3A52', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={18} /> Import
        </button>
        <button onClick={handleExport} style={{ padding: '10px 20px', background: '#1A3A52', border: '1px solid #1A3A52', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Download size={18} /> Export
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 380px)' }}>
        {/* Table */}
        <div style={{ flex: 2, ...S.card, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1A3A52' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#4A8FA8' }}>TAG NAME</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#4A8FA8' }}>DESCRIPTION</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#4A8FA8' }}>ADDRESS</th>
                <th style={{ textAlign: 'right', padding: '12px', color: '#4A8FA8' }}>VALUE</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#4A8FA8' }}>UNIT</th>
                <th style={{ textAlign: 'center', padding: '12px', color: '#4A8FA8' }}>STATUS</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#4A8FA8' }}>SOURCE</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#4A8FA8' }}>LAST UPDATE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.map(tag => (
                <tr
                  key={tag.id}
                  onClick={() => setSelectedTag(tag)}
                  style={{
                    borderBottom: '1px solid rgba(26,58,82,0.3)',
                    background: selectedTag?.id === tag.id ? 'rgba(0,180,216,0.15)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <td style={{ padding: '14px 12px', fontWeight: 600 }}>{tag.name}</td>
                  <td style={{ padding: '14px 12px', color: '#A0C4D9' }}>{tag.desc}</td>
                  <td style={{ padding: '14px 12px', fontFamily: 'monospace' }}>{tag.address}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600 }}>{tag.value}</td>
                  <td style={{ padding: '14px 12px' }}>{tag.unit}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'center' }}><span style={{ color: '#22FF88' }}>● Live</span></td>
                  <td style={{ padding: '14px 12px' }}>{tag.source}</td>
                  <td style={{ padding: '14px 12px', color: '#6BA3BC' }}>{tag.lastUpdate}</td>
                  <td>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag.id); }} style={{ color: '#FF5555', background: 'none', border: 'none' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Details + Chart */}
        {selectedTag && (
          <div style={{ flex: 1, ...S.card, height: 'fit-content', minWidth: 360 }}>
                    <h3 style={{ margin: 0, color: '#E0F4FF' }}>TAG DETAILS</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ margin: 0, paddingTop:20, color: '#E0F4FF', textTransform:"capitalize", fontSize:16,  }}>Feed Pressure</p>

              <div style={{ background: '#22FF88', color: '#07111F', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>LIVE</div>
            </div>
            
            <div style={{ marginBottom: 20, display: "grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={S.label}>TAG NAME</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{selectedTag.name}</div>
            </div>

            <div style={{ marginBottom: 20,  display: "grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={S.label}>DESCRIPTION</div>
              <div>{selectedTag.desc}</div>
            </div>


              <div style={{ marginBottom: 20,  display: "grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={S.label}>ADRESS</div>
              <div>{selectedTag.address}</div>
            </div>
              <div style={{ marginBottom: 20,  display: "grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={S.label}>UNIT</div>
              <div>{selectedTag.unit}</div>
            </div>

              <div style={{ marginBottom:20, display: "grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={S.label}>CURRENT VALUE</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#00E6FF' }}>{selectedTag.value} {selectedTag.unit}</div>
              </div>
              
              <div style={{ marginBottom: 20,  display: "grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={S.label}>STATUS</div>
              <div>{selectedTag.status}</div>
            </div>

            
              <div style={{ marginBottom: 20,  display: "grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={S.label}>QUALITY</div>
              <div style={{display:"flex", alignItems: "center", gap:2}}>
              <div style={{ background:'#22FF88', borderRadius:' 45%', padding:"4px 4px", }}> </div>
               <div style={{  color: '#22FF88', padding: '2px 10px', borderRadius:9, fontSize: 16, fontWeight: 700 }}>Good</div>
               </div>
            </div>

            <div style={{ marginBottom: 20,  display: "grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={S.label}>Source</div>
              <div>{selectedTag.source}</div>
            </div>


            {/* Chart */}
            <div style={{ marginBottom: 24 }}>
              <div style={S.label}>LIVE TREND (Last 5 Minutes)</div>
              <div style={{ height: 240, marginTop: 12, background: '#071320', borderRadius: 10, padding: 12, border: '1px solid #1A3A52' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            <button 
              onClick={() => handleDeleteTag(selectedTag.id)}
              style={{ width: '100%', padding: '14px', background: '#FF5555', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600 }}
            >
              Delete Tag
            </button>
          </div>
        )}
      </div>

      {/* Add New Tag Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,16,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ ...S.card, width: 480, background: '#0A1725' }}>
            <h2 style={{ color: '#00B4D8', marginBottom: 20 }}>Add New Tag</h2>
            
            <input placeholder="Tag Name (e.g. VW702)" value={newTag.name} onChange={e => setNewTag({...newTag, name: e.target.value})} style={{width:'100%', padding:12, marginBottom:12, background:'#071320', border:'1px solid #1A3A52', borderRadius:6, color:'white'}} />
            <input placeholder="Description" value={newTag.desc} onChange={e => setNewTag({...newTag, desc: e.target.value})} style={{width:'100%', padding:12, marginBottom:12, background:'#071320', border:'1px solid #1A3A52', borderRadius:6, color:'white'}} />
            <input placeholder="Address (e.g. VW702)" value={newTag.address} onChange={e => setNewTag({...newTag, address: e.target.value})} style={{width:'100%', padding:12, marginBottom:12, background:'#071320', border:'1px solid #1A3A52', borderRadius:6, color:'white'}} />
            
            <div style={{display:'flex', gap:12}}>
              <input type="number" placeholder="Value" value={newTag.value} onChange={e => setNewTag({...newTag, value: e.target.value})} style={{flex:1, padding:12, background:'#071320', border:'1px solid #1A3A52', borderRadius:6, color:'white'}} />
              <input placeholder="Unit" value={newTag.unit} onChange={e => setNewTag({...newTag, unit: e.target.value})} style={{flex:1, padding:12, background:'#071320', border:'1px solid #1A3A52', borderRadius:6, color:'white'}} />
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button onClick={handleAddTag} style={{ flex: 1, padding: 14, background: '#00B4D8', color: '#07111F', border: 'none', borderRadius: 8, fontWeight: 600 }}>Add Tag</button>
              <button onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: 14, background: '#1A3A52', border: 'none', borderRadius: 8 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}