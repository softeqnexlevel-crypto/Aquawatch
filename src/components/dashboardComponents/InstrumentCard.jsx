// components/dashboardComponents/InstrumentCard.jsx
import React from 'react';

export function InstrumentCard({ title, subtitle, children }) {
  return (
    <div className="rounded-lg p-3 sm:p-4"
         style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

export default InstrumentCard;