'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ensureSession } from '@/lib/supabase/ensure-session'
import type { User } from '@supabase/supabase-js'
import { STATES } from '@/lib/qty/states'
import { Field, Input, Select, Note, IcArrow } from '@/components/v2/inner/kit'

export interface RegistrationData {
  name: string
  email: string
  city: string
  state: string
  propertyType: string
  plotSize: string
}

interface Props {
  onSubmit: (data: RegistrationData, contactId: string) => void
}

const PROPERTY_TYPES = [
  'Independent House / Villa',
  'Apartment / Flat',
  'Plot (Under Construction)',
  'Farmhouse',
  'Commercial Property',
  'Other',
]

const EMPTY: RegistrationData = { name: '', email: '', city: '', state: '', propertyType: '', plotSize: '' }

/*
  Step 1 of VastuPro: who you are and where the house is. Same questions and the same API as before.
  A signed-in visitor sees only the plot questions; the name and email come from the account.
*/
export default function RegistrationForm({ onSubmit }: Props) {
  const [form, setForm] = useState<RegistrationData>(EMPTY)
  const [errors, setErrors] = useState<Partial<RegistrationData>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null)
  const supabase = useMemo(() => createClient(), [])

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

  function set<K extends keyof RegistrationData>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<RegistrationData> = {}
    if (!loggedInUser && !form.name.trim()) e.name = 'Please enter your name'
    if (!loggedInUser && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email address'
    if (!form.state) e.state = 'Please choose your state'
    if (!form.city.trim()) e.city = 'Please enter your city'
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
      setApiError(sessionError ?? 'Could not start a session. Please try again, or log in.')
      setLoading(false)
      return
    }
    const submitData: RegistrationData = loggedInUser
      ? {
          ...form,
          name: loggedInUser.user_metadata?.full_name || loggedInUser.user_metadata?.name || loggedInUser.email || form.name,
          email: loggedInUser.email || form.email,
        }
      : form
    try {
      const res = await fetch('/api/vastu-pro/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.contactId) throw new Error(json.error || 'Registration failed')
      onSubmit(submitData, json.contactId)
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="ns-plate ns-i-card">
        <p className="ns-i-card__eyebrow">Step 1 of 3</p>
        <h2>Tell us who and where</h2>
        <p className="ns-i-card__sub">The Vastu check is free. It takes under a minute to start.</p>

        <div className="ns-i-card__body">
          {loggedInUser && (
            <Note kind="ok" title={`Signed in as ${loggedInUser.user_metadata?.full_name || loggedInUser.email}`}>
              Your name and email are filled in from your account.
            </Note>
          )}

          <div className="ns-i-fields">
            {!loggedInUser && (
              <Field id="vr-name" label="Your name" required error={errors.name} wide>
                <Input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ramesh Sharma" autoComplete="name" />
              </Field>
            )}
            {!loggedInUser && (
              <Field id="vr-email" label="Email" required error={errors.email} hint="Your details stay with us. We email only the occasional construction tip." wide>
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ramesh@example.com" autoComplete="email" inputMode="email" />
              </Field>
            )}

            <Field id="vr-state" label="State" required error={errors.state}>
              <Select value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">Select your state</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>

            <Field id="vr-city" label="City" required error={errors.city}>
              <Input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Pune" autoComplete="address-level2" />
            </Field>

            <Field id="vr-type" label="Property type (optional)">
              <Select value={form.propertyType} onChange={e => set('propertyType', e.target.value)}>
                <option value="">Select type</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>

            <Field id="vr-plot" label="Plot or built-up size (optional)" hint="For example, 1200 sq ft.">
              <Input type="text" value={form.plotSize} onChange={e => set('plotSize', e.target.value)} placeholder="e.g. 1200 sq ft" />
            </Field>
          </div>
        </div>

        <div className="ns-i-card__foot">
          {apiError && <div style={{ flexBasis: '100%' }}><Note kind="err" title="That did not go through">{apiError}</Note></div>}
          <button type="submit" disabled={loading} className="ns-btn">
            {loading ? 'Saving…' : 'Continue to your plan'}
            {!loading && <IcArrow width={22} height={11} />}
          </button>
          <p className="ns-i-fine" style={{ flex: '1 1 260px' }}>
            We save your details securely. Your plan and room marks stay in your browser until you ask for the PDF.
          </p>
        </div>
      </div>
    </form>
  )
}
