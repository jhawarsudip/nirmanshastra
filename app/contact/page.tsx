'use client'

import { useState } from 'react'
import { trackLead } from '@/lib/analytics/events'
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER, whatsappUrl } from '@/lib/site-contact'
import SocialLinks from '@/components/social/SocialLinks'
import '@/styles/v2/results.css'
import { ToolHead, Field, Input, Note, IcArrow } from '@/components/v2/inner/kit'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<Status>('idle')

  const set = (k: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        trackLead('contact_form', 'email')
        setStatus('sent')
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Contact"
          name="Write to us"
          blurb="Questions about a quantity report, a standard it cites, or a payment. Based in India, serving homeowners across India."
        />

        <div className="ns-cn">
          <section className="ns-plate ns-r-sec" aria-labelledby="cn-form">
            <h2 id="cn-form" style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 }}>Send a message</h2>
            {status === 'sent' ? (
              <Note kind="ok" title="Message sent">We will get back to you within 24 to 48 hours on business days.</Note>
            ) : (
              <form onSubmit={submit} className="ns-cn__form" noValidate={false}>
                <Field id="cn-name" label="Name" required>
                  <Input type="text" required autoComplete="name" value={form.name} onChange={e => set('name')(e.target.value)} placeholder="Your full name" />
                </Field>
                <Field id="cn-email" label="Email" required>
                  <Input type="email" required autoComplete="email" value={form.email} onChange={e => set('email')(e.target.value)} placeholder="you@example.com" />
                </Field>
                <Field id="cn-subject" label="Subject" required>
                  <Input type="text" required value={form.subject} onChange={e => set('subject')(e.target.value)} placeholder="What is this about?" />
                </Field>
                <Field id="cn-message" label="Message" required>
                  <textarea className="ns-i-in" required rows={6} value={form.message} onChange={e => set('message')(e.target.value)} placeholder="Your message" style={{ resize: 'vertical', minHeight: 140 }} />
                </Field>
                {status === 'error' ? <Note kind="err" title="Something went wrong">Please email us directly at nirmanshastraindia@gmail.com.</Note> : null}
                <button type="submit" className="ns-btn" disabled={status === 'sending'} style={{ justifySelf: 'start' }}>
                  {status === 'sending' ? 'Sending…' : 'Send message'}<IcArrow width={22} height={11} />
                </button>
              </form>
            )}
          </section>

          <aside className="ns-cn__side" aria-label="Contact details">
            <div className="ns-plate ns-r-sec ns-prose">
              <h2 style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(20px, 2vw, 25px)', lineHeight: 1.15, margin: 0 }}>Direct contact</h2>
              <p><b>Email</b><br /><a href="mailto:nirmanshastraindia@gmail.com">nirmanshastraindia@gmail.com</a></p>
              {WHATSAPP_NUMBER ? (
                <p data-ns-where="contact_page"><b>WhatsApp</b><br /><a href={whatsappUrl()} target="_blank" rel="noopener">WhatsApp: {WHATSAPP_DISPLAY}</a></p>
              ) : null}
              <p><b>Location</b><br />Uttar Pradesh, India</p>
              <p><b>Response time</b><br />Within 24 to 48 hours on business days</p>
              <SocialLinks where="contact_page" />
            </div>
            <div className="ns-plate ns-r-sec ns-prose">
              <h2 style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(20px, 2vw, 25px)', lineHeight: 1.15, margin: 0 }}>What to include</h2>
              <ul>
                <li>Your state and city (the earthquake zone and wind speed depend on them)</li>
                <li>Which tool you used or are asking about</li>
                <li>A short description of the question or the problem</li>
                <li>Your estimate ID, if you have one (it is in your PDF report)</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
