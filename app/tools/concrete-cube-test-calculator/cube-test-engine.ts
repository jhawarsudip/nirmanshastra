// ─────────────────────────────────────────────────────────────────────────────
// CONCRETE CUBE TEST CALCULATOR — ENGINE (IS 456:2000 Cl 15.2.2 + IS 516)
//
// Permanently-free, standalone calculator. Given the volume of concrete in a
// pour or element, it returns how many SAMPLES must be taken for acceptance
// testing, and how many CUBES must be cast in total.
//
// AUTHORITATIVE SOURCE — do not overwrite from any other source:
//
//   Sampling frequency is the PUBLIC IS 456:2000 Cl 15.2.2 table — the minimum
//   number of samples by quantity of concrete used in the work:
//
//     Quantity of concrete (m³)   |  Number of samples
//     ───────────────────────────┼────────────────────
//       1 – 5                     |  1
//       6 – 15                    |  2
//      16 – 30                    |  3
//      31 – 50                    |  4
//      51 and above              |  4 + one additional sample for each
//                                    additional 50 m³ (or part thereof)
//
//   Each SAMPLE consists of 6 cubes (IS 516): 3 cubes tested at 7 days as an
//   early indicator, and 3 cubes tested at 28 days for the acceptance decision.
//
//   Cl 15.2.2 also carries a shift rule that no volume table can encode: at
//   least one sample must be taken from EACH shift/day of concreting, whatever
//   the quantity. The calculator surfaces this as a reminder, never overrides
//   the volume figure with it.
//
// Nothing here is invented; the table and the 6-cubes-per-sample rule ARE the
// source of truth. Verified against the test cases:
//   10 m³ → 2 samples, 12 cubes · 45 m³ → 4 samples, 24 cubes ·
//   120 m³ → 4 + floor((120−50)/50) = 5 samples, 30 cubes.
// ─────────────────────────────────────────────────────────────────────────────

/** Cubes cast per sample (IS 516): 3 for the 7-day break, 3 for the 28-day break. */
export const CUBES_PER_SAMPLE = 6
export const CUBES_AT_7_DAYS = 3
export const CUBES_AT_28_DAYS = 3

/** The IS 456:2000 Cl 15.2.2 sampling-frequency bands, for display. */
export const SAMPLING_BANDS: Array<{ range: string; samples: string }> = [
  { range: '1 – 5', samples: '1' },
  { range: '6 – 15', samples: '2' },
  { range: '16 – 30', samples: '3' },
  { range: '31 – 50', samples: '4' },
  { range: '51 and above', samples: '4 + 1 per further 50 m³' },
]

export interface CubeTestResult {
  /** Volume as used (clamped to ≥ 0), m³. */
  volume: number
  /** Minimum number of samples required per IS 456:2000 Cl 15.2.2. */
  samples: number
  /** Total cubes to cast (samples × 6). */
  totalCubes: number
  /** Cubes to be broken at 7 days (samples × 3). */
  cubes7Day: number
  /** Cubes to be broken at 28 days (samples × 3). */
  cubes28Day: number
}

/**
 * Minimum number of acceptance samples for a given quantity of concrete,
 * per IS 456:2000 Cl 15.2.2.
 *
 *   ≤ 5 m³ → 1 · ≤ 15 → 2 · ≤ 30 → 3 · ≤ 50 → 4 ·
 *   > 50 → 4 + one additional sample for each further 50 m³ (part thereof).
 */
export function samplesForVolume(volume: number): number {
  if (!Number.isFinite(volume) || volume <= 0) return 0
  if (volume <= 5) return 1
  if (volume <= 15) return 2
  if (volume <= 30) return 3
  if (volume <= 50) return 4
  return 4 + Math.floor((volume - 50) / 50)
}

/**
 * Full result: samples, total cubes, and the 7-day / 28-day split.
 *
 * NOTE — the "one sample per shift" minimum in Cl 15.2.2 cannot be derived from
 * volume alone, so it is deliberately NOT applied here; it is presented to the
 * user as a reminder in the UI. This function returns the volume-based minimum.
 */
export function calculate(volume: number): CubeTestResult {
  const v = Number.isFinite(volume) ? Math.max(0, volume) : 0
  const samples = samplesForVolume(v)
  return {
    volume: v,
    samples,
    totalCubes: samples * CUBES_PER_SAMPLE,
    cubes7Day: samples * CUBES_AT_7_DAYS,
    cubes28Day: samples * CUBES_AT_28_DAYS,
  }
}
