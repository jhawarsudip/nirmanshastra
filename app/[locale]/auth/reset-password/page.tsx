// Requires Site URL and Redirect URLs to be configured correctly in
// Supabase Dashboard > Authentication > URL Configuration for this flow to work in production.

'use client'

import { useState, useMemo, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Field, Input, Note, IcArrow } from '@/components/v2/inner/kit'
import { useCopy } from '@/lib/i18n/use-copy'
import { useTr } from '@/lib/i18n/use-tr'
import { RESET, AUTH_MESSAGES } from '@/lib/i18n/labels/pages-auth'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  // Hindi words for the page; `t` turns a message held in English (ours, or one the sign-in service sent) into Hindi when it is drawn.
  const c = useCopy(RESET)
  const t = useTr(AUTH_MESSAGES)

  // Supabase appends the recovery token as a hash fragment; the client-side
  // SDK picks it up automatically on mount and establishes a recovery session.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.push('/auth'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap">
        <div className="ns-au">
          <header className="ns-au-head">
            <p className="ns-au-eyebrow">{c.eyebrow}</p>
            <h1>{c.name}</h1>
          </header>

          <div className="ns-plate ns-au-card">
            {success ? (
              <div className="ns-au-form" role="status">
                <Note kind="ok" title={c.doneTitle}>{c.doneBody}</Note>
              </div>
            ) : !sessionReady ? (
              <div className="ns-au-form">
                <Note kind="err" title={c.badTitle}>{c.badBody}</Note>
                <Link href="/auth" className="ns-btn ns-au-submit">{c.backToLogin}<IcArrow width={22} height={11} /></Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="ns-au-form">
                <div className="ns-i-fields">
                  <Field id="rp-password" label={c.newPass} required wide hint={c.newHint}>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder={c.newPh} autoComplete="new-password" />
                  </Field>
                  <Field id="rp-confirm" label={c.confirm} required wide>
                    <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} placeholder={c.confirmPh} autoComplete="new-password" />
                  </Field>
                </div>

                {error ? <Note kind="err">{t(error)}</Note> : null}

                <button type="submit" disabled={loading} className="ns-btn ns-au-submit">
                  {loading ? c.wait : c.update}
                  {!loading ? <IcArrow width={22} height={11} /> : null}
                </button>
              </form>
            )}

            {!success && sessionReady ? (
              <p className="ns-au-foot"><Link href="/auth" className="ns-au-link">{c.backToLogin}</Link></p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
