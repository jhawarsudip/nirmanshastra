'use client'

import { Suspense, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Field, Input, Note, IcArrow } from '@/components/v2/inner/kit'
import { stripLocale } from '@/lib/i18n/paths'

type AuthMode = 'login' | 'signup' | 'reset'

const TOOL_NAMES: Record<string, string> = {
  '/tools/structopro':  'StructurePro',
  '/tools/masonpro':    'MasonryPro',
  '/tools/electropro':  'ElectricalPro',
  '/tools/plumbpro':    'PlumbingPro',
  '/tools/interiorpro': 'InteriorPro',
  '/tools/vastu-pro':   'VastuPro',
}

/** Only a path on this site is accepted as a place to go after logging in, never a full web address. */
function safeRedirect(r: string | null): string | null {
  if (!r) return null
  if (!r.startsWith('/') || r.startsWith('//') || r.includes('\\')) return null
  // The router adds the visitor's language itself, so a value that already carries /hi is stripped first.
  return stripLocale(r)
}

function getToolName(redirect: string | null): string | null {
  if (!redirect) return null
  for (const [path, name] of Object.entries(TOOL_NAMES)) {
    if (redirect.startsWith(path)) return name
  }
  return null
}

const HEADINGS: Record<AuthMode, string> = {
  login: 'Welcome back',
  signup: 'Create your account',
  reset: 'Reset your password',
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
  const redirectTo = safeRedirect(searchParams.get('redirect'))
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

  const submitLabel = loading
    ? 'Please wait…'
    : mode === 'login' ? 'Log in' : mode === 'reset' ? 'Send reset link' : 'Create account'

  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap">
        <div className="ns-au">
          <header className="ns-au-head">
            <p className="ns-au-eyebrow">Your account</p>
            <h1>{HEADINGS[mode]}</h1>
            {toolName ? <p>Log in to continue to <b>{toolName}</b>.</p> : null}
          </header>

          <div className="ns-plate ns-au-card">
            {mode !== 'reset' ? (
              <div className="ns-au-tabs" role="tablist" aria-label="Log in or sign up">
                {(['login', 'signup'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    id={`ns-au-tab-${m}`}
                    aria-selected={mode === m}
                    aria-controls="ns-au-panel"
                    className="ns-au-tab"
                    onClick={() => switchMode(m)}
                  >
                    {m === 'login' ? 'Log in' : 'Sign up'}
                  </button>
                ))}
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="ns-au-form"
              id="ns-au-panel"
              role={mode === 'reset' ? undefined : 'tabpanel'}
              aria-labelledby={mode === 'reset' ? undefined : `ns-au-tab-${mode}`}
            >
              {mode === 'reset' ? (
                <p className="ns-au-lede">Enter your account email address and we&apos;ll send you a link to reset your password.</p>
              ) : null}

              {mode === 'signup' ? (
                <div className="ns-i-fields">
                  <Field id="au-name" label="Full name" required wide>
                    <Input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ramesh Sharma" autoComplete="name" />
                  </Field>
                  <Field id="au-email" label="Email" required wide>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" />
                  </Field>
                  <Field id="au-phone" label="Mobile number" required wide hint="10 digits, without +91" error={phoneError}>
                    <Input
                      type="tel" inputMode="numeric" value={phone}
                      onChange={e => { setPhone(e.target.value); if (phoneError) setPhoneError('') }}
                      required placeholder="9876543210" maxLength={10} autoComplete="tel-national"
                    />
                  </Field>
                  <Field id="au-city" label="Your city" required>
                    <Input type="text" value={city} onChange={e => setCity(e.target.value)} required placeholder="e.g. Pune" autoComplete="address-level2" />
                  </Field>
                  <Field id="au-pin" label="PIN code" required error={pincodeError}>
                    <Input
                      type="text" inputMode="numeric" value={pincode}
                      onChange={e => { setPincode(e.target.value); if (pincodeError) setPincodeError('') }}
                      required placeholder="411001" maxLength={6} autoComplete="postal-code"
                    />
                  </Field>
                  <Field id="au-password" label="Password" required wide hint="At least 6 characters">
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Choose a password" autoComplete="new-password" />
                  </Field>
                </div>
              ) : (
                <div className="ns-i-fields">
                  <Field id="au-email" label="Email" required wide>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" />
                  </Field>
                  {mode === 'login' ? (
                    <Field id="au-password" label="Password" required wide>
                      <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Your password" autoComplete="current-password" />
                    </Field>
                  ) : null}
                </div>
              )}

              {mode === 'login' ? (
                <div className="ns-au-forgot">
                  <button type="button" className="ns-au-link" onClick={() => switchMode('reset')}>Forgot password?</button>
                </div>
              ) : null}

              {mode === 'signup' ? (
                <fieldset className="ns-au-consent">
                  <legend>Share with material partners (optional)</legend>
                  <div className="ns-au-opt">
                    <label className="ns-i-chk" htmlFor="au-c1">
                      <input id="au-c1" type="checkbox" checked={consentPartners} onChange={e => setConsentPartners(e.target.checked)} aria-describedby="au-c1-d" />
                      <span>Share my city with construction material partners for relevant offers</span>
                    </label>
                    <p className="ns-i-hint" id="au-c1-d">If checked, we may share your city (not your phone number or exact address) with cement, steel, or other construction material companies for partnership offers. You can withdraw this anytime from your account page.</p>
                  </div>
                  <hr className="ns-au-rule" />
                  <div className="ns-au-opt">
                    <label className="ns-i-chk" htmlFor="au-c2">
                      <input id="au-c2" type="checkbox" checked={consentPartnersContact} onChange={e => setConsentPartnersContact(e.target.checked)} aria-describedby="au-c2-d" />
                      <span>Also share my name, phone number, and email with construction material partners for offers</span>
                    </label>
                    <p className="ns-i-hint" id="au-c2-d">If checked, we may share your name, phone number, and email with cement, steel, or other construction material companies for partnership offers. You can withdraw this anytime from your account page.</p>
                  </div>
                </fieldset>
              ) : null}

              {error ? <Note kind="err">{error}</Note> : null}
              {message ? <div role="status"><Note kind="ok">{message}</Note></div> : null}

              <button type="submit" disabled={loading} className="ns-btn ns-au-submit">
                {submitLabel}
                {!loading ? <IcArrow width={22} height={11} /> : null}
              </button>

              {mode === 'reset' ? (
                <button type="button" className="ns-au-link ns-au-link--c" onClick={() => switchMode('login')}>Back to log in</button>
              ) : null}
            </form>

            {mode !== 'reset' ? (
              <p className="ns-au-foot">
                {mode === 'login' ? (
                  <>No account? <button type="button" className="ns-au-link" onClick={() => switchMode('signup')}>Sign up free</button></>
                ) : (
                  <>Already have an account? <button type="button" className="ns-au-link" onClick={() => switchMode('login')}>Log in</button></>
                )}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="ns-i-page">
        <div className="ns-i-wrap"><p className="ns-au-lede" style={{ textAlign: 'center' }}>Loading…</p></div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}
