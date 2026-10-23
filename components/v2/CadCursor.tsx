'use client'

import { useEffect, useRef } from 'react'

const MM_PER_PX = 25.4 / 96
const HOT = 'a, button, [role="button"], summary, label, select, input[type="range"]'
const SNAP = '.ns-btn, .ns-plate, [data-snap]'

/**
 * CAD cursor (desktop, fine pointer only): crosshair with live page X/Y in millimetres,
 * AutoCAD-style endpoint snap on plate corners, level-bubble pickbox over controls.
 * Off for touch, Calm and reduced motion.
 */
export default function CadCursor() {
  const root = useRef<HTMLDivElement>(null)
  const tag = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const d = document.documentElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let x = -10
    let y = -10

    const allowed = () => d.getAttribute('data-calm') !== '1' && !reduced.matches

    const frame = () => {
      raf = 0
      const el = root.current
      if (!el) return
      let px = x
      let py = y
      let mode = ''
      const t = document.elementFromPoint(x, y)
      if (t && t.closest(HOT)) mode = 'hot'
      const s = t ? (t.closest(SNAP) as HTMLElement | null) : null
      if (s) {
        const r = s.getBoundingClientRect()
        const pts: [number, number][] = [
          [r.left, r.top], [r.right, r.top], [r.left, r.bottom], [r.right, r.bottom],
          [r.left + r.width / 2, r.top], [r.left + r.width / 2, r.bottom],
        ]
        let best: [number, number] | null = null
        let bd = 16
        for (const p of pts) {
          const dd = Math.hypot(p[0] - x, p[1] - y)
          if (dd < bd) { bd = dd; best = p }
        }
        if (best) { px = best[0]; py = best[1]; mode = 'snap' }
      }
      el.style.setProperty('--cx', `${px}px`)
      el.style.setProperty('--cy', `${py}px`)
      el.dataset.mode = mode
      if (tag.current) {
        const X = ((px + window.scrollX) * MM_PER_PX).toFixed(1).padStart(7, '0')
        const Y = ((py + window.scrollY) * MM_PER_PX).toFixed(1).padStart(7, '0')
        tag.current.textContent = `X ${X}\nY ${Y}`
      }
    }

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !allowed()) return
      x = e.clientX
      y = e.clientY
      if (d.getAttribute('data-ns-cursor') !== 'on') d.setAttribute('data-ns-cursor', 'on')
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const leave = () => d.removeAttribute('data-ns-cursor')
    const sync = () => { if (!allowed()) leave() }

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    const mo = new MutationObserver(sync)
    mo.observe(d, { attributes: true, attributeFilter: ['data-calm'] })
    reduced.addEventListener('change', sync)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      mo.disconnect()
      reduced.removeEventListener('change', sync)
      cancelAnimationFrame(raf)
      leave()
    }
  }, [])

  return (
    <div className="ns-cad" ref={root} aria-hidden="true" data-mode="">
      <div className="ns-cad__h" />
      <div className="ns-cad__v" />
      <div className="ns-cad__pick" />
      <div className="ns-cad__tag" ref={tag}>{'X 0000.0\nY 0000.0'}</div>
    </div>
  )
}
