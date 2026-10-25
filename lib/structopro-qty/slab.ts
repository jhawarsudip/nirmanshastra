// Two-way slab panels: thickness by IS 456 cl 24.1 (span/depth), moments from IS 456 Table 26, bars with extensions per IS 456 Fig 23,
// torsion steel at corners per IS 456 Annex D cl D-1.8.

import { COVER_SLAB, TABLE26, astSingly, barArea, t26Interp } from './codes'
import { SteelBook } from './steel'

/** Modification factor for the tension steel (IS 456 Fig 4): the figure is unreadable in the open scan, so a typical value for Fe500 slabs is assumed. */
export const SLAB_MF = 1.2

/** Slab thickness (mm) for the largest panel: basic span/depth 26 when the panel has a continuous edge, 20 when it has none. */
export function slabThickness(lxMax: number, anyContinuous: boolean): number {
  const basic = anyContinuous ? 26 : 20
  const dReq = (lxMax * 1000) / (basic * SLAB_MF)
  const t = Math.ceil((dReq + COVER_SLAB + 5) / 25) * 25
  return Math.min(250, Math.max(125, t))
}

export interface PanelInput {
  sx: number // m, c/c span along x
  sy: number // m, c/c span along y
  edge: { W: boolean; E: boolean; S: boolean; N: boolean } // true = continuous (neighbouring panel or cantilever beyond)
  t: number // mm
  wu: number // kN/m2, factored total load
  fck: number
  beamB: number // mm, supporting beam width
}

export interface PanelResult {
  kg: number
  caseNo: number
  note: string
}

export interface BarSet {
  phi: number
  s: number // mm
  area: number // mm2 per metre provided
}

export function chooseSpacing(astReq: number, d: number): BarSet {
  const sMax = Math.min(3 * d, 150) // IS 456 cl 26.3.3 allows 3d / 300 mm; drawings for houses almost always show 8 mm @ 150 or closer: site-practice ASSUMPTION
  for (const phi of [8, 10, 12, 16]) {
    const a = barArea(phi)
    const s = Math.floor(((a * 1000) / astReq) / 25) * 25
    if (s >= 125 || phi === 16) {
      const sUse = Math.max(75, Math.min(s, sMax))
      return { phi, s: sUse, area: (a * 1000) / sUse }
    }
  }
  return { phi: 16, s: 100, area: (barArea(16) * 1000) / 100 }
}

export function slabCase(discShort: number, discLong: number): number {
  if (discShort === 0 && discLong === 0) return 1
  if (discShort === 1 && discLong === 0) return 2
  if (discShort === 0 && discLong === 1) return 3
  if (discShort === 1 && discLong === 1) return 4
  if (discShort === 2 && discLong === 0) return 5
  if (discShort === 0 && discLong === 2) return 6
  return 9 // three or four edges discontinuous: the tabulated case 9 (simply supported) is the conservative upper bound
}

