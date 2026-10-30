// ─────────────────────────────────────────────────────────────────────────────
// WATER TANK SIZE — CALCULATOR ENGINE
//
// Free, standalone calculator: how many people live in the house and where the water comes from give the water the
// house uses in a day, and the size of the underground and overhead tanks that hold it.
//
// ONE SOURCE: the litres per person and the way a day's water is split between tanks come from lib/qty/plumbing
// (constants.ts and tanks.ts), the same code the PlumbingPro model runs, so this page and the paid report give the same
// tanks for the same house.
//
//   Water used: 135 litres per person per day (IS 1172:1993, a house with flushing toilets); 150 for a house on its own
//               borewell, the lowest figure IS 1172 gives for a town of over a lakh people (a choice the model makes).
//   Storage:    NBC Part 9 Section 1 draft (Nov 2024), cl 4.4.10 notes (a) to (c), carrying IS 12183 and IS 2065.
//                 municipal  underground tank 2/3 of a day, overhead tank 1/3 of a day
//                 borewell   overhead tank only, 1/2 of a day
//                 tanker     underground tank 1 1/2 days, overhead tank 1/3 of a day (the draft is unclear on this split)
//   Sizes:      rounded UP to 500, 1,000, 1,500, 2,000, 3,000 or 5,000 litres. No standard lists ready-tank sizes, so the
//               list is an assumption. Above 5,000 litres underground, a built sump; overhead, equal ready tanks.
//
// The old version of this page stored "two-thirds of a day" in one tank and called it an IS 1172 rule. The two-thirds
// is the underground share of the NBC split, not a whole-house rule, and the old "days of storage" multiplier was not in
// any standard, so both were retired.
// ─────────────────────────────────────────────────────────────────────────────

import { WATER_DEMAND_LPCD, STANDARD_TANK_SIZES } from '@/lib/qty/plumbing/constants'
import { tankSplit, tankPlan, type WaterSource } from '@/lib/qty/plumbing/tanks'

export { WATER_DEMAND_LPCD, STANDARD_TANK_SIZES }
export type { WaterSource }

export const SOURCE_ORDER: WaterSource[] = ['municipal', 'borewell', 'tanker']

export const SOURCE_LABEL: Record<WaterSource, string> = {
  municipal: 'Piped supply from the town (municipal)',
  borewell: 'Your own borewell',
  tanker: 'Tanker, bought in lots',
}

/** Where the water is held, as a share of one day's use. */
export const SHARES: Record<WaterSource, { ugt: number; oht: number }> = {
  municipal: { ugt: 2 / 3, oht: 1 / 3 },
  borewell: { ugt: 0, oht: 1 / 2 },
  tanker: { ugt: 3 / 2, oht: 1 / 3 },
}

export interface WaterTankInput {
  people: number // everyone who lives in the house
  water: WaterSource
}

export interface TankChoice {
  neededL: number // litres the NBC split asks for
  each: number // litres of each tank to buy
  count: number
  totalL: number // each × count
  kind: string
}

export interface WaterTankResult {
  people: number
  water: WaterSource
  lpcd: number
  dailyDemandL: number
  ugt: TankChoice | null
  oht: TankChoice
  totalL: number // litres of tank to buy, both together
}

function choice(neededL: number, underground: boolean): TankChoice {
  const p = tankPlan(neededL, underground)
  return { neededL, each: p.each, count: p.count, totalL: p.each * p.count, kind: p.kind }
}

/**
 * Checked by hand: 5 people on piped supply use 5 × 135 = 675 L a day. Underground 2/3 × 675 = 450 L → 500 L tank;
 * overhead 1/3 × 675 = 225 L → 500 L tank. 8 people on a borewell use 8 × 150 = 1,200 L; overhead 600 L → 1,000 L.
 */
export function calculate(input: WaterTankInput): WaterTankResult {
  const people = Math.max(1, Math.floor(input.people) || 0)
  const lpcd = WATER_DEMAND_LPCD[input.water === 'borewell' ? 'borewell' : 'municipal']
  const dailyDemandL = people * lpcd
  const { ugtL, ohtL } = tankSplit(input.water, dailyDemandL)
  const ugt = ugtL > 0 ? choice(ugtL, true) : null
  const oht = choice(ohtL, false)
  return { people, water: input.water, lpcd, dailyDemandL, ugt, oht, totalL: (ugt ? ugt.totalL : 0) + oht.totalL }
}
