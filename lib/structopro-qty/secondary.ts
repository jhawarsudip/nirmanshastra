// Secondary RCC items that a frame analysis does not produce: lintels, sunshades (chajjas), the terrace parapet coping band and the stair head-room (mumty).
// Counts come from the plan perimeter and floor area; sizes and bar schedules are site-practice details (marked ASSUMPTION), not code-derived.

import { stirrupCutLength } from './codes'
import type { Plan } from './plan'
import type { SteelBook } from './steel'
import type { SecondaryItem } from './types'

export interface SecondaryInput {
  plan: Plan
  wallT: number // m, external wall thickness
  terraceAccess: boolean
  wellLengthM: number
  wellWidthM: number
  book: SteelBook
  /** open parking level: no windows, sunshades or doors at storey 0; the main door moves up to the first floor */
  stilt?: boolean
}

/** What the secondary items counted on each storey, kept so that a calculation sheet can show the working. */
export interface SecondaryFloorDetail {
  k: number
  /** perimeter of the storey after the floor-area correction, m */
  perimeter: number
  nWin: number
  mainDoor: boolean
  nInt: number
  /** false for an open parking level, which has no openings counted */
  counted: boolean
}

export interface SecondaryDetail {
  floors: SecondaryFloorDetail[]
  /** perimeter of the top storey, m */
  pTop: number
  mumty: { lx: number; ly: number; per: number } | null
}

export interface SecondaryResult {
  items: SecondaryItem[]
  concreteM3: number
  steelKg: number
  formworkM2: number
  detail: SecondaryDetail
}

// Opening model (ASSUMPTION, consistent with the 15 % opening deduction used for wall loads): one 1.2 m window every 3.6 m of external wall,
// one 1.2 m main door on the ground floor, one 1.0 m internal door per 13 m2 of floor.
/** Sizes and bar schedules of the secondary items, kept in one place so the calculation sheet reads the same values the counting uses. All site practice (ASSUMPTION). */
export const SECONDARY_RULES = {
  windowPitchM: 3.6,
  windowWidthM: 1.2,
  mainDoorWidthM: 1.2,
  internalDoorWidthM: 1.0,
  roomAreaM2: 13,
  /** every storey with openings has at least this many windows */
  minWindows: 2,
  /** bearing of a lintel on the wall each side of the opening, m */
  bearingM: 0.2,
  lintelDepthM: 0.15,
  /** an internal door sits in a partition this thick (m) */
  partitionT: 0.115,
  /** a lintel in a wall at least this thick (m) gets three bottom bars, else two */
  wideWallM: 0.2,
  lintelBottomPhi: 10,
  lintelTopPhi: 8,
  lintelStirrupPhi: 6,
  lintelStirrupPitchMm: 150,
  lintelEndMm: 50,
  lintelEdgeMm: 100,
  lintelCoverMm: 50,
  sunProjectionM: 0.45,
  sunThicknessM: 0.075,
  /** a sunshade is wider than its opening by 150 mm each side */
  sunExtraM: 0.3,
  sunMainPhi: 8,
  sunMainPitchMm: 150,
  sunAnchorMm: 350,
  sunDistPhi: 6,
  sunDistPitchMm: 200,
  parapetWidthM: 0.115,
  parapetThicknessM: 0.075,
  parapetBarPhi: 8,
  parapetBars: 2,
  /** laps and corners */
  parapetLapFactor: 1.05,
  parapetStirrupPhi: 6,
  parapetStirrupPitchMm: 250,
  parapetCoverMm: 50,
  mumtyWallOutM: 0.115,
  mumtyOverhangM: 0.3,
  mumtySlabT: 0.1,
  mumtySlabPhi: 8,
  mumtySlabPitchMm: 150,
  mumtyRingM: 0.23,
  mumtyRingBarPhi: 10,
  mumtyRingBars: 4,
  mumtyRingLapFactor: 1.05,
  mumtyRingStirrupPhi: 6,
  mumtyRingStirrupPitchMm: 150,
  mumtyRingCoverMm: 50,
  mumtyEndMm: 50,
  mumtyEdgeMm: 100,
} as const

const R = SECONDARY_RULES