export function designPanel(p: PanelInput, book: SteelBook, group: string): PanelResult {
  const xShort = p.sx <= p.sy
  const lx = Math.min(p.sx, p.sy)
  const ly = Math.max(p.sx, p.sy)
  // long edges run along the long direction: W/E if x is the short direction, else S/N
  const longEdges = xShort ? [p.edge.W, p.edge.E] : [p.edge.S, p.edge.N]
  const shortEdges = xShort ? [p.edge.S, p.edge.N] : [p.edge.W, p.edge.E]
  const discLong = longEdges.filter((c) => !c).length
  const discShort = shortEdges.filter((c) => !c).length
  const caseNo = slabCase(discShort, discLong)
  const tbl = TABLE26[caseNo]
  const ratio = ly / lx
  const t = p.t
  const dx = t - COVER_SLAB - 5
  const dy = dx - 10
  const w = p.wu * lx * lx
  const minAst = 0.0012 * 1000 * t // IS 456 cl 26.5.2.1, HYSD bars

  const ax = (M: number, d: number) => Math.max(minAst, astSingly(M * 1e6, 1000, d, p.fck) ?? (M * 1e6) / (0.87 * 500 * 0.85 * d))
  const mxPos = t26Interp(tbl.axPos, ratio) * w
  const myPos = tbl.ayPos * w
  const mxNeg = tbl.axNeg ? t26Interp(tbl.axNeg, ratio) * w : 0
  const myNeg = tbl.ayNeg * w
  const posX = chooseSpacing(ax(mxPos, dx), dx) // bars along the short span
  const posY = chooseSpacing(ax(myPos, dy), dy) // bars along the long span
  let kg = 0
  const L = (m: number) => m * 1000
  // bottom bars: spaced across the panel, length = span less 25 mm cover each end
  kg += book.add(group, posX.phi, L(lx) - 50, Math.floor((L(ly) - 100) / posX.s) + 1)
  kg += book.add(group, posY.phi, L(ly) - 50, Math.floor((L(lx) - 100) / posY.s) + 1)

  const bw = p.beamB
  const hook = t - 2 * COVER_SLAB // leg turned down into the beam at a discontinuous edge
  // top steel over continuous edges: extends 0.3 l each side of the support (shared with the neighbouring panel: half each)
  const negX = mxNeg > 0 ? chooseSpacing(ax(mxNeg, dx), dx) : null
  const negY = myNeg > 0 ? chooseSpacing(ax(myNeg, dy), dy) : null
  const nLongCont = longEdges.filter((c) => c).length
  const nShortCont = shortEdges.filter((c) => c).length
  if (negX && nLongCont > 0) {
    const len = 0.3 * L(lx) * 2 + bw
    kg += book.add(group, negX.phi, len / 2, nLongCont * (Math.floor((L(ly) - 100) / negX.s) + 1))
  }
  if (negY && nShortCont > 0) {
    const len = 0.3 * L(ly) * 2 + bw
    kg += book.add(group, negY.phi, len / 2, nShortCont * (Math.floor((L(lx) - 100) / negY.s) + 1))
  }
  // discontinuous edges: top steel equal to half the span steel, extending 0.15 l (IS 456 cl D-1.6 and Fig 23)
  for (const [isLong, cont] of [
    ...longEdges.map((c) => [true, c] as const),
    ...shortEdges.map((c) => [false, c] as const),
  ]) {
    if (cont) continue
    const bar = isLong ? posX : posY // bars across a long edge are the short-span bars
    const edgeLen = isLong ? L(ly) : L(lx)
    const span = isLong ? L(lx) : L(ly)
    const phi = bar.phi
    const spacing = Math.min(300, bar.s * 2)
    kg += book.add(group, phi, 0.15 * span + bw - COVER_SLAB + hook, Math.floor((edgeLen - 100) / spacing) + 1)
  }
  // torsion steel: two layers of 0.75 x the short-span mid steel over lx/5 square at each corner (full at a corner with both edges discontinuous, half with one)
  const corners: [boolean, boolean][] = [
    [p.edge.W, p.edge.S],
    [p.edge.E, p.edge.S],
    [p.edge.W, p.edge.N],
    [p.edge.E, p.edge.N],
  ]
  const tors = chooseSpacing(0.75 * posX.area, dx)
  for (const [a, b] of corners) {
    const nDisc = (a ? 0 : 1) + (b ? 0 : 1)
    if (nDisc === 0) continue
    const f = nDisc === 2 ? 1 : 0.5
    const side = L(lx) / 5
    const nBars = Math.floor(side / tors.s) + 1
    kg += book.add(group, tors.phi, side, 2 * 2 * nBars * f) // 2 layers x 2 directions
  }
  return { kg, caseNo, note: `case ${caseNo}, ${posX.phi}@${posX.s} / ${posY.phi}@${posY.s}` }
}
