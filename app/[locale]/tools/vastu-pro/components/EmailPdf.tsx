'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useCopy } from '@/lib/i18n/use-copy'
import { useTr } from '@/lib/i18n/use-tr'
import { VASTU_ERRORS } from '@/lib/i18n/labels/vastu-errors'
import { Field, Input, Note, IcArrow } from '@/components/v2/inner/kit'
import { trackLead } from '@/lib/analytics/events'
import { CONTACT_EMAIL } from '@/lib/site-contact'
import type { DoorMark, PlacedItem } from '../vastu-model'
import type { Poly } from '../vastu-geometry'
import { CATALOGUE } from '../vastu-catalogue'
import { kindLabelOf } from '../vastu-hi'
import { COPY } from '../copy'

interface Props {
  northDeg: number
  house: Poly
  items: PlacedItem[]
  doors: DoorMark[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/*
  "Email me the full PDF": the only place VastuPro asks for an email, and only after the reading is on screen.
  The PDF is sent to the address and also saved from this page. The name is optional.
*/
export default function EmailPdf({ northDeg, house, items, doors }: Props) {
  const t = useCopy(COPY).pdf
  const hi = useLocale() === 'hi'
  const trErr = useTr(VASTU_ERRORS)
  // what the server says, shown in Hindi on the Hindi page; "{label} can be placed only once." carries a room name that needs its own Hindi
  const serverError = (msg: string): string => {
    const once = /^(.+) can be placed only once\.$/.exec(msg)
    if (once) {
      if (!hi) return msg
      const entry = Object.values(CATALOGUE).find(c => c.label === once[1])
      return `${entry ? kindLabelOf(hi, entry.key, once[1]) : once[1]} केवल एक बार रखा जा सकता है।`
    }
    return trErr(msg)
  }
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [emailError, setEmailError] = useState('')
  const [apiError, setApiError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ email: string; emailed: boolean } | null>(null)

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (busy) return
    const e = email.trim()
    if (!EMAIL_RE.test(e)) { setEmailError(t.errEmail); return }
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
      trackLead('vastupro', 'email') // generate_lead / Lead: the email was given
      setDone({ email: e, emailed })
    } catch (err) {
      setApiError(err instanceof Error ? serverError(err.message) : t.fail)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="ns-v-block ns-plate ns-v-next ns-v-pdf" onSubmit={submit} noValidate aria-labelledby="v-pdf-t">
      <h2 id="v-pdf-t">{t.title}</h2>
      <p>
        {t.intro}
      </p>

      {done ? (
        <Note kind="ok" title={done.emailed ? t.sentTo(done.email) : t.downloaded}>
          {done.emailed
            ? t.doneEmailed
            : t.doneNot}
        </Note>
      ) : (
        <>
          <div className="ns-i-fields">
            <Field id="vp-email" label={t.email} required error={emailError} hint={t.emailHint} wide>
              <Input type="email" value={email} onChange={ev => { setEmail(ev.target.value); if (emailError) setEmailError('') }} placeholder={t.emailEg} autoComplete="email" inputMode="email" />
            </Field>
            <Field id="vp-name" label={t.name} hint={t.nameHint}>
              <Input type="text" value={name} onChange={ev => setName(ev.target.value)} placeholder={t.nameEg} autoComplete="name" />
            </Field>
          </div>
          {apiError && <Note kind="err" title={t.failTitle}>{apiError}</Note>}
          <div className="ns-v-next__row">
            <button type="submit" className="ns-btn" disabled={busy}>
              {busy ? t.busy : t.button}
              {!busy && <IcArrow width={22} height={11} />}
            </button>
            <span className="ns-i-fine">{t.fine(CONTACT_EMAIL)}</span>
          </div>
        </>
      )}
    </form>
  )
}
