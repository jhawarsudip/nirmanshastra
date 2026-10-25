// Column sizing, longitudinal steel and tie schedule.
// Sizes are searched from the smallest permitted section upward until every load case passes the IS 456 biaxial check.

import { barArea, lapLength, stirrupCutLength } from './codes'
import { BarConfig, barConfigs, biaxialRatio } from './section'
import { SteelBook } from './steel'

export interface ColumnCase {
  Pu: number // N, compression positive
  Mx: number // N.mm about the x axis (bending over the y depth)
  My: number // N.mm about the y axis (bending over the x width)
}

export interface ColumnInput {
  minSide: number // mm: the smaller side may not go below this
  fck: number
  cases: ColumnCase[]
  /** unsupported length, mm, for the minimum-eccentricity rule */
  unsupported: number
  /** the section may not be smaller than this in either side (e.g. the storey above) */
  atLeast?: { b: number; D: number }
  /** use exactly this section if it can be made to work (constant column size over several storeys) */
  fixed?: { b: number; D: number }
}

export interface ColumnDesign {
  b: number // mm along x
  D: number // mm along y
  cfg: BarConfig
  asPercent: number
  tiePhi: number
}

/** The catalogue of column sections the search goes through, ascending in area (mm x mm). */
export const SIZES: [number, number][] = (() => {
  const sq = [230, 250, 275, 300, 325, 350, 375, 400, 450, 500, 550, 600, 650, 700]
  const rc: [number, number][] = [
    [230, 300],
    [230, 350],
    [230, 400],
    [230, 450],
    [230, 500],
    [230, 600],
    [300, 350],
    [300, 400],
    [300, 450],
    [300, 500],
    [300, 600],
    [350, 450],
    [350, 500],
    [400, 500],
    [400, 600],
  ]
  const out: [number, number][] = []
  for (const s of sq) out.push([s, s])
  for (const [a, c] of rc) {
    out.push([a, c])
    out.push([c, a])
  }
  out.sort((p, q) => p[0] * p[1] - q[0] * q[1] || Math.abs(p[0] - p[1]) - Math.abs(q[0] - q[1]))
  return out
})()

/** The tie diameter assumed when the bars are placed in the section (mm), whatever tie is finally used. */
export const COLUMN_COVER_TIE_PHI = 8

const cfgCache = new Map<string, BarConfig[]>()
function configsFor(b: number, D: number): BarConfig[] {
  const key = `${b}x${D}`
  let c = cfgCache.get(key)
  if (!c) {
    c = barConfigs(b, D, COLUMN_COVER_TIE_PHI)
    cfgCache.set(key, c)
  }
  return c
}

/** Minimum eccentricity about one axis, IS 456 cl 25.4: the larger of unsupported length / 500 + side / 30 and 20 mm (all in mm). */
export const eMin = (unsupported: number, side: number): number => Math.max(unsupported / 500 + side / 30, 20)

/** The IS 456 cl 39.6 interaction ratio of one load case, with the minimum eccentricity applied about each axis. A section passes when it is 1 or less. */
export function caseRatio(b: number, D: number, cfg: BarConfig, fck: number, k: ColumnCase, unsupported: number): number {
  const exY = eMin(unsupported, D)
  const exX = eMin(unsupported, b)
  const Mx = Math.max(Math.abs(k.Mx), k.Pu * exY)
  const My = Math.max(Math.abs(k.My), k.Pu * exX)
  return biaxialRatio(b, D, cfg.positions, fck, k.Pu, Mx, My)
}

function passes(b: number, D: number, cfg: BarConfig, fck: number, cases: ColumnCase[], unsupported: number): boolean {
  for (const k of cases) {
    // minimum eccentricity, IS 456 cl 25.4: max(l/500 + D/30, 20 mm), applied about each axis
    if (caseRatio(b, D, cfg, fck, k, unsupported) > 1) return false
  }
  return true
}

