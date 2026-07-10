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
      {/* Layer 1 (deepest): fine 20px gold grid — low opacity for dark bg */}
      <div
        ref={l1Ref}
        style={{
          position: 'absolute',
          top: '-30%',
          left: 0,
          right: 0,
          height: '160%',
          backgroundImage: [
            'linear-gradient(rgba(212,175,55,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(212,175,55,0.025) 1px, transparent 1px)',
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
          style={{ opacity: 0.6 }}
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
              <line x1="24" y1="90" x2="296" y2="90" stroke="rgba(212,175,55,0.07)" strokeWidth="0.6" />
              <line x1="24" y1="80" x2="24" y2="100" stroke="rgba(212,175,55,0.07)" strokeWidth="0.6" />
              <line x1="296" y1="80" x2="296" y2="100" stroke="rgba(212,175,55,0.07)" strokeWidth="0.6" />
              <line x1="24" y1="65" x2="24" y2="80" stroke="rgba(212,175,55,0.05)" strokeWidth="0.4" />
              <line x1="296" y1="65" x2="296" y2="80" stroke="rgba(212,175,55,0.05)" strokeWidth="0.4" />
              <line x1="80" y1="86" x2="80" y2="94" stroke="rgba(212,175,55,0.05)" strokeWidth="0.4" />
              <line x1="160" y1="84" x2="160" y2="96" stroke="rgba(212,175,55,0.06)" strokeWidth="0.5" />
              <line x1="240" y1="86" x2="240" y2="94" stroke="rgba(212,175,55,0.05)" strokeWidth="0.4" />
              <line x1="60" y1="30" x2="200" y2="30" stroke="rgba(212,175,55,0.04)" strokeWidth="0.4" />
              <line x1="60" y1="26" x2="60" y2="34" stroke="rgba(212,175,55,0.04)" strokeWidth="0.4" />
              <line x1="200" y1="26" x2="200" y2="34" stroke="rgba(212,175,55,0.04)" strokeWidth="0.4" />
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
          style={{ opacity: 0.5 }}
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
              <circle cx="140" cy="140" r="90" fill="none" stroke="rgba(212,175,55,0.05)" strokeWidth="0.7" strokeDasharray="6 10" />
              <circle cx="140" cy="140" r="50" fill="none" stroke="rgba(212,175,55,0.04)" strokeWidth="0.5" strokeDasharray="4 8" />
              <circle cx="140" cy="140" r="2" fill="rgba(212,175,55,0.15)" />
              <line x1="140" y1="140" x2="209" y2="78" stroke="rgba(212,175,55,0.05)" strokeWidth="0.6" />
              <line x1="140" y1="140" x2="75" y2="82" stroke="rgba(212,175,55,0.05)" strokeWidth="0.6" />
              <line x1="60" y1="20" x2="60" y2="260" stroke="rgba(212,175,55,0.05)" strokeWidth="0.7" />
              <line x1="30" y1="48" x2="90" y2="48" stroke="rgba(212,175,55,0.06)" strokeWidth="0.9" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ns-hp-tools)" />
        </svg>
      </div>
    </div>
  )
}
