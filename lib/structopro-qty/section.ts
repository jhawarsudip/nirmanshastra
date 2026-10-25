// Reinforced-concrete column section capacity: strain compatibility (IS 456 cl 38.1 and Annex G stress-strain curves),
// uniaxial capacity at a given axial load, biaxial check (IS 456 cl 39.6), bar layouts and tie support rules.
// Steel is elastic-plastic to 0.87 fy (the IS 456 Fe500 curve has a short inelastic branch; the difference is under 3 %: ASSUMPTION).

import { ES, FY, barArea } from './codes'

const FYD = 0.87 * FY
const STRIPS = 48

export interface BarPos {
  x: number // mm from the left face
  y: number // mm from the top face
  area: number
}

/** IS 456 Fig 21 design stress-strain curve of concrete, compression positive. */
function sigmaC(e: number, fck: number): number {
  if (e <= 0) return 0
  const f = 0.446 * fck
  if (e >= 0.002) return f
  const r = e / 0.002
  return f * (2 * r - r * r)
}

function sigmaS(e: number): number {
  const s = ES * e
  return Math.max(-FYD, Math.min(FYD, s))
}

/** Axial force (N) and moment about the section centroid (N.mm) for a neutral-axis depth xu measured from the compression face. */
function section(depth: number, width: number, bars: { y: number; area: number }[], xu: number, fck: number): { P: number; M: number } {
  const strain = (y: number): number => {
    if (xu <= depth) return (0.0035 * (xu - y)) / xu
    return (0.002 * (xu - y)) / (xu - (3 * depth) / 7)
  }
  let P = 0
  let M = 0
  const yMax = Math.min(xu, depth)
  const dy = yMax / STRIPS
  for (let i = 0; i < STRIPS; i++) {
    const y = (i + 0.5) * dy
    const s = sigmaC(strain(y), fck)
    const f = s * width * dy
    P += f
    M += f * (depth / 2 - y)
  }
  for (const bar of bars) {
    const e = strain(bar.y)
    let s = sigmaS(e)
    if (e > 0) s -= sigmaC(e, fck) // concrete displaced by the bar
    const f = s * bar.area
    P += f
    M += f * (depth / 2 - bar.y)
  }
  return { P, M }
}

/** Moment capacity (N.mm) about the axis parallel to `width`, at axial load Pu (N, compression positive). 0 if Pu is beyond the section. */
export function uniaxialCapacity(depth: number, width: number, bars: { y: number; area: number }[], Pu: number, fck: number): number {
  let lo = 0.02 * depth
  let hi = 60 * depth
  if (section(depth, width, bars, hi, fck).P < Pu) return 0
  if (section(depth, width, bars, lo, fck).P > Pu) {
    return section(depth, width, bars, lo, fck).M
  }
  for (let i = 0; i < 40; i++) {
    const mid = 0.5 * (lo + hi)
    if (section(depth, width, bars, mid, fck).P < Pu) lo = mid
    else hi = mid
  }
  const r = section(depth, width, bars, 0.5 * (lo + hi), fck)
  return Math.max(0, r.M)
}

/** IS 456 cl 39.6: (Mux/Mux1)^a + (Muy/Muy1)^a <= 1, a from 1.0 (Pu/Puz <= 0.2) to 2.0 (>= 0.8). Returns the left-hand side. */
export function biaxialRatio(
  b: number,
  D: number,
  bars: BarPos[],
  fck: number,
  Pu: number,
  Mux: number, // about the axis parallel to b (resisted over depth D)
  Muy: number // about the axis parallel to D (resisted over width b)
): number {
  const Asc = bars.reduce((s, x) => s + x.area, 0)
  const Ac = b * D - Asc
  const Puz = 0.45 * fck * Ac + 0.75 * FY * Asc
  if (Pu >= Puz) return 9
  const r = Pu / Puz
  const alpha = r <= 0.2 ? 1 : r >= 0.8 ? 2 : 1 + (r - 0.2) / 0.6
  const mx1 = uniaxialCapacity(D, b, bars.map((x) => ({ y: x.y, area: x.area })), Pu, fck)
  const my1 = uniaxialCapacity(b, D, bars.map((x) => ({ y: x.x, area: x.area })), Pu, fck)
  const ax = Mux <= 0 ? 0 : mx1 <= 0 ? 9 : Math.pow(Mux / mx1, alpha)
  const ay = Muy <= 0 ? 0 : my1 <= 0 ? 9 : Math.pow(Muy / my1, alpha)
  return ax + ay
}