function lintel(book: SteelBook, group: string, opening: number, width: number): { conc: number; form: number } {
  const L = opening + 2 * R.bearingM
  const wide = width >= R.wideWallM
  book.add(group, R.lintelBottomPhi, L * 1000 - R.lintelEndMm, wide ? 3 : 2, 'lintel bottom bars')
  book.add(group, R.lintelTopPhi, L * 1000 - R.lintelEndMm, 2, 'lintel top bars')
  const n = Math.floor((L * 1000 - R.lintelEdgeMm) / R.lintelStirrupPitchMm) + 1
  book.add(group, R.lintelStirrupPhi, stirrupCutLength(width * 1000 - R.lintelCoverMm, R.lintelDepthM * 1000 - R.lintelCoverMm, R.lintelStirrupPhi), n, 'lintel stirrups')
  return { conc: L * width * R.lintelDepthM, form: L * (width + 2 * R.lintelDepthM) }
}

function sunshade(book: SteelBook, group: string, opening: number): { conc: number; form: number } {
  const L = opening + R.sunExtraM
  const nMain = Math.floor((L * 1000 - R.lintelEdgeMm) / R.sunMainPitchMm) + 1
  book.add(group, R.sunMainPhi, R.sunProjectionM * 1000 + R.sunAnchorMm, nMain, 'sunshade main bars')
  const nDist = Math.floor((R.sunProjectionM * 1000) / R.sunDistPitchMm) + 1
  book.add(group, R.sunDistPhi, L * 1000 - R.lintelEndMm, nDist, 'sunshade distribution bars')
  return { conc: L * R.sunProjectionM * R.sunThicknessM, form: L * R.sunProjectionM + (L + 2 * R.sunProjectionM) * R.sunThicknessM }
}

