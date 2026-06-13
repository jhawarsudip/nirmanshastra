'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav
      className="w-full px-5 flex items-center justify-between"
      style={{
        background: '#1E2227',
        borderBottom: '1px solid rgba(201,168,76,0.18)',
        minHeight: 52,
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex flex-col leading-none">
        <span
          className="text-[15px] font-bold"
          style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-serif)' }}
        >
          NirmanShastra
        </span>
        <span
          className="text-[10px]"
          style={{ color: 'rgba(201,168,76,0.65)', fontFamily: 'var(--font-plex-devanagari)' }}
        >
          निर्माणशास्त्र
        </span>
      </Link>

      {/* Tool links */}
      <div className="hidden sm:flex items-center gap-6">
        <Link
          href="/tools/vastu-pro"
          className="text-[11px] uppercase tracking-widest hover:opacity-100 transition-opacity"
          style={{ color: 'rgba(201,168,76,0.55)', fontFamily: 'var(--font-plex-mono)' }}
        >
          VastuPro
        </Link>
      </div>

      {/* Auth */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span
              className="hidden sm:block text-[11px] truncate max-w-[180px]"
              style={{ color: 'rgba(201,168,76,0.65)', fontFamily: 'var(--font-plex-mono)' }}
            >
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-[6px] text-[11px] border transition-opacity hover:opacity-80"
              style={{
                borderColor: 'rgba(201,168,76,0.3)',
                color: '#F4F4F0',
                fontFamily: 'var(--font-plex-mono)',
              }}
            >
              Log Out
            </button>
          </>
        ) : (
          <Link
            href="/auth"
            className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold transition-opacity hover:opacity-90"
            style={{
              background: '#8C3A22',
              color: '#F4F4F0',
              fontFamily: 'var(--font-plex-mono)',
            }}
          >
            Log In
          </Link>
        )}
      </div>
    </nav>
  )
}
