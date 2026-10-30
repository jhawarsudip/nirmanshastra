'use client'

import { useState } from 'react'
import { Field, Input, Note, IcArrow } from '@/components/v2/inner/kit'
import { trackLead } from '@/lib/analytics/events'
import { CONTACT_EMAIL } from '@/lib/site-contact'

/*
  Name and email for a StructurePro estimate, asked only when the visitor chooses to pay, to save the project, or (in the
  open preview mode) to have the report sent. The structure and the free frame preview never need it.
*/
export type CaptureMode = 'pay' | 'save' | 'send'

const COPY: Record<CaptureMode, { title: string; sub: string; button: string }> = {
  pay:  { title: 'Where should we send your report?', sub: 'Your report is emailed here when it is ready, and you can also download it on this page.', button: 'Continue to payment' },
  save: { title: 'Save this project', sub: 'We keep your name and email with this project. It also stays in this browser, so you can come back to it here.', button: 'Save my project' },
  send: { title: 'Where should we send your report?', sub: 'Your report is emailed here, and you can also download it on this page.', button: 'Send my report' },
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ContactCapture({ estimateId, mode, onDone, onCancel }: {
  estimateId: string | null
  mode: CaptureMode
  onDone: (who: { name: string; email: string }) => void
  onCancel?: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [apiError, setApiError] = useState('')
  const [busy, setBusy] = useState(false)
  const c = COPY[mode]

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (busy) return
    const e: { name?: string; email?: string } = {}
    if (!name.trim()) e.name = 'Please enter your name'
    if (!EMAIL_RE.test(email.trim())) e.email = 'Please enter a valid email address'
    setErrors(e)
    if (e.name || e.email) return
    if (!estimateId) { setApiError('Your estimate is not saved yet. Please wait a moment and try again.'); return }
    setBusy(true)
    setApiError('')
    try {
      const res = await fetch('/api/structopro/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId, name: name.trim(), email: email.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'We could not save your details. Please try again.')
      trackLead('structopro', 'email') // generate_lead / Lead: an email address was given
      onDone({ name: name.trim(), email: email.trim() })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'We could not save your details. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="ns-r-capture" onSubmit={submit} noValidate aria-labelledby={`r-cap-${mode}`}>
      <h4 id={`r-cap-${mode}`}>{c.title}</h4>
      <p className="ns-i-fine">{c.sub}</p>
      <div className="ns-i-fields">
        <Field id={`cap-name-${mode}`} label="Your name" required error={errors.name}>
          <Input type="text" value={name} onChange={ev => { setName(ev.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })) }} placeholder="Ramesh Sharma" autoComplete="name" />
        </Field>
        <Field id={`cap-email-${mode}`} label="Email" required error={errors.email}>
          <Input type="email" value={email} onChange={ev => { setEmail(ev.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })) }} placeholder="ramesh@example.com" autoComplete="email" inputMode="email" />
        </Field>
      </div>
      {apiError && <Note kind="err" title="That did not go through">{apiError}</Note>}
      <div className="ns-r-capture__row">
        <button type="submit" className="ns-btn" disabled={busy}>
          {busy ? 'Saving…' : c.button}
          {!busy && <IcArrow width={22} height={11} />}
        </button>
        {onCancel && <button type="button" className="ns-i-link" onClick={onCancel} disabled={busy}>Not now</button>}
      </div>
      <p className="ns-i-fine">We email you the report and, now and then, an IS-code construction tip. To stop the tips, write to {CONTACT_EMAIL}.</p>
    </form>
  )
}
