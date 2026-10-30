'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ensureSession } from '@/lib/supabase/ensure-session'
import { INDIAN_STATES } from '@/lib/structopro-qty/states'
import { Field, Input, Select, Note, IcArrow } from '@/components/v2/inner/kit'

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
    if (!form.state)       e.state = 'Please choose your state'
    if (!form.city.trim()) e.city  = 'Please enter your city'
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
      setApiError(sessionError ?? 'Could not start a session. Please try again, or log in.')
      setLoading(false)
      return
    }
    setLoading(false)
    onSubmit({ ...form, city: form.city.trim(), projectName: form.projectName.trim() })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="ns-plate ns-i-card">
        <p className="ns-i-card__eyebrow">Step 1 of 4</p>
        <h2>Where is the house?</h2>
        <p className="ns-i-card__sub">Your city sets the earthquake zone the structure is designed for. No name or email is needed to see your frame.</p>

        <div className="ns-i-card__body">
          {signedInAs && (
            <Note kind="ok" title={`Signed in as ${signedInAs}`}>
              Your report will be sent to your account email.
            </Note>
          )}

          <div className="ns-i-fields">
            <Field id="state" label="State" required error={errors.state}>
              <Select value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">Select your state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>

            {form.state && (
              <Field id="city" label="City" required error={errors.city}>
                <Input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Pune" autoComplete="address-level2" />
              </Field>
            )}

            <Field id="projectName" label="Project name (optional)" hint="To find this report again. You can skip it." error={errors.projectName} wide>
              <Input type="text" value={form.projectName} onChange={e => set('projectName', e.target.value)} placeholder="e.g. Sharma Residence, Kothrud" />
            </Field>
          </div>
        </div>

        <div className="ns-i-card__foot">
          {apiError && <div style={{ flexBasis: '100%' }}><Note kind="err" title="That did not go through">{apiError}</Note></div>}
          <button type="submit" disabled={loading} className="ns-btn">
            {loading ? 'One moment…' : 'Continue'}
            {!loading && <IcArrow width={22} height={11} />}
          </button>
          <p className="ns-i-fine" style={{ flex: '1 1 260px' }}>
            We ask for your name and email only when you pay for the report or choose to save the project.
          </p>
        </div>
      </div>
    </form>
  )
}