/** Relative unit costs used only to choose between equally valid sections (concrete Rs/m3, formwork Rs/m2, steel Rs/kg). Not shown to the user. */
const C_CONC = 7000
const C_FORM = 600
const C_STEEL = 70

/** Practical limits on the number of bars of each diameter in a column (site practice: few, larger bars; clear spacing for compaction). */
export const MAX_BARS: Record<number, number> = { 12: 8, 16: 12, 20: 16, 25: 20 }

function tryColumn(inp: ColumnInput, accept: (b: number, D: number) => boolean): ColumnDesign | null {
  const worst = inp.cases.reduce((m, c) => Math.max(m, c.Pu), 0)
  let best: { des: ColumnDesign; cost: number } | null = null
  for (const [b, D] of SIZES) {
    if (!accept(b, D)) continue
    if (best && (b * D) / 1e6 * C_CONC > best.cost) break // sizes are ascending in area: concrete alone already costs more
    // quick axial filter: IS 456 cl 39.3 with the highest allowed steel
    if (worst > 0.4 * inp.fck * b * D * 0.96 + 0.67 * 500 * 0.04 * b * D) continue
    const list = configsFor(b, D).filter((c) => c.n <= (MAX_BARS[c.phi] ?? 8))
    if (!list.length) continue
    // smallest passing configuration: binary search over steel area (capacity grows with steel)
    if (!passes(b, D, list[list.length - 1], inp.fck, inp.cases, inp.unsupported)) continue
    let lo = 0
    let hi = list.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (passes(b, D, list[mid], inp.fck, inp.cases, inp.unsupported)) hi = mid
      else lo = mid + 1
    }
    const cfg = list[lo]
    const perM = (b * D) / 1e6 * C_CONC + (2 * (b + D)) / 1000 * C_FORM + (cfg.ast / 1e6) * 7850 * C_STEEL
    if (!best || perM < best.cost) best = { des: { b, D, cfg, asPercent: (100 * cfg.ast) / (b * D), tiePhi: cfg.phi >= 25 ? 10 : 8 }, cost: perM }
  }
  return best ? best.des : null
}

export function chooseColumn(inp: ColumnInput): ColumnDesign {
  const f = inp.fixed
  if (f) {
    const r = tryColumn(inp, (b, D) => b === f.b && D === f.D)
    if (r) return r
  }
  const lower = f ?? inp.atLeast
  const r = tryColumn(inp, (b, D) => Math.min(b, D) >= inp.minSide && (!lower || (b >= lower.b && D >= lower.D)))
  if (r) return r
  // nothing passed: the largest section with the heaviest steel (the caller flags it through asPercent)
  const [b, D] = SIZES[SIZES.length - 1]
  const list = configsFor(b, D)
  const cfg = list[list.length - 1]
  return { b, D, cfg, asPercent: (100 * cfg.ast) / (b * D), tiePhi: 10 }
}

export interface TieRules {
  seismic: boolean
  clearHeight: number // mm, column clear height between beam soffits... (storey height less beam depth)
  beamDepth: number // mm
  /** confining spacing over the whole height (columns of an open first storey: IS 13920 asks for special confining reinforcement over the full height) */
  fullHeight?: boolean
}

/**
 * Tie diameter. Ordinary detailing (Zone II): IS 456 cl 26.5.3.2(c)(2) asks for not less than a quarter of the largest bar and never under 6 mm,
 * so 6 mm ties serve up to 24 mm bars (6 mm comes as a coil, cut and bent on site). Ductile detailing keeps 8 mm at least (IS 13920:2016).
 */
export const tieDiameter = (mainPhi: number, seismic: boolean, designed: number): number => (seismic ? designed : mainPhi <= 24 ? 6 : designed)

