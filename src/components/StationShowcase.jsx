import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const tip = {
  contentStyle: { background:'#0C1829', border:'1px solid #1e3a5f', borderRadius:8, color:'#e2e8f0', fontSize:12, fontFamily:'inherit' },
  labelStyle: { color:'#64748b' },
};

const months = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];

const dpData = months.map((m, i) => ({
  month: m,
  prefilter: +(0.36 + i * 0.003 + Math.sin(i) * 0.01).toFixed(3),
  stage1:    +(1.12 + i * 0.004 + Math.sin(i*.8) * 0.015).toFixed(3),
  stage2:    +(0.79 + i * 0.003 + Math.sin(i*.6) * 0.012).toFixed(3),
}));

const recoveryData = months.map((m, i) => ({
  month: m,
  recovery: +(77.5 + Math.sin(i * 0.9) * 2.1 + i * 0.08).toFixed(2),
}));

const antiscalantData = months.map((m, i) => ({
  month: m,
  amount: Math.round(502 + Math.sin(i * 0.7) * 30),
}));

export default function StationShowcase() {
  return (
    <section style={{ background:'#080F1C', padding:'100px 6vw',
      fontFamily:"'DM Mono','Courier New',monospace",
      borderTop:'1px solid #1e3a5f', borderBottom:'1px solid #1e3a5f' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ marginBottom:40 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <span style={{ width:10,height:10,borderRadius:'50%',background:'#22c55e',display:'inline-block' }} />
            <span style={{ fontSize:18, fontWeight:700, color:'#e2e8f0',
              fontFamily:"'DM Sans','DM Mono',sans-serif" }}>Intake A — Rift Valley Osmotic</span>
            <span style={{ fontSize:11, color:'#64748b', letterSpacing:'0.1em' }}>INTAKE</span>
            <span style={{ fontSize:11, color:'#22c55e', background:'rgba(34,197,94,.10)',
              border:'1px solid rgba(34,197,94,.25)', borderRadius:5, padding:'2px 10px',
              letterSpacing:'0.08em' }}>● NORMAL</span>
          </div>
        </div>

        {/* Pressure KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
          {[
            { label:'PREFILTER ΔP',    value:'0.42', unit:'bar', status:'NORMAL' },
            { label:'1ST STAGE ΔP',    value:'1.15', unit:'bar', status:'NORMAL' },
            { label:'2ND STAGE ΔP',    value:'0.88', unit:'bar', status:'NORMAL' },
            { label:'ANTISCALANT DOSE',value:'3.2',  unit:'mg/L',status:'NORMAL' },
            { label:'SYSTEM RECOVERY', value:'78%',  unit:'',    status:'NORMAL' },
          ].map(({ label, value, unit, status }) => (
            <div key={label} style={{ background:'#0C1829', border:'1px solid #1e3a5f', borderRadius:12, padding:'16px 18px' }}>
              <div style={{ fontSize:9, color:'#475569', letterSpacing:'0.12em', marginBottom:10 }}>{label}</div>
              <div style={{ fontSize:24, fontWeight:700, color:'#22c55e' }}>
                {value} <span style={{ fontSize:13, fontWeight:400, color:'#64748b' }}>{unit}</span>
              </div>
              <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6,
                background:'rgba(34,197,94,.08)', borderRadius:5, padding:'4px 8px' }}>
                <span style={{ width:6,height:6,borderRadius:'50%',background:'#22c55e' }} />
                <span style={{ fontSize:10, color:'#22c55e', letterSpacing:'0.08em' }}>NORMAL</span>
              </div>
            </div>
          ))}
        </div>

        {/* Antiscalant summary */}
        <div style={{ background:'#0C1829', border:'1px solid #1e3a5f', borderRadius:12, padding:'20px 22px', marginBottom:20 }}>
          <div style={{ fontSize:10, color:'#475569', letterSpacing:'0.14em', marginBottom:16 }}>ANTISCALANT CONSUMPTION</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:0 }}>
            {[['19.2 L/day','PER DAY'],['576 L','PER MONTH'],['7,008 L','PER YEAR'],['593 L','PROJ. NEXT MONTH'],['7,288 L','PROJ. NEXT YEAR']].map(([v,l],i) => (
              <div key={l} style={{ padding:'0 20px', borderRight: i<4 ? '1px solid #1e3a5f' : 'none' }}>
                <div style={{ fontSize:22, fontWeight:700, color:'#e2e8f0' }}>{v}</div>
                <div style={{ fontSize:9, color:'#475569', letterSpacing:'0.1em', marginTop:5 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Differential Pressure Chart */}
        <div style={{ background:'#0C1829', border:'1px solid #1e3a5f', borderRadius:12, padding:'20px 22px', marginBottom:20 }}>
          <div style={{ fontSize:10, color:'#475569', letterSpacing:'0.14em', marginBottom:6 }}>DIFFERENTIAL PRESSURE TREND — 12 MONTHS</div>
          <div style={{ display:'flex', gap:20, fontSize:11, color:'#64748b', marginBottom:14 }}>
            <span style={{ color:'#3b82f6' }}>— Prefilter ΔP</span>
            <span style={{ borderTop:'2px dashed #22c55e', display:'inline-block', width:16, marginBottom:3 }} />
            <span style={{ color:'#22c55e' }}>1st stage ΔP</span>
            <span style={{ borderTop:'2px dashed #f59e0b', display:'inline-block', width:16, marginBottom:3 }} />
            <span style={{ color:'#f59e0b' }}>2nd stage ΔP</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dpData} margin={{ left:-20, right:4, top:4, bottom:0 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="#1e3a5f" vertical={false} />
              <XAxis dataKey="month" stroke="transparent" tick={{ fill:'#475569', fontSize:11 }} />
              <YAxis stroke="transparent" tick={{ fill:'#475569', fontSize:11 }} domain={['auto','auto']} />
              <Tooltip {...tip} />
              <Line type="monotone" dataKey="prefilter" stroke="#3b82f6" strokeWidth={2} dot={{ r:3, fill:'#3b82f6', strokeWidth:0 }} name="Prefilter ΔP" />
              <Line type="monotone" dataKey="stage1"    stroke="#22c55e" strokeWidth={2} strokeDasharray="5 4" dot={{ r:3, fill:'#22c55e', strokeWidth:0 }} name="1st Stage ΔP" />
              <Line type="monotone" dataKey="stage2"    stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 4" dot={{ r:3, fill:'#f59e0b', strokeWidth:0 }} name="2nd Stage ΔP" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recovery + Antiscalant charts */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ background:'#0C1829', border:'1px solid #1e3a5f', borderRadius:12, padding:'20px 22px' }}>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:'0.14em', marginBottom:14 }}>SYSTEM RECOVERY — 12 MONTHS</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={recoveryData} margin={{ left:-20, right:4, top:4, bottom:0 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#1e3a5f" vertical={false} />
                <XAxis dataKey="month" stroke="transparent" tick={{ fill:'#475569', fontSize:11 }} />
                <YAxis stroke="transparent" tick={{ fill:'#475569', fontSize:11 }} domain={[55,90]} />
                <Tooltip {...tip} formatter={(v) => [`${v}%`,'Recovery']} />
                <Line type="monotone" dataKey="recovery" stroke="#818cf8" strokeWidth={2} dot={{ r:3, fill:'#818cf8', strokeWidth:0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:'#0C1829', border:'1px solid #1e3a5f', borderRadius:12, padding:'20px 22px' }}>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:'0.14em', marginBottom:14 }}>ANTISCALANT CONSUMPTION — MONTHLY ESTIMATE (L)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={antiscalantData} margin={{ left:-20, right:4, top:4, bottom:0 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#1e3a5f" vertical={false} />
                <XAxis dataKey="month" stroke="transparent" tick={{ fill:'#475569', fontSize:11 }} />
                <YAxis stroke="transparent" tick={{ fill:'#475569', fontSize:11 }} />
                <Tooltip {...tip} formatter={(v) => [`${v} L`,'Antiscalant']} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}