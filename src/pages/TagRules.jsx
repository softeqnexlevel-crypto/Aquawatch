import { useState } from 'react';
 
const S = {
  card: { background: '#0D1F30', border: '1px solid #1A3A52', borderRadius: 10, padding: '20px' },
  label: { fontSize: 10, letterSpacing: '0.12em', color: '#4A8FA8' },
  input: {
    background: '#071320', border: '1px solid #1A3A52', borderRadius: 6,
    color: '#C8E6F5', padding: '8px 12px', fontSize: 12, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  },
  btn: (primary) => ({
    background: primary ? '#00B4D8' : 'transparent',
    border: `1px solid ${primary ? '#00B4D8' : '#1A3A52'}`,
    borderRadius: 6, color: primary ? '#07111F' : '#6BA3BC',
    padding: '8px 18px', cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit', fontWeight: primary ? 700 : 400,
  }),
};
 
const initRules = [
  { id: 1, name: 'pH Critical Low',  sensor: 'pH',        operator: '<',  threshold: 6.0, tag: 'ACID_ALERT',    severity: 'critical', active: true },
  { id: 2, name: 'pH Critical High', sensor: 'pH',        operator: '>',  threshold: 9.0, tag: 'ALKALINE_ALERT', severity: 'critical', active: true },
  { id: 3, name: 'High Turbidity',   sensor: 'Turbidity', operator: '>',  threshold: 10,  tag: 'TURBID_WARN',   severity: 'warning',  active: true },
  { id: 4, name: 'Low Flow Rate',    sensor: 'Flow',      operator: '<',  threshold: 50,  tag: 'FLOW_LOW',      severity: 'info',     active: false },
  { id: 5, name: 'Temp Spike',       sensor: 'Temp',      operator: '>',  threshold: 35,  tag: 'TEMP_HIGH',     severity: 'warning',  active: true },
];
 
const sevColor = { critical: '#FF5555', warning: '#FFB400', info: '#00B4D8' };
 
export default function TagRules() {
  const [rules, setRules] = useState(initRules);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', sensor: 'pH', operator: '>', threshold: '', tag: '', severity: 'warning' });
 
  const toggle = (id) => setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const remove  = (id) => setRules(rules.filter(r => r.id !== id));
 
  const save = () => {
    if (!form.name || !form.tag || !form.threshold) return;
    setRules([...rules, { ...form, id: Date.now(), threshold: parseFloat(form.threshold), active: true }]);
    setForm({ name: '', sensor: 'pH', operator: '>', threshold: '', tag: '', severity: 'warning' });
    setShowForm(false);
  };
 
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
 
  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", color: '#C8E6F5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={S.label}>CLASSIFICATION ENGINE</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E0F4FF', margin: '4px 0 0' }}>Tag Rules</h1>
        </div>
        <button style={S.btn(true)} onClick={() => setShowForm(v => !v)}>+ New Rule</button>
      </div>
 
      {showForm && (
        <div style={{ ...S.card, marginBottom: 16, borderColor: '#00B4D8' }}>
          <div style={{ fontSize: 11, color: '#00B4D8', letterSpacing: '0.1em', marginBottom: 14 }}>CREATE RULE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ ...S.label, marginBottom: 6 }}>RULE NAME</div>
              <input style={{ ...S.input, width: '100%' }} placeholder="e.g. pH Critical Low" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: 6 }}>SENSOR</div>
              <select style={{ ...S.input, width: '100%' }} value={form.sensor} onChange={e => set('sensor', e.target.value)}>
                {['pH','Turbidity','Temp','Flow','Conductivity','Salinity','Depth'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: 6 }}>SEVERITY</div>
              <select style={{ ...S.input, width: '100%' }} value={form.severity} onChange={e => set('severity', e.target.value)}>
                {['critical','warning','info'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: 6 }}>OPERATOR</div>
              <select style={{ ...S.input, width: '100%' }} value={form.operator} onChange={e => set('operator', e.target.value)}>
                {['>','<','>=','<=','=='].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: 6 }}>THRESHOLD</div>
              <input style={{ ...S.input, width: '100%' }} type="number" placeholder="0.0" value={form.threshold} onChange={e => set('threshold', e.target.value)} />
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: 6 }}>TAG LABEL</div>
              <input style={{ ...S.input, width: '100%' }} placeholder="e.g. PH_CRITICAL" value={form.tag} onChange={e => set('tag', e.target.value.toUpperCase())} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={S.btn(true)} onClick={save}>Save Rule</button>
            <button style={S.btn(false)} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
 
      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1A3A52' }}>
              {['RULE NAME','CONDITION','TAG','SEVERITY','ACTIVE',''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#4A8FA8', fontWeight: 400, letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(26,58,82,0.4)', opacity: r.active ? 1 : 0.45 }}>
                <td style={{ padding: '12px 12px', color: '#E0F4FF' }}>{r.name}</td>
                <td style={{ padding: '12px 12px', color: '#6BA3BC', fontFamily: 'monospace' }}>
                  {r.sensor} {r.operator} {r.threshold}
                </td>
                <td style={{ padding: '12px 12px' }}>
                  <span style={{ background: 'rgba(0,180,216,0.12)', border: '1px solid rgba(0,180,216,0.3)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#00B4D8', letterSpacing: '0.08em' }}>
                    {r.tag}
                  </span>
                </td>
                <td style={{ padding: '12px 12px' }}>
                  <span style={{ color: sevColor[r.severity], fontSize: 11, letterSpacing: '0.08em', fontWeight: 700 }}>{r.severity.toUpperCase()}</span>
                </td>
                <td style={{ padding: '12px 12px' }}>
                  <div onClick={() => toggle(r.id)} style={{
                    width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                    background: r.active ? 'rgba(0,255,136,0.25)' : '#1A3A52',
                    border: `1px solid ${r.active ? '#00FF88' : '#1A3A52'}`,
                    position: 'relative', transition: 'all 0.2s',
                  }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: r.active ? '#00FF88' : '#4A8FA8',
                      position: 'absolute', top: 2, left: r.active ? 18 : 2,
                      transition: 'left 0.2s',
                    }} />
                  </div>
                </td>
                <td style={{ padding: '12px 12px' }}>
                  <button onClick={() => remove(r.id)} style={{ background: 'transparent', border: 'none', color: '#FF5555', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}