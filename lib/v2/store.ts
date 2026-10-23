'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

/**
 * v2 client state lives on <html> data attributes (set before first paint by the inline
 * script in app/[locale]/layout.tsx), so CSS and JS read the same source of truth:
 *   data-ns-theme = "light" | "dark"      (work-lamp toggle)
 *   data-calm     = "1"                   (Calm toggle; also defaulted on by prefers-reduced-motion)
 */

const ATTRS = ['data-calm', 'data-ns-theme']

function subscribeAttrs(cb: () => void) {
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ATTRS })
  return () => mo.disconnect()
}

export function useCalm(): boolean {
  return useSyncExternalStore(
    subscribeAttrs,
    () => document.documentElement.getAttribute('data-calm') === '1',
    () => false,
  )
}

export function useTheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    subscribeAttrs,
    () => (document.documentElement.getAttribute('data-ns-theme') === 'dark' ? 'dark' : 'light'),
    () => 'light',
  )
}

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

/** true only when it is OK to run scroll-linked / looping JS motion */
export function useMotionOK(): boolean {
  const calm = useCalm()
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
  return !calm && !reduced
}

export function setCalm(on: boolean) {
  const d = document.documentElement
  if (on) d.setAttribute('data-calm', '1')
  else d.removeAttribute('data-calm')
  try { localStorage.setItem('ns2-calm', on ? '1' : '0') } catch { /* private mode */ }
}

type VTDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> }
}

/** Day/Night: circular View-Transition reveal from the switch (falls back to an instant swap). */
export function toggleTheme(origin?: { x: number; y: number }) {
  const d = document.documentElement
  const next = d.getAttribute('data-ns-theme') === 'dark' ? 'light' : 'dark'
  const apply = () => {
    d.setAttribute('data-ns-theme', next)
    try { localStorage.setItem('ns2-theme', next) } catch { /* private mode */ }
  }
  const doc = document as VTDoc
  const calm = d.getAttribute('data-calm') === '1'
  if (!doc.startViewTransition || calm) { apply(); return }
  const x = origin?.x ?? window.innerWidth / 2
  const y = origin?.y ?? 0
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const t = doc.startViewTransition(apply)
  t.ready.then(() => {
    d.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(.6,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
    )
  }).catch(() => { /* transition skipped */ })
}

/** Adds .is-in once an element enters the viewport. Returns a ref callback. */
export function useReveal<T extends HTMLElement>(opts?: { rootMargin?: string; once?: boolean }) {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { el.classList.add('is-in'); setSeen(true); return }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add('is-in')
            setSeen(true)
            if (opts?.once !== false) io.disconnect()
          }
        }
      },
      { rootMargin: opts?.rootMargin ?? '0px 0px -12% 0px', threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [opts?.rootMargin, opts?.once])
  return { ref, seen }
}

/** Animates a number toward a target (ease-out). Respects reduced motion by jumping. */
export function useTween(target: number, ms = 420): number {
  const ok = useMotionOK()
  const [v, setV] = useState(target)
  const from = useRef(target)
  const raf = useRef(0)
  const cur = useRef(target)
  useEffect(() => {
    cancelAnimationFrame(raf.current)
    if (!ok) { cur.current = target; setV(target); return }
    from.current = cur.current
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      cur.current = from.current + (target - from.current) * e
      setV(cur.current)
      if (k < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, ms, ok])
  return v
}
