import { useNavigate } from 'react-router-dom';

export default function CTA() {
  const navigate = useNavigate();
  return (
    <section style={{ background:'#060D1A', padding:'100px 6vw', textAlign:'center',
      fontFamily:"'DM Mono','Courier New',monospace", position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(37,99,235,.10) 0%, transparent 70%)' }} />
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8,
          background:'rgba(37,99,235,.10)', border:'1px solid rgba(37,99,235,.3)',
          borderRadius:999, padding:'5px 16px', marginBottom:24, fontSize:11,
          color:'#60a5fa', letterSpacing:'0.12em' }}>GET STARTED TODAY</div>
        <h2 style={{ fontSize:'clamp(32px,4vw,56px)', fontWeight:800, color:'#fff',
          margin:'0 0 10px', letterSpacing:'-0.02em', lineHeight:1.1,
          fontFamily:"'DM Sans','DM Mono',sans-serif" }}>
          Clean water starts with
        </h2>
        <h2 style={{ fontSize:'clamp(32px,4vw,56px)', fontWeight:800, margin:'0 0 32px',
          letterSpacing:'-0.02em', lineHeight:1.1, fontFamily:"'DM Sans','DM Mono',sans-serif",
          background:'linear-gradient(135deg,#3b82f6,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          clear data
        </h2>
        <div style={{ display:'flex', gap:14, justifyContent:'center' }}>
          <button onClick={() => navigate('/admin/dashboard')} style={{
            background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', border:'none',
            borderRadius:10, padding:'15px 34px', fontSize:16, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.02em',
          }}>Launch Console →</button>
          <button style={{
            background:'transparent', color:'#e2e8f0', border:'1px solid rgba(255,255,255,.15)',
            borderRadius:10, padding:'15px 28px', fontSize:16, cursor:'pointer', fontFamily:'inherit',
          }}>Book a demo</button>
        </div>
      </div>
    </section>
  );
}