'use client'

import { Suspense, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'login' | 'signup'

const TOOL_NAMES: Record<string, string> = {
  '/tools/structopro':  'StructoPro',
  '/tools/masonpro':    'MasonPro',
  '/tools/electropro':  'ElectroPro',
  '/tools/plumbpro':    'PlumbPro',
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
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        setMessage('Account created! Check your email to confirm, then log in.')
        setMode('login')
        setPassword('')
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
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
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
        {/* Tab switcher */}
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

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {mode === 'signup' && (
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
          </div>

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
            {loading ? 'Please wait…' : mode === 'login' ? 'Log In →' : 'Create Account →'}
          </button>
        </form>

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
