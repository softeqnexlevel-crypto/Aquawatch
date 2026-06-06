export default function StatsBar() {
  const stats = [
    { value:'99.97%', label:'UPTIME SLA' },
    { value:'< 30s',  label:'SENSOR REFRESH' },
    { value:'2,400+', label:'STATIONS MONITORED' },
    { value:'WHO',    label:'STANDARDS ALIGNED' },
  ];
  return (
    <div style={{ background:'#080F1C', borderTop:'1px solid #1e3a5f', borderBottom:'1px solid #1e3a5f',
      fontFamily:"'DM Mono','Courier New',monospace" }}>
      <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
        {stats.map(({ value, label }, i) => (
          <div key={label} style={{ padding:'32px 28px',
            borderRight: i < 3 ? '1px solid #1e3a5f' : 'none' }}>
            <div style={{ fontSize:36, fontWeight:700, color:'#e2e8f0', letterSpacing:'-0.02em', lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:'0.14em', marginTop:8 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}