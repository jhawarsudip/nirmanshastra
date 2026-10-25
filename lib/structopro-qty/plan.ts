// Plan layout: a regular bay grid derived from the floor areas, nested floors, and the equivalent-load rules for slab-to-beam transfer.

export const SQFT_TO_M2 = 0.09290304
export const TARGET_SPAN = 3.75 // m. ASSUMPTION: typical residential bay (3.0 to 4.5 m is the usual range)
export const MAX_SPAN = 5.0 // m. beyond this a mid column is added

export interface Floor {
  k: number
  nx: number
  ny: number
  areaM2: number // what the user entered
  modelM2: number // area of the bays used
  scale: number // areaM2 / modelM2: applied to floor-level quantities
  zTop: number // level of top of slab above ground, m
}

export interface Plan {
  L: number
  W: number
  nx: number
  ny: number
  sx: number
  sy: number
  xs: number[]
  ys: number[]
  F: number
  hs: number
  plinth: number
  floors: Floor[]
}

export function buildPlan(areasM2: number[], aspect: number, hs = 3.0, plinth = 0.45): Plan {
  const F = areasM2.length
  const A0 = Math.max(...areasM2)
  const L = Math.sqrt(A0 * aspect)
  const W = A0 / L
  let nx = Math.max(1, Math.round(L / TARGET_SPAN))
  let ny = Math.max(1, Math.round(W / TARGET_SPAN))
  while (L / nx > MAX_SPAN) nx++
  while (W / ny > MAX_SPAN) ny++
  const sx = L / nx
  const sy = W / ny
  const xs = Array.from({ length: nx + 1 }, (_, i) => i * sx)
  const ys = Array.from({ length: ny + 1 }, (_, i) => i * sy)
  const bayM2 = sx * sy
  const floors: Floor[] = areasM2.map((a, k) => {
    const rho = a / A0
    let best = { a: nx, b: ny, score: Infinity }
    for (let i = 1; i <= nx; i++) {
      for (let j = 1; j <= ny; j++) {
        const score = Math.abs((i * j) / (nx * ny) - rho) + 0.01 * Math.abs(i / nx - j / ny)
        if (score < best.score - 1e-9) best = { a: i, b: j, score }
      }
    }
    const modelM2 = best.a * best.b * bayM2
    return { k, nx: best.a, ny: best.b, areaM2: a, modelM2, scale: a / modelM2, zTop: plinth + hs * (k + 1) }
  })
  return { L, W, nx, ny, sx, sy, xs, ys, F, hs, plinth, floors }
}

export const nodeExists = (f: Floor, ix: number, iy: number) => ix >= 0 && iy >= 0 && ix <= f.nx && iy <= f.ny

/** Equivalent uniform load (kN/m) on a beam of length `beamLen` from one adjacent two-way panel of load w (kN/m2) and other side `otherLen`.
 *  Short side: triangular, M-equivalent w lx/3, V-equivalent w lx/4. Long side: trapezoidal, M-equivalent (w lx/6)(3 - 1/a^2), V-equivalent (w lx/2)(1 - 1/(2a)). */
export function eqLoad(w: number, beamLen: number, otherLen: number): { m: number; v: number } {
  const lx = Math.min(beamLen, otherLen)
  const ly = Math.max(beamLen, otherLen)
  if (beamLen <= otherLen) return { m: (w * lx) / 3, v: (w * lx) / 4 }
  const a = ly / lx
  return { m: ((w * lx) / 6) * (3 - 1 / (a * a)), v: ((w * lx) / 2) * (1 - 1 / (2 * a)) }
}

/** IS 875 Part 2 cl 3.2.1 reduction of imposed load on columns by number of floors carried (including the roof). */
export function llReduction(floorsCarried: number): number {
  if (floorsCarried <= 1) return 0
  if (floorsCarried === 2) return 0.1
  if (floorsCarried === 3) return 0.2
  if (floorsCarried === 4) return 0.3
  return 0.4
}

