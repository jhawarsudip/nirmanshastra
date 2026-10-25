// Balcony cantilever slabs: moment, bars, concrete and formwork. The slab is taken as a continuation of the floor slab (the top bars run on into the room),
// so the supporting beam sees the balcony as a load and the twisting is compatibility torsion, which IS 456 cl 41.1 does not ask to be designed for.
// Where a balcony stands on its own with no back-span the engineer must design the supporting beam for torsion: this is stated in the report.
//
// Sources: IS 456 cl 23.2.1 (cantilever span/depth 7), cl 26.2.1 (development length), cl 26.5.2.1 (0.12 % minimum steel);
// IS 875 (Part 2) Table 1 (3.0 kN/m2 on balconies). Bar spacing and the back-span length are site practice and a code rule respectively (see below).

import { COVER_SLAB, astSingly, devLength } from './codes'
import { BALCONY_LL } from './plan'
import { CEILING_PLASTER, Ctx, FLOOR_FINISH, wallUDL } from './frame'
import { spacingTrace, type SpacingTrace } from './slab'
import { SteelBook } from './steel'
import { GAMMA_RC } from './codes'
import type { BalconyResult, GeoSlab } from './types'

/** Horizontal load on the railing, kN/m, acting 1.0 m above the slab: IS 875 (Part 2) cl 4.2, residential. RECONSTRUCTED. */
const RAIL_H = 0.35
const RAIL_HEIGHT = 1.0

/** The rules of the balcony design, kept in one place so the calculation sheet reads the same values the design uses. */
export const BALCONY_RULES = {
  railKNperM: RAIL_H,
  railHeightM: RAIL_HEIGHT,
  loadFactor: 1.5,
  minSteelRatio: 0.0012,
  /** half of a 10 mm bar, mm: the effective depth is the thickness less the cover and this */
  halfBarMm: 5,
  /** lever-arm factor of the fallback formula used when the section is over its limit */
  fallbackFactor: 0.8,
  /** the main bars stop 25 mm short of the tip, bend down at the tip (slab depth less 40 mm), and run over the beam and back into the room slab */
  tipCoverMm: 25,
  tipBendLessMm: 40,
  endAllowMm: 100,
  distEndMm: 50,
  distPhis: [6, 8, 10],
  distSpacingStep: 25,
  distAcceptMm: 100,
  distSpacingFloorMm: 75,
  distSpacingCapMm: 200,
} as const

/** One balcony slab's bars and volumes. */
export interface BalconySlabDetail {
  k: number
  lenM: number
  nMain: number
  nDist: number
  kgMain: number
  kgDist: number
  concreteM3: number
  formworkM2: number
}

/** Intermediate values of the balcony design, kept so that a calculation sheet can show the working. Nothing here feeds back into the design. */
export interface BalconyDetail {
  lc: number
  D: number
  d: number
  gk: number
  pTip: number
  MuK: number
  Mu: number
  minAst: number
  astFlex: number | null
  ast: number
  main: SpacingTrace
  devLengthMm: number
  backSpanMm: number
  bw: number
  mainLen: number
  astDist: number
  distTried: { phi: number; s: number }[]
  dPhi: number
  dS: number
  perSlab: BalconySlabDetail[]
}

export interface BalconyOut {
  detail: BalconyDetail
  result: BalconyResult
  slabs: GeoSlab[]
  concreteM3: number
  formworkM2: number
  steelKg: number
  warning?: string
}

