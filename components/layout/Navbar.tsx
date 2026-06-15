'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// ── Admin password modal ──────────────────────────────────────────────────────

function AdminModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [pw, setPw]         = useState('')
  const [busy, setBusy]     = useState(false)
  const [shake, setShake]   = useState(false)
  const inputRef            = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const res  = await fetch('/api/admin/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: pw }),
    })
    const data = await res.json()
    setBusy(false)
    if (data.ok) {
      onClose()
      router.push('/admin')
    } else {
      setPw('')
      setShake(true)
      setTimeout(() => setShake(false), 400)
      inputRef.current?.focus()
    }
  }

  const mono: React.CSSProperties = { fontFamily: 'var(--font-plex-mono)' }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(30,34,39,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:    '#1E2227',
          border:        '1px solid rgba(244,244,240,0.15)',
          padding:       '32px',
          width:         320,
          transform:     shake ? 'translateX(6px)' : 'none',
          transition:    'transform 0.08s ease',
        }}
      >
        <div style={{ ...mono, fontSize: 10, color: 'rgba(244,244,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
          ADMIN ACCESS · NS-ADM
        </div>
        <form onSubmit={submit}>
          <input
            ref={inputRef}
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Password"
            style={{
              ...mono,
              width:       '100%',
              boxSizing:   'border-box',
              background:  'rgba(244,244,240,0.06)',
              border:      '1px solid rgba(244,244,240,0.15)',
              color:       '#F4F4F0',
              padding:     '10px 12px',
              fontSize:    13,
              outline:     'none',
              marginBottom: 14,
              borderRadius: 0,
            }}
          />
          <button
            type="submit"
            disabled={busy || !pw}
            style={{
              ...mono,
              width:         '100%',
              background:    busy || !pw ? 'rgba(140,58,34,0.4)' : '#8C3A22',
              color:         '#F4F4F0',
              border:        'none',
              padding:       '10px',
              fontSize:      12,
              cursor:        busy || !pw ? 'not-allowed' : 'pointer',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {busy ? 'Verifying…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}

const COMPLIANCE_TOOLS = [
  { phase: 'P0', name: 'VastuPro', descriptor: 'Vastu Compliance Analyser', href: '/tools/vastu-pro', free: true },
]

const ESTIMATION_TOOLS = [
  { phase: 'P1', name: 'StructoPro',  descriptor: 'Structural Cost & BOQ Estimator',  href: '/tools/structopro',  free: false },
  { phase: 'P2', name: 'MasonPro',    descriptor: 'Masonry Cost & BOQ Estimator',      href: '/tools/masonpro',    free: false },
  { phase: 'P3', name: 'ElectroPro',  descriptor: 'Electrical Cost & BOQ Estimator',   href: '/tools/electropro',  free: false },
  { phase: 'P4', name: 'PlumbPro',    descriptor: 'Plumbing Cost & BOQ Estimator',     href: '/tools/plumbpro',    free: false },
  { phase: 'P5', name: 'InteriorPro', descriptor: 'Interior Cost & BOQ Estimator',     href: '/tools/interiorpro', free: false },
]

export default function Navbar() {
  const [user, setUser]             = useState<User | null>(null)
  const [toolsOpen, setToolsOpen]   = useState(false)
  const [adminOpen, setAdminOpen]   = useState(false)
  const dropdownRef                 = useRef<HTMLDivElement>(null)
  const logoClickTimes              = useRef<number[]>([])
  const router                      = useRouter()
  const supabase                    = useMemo(() => createClient(), [])

  function handleLogoClick() {
    const now = Date.now()
    logoClickTimes.current = [...logoClickTimes.current, now].filter(t => now - t < 2000)
    if (logoClickTimes.current.length >= 5) {
      logoClickTimes.current = []
      setAdminOpen(true)
    } else {
      router.push('/')
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const mono: React.CSSProperties = { fontFamily: 'var(--font-plex-mono)' }

  return (
    <>
    <nav
      style={{
        background: '#1E2227',
        borderBottom: '1px solid rgba(244,244,240,0.08)',
        minHeight: 52,
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
      className="w-full px-5 flex items-center justify-between"
    >
      {/* Logo — 5 rapid clicks opens admin modal */}
      <button
        onClick={handleLogoClick}
        className="flex flex-col leading-none flex-shrink-0"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        aria-label="NirmanShastra home"
      >
        <span style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>
          <span style={{ color: '#F4F4F0' }}>Nirman</span><span style={{ color: '#C9A84C' }}>Shastra</span>
        </span>
        <span style={{ fontFamily: 'var(--font-plex-devanagari)', fontSize: 11, color: '#C9A84C', opacity: 0.7, marginTop: 1 }}>
          निर्माणशास्त्र
        </span>
      </button>

      {/* Centre nav */}
      <div className="hidden md:flex items-center gap-6">
        {/* Tools dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setToolsOpen(o => !o)}
            style={{ fontFamily: 'var(--font-plex-sans)', fontWeight: 500, color: 'rgba(244,244,240,0.65)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}
          >
            Tools <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
          </button>

          {toolsOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1E2227',
              border: '1px solid rgba(244,244,240,0.12)',
              minWidth: 300,
              zIndex: 50,
            }}>
              {/* Section 1: Compliance & Analysis */}
              <div style={{ padding: '6px 14px 5px', background: 'rgba(244,244,240,0.04)', borderBottom: '1px solid rgba(244,244,240,0.08)' }}>
                <span style={{ ...mono, fontSize: 9, color: 'rgba(244,244,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Compliance &amp; Analysis
                </span>
              </div>
              {COMPLIANCE_TOOLS.map(t => (
                <Link
                  key={t.name}
                  href={t.href}
                  onClick={() => setToolsOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', textDecoration: 'none', gap: 10 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...mono, fontSize: 12, color: '#F4F4F0' }}>{t.name}</div>
                    <div style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 10, color: 'rgba(244,244,240,0.4)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.descriptor}
                    </div>
                  </div>
                  <span style={{ ...mono, fontSize: 10, padding: '2px 6px', color: '#14532D', border: '1px solid #14532D', letterSpacing: '0.04em', flexShrink: 0 }}>
                    FREE
                  </span>
                </Link>
              ))}

              {/* Section 2: Estimation Tools */}
              <div style={{ padding: '6px 14px 5px', background: 'rgba(244,244,240,0.04)', borderTop: '1px solid rgba(244,244,240,0.1)', borderBottom: '1px solid rgba(244,244,240,0.08)' }}>
                <span style={{ ...mono, fontSize: 9, color: 'rgba(244,244,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Estimation Tools
                </span>
              </div>
              {ESTIMATION_TOOLS.map((t, i) => (
                <Link
                  key={t.name}
                  href={t.href}
                  onClick={() => setToolsOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderTop: i > 0 ? '1px solid rgba(244,244,240,0.06)' : undefined, textDecoration: 'none', gap: 10 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...mono, fontSize: 12, color: '#F4F4F0' }}>{t.name}</div>
                    <div style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 10, color: 'rgba(244,244,240,0.4)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.descriptor}
                    </div>
                  </div>
                  <span style={{ ...mono, fontSize: 10, padding: '2px 6px', color: '#1F4E79', border: '1px solid #1F4E79', letterSpacing: '0.04em', flexShrink: 0 }}>
                    ₹499
                  </span>
                </Link>
              ))}

              <div style={{ borderTop: '1px solid rgba(244,244,240,0.1)', padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...mono, fontSize: 11, color: 'rgba(244,244,240,0.5)' }}>Bundle — 5 tools</span>
                <span style={{ ...mono, fontSize: 12, color: '#8C3A22' }}>₹2,999</span>
              </div>
            </div>
          )}
        </div>

        <Link href="/#how-it-works" style={{ fontFamily: 'var(--font-plex-sans)', fontWeight: 500, color: 'rgba(244,244,240,0.65)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>
          How It Works
        </Link>
        <Link href="/#pricing" style={{ fontFamily: 'var(--font-plex-sans)', fontWeight: 500, color: 'rgba(244,244,240,0.65)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>
          Pricing
        </Link>
      </div>

      {/* Auth */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span style={{ ...mono, color: 'rgba(244,244,240,0.5)', fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              className="hidden sm:block">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              style={{ ...mono, border: '1px solid rgba(244,244,240,0.2)', color: '#F4F4F0', fontSize: 11, padding: '6px 12px', borderRadius: 6, background: 'none', cursor: 'pointer' }}
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth"
              style={{ ...mono, color: '#F4F4F0', fontSize: 14, textDecoration: 'none', letterSpacing: '0.04em', border: '1px solid rgba(244,244,240,0.3)', padding: '10px 24px', borderRadius: 6 }}
              className="hidden sm:block"
            >
              Log In
            </Link>
            <Link
              href="/tools/vastu-pro"
              className="btn-get-started"
              style={{ ...mono, background: '#8C3A22', color: '#F4F4F0', fontSize: 14, padding: '10px 24px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.04em', whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(140,58,34,0.5)', border: '1px solid rgba(255,255,255,0.15)', transition: 'all 0.25s', display: 'inline-block' }}
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>

    {adminOpen && <AdminModal onClose={() => setAdminOpen(false)} />}
    </>
  )
}
