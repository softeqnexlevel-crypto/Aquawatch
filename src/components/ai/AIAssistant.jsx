// components/ai/AIAssistant.js
//
// Phase 1 chat panel: floating action button that opens a chat panel
// with Aqua AI. The panel can be dragged anywhere on screen (by its
// header), resized (drag the bottom-right corner), and expanded to a
// larger view via the toggle button in the header.
//
// Drop <AIAssistant /> once near the root of your app layout (e.g.
// alongside <Dashboard />) and it's available everywhere.
//
// ✅ Requires: npm install react-markdown
// (renders the AI's **bold**/bullet/heading markdown properly instead of
// showing literal asterisks as plain text)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Loader2, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { API_BASE_URL } from '../../config.js';

const SUGGESTED_QUESTIONS = [
  'How is RO5 performing right now?',
  'Are there any active alarms?',
  "What's the current system recovery?",
  'Is the system in filter or backwash mode?',
];

const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 480;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 320;
const EDGE_MARGIN = 12; // keeps the panel from being dragged fully off-screen

// Minimal markdown styling scoped to chat bubbles — keeps bold/bullets/
// paragraphs readable without pulling in a full stylesheet.
const markdownComponents = {
  p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '0 0 8px 0', paddingLeft: 18 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '0 0 8px 0', paddingLeft: 18 }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
  h1: ({ children }) => <div style={{ fontWeight: 700, fontSize: 13, margin: '4px 0 6px' }}>{children}</div>,
  h2: ({ children }) => <div style={{ fontWeight: 700, fontSize: 12.5, margin: '4px 0 6px' }}>{children}</div>,
  h3: ({ children }) => <div style={{ fontWeight: 700, fontSize: 12.5, margin: '4px 0 6px' }}>{children}</div>,
  code: ({ children }) => (
    <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: 3, fontSize: 11.5 }}>
      {children}
    </code>
  ),
};

