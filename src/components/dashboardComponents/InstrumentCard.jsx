// components/dashboardComponents/InstrumentCard.jsx
import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, MinusCircle } from 'lucide-react';

const TONES = {
  normal:  { color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
  warning: { color: '#eab308', bg: 'rgba(234,179,8,0.10)' },
  danger:  { color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
  muted:   { color: '#64748b', bg: 'rgba(100,116,139,0.10)' },
};

export function InstrumentCard({ title, subtitle, status, statusTone = 'muted', legend, children }) {
  const tone = TONES[statusTone] || TONES.muted;
  const Icon = statusTone === 'normal'  ? CheckCircle
             : statusTone === 'warning' ? AlertTriangle
             : statusTone === 'danger'  ? AlertCircle
             : MinusCircle;

  return (
    <div className="rounded-lg p-3 sm:p-4"
         style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        {status && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 10px', borderRadius: 12,
            background: tone.bg, color: tone.color,
            fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            <Icon size={10} /> {status}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {children}
      </div>

      {legend && legend.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          {legend.map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
              <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
                <strong style={{ color: 'var(--foreground)' }}>{l.label}</strong>
                {l.range ? ` (${l.range})` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InstrumentCard;