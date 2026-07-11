'use client'

import { usePathname, useRouter } from 'next/navigation'

interface Props {
  className?: string
}

export function LanguageToggle({ className }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const isHi = pathname === '/hi'
  const isHome = pathname === '/' || isHi

  // Only show on the homepage — tool pages have no locale routing
  if (!isHome) return null

  function switchLocale(next: 'en' | 'hi') {
    if (next === 'hi' && !isHi) router.push('/hi')
    if (next === 'en' && isHi) router.push('/')
  }

  const base: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.03em',
    padding: '5px 12px',
    borderRadius: 0,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    transition: 'color 0.15s ease, background 0.15s ease',
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 2,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => switchLocale('en')}
        aria-pressed={!isHi}
        aria-label="Switch to English"
        style={{
          ...base,
          color: !isHi ? '#000000' : 'rgba(255,255,255,0.55)',
          background: !isHi ? '#C5A059' : 'transparent',
          borderRight: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('hi')}
        aria-pressed={isHi}
        aria-label="हिंदी में स्विच करें"
        style={{
          ...base,
          color: isHi ? '#000000' : 'rgba(255,255,255,0.55)',
          background: isHi ? '#C5A059' : 'transparent',
        }}
      >
        हिंदी
      </button>
    </div>
  )
}