function ChatBubble({ role, content, isError }) {
  const isUser = role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '8px 12px',
          borderRadius: 10,
          fontSize: 12.5,
          lineHeight: 1.5,
          background: isUser ? '#0ea5e9' : isError ? 'rgba(239,68,68,0.1)' : 'var(--secondary)',
          color: isUser ? '#020810' : isError ? '#ef4444' : 'var(--foreground)',
          border: isUser ? 'none' : `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
        }}
      >
        {isUser || isError ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
        ) : (
          <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Panel geometry — null until first opened, then computed relative to
  // the viewport so it starts in the same bottom-right spot as before.
  const [pos, setPos] = useState(null); // { top, left }
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const preExpandState = useRef(null); // stores {pos, size} to restore on collapse

  const scrollRef = useRef(null);
  const panelRef = useRef(null);
  const dragRef = useRef(null);   // { startX, startY, startLeft, startTop }
  const resizeRef = useRef(null); // { startX, startY, startWidth, startHeight }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Compute default bottom-right position the first time the panel opens.
  useEffect(() => {
    if (isOpen && !pos) {
      setPos({
        left: window.innerWidth - size.width - 20,
        top: window.innerHeight - size.height - 20,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const clampToViewport = useCallback((nextPos, nextSize) => {
    const maxLeft = window.innerWidth - nextSize.width - EDGE_MARGIN;
    const maxTop = window.innerHeight - nextSize.height - EDGE_MARGIN;
    return {
      left: Math.min(Math.max(nextPos.left, EDGE_MARGIN), Math.max(maxLeft, EDGE_MARGIN)),
      top: Math.min(Math.max(nextPos.top, EDGE_MARGIN), Math.max(maxTop, EDGE_MARGIN)),
    };
  }, []);

  // ==================== DRAG (via header) ====================
  const handleDragStart = (e) => {
    if (!pos) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: pos.left,
      startTop: pos.top,
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current) return;
    const { startX, startY, startLeft, startTop } = dragRef.current;
    const next = { left: startLeft + (e.clientX - startX), top: startTop + (e.clientY - startY) };
    setPos((prev) => clampToViewport(next, size));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, clampToViewport]);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragMove]);

  // ==================== RESIZE (bottom-right handle) ====================
  const handleResizeStart = (e) => {
    e.stopPropagation();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = useCallback((e) => {
    if (!resizeRef.current) return;
    const { startX, startY, startWidth, startHeight } = resizeRef.current;
    const maxWidth = window.innerWidth - EDGE_MARGIN * 2;
    const maxHeight = window.innerHeight - EDGE_MARGIN * 2;
    const nextWidth = Math.min(Math.max(startWidth + (e.clientX - startX), MIN_WIDTH), maxWidth);
    const nextHeight = Math.min(Math.max(startHeight + (e.clientY - startY), MIN_HEIGHT), maxHeight);
    setSize({ width: nextWidth, height: nextHeight });
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current = null;
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  // ==================== EXPAND / COLLAPSE ====================
  const toggleExpanded = () => {
    if (!isExpanded) {
      // Save current geometry so we can restore it exactly on collapse.
      preExpandState.current = { pos, size };
      const expandedSize = {
        width: Math.min(720, window.innerWidth - EDGE_MARGIN * 2),
        height: Math.min(760, window.innerHeight - EDGE_MARGIN * 2),
      };
      const expandedPos = clampToViewport(
        { left: (window.innerWidth - expandedSize.width) / 2, top: (window.innerHeight - expandedSize.height) / 2 },
        expandedSize
      );
      setSize(expandedSize);
      setPos(expandedPos);
      setIsExpanded(true);
    } else {
      if (preExpandState.current) {
        setSize(preExpandState.current.size);
        setPos(preExpandState.current.pos);
      }
      setIsExpanded(false);
    }
  };

  // Aqua AI API call
  async function askAqua(message) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const data = await askAqua(trimmed);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Couldn't reach Aqua AI: ${err.message}`, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {/* Floating action button — always fixed bottom-right, independent of panel position */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Aqua AI"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 998,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#0ea5e9',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(14,165,233,0.4)',
          }}
        >
          <Bot size={24} color="#020810" />
        </button>
      )}

      {/* Chat panel — draggable, resizable, expandable */}
      {isOpen && pos && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 999,
            width: size.width,
            height: size.height,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}
        >
          {/* Header — drag handle */}
          <div
            onMouseDown={handleDragStart}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(14,165,233,0.06)',
              cursor: 'move',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="#0ea5e9" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>Aqua AI</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={toggleExpanded}
                onMouseDown={(e) => e.stopPropagation()} // don't start a drag when clicking this
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                title={isExpanded ? 'Collapse' : 'Expand'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                {isExpanded ? (
                  <Minimize2 size={14} color="var(--muted-foreground)" />
                ) : (
                  <Maximize2 size={14} color="var(--muted-foreground)" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Close"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <X size={16} color="var(--muted-foreground)" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {messages.length === 0 && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 10 }}>
                  Ask me about RO5's current status, KPIs, or active alarms.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      style={{
                        textAlign: 'left',
                        fontSize: 11.5,
                        padding: '7px 10px',
                        borderRadius: 6,
                        background: 'var(--secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                        cursor: 'pointer',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} isError={m.isError} />
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)', fontSize: 11.5 }}>
                <Loader2 size={13} className="animate-spin" />
                Aqua AI is thinking…
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              gap: 6,
              padding: 10,
              borderTop: '1px solid var(--border)',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your system…"
              disabled={loading}
              style={{
                flex: 1,
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 12,
                color: 'var(--foreground)',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                background: loading || !input.trim() ? 'var(--muted)' : '#0ea5e9',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                flexShrink: 0,
              }}
            >
              <Send size={14} color={loading || !input.trim() ? 'var(--muted-foreground)' : '#020810'} />
            </button>
          </form>

          {/* Resize handle — bottom-right corner */}
          <div
            onMouseDown={handleResizeStart}
            title="Drag to resize"
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 16,
              height: 16,
              cursor: 'nwse-resize',
              background: `linear-gradient(135deg, transparent 50%, var(--border) 50%)`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
}

export default AIAssistant;