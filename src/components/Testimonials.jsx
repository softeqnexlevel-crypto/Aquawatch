const testimonials = [
  {
    quote: 'AquaWatch cut our compliance reporting time from two days to 20 minutes. The chlorine alarm saved a district last April.',
    name: 'Amara Osei',
    role: 'Chief Water Engineer, Accra Water',
    initials: 'AO',
    color: '#14b8a6',
  },
  {
    quote: 'We monitor 340 nodes across the county. The map view and bulk alarm acknowledge are indispensable for our team.',
    name: 'Dr. Wanjiru Kamau',
    role: 'Operations Director, Nairobi City Water',
    initials: 'WK',
    color: '#3b82f6',
  },
  {
    quote: 'The REST API let us integrate with our SCADA in a weekend. Documentation is excellent.',
    name: 'Samuel Adeyemi',
    role: 'IT Lead, Lagos State Water Corporation',
    initials: 'SA',
    color: '#8b5cf6',
  },
];

export default function Testimonials() {
  return (
    <section style={{ background:'#080F1C', padding:'100px 6vw',
      borderTop:'1px solid #1e3a5f', fontFamily:"'DM Mono','Courier New',monospace" }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ marginBottom:52 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(37,99,235,.10)', border:'1px solid rgba(37,99,235,.3)',
            borderRadius:999, padding:'5px 16px', marginBottom:18, fontSize:11,
            color:'#60a5fa', letterSpacing:'0.12em' }}>TRUSTED BY WATER UTILITIES</div>
          <h2 style={{ fontSize:'clamp(26px,3vw,40px)', fontWeight:800, color:'#fff',
            margin:0, letterSpacing:'-0.02em', fontFamily:"'DM Sans','DM Mono',sans-serif" }}>
            What engineers say
          </h2>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {testimonials.map(({ quote, name, role, initials, color }) => (
            <div key={name} style={{ background:'#0C1829', border:'1px solid #1e3a5f',
              borderRadius:14, padding:'28px 26px', display:'flex', flexDirection:'column', gap:24 }}>
              <p style={{ fontSize:14, color:'#94a3b8', lineHeight:1.75, margin:0, fontStyle:'italic' }}>
                "{quote}"
              </p>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:'auto' }}>
                <div style={{ width:40, height:40, borderRadius:'50%',
                  background:`${color}22`, border:`1px solid ${color}44`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:700, color, flexShrink:0 }}>{initials}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#e2e8f0' }}>{name}</div>
                  <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}