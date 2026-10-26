'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ensureSession } from '@/lib/supabase/ensure-session'
import type { User } from '@supabase/supabase-js'
import { STATES } from '@/lib/qty/states'
import { trackLead } from '@/lib/analytics/events'
import type { TradeSlug } from '@/lib/qty/meta'
import { Field, Input, Select, Note, IcArrow } from '@/components/v2/inner/kit'

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
      if (!res.ok || !json.contactId) throw new Error(json.error || 'Registration failed')
      trackLead(slug, 'email') // generate_lead / Lead: an email address was given
      onSubmit(data, json.contactId)
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="ns-plate ns-i-card">
        <p className="ns-i-card__eyebrow">Step 1 of 4</p>
        <h2>Tell us who and where</h2>
        <p className="ns-i-card__sub">Your report is sent to your email. It takes under a minute.</p>

        <div className="ns-i-card__body">
          {loggedInUser && (
            <Note kind="ok" title={`Signed in as ${loggedInUser.user_metadata?.full_name || loggedInUser.email}`}>
              Your name and email are filled in from your account.
            </Note>
          )}

          <div className="ns-i-fields">
            {!loggedInUser && (
              <Field id="qr-name" label="Your name" required error={errors.name} wide>
                <Input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ramesh Sharma" autoComplete="name" />
              </Field>
            )}
            {!loggedInUser && (
              <Field id="qr-email" label="Email" required error={errors.email} hint="Your report is sent here." wide>
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ramesh@example.com" autoComplete="email" inputMode="email" />
              </Field>
            )}

            <Field id="qr-state" label="State" required error={errors.state}>
              <Select value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">Select your state</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>

            <Field id="qr-city" label="City" required error={errors.city}>
              <Input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Pune" autoComplete="address-level2" />
            </Field>

            <Field id="qr-project" label="Project name (optional)" hint="To find this report again. You can skip it." wide>
              <Input type="text" value={form.projectName} onChange={e => set('projectName', e.target.value)} placeholder="e.g. Sharma Residence, Kothrud" />
            </Field>
          </div>
        </div>

        <div className="ns-i-card__foot">
          {apiError && <div style={{ flexBasis: '100%' }}><Note kind="err" title="That did not go through">{apiError}</Note></div>}
          <button type="submit" disabled={loading} className="ns-btn">
            {loading ? 'Saving…' : 'Continue'}
            {!loading && <IcArrow width={22} height={11} />}
          </button>
          <p className="ns-i-fine" style={{ flex: '1 1 260px' }}>
            We save your details securely and email you only your report and a few IS-code construction tips.
          </p>
        </div>
      </div>
    </form>
  )
}
