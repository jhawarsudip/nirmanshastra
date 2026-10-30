'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { trackLead } from '@/lib/analytics/events'
import SocialLinks from '@/components/social/SocialLinks'
import '@/styles/v2/results.css'
import { ToolHead, Field, Input, Note, IcArrow } from '@/components/v2/inner/kit'
import { CONTACT_EMAIL } from '@/lib/site-contact'
import { useCopy } from '@/lib/i18n/use-copy'
import { CONTACT } from '@/lib/i18n/labels/pages-about'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactPage() {
  const t = useCopy(CONTACT)
  const hi = useLocale() === 'hi'
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
        <ToolHead eyebrow={t.eyebrow} name={t.name} blurb={t.blurb} />

        <div className="ns-cn">
          <section className="ns-plate ns-r-sec" aria-labelledby="cn-form">
            <h2 id="cn-form" style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 }}>{t.formH}</h2>
            {status === 'sent' ? (
              <Note kind="ok" title={t.sentTitle}>{t.sent}</Note>
            ) : (
              <form onSubmit={submit} className="ns-cn__form" noValidate={false}>
                <Field id="cn-name" label={t.nameL} required>
                  <Input type="text" required autoComplete="name" value={form.name} onChange={e => set('name')(e.target.value)} placeholder={t.nameP} />
                </Field>
                <Field id="cn-email" label={t.emailL} required>
                  <Input type="email" required autoComplete="email" value={form.email} onChange={e => set('email')(e.target.value)} placeholder="you@example.com" />
                </Field>
                <Field id="cn-subject" label={t.subjectL} required>
                  <Input type="text" required value={form.subject} onChange={e => set('subject')(e.target.value)} placeholder={t.subjectP} />
                </Field>
                <Field id="cn-message" label={t.messageL} required>
                  <textarea className="ns-i-in" required rows={6} value={form.message} onChange={e => set('message')(e.target.value)} placeholder={t.messageP} style={{ resize: 'vertical', minHeight: 140 }} />
                </Field>
                {status === 'error' ? <Note kind="err" title={t.errTitle}>{t.err(CONTACT_EMAIL)}</Note> : null}
                <button type="submit" className="ns-btn" disabled={status === 'sending'} style={{ justifySelf: 'start' }}>
                  {status === 'sending' ? t.sending : t.send}<IcArrow width={22} height={11} />
                </button>
              </form>
            )}
          </section>

          <aside className="ns-cn__side" aria-label={t.asideAria}>
            <div className="ns-plate ns-r-sec ns-prose">
              <h2 style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(20px, 2vw, 25px)', lineHeight: 1.15, margin: 0 }}>{t.directH}</h2>
              <p><b>{t.emailK}</b><br /><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
              <p><b>{t.locK}</b><br />{t.loc}</p>
              <p><b>{t.respK}</b><br />{t.resp}</p>
              <SocialLinks hi={hi} where="contact_page" />
            </div>
            <div className="ns-plate ns-r-sec ns-prose">
              <h2 style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(20px, 2vw, 25px)', lineHeight: 1.15, margin: 0 }}>{t.includeH}</h2>
              <ul>
                {t.include.map(line => <li key={line}>{line}</li>)}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
