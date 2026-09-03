'use client'

import { Suspense, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'login' | 'signup' | 'reset'

const TOOL_NAMES: Record<string, string> = {
  '/tools/structopro':  'StructurePro',
  '/tools/masonpro':    'MasonryPro',
  '/tools/electropro':  'ElectricalPro',
  '/tools/plumbpro':    'PlumbingPro',
  '/tools/interiorpro': 'InteriorPro',
  '/tools/vastu-pro':   'VastuPro',
}

function getToolName(redirect: string | null): string | null {
  if (!redirect) return null
  for (const [path, name] of Object.entries(TOOL_NAMES)) {
    if (redirect.startsWith(path)) return name
  }
  return null
}

function AuthContent() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [pincodeError, setPincodeError] = useState('')
  const [consentPartners, setConsentPartners] = useState(false)
  const [consentPartnersContact, setConsentPartnersContact] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const toolName = getToolName(redirectTo)
  const supabase = useMemo(() => createClient(), [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(redirectTo || '/')
        router.refresh()
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })
        if (error) throw error
        setMessage('Check your email for a password reset link. It may take a few minutes to arrive.')
      } else {
        let valid = true
        if (!/^\d{10}$/.test(phone)) {
          setPhoneError('Enter a valid 10-digit Indian mobile number')
          valid = false
        }
        if (!/^\d{6}$/.test(pincode)) {
          setPincodeError('Enter a valid 6-digit PIN code')
          valid = false
        }
        if (!valid) { setLoading(false); return }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, mobile: phone, city, pincode, consent_material_partners: consentPartners, consent_material_partners_contact: consentPartnersContact } },
        })
        if (error) throw error
        setMessage('Account created! Check your email to confirm, then log in.')
        setMode('login')
        setPassword('')
        setPhone('')
        setCity('')
        setPincode('')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m: AuthMode) {
    setMode(m)
    setError('')
    setMessage('')
    setPhoneError('')
    setPincodeError('')
  }

  // No "Continue as Guest" button is needed here: every tool, Compare Contractor
  // Quote, and Site Templates now create a silent anonymous session on their own
  // (see lib/supabase/ensure-session.ts). This /auth page is purely opt-in, for
  // people who explicitly want to log into or create a real account.

  return (
    <div className="min-h-screen bg-sheet-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm mb-8 text-center">
        <p
          className="text-[10px] uppercase tracking-widest mb-2"
          style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}
        >
          NIRMANSHASTRA · BUILD WITH CERTAINTY
        </p>
        <h1
          className="text-[26px] font-bold mb-1"
          style={{ color: '#1E2227', fontFamily: 'var(--font-plex-serif)' }}
        >
          {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h1>
        {toolName && (
          <p
            className="text-[13px]"
            style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}
          >
            Sign in to continue to{' '}
            <span style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              {toolName}
            </span>
          </p>
        )}
      </div>

      <div
        className="w-full max-w-sm rounded-[2px] bg-sheet-white"
        style={{ border: '1px solid #1E2227' }}
      >
        {/* Tab switcher — hidden in reset mode */}
        {mode !== 'reset' && (
          <div className="flex" style={{ borderBottom: '1px solid #1E2227' }}>
            {(['login', 'signup'] as AuthMode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className="flex-1 py-3 text-[11px] uppercase tracking-widest transition-colors"
                style={{
                  fontFamily: 'var(--font-plex-mono)',
                  background: mode === m ? '#1E2227' : 'transparent',
                  color: mode === m ? '#F4F4F0' : 'rgba(30,34,39,0.45)',
                }}
              >
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {mode === 'signup' && (
            <>
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}
                >
                  Full Name <span style={{ color: '#8C3A22' }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Ramesh Sharma"
                  className="border border-iron-ink rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                  style={{ fontFamily: 'var(--font-plex-sans)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}
                >
                  Mobile Number <span style={{ color: '#8C3A22' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); if (phoneError) setPhoneError('') }}
                  required
                  placeholder="9876543210"
                  maxLength={10}
                  className="border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: phoneError ? '#8C3A22' : '#1E2227' }}
                />
                {phoneError && (
                  <span className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                    {phoneError}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}
                >
                  Your City <span style={{ color: '#8C3A22' }}>*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  required
                  placeholder="e.g. Pune"
                  className="border border-iron-ink rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                  style={{ fontFamily: 'var(--font-plex-sans)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}
                >
                  PIN Code <span style={{ color: '#8C3A22' }}>*</span>
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={e => { setPincode(e.target.value); if (pincodeError) setPincodeError('') }}
                  required
                  placeholder="411001"
                  maxLength={6}
                  className="border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: pincodeError ? '#8C3A22' : '#1E2227' }}
                />
                {pincodeError && (
                  <span className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                    {pincodeError}
                  </span>
                )}
              </div>

              {/* Optional consent section — two independent opt-ins */}
              <div
                style={{
                  border: '1px solid rgba(30,34,39,0.18)',
                  borderRadius: 6,
                  padding: '14px 16px',
                  background: 'rgba(31,78,121,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 0 }}>
                  Share with Material Partners (Optional)
                </p>

                {/* Checkbox 1 — city only (existing, unchanged) */}
                <label style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={consentPartners}
                    onChange={e => setConsentPartners(e.target.checked)}
                    style={{ marginTop: 3, accentColor: '#1F4E79', flexShrink: 0, width: 15, height: 15 }}
                  />
                  <div>
                    <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: '#1E2227', lineHeight: 1.5, marginBottom: 4 }}>
                      Share my city with construction material partners for relevant offers
                    </p>
                    <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 11, color: 'rgba(30,34,39,0.52)', lineHeight: 1.65 }}>
                      If checked, we may share your city (not your phone number or exact address) with cement, steel, or other construction material companies for partnership offers. You can withdraw this anytime from your profile.
                    </p>
                  </div>
                </label>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(30,34,39,0.1)' }} />

                {/* Checkbox 2 — name/phone/email (new, independent) */}
                <label style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={consentPartnersContact}
                    onChange={e => setConsentPartnersContact(e.target.checked)}
                    style={{ marginTop: 3, accentColor: '#1F4E79', flexShrink: 0, width: 15, height: 15 }}
                  />
                  <div>
                    <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: '#1E2227', lineHeight: 1.5, marginBottom: 4 }}>
                      Also share my name, phone number, and email with construction material partners for offers
                    </p>
                    <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 11, color: 'rgba(30,34,39,0.52)', lineHeight: 1.65 }}>
                      If checked, we may share your name, phone number, and email with cement, steel, or other construction material companies for partnership offers. You can withdraw this anytime from your profile.
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1">
            <label
              className="text-[11px] uppercase tracking-widest"
              style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}
            >
              Email <span style={{ color: '#8C3A22' }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
              className="border border-iron-ink rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
              style={{ fontFamily: 'var(--font-plex-sans)' }}
            />
          </div>

          {mode !== 'reset' && (
            <div className="flex flex-col gap-1">
              <label
                className="text-[11px] uppercase tracking-widest"
                style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}
              >
                Password <span style={{ color: '#8C3A22' }}>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="border border-iron-ink rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-sans)' }}
              />
              {mode === 'login' && (
                <div className="flex justify-end mt-0.5">
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-[11px] underline"
                    style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-sans)' }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'reset' && (
            <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              Enter your account email address and we&apos;ll send you a link to reset your password.
            </p>
          )}

          {error && (
            <p className="text-[12px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
              ⚠ {error}
            </p>
          )}
          {message && (
            <p className="text-[12px]" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
              ✓ {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[6px] text-[14px] font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}
          >
            {loading
              ? 'Please wait…'
              : mode === 'login'
              ? 'Log In →'
              : mode === 'reset'
              ? 'Send Reset Link →'
              : 'Create Account →'}
          </button>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-[12px] underline text-center"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-sans)' }}
            >
              ← Back to login
            </button>
          )}
        </form>

        {mode !== 'reset' && (
          <div className="px-5 pb-4 text-center" style={{ borderTop: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[12px] pt-4" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>
              {mode === 'login' ? (
                <>
                  No account?{' '}
                  <button type="button" onClick={() => switchMode('signup')} className="underline" style={{ color: '#1F4E79' }}>
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchMode('login')} className="underline" style={{ color: '#1F4E79' }}>
                    Log in
                  </button>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-sheet-white flex items-center justify-center">
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(30,34,39,0.4)' }}>
          LOADING…
        </p>
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}
