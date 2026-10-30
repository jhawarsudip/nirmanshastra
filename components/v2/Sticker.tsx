'use client'

import Image from 'next/image'
import { useRef } from 'react'

interface Props {
  src: string
  /** intrinsic size of the WebP */
  w: number
  h: number
  /** CSS width of the cut-out (any CSS length) */
  width: string
  rot?: number
  /** position inside a relatively positioned parent */
  pos: React.CSSProperties
  sizes?: string
  priority?: boolean
}

/**
 * A cut-out site tool you can pick up and drop anywhere. Decorative (aria-hidden): the page never depends on it.
 * Double-click puts it back. Drag is user-driven, so it stays available under reduced motion.
 */
export default function Sticker({ src, w, h, width, rot = 0, pos, sizes, priority }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const st = useRef({ x: 0, y: 0, sx: 0, sy: 0, ox: 0, oy: 0, lx: 0, drag: false })

  const paint = (tilt = 0) => {
    const s = st.current
    if (el.current) el.current.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${rot + tilt}deg)`
  }

  return (
    <div
      ref={el}
      className="ns-sticker"
      aria-hidden="true"
      data-snap
      style={{ ...pos, width, transform: `rotate(${rot}deg)` }}
      onPointerDown={e => {
        const s = st.current
        s.drag = true; s.sx = e.clientX; s.sy = e.clientY; s.ox = s.x; s.oy = s.y; s.lx = e.clientX
        e.currentTarget.setPointerCapture(e.pointerId)
        e.currentTarget.classList.add('is-held')
      }}
      onPointerMove={e => {
        const s = st.current
        if (!s.drag) return
        s.x = s.ox + (e.clientX - s.sx)
        s.y = s.oy + (e.clientY - s.sy)
        const tilt = Math.max(-8, Math.min(8, (e.clientX - s.lx) * 0.6))
        s.lx = e.clientX
        paint(tilt)
      }}
      onPointerUp={e => {
        st.current.drag = false
        e.currentTarget.classList.remove('is-held')
        paint(0)
      }}
      onPointerCancel={e => {
        st.current.drag = false
        e.currentTarget.classList.remove('is-held')
        paint(0)
      }}
      onDoubleClick={() => { st.current.x = 0; st.current.y = 0; paint(0) }}
    >
      <Image src={src} alt="" width={w} height={h} sizes={sizes ?? '(max-width: 700px) 40vw, 24vw'} priority={priority} draggable={false} />
    </div>
  )
}
