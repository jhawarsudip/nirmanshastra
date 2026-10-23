'use client'

import { useEffect, useRef } from 'react'
import { useMotionOK } from '@/lib/v2/store'

/** Level-staff scroll progress down the right edge (desktop) + a thin top bar (mobile). */
export default function Staff() {
  const rod = useRef<HTMLDivElement>(null)
  const bob = useRef<HTMLDivElement>(null)
  const read = useRef<HTMLSpanElement>(null)
  const top = useRef<HTMLDivElement>(null)
  const ok = useMotionOK()

  useEffect(() => {
    let raf = 0
    const paint = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      const h = rod.current?.clientHeight ?? 0
      bob.current?.style.setProperty('--staff-y', `${(p * h).toFixed(1)}px`)
      if (read.current) read.current.textContent = `${(p * 4).toFixed(3)} m`
      top.current?.style.setProperty('--p', p.toFixed(4))
    }
    let idle = 0
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint)
      rod.current?.parentElement?.classList.add('is-active')
      window.clearTimeout(idle)
      idle = window.setTimeout(() => rod.current?.parentElement?.classList.remove('is-active'), 1100)
    }
    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
      window.clearTimeout(idle)
    }
  }, [ok])

  return (
    <>
      <div className="ns-progress-top" ref={top} aria-hidden="true" />
      <div className="ns-staff" aria-hidden="true">
        <div className="ns-staff__rod" ref={rod} />
        <div className="ns-staff__bob" ref={bob}>
          <span className="ns-staff__read" ref={read}>0.000 m</span>
        </div>
      </div>
    </>
  )
}
