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

export interface SecondaryResult {
  items: SecondaryItem[]
  concreteM3: number
  steelKg: number
  formworkM2: number
}

// Opening model (ASSUMPTION, consistent with the 15 % opening deduction used for wall loads): one 1.2 m window every 3.6 m of external wall,
// one 1.2 m main door on the ground floor, one 1.0 m internal door per 13 m2 of floor.
const WINDOW_PITCH = 3.6
const WINDOW_W = 1.2
const MAIN_DOOR_W = 1.2
const INT_DOOR_W = 1.0
const ROOM_AREA = 13
const BEARING = 0.2 // m each side of a lintel
const LINTEL_D = 0.15
const SUN_PROJ = 0.45
const SUN_T = 0.075
const SUN_EXTRA = 0.3 // sunshade is wider than the window by 150 mm each side
const PARAPET_W = 0.115
const PARAPET_T = 0.075

function lintel(book: SteelBook, group: string, opening: number, width: number): { conc: number; form: number } {
  const L = opening + 2 * BEARING
  const wide = width >= 0.2
  book.add(group, 10, L * 1000 - 50, wide ? 3 : 2)
  book.add(group, 8, L * 1000 - 50, 2)
  const n = Math.floor((L * 1000 - 100) / 150) + 1
  book.add(group, 6, stirrupCutLength(width * 1000 - 50, LINTEL_D * 1000 - 50, 6), n)
  return { conc: L * width * LINTEL_D, form: L * (width + 2 * LINTEL_D) }
}

function sunshade(book: SteelBook, group: string, opening: number): { conc: number; form: number } {
  const L = opening + SUN_EXTRA
  const nMain = Math.floor((L * 1000 - 100) / 150) + 1
  book.add(group, 8, SUN_PROJ * 1000 + 350, nMain)
  const nDist = Math.floor((SUN_PROJ * 1000) / 200) + 1
  book.add(group, 6, L * 1000 - 50, nDist)
  return { conc: L * SUN_PROJ * SUN_T, form: L * SUN_PROJ + (L + 2 * SUN_PROJ) * SUN_T }
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
  for (const f of plan.floors) {
    if (inp.stilt && f.k === 0) continue
    const s = Math.sqrt(f.scale)
    const perimeter = 2 * (f.nx * plan.sx + f.ny * plan.sy) * s
    const nWin = Math.max(2, Math.round(perimeter / WINDOW_PITCH))
    for (let i = 0; i < nWin; i++) {
      const l = lintel(book, 'lintel', WINDOW_W, wallT)
      lintelC += l.conc
      lintelF += l.form
      lintelCount++
      const c = sunshade(book, 'sunshade', WINDOW_W)
      sunC += c.conc
      sunF += c.form
      sunCount++
    }
    if (f.k === (inp.stilt ? 1 : 0)) {
      const l = lintel(book, 'lintel', MAIN_DOOR_W, wallT)
      lintelC += l.conc
      lintelF += l.form
      lintelCount++
      const c = sunshade(book, 'sunshade', MAIN_DOOR_W)
      sunC += c.conc
      sunF += c.form
      sunCount++
    }
    const nInt = Math.max(1, Math.round(f.areaM2 / ROOM_AREA))
    for (let i = 0; i < nInt; i++) {
      const l = lintel(book, 'lintel', INT_DOOR_W, 0.115)
      lintelC += l.conc
      lintelF += l.form
      lintelCount++
    }
  }

  // ---- parapet coping band on the top floor perimeter ----
  const top = plan.floors[F - 1]
  const pTop = 2 * (top.nx * plan.sx + top.ny * plan.sy) * Math.sqrt(top.scale)
  book.add('parapet', 8, pTop * 1000 * 1.05, 2) // 5 % for laps and corners
  book.add('parapet', 6, stirrupCutLength(PARAPET_W * 1000 - 50, PARAPET_T * 1000 - 50, 6), Math.floor((pTop * 1000) / 250) + 1)
  const parC = pTop * PARAPET_W * PARAPET_T
  const parF = pTop * (PARAPET_W + 2 * PARAPET_T)

  // ---- stair head-room (mumty) ----
  let mumC = 0
  let mumS = 0
  let mumF = 0
  const hasMumty = inp.terraceAccess
  if (hasMumty) {
    const wallOut = 0.115 // mumty walls are 115 mm; slab overhangs 150 mm
    const lx = inp.wellLengthM + 2 * wallOut + 0.3
    const ly = inp.wellWidthM + 2 * wallOut + 0.3
    const t = 0.1
    // roof slab: 8 mm @ 150 both ways at the bottom (>= 0.12 % of 100 mm) plus 8 mm @ 200 top edge strips on the two long sides
    const before = book.total()
    book.add('mumty', 8, lx * 1000 - 50, Math.floor((ly * 1000 - 100) / 150) + 1)
    book.add('mumty', 8, ly * 1000 - 50, Math.floor((lx * 1000 - 100) / 150) + 1)
    // ring beam 230 x 230 at roof level: 4-10 with 6 mm @ 150
    const per = 2 * (inp.wellLengthM + inp.wellWidthM + 4 * wallOut)
    book.add('mumty', 10, per * 1000 * 1.05, 4)
    book.add('mumty', 6, stirrupCutLength(230 - 50, 230 - 50, 6), Math.floor((per * 1000) / 150) + 1)
    mumS = book.total() - before
    mumC = lx * ly * t + per * 0.23 * 0.23
    mumF = lx * ly + 2 * per * 0.23 + per * 0.23
  }

  const items: SecondaryItem[] = [
    {
      key: 'lintels',
      label: 'Lintels over doors and windows',
      count: lintelCount,
      concreteM3: lintelC,
      steelKg: book.group('lintel'),
      formworkM2: lintelF,
      basis: `${LINTEL_D * 1000} mm deep, ${BEARING * 1000} mm bearing each side; ${WINDOW_W} m windows every ${WINDOW_PITCH} m of outer wall, one door per ${ROOM_AREA} m2. Site practice: ASSUMPTION.`,
    },
    {
      key: 'sunshades',
      label: 'Sunshades (chajjas)',
      count: sunCount,
      concreteM3: sunC,
      steelKg: book.group('sunshade'),
      formworkM2: sunF,
      basis: `${SUN_PROJ * 1000} mm projection, ${SUN_T * 1000} mm thick, 8 mm @ 150 main and 6 mm @ 200 distribution over every window and the main door. Site practice: ASSUMPTION.`,
    },
    {
      key: 'parapet',
      label: 'Terrace parapet coping band',
      count: 1,
      concreteM3: parC,
      steelKg: book.group('parapet'),
      formworkM2: parF,
      basis: `${PARAPET_W * 1000} x ${PARAPET_T * 1000} mm band with 2-8 and 6 mm @ 250 along the roof edge. Site practice: ASSUMPTION.`,
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
  }
}
