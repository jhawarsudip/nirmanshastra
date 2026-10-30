'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { ensureSession } from '@/lib/supabase/ensure-session'
import { INDIAN_STATES } from '@/lib/structopro-qty/states'
import { Field, Input, Select, Note, IcArrow } from '@/components/v2/inner/kit'
import { stateLabel } from '@/lib/i18n/states'
import { useCopy } from '@/lib/i18n/use-copy'
import { useStructTr } from '@/lib/i18n/labels/structopro-tr'
import { COPY } from '../copy'

/** Where the house is, and what to call the project. No name or email: they are asked at payment, or to save the project. */
export interface StructoPlaceData {
  projectName: string
  state: string
  city: string
}

interface Props {
  onSubmit: (data: StructoPlaceData) => void
}

const EMPTY: StructoPlaceData = { projectName: '', state: '', city: '' }

export default function LocationForm({ onSubmit }: Props) {
  const t = useCopy(COPY).place
  const tr = useStructTr()
  const locale = useLocale()
  const [form, setForm] = useState<StructoPlaceData>(EMPTY)
  const [errors, setErrors] = useState<Partial<StructoPlaceData>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [signedInAs, setSignedInAs] = useState('')
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      // The silent anonymous session has no profile, so there is nothing to fill in or to show.
      if (!data.user || data.user.is_anonymous) return
      const meta = data.user.user_metadata ?? {}
      setSignedInAs(meta.full_name || meta.name || data.user.email || '')
      setForm(prev => ({ ...prev, state: meta.state || prev.state, city: meta.city || prev.city }))
    })
  }, [supabase])

  function set<K extends keyof StructoPlaceData>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<StructoPlaceData> = {}
    if (!form.state)       e.state = t.errState
    if (!form.city.trim()) e.city  = t.errCity
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError('')
    // Every estimate carries a user id (Grand Total links reports through it), so a quiet visitor session is made here.
    const { userId, error: sessionError } = await ensureSession()
    if (!userId) {
      setApiError(sessionError ? tr(sessionError) : t.sessionFail)
      setLoading(false)
      return
    }
    setLoading(false)
    onSubmit({ ...form, city: form.city.trim(), projectName: form.projectName.trim() })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="ns-plate ns-i-card">
        <p className="ns-i-card__eyebrow">{t.eyebrow}</p>
        <h2>{t.title}</h2>
        <p className="ns-i-card__sub">{t.sub}</p>

        <div className="ns-i-card__body">
          {signedInAs && (
            <Note kind="ok" title={t.signedIn(signedInAs)}>
              {t.signedInNote}
            </Note>
          )}

          <div className="ns-i-fields">
            <Field id="state" label={t.state} required error={errors.state}>
              <Select value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">{t.statePick}</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{stateLabel(s, locale)}</option>)}
              </Select>
            </Field>

            {form.state && (
              <Field id="city" label={t.city} required error={errors.city}>
                <Input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder={t.cityEg} autoComplete="address-level2" />
              </Field>
            )}

            <Field id="projectName" label={t.project} hint={t.projectHint} error={errors.projectName} wide>
              <Input type="text" value={form.projectName} onChange={e => set('projectName', e.target.value)} placeholder={t.projectEg} />
            </Field>
          </div>
        </div>

        <div className="ns-i-card__foot">
          {apiError && <div style={{ flexBasis: '100%' }}><Note kind="err" title={t.failTitle}>{apiError}</Note></div>}
          <button type="submit" disabled={loading} className="ns-btn">
            {loading ? t.wait : t.go}
            {!loading && <IcArrow width={22} height={11} />}
          </button>
          <p className="ns-i-fine" style={{ flex: '1 1 260px' }}>
            {t.fine}
          </p>
        </div>
      </div>
    </form>
  )
}
