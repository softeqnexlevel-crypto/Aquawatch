import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const READINGS = [
  { label: 'pH Level',   value: '7.34',      unit: '',      status: 'NORMAL',  color: '#22c55e' },
  { label: 'Chlorine',   value: '0.28',       unit: 'mg/L',  status: 'NORMAL',  color: '#22c55e' },
  { label: 'Turbidity',  value: '4.21',       unit: 'NTU',   status: 'WARNING', color: '#f59e0b' },
  { label: 'Pressure',   value: '3.10',       unit: 'bar',   status: 'NORMAL',  color: '#22c55e' },
];

const PH_SPARK = [7.18,7.22,7.19,7.25,7.21,7.24,7.20,7.26,7.23,7.24,7.21,7.25,7.22,7.28,7.24];

function SparkLine({ data, color = '#3b82f6' }) {
  const w = 300, h = 48;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 8) - 4}`
  ).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2800);
    return () => clearInterval(id);
  }, []);

  const liveVal = (7.20 + Math.sin(tick * 0.7) * 0.06).toFixed(2);

  return (
    <section style={{
      minHeight: '100vh', background: '#060D1A',
      display: 'flex', alignItems: 'center',
      padding: '0 6vw', gap: '6vw',
      fontFamily: "'DM Mono','Courier New',monospace",
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ping { 75%,100% { transform:scale(2.2); opacity:0; } }
        @keyframes scroll-x { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .hero-btn-primary:hover { opacity:.88; transform:translateY(-1px); }
        .hero-btn-secondary:hover { background:rgba(255,255,255,.06); }
      `}</style>

      {/* BG radial glow */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0,
        background:'radial-gradient(ellipse 70% 60% at 70% 50%, rgba(37,99,235,0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 20% 80%, rgba(6,182,212,0.07) 0%, transparent 60%)' }} />

      {/* ── LEFT ── */}
      <div style={{ flex:'0 0 auto', maxWidth:580, zIndex:1,
        opacity: mounted ? 1 : 0, animation: mounted ? 'fadeUp .7s ease both' : 'none' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:8,
          background:'rgba(37,99,235,0.12)', border:'1px solid rgba(37,99,235,0.35)',
          borderRadius:999, padding:'5px 14px', marginBottom:32, fontSize:11,
          color:'#60a5fa', letterSpacing:'0.12em' }}>
          <span style={{ width:6,height:6,borderRadius:'50%',background:'#3b82f6',
            position:'relative',display:'inline-block' }}>
            <span style={{ position:'absolute',inset:0,borderRadius:'50%',background:'#3b82f6',
              animation:'ping 1.6s ease infinite' }} />
          </span>
          WATER QUALITY INTELLIGENCE PLATFORM
        </div>

        <h1 style={{ fontSize:'clamp(36px,4.5vw,62px)', fontWeight:800, lineHeight:1.08,
          color:'#fff', margin:'0 0 20px', letterSpacing:'-0.02em',
          fontFamily:"'DM Sans','DM Mono',sans-serif" }}>
          Monitor every{' '}
          <span style={{ background:'linear-gradient(135deg,#22d3ee,#3b82f6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>drop</span>
          {' '}in your<br />water network
        </h1>

        <p style={{ fontSize:16, color:'#94a3b8', lineHeight:1.7, margin:'0 0 36px', maxWidth:460 }}>
          Aqua system monitor gives utilities, municipalities, and engineers real-time visibility into water quality across their entire distribution network.
        </p>

        <div style={{ display:'flex', gap:12, marginBottom:52 }}>
          <button className="hero-btn-primary" onClick={() => navigate('/admin/dashboard')} style={{
            background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', border:'none',
            borderRadius:10, padding:'14px 30px', fontSize:15, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit', transition:'all .18s', letterSpacing:'0.02em',
          }}>Launch Console →</button>
          <button className="hero-btn-secondary" style={{
            background:'transparent', color:'#e2e8f0', border:'1px solid rgba(255,255,255,.15)',
            borderRadius:10, padding:'14px 26px', fontSize:15, cursor:'pointer',
            fontFamily:'inherit', transition:'all .18s',
          }}>Watch demo</button>
        </div>

        <div style={{ display:'flex', gap:40, borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:28 }}>
          {[['9/9','STATIONS LIVE','#22c55e'],['< 30s','REFRESH RATE','#22d3ee'],['3','ACTIVE ALARMS','#f59e0b']].map(([v,l,c]) => (
            <div key={l}>
              <div style={{ fontSize:24, fontWeight:700, color:c, fontVariantNumeric:'tabular-nums' }}>{v}</div>
              <div style={{ fontSize:10, color:'#64748b', letterSpacing:'0.12em', marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Dashboard mockup ── */}
      <div style={{ flex:1, minWidth:0, zIndex:1, display:'flex', justifyContent:'center',
        opacity: mounted ? 1 : 0, animation: mounted ? 'fadeUp .7s .2s ease both' : 'none' }}>
        <div style={{
          width:'100%', maxWidth:520,
          background:'#0C1829', border:'1px solid #1e3a5f',
          borderRadius:18, overflow:'hidden',
          boxShadow:'0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04)',
        }}>
          {/* Title bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'12px 16px', borderBottom:'1px solid #1e3a5f', background:'#0A1624' }}>
            <div style={{ display:'flex', gap:7 }}>
              {['#ef4444','#f59e0b','#22c55e'].map(c => (
                <div key={c} style={{ width:11,height:11,borderRadius:'50%',background:c }} />
              ))}
            </div>
            <div style={{ fontSize:12, color:'#64748b' }}>Aqua system monitor · Live Dashboard</div>
            <div style={{ fontSize:11, color:'#ef4444', background:'rgba(239,68,68,.12)',
              border:'1px solid rgba(239,68,68,.3)', borderRadius:5, padding:'2px 8px' }}>● 3 alarms</div>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
            borderBottom:'1px solid #1e3a5f' }}>
            {[['9/9','ONLINE','#22c55e'],['3','ALARMS','#ef4444'],['87','TAGS','#e2e8f0'],['98.7%','UPTIME','#22c55e']].map(([v,l,c]) => (
              <div key={l} style={{ padding:'16px 14px', borderRight:'1px solid #1e3a5f' }}>
                <div style={{ fontSize:22, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:9, color:'#475569', letterSpacing:'0.12em', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Readings */}
          <div style={{ padding:'16px 16px 0' }}>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:'0.12em', marginBottom:12 }}>LIVE SENSOR READINGS · INTAKE A</div>
            {READINGS.map(({ label, value, unit, status, color }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'11px 0', borderBottom:'1px solid rgba(30,58,95,.5)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:9, fontSize:13, color:'#cbd5e1' }}>
                  <span style={{ width:8,height:8,borderRadius:'50%',background:color,display:'inline-block' }} />
                  {label}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:14, fontWeight:700, color, fontVariantNumeric:'tabular-nums' }}>
                    {value} <span style={{ fontSize:10, fontWeight:400, color:'#64748b' }}>{unit}</span>
                  </span>
                  <span style={{ fontSize:9, padding:'2px 7px', borderRadius:4, fontWeight:700, letterSpacing:'0.08em',
                    color: status === 'WARNING' ? '#f59e0b' : '#22c55e',
                    background: status === 'WARNING' ? 'rgba(245,158,11,.12)' : 'rgba(34,197,94,.10)',
                    border: `1px solid ${status === 'WARNING' ? 'rgba(245,158,11,.3)' : 'rgba(34,197,94,.25)'}`,
                  }}>{status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sparkline */}
          <div style={{ padding:'12px 16px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', marginBottom:6 }}>
              <span>pH trend — 24h</span>
              <span style={{ color:'#22d3ee' }}>{liveVal} avg</span>
            </div>
            <SparkLine data={PH_SPARK} color="#3b82f6" />
          </div>
        </div>
      </div>
    </section>
  );
}