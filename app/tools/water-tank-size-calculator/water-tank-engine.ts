// ─────────────────────────────────────────────────────────────────────────────
// WATER TANK SIZE — CALCULATOR ENGINE (IS 1172:1993)
//
// Permanently-free, standalone calculator. The core water-demand and storage
// math is PORTED verbatim from the paid PlumbingPro tool
// (app/tools/plumbpro/plumbpro-engine.ts) so the two never disagree:
//
//   • Per-capita demand  — IS 1172:1993, LOCKED (Build Reference Section 8):
//       municipal = 135 LPCD · borewell = 150 LPCD
//   • Storage ratio      — IS 1172:1993, LOCKED:
//       total tank capacity = daily demand × 0.67  ("2/3 daily demand")
//
// The single-day case here reproduces PlumbingPro's OHT figure exactly.
//
// TWO PIECES OF LOGIC BELOW ARE GENUINELY NEW — they are NOT in PlumbingPro and
// are not drawn from any IS clause. They are transparent engineering helpers:
//
//   1. Multi-day storage multiplier — for intermittent-supply areas that do not
//      receive water every day, total storage is scaled by the number of days a
//      household must ride through between supplies. Default 1 day, which
//      collapses to PlumbingPro's single-day baseline exactly.
//
//   2. Nearest standard commercial tank size — total storage is rounded UP to
//      the next size actually sold off the shelf. We always round UP, never
//      down: undersizing a tank causes dry taps, which is the failure mode
//      IS 1172:1993 Cl 6 and the PlumbingPro reminders warn against.
// ─────────────────────────────────────────────────────────────────────────────

// Per-capita demand — imported from the paid engine so the LOCKED IS 1172:1993
// values remain single-source-of-truth and can never drift between tools.
import { WATER_DEMAND_LPCD } from '../plumbpro/plumbpro-engine'

export { WATER_DEMAND_LPCD }

// Storage ratio — IS 1172:1993 (LOCKED). Mirrors the private TANK_RATIO in
// plumbpro-engine.ts. Total stored water = daily demand × 0.67 (2/3 of a day).
export const TANK_RATIO = 0.67

export type WaterSource = 'municipal' | 'borewell'

// Standard commercial tank sizes sold in India (litres). Round-UP targets only.
// NEW LOGIC — not present in PlumbingPro. See header note (2).
export const STANDARD_TANK_SIZES = [500, 1000, 1500, 2000, 3000, 5000] as const

export interface WaterTankInput {
  occupants: number // direct input — NOT derived from bathroom count (differs
  //                   from PlumbingPro's UI, which derives occupants from
  //                   bathrooms; the underlying IS 1172:1993 math is identical)
  waterSource: WaterSource
  storageDays: number // number of days of storage needed. Default 1.
}

export interface WaterTankResult {
  occupants: number
  lpcd: number
  storageDays: number
  dailyDemandL: number // occupants × LPCD  (litres/day)
  totalStorageL: number // dailyDemand × 0.67 × storageDays  (litres, rounded)
  nearestTankL: number | null // next standard size ≥ totalStorage (rounded UP)
  exceedsLargest: boolean // true when demand is above the largest single tank
}

/**
 * Round a required storage figure UP to the nearest standard commercial tank
 * size. Returns null (and the caller reads exceedsLargest) when the requirement
 * is larger than the biggest single off-the-shelf tank — because rounding down
 * would silently undersize the tank.
 *
 * NEW LOGIC — not in PlumbingPro.
 */
export function nearestStandardTank(requiredL: number): number | null {
  for (const size of STANDARD_TANK_SIZES) {
    if (requiredL <= size) return size
  }
  return null
}

export function calculate(input: WaterTankInput): WaterTankResult {
  const occupants = Math.max(1, Math.floor(input.occupants) || 0)
  const storageDays = Math.max(1, Math.floor(input.storageDays) || 1)
  const lpcd = WATER_DEMAND_LPCD[input.waterSource]

  // ── PORTED from PlumbingPro (IS 1172:1993, LOCKED) ──────────────────────────
  const dailyDemandL = occupants * lpcd
  // Single-day storage: identical to PlumbingPro's totalTankL.
  const singleDayStorageL = dailyDemandL * TANK_RATIO
  // ── NEW: multi-day multiplier for intermittent supply ───────────────────────
  const totalStorageL = Math.round(singleDayStorageL * storageDays)

  // ── NEW: round UP to the nearest standard commercial tank ───────────────────
  const nearestTankL = nearestStandardTank(totalStorageL)

  return {
    occupants,
    lpcd,
    storageDays,
    dailyDemandL,
    totalStorageL,
    nearestTankL,
    exceedsLargest: nearestTankL === null,
  }
}
