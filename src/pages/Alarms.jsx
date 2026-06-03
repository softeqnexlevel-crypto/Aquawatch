import { useState } from 'react';
 
const S = {
  card: { background: '#0D1F30', border: '1px solid #1A3A52', borderRadius: 10, padding: '20px' },
  label: { fontSize: 10, letterSpacing: '0.12em', color: '#4A8FA8' },
};
 
const initial = [
  { id: 1, station: 'Lake Delta',        sensor: 'pH',        value: 5.1,  threshold: 6.0, severity: 'critical', tag: 'ACID_ALERT',   time: '09:42:18', acknowledged: false, note: '' },
  { id: 2, station: 'Reservoir Beta',    sensor: 'Turbidity', value: 8.7,  threshold: 8.0, severity: 'warning',  tag: 'TURBID_WARN',  time: '09:38:05', acknowledged: false, note: '' },
  { id: 3, station: 'Lake Delta',        sensor: 'Turbidity', value: 14.2, threshold: 10,  severity: 'critical', tag: 'TURBID_WARN',  time: '09:41:55', acknowledged: false, note: '' },
  { id: 4, station: 'Borehole Zeta',     sensor: 'Temp',      value: 36.1, threshold: 35,  severity: 'warning',  tag: 'TEMP_HIGH',    time: '08:15:00', acknowledged: true,  note: 'Sensor recalibration scheduled' },
  { id: 5, station: 'River Delta Alpha', sensor: 'Flow',      value: 42,   threshold: 50,  severity: 'info',     tag: 'FLOW_LOW',     time: '07:30:12', acknowledged: true,  note: '' },
];
 
const sevStyles = {
  critical: { bg: 'rgba(255,60,60,0.10)', border: '#FF5555', text: '#FF5555', dot: '#FF5555' },
  warning:  { bg: 'rgba(255,180,0,0.10)', border: '#FFB400', text: '#FFB400', dot: '#FFB400' },
  info:     { bg: 'rgba(0,180,216,0.10)', border: '#00B4D8', text: '#00B4D8', dot: '#00B4D8' },
};
 
export default function Alarms() {
  const [alarms, setAlarms] = useState(initial);
  const [filterSev, setFilterSev] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [noteInput, setNoteInput] = useState('');
 
  const acknowledge = (id) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, acknowledged: true, note: noteInput || a.note } : a));
    setExpanded(null); setNoteInput('');
  };
 
  const dismiss = (id) => setAlarms(alarms.filter(a => a.id !== id));
 
  const shown = alarms.filter(a => filterSev === 'all' || a.severity === filterSev);
  const counts = { critical: alarms.filter(a => !a.acknowledged && a.severity === 'critical').length, warning: alarms.filter(a => !a.acknowledged && a.severity === 'warning').length };
 
  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", color: '#C8E6F5' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: '#4A8FA8', letterSpacing: '0.14em', marginBottom: 4 }}>EVENT LOG</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E0F4FF', margin: 0 }}>Alarms</h1>
      </div>
 
      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { sev: 'critical', label: 'CRITICAL', count: counts.critical },
          { sev: 'warning', label: 'WARNING', count: counts.warning },
          { sev: 'info', label: 'UNACK TOTAL', count: alarms.filter(a => !a.acknowledged).length },
        ].map(({ sev, label, count }) => (
          <div key={label} style={{ ...S.card, flex: 1, borderTop: `2px solid ${sevStyles[sev]?.dot || '#00B4D8'}` }}>
            <div style={S.label}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: sevStyles[sev]?.text || '#00B4D8', marginTop: 6 }}>{count}</div>
          </div>
        ))}
      </div>
 
      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all','critical','warning','info'].map(f => (
          <button key={f} onClick={() => setFilterSev(f)} style={{
            background: filterSev === f ? 'rgba(0,212,255,0.12)' : 'transparent',
            border: `1px solid ${filterSev === f ? '#00D4FF' : '#1A3A52'}`,
            borderRadius: 6, color: filterSev === f ? '#00D4FF' : '#6BA3BC',
            padding: '6px 14px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
            letterSpacing: '0.08em',
          }}>{f.toUpperCase()}</button>
        ))}
      </div>
 
      {/* Alarm list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map(a => {
          const st = sevStyles[a.severity];
          return (
            <div key={a.id} style={{
              ...S.card, borderLeft: `3px solid ${st.border}`,
              opacity: a.acknowledged ? 0.6 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.dot, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, color: '#E0F4FF', fontWeight: 700 }}>{a.station}</div>
                    <div style={{ fontSize: 11, color: '#6BA3BC', marginTop: 2 }}>
                      {a.sensor} = <span style={{ color: st.text }}>{a.value}</span> (threshold: {a.threshold}) · {a.time}
                    </div>
                    {a.note && <div style={{ fontSize: 11, color: '#4A8FA8', marginTop: 4 }}>↳ {a.note}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: st.text, letterSpacing: '0.1em', background: st.bg, border: `1px solid ${st.border}`, borderRadius: 4, padding: '2px 8px' }}>
                    {a.tag}
                  </span>
                  {a.acknowledged
                    ? <span style={{ fontSize: 10, color: '#00FF88', letterSpacing: '0.1em' }}>✓ ACK</span>
                    : <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} style={{
                        background: 'rgba(0,180,216,0.1)', border: '1px solid #00B4D8',
                        borderRadius: 6, color: '#00B4D8', padding: '4px 12px',
                        cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                      }}>Acknowledge</button>
                  }
                  <button onClick={() => dismiss(a.id)} style={{ background: 'transparent', border: 'none', color: '#4A8FA8', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              </div>
 
              {expanded === a.id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1A3A52', display: 'flex', gap: 10 }}>
                  <input
                    style={{ flex: 1, background: '#071320', border: '1px solid #1A3A52', borderRadius: 6, color: '#C8E6F5', padding: '7px 12px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                    placeholder="Add note (optional)..." value={noteInput} onChange={e => setNoteInput(e.target.value)}
                  />
                  <button onClick={() => acknowledge(a.id)} style={{ background: '#00B4D8', border: 'none', borderRadius: 6, color: '#07111F', padding: '7px 18px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 700 }}>
                    Confirm
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {shown.length === 0 && (
          <div style={{ ...S.card, textAlign: 'center', color: '#4A8FA8', padding: 40 }}>
            No alarms matching current filter
          </div>
        )}
      </div>
    </div>
  );
}