// Two-way slab panels: thickness by IS 456 cl 24.1 (span/depth), moments from IS 456 Table 26, bars with extensions per IS 456 Fig 23,
// torsion steel at corners per IS 456 Annex D cl D-1.8.

import { COVER_SLAB, TABLE26, astSingly, barArea, t26Interp } from './codes'
import { SteelBook } from './steel'

/** Modification factor for the tension steel (IS 456 Fig 4): the figure is unreadable in the open scan, so a typical value for Fe500 slabs is assumed. */
export const SLAB_MF = 1.2

/** Slab thickness rule: basic span/depth 26 when the panel has a continuous edge, 20 when it has none; thickness rounded up to 25 mm and kept between 125 and 250 mm. */
export const SLAB_RULES = { basicContinuous: 26, basicSimple: 20, halfBar: 5, step: 25, tMin: 125, tMax: 250 } as const

/** Slab thickness (mm) for the largest panel: basic span/depth 26 when the panel has a continuous edge, 20 when it has none. */
export function slabThickness(lxMax: number, anyContinuous: boolean): number {
  const basic = anyContinuous ? SLAB_RULES.basicContinuous : SLAB_RULES.basicSimple
  const dReq = (lxMax * 1000) / (basic * SLAB_MF)
  const t = Math.ceil((dReq + COVER_SLAB + SLAB_RULES.halfBar) / SLAB_RULES.step) * SLAB_RULES.step
  return Math.min(SLAB_RULES.tMax, Math.max(SLAB_RULES.tMin, t))
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

/** One bar group of a panel, as it was added to the steel record. */
export interface PanelBarLine {
  note: string
  phi: number
  lengthMm: number
  count: number
  kg: number
}

/** Intermediate values of one panel design, kept so that a calculation sheet can show the working. Nothing here feeds back into the design. */
export interface PanelDetail {
  lx: number
  ly: number
  ratio: number
  xShort: boolean
  /** continuity of the two long edges and the two short edges (true = continuous) */
  longEdges: boolean[]
  shortEdges: boolean[]
  discLong: number
  discShort: number
  caseNo: number
  /** wu lx^2, kN.m per metre before the coefficient */
  w: number
  dx: number
  dy: number
  minAst: number
  coef: { axPos: number; ayPos: number; axNeg: number; ayNeg: number }
  mxPos: number
  myPos: number
  mxNeg: number
  myNeg: number
  astXpos: number
  astYpos: number
  astXneg: number | null
  astYneg: number | null
  posX: SpacingTrace
  posY: SpacingTrace
  negX: SpacingTrace | null
  negY: SpacingTrace | null
  nLongCont: number
  nShortCont: number
  bw: number
  hook: number
  torsAst: number
  tors: SpacingTrace
  lines: PanelBarLine[]
}

export interface PanelResult {
  kg: number
  caseNo: number
  note: string
  detail: PanelDetail
}

export interface BarSet {
  phi: number
  s: number // mm
  area: number // mm2 per metre provided
}

/** The rules of the panel steel, kept in one place so the calculation sheet reads the same values the design uses. */
export const PANEL_RULES = {
  minSteelRatio: 0.0012,
  barPhis: [8, 10, 12, 16],
  spacingStep: 25,
  /** bars are spaced at no more than the smaller of 3 d and this (mm) */
  spacingCapMm: 150,
  spacingCapMultiple: 3,
  /** a bar size is accepted when its spacing comes to at least this (mm); 16 mm is accepted whatever the spacing */
  acceptSpacingMm: 125,
  spacingFloorMm: 75,
  /** span bars are 25 mm short of the support at each end; the count allows 50 mm at each side */
  endShortMm: 50,
  edgeAllowMm: 100,
  /** top steel over a continuous edge reaches this fraction of the span each side of the support */
  negExtent: 0.3,
  /** top steel at a discontinuous edge: this fraction of the span, at the larger of the span-bar spacing x 2 and 300 mm */
  discExtent: 0.15,
  discSpacingCapMm: 300,
  /** torsion steel at a corner: this share of the short-span mid steel, over this fraction (1 / divisor) of the short span */
  torsionShare: 0.75,
  torsionSideDivisor: 5,
  torsionHalfCorner: 0.5,
  /** the long-span bars lie on top of the short-span bars: their effective depth is smaller by this much (mm) */
  layerStepMm: 10,
} as const

/** The trial of bar sizes behind one choice of bars: each size tried, the spacing it came to, and the one picked. */
export interface SpacingTrace {
  astReq: number
  d: number
  sMax: number
  tried: { phi: number; sCalc: number; accepted: boolean }[]
  pick: BarSet
}

export function spacingTrace(astReq: number, d: number): SpacingTrace {
  const sMax = Math.min(PANEL_RULES.spacingCapMultiple * d, PANEL_RULES.spacingCapMm) // IS 456 cl 26.3.3 allows 3d / 300 mm; drawings for houses almost always show 8 mm @ 150 or closer: site-practice ASSUMPTION
  const tried: SpacingTrace['tried'] = []
  for (const phi of PANEL_RULES.barPhis) {
    const a = barArea(phi)
    const s = Math.floor(((a * 1000) / astReq) / PANEL_RULES.spacingStep) * PANEL_RULES.spacingStep
    const accepted = s >= PANEL_RULES.acceptSpacingMm || phi === 16
    tried.push({ phi, sCalc: s, accepted })
    if (accepted) {
      const sUse = Math.max(PANEL_RULES.spacingFloorMm, Math.min(s, sMax))
      return { astReq, d, sMax, tried, pick: { phi, s: sUse, area: (a * 1000) / sUse } }
    }
  }
  return { astReq, d, sMax, tried, pick: { phi: 16, s: 100, area: (barArea(16) * 1000) / 100 } }
}

export function chooseSpacing(astReq: number, d: number): BarSet {
  return spacingTrace(astReq, d).pick
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
  const dx = t - COVER_SLAB - SLAB_RULES.halfBar
  const dy = dx - PANEL_RULES.layerStepMm
  const w = p.wu * lx * lx
  const minAst = PANEL_RULES.minSteelRatio * 1000 * t // IS 456 cl 26.5.2.1, HYSD bars

  const ax = (M: number, d: number) => Math.max(minAst, astSingly(M * 1e6, 1000, d, p.fck) ?? (M * 1e6) / (0.87 * 500 * 0.85 * d))
  const cAxPos = t26Interp(tbl.axPos, ratio)
  const mxPos = cAxPos * w
  const myPos = tbl.ayPos * w
  const cAxNeg = tbl.axNeg ? t26Interp(tbl.axNeg, ratio) : 0
  const mxNeg = tbl.axNeg ? cAxNeg * w : 0
  const myNeg = tbl.ayNeg * w
  const astXpos = ax(mxPos, dx)
  const astYpos = ax(myPos, dy)
  const posXt = spacingTrace(astXpos, dx) // bars along the short span
  const posYt = spacingTrace(astYpos, dy) // bars along the long span
  const posX = posXt.pick
  const posY = posYt.pick
  let kg = 0
  const lines: PanelBarLine[] = []
  const add = (note: string, phi: number, lengthMm: number, count: number): number => {
    const k = book.add(group, phi, lengthMm, count, note)
    lines.push({ note, phi, lengthMm, count, kg: k })
    return k
  }
  const L = (m: number) => m * 1000
  // bottom bars: spaced across the panel, length = span less 25 mm cover each end
  kg += add('bottom bars along the short span', posX.phi, L(lx) - PANEL_RULES.endShortMm, Math.floor((L(ly) - PANEL_RULES.edgeAllowMm) / posX.s) + 1)
  kg += add('bottom bars along the long span', posY.phi, L(ly) - PANEL_RULES.endShortMm, Math.floor((L(lx) - PANEL_RULES.edgeAllowMm) / posY.s) + 1)

  const bw = p.beamB
  const hook = t - 2 * COVER_SLAB // leg turned down into the beam at a discontinuous edge
  // top steel over continuous edges: extends 0.3 l each side of the support (shared with the neighbouring panel: half each)
  const astXneg = mxNeg > 0 ? ax(mxNeg, dx) : null
  const astYneg = myNeg > 0 ? ax(myNeg, dy) : null
  const negXt = astXneg !== null ? spacingTrace(astXneg, dx) : null
  const negYt = astYneg !== null ? spacingTrace(astYneg, dy) : null
  const negX = negXt ? negXt.pick : null
  const negY = negYt ? negYt.pick : null
  const nLongCont = longEdges.filter((c) => c).length
  const nShortCont = shortEdges.filter((c) => c).length
  if (negX && nLongCont > 0) {
    const len = PANEL_RULES.negExtent * L(lx) * 2 + bw
    kg += add('top bars over the continuous long edges (half of the length is this panel\'s)', negX.phi, len / 2, nLongCont * (Math.floor((L(ly) - PANEL_RULES.edgeAllowMm) / negX.s) + 1))
  }
  if (negY && nShortCont > 0) {
    const len = PANEL_RULES.negExtent * L(ly) * 2 + bw
    kg += add('top bars over the continuous short edges (half of the length is this panel\'s)', negY.phi, len / 2, nShortCont * (Math.floor((L(lx) - PANEL_RULES.edgeAllowMm) / negY.s) + 1))
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
    const spacing = Math.min(PANEL_RULES.discSpacingCapMm, bar.s * 2)
    kg += add(isLong ? 'top bars at a discontinuous long edge' : 'top bars at a discontinuous short edge', phi, PANEL_RULES.discExtent * span + bw - COVER_SLAB + hook, Math.floor((edgeLen - PANEL_RULES.edgeAllowMm) / spacing) + 1)
  }
  // torsion steel: two layers of 0.75 x the short-span mid steel over lx/5 square at each corner (full at a corner with both edges discontinuous, half with one)
  const corners: [boolean, boolean][] = [
    [p.edge.W, p.edge.S],
    [p.edge.E, p.edge.S],
    [p.edge.W, p.edge.N],
    [p.edge.E, p.edge.N],
  ]
  const torsAst = PANEL_RULES.torsionShare * posX.area
  const torsT = spacingTrace(torsAst, dx)
  const tors = torsT.pick
  for (const [a, b] of corners) {
    const nDisc = (a ? 0 : 1) + (b ? 0 : 1)
    if (nDisc === 0) continue
    const f = nDisc === 2 ? 1 : PANEL_RULES.torsionHalfCorner
    const side = L(lx) / PANEL_RULES.torsionSideDivisor
    const nBars = Math.floor(side / tors.s) + 1
    kg += add(nDisc === 2 ? 'torsion bars at a corner with two discontinuous edges' : 'torsion bars at a corner with one discontinuous edge', tors.phi, side, 2 * 2 * nBars * f) // 2 layers x 2 directions
  }
  return {
    kg,
    caseNo,
    note: `case ${caseNo}, ${posX.phi}@${posX.s} / ${posY.phi}@${posY.s}`,
    detail: {
      lx, ly, ratio, xShort, longEdges, shortEdges, discLong, discShort, caseNo, w, dx, dy, minAst,
      coef: { axPos: cAxPos, ayPos: tbl.ayPos, axNeg: cAxNeg, ayNeg: tbl.ayNeg },
      mxPos, myPos, mxNeg, myNeg, astXpos, astYpos, astXneg, astYneg,
      posX: posXt, posY: posYt, negX: negXt, negY: negYt, nLongCont, nShortCont, bw, hook, torsAst, tors: torsT, lines,
    },
  }
}
