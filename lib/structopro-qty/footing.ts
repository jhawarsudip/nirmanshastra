// Isolated sloped footings (IS 456 cl 34) and a simple raft (indicative). Depth from one-way shear, punching shear (cl 31.6) and flexure.

import { COVER_FOOTING, FY, astSingly, barArea, tauC } from './codes'
import { SteelBook } from './steel'

export interface FootingInput {
  PuKN: number // factored column load at footing top
  PserKN: number // service load (DL + LL)
  colB: number // mm (x)
  colD: number // mm (y)
  sbc: number // kN/m2 net safe bearing capacity (ASSUMPTION by site class)
  fck: number
}

/** The rules of the footing design, kept in one place so the calculation sheet reads the same values the design uses. */
export const FOOTING_RULES = {
  /** service load rise for the footing's own weight and the backfill: area = 1.1 P / sbc */
  selfWeightFactor: 1.1,
  minSideM: 1.0,
  roundM: 0.05,
  dStart: 225,
  dStep: 25,
  dMax: 1200,
  /** pt (%) at which the one-way shear strength of the concrete is read */
  ptShear: 0.3,
  /** bar cover allowance in the effective depth of the trial depth search: cover is not deducted, 12 mm is taken off for the flexure check */
  flexureAllowance: 12,
  minOverall: 350,
  edgeMm: 150,
  minSteelRatio: 0.0012,
  barPhis: [10, 12, 16, 20],
  spacingStep: 25,
  spacingMin: 100,
  spacingCap: 150,
  /** mat bars stop 50 mm short of the footing edge on each side */
  endAllowanceMm: 100,
  /** lean concrete projects 100 mm beyond the footing on each side and is 100 mm thick */
  pccProjectionM: 0.2,
  pccThicknessM: 0.1,
  /** the column pedestal on top of the sloping face is the column plus 100 mm each side */
  pedestalExtraM: 0.2,
  /** raft */
  raftProjectionM: 0.3,
  raftTStart: 450,
  raftTMax: 1400,
  raftTStep: 25,
  raftCoverMm: 75,
  raftMomentDivisor: 10,
  raftChairPhi: 12,
  raftPitFringeM: 1.4,
} as const

/** One trial depth of the footing search: what each of the five checks gave. */
export interface FootingTrial {
  d: number
  vx: number
  vy: number
  tvx: number
  tvy: number
  tc: number
  vp: number
  bo: number
  tp: number
  tpAllow: number
  ks: number
  mx: number
  my: number
  muLimX: number
  muLimY: number
  ok: boolean
}

/** Intermediate values of one footing design, kept so that a calculation sheet can show the working. Nothing here feeds back into the design. */
export interface FootingDetail {
  input: FootingInput
  area: number
  side: number
  diff: number
  trials: FootingTrial[]
  dSearch: number
  qu: number
  overall: number
  dX: number
  dY: number
  mx: number
  my: number
  minAst: number
  astX: number
  astY: number
  mX: { phi: number; s: number }
  mY: { phi: number; s: number }
  nX: number
  nY: number
  lenX: number
  lenY: number
  A1: number
  A2: number
  h: number
}

export interface FootingResult {
  Lf: number // m (x)
  Bf: number // m (y)
  depth: number // mm overall
  edge: number // mm edge thickness
  concreteM3: number
  formworkM2: number
  steelKg: number
  pccM3: number
  bars: string
  detail: FootingDetail
}

const ceil50 = (v: number) => Math.ceil(v / FOOTING_RULES.roundM - 1e-9) * FOOTING_RULES.roundM

function pickMat(astPerM: number, d: number): { phi: number; s: number } {
  const sMax = Math.min(FOOTING_RULES.spacingCap, 3 * d) // site-practice ASSUMPTION: mats are detailed at 150 mm or closer
  for (const phi of FOOTING_RULES.barPhis) {
    const a = barArea(phi)
    const s = Math.floor((a * 1000) / astPerM / FOOTING_RULES.spacingStep) * FOOTING_RULES.spacingStep
    if (s >= FOOTING_RULES.spacingMin) return { phi, s: Math.min(s, sMax) }
  }
  return { phi: 20, s: 100 }
}

/** The mat bars chosen for a steel area per metre and effective depth (the rule `designIsolatedFooting` and the raft use). Exposed for the calculation sheet. */
export const pickMatBars = pickMat

