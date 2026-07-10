'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface RegistrationData {
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

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

const EMPTY: RegistrationData = {
  name: '', email: '', city: '', state: '', propertyType: '', plotSize: '',
}

export default function RegistrationForm({ onSubmit }: Props) {
  const [form, setForm] = useState<RegistrationData>(EMPTY)
  const [errors, setErrors] = useState<Partial<RegistrationData>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setLoggedInUser(data.user)
      const meta = data.user.user_metadata ?? {}
      setForm(prev => ({
        ...prev,
        email: data.user?.email || prev.email,
        name:  meta.full_name || meta.name || prev.name,
        city:  meta.city || prev.city,
      }))
    })
  }, [supabase])

  function set<K extends keyof RegistrationData>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<RegistrationData> = {}
    if (!loggedInUser && !form.name.trim()) e.name = 'Name is required'
    if (!loggedInUser && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.state)       e.state = 'State is required'
    if (!form.city.trim()) e.city  = 'City is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError('')
    const submitData = loggedInUser ? {
      ...form,
      name:  loggedInUser.user_metadata?.full_name || loggedInUser.user_metadata?.name || loggedInUser.email || form.name,
      email: loggedInUser.email || form.email,
    } : form
    try {
      const res = await fetch('/api/vastu-pro/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Registration failed')
      onSubmit(submitData as RegistrationData, json.contactId)
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function textField(
    id: keyof RegistrationData,
    label: string,
    options: { type?: string; placeholder?: string; required?: boolean } = {}
  ) {
    const { type = 'text', placeholder = '', required = false } = options
    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={id}
          className="text-[11px] uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-plex-mono)' }}
        >
          {label}{required && <span style={{ color: '#8C3A22' }} className="ml-1">*</span>}
        </label>
        <input
          id={id}
          type={type}
          value={form[id]}
          onChange={e => set(id, e.target.value)}
          placeholder={placeholder}
          className="border rounded-[6px] px-3 text-[16px] bg-transparent text-white outline-none focus:border-blueprint focus:ring-1 focus:ring-blueprint/30"
          style={{
            fontFamily: 'var(--font-plex-sans)',
            borderColor: errors[id] ? '#8C3A22' : 'rgba(255,255,255,0.35)',
            height: '52px',
          }}
        />
        {errors[id] && (
          <span className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
            {errors[id]}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="w-full px-8 py-10" style={{ background: "var(--bg-base)" }}>
      {/* VastuPro header card */}
      <div className="w-full mb-8">
        <div className="rounded-[2px] p-6 mb-6" style={{ background: 'var(--bg-surface)' }}>
          <Image src="/vastupro-icon.png" alt="VastuPro" width={64} height={64} className="mb-3" style={{ objectFit: 'contain' }} />
          <p className="text-[11px] uppercase tracking-widest mb-1"
            style={{ color: 'rgba(201,168,76,0.6)', fontFamily: 'var(--font-plex-mono)' }}>
            PHASE 0 · FREE FOREVER
          </p>
          <h1 className="text-[28px] font-bold leading-tight"
            style={{ color: '#C9A84C', fontFamily: 'var(--font-plex-serif)' }}>
            VastuPro
          </h1>
          <p className="text-[14px] mt-1"
            style={{ color: 'rgba(244,244,240,0.7)', fontFamily: 'var(--font-plex-sans)' }}>
            16-zone Vastu Shastra analysis for your home. Score, findings &amp; remedies — free.
          </p>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-0 mb-8">
          {(['REGISTER', 'PLAN', 'RESULTS'] as const).map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border"
                  style={{
                    background:  i === 0 ? '#1F4E79' : 'transparent',
                    borderColor: i === 0 ? '#1F4E79' : 'rgba(255,255,255,0.18)',
                    color:       i === 0 ? '#fff' : 'rgba(255,255,255,0.32)',
                    fontFamily:  'var(--font-plex-mono)',
                  }}
                >
                  {i + 1}
                </div>
                <span
                  className="text-[11px] uppercase tracking-widest whitespace-nowrap"
                  style={{
                    fontFamily: 'var(--font-plex-mono)',
                    color: i === 0 ? '#1F4E79' : 'rgba(255,255,255,0.28)',
                  }}
                >
                  {step}
                </span>
              </div>
              {i < 2 && <div className="w-8 h-px mx-2" style={{ background: 'rgba(255,255,255,0.08)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="rounded-[2px]" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "var(--bg-surface)" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
              STEP 01 · YOUR DETAILS
            </p>
          </div>

          {loggedInUser && (
            <div className="mx-5 mt-4 px-4 py-3 rounded-[2px] flex items-center gap-3"
              style={{ background: 'rgba(20,83,45,0.06)', border: '1px solid rgba(20,83,45,0.2)' }}>
              <span style={{ color: '#14532D', fontSize: 14 }}>✓</span>
              <div>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#14532D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Signed in as {loggedInUser.user_metadata?.full_name || loggedInUser.email}
                </p>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  Your name &amp; email are pre-filled from your account
                </p>
              </div>
            </div>
          )}

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!loggedInUser && textField('name', 'Full Name', { placeholder: 'Ramesh Sharma', required: true })}
            {!loggedInUser && (
              <div className="sm:col-span-2">
                {textField('email', 'Email', { type: 'email', placeholder: 'ramesh@example.com', required: true })}
              </div>
            )}

            {/* State dropdown — full width */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label
                htmlFor="state"
                className="text-[11px] uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-plex-mono)' }}
              >
                State <span style={{ color: '#8C3A22' }}>*</span>
              </label>
              <select
                id="state"
                value={form.state}
                onChange={e => set('state', e.target.value)}
                className="border rounded-[6px] px-3 text-[16px] bg-transparent text-white outline-none focus:border-blueprint"
                style={{
                  fontFamily: 'var(--font-plex-sans)',
                  borderColor: errors.state ? '#8C3A22' : 'rgba(255,255,255,0.35)',
                  height: '52px',
                }}
              >
                <option value="">Select your state</option>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.state && (
                <span className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                  {errors.state}
                </span>
              )}
            </div>

            {/* City — appears once state is selected */}
            {form.state && textField('city', 'City', { placeholder: 'e.g. Pune', required: true })}

            {/* Property Type */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="propertyType"
                className="text-[11px] uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-plex-mono)' }}
              >
                Property Type
              </label>
              <select
                id="propertyType"
                value={form.propertyType}
                onChange={e => set('propertyType', e.target.value)}
                className="border rounded-[6px] px-3 text-[16px] bg-transparent text-white outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-sans)', height: '52px' }}
              >
                <option value="">Select type</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {textField('plotSize', 'Plot / BUA Size', { placeholder: 'e.g. 1200 sqft' })}
          </div>

          <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {apiError && (
              <p className="text-[13px] mb-3" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                ⚠ {apiError}
              </p>
            )}
            <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-sans)' }}>
              Your details are saved securely. No spam — we send only your Vastu report and useful construction tips.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[6px] text-[14px] font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}
            >
              {loading ? 'Saving…' : 'Continue to Floor Plan →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