/** IS 456 cl 22.5.1 shear coefficients for continuous beams: end support 0.4, first interior support 0.6 on the outer side and 0.55 on the inner side,
 *  all other supports 0.5. Used for the load take-down to columns (the sums are slightly above 1, which is the conservative direction). */
export function reactionShare(nSpans: number, i: number): { left: number; right: number } {
  if (nSpans === 1) return { left: 0.5, right: 0.5 }
  const left = i === 0 ? 0.4 : i === nSpans - 1 ? 0.6 : i === 1 ? 0.55 : 0.5
  const right = i === nSpans - 1 ? 0.4 : i === 0 ? 0.6 : i === nSpans - 2 ? 0.55 : 0.5
  return { left, right }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Balconies: where they sit and how thick the cantilever slab is. The loads and bars are in frame.ts and balcony.ts.

/** Longest balcony along the wall, m: one bay, never more than 3.6 m. ASSUMPTION (site practice). */
export const BALCONY_LEN_MAX = 3.6
/** IS 875 (Part 2):1987 Table 1: balconies, 3.0 kN/m2 (as the rooms they serve, not less than this). RECONSTRUCTED. */
export const BALCONY_LL = 3.0
/** IS 456 cl 23.2.1: basic span/effective-depth ratio of a cantilever is 7 (CLEAR); the modification factor is taken as in the slabs (1.2, ASSUMPTION). */
export const BALCONY_BASIC_LD = 7
export const BALCONY_MF = 1.2

/** Overall thickness of a cantilever slab of projection `lc` (m): effective depth from span/depth, plus 20 mm cover and half a bar, rounded up to 25 mm. */
/** The thickness rule of a cantilever slab: not under `tMinMm`, in steps of `stepMm`, with `allowMm` (cover 20 mm and half of a 10 mm bar) added to the effective depth. */
export const BALCONY_SLAB = { tMinMm: 125, stepMm: 25, allowMm: 25 } as const
export function balconyThicknessMm(lc: number): number {
  const dReq = (lc * 1000) / (BALCONY_BASIC_LD * BALCONY_MF)
  return Math.max(BALCONY_SLAB.tMinMm, Math.ceil((dReq + BALCONY_SLAB.allowMm) / BALCONY_SLAB.stepMm) * BALCONY_SLAB.stepMm)
}

export interface BalconySlot {
  /** slab level the balcony is cast with: it forms the floor of storey k + 1 */
  k: number
  /** bay index along x and grid line (iy = 0 front, iy = ny back): the supporting beam is the x-beam starting at node (ix, iy) at level k */
  ix: number
  iy: number
  side: 'front' | 'back'
  lenM: number
}

/**
 * Balconies per upper floor: spread over the bays of the floor above, front wall first and then the back wall. A balcony stands on the wall of the
 * floor it serves, so the bays come from that floor's footprint. The back wall is used only when the floor above has the same depth as the slab below.
 * Returns fewer slots than asked when the floor has fewer bays.
 */
export function balconySlots(plan: Plan, perFloor: number): BalconySlot[] {
  const out: BalconySlot[] = []
  if (perFloor <= 0) return out
  const lenM = Math.min(plan.sx, BALCONY_LEN_MAX)
  for (let k = 0; k < plan.F - 1; k++) {
    const f = plan.floors[k]
    const fu = plan.floors[k + 1]
    const backOk = fu.ny === f.ny
    const room = fu.nx * (backOk ? 2 : 1)
    const want = Math.min(perFloor, room)
    const nBack = backOk ? Math.floor(want / 2) : 0
    const nFront = want - nBack
    const spread = (n: number, iy: number, side: 'front' | 'back') => {
      for (let j = 0; j < n; j++) out.push({ k, ix: Math.min(fu.nx - 1, Math.floor(((j + 0.5) * fu.nx) / n)), iy, side, lenM })
    }
    spread(nFront, 0, 'front')
    spread(nBack, fu.ny, 'back')
  }
  return out
}
