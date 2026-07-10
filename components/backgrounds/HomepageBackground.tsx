'use client'

import { useEffect, useRef } from 'react'

export default function HomepageBackground() {
  const l1Ref = useRef<HTMLDivElement>(null)
  const l2Ref = useRef<HTMLDivElement>(null)
  const l3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        if (l1Ref.current) l1Ref.current.style.transform = `translateY(${y * 0.12}px)`
        if (l2Ref.current) l2Ref.current.style.transform = `translateY(${y * 0.07}px)`
        if (l3Ref.current) l3Ref.current.style.transform = `translateY(${y * 0.03}px)`
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Layer 1 (deepest): fine 20px blueprint grid */}
      <div
        ref={l1Ref}
        style={{
          position: 'absolute',
          top: '-30%',
          left: 0,
          right: 0,
          height: '160%',
          backgroundImage: [
            'linear-gradient(rgba(30,34,39,0.03) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(30,34,39,0.03) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '20px 20px',
        }}
      />

      {/* Layer 2 (mid): engineering dimension lines with tick marks */}
      <div
        ref={l2Ref}
        style={{
          position: 'absolute',
          top: '-30%',
          left: 0,
          right: 0,
          height: '160%',
        }}
      >
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          style={{ opacity: 0.05 }}
        >
          <defs>
            <pattern
              id="ns-hp-dim"
              x="0"
              y="0"
              width="320"
              height="180"
              patternUnits="userSpaceOnUse"
            >
              {/* Main horizontal dimension line */}
              <line x1="24" y1="90" x2="296" y2="90" stroke="#1E2227" strokeWidth="0.6" />
              {/* Left extension tick */}
              <line x1="24" y1="80" x2="24" y2="100" stroke="#1E2227" strokeWidth="0.6" />
              {/* Right extension tick */}
              <line x1="296" y1="80" x2="296" y2="100" stroke="#1E2227" strokeWidth="0.6" />
              {/* Left extension line going up */}
              <line x1="24" y1="65" x2="24" y2="80" stroke="#1E2227" strokeWidth="0.4" />
              {/* Right extension line going up */}
              <line x1="296" y1="65" x2="296" y2="80" stroke="#1E2227" strokeWidth="0.4" />
              {/* Mid-tick marks at intervals */}
              <line x1="80" y1="86" x2="80" y2="94" stroke="#1E2227" strokeWidth="0.4" />
              <line x1="160" y1="84" x2="160" y2="96" stroke="#1E2227" strokeWidth="0.5" />
              <line x1="240" y1="86" x2="240" y2="94" stroke="#1E2227" strokeWidth="0.4" />
              {/* Short horizontal cross-rule at a different height */}
              <line x1="60" y1="30" x2="200" y2="30" stroke="#1E2227" strokeWidth="0.4" />
              <line x1="60" y1="26" x2="60" y2="34" stroke="#1E2227" strokeWidth="0.4" />
              <line x1="200" y1="26" x2="200" y2="34" stroke="#1E2227" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ns-hp-dim)" />
        </svg>
      </div>

      {/* Layer 3 (shallowest): drafting-compass and T-square silhouettes */}
      <div
        ref={l3Ref}
        style={{
          position: 'absolute',
          top: '-30%',
          left: 0,
          right: 0,
          height: '160%',
        }}
      >
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          style={{ opacity: 0.04 }}
        >
          <defs>
            <pattern
              id="ns-hp-tools"
              x="0"
              y="0"
              width="280"
              height="280"
              patternUnits="userSpaceOnUse"
            >
              {/* Compass arc — partial circle */}
              <circle
                cx="140"
                cy="140"
                r="90"
                fill="none"
                stroke="#1E2227"
                strokeWidth="0.7"
                strokeDasharray="6 10"
              />
              {/* Inner compass arc */}
              <circle
                cx="140"
                cy="140"
                r="50"
                fill="none"
                stroke="#1E2227"
                strokeWidth="0.5"
                strokeDasharray="4 8"
              />
              {/* Compass centre point */}
              <circle cx="140" cy="140" r="2" fill="#1E2227" opacity="0.4" />
              {/* Compass arm 1 */}
              <line
                x1="140"
                y1="140"
                x2="209"
                y2="78"
                stroke="#1E2227"
                strokeWidth="0.6"
              />
              {/* Compass arm 2 */}
              <line
                x1="140"
                y1="140"
                x2="75"
                y2="82"
                stroke="#1E2227"
                strokeWidth="0.6"
              />
              {/* T-square vertical rule */}
              <line
                x1="60"
                y1="20"
                x2="60"
                y2="260"
                stroke="#1E2227"
                strokeWidth="0.7"
              />
              {/* T-square crossbar */}
              <line
                x1="30"
                y1="48"
                x2="90"
                y2="48"
                stroke="#1E2227"
                strokeWidth="0.9"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ns-hp-tools)" />
        </svg>
      </div>
    </div>
  )
}
