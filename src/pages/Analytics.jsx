import { useState } from 'react';
 
const S = {
  card: { background: '#0D1F30', border: '1px solid #1A3A52', borderRadius: 10, padding: '20px' },
  label: { fontSize: 10, letterSpacing: '0.12em', color: '#4A8FA8' },
};
 
function BarChart({ data, color, unit }) {
  const max = Math.max(...data.map(d => d.val));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, marginTop: 12 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 9, color: '#4A8FA8' }}>{d.val}{unit}</div>
          <div style={{ width: '100%', background: `${color}22`, borderRadius: '3px 3px 0 0', height: (d.val / max) * 90, border: `1px solid ${color}44`, borderBottom: 'none', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', height: '60%', background: color, opacity: 0.7, borderRadius: '2px 2px 0 0' }} />
          </div>
          <div style={{ fontSize: 9, color: '#4A8FA8', whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}
 
function LineChart({ series, h = 140 }) {
  const allVals = series.flatMap(s => s.data);
  const max = Math.max(...allVals), min = Math.min(...allVals);
  const range = max - min || 1;
  const W = 600, H = h;
  const pts = (data) => data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 20) - 10}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', marginTop: 12 }}>
      {series.map(s => (
        <polyline key={s.label} points={pts(s.data)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
 
const phData    = [7.1,7.3,7.0,6.8,7.2,7.4,7.2,7.0,6.9,7.1,7.2,7.3,7.1,6.8,7.0,7.2,7.3,7.1,7.4,7.2,7.1,6.9,7.0,7.2];
const turbData  = [3.2,2.8,4.1,3.5,2.9,3.8,8.7,3.1,3.4,3.1,2.9,3.3,4.0,3.6,2.8,3.5,3.0,3.8,3.2,2.9,4.1,3.5,3.0,3.2];
const tempData  = [22,21,22,23,22,21,20,21,22,23,24,24,23,22,21,20,21,22,23,22,21,22,23,22];
 
const weeklyAlarms = [
  { label: 'Mon', val: 2 }, { label: 'Tue', val: 5 }, { label: 'Wed', val: 1 },
  { label: 'Thu', val: 8 }, { label: 'Fri', val: 3 }, { label: 'Sat', val: 1 }, { label: 'Sun', val: 2 },
];
 
const stationHealth = [
  { name: 'River Delta Alpha', uptime: 99.8, readings: 4320, alarms: 0 },
  { name: 'Reservoir Beta',    uptime: 98.2, readings: 4210, alarms: 1 },
  { name: 'Coastal Gamma',     uptime: 99.9, readings: 4318, alarms: 0 },
  { name: 'Lake Delta',        uptime: 97.1, readings: 4100, alarms: 3 },
  { name: 'Inlet Epsilon',     uptime: 99.5, readings: 4290, alarms: 0 },
];
 
export default function Analytics() {
  const [range, setRange] = useState('24h');
 
  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", color: '#C8E6F5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={S.label}>DATA INTELLIGENCE</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E0F4FF', margin: '4px 0 0' }}>Analytics</h1>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['1h','24h','7d','30d'].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              background: range === r ? 'rgba(0,212,255,0.12)' : 'transparent',
              border: `1px solid ${range === r ? '#00D4FF' : '#1A3A52'}`,
              borderRadius: 6, color: range === r ? '#00D4FF' : '#6BA3BC',
              padding: '6px 14px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
            }}>{r}</button>
          ))}
        </div>
      </div>
 
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'AVG pH', val: '7.1', color: '#00B4D8' },
          { label: 'MAX TURBIDITY', val: '14.2 NTU', color: '#FF5555' },
          { label: 'AVG TEMP', val: '22°C', color: '#FFB400' },
          { label: 'TOTAL READINGS', val: '103.8K', color: '#00FF88' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ ...S.card, borderTop: `2px solid ${color}` }}>
            <div style={S.label}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 6 }}>{val}</div>
          </div>
        ))}
      </div>
 
      {/* pH + Turbidity multi-line */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={S.label}>pH & TURBIDITY · {range}</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
            <span style={{ color: '#00B4D8' }}>— pH</span>
            <span style={{ color: '#FFB400' }}>— Turbidity</span>
            <span style={{ color: '#00FF88' }}>— Temp</span>
          </div>
        </div>
        <LineChart series={[
          { label: 'pH', data: phData, color: '#00B4D8' },
          { label: 'Turbidity', data: turbData.map(v => v / 2), color: '#FFB400' },
          { label: 'Temp', data: tempData.map(v => v / 4), color: '#00FF88' },
        ]} />
      </div>
 
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Weekly alarms */}
        <div style={S.card}>
          <div style={S.label}>WEEKLY ALARM FREQUENCY</div>
          <BarChart data={weeklyAlarms} color="#FF5555" unit="" />
        </div>
 
        {/* Station health */}
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: 12 }}>STATION HEALTH</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1A3A52' }}>
                {['STATION','UPTIME','READINGS','ALARMS'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#4A8FA8', fontWeight: 400, fontSize: 10, letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stationHealth.map(s => (
                <tr key={s.name} style={{ borderBottom: '1px solid rgba(26,58,82,0.4)' }}>
                  <td style={{ padding: '8px 8px', color: '#C8E6F5', fontSize: 11 }}>{s.name.split(' ').slice(-2).join(' ')}</td>
                  <td style={{ padding: '8px 8px', color: s.uptime > 99 ? '#00FF88' : s.uptime > 98 ? '#FFB400' : '#FF5555' }}>{s.uptime}%</td>
                  <td style={{ padding: '8px 8px', color: '#6BA3BC' }}>{s.readings.toLocaleString()}</td>
                  <td style={{ padding: '8px 8px', color: s.alarms > 0 ? '#FF5555' : '#4A8FA8' }}>{s.alarms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}