export interface BarConfig {
  phi: number
  n: number
  nb: number // bars on each face parallel to b (including corners)
  nd: number // bars on each face parallel to D (including corners)
  ast: number
  positions: BarPos[]
  /** cross-ties needed in each direction (see tieSupport) */
  crossB: number
  crossD: number
}

/** Bars spread round the perimeter of a b x D section. `c` is the distance from the face to the bar centre. */
export function perimeterPositions(b: number, D: number, nb: number, nd: number, c: number, area: number): BarPos[] {
  const out: BarPos[] = []
  const w = b - 2 * c
  const h = D - 2 * c
  for (let i = 0; i < nb; i++) {
    const x = c + (w * i) / (nb - 1)
    out.push({ x, y: c, area })
    out.push({ x, y: c + h, area })
  }
  for (let j = 1; j < nd - 1; j++) {
    const y = c + (h * j) / (nd - 1)
    out.push({ x: c, y, area })
    out.push({ x: c + w, y, area })
  }
  return out
}

/** IS 456 cl 26.5.3.2(c)(1): corner bars are tied; any other bar must be within 75 mm (clear) of a tied bar, else it needs a cross tie.
 *  Returns the number of cross ties needed along one face with n bars at centre spacing s (mm). Greedy cover. */
export function crossTiesForFace(n: number, s: number, phi: number): number {
  if (n <= 2) return 0
  const k = Math.floor((75 + phi) / s) // bars within reach on each side of a tied bar
  let cur = 0
  let ties = 0
  for (let guard = 0; guard < 64; guard++) {
    const u = cur + k + 1 // first bar not covered by the current tied bar
    if (u >= n - 1 - k) break // the far corner bar covers the rest
    const t = Math.min(u + k, n - 2)
    ties++
    cur = t
  }
  return ties
}

const PHIS = [12, 16, 20, 25]
const COUNTS = [4, 6, 8, 10, 12, 14, 16, 18, 20, 24]

/** Candidate bar arrangements for a b x D column, ascending in steel area, between 0.8 % and 4 % (IS 456 cl 26.5.3.1). */
export function barConfigs(b: number, D: number, tiePhi: number): BarConfig[] {
  const res: BarConfig[] = []
  for (const phi of PHIS) {
    const c = 40 + tiePhi + phi / 2
    for (const n of COUNTS) {
      // choose (nb, nd) with 2nb + 2nd - 4 = n and the most even spacing
      let best: { nb: number; nd: number; score: number } | null = null
      for (let nb = 2; nb <= n / 2; nb++) {
        const nd = (n + 4) / 2 - nb
        if (nd < 2 || !Number.isInteger(nd)) continue
        const sb = nb > 1 ? (b - 2 * c) / (nb - 1) : 1e9
        const sd = nd > 1 ? (D - 2 * c) / (nd - 1) : 1e9
        const score = Math.max(sb, sd) + Math.abs(sb - sd) * 0.25
        if (!best || score < best.score) best = { nb, nd, score }
      }
      if (!best) continue
      const { nb, nd } = best
      const sb = (b - 2 * c) / (nb - 1)
      const sd = (D - 2 * c) / (nd - 1)
      if (sb > 300 || sd > 300) continue // IS 456 cl 26.5.3.1(h): spacing not more than 300 mm
      if (sb - phi < Math.max(phi, 25) || sd - phi < Math.max(phi, 25)) continue // clear spacing, cl 26.3.3
      const ast = n * barArea(phi)
      const pct = (100 * ast) / (b * D)
      if (pct < 0.8 || pct > 4.0) continue
      res.push({
        phi,
        n,
        nb,
        nd,
        ast,
        positions: perimeterPositions(b, D, nb, nd, c, barArea(phi)),
        crossB: crossTiesForFace(nb, sb, phi),
        crossD: crossTiesForFace(nd, sd, phi),
      })
    }
  }
  res.sort((p, q) => p.ast - q.ast || p.phi - q.phi)
  return res
}
