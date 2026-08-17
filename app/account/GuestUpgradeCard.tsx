'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  return (
    <div
      style={{
        border: '1px solid #D99A06',
        borderRadius: 2,
        background: 'rgba(217,154,6,0.10)',
        padding: '20px 24px',
        marginBottom: 20,
      }}
    >
      <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1E2227', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
        ⚠ GUEST SESSION — SECURE YOUR ACCOUNT
      </p>

      {done ? (
        <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: '#14532D', lineHeight: 1.6 }}>
          ✓ Check your email to confirm your new address. Once confirmed, you can log in
          with this email and password — all your existing projects and reports stay
          exactly where they are.
        </p>
      ) : (
        <>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.7)', lineHeight: 1.65, marginBottom: 16 }}>
            You&apos;re using NirmanShastra as a guest. Add an email and password to keep
            permanent access to your projects, reports, and purchases — you won&apos;t lose
            anything you&apos;ve already created.
          </p>

          <form onSubmit={handleUpgrade} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                style={{ border: '1px solid #1E2227', borderRadius: 6, padding: '9px 12px', fontSize: 14, background: '#fff', color: '#1E2227', fontFamily: 'var(--font-plex-sans)', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                style={{ border: '1px solid #1E2227', borderRadius: 6, padding: '9px 12px', fontSize: 14, background: '#fff', color: '#1E2227', fontFamily: 'var(--font-plex-sans)', outline: 'none' }}
              />
            </div>

            {error && (
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: '#8C3A22' }}>⚠ {error}</p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: '11px 20px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                background: '#8C3A22',
                border: 'none',
                fontFamily: 'var(--font-plex-sans)',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                opacity: canSubmit ? 1 : 0.55,
              }}
            >
              {loading ? 'Securing…' : 'Secure My Account →'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
