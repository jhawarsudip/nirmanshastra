'use client'

import { Suspense, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Field, Input, Note, IcArrow } from '@/components/v2/inner/kit'
import { stripLocale } from '@/lib/i18n/paths'
import { useCopy } from '@/lib/i18n/use-copy'
import { useTr } from '@/lib/i18n/use-tr'
import { AUTH, AUTH_MESSAGES } from '@/lib/i18n/labels/pages-auth'

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
  // Hindi words for the page; `t` turns a message held in English (ours, or one the sign-in service sent) into Hindi when it is drawn.
  const c = useCopy(AUTH)
  const t = useTr(AUTH_MESSAGES)

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
    ? c.wait
    : mode === 'login' ? c.submitLogin : mode === 'reset' ? c.submitReset : c.submitSignup

  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap">
        <div className="ns-au">
          <header className="ns-au-head">
            <p className="ns-au-eyebrow">{c.eyebrow}</p>
            <h1>{c.headings[mode]}</h1>
            {toolName ? <p>{c.toolA}<b>{toolName}</b>{c.toolB}</p> : null}
          </header>

          <div className="ns-plate ns-au-card">
            {mode !== 'reset' ? (
              <div className="ns-au-tabs" role="tablist" aria-label={c.tabsAria}>
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
                    {m === 'login' ? c.tabLogin : c.tabSignup}
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
                <p className="ns-au-lede">{c.resetLede}</p>
              ) : null}

              {mode === 'signup' ? (
                <div className="ns-i-fields">
                  <Field id="au-name" label={c.fullName} required wide>
                    <Input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder={c.namePh} autoComplete="name" />
                  </Field>
                  <Field id="au-email" label={c.email} required wide>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={c.emailPh} autoComplete="email" />
                  </Field>
                  <Field id="au-phone" label={c.mobile} required wide hint={c.mobileHint} error={phoneError ? t(phoneError) : phoneError}>
                    <Input
                      type="tel" inputMode="numeric" value={phone}
                      onChange={e => { setPhone(e.target.value); if (phoneError) setPhoneError('') }}
                      required placeholder="9876543210" maxLength={10} autoComplete="tel-national"
                    />
                  </Field>
                  <Field id="au-city" label={c.city} required>
                    <Input type="text" value={city} onChange={e => setCity(e.target.value)} required placeholder={c.cityPh} autoComplete="address-level2" />
                  </Field>
                  <Field id="au-pin" label={c.pin} required error={pincodeError ? t(pincodeError) : pincodeError}>
                    <Input
                      type="text" inputMode="numeric" value={pincode}
                      onChange={e => { setPincode(e.target.value); if (pincodeError) setPincodeError('') }}
                      required placeholder="411001" maxLength={6} autoComplete="postal-code"
                    />
                  </Field>
                  <Field id="au-password" label={c.password} required wide hint={c.passHint}>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder={c.passPhNew} autoComplete="new-password" />
                  </Field>
                </div>
              ) : (
                <div className="ns-i-fields">
                  <Field id="au-email" label={c.email} required wide>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={c.emailPh} autoComplete="email" />
                  </Field>
                  {mode === 'login' ? (
                    <Field id="au-password" label={c.password} required wide>
                      <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder={c.passPhNow} autoComplete="current-password" />
                    </Field>
                  ) : null}
                </div>
              )}

              {mode === 'login' ? (
                <div className="ns-au-forgot">
                  <button type="button" className="ns-au-link" onClick={() => switchMode('reset')}>{c.forgot}</button>
                </div>
              ) : null}

              {mode === 'signup' ? (
                <fieldset className="ns-au-consent">
                  <legend>{c.consentLegend}</legend>
                  <div className="ns-au-opt">
                    <label className="ns-i-chk" htmlFor="au-c1">
                      <input id="au-c1" type="checkbox" checked={consentPartners} onChange={e => setConsentPartners(e.target.checked)} aria-describedby="au-c1-d" />
                      <span>{c.c1Label}</span>
                    </label>
                    <p className="ns-i-hint" id="au-c1-d">{c.c1Desc}</p>
                  </div>
                  <hr className="ns-au-rule" />
                  <div className="ns-au-opt">
                    <label className="ns-i-chk" htmlFor="au-c2">
                      <input id="au-c2" type="checkbox" checked={consentPartnersContact} onChange={e => setConsentPartnersContact(e.target.checked)} aria-describedby="au-c2-d" />
                      <span>{c.c2Label}</span>
                    </label>
                    <p className="ns-i-hint" id="au-c2-d">{c.c2Desc}</p>
                  </div>
                </fieldset>
              ) : null}

              {error ? <Note kind="err">{t(error)}</Note> : null}
              {message ? <div role="status"><Note kind="ok">{t(message)}</Note></div> : null}

              <button type="submit" disabled={loading} className="ns-btn ns-au-submit">
                {submitLabel}
                {!loading ? <IcArrow width={22} height={11} /> : null}
              </button>

              {mode === 'reset' ? (
                <button type="button" className="ns-au-link ns-au-link--c" onClick={() => switchMode('login')}>{c.backToLogin}</button>
              ) : null}
            </form>

            {mode !== 'reset' ? (
              <p className="ns-au-foot">
                {mode === 'login' ? (
                  <>{c.noAccount} <button type="button" className="ns-au-link" onClick={() => switchMode('signup')}>{c.signupFree}</button></>
                ) : (
                  <>{c.haveAccount} <button type="button" className="ns-au-link" onClick={() => switchMode('login')}>{c.loginLink}</button></>
                )}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthLoading() {
  const c = useCopy(AUTH)
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap"><p className="ns-au-lede" style={{ textAlign: 'center' }}>{c.loading}</p></div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthContent />
    </Suspense>
  )
}
