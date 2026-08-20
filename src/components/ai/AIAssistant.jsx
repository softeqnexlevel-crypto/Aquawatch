// components/ai/AIAssistant.js
//
// Phase 1 chat panel: floating action button that opens a slide-out chat
// with Aqua AI. Drop <AIAssistant /> once near the root of your app
// layout (e.g. alongside <Dashboard />) and it's available everywhere.
//
// Plain response for now (no streaming) — matches Phase 1 scope agreed
// on. Streaming can be added later without changing the outer shape of
// this component.

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const SUGGESTED_QUESTIONS = [
  'How is RO5 performing right now?',
  'Are there any active alarms?',
  "What's the current system recovery?",
  'Is the system in filter or backwash mode?',
];

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
          whiteSpace: 'pre-wrap',
          background: isUser ? '#0ea5e9' : isError ? 'rgba(239,68,68,0.1)' : 'var(--secondary)',
          color: isUser ? '#020810' : isError ? '#ef4444' : 'var(--foreground)',
          border: isUser ? 'none' : `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
        }}
      >
        {content}
      </div>
    </div>
  );
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

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
      {/* Floating action button */}
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

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 999,
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            height: 480,
            maxHeight: 'calc(100vh - 40px)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(14,165,233,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="#0ea5e9" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>Aqua AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <X size={16} color="var(--muted-foreground)" />
            </button>
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
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default AIAssistant;