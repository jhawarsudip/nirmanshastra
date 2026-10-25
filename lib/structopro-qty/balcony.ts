// Balcony cantilever slabs: moment, bars, concrete and formwork. The slab is taken as a continuation of the floor slab (the top bars run on into the room),
// so the supporting beam sees the balcony as a load and the twisting is compatibility torsion, which IS 456 cl 41.1 does not ask to be designed for.
// Where a balcony stands on its own with no back-span the engineer must design the supporting beam for torsion: this is stated in the report.
//
// Sources: IS 456 cl 23.2.1 (cantilever span/depth 7), cl 26.2.1 (development length), cl 26.5.2.1 (0.12 % minimum steel);
// IS 875 (Part 2) Table 1 (3.0 kN/m2 on balconies). Bar spacing and the back-span length are site practice and a code rule respectively (see below).

import { COVER_SLAB, astSingly, devLength } from './codes'
import { BALCONY_LL } from './plan'
import { CEILING_PLASTER, Ctx, FLOOR_FINISH, wallUDL } from './frame'
import { chooseSpacing } from './slab'
import { SteelBook } from './steel'
import { GAMMA_RC } from './codes'
import type { BalconyResult, GeoSlab } from './types'

/** Horizontal load on the railing, kN/m, acting 1.0 m above the slab: IS 875 (Part 2) cl 4.2, residential. RECONSTRUCTED. */
const RAIL_H = 0.35
const RAIL_HEIGHT = 1.0

export interface BalconyOut {
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
  const d = D - COVER_SLAB - 5
  const gk = GAMMA_RC * (D / 1000) + FLOOR_FINISH + CEILING_PLASTER
  const pTip = wallUDL(ctx, 'parapet') // brick parapet on the free edge, kN/m
  // design moment per metre width at the root (IS 456 cl 18.2): 1.5 x (slab dead + imposed + the parapet at the tip + the railing push)
  const MuK = (gk + BALCONY_LL) * lc * lc / 2 + pTip * lc + RAIL_H * RAIL_HEIGHT
  const Mu = 1.5 * MuK
  const minAst = 0.0012 * 1000 * D
  let warning: string | undefined
  let ast = astSingly(Mu * 1e6, 1000, d, ctx.fck)
  if (ast === null) {
    ast = (Mu * 1e6) / (0.87 * 500 * 0.8 * d)
    warning = 'A balcony reached the limit of a singly reinforced slab: a thicker slab or a higher grade of concrete would normally be chosen by the engineer.'
  }
  const main = chooseSpacing(Math.max(ast, minAst), d)
  // back-span: the top bars must be anchored in the room slab for at least the development length and never less than the projection
  const backSpanMm = Math.max(devLength(main.phi, ctx.fck), lc * 1000)
  const bw = ctx.bBeam
  const mainLen = lc * 1000 - 25 + bw + backSpanMm + (D - 40) // tip cover, over the beam, back-span, bend down at the tip
  // distribution (cross) bars at 0.12 % of the section: 6 mm where the spacing stays at 100 mm or more, else 8 mm
  const astDist = 0.0012 * 1000 * D
  let dPhi = 8
  let dS = 150
  for (const phi of [6, 8, 10]) {
    const a = (Math.PI * phi * phi) / 4
    const s = Math.floor((a * 1000) / astDist / 25) * 25
    if (s >= 100 || phi === 10) {
      dPhi = phi
      dS = Math.max(75, Math.min(s, 200)) // 200 mm: site practice, inside the IS 456 limit of 5d / 450 mm
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
  for (const sl of bc.slots) {
    lenEach = sl.lenM
    floors.add(sl.k)
    perFloorCount.set(sl.k, (perFloorCount.get(sl.k) ?? 0) + 1)
    const nMain = Math.floor((sl.lenM * 1000 - 100) / main.s) + 1
    kg += book.add('balcony', main.phi, mainLen, nMain)
    const nDist = Math.floor((lc * 1000 + bw + backSpanMm - 100) / dS) + 1
    kg += book.add('balcony', dPhi, sl.lenM * 1000 - 50, nDist)
    conc += sl.lenM * lc * (D / 1000)
    form += sl.lenM * lc + (sl.lenM + 2 * lc) * (D / 1000)
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
  return { result, slabs, concreteM3: conc, formworkM2: form, steelKg: kg, warning }
}
