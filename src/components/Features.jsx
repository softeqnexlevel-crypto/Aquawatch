const features = [
  {
    icon: '⬡',
    color: '#14b8a6',
    bg: 'rgba(20,184,166,.10)',
    title: 'Real-time sensor monitoring',
    desc: 'Stream pH, chlorine, turbidity, pressure and DO readings from unlimited sensor nodes. Sub-30s refresh rates with full audit trail.',
  },
  {
    icon: '◬',
    color: '#ef4444',
    bg: 'rgba(239,68,68,.10)',
    title: 'Intelligent alarm engine',
    desc: 'Multi-level alerting: critical, warning, info. Auto-escalation, acknowledgement workflows, and on-call rotation built in.',
  },
  {
    icon: '◈',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,.10)',
    title: 'Analytics & compliance',
    desc: 'WHO-standard compliance scoring, trend charts, anomaly detection and one-click PDF reports for regulatory submissions.',
  },
  {
    icon: '⊞',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,.10)',
    title: 'Multi-station management',
    desc: 'Manage city-wide networks with map view, station health cards, threshold config per node, and per-station data retention.',
  },
  {
    icon: '◉',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,.10)',
    title: 'Tag-based classification',
    desc: 'Build conditional tag rules across any sensor dimension. Route data, trigger alarms, and generate reports based on tags.',
  },
  {
    icon: '⟳',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,.10)',
    title: 'REST API & integrations',
    desc: 'Full REST API access with webhooks, SCADA bridge support, and SDKs for Python and Node. Integrate in a weekend.',
  },
];

export default function Features() {
  return (
    <section style={{ background:'#060D1A', padding:'100px 6vw',
      fontFamily:"'DM Mono','Courier New',monospace" }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(37,99,235,.10)', border:'1px solid rgba(37,99,235,.3)',
            borderRadius:999, padding:'5px 16px', marginBottom:20, fontSize:11,
            color:'#60a5fa', letterSpacing:'0.12em' }}>PLATFORM CAPABILITIES</div>
          <h2 style={{ fontSize:'clamp(28px,3.5vw,46px)', fontWeight:800, color:'#fff',
            margin:'0 0 14px', letterSpacing:'-0.02em', fontFamily:"'DM Sans','DM Mono',sans-serif" }}>
            Built for water engineers
          </h2>
          <p style={{ fontSize:16, color:'#64748b', maxWidth:520, margin:'0 auto' }}>
            Everything you need to achieve WHO compliance and protect your distribution network.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {features.map(({ icon, color, bg, title, desc }) => (
            <div key={title} style={{
              background:'#0C1829', border:'1px solid #1e3a5f', borderRadius:14,
              padding:'28px 26px', transition:'border-color .2s, transform .2s',
              cursor:'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e3a5f'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ width:44, height:44, borderRadius:10, background:bg,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:20, color, marginBottom:18 }}>{icon}</div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#e2e8f0', margin:'0 0 10px',
                fontFamily:"'DM Sans','DM Mono',sans-serif" }}>{title}</h3>
              <p style={{ fontSize:13, color:'#64748b', lineHeight:1.7, margin:0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}