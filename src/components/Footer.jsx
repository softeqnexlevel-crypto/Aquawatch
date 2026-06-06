import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{ background:'#060D1A', borderTop:'1px solid #1e3a5f',
      padding:'48px 6vw 32px', fontFamily:"'DM Mono','Courier New',monospace" }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:40, marginBottom:40 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:30,height:30,borderRadius:'50%',background:'#2563eb',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#fff' }}>≋</div>
              <span style={{ fontSize:15, fontWeight:700, color:'#e2e8f0', letterSpacing:'0.04em' }}>AQUASYNC</span>
            </div>
            <p style={{ fontSize:12, color:'#475569', lineHeight:1.8, maxWidth:260 }}>
              Real-time water quality monitoring for utilities, municipalities, and engineers worldwide.
            </p>
          </div>
          {[
            { title:'PRODUCT', links:['Dashboard','Stations','Analytics','Alarms','Billing'] },
            { title:'COMPANY', links:['About','Blog','Careers','Press'] },
            { title:'LEGAL', links:['Privacy','Terms','Security','Compliance'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div style={{ fontSize:10, color:'#475569', letterSpacing:'0.14em', marginBottom:14 }}>{title}</div>
              {links.map(l => (
                <div key={l} style={{ fontSize:13, color:'#64748b', marginBottom:10, cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color='#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.color='#64748b'}>{l}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid #1e3a5f', paddingTop:24,
          display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, color:'#475569' }}>
          <span>© 2025 AquaSync. All rights reserved.</span>
          <button onClick={() => navigate('/admin/dashboard')} style={{
            background:'transparent', border:'1px solid #1e3a5f', borderRadius:6,
            color:'#64748b', padding:'6px 16px', cursor:'pointer', fontSize:11, fontFamily:'inherit',
          }}>Admin Console →</button>
        </div>
      </div>
    </footer>
  );
}