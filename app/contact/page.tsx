'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('sent')
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: '#F4F4F0',
    border: '1px solid rgba(30,34,39,0.25)',
    color: '#1E2227',
    padding: '12px 14px',
    fontSize: 15,
    fontFamily: 'var(--font-plex-sans)',
    outline: 'none',
    borderRadius: 6,
    display: 'block',
  }

  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>

      {/* Header band */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.1)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-16">
          <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.1 }}>
            Contact
          </h1>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(244,244,240,0.6)', marginTop: 12, maxWidth: 500 }}>
            Based in India — serving homeowners across India.
          </p>
        </div>
      </div>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* Contact form */}
          <div>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24 }}>
              SEND A MESSAGE
            </p>

            {status === 'sent' ? (
              <div style={{ border: '1px solid #14532D', padding: '24px', background: 'rgba(20,83,45,0.06)' }}>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 13, color: '#14532D', letterSpacing: '0.04em' }}>
                  MESSAGE SENT — We will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                <div>
                  <label style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    placeholder="Your full name"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={e => update('subject', e.target.value)}
                    placeholder="What is this about?"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={e => update('message', e.target.value)}
                    placeholder="Your message..."
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 140 }}
                  />
                </div>

                {status === 'error' && (
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: '#8C3A22', letterSpacing: '0.04em' }}>
                    Something went wrong. Please try emailing us directly.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  style={{
                    background: status === 'sending' ? 'rgba(140,58,34,0.5)' : '#8C3A22',
                    color: '#F4F4F0',
                    fontFamily: 'var(--font-plex-mono)',
                    fontSize: 14,
                    padding: '14px 28px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.04em',
                    alignSelf: 'flex-start',
                  }}
                >
                  {status === 'sending' ? 'Sending…' : 'Send Message →'}
                </button>
              </form>
            )}
          </div>

          {/* Direct contact details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            <div>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
                DIRECT CONTACT
              </p>
              <div style={{ border: '1px solid rgba(30,34,39,0.15)', padding: '28px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(30,34,39,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>EMAIL</p>
                    <a href="mailto:reports@nirmanshastra.in" style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 14, color: '#1F4E79', textDecoration: 'none' }}>
                      reports@nirmanshastra.in
                    </a>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(30,34,39,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>LOCATION</p>
                    <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.75)' }}>
                      Uttar Pradesh, India
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(30,34,39,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>RESPONSE TIME</p>
                    <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.75)' }}>
                      Within 24–48 hours on business days
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid-paper" style={{ border: '1px solid rgba(30,34,39,0.1)', padding: '24px' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.45)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                WHAT TO INCLUDE
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Your city and state (for material rate context)',
                  'Which tool you used or are asking about',
                  'A brief description of the issue or question',
                  'Your Estimate ID if you have one (found in your PDF report)',
                ].map((item, i) => (
                  <p key={i} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.65)', display: 'flex', gap: 10 }}>
                    <span style={{ color: '#1F4E79', flexShrink: 0 }}>{i + 1}.</span> {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
