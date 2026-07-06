// components/ScrollContainer.jsx
import React from 'react';

export function ScrollContainer({ children, className = '', style = {} }) {
  return (
    <div
      className={`scroll-container ${className}`}
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        width: '100%',
        position: 'relative',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(14, 165, 233, 0.3) transparent',
        ...style
      }}
    >
      <style>{`
        .scroll-container::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .scroll-container::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .scroll-container::-webkit-scrollbar-thumb {
          background: rgba(14, 165, 233, 0.3);
          border-radius: 3px;
          transition: background 0.2s ease;
        }
        .scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(14, 165, 233, 0.5);
        }
        .scroll-container::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>
      {children}
    </div>
  );
}