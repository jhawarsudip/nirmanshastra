'use client'

import { useEffect, useRef } from 'react'
import { useMotionOK } from '@/lib/v2/store'
import '@/styles/v2/pour.css'

/*
  A poured edge. Instead of two sections meeting along a ruler-straight line, the upper one spills over the lower one:
  an uneven lip with sagging lobes and runs that have gathered at the low points and slowly crept down. It is the last
  child of the section that does the pouring (the header gets its own, kind="lip").

  Each join has its own shape (pour-1 ... pour-12 in public/v2/texture, made by scripts/brand/build-pour-edges.py), so
  no two joins look alike. A tile is both the mask (its alpha) and the lighting (its grey, laid over the material with
  hard-light), so the same file is wet concrete at night, white putty by day and sand render in between. The material
  itself (tone) matches the section it belongs to; see pour.css.

  Edges load when they are about two screens away. One that is still below the fold starts low and thin and pours out to
  its full length as it comes into view; after that it creeps a little, very slowly. Reduced motion gets the
  finished edge, still.
*/

export type PourProps = {
  /** the material: the page colour (bg), the sand band (alt), the dark concrete (stage) or the header */
  tone: 'bg' | 'alt' | 'stage' | 'header'
  /** which shape: 1 to 12 for the joins, 1 for the lip under the header */
  v: number
  kind?: 'seam' | 'lip'
}

const NEAR = 1600 // px below the fold at which an edge starts loading
type St = { motion: boolean; near: boolean; pre: boolean }
const watched = new Map<HTMLElement, St>()
let listening = false
let queued = false

function check() {
  queued = false
  const vh = window.innerHeight
  for (const [el, st] of watched) {
    const top = el.getBoundingClientRect().top
    if (!st.near && top < vh + NEAR) {
      st.near = true
      el.classList.add('is-near')
      if (st.motion && top > vh * 0.92) {
        st.pre = true
        el.classList.add('is-pre')
      }
    }
    if (st.pre && top < vh * 0.92) {
      st.pre = false
      el.classList.remove('is-pre')
    }
    if (st.near && !st.pre) watched.delete(el)
  }
  if (watched.size === 0) stop()
}
function onMove() {
  if (queued) return
  queued = true
  requestAnimationFrame(check)
}
function start() {
  if (listening) return
  listening = true
  window.addEventListener('scroll', onMove, { passive: true })
  window.addEventListener('resize', onMove, { passive: true })
}
function stop() {
  if (!listening) return
  listening = false
  window.removeEventListener('scroll', onMove)
  window.removeEventListener('resize', onMove)
}

export default function Pour({ tone, v, kind = 'seam' }: PourProps) {
  const ref = useRef<HTMLDivElement>(null)
  const motion = useMotionOK()
  const file = `${kind === 'lip' ? 'lip' : 'pour'}-${v}`

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (kind === 'lip') {
      el.classList.add('is-near')
      return
    }
    // An observer would only notice an edge that crosses the screen; a jump (anchor link, restored scroll position)
    // takes it from below to above without crossing, so this is a plain scroll check: anything on screen or above it
    // is shown whole.
    const st: St = { motion, near: false, pre: false }
    watched.set(el, st)
    start()
    onMove()
    return () => {
      watched.delete(el)
      el.classList.remove('is-pre')
      if (watched.size === 0) stop()
    }
  }, [motion, kind])

  // Every edge starts at a different place in its tile and creeps at its own pace.
  const ox = -((v * 337 + 211) % 1500)
  const oz = 12 + ((v * 3) % 7)
  const od = -((v * 2.3) % 9)

  return (
    <div
      ref={ref}
      className={`ns-pour${kind === 'lip' ? ' ns-pour--lip' : ''}`}
      data-tone={tone}
      aria-hidden="true"
      style={{
        ['--mm' as string]: `url(/v2/texture/${file}.webp)`,
        ['--ox' as string]: `${ox}px`,
        ['--oz' as string]: `${oz}s`,
        ['--od' as string]: `${od}s`,
      }}
    >
      <i className="ns-pour__s" />
      <i className="ns-pour__m" />
    </div>
  )
}
