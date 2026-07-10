'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { StructureIcon } from '@/components/icons/StructureIcon'
import { MasonryIcon } from '@/components/icons/MasonryIcon'
import { ElectricalIcon } from '@/components/icons/ElectricalIcon'
import { PlumbingIcon } from '@/components/icons/PlumbingIcon'
import { InteriorIcon } from '@/components/icons/InteriorIcon'
import { VastuIcon } from '@/components/icons/VastuIcon'

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

const PHASE_ICONS: Record<string, React.ReactElement> = {
  P0: <VastuIcon size={20} />,
  P1: <StructureIcon size={20} />,
  P2: <MasonryIcon size={20} />,
  P3: <ElectricalIcon size={20} />,
  P4: <PlumbingIcon size={20} />,
  P5: <InteriorIcon size={20} />,
}

const MOBILE_PHASE_ICONS: Record<string, React.ReactElement> = {
  P0: <VastuIcon size={28} />,
  P1: <StructureIcon size={28} />,
  P2: <MasonryIcon size={28} />,
  P3: <ElectricalIcon size={28} />,
  P4: <PlumbingIcon size={28} />,
  P5: <InteriorIcon size={28} />,
}

const COMPLIANCE_TOOLS = [
  { phase: 'P0', name: 'VastuPro', descriptor: 'Vastu Compliance Analyser', href: '/tools/vastu-pro', free: true },
]

const ESTIMATION_TOOLS = [
  { phase: 'P1', name: 'StructurePro',  descriptor: 'Structural Cost & BOQ Estimator',  href: '/tools/structopro',   free: false, price: '₹999' },
  { phase: 'P2', name: 'MasonryPro',   descriptor: 'Masonry Cost & BOQ Estimator',      href: '/tools/masonpro',     free: false, price: '₹699' },
  { phase: 'P3', name: 'ElectricalPro', descriptor: 'Electrical Cost & BOQ Estimator',  href: '/tools/electropro',   free: false, price: '₹499' },
  { phase: 'P4', name: 'PlumbingPro',  descriptor: 'Plumbing Cost & BOQ Estimator',     href: '/tools/plumbpro',     free: false, price: '₹499' },
  { phase: 'P5', name: 'InteriorPro', descriptor: 'Interior Cost & BOQ Estimator',     href: '/tools/interiorpro',  free: false, price: '₹899' },
]

const REPORTS_TOOLS = [
  { phase: 'GT', name: 'Grand Total Report', descriptor: 'Master Project Report — All 5 Phases', href: '/tools/grand-total', price: '₹999' },
]

const NAV_LINKS = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
]

