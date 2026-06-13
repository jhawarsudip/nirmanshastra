'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const TOOLS = [
  { phase: 'P0', name: 'VastuPro',   href: '/tools/vastu-pro',  free: true  },
  { phase: 'P1', name: 'StructoPro', href: '/tools/structopro', free: false },
  { phase: 'P2', name: 'MasonPro',   href: '/tools/masonpro',   free: false },
  { phase: 'P3', name: 'ElectroPro', href: '/tools/electropro', free: false },
  { phase: 'P4', name: 'PlumbPro',   href: '/tools/plumbpro',   free: false },
  { phase: 'P5', name: 'InteriorPro',href: '/tools/interiorpro',free: false },
]

export default function Navbar() {
  const [user, setUser]         = useState<User | null>(null)
  const [toolsOpen, setToolsOpen] = useState(false)
  const dropdownRef             = useRef<HTMLDivElement>(null)
  const router                  = useRouter()
  const supabase                = useMemo(() => createClient(), [])

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
      {/* Logo */}
      <Link href="/" className="flex flex-col leading-none flex-shrink-0">
        <span style={{ ...mono, color: '#F4F4F0', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-plex-serif)' }}>
          NirmanShastra
        </span>
        <span style={{ fontFamily: 'var(--font-plex-devanagari)', fontSize: 10, color: 'rgba(244,244,240,0.45)' }}>
          निर्माणशास्त्र
        </span>
      </Link>

      {/* Centre nav */}
      <div className="hidden md:flex items-center gap-6">
        {/* Tools dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setToolsOpen(o => !o)}
            style={{ ...mono, color: 'rgba(244,244,240,0.65)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}
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
              minWidth: 220,
              zIndex: 50,
            }}>
              {TOOLS.map((t, i) => (
                <Link
                  key={t.name}
                  href={t.href}
                  onClick={() => setToolsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    borderTop: i > 0 ? '1px solid rgba(244,244,240,0.06)' : undefined,
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ ...mono, fontSize: 12, color: '#F4F4F0' }}>{t.name}</span>
                  <span style={{
                    ...mono,
                    fontSize: 10,
                    padding: '2px 6px',
                    color: t.free ? '#14532D' : '#1F4E79',
                    border: `1px solid ${t.free ? '#14532D' : '#1F4E79'}`,
                    letterSpacing: '0.04em',
                  }}>
                    {t.free ? 'FREE' : '₹499'}
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

        <Link href="/#how-it-works" style={{ ...mono, color: 'rgba(244,244,240,0.65)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', textDecoration: 'none' }}>
          How It Works
        </Link>
        <Link href="/#pricing" style={{ ...mono, color: 'rgba(244,244,240,0.65)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', textDecoration: 'none' }}>
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
              style={{ ...mono, color: 'rgba(244,244,240,0.65)', fontSize: 11, textDecoration: 'none', letterSpacing: '0.04em' }}
              className="hidden sm:block"
            >
              Log In
            </Link>
            <Link
              href="/tools/vastu-pro"
              style={{ ...mono, background: '#8C3A22', color: '#F4F4F0', fontSize: 11, padding: '7px 14px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
