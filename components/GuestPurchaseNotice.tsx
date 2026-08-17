'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/**
 * GuestPurchaseNotice
 *
 * Shown inside the post-payment / report-ready area of every paid tool.
 * If the current Supabase session is anonymous (a "Continue as Guest" user),
 * it renders a prominent reminder that email is their ONLY durable record —
 * a guest cannot log back in later to retrieve the download.
 *
 * For a normal signed-up user (or when not signed in at all) it renders
 * nothing, so it is safe to drop into any results page unconditionally.
 */
export default function GuestPurchaseNotice() {
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setIsGuest(data.user?.is_anonymous === true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!isGuest) return null

  return (
    <div
      className="rounded-[2px] p-4 mt-3"
      style={{ border: '1px solid #D99A06', background: 'rgba(217,154,6,0.12)' }}
    >
      <p
        className="text-[10px] uppercase tracking-widest mb-1.5"
        style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}
      >
        ⚠ GUEST PURCHASE — SAVE YOUR REPORT
      </p>
      <p
        className="text-[13px]"
        style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', lineHeight: 1.6 }}
      >
        Save this download link or check your email now — as a guest you won&apos;t be
        able to log back in to retrieve it later. To keep permanent access to this and
        all future reports, secure your account from{' '}
        <Link href="/account" style={{ color: '#1F4E79', textDecoration: 'underline' }}>
          Account settings
        </Link>
        .
      </p>
    </div>
  )
}
