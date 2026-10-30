'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ensureSession } from '@/lib/supabase/ensure-session'
import type { User } from '@supabase/supabase-js'
import { STATES } from '@/lib/qty/states'
import { trackLead } from '@/lib/analytics/events'
import type { TradeSlug } from '@/lib/qty/meta'
import { Field, Input, Select, Note, IcArrow } from '@/components/v2/inner/kit'
import { useLocale } from 'next-intl'
import { useCopy } from '@/lib/i18n/use-copy'
import { useTr } from '@/lib/i18n/use-tr'
import { stateLabel } from '@/lib/i18n/states'
import { QTY_REG } from '@/lib/i18n/labels/qty-ui'
import { QTY_ERRORS } from '@/lib/i18n/labels/qty-errors'

export interface QtyRegData {
  name: string
  email: string
  projectName: string
  state: string
  city: string
}

const EMPTY: QtyRegData = { name: '', email: '', projectName: '', state: '', city: '' }

/*
  Step 1 of a trade tool: who you are, where the plot is. The project name is optional.
  A signed-in visitor sees only the plot; the name and email come from the account.
*/
export default function QtyRegistration({ slug, onSubmit }: { slug: TradeSlug; onSubmit: (data: QtyRegData, contactId: string) => void }) {
  const [form, setForm] = useState<QtyRegData>(EMPTY)
  const [errors, setErrors] = useState<Partial<QtyRegData>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null)
  const supabase = useMemo(() => createClient(), [])
  const k = useCopy(QTY_REG)
  const locale = useLocale()
  const t = useTr(QTY_ERRORS)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      // The silent anonymous session has no name or email, so it must not hide those fields.
      if (!data.user || data.user.is_anonymous) return
      setLoggedInUser(data.user)
      const meta = data.user.user_metadata ?? {}
      setForm(prev => ({
        ...prev,
        email: data.user?.email || prev.email,
        name: meta.full_name || meta.name || prev.name,
        state: meta.state || prev.state,
        city: meta.city || prev.city,
      }))
    })
  }, [supabase])

  function set<K extends keyof QtyRegData>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<QtyRegData> = {}
    if (!loggedInUser && !form.name.trim()) e.name = k.errName
    if (!loggedInUser && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = k.errEmail
    if (!form.state) e.state = k.errState
    if (!form.city.trim()) e.city = k.errCity
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError('')
    const { userId, error: sessionError } = await ensureSession()
    if (!userId) {
      setApiError(sessionError ? t(sessionError) : k.noSession)
      setLoading(false)
      return
    }
    const data: QtyRegData = loggedInUser
      ? { ...form, name: loggedInUser.user_metadata?.full_name || loggedInUser.user_metadata?.name || loggedInUser.email || form.name, email: loggedInUser.email || form.email }
      : form
    try {
      const res = await fetch(`/api/qty/${slug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.contactId) throw new Error(json.error || k.registrationFailed)
      trackLead(slug, 'email') // generate_lead / Lead: an email address was given
      onSubmit(data, json.contactId)
    } catch (err: unknown) {
      setApiError(err instanceof Error ? t(err.message) : k.wentWrong)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="ns-plate ns-i-card">
        <p className="ns-i-card__eyebrow">{k.step}</p>
        <h2>{k.title}</h2>
        <p className="ns-i-card__sub">{k.sub}</p>

        <div className="ns-i-card__body">
          {loggedInUser && (
            <Note kind="ok" title={k.signedInAs(loggedInUser.user_metadata?.full_name || loggedInUser.email)}>
              {k.filledFromAccount}
            </Note>
          )}

          <div className="ns-i-fields">
            {!loggedInUser && (
              <Field id="qr-name" label={k.yourName} required error={errors.name} wide>
                <Input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder={k.namePh} autoComplete="name" />
              </Field>
            )}
            {!loggedInUser && (
              <Field id="qr-email" label={k.email} required error={errors.email} hint={k.emailHint} wide>
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder={k.emailPh} autoComplete="email" inputMode="email" />
              </Field>
            )}

            <Field id="qr-state" label={k.state} required error={errors.state}>
              <Select value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">{k.selectState}</option>
                {STATES.map(s => <option key={s} value={s}>{stateLabel(s, locale)}</option>)}
              </Select>
            </Field>

            <Field id="qr-city" label={k.city} required error={errors.city}>
              <Input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder={k.cityPh} autoComplete="address-level2" />
            </Field>

            <Field id="qr-project" label={k.project} hint={k.projectHint} wide>
              <Input type="text" value={form.projectName} onChange={e => set('projectName', e.target.value)} placeholder={k.projectPh} />
            </Field>
          </div>
        </div>

        <div className="ns-i-card__foot">
          {apiError && <div style={{ flexBasis: '100%' }}><Note kind="err" title={k.didNotGoThrough}>{apiError}</Note></div>}
          <button type="submit" disabled={loading} className="ns-btn">
            {loading ? k.saving : k.next}
            {!loading && <IcArrow width={22} height={11} />}
          </button>
          <p className="ns-i-fine" style={{ flex: '1 1 260px' }}>
            {k.fine}
          </p>
        </div>
      </div>
    </form>
  )
}