export function designIsolatedFooting(f: FootingInput, book: SteelBook, group: string): FootingResult {
  const area = (FOOTING_RULES.selfWeightFactor * f.PserKN) / f.sbc
  const side = Math.max(FOOTING_RULES.minSideM, Math.sqrt(area))
  const diff = (f.colD - f.colB) / 1000
  const Bf = ceil50(Math.max(FOOTING_RULES.minSideM, side - diff / 2))
  const Lf = ceil50(Bf + Math.max(0, diff))
  const qu = f.PuKN / (Lf * Bf) // kN/m2
  const b = f.colB
  const D = f.colD
  let d: number = FOOTING_RULES.dStart
  const trials: FootingTrial[] = []
  for (; d <= FOOTING_RULES.dMax; d += FOOTING_RULES.dStep) {
    // one-way shear at d from the column face, both directions
    const vx = qu * Bf * ((Lf * 1000 - D) / 2000 - d / 1000)
    const vy = qu * Lf * ((Bf * 1000 - b) / 2000 - d / 1000)
    const tc = tauC(f.fck, FOOTING_RULES.ptShear) // IS 456 Table 19 at pt = 0.3 % (ASSUMPTION; the actual pt is about 0.2-0.4 %)
    const tvx = (Math.max(0, vx) * 1000) / (Bf * 1000 * d)
    const tvy = (Math.max(0, vy) * 1000) / (Lf * 1000 * d)
    // punching shear at d/2
    const bo = 2 * (b + d + D + d)
    const vp = qu * (Lf * Bf - ((b + d) * (D + d)) / 1e6)
    const beta = Math.min(b, D) / Math.max(b, D)
    const ks = Math.min(1, 0.5 + beta)
    const tp = (vp * 1000) / (bo * d)
    const tpAllow = ks * 0.25 * Math.sqrt(f.fck)
    // flexure
    const mx = (qu * Bf * Math.pow((Lf * 1000 - D) / 2000, 2)) / 2 // kN.m about the face, long direction
    const my = (qu * Lf * Math.pow((Bf * 1000 - b) / 2000, 2)) / 2
    const dEff = d - FOOTING_RULES.flexureAllowance
    const muLimX = 0.134 * f.fck * Bf * 1000 * dEff * dEff * 1e-6
    const muLimY = 0.134 * f.fck * Lf * 1000 * dEff * dEff * 1e-6
    const ok = tvx <= tc && tvy <= tc && tp <= tpAllow && mx <= muLimX && my <= muLimY
    trials.push({ d, vx, vy, tvx, tvy, tc, vp, bo, tp, tpAllow, ks, mx, my, muLimX, muLimY, ok })
    if (ok) break
  }
  const overall = Math.max(FOOTING_RULES.minOverall, Math.ceil((d + COVER_FOOTING + FOOTING_RULES.flexureAllowance) / FOOTING_RULES.dStep) * FOOTING_RULES.dStep)
  const dX = overall - COVER_FOOTING - 8 // lower layer: bars along x
  const dY = dX - 12
  const mx = (qu * Bf * Math.pow((Lf * 1000 - D) / 2000, 2)) / 2
  const my = (qu * Lf * Math.pow((Bf * 1000 - b) / 2000, 2)) / 2
  const minAst = FOOTING_RULES.minSteelRatio * 1000 * overall
  const aX = Math.max(minAst, astSingly((mx / Bf) * 1e6, 1000, dX, f.fck) ?? ((mx / Bf) * 1e6) / (0.87 * FY * 0.85 * dX))
  const aY = Math.max(minAst, astSingly((my / Lf) * 1e6, 1000, dY, f.fck) ?? ((my / Lf) * 1e6) / (0.87 * FY * 0.85 * dY))
  const mX = pickMat(aX, dX)
  const mY = pickMat(aY, dY)
  let kg = 0
  const nX = Math.floor((Bf * 1000 - FOOTING_RULES.endAllowanceMm) / mX.s) + 1
  const nY = Math.floor((Lf * 1000 - FOOTING_RULES.endAllowanceMm) / mY.s) + 1
  kg += book.add(group, mX.phi, Lf * 1000 - FOOTING_RULES.endAllowanceMm, nX, 'footing bars along x')
  kg += book.add(group, mY.phi, Bf * 1000 - FOOTING_RULES.endAllowanceMm, nY, 'footing bars along y')
  const edge: number = FOOTING_RULES.edgeMm
  const h = (overall - edge) / 1000
  const A1 = Lf * Bf
  const A2 = (b / 1000 + FOOTING_RULES.pedestalExtraM) * (D / 1000 + FOOTING_RULES.pedestalExtraM)
  const vol = A1 * (edge / 1000) + (h / 3) * (A1 + A2 + Math.sqrt(A1 * A2))
  return {
    Lf,
    Bf,
    depth: overall,
    edge,
    concreteM3: vol,
    formworkM2: 2 * (Lf + Bf) * (edge / 1000),
    steelKg: kg,
    pccM3: (Lf + FOOTING_RULES.pccProjectionM) * (Bf + FOOTING_RULES.pccProjectionM) * FOOTING_RULES.pccThicknessM,
    bars: `${mX.phi}@${mX.s} x, ${mY.phi}@${mY.s} y`,
    detail: { input: f, area, side, diff, trials, dSearch: d, qu, overall, dX, dY, mx, my, minAst, astX: aX, astY: aY, mX, mY, nX, nY, lenX: Lf * 1000 - FOOTING_RULES.endAllowanceMm, lenY: Bf * 1000 - FOOTING_RULES.endAllowanceMm, A1, A2, h },
  }
}

