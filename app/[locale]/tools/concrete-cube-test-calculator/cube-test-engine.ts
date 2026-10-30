// ─────────────────────────────────────────────────────────────────────────────
// CONCRETE CUBE TEST — SAMPLE COUNTER (IS 456:2000 cl 15)
//
// Free, standalone calculator: the volume of concrete of one grade in the work gives the number of samples to take and
// the cubes to cast.
//
//   Samples   IS 456:2000 cl 15.2.2, the table of the minimum frequency of sampling of concrete of each grade:
//               1 to 5 m³      1 sample
//               6 to 15 m³     2 samples
//               16 to 30 m³    3 samples
//               31 to 50 m³    4 samples
//               51 m³ and over 4 samples, plus one more for each additional 50 m³ OR PART THEREOF
//             (checked against the table as quoted by NPTEL and Testbook, Oct 2026).
//   Cubes     Three test specimens are made for each sample and tested at 28 days (IS 456 cl 15.3; IS 516). The page also
//             shows the count with three more cubes for a 7-day check, which IS 456 allows as additional cubes but does not
//             ask for.
//   Shifts    At least one sample is taken from each shift of concreting; ready-mixed concrete plants may agree another
//             frequency. That depends on how the pour runs, so it is shown as a reminder and not added to the count.
//
// The old version of this page rounded the extra samples DOWN (floor), so 120 m³ gave 5 samples where the table gives 6
// ("or part thereof" was left out), and it counted 6 cubes a sample as if IS 456 asked for 7-day cubes. Both are fixed.
// ─────────────────────────────────────────────────────────────────────────────

/** Test specimens a sample is made of, tested at 28 days (IS 456 cl 15.3). */
export const CUBES_PER_SAMPLE = 3
/** Optional extra cubes a sample, for a 7-day check. Not asked for by IS 456. */
export const EXTRA_CUBES_PER_SAMPLE = 3

/** The IS 456:2000 cl 15.2.2 sampling-frequency bands, for display. */
export const SAMPLING_BANDS: Array<{ range: string; samples: string }> = [
  { range: '1 to 5', samples: '1' },
  { range: '6 to 15', samples: '2' },
  { range: '16 to 30', samples: '3' },
  { range: '31 to 50', samples: '4' },
  { range: '51 and over', samples: '4, and 1 more for each further 50 m³ or part of it' },
]

export interface CubeTestResult {
  /** Volume as used (clamped to 0 or more), m³. */
  volume: number
  /** Minimum number of samples, IS 456 cl 15.2.2. */
  samples: number
  /** Cubes to cast and break at 28 days: 3 a sample. */
  cubes28: number
  /** The same, with 3 more cubes a sample for a 7-day check. */
  cubesWithEarly: number
  /** Cubes cast for the 7-day check alone. */
  cubesEarly: number
}

/**
 * Minimum number of samples for a quantity of concrete of one grade (IS 456 cl 15.2.2).
 * Checked by hand: 3 m³ → 1 · 10 → 2 · 30 → 3 · 45 → 4 · 50 → 4 · 51 → 5 · 100 → 5 · 101 → 6 · 120 → 4 + ceil(70/50) = 6.
 */
export function samplesForVolume(volume: number): number {
  if (!Number.isFinite(volume) || volume <= 0) return 0
  if (volume <= 5) return 1
  if (volume <= 15) return 2
  if (volume <= 30) return 3
  if (volume <= 50) return 4
  return 4 + Math.ceil((volume - 50) / 50 - 1e-9)
}

export function calculate(volume: number): CubeTestResult {
  const v = Number.isFinite(volume) ? Math.max(0, volume) : 0
  const samples = samplesForVolume(v)
  return {
    volume: v,
    samples,
    cubes28: samples * CUBES_PER_SAMPLE,
    cubesWithEarly: samples * (CUBES_PER_SAMPLE + EXTRA_CUBES_PER_SAMPLE),
    cubesEarly: samples * EXTRA_CUBES_PER_SAMPLE,
  }
}
