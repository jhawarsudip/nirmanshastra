'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { INDIAN_STATES } from '../masonpro-engine'
import type { User } from '@supabase/supabase-js'

export interface MasonRegData {
  name: string
  email: string
  projectName: string
  state: string
  city: string
}

interface Props {
  onSubmit: (data: MasonRegData, contactId: string) => void
}

const EMPTY: MasonRegData = {
  name: '', email: '', projectName: '', state: '', city: '',
}

export default function RegistrationForm({ onSubmit }: Props) {
  const [form, setForm]       = useState<MasonRegData>(EMPTY)
  const [errors, setErrors]   = useState<Partial<MasonRegData>>({})
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
        state: meta.state || prev.state,
        city:  meta.city  || prev.city,
      }))
    })
  }, [supabase])

  function set<K extends keyof MasonRegData>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<MasonRegData> = {}
    if (!loggedInUser && !form.name.trim()) e.name = 'Name is required'
    if (!loggedInUser && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.projectName.trim()) e.projectName = 'Project name is required'
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
      const res = await fetch('/api/masonpro/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(submitData),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Registration failed')
      onSubmit(submitData as MasonRegData, json.contactId)
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
          style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
          {label}{required && <span style={{ color: '#8C3A22' }} className="ml-1">*</span>}
        </label>
        <input
          id={id} type={type} value={form[id]}
          onChange={e => set(id, e.target.value)}
          placeholder={placeholder}
          className="border rounded-[6px] px-3 text-[16px] text-white bg-transparent outline-none focus:border-blueprint focus:ring-1 focus:ring-blueprint/30"
          style={{ fontFamily: 'var(--font-plex-sans)', borderColor: errors[id] ? '#8C3A22' : 'rgba(255,255,255,0.35)', height: '52px' }}
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
      <div className="w-full mb-8">
        <div className="rounded-[2px] mb-6"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'var(--bg-surface)', position: 'relative', overflow: 'hidden', padding: '28px 24px' }}>
          {/* Large brick hatch watermark */}
          <div style={{ position: 'absolute', bottom: -12, right: -12, opacity: 0.1, pointerEvents: 'none', lineHeight: 0 }}>
            <svg width="160" height="160" viewBox="0 0 160 160" fill="none" aria-hidden="true">
              {Array.from({length:13}, (_,i) => (
                <line key={`a${i}`} x1={-8+i*14} y1="0" x2={i*14+132} y2="160" stroke="#F4F4F0" strokeWidth="1.5" />
              ))}
              {Array.from({length:13}, (_,i) => (
                <line key={`b${i}`} x1={148-i*14} y1="0" x2={8-i*14} y2="160" stroke="#F4F4F0" strokeWidth="1.2" />
              ))}
            </svg>
          </div>
          <Image src="/masonpro-icon.png" alt="MasonryPro" width={64} height={64} className="mb-4" style={{ objectFit: 'contain' }} />
          <p className="text-[11px] uppercase tracking-widest mb-2"
            style={{ color: 'rgba(201,168,76,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
            PHASE 2 · ₹499 REPORT
          </p>
          <h1 className="font-bold leading-tight mb-2"
            style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(28px,4vw,36px)' }}>
            MasonryPro
          </h1>
          <p className="text-[14px]"
            style={{ color: 'rgba(244,244,240,0.55)', fontFamily: 'var(--font-plex-sans)', lineHeight: 1.6 }}>
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
                    borderColor: i === 0 ? '#1F4E79' : 'rgba(255,255,255,0.18)',
                    color:       i === 0 ? '#fff'    : 'rgba(255,255,255,0.30)',
                    fontFamily:  'var(--font-plex-mono)',
                  }}>
                  {i + 1}
                </div>
                <span className="text-[10px] uppercase tracking-widest whitespace-nowrap hidden sm:inline"
                  style={{ fontFamily: 'var(--font-plex-mono)', color: i === 0 ? '#1F4E79' : 'rgba(255,255,255,0.25)' }}>
                  {s}
                </span>
              </div>
              {i < 3 && <div className="w-6 h-px mx-2" style={{ background: 'rgba(255,255,255,0.08)' }} />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="rounded-[2px]" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "var(--bg-surface)" }}>
          <div className="border-b px-5 py-3">
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
            {!loggedInUser && field('name', 'Full Name', { placeholder: 'Ramesh Sharma', required: true })}
            {!loggedInUser && (
              <div className="sm:col-span-2">
                {field('email', 'Email', { type: 'email', placeholder: 'ramesh@example.com', required: true })}
              </div>
            )}
            <div className="sm:col-span-2">
              {field('projectName', 'Project Name', { placeholder: 'e.g. Sharma Residence — Masonry', required: true })}
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label htmlFor="state" className="text-[11px] uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                State <span style={{ color: '#8C3A22' }}>*</span>
              </label>
              <select id="state" value={form.state}
                onChange={e => set('state', e.target.value)}
                className="border rounded-[6px] px-3 text-[16px] text-white bg-transparent outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-sans)', borderColor: errors.state ? '#8C3A22' : 'rgba(255,255,255,0.35)', height: '52px' }}>
                <option value="">Select your state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && (
                <span className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                  {errors.state}
                </span>
              )}
            </div>
            {form.state && field('city', 'City', { placeholder: 'e.g. Pune', required: true })}
          </div>

          <div className="border-t px-5 py-4">
            {apiError && (
              <p className="text-[13px] mb-3" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                ⚠ {apiError}
              </p>
            )}
            <p className="text-[11px] mb-3"
              style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-sans)' }}>
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
