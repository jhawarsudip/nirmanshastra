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
}

const ceil50 = (v: number) => Math.ceil(v / 0.05 - 1e-9) * 0.05

function pickMat(astPerM: number, d: number): { phi: number; s: number } {
  const sMax = Math.min(150, 3 * d) // site-practice ASSUMPTION: mats are detailed at 150 mm or closer
  for (const phi of [10, 12, 16, 20]) {
    const a = barArea(phi)
    const s = Math.floor((a * 1000) / astPerM / 25) * 25
    if (s >= 100) return { phi, s: Math.min(s, sMax) }
  }
  return { phi: 20, s: 100 }
}

export function designIsolatedFooting(f: FootingInput, book: SteelBook, group: string): FootingResult {
  const area = (1.1 * f.PserKN) / f.sbc
  const side = Math.max(1.0, Math.sqrt(area))
  const diff = (f.colD - f.colB) / 1000
  const Bf = ceil50(Math.max(1.0, side - diff / 2))
  const Lf = ceil50(Bf + Math.max(0, diff))
  const qu = f.PuKN / (Lf * Bf) // kN/m2
  const b = f.colB
  const D = f.colD
  let d = 225
  for (; d <= 1200; d += 25) {
    // one-way shear at d from the column face, both directions
    const vx = qu * Bf * ((Lf * 1000 - D) / 2000 - d / 1000)
    const vy = qu * Lf * ((Bf * 1000 - b) / 2000 - d / 1000)
    const tc = tauC(f.fck, 0.3) // IS 456 Table 19 at pt = 0.3 % (ASSUMPTION; the actual pt is about 0.2-0.4 %)
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
    const dEff = d - 12
    const muLimX = 0.134 * f.fck * Bf * 1000 * dEff * dEff * 1e-6
    const muLimY = 0.134 * f.fck * Lf * 1000 * dEff * dEff * 1e-6
    if (tvx <= tc && tvy <= tc && tp <= tpAllow && mx <= muLimX && my <= muLimY) break
  }
  const overall = Math.max(350, Math.ceil((d + COVER_FOOTING + 12) / 25) * 25)
  const dX = overall - COVER_FOOTING - 8 // lower layer: bars along x
  const dY = dX - 12
  const mx = (qu * Bf * Math.pow((Lf * 1000 - D) / 2000, 2)) / 2
  const my = (qu * Lf * Math.pow((Bf * 1000 - b) / 2000, 2)) / 2
  const minAst = 0.0012 * 1000 * overall
  const aX = Math.max(minAst, astSingly((mx / Bf) * 1e6, 1000, dX, f.fck) ?? ((mx / Bf) * 1e6) / (0.87 * FY * 0.85 * dX))
  const aY = Math.max(minAst, astSingly((my / Lf) * 1e6, 1000, dY, f.fck) ?? ((my / Lf) * 1e6) / (0.87 * FY * 0.85 * dY))
  const mX = pickMat(aX, dX)
  const mY = pickMat(aY, dY)
  let kg = 0
  kg += book.add(group, mX.phi, Lf * 1000 - 100, Math.floor((Bf * 1000 - 100) / mX.s) + 1)
  kg += book.add(group, mY.phi, Bf * 1000 - 100, Math.floor((Lf * 1000 - 100) / mY.s) + 1)
  const edge = 150
  const h = (overall - edge) / 1000
  const A1 = Lf * Bf
  const A2 = (b / 1000 + 0.2) * (D / 1000 + 0.2)
  const vol = A1 * (edge / 1000) + (h / 3) * (A1 + A2 + Math.sqrt(A1 * A2))
  return {
    Lf,
    Bf,
    depth: overall,
    edge,
    concreteM3: vol,
    formworkM2: 2 * (Lf + Bf) * (edge / 1000),
    steelKg: kg,
    pccM3: (Lf + 0.2) * (Bf + 0.2) * 0.1,
    bars: `${mX.phi}@${mX.s} x, ${mY.phi}@${mY.s} y`,
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
}

/** Raft treated as an inverted flat slab on the column grid: thickness from punching, steel from M = qu l^2 / 10 per metre in each layer. INDICATIVE. */
export function designRaft(r: RaftInput, book: SteelBook, group: string): RaftResult {
  const proj = 0.3
  const L = r.lengthM + 2 * proj
  const W = r.widthM + 2 * proj
  const area = L * W
  const qu = r.totalPuKN / area
  let t = 450
  for (; t <= 1400; t += 25) {
    const d = t - 75
    const c = r.colMin
    const vp = r.maxColPuKN - (qu * Math.pow(c + d, 2)) / 1e6
    const bo = 4 * (c + d)
    const tp = (vp * 1000) / (bo * d)
    if (tp <= 0.25 * Math.sqrt(r.fck)) break
  }
  const d = t - 75
  const M = (qu * r.maxSpan * r.maxSpan) / 10 // kN.m per m
  const ast = Math.max(0.0012 * 1000 * t, astSingly(M * 1e6, 1000, d, r.fck) ?? (M * 1e6) / (0.87 * FY * 0.85 * d))
  const mat = pickMat(ast, d)
  // four layers (top and bottom, both ways), each carrying `ast` per metre
  let kg = 0
  kg += book.add(group, mat.phi, L * 1000 - 100, 2 * (Math.floor((W * 1000 - 100) / mat.s) + 1))
  kg += book.add(group, mat.phi, W * 1000 - 100, 2 * (Math.floor((L * 1000 - 100) / mat.s) + 1))
  // chairs / spacers between the layers: 8 mm @ 1 per m2, length = 2 t
  kg += book.add(group, 12, 2 * t, Math.ceil(area))
  return {
    x0: -proj,
    y0: -proj,
    x1: r.lengthM + proj,
    y1: r.widthM + proj,
    tMm: t,
    concreteM3: area * (t / 1000),
    formworkM2: 2 * (L + W) * (t / 1000),
    steelKg: kg,
    pccM3: (L + 0.2) * (W + 0.2) * 0.1,
    areaM2: area,
  }
}
