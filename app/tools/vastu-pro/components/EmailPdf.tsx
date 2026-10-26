'use client'

import { useState } from 'react'
import { Field, Input, Note, IcArrow } from '@/components/v2/inner/kit'
import { trackLead } from '@/lib/analytics/events'
import { CONTACT_EMAIL } from '@/lib/site-contact'
import type { DoorMark, PlacedItem } from '../vastu-model'
import type { Poly } from '../vastu-geometry'

interface Props {
  northDeg: number
  house: Poly
  items: PlacedItem[]
  doors: DoorMark[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/*
  "Email me the full PDF": the only place VastuPro asks for an email, and only after the reading is on screen.
  The PDF is sent to the address and also saved from this page. A name and a WhatsApp number are optional.
*/
export default function EmailPdf({ northDeg, house, items, doors }: Props) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [emailError, setEmailError] = useState('')
  const [apiError, setApiError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ email: string; emailed: boolean } | null>(null)

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (busy) return
    const e = email.trim()
    if (!EMAIL_RE.test(e)) { setEmailError('Please enter a valid email address'); return }
    setEmailError('')
    setApiError('')
    setBusy(true)
    try {
      const res = await fetch('/api/vastu-pro/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: e,
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          northDeg,
          house: house.map(p => ({ x: p.x, y: p.y })),
          items: items.map(i => ({ id: i.id, kind: i.kind, x: i.x, y: i.y, w: i.w, h: i.h })),
          doors: doors.map(d => ({ id: d.id, kind: d.kind, pt: { x: d.pt.x, y: d.pt.y } })),
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'We could not make the PDF. Please try again.')
      }
      const emailed = res.headers.get('X-NS-Emailed') === '1'
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'VastuPro-findings.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      trackLead('vastupro', whatsapp.trim() ? 'email_and_whatsapp' : 'email') // generate_lead / Lead: the email was given
      setDone({ email: e, emailed })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'We could not make the PDF. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="ns-v-block ns-plate ns-v-next ns-v-pdf" onSubmit={submit} noValidate aria-labelledby="v-pdf-t">
      <h2 id="v-pdf-t">Email me the full PDF</h2>
      <p>
        A PDF with your plan, every finding with its source and the remedies, and at the end the working behind each verdict and the books the rules come from.
        It is as long as your plan needs. Your reading above stays free with or without it.
      </p>

      {done ? (
        <Note kind="ok" title={done.emailed ? `Sent to ${done.email}` : 'Your PDF has downloaded'}>
          {done.emailed
            ? 'It is saving to this device now too. If the email does not arrive in a few minutes, look in your spam folder.'
            : 'We could not send the email just now, so this is your copy. Write to us if you want it sent again.'}
        </Note>
      ) : (
        <>
          <div className="ns-i-fields">
            <Field id="vp-email" label="Your email" required error={emailError} hint="The PDF is sent here." wide>
              <Input type="email" value={email} onChange={ev => { setEmail(ev.target.value); if (emailError) setEmailError('') }} placeholder="ramesh@example.com" autoComplete="email" inputMode="email" />
            </Field>
            <Field id="vp-name" label="Your name (optional)" hint="So the email can greet you.">
              <Input type="text" value={name} onChange={ev => setName(ev.target.value)} placeholder="Ramesh Sharma" autoComplete="name" />
            </Field>
            <Field id="vp-wa" label="WhatsApp number (optional)" hint="Only if you want to hear back on WhatsApp.">
              <Input type="tel" value={whatsapp} onChange={ev => setWhatsapp(ev.target.value)} placeholder="98765 43210" autoComplete="tel" inputMode="tel" />
            </Field>
          </div>
          {apiError && <Note kind="err" title="That did not go through">{apiError}</Note>}
          <div className="ns-v-next__row">
            <button type="submit" className="ns-btn" disabled={busy}>
              {busy ? 'Making your PDF…' : 'Email me the PDF'}
              {!busy && <IcArrow width={22} height={11} />}
            </button>
            <span className="ns-i-fine">Free. We also email you a construction tip now and then; to stop those, write to {CONTACT_EMAIL}.</span>
          </div>
        </>
      )}
    </form>
  )
}
