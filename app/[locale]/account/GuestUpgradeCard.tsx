'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Field, Input, Note } from '@/components/v2/inner/kit'
import { useCopy } from '@/lib/i18n/use-copy'
import { useTr } from '@/lib/i18n/use-tr'
import { GUEST } from '@/lib/i18n/labels/pages-account'
import { AUTH_MESSAGES } from '@/lib/i18n/labels/pages-auth'

/**
 * GuestUpgradeCard
 *
 * Shown on the account page for anonymous ("Continue as Guest") sessions.
 * Converts the anonymous user into a permanent email/password account via
 * supabase.auth.updateUser({ email, password }). Because the auth.uid() is
 * unchanged by this call, every existing row keyed by user_id — estimates,
 * projects, payments, reports — stays attached with no migration needed.
 *
 * Supabase sends a confirmation email to the new address; the account becomes
 * permanent once that link is clicked. The password is set immediately so the
 * user can log back in afterwards.
 */
export default function GuestUpgradeCard() {
  const supabase = useMemo(() => createClient(), [])
  const c = useCopy(GUEST)
  // The error is kept in English as it came; `t` shows it in Hindi on a Hindi page and leaves unknown lines as they are.
  const t = useTr(AUTH_MESSAGES)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const canSubmit = emailValid && password.length >= 6 && !loading

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({
        email: email.trim(),
        password,
      })
      if (error) throw error
      setDone(true)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not secure your account. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <Note kind="ok" title={c.doneTitle}>
        {c.doneBody}
      </Note>
    )
  }

  return (
    <section className="ns-plate ns-r-sec ns-ac-guest" aria-labelledby="ac-guest">
      <Note kind="warn" title={c.noteTitle}>
        {c.noteBody}
      </Note>
      <h2 id="ac-guest" style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 }}>
        {c.h}
      </h2>
      <p className="ns-r-sec__sub">{c.sub}</p>

      <form onSubmit={handleUpgrade} className="ns-i-form" noValidate>
        <div className="ns-i-fields">
          <Field id="ac-email" label={c.email} required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder={c.emailPh} />
          </Field>
          <Field id="ac-pass" label={c.password} required hint={c.passHint}>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
          </Field>
        </div>

        {error ? <Note kind="err" title={c.errTitle}>{t(error)}</Note> : null}

        <div className="ns-i-actions">
          <button type="submit" disabled={!canSubmit} className="ns-btn">
            {loading ? c.busy : c.go}
          </button>
        </div>
      </form>
    </section>
  )
}
