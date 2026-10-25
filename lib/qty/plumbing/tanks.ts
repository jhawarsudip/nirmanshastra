/*
  Water storage: how a day's demand is split between tanks, and which ready-made size holds each part.

  The PlumbingPro model and the free Water Tank Size calculator both call these two functions, so the free
  page and the paid report cannot give different tanks for the same house.

  The split follows NBC Part 9 Section 1 (BIS draft of Nov 2024), cl 4.4.10 notes (a) to (c), which carry the
  IS 12183 and IS 2065 storage rules:
    municipal   an underground tank of two-thirds of a day and an overhead tank of one-third (note c, CLEAR)
    borewell    an overhead tank only; the draft allows one-third to one-half of a day (note a, CLEAR), the half is used
    tanker      a day and a half underground and a third of a day overhead (the draft's apartment clause is unclear
                about which tank holds which part: RECONSTRUCTED)
  Fire reserve is not counted (IS 12183 cl 8.6 refers it to NBC Part 4).
*/

import { ceilTo } from '../util'
import { STANDARD_TANK_SIZES } from './constants'

export type WaterSource = 'municipal' | 'borewell' | 'tanker'

/** Litres a day's demand needs in each tank. Zero means that tank is not fitted. */
export function tankSplit(water: WaterSource, demandL: number): { ugtL: number; ohtL: number } {
  if (water === 'municipal') return { ugtL: (2 / 3) * demandL, ohtL: (1 / 3) * demandL }
  if (water === 'tanker') return { ugtL: 1.5 * demandL, ohtL: (1 / 3) * demandL }
  return { ugtL: 0, ohtL: 0.5 * demandL }
}

/** Round a tank requirement up to a size that is sold. Above the largest ready tank, a ready tank in equal parts, or a built tank. */
export function tankPlan(litres: number, underground: boolean): { each: number; count: number; kind: string } {
  const largest = STANDARD_TANK_SIZES[STANDARD_TANK_SIZES.length - 1]
  if (litres <= largest) return { each: STANDARD_TANK_SIZES.find((s) => litres <= s) ?? largest, count: 1, kind: 'ready-made tank' }
  if (underground) return { each: ceilTo(litres, 500), count: 1, kind: 'built sump (RCC or masonry), internal volume' }
  const count = Math.ceil(litres / largest)
  const per = litres / count
  return { each: STANDARD_TANK_SIZES.find((s) => per <= s) ?? largest, count, kind: 'ready-made tanks' }
}
