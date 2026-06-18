'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  'How much does G+1 construction cost in Pune?',
  'Is my contractor\'s quote fair?',
  'What is M20 concrete?',
  'How many bricks do I need for 1000 sqft?',
  'What is IS 456:2000?',
  'How to check if steel is being stolen on site?',
]

// Iron Ink at various opacities over Sheet White
const COLORS = {
  sheetWhite: '#F4F4F0',
  ironInk: '#1E2227',
  blueprint: '#1F4E79',
  ink10: 'rgba(30,34,39,0.10)',
  ink20: 'rgba(30,34,39,0.20)',
  ink40: 'rgba(30,34,39,0.40)',
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: COLORS.ink40,
            display: 'inline-block',
            animation: `ns-bounce 1.2s ${i * 0.2}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  )
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 12,
        padding: '0 12px',
      }}
    >
      <div
        style={{
          maxWidth: '82%',
          padding: '9px 13px',
          borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
          background: isUser ? COLORS.blueprint : '#fff',
          border: isUser ? 'none' : `1px solid ${COLORS.ink10}`,
          color: isUser ? '#fff' : COLORS.ironInk,
          fontFamily: 'var(--font-plex-sans), sans-serif',
          fontSize: 14,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {msg.content}
      </div>
    </div>
  )
}

export default function AIChatbox() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever messages or loading changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [open])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (data.text) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.text }])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please check your connection and try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const showSuggestions = messages.length === 0 && !loading

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes ns-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes ns-panel-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Floating button */}
      <div
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Desktop label — hide on mobile via inline media won't work, use className */}
        {!open && (
          <span
            className="hidden sm:inline-block"
            style={{
              fontFamily: 'var(--font-plex-sans), sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.ironInk,
              background: '#fff',
              border: `1px solid ${COLORS.ink20}`,
              borderRadius: 6,
              padding: '6px 12px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              boxShadow: `0 1px 0 ${COLORS.ink10}`,
              letterSpacing: '0.01em',
            }}
            onClick={() => setOpen(true)}
          >
            Ask NirmanShastra
          </span>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close AI chat' : 'Open AI chat'}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: COLORS.blueprint,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(31,78,121,0.35)',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#163d61')}
          onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.blueprint)}
        >
          {open ? (
            // X icon
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="5" y1="5" x2="15" y2="15" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <line x1="15" y1="5" x2="5" y2="15" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            // Chat bubble icon
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M3 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7l-4 3V4z"
                fill="#fff"
                fillOpacity="0.95"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            bottom: 92,
            right: 28,
            zIndex: 9998,
            width: 'min(400px, calc(100vw - 32px))',
            height: 'min(600px, calc(100dvh - 120px))',
            background: COLORS.sheetWhite,
            border: `1px solid ${COLORS.ink20}`,
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(30,34,39,0.16)',
            animation: 'ns-panel-in 0.18s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: COLORS.ironInk,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Hardhat icon */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: COLORS.blueprint,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 13h12M5 13V9a4 4 0 0 1 8 0v4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="2" y="12" width="14" height="2" rx="1" fill="#fff"/>
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-plex-sans), sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                    lineHeight: 1.2,
                  }}
                >
                  NirmanShastra AI
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-plex-mono), monospace',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: 1,
                    letterSpacing: '0.04em',
                  }}
                >
                  POWERED BY CLAUDE
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: 'rgba(255,255,255,0.6)',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <line x1="4" y1="4" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="14" y1="4" x2="4" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingTop: 16,
              paddingBottom: 8,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {showSuggestions && (
              <div style={{ padding: '0 12px 12px' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-plex-sans), sans-serif',
                    fontSize: 13,
                    color: COLORS.ink40,
                    marginBottom: 12,
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}
                >
                  Your IS-code construction advisor.<br />Ask me anything about building costs or materials.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      style={{
                        fontFamily: 'var(--font-plex-sans), sans-serif',
                        fontSize: 12,
                        color: COLORS.blueprint,
                        background: 'rgba(31,78,121,0.07)',
                        border: `1px solid rgba(31,78,121,0.2)`,
                        borderRadius: 6,
                        padding: '5px 10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        lineHeight: 1.4,
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(31,78,121,0.13)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(31,78,121,0.07)')}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} />
            ))}

            {loading && (
              <div style={{ padding: '0 12px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    background: '#fff',
                    border: `1px solid ${COLORS.ink10}`,
                    borderRadius: '14px 14px 14px 2px',
                    marginBottom: 12,
                  }}
                >
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: COLORS.ink10, flexShrink: 0 }} />

          {/* Input area */}
          <div
            style={{
              padding: '10px 12px',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
              background: '#fff',
              flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about construction costs, IS codes…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                fontFamily: 'var(--font-plex-sans), sans-serif',
                fontSize: 14,
                color: COLORS.ironInk,
                background: COLORS.sheetWhite,
                border: `1px solid ${COLORS.ink20}`,
                borderRadius: 6,
                padding: '9px 12px',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.5,
                maxHeight: 96,
                overflowY: 'auto',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.blueprint)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.ink20)}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              style={{
                width: 38,
                height: 38,
                borderRadius: 6,
                background: input.trim() && !loading ? COLORS.blueprint : COLORS.ink10,
                border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M14 8L2 2l3 6-3 6 12-6z"
                  fill={input.trim() && !loading ? '#fff' : COLORS.ink40}
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