export function designBalconies(ctx: Ctx, book: SteelBook): BalconyOut | null {
  const bc = ctx.balcony
  if (!bc || bc.slots.length === 0) return null
  const { plan } = ctx
  const lc = bc.lc
  const D = bc.tMm
  const d = D - COVER_SLAB - BALCONY_RULES.halfBarMm
  const gk = GAMMA_RC * (D / 1000) + FLOOR_FINISH + CEILING_PLASTER
  const pTip = wallUDL(ctx, 'parapet') // brick parapet on the free edge, kN/m
  // design moment per metre width at the root (IS 456 cl 18.2): 1.5 x (slab dead + imposed + the parapet at the tip + the railing push)
  const MuK = (gk + BALCONY_LL) * lc * lc / 2 + pTip * lc + BALCONY_RULES.railKNperM * BALCONY_RULES.railHeightM
  const Mu = BALCONY_RULES.loadFactor * MuK
  const minAst = BALCONY_RULES.minSteelRatio * 1000 * D
  let warning: string | undefined
  const astFlex = astSingly(Mu * 1e6, 1000, d, ctx.fck)
  let ast = astFlex
  if (ast === null) {
    ast = (Mu * 1e6) / (0.87 * 500 * BALCONY_RULES.fallbackFactor * d)
    warning = 'A balcony reached the limit of a singly reinforced slab: a thicker slab or a higher grade of concrete would normally be chosen by the engineer.'
  }
  const mainT = spacingTrace(Math.max(ast, minAst), d)
  const main = mainT.pick
  // back-span: the top bars must be anchored in the room slab for at least the development length and never less than the projection
  const devLengthMm = devLength(main.phi, ctx.fck)
  const backSpanMm = Math.max(devLengthMm, lc * 1000)
  const bw = ctx.bBeam
  const mainLen = lc * 1000 - BALCONY_RULES.tipCoverMm + bw + backSpanMm + (D - BALCONY_RULES.tipBendLessMm) // tip cover, over the beam, back-span, bend down at the tip
  // distribution (cross) bars at 0.12 % of the section: 6 mm where the spacing stays at 100 mm or more, else 8 mm
  const astDist = BALCONY_RULES.minSteelRatio * 1000 * D
  let dPhi = 8
  let dS = 150
  const distTried: { phi: number; s: number }[] = []
  for (const phi of BALCONY_RULES.distPhis) {
    const a = (Math.PI * phi * phi) / 4
    const s = Math.floor((a * 1000) / astDist / BALCONY_RULES.distSpacingStep) * BALCONY_RULES.distSpacingStep
    distTried.push({ phi, s })
    if (s >= BALCONY_RULES.distAcceptMm || phi === 10) {
      dPhi = phi
      dS = Math.max(BALCONY_RULES.distSpacingFloorMm, Math.min(s, BALCONY_RULES.distSpacingCapMm)) // 200 mm: site practice, inside the IS 456 limit of 5d / 450 mm
      break
    }
  }

  let kg = 0
  let conc = 0
  let form = 0
  const slabs: GeoSlab[] = []
  const floors = new Set<number>()
  const perFloorCount = new Map<number, number>()
  let lenEach = 0
  const perSlab: BalconySlabDetail[] = []
  for (const sl of bc.slots) {
    lenEach = sl.lenM
    floors.add(sl.k)
    perFloorCount.set(sl.k, (perFloorCount.get(sl.k) ?? 0) + 1)
    const nMain = Math.floor((sl.lenM * 1000 - BALCONY_RULES.endAllowMm) / main.s) + 1
    const kgMain = book.add('balcony', main.phi, mainLen, nMain, 'balcony main bars, top')
    kg += kgMain
    const nDist = Math.floor((lc * 1000 + bw + backSpanMm - BALCONY_RULES.endAllowMm) / dS) + 1
    const kgDist = book.add('balcony', dPhi, sl.lenM * 1000 - BALCONY_RULES.distEndMm, nDist, 'balcony distribution bars')
    kg += kgDist
    const cSlab = sl.lenM * lc * (D / 1000)
    const fSlab = sl.lenM * lc + (sl.lenM + 2 * lc) * (D / 1000)
    conc += cSlab
    form += fSlab
    perSlab.push({ k: sl.k, lenM: sl.lenM, nMain, nDist, kgMain, kgDist, concreteM3: cSlab, formworkM2: fSlab })
    const fl = plan.floors[sl.k]
    const x0 = sl.ix * plan.sx + (plan.sx - sl.lenM) / 2
    const y0 = sl.side === 'front' ? -lc : sl.iy * plan.sy
    slabs.push({ x0, y0, x1: x0 + sl.lenM, y1: y0 + lc, floor: sl.k, zTop: fl.zTop, t: D / 1000, balcony: true })
  }
  const perFloor = Math.max(...perFloorCount.values())
  const result: BalconyResult = {
    count: bc.slots.length,
    floorsWith: floors.size,
    perFloor,
    projectionM: lc,
    lengthEachM: lenEach,
    thicknessMm: D,
    mainBars: `${main.phi} mm @ ${main.s} mm, top`,
    distributionBars: `${dPhi} mm @ ${dS} mm`,
    backSpanM: backSpanMm / 1000,
    concreteM3: conc,
    steelKg: kg,
    formworkM2: form,
    note:
      `Each balcony projects ${lc.toFixed(1)} m, ${lenEach.toFixed(1)} m along the wall, ${D} mm thick, carrying 3.0 kN/m2 and a 1 m brick parapet on its three edges. ` +
      `The top bars run ${(backSpanMm / 1000).toFixed(2)} m back into the floor slab. The slab is taken as continuous with the floor, so the supporting beam is designed for the balcony as a load. ` +
      'A balcony that does not continue into the floor slab needs its supporting beam designed for torsion by an engineer.',
  }
  const detail: BalconyDetail = { lc, D, d, gk, pTip, MuK, Mu, minAst, astFlex, ast, main: mainT, devLengthMm, backSpanMm, bw, mainLen, astDist, distTried, dPhi, dS, perSlab }
  return { detail, result, slabs, concreteM3: conc, formworkM2: form, steelKg: kg, warning }
}