export function secondaryItems(inp: SecondaryInput): SecondaryResult {
  const { plan, wallT, book } = inp
  const F = plan.F

  // ---- lintels and sunshades, floor by floor ----
  let lintelCount = 0
  let lintelC = 0
  let lintelF = 0
  let sunCount = 0
  let sunC = 0
  let sunF = 0
  const floorsDetail: SecondaryFloorDetail[] = []
  for (const f of plan.floors) {
    if (inp.stilt && f.k === 0) {
      floorsDetail.push({ k: f.k, perimeter: 0, nWin: 0, mainDoor: false, nInt: 0, counted: false })
      continue
    }
    const s = Math.sqrt(f.scale)
    const perimeter = 2 * (f.nx * plan.sx + f.ny * plan.sy) * s
    const nWin = Math.max(R.minWindows, Math.round(perimeter / R.windowPitchM))
    for (let i = 0; i < nWin; i++) {
      const l = lintel(book, 'lintel', R.windowWidthM, wallT)
      lintelC += l.conc
      lintelF += l.form
      lintelCount++
      const c = sunshade(book, 'sunshade', R.windowWidthM)
      sunC += c.conc
      sunF += c.form
      sunCount++
    }
    const mainDoor = f.k === (inp.stilt ? 1 : 0)
    if (mainDoor) {
      const l = lintel(book, 'lintel', R.mainDoorWidthM, wallT)
      lintelC += l.conc
      lintelF += l.form
      lintelCount++
      const c = sunshade(book, 'sunshade', R.mainDoorWidthM)
      sunC += c.conc
      sunF += c.form
      sunCount++
    }
    const nInt = Math.max(1, Math.round(f.areaM2 / R.roomAreaM2))
    for (let i = 0; i < nInt; i++) {
      const l = lintel(book, 'lintel', R.internalDoorWidthM, R.partitionT)
      lintelC += l.conc
      lintelF += l.form
      lintelCount++
    }
    floorsDetail.push({ k: f.k, perimeter, nWin, mainDoor, nInt, counted: true })
  }

  // ---- parapet coping band on the top floor perimeter ----
  const top = plan.floors[F - 1]
  const pTop = 2 * (top.nx * plan.sx + top.ny * plan.sy) * Math.sqrt(top.scale)
  book.add('parapet', R.parapetBarPhi, pTop * 1000 * R.parapetLapFactor, R.parapetBars, 'parapet band bars') // 5 % for laps and corners
  book.add('parapet', R.parapetStirrupPhi, stirrupCutLength(R.parapetWidthM * 1000 - R.parapetCoverMm, R.parapetThicknessM * 1000 - R.parapetCoverMm, R.parapetStirrupPhi), Math.floor((pTop * 1000) / R.parapetStirrupPitchMm) + 1, 'parapet band stirrups')
  const parC = pTop * R.parapetWidthM * R.parapetThicknessM
  const parF = pTop * (R.parapetWidthM + 2 * R.parapetThicknessM)

  // ---- stair head-room (mumty) ----
  let mumC = 0
  let mumS = 0
  let mumF = 0
  let mumDetail: SecondaryDetail['mumty'] = null
  const hasMumty = inp.terraceAccess
  if (hasMumty) {
    const wallOut = R.mumtyWallOutM // mumty walls are 115 mm; slab overhangs 150 mm
    const lx = inp.wellLengthM + 2 * wallOut + R.mumtyOverhangM
    const ly = inp.wellWidthM + 2 * wallOut + R.mumtyOverhangM
    const t = R.mumtySlabT
    // roof slab: 8 mm @ 150 both ways at the bottom (>= 0.12 % of 100 mm) plus 8 mm @ 200 top edge strips on the two long sides
    const before = book.total()
    book.add('mumty', R.mumtySlabPhi, lx * 1000 - R.mumtyEndMm, Math.floor((ly * 1000 - R.mumtyEdgeMm) / R.mumtySlabPitchMm) + 1, 'mumty roof bars along the length')
    book.add('mumty', R.mumtySlabPhi, ly * 1000 - R.mumtyEndMm, Math.floor((lx * 1000 - R.mumtyEdgeMm) / R.mumtySlabPitchMm) + 1, 'mumty roof bars along the width')
    // ring beam 230 x 230 at roof level: 4-10 with 6 mm @ 150
    const per = 2 * (inp.wellLengthM + inp.wellWidthM + 4 * wallOut)
    book.add('mumty', R.mumtyRingBarPhi, per * 1000 * R.mumtyRingLapFactor, R.mumtyRingBars, 'mumty ring beam bars')
    book.add('mumty', R.mumtyRingStirrupPhi, stirrupCutLength(230 - R.mumtyRingCoverMm, 230 - R.mumtyRingCoverMm, R.mumtyRingStirrupPhi), Math.floor((per * 1000) / R.mumtyRingStirrupPitchMm) + 1, 'mumty ring beam stirrups')
    mumS = book.total() - before
    mumC = lx * ly * t + per * 0.23 * 0.23
    mumF = lx * ly + 2 * per * 0.23 + per * 0.23
    mumDetail = { lx, ly, per }
  }

  const items: SecondaryItem[] = [
    {
      key: 'lintels',
      label: 'Lintels over doors and windows',
      count: lintelCount,
      concreteM3: lintelC,
      steelKg: book.group('lintel'),
      formworkM2: lintelF,
      basis: `${R.lintelDepthM * 1000} mm deep, ${R.bearingM * 1000} mm bearing each side; ${R.windowWidthM} m windows every ${R.windowPitchM} m of outer wall, one door per ${R.roomAreaM2} m2. Site practice: ASSUMPTION.`,
    },
    {
      key: 'sunshades',
      label: 'Sunshades (chajjas)',
      count: sunCount,
      concreteM3: sunC,
      steelKg: book.group('sunshade'),
      formworkM2: sunF,
      basis: `${R.sunProjectionM * 1000} mm projection, ${R.sunThicknessM * 1000} mm thick, 8 mm @ 150 main and 6 mm @ 200 distribution over every window and the main door. Site practice: ASSUMPTION.`,
    },
    {
      key: 'parapet',
      label: 'Terrace parapet coping band',
      count: 1,
      concreteM3: parC,
      steelKg: book.group('parapet'),
      formworkM2: parF,
      basis: `${R.parapetWidthM * 1000} x ${R.parapetThicknessM * 1000} mm band with 2-8 and 6 mm @ 250 along the roof edge. Site practice: ASSUMPTION.`,
    },
  ]
  if (hasMumty) {
    items.push({
      key: 'mumty',
      label: 'Stair head-room (mumty) roof',
      count: 1,
      concreteM3: mumC,
      steelKg: book.group('mumty'),
      formworkM2: mumF,
      basis: '100 mm roof slab with 8 mm @ 150 each way and a 230 x 230 mm ring beam (4-10, 6 mm @ 150) over the stair well. Site practice: ASSUMPTION.',
    })
  }
  void mumS
  return {
    items,
    concreteM3: items.reduce((s, i) => s + i.concreteM3, 0),
    steelKg: items.reduce((s, i) => s + i.steelKg, 0),
    formworkM2: items.reduce((s, i) => s + i.formworkM2, 0),
    detail: { floors: floorsDetail, pTop, mumty: mumDetail },
  }
}
