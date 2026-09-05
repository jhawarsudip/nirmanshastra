'use client'

import { useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Hero background: a building elevation that DRAFTS ITSELF as the user scrolls
// through the hero. Same proven mechanism as before — stroke-dasharray /
// stroke-dashoffset draw-in, scroll-linked, un-draws on scroll up — but the
// abstract grid is replaced by a real architectural elevation that assembles
// itself in 6 distinct stages:
//
//   0 · SITE & FOUNDATION  ground line, footing pads, pedestals, plinth beam
//   1 · COLUMNS RISING     five RCC columns from plinth to roof
//   2 · FLOOR SLABS        first- and second-floor beams/slabs
//   3 · WALLS FILLING IN   masonry infill panels, storey by storey
//   4 · OPENINGS           windows with mullions + the main door
//   5 · ROOF COMPLETION    roof slab, parapet, water tank, stair mumty, level
//                          dimension line with arrowheads
//
// Gold accent #C5A059 (current site palette). Identical full sequence at every
// viewport width — the SVG simply scales; no stage-count reduction on mobile.
// prefers-reduced-motion → the whole building is shown fully drawn, statically.
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = '#C5A059'

// Coordinate space (1440 × 900). All levels measured from the top.
const L = 650
const R = 1290
const COLS = [650, 810, 970, 1130, 1290] // five columns, four bays
const ROOF = 330
const F2 = 460
const F1 = 590
const PLINTH = 720
const GROUND = 780
const NUM_STAGES = 6

const rect = (x: number, y: number, w: number, h: number) =>
  `M${x},${y} H${x + w} V${y + h} H${x} Z`
const line = (x1: number, y1: number, x2: number, y2: number) =>
  `M${x1},${y1} L${x2},${y2}`

type Seg = { d: string; w: number; stage: number }

function buildPaths(): Seg[] {
  const segs: Seg[] = []
  const add = (stage: number, w: number, d: string) => segs.push({ stage, w, d })

  // ── STAGE 0 — SITE & FOUNDATION ────────────────────────────────────────────
  add(0, 1.2, line(360, GROUND, 1380, GROUND)) // ground / datum line
  COLS.forEach((x) => {
    // stepped footing pad below ground
    add(0, 1.1, `M${x - 46},${GROUND} L${x - 32},${GROUND + 44} L${x + 32},${GROUND + 44} L${x + 46},${GROUND}`)
    // pedestal from plinth down into the footing
    add(0, 1.0, rect(x - 14, PLINTH, 28, GROUND + 44 - PLINTH))
  })
  add(0, 1.3, rect(L - 8, PLINTH - 11, R - L + 16, 22)) // plinth beam

  // ── STAGE 1 — COLUMNS RISING ───────────────────────────────────────────────
  COLS.forEach((x) => add(1, 1.5, rect(x - 12, ROOF, 24, PLINTH - ROOF)))

  // ── STAGE 2 — FLOOR SLABS / BEAMS ──────────────────────────────────────────
  ;[F1, F2].forEach((y) => add(2, 1.3, rect(L - 8, y - 9, R - L + 16, 18)))

  // ── STAGE 3 — WALLS FILLING IN ─────────────────────────────────────────────
  const STOREYS: [number, number][] = [
    [ROOF, F2],
    [F2, F1],
    [F1, PLINTH],
  ]
  STOREYS.forEach(([t, b]) => {
    for (let i = 0; i < COLS.length - 1; i++) {
      const x1 = COLS[i] + 14
      const x2 = COLS[i + 1] - 14
      add(3, 0.7, rect(x1, t + 13, x2 - x1, b - 13 - (t + 13)))
    }
  })

  // ── STAGE 4 — OPENINGS (windows + main door) ───────────────────────────────
  STOREYS.forEach(([t, b], si) => {
    for (let i = 0; i < COLS.length - 1; i++) {
      const cx = (COLS[i] + COLS[i + 1]) / 2
      // main door: ground storey, central bay
      if (si === 2 && i === 2) {
        add(4, 0.7, rect(cx - 36, b - 124, 72, 124)) // door frame (b = PLINTH)
        add(4, 0.6, line(cx, b - 124, cx, b)) // centre stile
        add(4, 0.6, `M${cx + 22},${b - 64} a4,4 0 1,0 0.1,0`) // handle
        continue
      }
      const cy = (t + b) / 2
      add(4, 0.6, rect(cx - 38, cy - 44, 76, 88)) // window frame
      add(4, 0.6, `M${cx},${cy - 44} L${cx},${cy + 44} M${cx - 38},${cy} L${cx + 38},${cy}`) // mullions
    }
  })

  // ── STAGE 5 — ROOF / SLAB COMPLETION ───────────────────────────────────────
  add(5, 1.3, rect(L - 26, ROOF - 16, R - L + 52, 16)) // overhanging roof slab
  add(5, 1.0, rect(L - 26, ROOF - 40, R - L + 52, 24)) // parapet railing band
  add(5, 0.9, rect(1150, ROOF - 96, 96, 44)) // water tank
  add(5, 0.8, `M1158,${ROOF - 52} L1158,${ROOF - 16} M1180,${ROOF - 48} L1180,${ROOF - 16} M1216,${ROOF - 48} L1216,${ROOF - 16} M1238,${ROOF - 52} L1238,${ROOF - 16}`) // tank legs
  add(5, 0.9, rect(700, ROOF - 84, 120, 68)) // stair mumty
  // level dimension line, drafting-style
  add(5, 0.6, line(596, ROOF, 596, GROUND))
  add(5, 0.6, `M591,${ROOF + 11} L596,${ROOF} L601,${ROOF + 11}`) // top arrowhead
  add(5, 0.6, `M591,${GROUND - 11} L596,${GROUND} L601,${GROUND - 11}`) // bottom arrowhead
  add(5, 0.6, `M596,${ROOF} L640,${ROOF} M596,${F2} L640,${F2} M596,${F1} L640,${F1} M596,${PLINTH} L640,${PLINTH} M596,${GROUND} L640,${GROUND}`) // level ticks

  return segs
}

const PATHS = buildPaths()

export default function HeroSVGBackground() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path'))
    const lengths = paths.map((p) => p.getTotalLength())

    // Per-path timing: each path draws inside its stage's slice of scroll
    // progress, with a small stagger within the stage so the sequence reads
    // as distinct construction phases rather than one uniform sweep.
    const stages = paths.map((p) => Number(p.dataset.stage ?? 0))
    const perStage = 1 / NUM_STAGES
    const counts: Record<number, number> = {}
    stages.forEach((s) => (counts[s] = (counts[s] || 0) + 1))
    const seen: Record<number, number> = {}
    const meta = stages.map((s) => {
      const k = (seen[s] = (seen[s] ?? -1) + 1)
      return {
        start: (s + (k / counts[s]) * 0.55) * perStage,
        dur: perStage * 0.7,
      }
    })

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    paths.forEach((p, i) => {
      p.style.strokeDasharray = String(lengths[i])
    })

    if (prefersReduced) {
      // Fully-drawn final state, static — no scroll animation.
      paths.forEach((p) => {
        p.style.strokeDashoffset = '0'
      })
      return
    }

    // Start fully undrawn.
    paths.forEach((p, i) => {
      p.style.strokeDashoffset = String(lengths[i])
    })

    const hero = document.getElementById('hero-root')
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
    let raf = 0

    const update = () => {
      const heroH = hero?.offsetHeight ?? window.innerHeight
      const progress = Math.min(1, Math.max(0, window.scrollY / (heroH * 0.82)))

      paths.forEach((p, i) => {
        const { start, dur } = meta[i]
        const local = Math.min(1, Math.max(0, (progress - start) / dur))
        p.style.strokeDashoffset = String(lengths[i] * (1 - ease(local)))
      })
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.18,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <g stroke={GOLD} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {PATHS.map((p, i) => (
          <path key={i} d={p.d} strokeWidth={p.w} data-stage={p.stage} />
        ))}
      </g>
    </svg>
  )
}
