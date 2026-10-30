'use client'

import { useState } from 'react'
import { Field, Input, Note, IcArrow } from '@/components/v2/inner/kit'
import { useCopy } from '@/lib/i18n/use-copy'
import { useStructTr } from '@/lib/i18n/labels/structopro-tr'
import { COPY } from '../copy'
import { trackLead } from '@/lib/analytics/events'
import { CONTACT_EMAIL } from '@/lib/site-contact'

/*
  Name and email for a StructurePro estimate, asked only when the visitor chooses to pay, to save the project, or (in the
  open preview mode) to have the report sent. The structure and the free frame preview never need it.
*/
export type CaptureMode = 'pay' | 'save' | 'send'

// the words for each mode (pay, save, send) are in ../copy.ts

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
  const t = useCopy(COPY).contact
  const tr = useStructTr()
  const c = t[mode]

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (busy) return
    const e: { name?: string; email?: string } = {}
    if (!name.trim()) e.name = t.errName
    if (!EMAIL_RE.test(email.trim())) e.email = t.errEmail
    setErrors(e)
    if (e.name || e.email) return
    if (!estimateId) { setApiError(t.notSaved); return }
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
      setApiError(err instanceof Error ? tr(err.message) : t.saveFail)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="ns-r-capture" onSubmit={submit} noValidate aria-labelledby={`r-cap-${mode}`}>
      <h4 id={`r-cap-${mode}`}>{c.title}</h4>
      <p className="ns-i-fine">{c.sub}</p>
      <div className="ns-i-fields">
        <Field id={`cap-name-${mode}`} label={t.name} required error={errors.name}>
          <Input type="text" value={name} onChange={ev => { setName(ev.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })) }} placeholder={t.nameEg} autoComplete="name" />
        </Field>
        <Field id={`cap-email-${mode}`} label={t.email} required error={errors.email}>
          <Input type="email" value={email} onChange={ev => { setEmail(ev.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })) }} placeholder={t.emailEg} autoComplete="email" inputMode="email" />
        </Field>
      </div>
      {apiError && <Note kind="err" title={t.failTitle}>{apiError}</Note>}
      <div className="ns-r-capture__row">
        <button type="submit" className="ns-btn" disabled={busy}>
          {busy ? t.saving : c.button}
          {!busy && <IcArrow width={22} height={11} />}
        </button>
        {onCancel && <button type="button" className="ns-i-link" onClick={onCancel} disabled={busy}>{t.notNow}</button>}
      </div>
      <p className="ns-i-fine">{t.fine(CONTACT_EMAIL)}</p>
    </form>
  )
}
