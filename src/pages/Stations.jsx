import { useState } from 'react';
 
const S = {
  card: { background: '#0D1F30', border: '1px solid #1A3A52', borderRadius: 10, padding: '20px' },
  label: { fontSize: 10, letterSpacing: '0.12em', color: '#4A8FA8' },
  input: {
    background: '#071320', border: '1px solid #1A3A52', borderRadius: 6,
    color: '#C8E6F5', padding: '8px 12px', fontSize: 12, fontFamily: 'inherit',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  btn: (primary) => ({
    background: primary ? '#00B4D8' : 'transparent',
    border: `1px solid ${primary ? '#00B4D8' : '#1A3A52'}`,
    borderRadius: 6, color: primary ? '#07111F' : '#6BA3BC',
    padding: '8px 18px', cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit', fontWeight: primary ? 700 : 400, letterSpacing: '0.06em',
  }),
};
 
const initialStations = [
  { id: 'STN-001', name: 'River Delta Alpha', lat: -1.286, lng: 36.820, type: 'River',      status: 'online',  sensors: ['pH','Turbidity','Temp','Flow'], interval: 30 },
  { id: 'STN-002', name: 'Reservoir Beta',    lat: -1.312, lng: 36.845, type: 'Reservoir',  status: 'online',  sensors: ['pH','Turbidity','Temp'],       interval: 60 },
  { id: 'STN-003', name: 'Coastal Gamma',     lat: -4.043, lng: 39.668, type: 'Coastal',    status: 'online',  sensors: ['pH','Salinity','Temp'],        interval: 30 },
  { id: 'STN-004', name: 'Lake Delta',        lat: -0.091, lng: 34.768, type: 'Lake',       status: 'alarm',   sensors: ['pH','Turbidity','Depth'],      interval: 15 },
  { id: 'STN-005', name: 'Inlet Epsilon',     lat: -3.213, lng: 40.116, type: 'Coastal',    status: 'online',  sensors: ['pH','Temp','Salinity'],        interval: 60 },
  { id: 'STN-006', name: 'Borehole Zeta',     lat: -0.723, lng: 36.432, type: 'Groundwater',status: 'offline', sensors: ['pH','Conductivity'],           interval: 120 },
];
 
export default function Stations() {
  const [stations, setStations] = useState(initialStations);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('River');
 
  const filtered = stations.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.id.toLowerCase().includes(filter.toLowerCase())
  );
 
  const statusColor = { online: '#00FF88', offline: '#4A8FA8', alarm: '#FF5555' };
 
  function addStation() {
    if (!newName.trim()) return;
    const id = `STN-${String(stations.length + 1).padStart(3, '0')}`;
    setStations([...stations, {
      id, name: newName, lat: 0, lng: 0, type: newType,
      status: 'online', sensors: ['pH', 'Temp'], interval: 60,
    }]);
    setNewName(''); setShowAdd(false);
  }
 
  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", color: '#C8E6F5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={S.label}>MONITORING NETWORK</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E0F4FF', margin: '4px 0 0' }}>Stations</h1>
        </div>
        <button style={S.btn(true)} onClick={() => setShowAdd(true)}>+ Add Station</button>
      </div>
 
      {/* Add form */}
      {showAdd && (
        <div style={{ ...S.card, marginBottom: 16, borderColor: '#00B4D8' }}>
          <div style={{ fontSize: 11, color: '#00B4D8', letterSpacing: '0.1em', marginBottom: 14 }}>NEW STATION</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input style={S.input} placeholder="Station name" value={newName} onChange={e => setNewName(e.target.value)} />
            <select style={{ ...S.input, width: 160 }} value={newType} onChange={e => setNewType(e.target.value)}>
              {['River','Reservoir','Coastal','Lake','Groundwater'].map(t => <option key={t}>{t}</option>)}
            </select>
            <button style={{ ...S.btn(true), whiteSpace: 'nowrap' }} onClick={addStation}>Create</button>
            <button style={S.btn(false)} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}
 
      {/* Search */}
      <input style={{ ...S.input, marginBottom: 16, maxWidth: 320 }}
        placeholder="Search stations..." value={filter} onChange={e => setFilter(e.target.value)} />
 
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 16 }}>
        {/* List */}
        <div style={S.card}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1A3A52' }}>
                {['ID','NAME','TYPE','LAT / LNG','SENSORS','INTERVAL','STATUS',''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#4A8FA8', fontWeight: 400, letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} onClick={() => setSelected(s.id === selected ? null : s.id)}
                  style={{ borderBottom: '1px solid rgba(26,58,82,0.5)', cursor: 'pointer', background: selected === s.id ? 'rgba(0,212,255,0.05)' : 'transparent' }}>
                  <td style={{ padding: '10px 10px', color: '#4A8FA8' }}>{s.id}</td>
                  <td style={{ padding: '10px 10px', color: '#E0F4FF' }}>{s.name}</td>
                  <td style={{ padding: '10px 10px', color: '#6BA3BC' }}>{s.type}</td>
                  <td style={{ padding: '10px 10px', color: '#4A8FA8', fontSize: 11 }}>{s.lat.toFixed(3)}, {s.lng.toFixed(3)}</td>
                  <td style={{ padding: '10px 10px' }}>{s.sensors.length} active</td>
                  <td style={{ padding: '10px 10px', color: '#6BA3BC' }}>{s.interval}s</td>
                  <td style={{ padding: '10px 10px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[s.status] }} />
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', color: '#00B4D8', fontSize: 11 }}>
                    {selected === s.id ? '← close' : 'details →'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
 
        {/* Detail panel */}
        {selected && (() => {
          const s = stations.find(x => x.id === selected);
          return (
            <div style={{ ...S.card, borderColor: '#00B4D8' }}>
              <div style={{ fontSize: 10, color: '#00B4D8', letterSpacing: '0.12em', marginBottom: 12 }}>STATION DETAIL</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#E0F4FF', marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: '#4A8FA8', marginBottom: 20 }}>{s.id} · {s.type}</div>
              {[
                ['Latitude', s.lat],
                ['Longitude', s.lng],
                ['Poll interval', `${s.interval}s`],
                ['Status', s.status.toUpperCase()],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1A3A52', padding: '8px 0', fontSize: 12 }}>
                  <span style={{ color: '#4A8FA8' }}>{k}</span>
                  <span style={{ color: '#C8E6F5' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, color: '#4A8FA8', letterSpacing: '0.1em', marginBottom: 8 }}>ACTIVE SENSORS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {s.sensors.map(sen => (
                    <span key={sen} style={{ background: 'rgba(0,180,216,0.12)', border: '1px solid rgba(0,180,216,0.3)', borderRadius: 4, padding: '3px 10px', fontSize: 11, color: '#00B4D8' }}>{sen}</span>
                  ))}
                </div>
              </div>
              <button style={{ ...S.btn(false), marginTop: 20, width: '100%' }}
                onClick={() => setStations(stations.map(x => x.id === s.id ? { ...x, status: x.status === 'offline' ? 'online' : 'offline' } : x))}>
                {s.status === 'offline' ? 'Bring Online' : 'Take Offline'}
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}