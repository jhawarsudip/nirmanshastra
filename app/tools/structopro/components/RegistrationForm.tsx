'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { INDIAN_STATES } from '../structopro-engine'

export interface StructoRegData {
  name: string
  mobile: string
  email: string
  projectName: string
  state: string
  city: string
  pinCode: string
  address: string
}

interface Props {
  onSubmit: (data: StructoRegData, contactId: string) => void
}

const EMPTY: StructoRegData = {
  name: '', mobile: '', email: '', projectName: '',
  state: '', city: '', pinCode: '', address: '',
}

export default function RegistrationForm({ onSubmit }: Props) {
  const [form, setForm] = useState<StructoRegData>(EMPTY)
  const [errors, setErrors] = useState<Partial<StructoRegData>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      const meta = data.user.user_metadata ?? {}
      setForm(prev => ({
        ...prev,
        email: prev.email || data.user?.email || '',
        name:  prev.name  || meta.full_name || meta.name || '',
        mobile: prev.mobile || meta.mobile || '',
        state:  prev.state  || meta.state  || '',
        city:   prev.city   || meta.city   || '',
      }))
    })
  }, [supabase])

  function set<K extends keyof StructoRegData>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<StructoRegData> = {}
    if (!form.name.trim())    e.name    = 'Name is required'
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = 'Enter a valid 10-digit mobile number'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.projectName.trim()) e.projectName = 'Project name is required'
    if (!form.state)          e.state   = 'State is required'
    if (!form.city.trim())    e.city    = 'City is required'
    if (!form.pinCode.trim()) e.pinCode = 'PIN code is required'
    if (!form.address.trim()) e.address = 'Address is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError('')
    try {
      const res = await fetch('/api/structopro/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Registration failed')
      onSubmit(form, json.contactId)
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function field(
    id: keyof StructoRegData,
    label: string,
    opts: { type?: string; placeholder?: string; required?: boolean } = {}
  ) {
    const { type = 'text', placeholder = '', required = false } = opts
    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={id}
          className="text-[11px] uppercase tracking-widest"
          style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}
        >
          {label}{required && <span style={{ color: '#8C3A22' }} className="ml-1">*</span>}
        </label>
        <input
          id={id}
          type={type}
          value={form[id]}
          onChange={e => set(id, e.target.value)}
          placeholder={placeholder}
          className="border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint focus:ring-1 focus:ring-blueprint/30"
          style={{
            fontFamily: 'var(--font-plex-sans)',
            borderColor: errors[id] ? '#8C3A22' : 'rgba(30,34,39,0.4)',
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
    <div className="min-h-screen bg-sheet-white flex flex-col items-center justify-center px-4 py-12">
      {/* StructoPro header */}
      <div className="w-full max-w-xl mb-8">
        <div
          className="rounded-[2px] p-6 mb-6"
          style={{ border: '1px solid #1E2227', background: '#F4F4F0' }}
        >
          {/* Concrete hatch motif */}
          <svg width="56" height="40" viewBox="0 0 56 40" className="mb-3" aria-hidden="true">
            {/* Aggregate dots */}
            {[
              [8,8],[20,6],[32,10],[44,7],[14,20],[26,18],[38,22],[50,19],
              [6,32],[18,30],[30,34],[42,28],[52,33],
            ].map(([x,y], i) => (
              <circle key={i} cx={x} cy={y} r="2.5" fill="none" stroke="#1F4E79" strokeWidth="1" opacity="0.6" />
            ))}
            {/* Column grid mark C1 */}
            <rect x="42" y="24" width="10" height="14" fill="none" stroke="#1E2227" strokeWidth="1.2" />
            <text x="47" y="33" textAnchor="middle" fontSize="6" fontFamily="var(--font-plex-mono)" fill="#1E2227" opacity="0.7">C1</text>
          </svg>
          <p
            className="text-[11px] uppercase tracking-widest mb-1"
            style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}
          >
            PHASE 1 · ₹499 REPORT
          </p>
          <h1
            className="text-[28px] font-bold leading-tight"
            style={{ color: '#1E2227', fontFamily: 'var(--font-plex-serif)' }}
          >
            StructoPro
          </h1>
          <p
            className="text-[14px] mt-1"
            style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}
          >
            IS 456:2000 based RCC structure cost estimate. Exact quantities, itemised costs, contractor comparison.
          </p>
        </div>

        {/* Step bar: 4 steps */}
        <div className="flex items-center">
          {(['REG', 'METHOD', 'DETAILS', 'RESULTS'] as const).map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border"
                  style={{
                    background:  i === 0 ? '#1F4E79' : 'transparent',
                    borderColor: i === 0 ? '#1F4E79' : 'rgba(30,34,39,0.22)',
                    color:       i === 0 ? '#fff'    : 'rgba(30,34,39,0.35)',
                    fontFamily:  'var(--font-plex-mono)',
                  }}
                >
                  {i + 1}
                </div>
                <span
                  className="text-[10px] uppercase tracking-widest whitespace-nowrap hidden sm:inline"
                  style={{
                    fontFamily: 'var(--font-plex-mono)',
                    color: i === 0 ? '#1F4E79' : 'rgba(30,34,39,0.3)',
                  }}
                >
                  {step}
                </span>
              </div>
              {i < 3 && (
                <div className="w-6 h-px mx-2" style={{ background: 'rgba(30,34,39,0.14)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="border border-iron-ink rounded-[2px] bg-sheet-white">
          <div className="border-b border-iron-ink px-5 py-3">
            <p
              className="text-[11px] uppercase tracking-widest"
              style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}
            >
              STEP 01 · YOUR DETAILS
            </p>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('name',   'Full Name',     { placeholder: 'Ramesh Sharma',      required: true })}
            {field('mobile', 'Mobile',        { type: 'tel', placeholder: '9876543210', required: true })}

            <div className="sm:col-span-2">
              {field('email', 'Email', { type: 'email', placeholder: 'ramesh@example.com', required: true })}
            </div>

            {/* Project Name — unique to StructoPro */}
            <div className="sm:col-span-2">
              {field('projectName', 'Project Name', {
                placeholder: 'e.g. Sharma Residence, Kothrud',
                required: true,
              })}
            </div>

            {/* State */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label
                htmlFor="state"
                className="text-[11px] uppercase tracking-widest"
                style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}
              >
                State <span style={{ color: '#8C3A22' }}>*</span>
              </label>
              <select
                id="state"
                value={form.state}
                onChange={e => { set('state', e.target.value); set('city', '') }}
                className="border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                style={{
                  fontFamily: 'var(--font-plex-sans)',
                  borderColor: errors.state ? '#8C3A22' : 'rgba(30,34,39,0.4)',
                }}
              >
                <option value="">Select your state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && (
                <span className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                  {errors.state}
                </span>
              )}
            </div>

            {form.state && (
              <>
                {field('city',    'City',     { placeholder: 'e.g. Pune',   required: true })}
                {field('pinCode', 'PIN Code', { placeholder: '411001',       required: true })}
              </>
            )}

            <div className="sm:col-span-2">
              {field('address', 'Site Address', {
                placeholder: 'Plot no., Street, Area',
                required: true,
              })}
            </div>
          </div>

          <div className="border-t border-iron-ink px-5 py-4">
            {apiError && (
              <p className="text-[13px] mb-3" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                ⚠ {apiError}
              </p>
            )}
            <p
              className="text-[11px] mb-3"
              style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-sans)' }}
            >
              Your details are saved securely. We send only your estimate report and IS-code construction tips.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[6px] text-[14px] font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}
            >
              {loading ? 'Saving…' : 'Continue to Method Selection →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