/** The tie layout of one storey of a column: spacing rules and counts. `addColumnSteel` uses exactly these numbers. */
export interface TieLayout {
  tiePhi: number
  minDim: number
  maxDim: number
  /** IS 456 cl 26.5.3.2 pitch: least of the smaller side, 16 x main bar, 48 x tie, 300 mm */
  s456: number
  Lc: number
  seismic: boolean
  fullHeight: boolean
  /** ductile detailing only: confinement length at each end, close spacing, spacing outside, counts */
  lo?: number
  sConf?: number
  sOut?: number
  nConf?: number
  nOut?: number
  /** ordinary detailing: the pitch, rounded down to 25 mm */
  sOrd?: number
  nTies: number
  spacing: string
}

export function tieLayout(des: ColumnDesign, rules: TieRules): TieLayout {
  const { b, D, cfg } = des
  const tiePhi = tieDiameter(cfg.phi, rules.seismic, des.tiePhi)
  const minDim = Math.min(b, D)
  const maxDim = Math.max(b, D)
  const s456 = Math.min(minDim, 16 * cfg.phi, 48 * tiePhi, 300) // IS 456 cl 26.5.3.2
  const floor25 = (v: number) => Math.max(75, Math.floor(v / 25) * 25)
  const Lc = rules.clearHeight
  if (rules.seismic) {
    const lo = Math.max(maxDim, Lc / 6, 450) // IS 13920 cl 7.4.1
    const sConf = Math.min(100, Math.max(75, Math.floor(minDim / 4 / 5) * 5))
    const sOut = floor25(Math.min(minDim / 2, s456))
    const nConf = 2 * Math.ceil(lo / sConf)
    const nOut = Math.max(0, Math.ceil((Lc - 2 * lo) / sOut) - 1)
    if (rules.fullHeight) {
      const nTies = Math.ceil(Lc / sConf) + 1
      return { tiePhi, minDim, maxDim, s456, Lc, seismic: true, fullHeight: true, lo, sConf, sOut, nConf, nOut, nTies, spacing: `${tiePhi} @ ${sConf} full height` }
    }
    return { tiePhi, minDim, maxDim, s456, Lc, seismic: true, fullHeight: false, lo, sConf, sOut, nConf, nOut, nTies: nConf + nOut, spacing: `${tiePhi} @ ${sConf}/${sOut}` }
  }
  const s = floor25(s456)
  return { tiePhi, minDim, maxDim, s456, Lc, seismic: false, fullHeight: false, sOrd: s, nTies: Math.ceil(Lc / s) + 1, spacing: `${tiePhi} @ ${s}` }
}

/** Spacing and count of ties in one storey of a column; adds the steel to `book`. Returns the tie description. */
export function addColumnSteel(
  book: SteelBook,
  group: string,
  des: ColumnDesign,
  fck: number,
  rules: TieRules,
  longBarLength: number, // mm cut length of each longitudinal bar (already includes lap and anchorage)
  count = 1
): string {
  const { b, D, cfg } = des
  const t = tieLayout(des, rules)
  const tiePhi = t.tiePhi
  book.add(group, cfg.phi, longBarLength, cfg.n * count, 'column main bars')
  const nTies = t.nTies
  const spacing = t.spacing
  const A = b - 80
  const E = D - 80
  book.add(group, tiePhi, stirrupCutLength(A, E, tiePhi), nTies * count, 'column ties')
  // cross ties (IS 456 cl 26.5.3.2(c)): across the depth for the b-faces, across the width for the D-faces
  const crossLenD = D - 80 + 24 * tiePhi // spans the depth
  const crossLenB = b - 80 + 24 * tiePhi
  if (cfg.crossB > 0) book.add(group, tiePhi, crossLenD, cfg.crossB * nTies * count, 'column cross ties')
  if (cfg.crossD > 0) book.add(group, tiePhi, crossLenB, cfg.crossD * nTies * count, 'column cross ties')
  void fck
  return spacing
}

export const columnLap = (phi: number, fck: number, seismic: boolean) => lapLength(phi, fck, seismic ? 'tension' : 'compression')
export { barArea }
