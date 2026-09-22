// components/dashboardComponents/InstrumentCard.jsx
import React from 'react';

const TONE_COLORS = {
  normal: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#64748b',
};

export function InstrumentCard({ title, subtitle, status, statusTone = 'muted', legend, children }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const toneColor = TONE_COLORS[statusTone] || TONE_COLORS.muted;

  return (
    <div className="rounded-lg p-2 sm:p-4"
         style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: isMobile ? 6 : 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? 11 : 14, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: isMobile ? 8 : 10, color: 'var(--muted-foreground)', marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        {status && (
          <span style={{
            flexShrink: 0,
            fontSize: isMobile ? 8 : 9.5,
            fontWeight: 700,
            color: toneColor,
            background: `${toneColor}1a`,
            border: `1px solid ${toneColor}40`,
            borderRadius: 6,
            padding: isMobile ? '2px 5px' : '3px 8px',
            whiteSpace: 'nowrap',
          }}>
            {status}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {children}
      </div>

      {legend && legend.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: isMobile ? 4 : 8,
          marginTop: isMobile ? 8 : 12,
        }}>
          {legend.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: isMobile ? 7 : 9, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                {isMobile ? item.label : `${item.label} (${item.range})`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InstrumentCard;