export default function Navbar() {
  const [user, setUser]             = useState<User | null>(null)
  const [toolsOpen, setToolsOpen]   = useState(false)
  const [adminOpen, setAdminOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef                 = useRef<HTMLDivElement>(null)
  const closeButtonRef              = useRef<HTMLButtonElement>(null)
  const logoClickTimes              = useRef<number[]>([])
  const router                      = useRouter()
  const pathname                    = usePathname()
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

  // Close desktop dropdown on outside click or Escape
  useEffect(() => {
    function mouseHandler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false)
      }
    }
    function keyHandler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setToolsOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', mouseHandler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', mouseHandler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      // Focus close button for accessibility
      setTimeout(() => closeButtonRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

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
        background: '#000000',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
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
        className="flex items-center gap-2 leading-none flex-shrink-0"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        aria-label="NirmanShastra home"
      >
        {/* North-arrow logo mark — north pointer in primary gold */}
        <svg width="40" height="28" viewBox="0 0 48 32" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
          <line x1="24" y1="3" x2="24" y2="29" stroke="rgba(212,175,55,0.35)" strokeWidth="0.75"/>
          <line x1="3" y1="16" x2="45" y2="16" stroke="rgba(212,175,55,0.35)" strokeWidth="0.75"/>
          <polygon points="24,3 19,16 29,16" fill="#D4AF37"/>
          <polygon points="24,29 19,16 29,16" fill="rgba(212,175,55,0.28)"/>
          <circle cx="24" cy="16" r="4" fill="none" stroke="#D4AF37" strokeWidth="0.75"/>
          <circle cx="24" cy="16" r="1.5" fill="#D4AF37"/>
          <text x="24" y="1.5" textAnchor="middle" fontSize="6" fontFamily="monospace" fill="#D4AF37" fontWeight="bold">N</text>
        </svg>
        <div className="flex flex-col">
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: 21, fontWeight: 700, lineHeight: 1.1 }}>
            <span style={{ color: '#FFFFFF' }}>Nirman</span><span style={{ color: '#D4AF37' }}>Shastra</span>
          </span>
        </div>
      </button>

      {/* Centre nav — desktop only */}
      <div className="hidden md:flex items-center gap-6">
        {/* Tools dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setToolsOpen(o => !o)}
            className="nav-link"
            style={{ fontFamily: 'var(--font-inter)', fontWeight: 500, color: 'rgba(179,179,179,0.8)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}
          >
            Tools <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
          </button>

          {toolsOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
            <div className="dropdown-3d" style={{
              background: '#0A0A0A',
              border: '1px solid rgba(212,175,55,0.2)',
              minWidth: 300,
            }}>
              <div style={{ padding: '6px 14px 5px', background: 'rgba(212,175,55,0.04)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                <span style={{ ...mono, fontSize: 9, color: 'rgba(212,175,55,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
                  <div style={{ width: 20, height: 20, flexShrink: 0, opacity: 0.85 }}>{PHASE_ICONS[t.phase]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...mono, fontSize: 12, color: '#FFFFFF' }}>{t.name}</div>
                    <div style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 10, color: 'rgba(179,179,179,0.6)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.descriptor}</div>
                  </div>
                  <span style={{ ...mono, fontSize: 10, padding: '2px 6px', color: '#14532D', border: '1px solid #14532D', letterSpacing: '0.04em', flexShrink: 0 }}>FREE</span>
                </Link>
              ))}

              <div style={{ padding: '6px 14px 5px', background: 'rgba(212,175,55,0.04)', borderTop: '1px solid rgba(212,175,55,0.1)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                <span style={{ ...mono, fontSize: 9, color: 'rgba(212,175,55,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Estimation Tools</span>
              </div>
              {ESTIMATION_TOOLS.map((t, i) => (
                <Link
                  key={t.name}
                  href={t.href}
                  onClick={() => setToolsOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderTop: i > 0 ? '1px solid rgba(212,175,55,0.06)' : undefined, textDecoration: 'none', gap: 10 }}
                >
                  <div style={{ width: 20, height: 20, flexShrink: 0, opacity: 0.85 }}>{PHASE_ICONS[t.phase]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...mono, fontSize: 12, color: '#FFFFFF' }}>{t.name}</div>
                    <div style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 10, color: 'rgba(179,179,179,0.6)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.descriptor}</div>
                  </div>
                  <span style={{ ...mono, fontSize: 10, padding: '2px 6px', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.35)', letterSpacing: '0.04em', flexShrink: 0 }}>{t.price}</span>
                </Link>
              ))}

              <div style={{ padding: '6px 14px 5px', background: 'rgba(212,175,55,0.04)', borderTop: '1px solid rgba(212,175,55,0.1)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                <span style={{ ...mono, fontSize: 9, color: 'rgba(212,175,55,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Master Reports</span>
              </div>
              {REPORTS_TOOLS.map(t => (
                <Link
                  key={t.name}
                  href={t.href}
                  onClick={() => setToolsOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', textDecoration: 'none', gap: 10 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...mono, fontSize: 12, color: '#FFFFFF' }}>{t.name}</div>
                    <div style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 10, color: 'rgba(179,179,179,0.6)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.descriptor}</div>
                  </div>
                  <span style={{ ...mono, fontSize: 10, padding: '2px 6px', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.35)', letterSpacing: '0.04em', flexShrink: 0 }}>{t.price}</span>
                </Link>
              ))}

              <div style={{ borderTop: '1px solid rgba(212,175,55,0.1)', padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...mono, fontSize: 11, color: 'rgba(179,179,179,0.5)' }}>Bundle — 5 tools</span>
                <span style={{ ...mono, fontSize: 12, color: '#D4AF37' }}>₹2,999</span>
              </div>
            </div>
            </div>
          )}
        </div>

        <Link href="/#how-it-works" className="nav-link" style={{ fontFamily: 'var(--font-inter)', fontWeight: 500, color: 'rgba(179,179,179,0.8)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>
          How It Works
        </Link>
        <Link href="/#pricing" className="nav-link" style={{ fontFamily: 'var(--font-inter)', fontWeight: 500, color: 'rgba(179,179,179,0.8)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>
          Pricing
        </Link>
        <Link href="/blog" className="nav-link" style={{ fontFamily: 'var(--font-inter)', fontWeight: 500, color: 'rgba(179,179,179,0.8)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>
          Blog
        </Link>
        <Link href="/faq" className="nav-link" style={{ fontFamily: 'var(--font-inter)', fontWeight: 500, color: 'rgba(179,179,179,0.8)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>
          FAQ
        </Link>
        <Link href="/compare-quote" className="nav-link" style={{ fontFamily: 'var(--font-inter)', fontWeight: 500, color: 'rgba(179,179,179,0.8)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none', borderLeft: '1px solid rgba(212,175,55,0.15)', paddingLeft: 24 }}>
          Compare Contractor Quote
        </Link>
      </div>

      {/* Right — desktop auth + mobile hamburger */}
      <div className="flex items-center gap-3">
        {/* Desktop auth (hidden on mobile) */}
        {user ? (
          <>
            <span
              style={{ ...mono, color: 'rgba(179,179,179,0.6)', fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              className="hidden md:block"
            >
              {user.user_metadata?.full_name || user.email}
            </span>
            <Link
              href="/reports"
              style={{ ...mono, color: 'rgba(179,179,179,0.85)', fontSize: 12, textDecoration: 'none', letterSpacing: '0.05em', border: '1px solid rgba(212,175,55,0.25)', padding: '6px 12px', borderRadius: 6 }}
              className="hidden md:block"
            >
              My Reports
            </Link>
            <button
              onClick={handleLogout}
              style={{ ...mono, border: '1px solid rgba(212,175,55,0.15)', color: 'rgba(179,179,179,0.6)', fontSize: 11, padding: '6px 12px', borderRadius: 6, background: 'none', cursor: 'pointer' }}
              className="hidden md:block"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth"
              style={{ ...mono, color: '#FFFFFF', fontSize: 13, textDecoration: 'none', letterSpacing: '0.04em', border: '1px solid rgba(212,175,55,0.3)', padding: '10px 24px', borderRadius: 6 }}
              className="hidden md:block"
            >
              Log In
            </Link>
            <Link
              href="/tools/vastu-pro"
              className="btn-get-started hidden md:inline-block"
              style={{ ...mono, background: '#D4AF37', color: '#000000', fontSize: 13, padding: '10px 24px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.04em', whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(212,175,55,0.35)', border: '1px solid rgba(212,175,55,0.5)', transition: 'all 0.25s' }}
            >
              Get Started
            </Link>
          </>
        )}

        {/* Mobile hamburger / close toggle */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="md:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-overlay"
          style={{
            background: 'none',
            border: '1px solid rgba(212,175,55,0.25)',
            cursor: 'pointer',
            padding: '9px 10px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            minWidth: 44,
            minHeight: 44,
            transition: 'border-color 180ms ease',
          }}
        >
          {mobileOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="2" x2="2" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <line x1="2" y1="4"  x2="16" y2="4"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="2" y1="9"  x2="16" y2="9"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="2" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </nav>

    {/* ── MOBILE FULL-SCREEN NAVIGATION OVERLAY ─────────────────────────────── */}
    <div
      id="mobile-nav-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation"
      className="mobile-overlay md:hidden"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 49,
        background: '#000000',
        transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Overlay top bar — matches nav height and logo placement */}
      <div style={{
        minHeight: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid rgba(212,175,55,0.12)',
        flexShrink: 0,
      }}>
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 leading-none"
          style={{ textDecoration: 'none' }}
          aria-label="NirmanShastra home"
        >
          <svg width="36" height="24" viewBox="0 0 48 32" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <line x1="24" y1="3" x2="24" y2="29" stroke="rgba(212,175,55,0.35)" strokeWidth="0.75"/>
            <line x1="3" y1="16" x2="45" y2="16" stroke="rgba(212,175,55,0.35)" strokeWidth="0.75"/>
            <polygon points="24,3 19,16 29,16" fill="#D4AF37"/>
            <polygon points="24,29 19,16 29,16" fill="rgba(212,175,55,0.28)"/>
            <circle cx="24" cy="16" r="4" fill="none" stroke="#D4AF37" strokeWidth="0.75"/>
            <circle cx="24" cy="16" r="1.5" fill="#D4AF37"/>
            <text x="24" y="1.5" textAnchor="middle" fontSize="6" fontFamily="monospace" fill="#D4AF37" fontWeight="bold">N</text>
          </svg>
          <div className="flex flex-col">
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: 19, fontWeight: 700, lineHeight: 1.1 }}>
              <span style={{ color: '#FFFFFF' }}>Nirman</span><span style={{ color: '#D4AF37' }}>Shastra</span>
            </span>
          </div>
        </Link>
        <button
          ref={closeButtonRef}
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          style={{
            background: 'none',
            border: '1px solid rgba(212,175,55,0.25)',
            cursor: 'pointer',
            padding: '9px 10px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="2" x2="2" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Menu content — fades+slides in after overlay appears */}
      <div
        className={`mobile-overlay-content${mobileOpen ? ' is-open' : ''}`}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >

        {/* ── TOOLS — Compliance ─────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <div style={{ padding: '18px 24px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.08)' }} />
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(212,175,55,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0 }}>
              Compliance &amp; Analysis
            </span>
            <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.08)' }} />
          </div>
          {COMPLIANCE_TOOLS.map(t => (
            <Link
              key={t.name}
              href={t.href}
              onClick={() => setMobileOpen(false)}
              className="mobile-tool-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 24px',
                textDecoration: 'none',
                minHeight: 64,
                borderTop: '1px solid rgba(212,175,55,0.06)',
              }}
            >
              <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.9 }}>
                {MOBILE_PHASE_ICONS[t.phase]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 14, color: '#FFFFFF', letterSpacing: '0.02em' }}>{t.name}</div>
                <div style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(179,179,179,0.6)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descriptor}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, padding: '4px 10px', color: '#14532D', border: '1px solid #14532D', letterSpacing: '0.04em', flexShrink: 0 }}>FREE</span>
            </Link>
          ))}
        </div>

        {/* ── TOOLS — Estimation ─────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <div style={{ padding: '18px 24px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.08)' }} />
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(212,175,55,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0 }}>
              Estimation Tools
            </span>
            <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.08)' }} />
          </div>
          {ESTIMATION_TOOLS.map((t, i) => (
            <Link
              key={t.name}
              href={t.href}
              onClick={() => setMobileOpen(false)}
              className="mobile-tool-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 24px',
                textDecoration: 'none',
                minHeight: 64,
                borderTop: i > 0 ? '1px solid rgba(212,175,55,0.06)' : undefined,
              }}
            >
              <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.85 }}>
                {MOBILE_PHASE_ICONS[t.phase]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 14, color: '#FFFFFF', letterSpacing: '0.02em' }}>{t.name}</div>
                <div style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(179,179,179,0.6)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descriptor}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, padding: '4px 10px', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.35)', letterSpacing: '0.04em', flexShrink: 0 }}>{t.price}</span>
            </Link>
          ))}
        </div>

        {/* ── TOOLS — Master Reports ─────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <div style={{ padding: '18px 24px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.08)' }} />
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(212,175,55,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0 }}>
              Master Reports
            </span>
            <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.08)' }} />
          </div>
          {REPORTS_TOOLS.map(t => (
            <Link
              key={t.name}
              href={t.href}
              onClick={() => setMobileOpen(false)}
              className="mobile-tool-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 24px',
                textDecoration: 'none',
                minHeight: 64,
              }}
            >
              <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(212,175,55,0.3)', borderRadius: 4 }}>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(212,175,55,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GT</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 14, color: '#FFFFFF', letterSpacing: '0.02em' }}>{t.name}</div>
                <div style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(179,179,179,0.6)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descriptor}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, padding: '4px 10px', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.35)', letterSpacing: '0.04em', flexShrink: 0 }}>{t.price}</span>
            </Link>
          ))}
          {/* Bundle price line */}
          <div style={{ padding: '12px 24px', background: 'rgba(212,175,55,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(212,175,55,0.08)' }}>
            <span style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(179,179,179,0.5)' }}>Bundle — all 5 tools</span>
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 15, color: '#D4AF37', fontWeight: 500 }}>₹2,999</span>
          </div>
        </div>

        {/* ── NAVIGATION LINKS ───────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="mobile-nav-link-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                minHeight: 56,
                textDecoration: 'none',
                borderBottom: '1px solid rgba(212,175,55,0.06)',
                fontFamily: 'var(--font-plex-sans)',
                fontSize: 15,
                fontWeight: 500,
                color: 'rgba(179,179,179,0.8)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {link.label}
            </Link>
          ))}
          {/* Compare Quote — visually set apart */}
          <Link
            href="/compare-quote"
            onClick={() => setMobileOpen(false)}
            className="mobile-nav-link-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              minHeight: 56,
              textDecoration: 'none',
              fontFamily: 'var(--font-plex-sans)',
              fontSize: 15,
              fontWeight: 500,
              color: 'rgba(179,179,179,0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderTop: '1px solid rgba(212,175,55,0.1)',
            }}
          >
            Compare Contractor Quote
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, padding: '3px 8px', border: '1px solid rgba(212,175,55,0.4)', color: 'rgba(212,175,55,0.85)', letterSpacing: '0.07em' }}>NEW</span>
          </Link>
        </div>

        {/* ── AUTH SECTION ──────────────────────────────────────────────── */}
        <div style={{ padding: '24px', marginTop: 'auto' }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(179,179,179,0.4)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.user_metadata?.full_name || user.email}
              </p>
              <Link
                href="/reports"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  fontFamily: 'var(--font-plex-mono)',
                  fontSize: 14,
                  color: 'rgba(179,179,179,0.85)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  padding: '14px 24px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  minHeight: 52,
                  lineHeight: '24px',
                }}
              >
                My Reports
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  fontFamily: 'var(--font-plex-mono)',
                  fontSize: 14,
                  color: 'rgba(179,179,179,0.5)',
                  border: '1px solid rgba(212,175,55,0.12)',
                  padding: '14px 24px',
                  borderRadius: 6,
                  background: 'none',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  minHeight: 52,
                }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link
                href="/tools/vastu-pro"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  fontFamily: 'var(--font-plex-mono)',
                  fontSize: 15,
                  background: '#D4AF37',
                  color: '#000000',
                  padding: '16px 24px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  minHeight: 56,
                  lineHeight: '24px',
                  boxShadow: '0 0 24px rgba(212,175,55,0.3)',
                  border: '1px solid rgba(212,175,55,0.5)',
                }}
              >
                Get Started — Free
              </Link>
              <Link
                href="/auth"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  fontFamily: 'var(--font-plex-mono)',
                  fontSize: 14,
                  color: 'rgba(179,179,179,0.8)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  padding: '14px 24px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  minHeight: 52,
                  lineHeight: '24px',
                }}
              >
                Log In
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>

    {adminOpen && <AdminModal onClose={() => setAdminOpen(false)} />}
    </>
  )
}
