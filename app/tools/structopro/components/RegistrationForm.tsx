'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
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
          className="border rounded-[6px] px-3 text-[16px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint focus:ring-1 focus:ring-blueprint/30"
          style={{
            fontFamily: 'var(--font-plex-sans)',
            borderColor: errors[id] ? '#8C3A22' : 'rgba(30,34,39,0.4)',
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
    <div className="w-full bg-sheet-white px-8 py-10">
      {/* StructoPro header */}
      <div className="w-full mb-8">
        <div
          className="rounded-[2px] mb-6"
          style={{ border: '1px solid #1E2227', background: '#1E2227', position: 'relative', overflow: 'hidden', padding: '28px 24px' }}
        >
          {/* Large concrete hatch watermark */}
          <div style={{ position: 'absolute', bottom: -12, right: -12, opacity: 0.12, pointerEvents: 'none', lineHeight: 0 }}>
            <svg width="160" height="160" viewBox="0 0 160 160" fill="none" aria-hidden="true">
              {([
                [18,18],[48,12],[80,22],[112,15],[138,28],
                [28,48],[62,44],[95,50],[130,42],
                [14,78],[44,72],[75,80],[108,75],[140,82],
                [24,108],[56,103],[90,110],[125,105],
                [18,138],[52,133],[88,140],[122,135],
              ] as [number,number][]).map(([x,y],i) => (
                <circle key={i} cx={x} cy={y} r="5" fill="#F4F4F0" />
              ))}
              <line x1="80" y1="0" x2="80" y2="160" stroke="#F4F4F0" strokeWidth="1.2" />
              <line x1="0" y1="80" x2="160" y2="80" stroke="#F4F4F0" strokeWidth="1.2" />
              <text x="84" y="34" fontSize="14" fill="#F4F4F0" fontFamily="monospace">C1</text>
            </svg>
          </div>
          <Image src="/structopro-icon.png" alt="StructoPro" width={64} height={64} className="mb-4" style={{ objectFit: 'contain' }} />
          <p
            className="text-[11px] uppercase tracking-widest mb-2"
            style={{ color: 'rgba(201,168,76,0.55)', fontFamily: 'var(--font-plex-mono)' }}
          >
            PHASE 1 · ₹499 REPORT
          </p>
          <h1
            className="font-bold leading-tight mb-2"
            style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(28px,4vw,36px)' }}
          >
            StructoPro
          </h1>
          <p
            className="text-[14px]"
            style={{ color: 'rgba(244,244,240,0.55)', fontFamily: 'var(--font-plex-sans)', lineHeight: 1.6 }}
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
      <form onSubmit={handleSubmit} className="w-full">
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
                className="border rounded-[6px] px-3 text-[16px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                style={{
                  fontFamily: 'var(--font-plex-sans)',
                  borderColor: errors.state ? '#8C3A22' : 'rgba(30,34,39,0.4)',
                  height: '52px',
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
