'use client'

import { useState } from 'react'

interface RegistrationData {
  name: string
  mobile: string
  email: string
  address: string
  city: string
  pinCode: string
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

export default function RegistrationForm({ onSubmit }: Props) {
  const [form, setForm] = useState<RegistrationData>({
    name: '', mobile: '', email: '', address: '',
    city: '', pinCode: '', state: '', propertyType: '', plotSize: '',
  })
  const [errors, setErrors] = useState<Partial<RegistrationData>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  function validate(): boolean {
    const e: Partial<RegistrationData> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = 'Enter a valid 10-digit mobile number'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.city.trim()) e.city = 'City is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setApiError('')
    try {
      const res = await fetch('/api/vastu-pro/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Registration failed')
      onSubmit(form, json.contactId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setApiError(message)
    } finally {
      setLoading(false)
    }
  }

  function field(
    id: keyof RegistrationData,
    label: string,
    type = 'text',
    placeholder = '',
    required = false
  ) {
    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={id}
          className="text-[11px] uppercase tracking-widest font-mono"
          style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}
        >
          {label}{required && <span className="text-stamp-oxide ml-1">*</span>}
        </label>
        <input
          id={id}
          type={type}
          value={form[id]}
          onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))}
          placeholder={placeholder}
          className="border border-iron-ink rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint focus:ring-1 focus:ring-blueprint/30"
          style={{ fontFamily: 'var(--font-plex-sans)' }}
        />
        {errors[id] && (
          <span className="text-stamp-oxide text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)' }}>
            {errors[id]}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sheet-white flex flex-col items-center justify-center px-4 py-12">
      {/* VastuPro header */}
      <div className="w-full max-w-xl mb-8">
        <div
          className="rounded-[2px] p-6 mb-6"
          style={{ background: '#1E2227' }}
        >
          {/* 16-spoke mandala motif (inline SVG) */}
          <svg width="56" height="56" viewBox="0 0 56 56" className="mb-3" aria-hidden="true">
            <circle cx="28" cy="28" r="26" fill="none" stroke="#C9A84C" strokeWidth="1.5" opacity="0.4" />
            <circle cx="28" cy="28" r="4" fill="#C9A84C" />
            {Array.from({ length: 16 }, (_, i) => {
              const angle = (i * 360) / 16
              const rad = (angle * Math.PI) / 180
              const x1 = 28 + 6 * Math.sin(rad)
              const y1 = 28 - 6 * Math.cos(rad)
              const x2 = 28 + 24 * Math.sin(rad)
              const y2 = 28 - 24 * Math.cos(rad)
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#C9A84C" strokeWidth={i % 4 === 0 ? 1.5 : 0.8} opacity={i % 4 === 0 ? 0.9 : 0.45} />
              )
            })}
          </svg>
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
            16-zone Vastu Shastra analysis for your home. Score, findings & remedies — free.
          </p>
        </div>

        {/* Progress indicator: REG → PLAN → RESULTS */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto">
          {(['REGISTER', 'PLAN', 'RESULTS'] as const).map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border"
                  style={{
                    background: i === 0 ? '#1F4E79' : 'transparent',
                    borderColor: i === 0 ? '#1F4E79' : 'rgba(30,34,39,0.25)',
                    color: i === 0 ? '#fff' : 'rgba(30,34,39,0.4)',
                    fontFamily: 'var(--font-plex-mono)',
                  }}
                >
                  {i + 1}
                </div>
                <span
                  className="text-[11px] uppercase tracking-widest whitespace-nowrap"
                  style={{
                    fontFamily: 'var(--font-plex-mono)',
                    color: i === 0 ? '#1F4E79' : 'rgba(30,34,39,0.35)',
                  }}
                >
                  {step}
                </span>
              </div>
              {i < 2 && (
                <div className="w-8 h-px mx-2" style={{ background: 'rgba(30,34,39,0.15)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="border border-iron-ink rounded-[2px] bg-sheet-white">
          <div className="border-b border-iron-ink px-5 py-3">
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
              STEP 01 · YOUR DETAILS
            </p>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('name', 'Full Name', 'text', 'Ramesh Sharma', true)}
            {field('mobile', 'Mobile', 'tel', '9876543210', true)}
            <div className="sm:col-span-2">
              {field('email', 'Email', 'email', 'ramesh@example.com', true)}
            </div>
            {field('city', 'City', 'text', 'Pune', true)}
            {field('state', 'State', 'text', 'Maharashtra')}
            {field('pinCode', 'PIN Code', 'text', '411001')}
            <div className="sm:col-span-2">
              {field('address', 'Address', 'text', 'Plot no., Street, Area')}
            </div>

            {/* Property Type */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="propertyType"
                className="text-[11px] uppercase tracking-widest"
                style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}
              >
                Property Type
              </label>
              <select
                id="propertyType"
                value={form.propertyType}
                onChange={e => setForm(p => ({ ...p, propertyType: e.target.value }))}
                className="border border-iron-ink rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-sans)' }}
              >
                <option value="">Select type</option>
                {PROPERTY_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {field('plotSize', 'Plot / BUA Size', 'text', 'e.g. 1200 sqft')}
          </div>

          <div className="border-t border-iron-ink px-5 py-4">
            {apiError && (
              <p className="text-stamp-oxide text-[13px] mb-3" style={{ fontFamily: 'var(--font-plex-mono)' }}>
                ⚠ {apiError}
              </p>
            )}
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>
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
