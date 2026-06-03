

import { useState } from 'react';
 
const S = {
  card: { background: '#0D1F30', border: '1px solid #1A3A52', borderRadius: 10, padding: '20px' },
  label: { fontSize: 10, letterSpacing: '0.12em', color: '#4A8FA8' },
  btn: (primary) => ({
    background: primary ? '#00B4D8' : 'transparent',
    border: `1px solid ${primary ? '#00B4D8' : '#1A3A52'}`,
    borderRadius: 6, color: primary ? '#07111F' : '#6BA3BC',
    padding: '8px 18px', cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit', fontWeight: primary ? 700 : 400, letterSpacing: '0.06em',
  }),
};
 
const invoices = [
  { id: 'INV-2025-06', date: 'Jun 1, 2025', amount: 349.00, status: 'paid',    period: 'Jun 2025' },
  { id: 'INV-2025-05', date: 'May 1, 2025', amount: 349.00, status: 'paid',    period: 'May 2025' },
  { id: 'INV-2025-04', date: 'Apr 1, 2025', amount: 299.00, status: 'paid',    period: 'Apr 2025' },
  { id: 'INV-2025-03', date: 'Mar 1, 2025', amount: 299.00, status: 'paid',    period: 'Mar 2025' },
  { id: 'INV-2025-02', date: 'Feb 1, 2025', amount: 149.00, status: 'paid',    period: 'Feb 2025' },
];
 
const plans = [
  { name: 'Starter',    price: 149,  stations: 5,  retention: '30d',  api: 'Limited', support: 'Email',    current: false },
  { name: 'Pro',        price: 349,  stations: 20, retention: '1yr',  api: 'Full',    support: 'Priority', current: true  },
  { name: 'Enterprise', price: null, stations: '∞',retention: '5yr',  api: 'Full',    support: '24/7 SLA', current: false },
];
 
const usageItems = [
  { label: 'Active Stations', used: 12, limit: 20, unit: '' },
  { label: 'API Calls / month', used: 284000, limit: 500000, unit: '' },
  { label: 'Data Storage', used: 42, limit: 100, unit: 'GB' },
  { label: 'Alerts Sent', used: 87, limit: 1000, unit: '' },
];
 
export default function Billing() {
  const [tab, setTab] = useState('overview');
 
  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", color: '#C8E6F5' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: '#4A8FA8', letterSpacing: '0.14em', marginBottom: 4 }}>SUBSCRIPTION</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E0F4FF', margin: 0 }}>Billing</h1>
      </div>
 
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid #1A3A52' }}>
        {['overview','plans','invoices'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t ? '#00D4FF' : 'transparent'}`,
            color: tab === t ? '#00D4FF' : '#6BA3BC', padding: '10px 20px', cursor: 'pointer',
            fontSize: 12, fontFamily: 'inherit', letterSpacing: '0.08em', marginBottom: -1,
          }}>{t.toUpperCase()}</button>
        ))}
      </div>
 
      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ ...S.card, borderTop: '2px solid #00B4D8' }}>
              <div style={S.label}>CURRENT PLAN</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#E0F4FF', margin: '8px 0 4px' }}>Pro</div>
              <div style={{ fontSize: 12, color: '#4A8FA8' }}>$349/month · renews Jul 1, 2025</div>
              <button style={{ ...S.btn(false), marginTop: 16 }}>Manage Plan</button>
            </div>
            <div style={{ ...S.card, borderTop: '2px solid #00FF88' }}>
              <div style={S.label}>NEXT INVOICE</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#00FF88', margin: '8px 0 4px' }}>$349.00</div>
              <div style={{ fontSize: 12, color: '#4A8FA8' }}>Due Jul 1, 2025 · Visa ···· 4242</div>
              <button style={{ ...S.btn(false), marginTop: 16 }}>Update Payment</button>
            </div>
          </div>
 
          {/* Usage bars */}
          <div style={S.card}>
            <div style={{ ...S.label, marginBottom: 16 }}>USAGE THIS CYCLE</div>
            {usageItems.map(({ label, used, limit, unit }) => {
              const pct = Math.round((used / limit) * 100);
              return (
                <div key={label} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: '#C8E6F5' }}>{label}</span>
                    <span style={{ color: '#4A8FA8' }}>{typeof used === 'number' && used > 1000 ? used.toLocaleString() : used}{unit} / {typeof limit === 'number' && limit > 1000 ? limit.toLocaleString() : limit}{unit}</span>
                  </div>
                  <div style={{ height: 6, background: '#071320', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: pct > 80 ? '#FF5555' : pct > 60 ? '#FFB400' : '#00B4D8',
                      borderRadius: 3, transition: 'width 0.4s',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: pct > 80 ? '#FF5555' : '#4A8FA8', marginTop: 4, textAlign: 'right' }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
 
      {tab === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {plans.map(p => (
            <div key={p.name} style={{ ...S.card, borderColor: p.current ? '#00B4D8' : '#1A3A52', position: 'relative' }}>
              {p.current && (
                <div style={{ position: 'absolute', top: -10, left: 20, background: '#00B4D8', color: '#07111F', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '2px 10px', borderRadius: 4 }}>CURRENT</div>
              )}
              <div style={{ fontSize: 16, fontWeight: 700, color: '#E0F4FF', marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: p.current ? '#00B4D8' : '#C8E6F5', marginBottom: 16 }}>
                {p.price ? `$${p.price}` : 'Custom'}<span style={{ fontSize: 12, fontWeight: 400, color: '#4A8FA8' }}>{p.price ? '/mo' : ''}</span>
              </div>
              {[
                [`Stations`, p.stations],
                [`Data retention`, p.retention],
                [`API access`, p.api],
                [`Support`, p.support],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1A3A52', padding: '8px 0', fontSize: 12 }}>
                  <span style={{ color: '#4A8FA8' }}>{k}</span>
                  <span style={{ color: '#C8E6F5' }}>{v}</span>
                </div>
              ))}
              <button style={{ ...S.btn(!p.current), marginTop: 20, width: '100%' }}>
                {p.current ? 'Current Plan' : p.price ? 'Switch Plan' : 'Contact Sales'}
              </button>
            </div>
          ))}
        </div>
      )}
 
      {tab === 'invoices' && (
        <div style={S.card}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1A3A52' }}>
                {['INVOICE','PERIOD','DATE','AMOUNT','STATUS',''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#4A8FA8', fontWeight: 400, letterSpacing: '0.08em', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid rgba(26,58,82,0.4)' }}>
                  <td style={{ padding: '12px 12px', color: '#6BA3BC' }}>{inv.id}</td>
                  <td style={{ padding: '12px 12px', color: '#C8E6F5' }}>{inv.period}</td>
                  <td style={{ padding: '12px 12px', color: '#6BA3BC' }}>{inv.date}</td>
                  <td style={{ padding: '12px 12px', color: '#E0F4FF', fontWeight: 700 }}>${inv.amount.toFixed(2)}</td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ fontSize: 10, color: '#00FF88', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 4, padding: '2px 8px', letterSpacing: '0.08em' }}>PAID</span>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <button style={{ background: 'transparent', border: 'none', color: '#00B4D8', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>↓ PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
 