export interface RaftInput {
  lengthM: number
  widthM: number
  totalPuKN: number
  maxColPuKN: number
  colMin: number // mm smallest column side
  maxSpan: number // m
  fck: number
}

/** One trial thickness of the raft's punching-shear search. */
export interface RaftTrial {
  t: number
  d: number
  vp: number
  bo: number
  tp: number
  ok: boolean
}

/** Intermediate values of the raft design, kept so that a calculation sheet can show the working. Nothing here feeds back into the design. */
export interface RaftDetail {
  input: RaftInput
  lengthM: number
  widthM: number
  area: number
  qu: number
  trials: RaftTrial[]
  tpAllow: number
  d: number
  M: number
  minAst: number
  /** steel area per metre from the flexure formula (mm2), before the minimum is applied; null when the section is over its limit and the fallback formula was used */
  astFlex: number | null
  ast: number
  mat: { phi: number; s: number }
  nAlongL: number
  nAlongW: number
  lenAlongL: number
  lenAlongW: number
  chairLenMm: number
  chairs: number
}

export interface RaftResult {
  x0: number
  y0: number
  x1: number
  y1: number
  tMm: number
  concreteM3: number
  formworkM2: number
  steelKg: number
  pccM3: number
  areaM2: number
  detail: RaftDetail
}

/** Raft treated as an inverted flat slab on the column grid: thickness from punching, steel from M = qu l^2 / 10 per metre in each layer. INDICATIVE. */
export function designRaft(r: RaftInput, book: SteelBook, group: string): RaftResult {
  const proj = FOOTING_RULES.raftProjectionM
  const L = r.lengthM + 2 * proj
  const W = r.widthM + 2 * proj
  const area = L * W
  const qu = r.totalPuKN / area
  let t: number = FOOTING_RULES.raftTStart
  const trials: RaftTrial[] = []
  const tpAllow = 0.25 * Math.sqrt(r.fck)
  for (; t <= FOOTING_RULES.raftTMax; t += FOOTING_RULES.raftTStep) {
    const d = t - FOOTING_RULES.raftCoverMm
    const c = r.colMin
    const vp = r.maxColPuKN - (qu * Math.pow(c + d, 2)) / 1e6
    const bo = 4 * (c + d)
    const tp = (vp * 1000) / (bo * d)
    const ok = tp <= tpAllow
    trials.push({ t, d, vp, bo, tp, ok })
    if (ok) break
  }
  const d = t - FOOTING_RULES.raftCoverMm
  const M = (qu * r.maxSpan * r.maxSpan) / FOOTING_RULES.raftMomentDivisor // kN.m per m
  const minAst = FOOTING_RULES.minSteelRatio * 1000 * t
  const astFlex = astSingly(M * 1e6, 1000, d, r.fck)
  const ast = Math.max(minAst, astFlex ?? (M * 1e6) / (0.87 * FY * 0.85 * d))
  const mat = pickMat(ast, d)
  // four layers (top and bottom, both ways), each carrying `ast` per metre
  let kg = 0
  const lenAlongL = L * 1000 - FOOTING_RULES.endAllowanceMm
  const lenAlongW = W * 1000 - FOOTING_RULES.endAllowanceMm
  const nAlongL = 2 * (Math.floor((W * 1000 - FOOTING_RULES.endAllowanceMm) / mat.s) + 1)
  const nAlongW = 2 * (Math.floor((L * 1000 - FOOTING_RULES.endAllowanceMm) / mat.s) + 1)
  kg += book.add(group, mat.phi, lenAlongL, nAlongL, 'raft bars along the length, top and bottom layers')
  kg += book.add(group, mat.phi, lenAlongW, nAlongW, 'raft bars along the width, top and bottom layers')
  // chairs / spacers between the layers: 12 mm, one per m2, length = 2 t
  const chairs = Math.ceil(area)
  kg += book.add(group, FOOTING_RULES.raftChairPhi, 2 * t, chairs, 'chairs between the raft layers')
  return {
    x0: -proj,
    y0: -proj,
    x1: r.lengthM + proj,
    y1: r.widthM + proj,
    tMm: t,
    concreteM3: area * (t / 1000),
    formworkM2: 2 * (L + W) * (t / 1000),
    steelKg: kg,
    pccM3: (L + FOOTING_RULES.pccProjectionM) * (W + FOOTING_RULES.pccProjectionM) * FOOTING_RULES.pccThicknessM,
    areaM2: area,
    detail: { input: r, lengthM: L, widthM: W, area, qu, trials, tpAllow, d, M, minAst, astFlex, ast, mat, nAlongL, nAlongW, lenAlongL, lenAlongW, chairLenMm: 2 * t, chairs },
  }
}
