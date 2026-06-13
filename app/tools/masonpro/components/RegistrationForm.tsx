'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { INDIAN_STATES } from '../masonpro-engine'

export interface MasonRegData {
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
  onSubmit: (data: MasonRegData, contactId: string) => void
}

const EMPTY: MasonRegData = {
  name: '', mobile: '', email: '', projectName: '',
  state: '', city: '', pinCode: '', address: '',
}

export default function RegistrationForm({ onSubmit }: Props) {
  const [form, setForm]       = useState<MasonRegData>(EMPTY)
  const [errors, setErrors]   = useState<Partial<MasonRegData>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      const meta = data.user.user_metadata ?? {}
      setForm(prev => ({
        ...prev,
        email:  prev.email  || data.user?.email || '',
        name:   prev.name   || meta.full_name || meta.name || '',
        mobile: prev.mobile || meta.mobile || '',
        state:  prev.state  || meta.state  || '',
        city:   prev.city   || meta.city   || '',
      }))
    })
  }, [supabase])

  function set<K extends keyof MasonRegData>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<MasonRegData> = {}
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
      const res = await fetch('/api/masonpro/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
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
    id: keyof MasonRegData,
    label: string,
    opts: { type?: string; placeholder?: string; required?: boolean } = {}
  ) {
    const { type = 'text', placeholder = '', required = false } = opts
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-[11px] uppercase tracking-widest"
          style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}>
          {label}{required && <span style={{ color: '#8C3A22' }} className="ml-1">*</span>}
        </label>
        <input
          id={id} type={type} value={form[id]}
          onChange={e => set(id, e.target.value)}
          placeholder={placeholder}
          className="border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint focus:ring-1 focus:ring-blueprint/30"
          style={{ fontFamily: 'var(--font-plex-sans)', borderColor: errors[id] ? '#8C3A22' : 'rgba(30,34,39,0.4)' }}
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
      <div className="w-full max-w-xl mb-8">
        <div className="rounded-[2px] p-6 mb-6" style={{ border: '1px solid #1E2227', background: '#F4F4F0' }}>
          {/* Brick hatch motif — MasonPro signature (45° double diagonals) */}
          <svg width="56" height="40" viewBox="0 0 56 40" className="mb-3" aria-hidden="true">
            {/* Brick coursing hatch */}
            {[0,1,2,3].map(row => (
              <g key={row}>
                <rect x={row % 2 === 0 ? 0 : 14} y={row * 10} width="24" height="8"
                  fill="none" stroke="#1F4E79" strokeWidth="1" opacity="0.5" />
                <rect x={row % 2 === 0 ? 26 : 40} y={row * 10} width="24" height="8"
                  fill="none" stroke="#1F4E79" strokeWidth="1" opacity="0.5" />
              </g>
            ))}
            {/* 45° hatch lines on first brick */}
            <line x1="2" y1="8" x2="8" y2="2" stroke="#1F4E79" strokeWidth="0.6" opacity="0.4" />
            <line x1="6" y1="8" x2="12" y2="2" stroke="#1F4E79" strokeWidth="0.6" opacity="0.4" />
            <line x1="10" y1="8" x2="16" y2="2" stroke="#1F4E79" strokeWidth="0.6" opacity="0.4" />
          </svg>
          <p className="text-[11px] uppercase tracking-widest mb-1"
            style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
            PHASE 2 · ₹499 REPORT
          </p>
          <h1 className="text-[28px] font-bold leading-tight"
            style={{ color: '#1E2227', fontFamily: 'var(--font-plex-serif)' }}>
            MasonPro
          </h1>
          <p className="text-[14px] mt-1"
            style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
            IS 1077:1992 based masonry cost estimate. 8 wall types, exact brick counts, plaster quantities, waterproofing costs.
          </p>
        </div>

        {/* Step bar */}
        <div className="flex items-center">
          {(['REG', 'METHOD', 'DETAILS', 'RESULTS'] as const).map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border"
                  style={{
                    background:  i === 0 ? '#1F4E79' : 'transparent',
                    borderColor: i === 0 ? '#1F4E79' : 'rgba(30,34,39,0.22)',
                    color:       i === 0 ? '#fff'    : 'rgba(30,34,39,0.35)',
                    fontFamily:  'var(--font-plex-mono)',
                  }}>
                  {i + 1}
                </div>
                <span className="text-[10px] uppercase tracking-widest whitespace-nowrap hidden sm:inline"
                  style={{ fontFamily: 'var(--font-plex-mono)', color: i === 0 ? '#1F4E79' : 'rgba(30,34,39,0.3)' }}>
                  {s}
                </span>
              </div>
              {i < 3 && <div className="w-6 h-px mx-2" style={{ background: 'rgba(30,34,39,0.14)' }} />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="border border-iron-ink rounded-[2px] bg-sheet-white">
          <div className="border-b border-iron-ink px-5 py-3">
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
              STEP 01 · YOUR DETAILS
            </p>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('name',   'Full Name',     { placeholder: 'Ramesh Sharma',      required: true })}
            {field('mobile', 'Mobile',        { type: 'tel', placeholder: '9876543210', required: true })}
            <div className="sm:col-span-2">
              {field('email', 'Email', { type: 'email', placeholder: 'ramesh@example.com', required: true })}
            </div>
            <div className="sm:col-span-2">
              {field('projectName', 'Project Name', { placeholder: 'e.g. Sharma Residence — Masonry', required: true })}
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label htmlFor="state" className="text-[11px] uppercase tracking-widest"
                style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}>
                State <span style={{ color: '#8C3A22' }}>*</span>
              </label>
              <select id="state" value={form.state}
                onChange={e => { set('state', e.target.value); set('city', '') }}
                className="border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-sans)', borderColor: errors.state ? '#8C3A22' : 'rgba(30,34,39,0.4)' }}>
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
                {field('city',    'City',     { placeholder: 'e.g. Pune',  required: true })}
                {field('pinCode', 'PIN Code', { placeholder: '411001',      required: true })}
              </>
            )}
            <div className="sm:col-span-2">
              {field('address', 'Site Address', { placeholder: 'Plot no., Street, Area', required: true })}
            </div>
          </div>

          <div className="border-t border-iron-ink px-5 py-4">
            {apiError && (
              <p className="text-[13px] mb-3" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                ⚠ {apiError}
              </p>
            )}
            <p className="text-[11px] mb-3"
              style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-sans)' }}>
              Your details are saved securely. We send only your estimate report and IS-code construction tips.
            </p>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-[6px] text-[14px] font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
              {loading ? 'Saving…' : 'Continue to Method Selection →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
