// Requires Site URL and Redirect URLs to be configured correctly in
// Supabase Dashboard > Authentication > URL Configuration for this flow to work in production.

'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

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
          Set New Password
        </h1>
      </div>

      <div
        className="w-full max-w-sm rounded-[2px] bg-sheet-white"
        style={{ border: '1px solid #1E2227' }}
      >
        <div
          className="px-5 py-3 text-[11px] uppercase tracking-widest"
          style={{
            borderBottom: '1px solid #1E2227',
            fontFamily: 'var(--font-plex-mono)',
            background: '#1E2227',
            color: '#F4F4F0',
          }}
        >
          Reset Password
        </div>

        {success ? (
          <div className="p-5 flex flex-col gap-4 text-center">
            <p
              className="text-[13px]"
              style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}
            >
              ✓ Password updated successfully.
            </p>
            <p
              className="text-[12px]"
              style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}
            >
              Redirecting you to login…
            </p>
          </div>
        ) : !sessionReady ? (
          <div className="p-5 flex flex-col gap-4">
            <p
              className="text-[13px]"
              style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}
            >
              ⚠ This reset link has expired or is invalid. Please request a new one.
            </p>
            <a
              href="/auth"
              className="text-[12px] underline text-center"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-sans)' }}
            >
              ← Back to login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label
                className="text-[11px] uppercase tracking-widest"
                style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}
              >
                New Password <span style={{ color: '#8C3A22' }}>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className="border border-iron-ink rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-sans)' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                className="text-[11px] uppercase tracking-widest"
                style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}
              >
                Confirm New Password <span style={{ color: '#8C3A22' }}>*</span>
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={8}
                placeholder="Repeat your new password"
                autoComplete="new-password"
                className="border border-iron-ink rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-sans)' }}
              />
            </div>

            {error && (
              <p className="text-[12px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                ⚠ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[6px] text-[14px] font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}
            >
              {loading ? 'Please wait…' : 'Update Password →'}
            </button>
          </form>
        )}

        {!success && (
          <div className="px-5 pb-4 text-center" style={{ borderTop: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[12px] pt-4" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>
              <a href="/auth" className="underline" style={{ color: '#1F4E79' }}>
                ← Back to login
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
