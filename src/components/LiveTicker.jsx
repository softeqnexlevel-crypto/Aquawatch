import { useState, useEffect } from 'react';

const EVENTS = [
  '● STN-001 · pH 7.32 · NORMAL',
  '● STN-002 · Turbidity 4.21 NTU · WARNING',
  '● STN-003 · Chlorine 0.28 mg/L · NORMAL',
  '● STN-004 · Pressure 3.10 bar · NORMAL',
  '● STN-005 · pH 5.11 · ALARM',
  '● STN-006 · DO 8.4 mg/L · NORMAL',
  '● STN-007 · Temp 23.1°C · NORMAL',
  '● STN-001 · Flow 148 L/min · NORMAL',
];

export default function LiveTicker() {
  return (
    <div style={{ background:'#080F1C', borderTop:'1px solid #1e3a5f',
      padding:'10px 0', overflow:'hidden', fontFamily:"'DM Mono','Courier New',monospace" }}>
      <style>{`
        @keyframes ticker { from { transform:translateX(0); } to { transform:translateX(-50%); } }
      `}</style>
      <div style={{ display:'flex', gap:0, animation:'ticker 28s linear infinite', whiteSpace:'nowrap', width:'max-content' }}>
        {[...EVENTS, ...EVENTS].map((e, i) => (
          <span key={i} style={{
            fontSize:11, letterSpacing:'0.08em', padding:'0 32px',
            color: e.includes('ALARM') ? '#ef4444' : e.includes('WARNING') ? '#f59e0b' : '#475569',
            borderRight:'1px solid #1e3a5f',
          }}>{e}</span>
        ))}
      </div>
    </div>
  );
}