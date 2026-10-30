// ─────────────────────────────────────────────────────────────────────────────
// BAR BENDING — CUTTING LENGTH ENGINE
//
// Free, standalone calculator: the length to cut and the weight of one bar shape. It uses the SAME rules as the
// StructurePro model (lib/structopro-qty/codes.ts and steel.ts), so the bars you work out here agree with the bar
// bending schedule behind a paid report.
//
//   Weight             d² / 162.2 kg a metre (d in mm): 0.00785 kg per mm² per metre, IS 1786:2008 cl 3.6.
//                      It reproduces the IS 1786 Table 1 masses: 8 mm 0.395, 12 mm 0.888, 16 mm 1.58, 20 mm 2.47.
//   Rounding           A cut length is rounded UP to the next 25 mm (IS 2502 cl 5.1.1).
//   Right-angle bend   Dimensions are taken out-to-out of the bar. A 90° bend bent round a pin of radius 4d (the radius the
//                      model uses for main bars) takes 3d off the sum of the two legs (IS 2502 Table V:
//                      A + E − R/2 − d, RECONSTRUCTED). The same geometry gives 2(R+d)·tan(θ/2) − (R+d/2)·θ,
//                      which is 2.93d at 90° and 0.61d at 45°.
//   Crank at 45°       The slope is 1.414 × the rise instead of 1 × the rise: the bar is 0.414 × the rise longer than its
//                      end-to-end length, less the two 45° bend deductions.
//   Closed stirrup     2(A + B) + 12d with 135° hooks, A and B out-to-out. DERIVED from the bar's own geometry (see
//                      stirrupCutLength in codes.ts): centre-line rectangle, less the three 90° corners and two 135° bends at a
//                      2d pin radius, plus two 10d hook tails (never under 75 mm, IS 13920 cl 6.3.1), so a small bar gets the
//                      extra to reach 75 mm. It agrees with the Bar Bending Schedule workbook at its 12d seismic-hook setting.
//   Steel to buy       the weight placed × 1.05: the 5% procurement allowance of CPWD DAR 2014, item 5.22.1.
//
// History: an earlier version used 2(A + B) + 24d, which the project labelled "IS 2502 Table VIII, RECONSTRUCTED". That rule
// puts a 300 × 200 mm stirrup of 8 mm bar at 1,192 mm; the geometry of the bar gives 1,078 to 1,100 mm (a 4d to a 2d pin
// radius), so the 24d rule was 8 to 10% long and was retired. The still older constants (hook 9d, 135° bend 3d)
// gave 1,054 mm, about 4% short because a 9d hook allowance is less than the 10d tail IS 13920 asks for.
// ─────────────────────────────────────────────────────────────────────────────

import { barMass, roundUp25, stirrupCutLength } from '@/lib/structopro-qty/codes'

export const BAR_SIZES = [6, 8, 10, 12, 16, 20, 25, 28, 32] as const
/** CPWD DAR 2014 item 5.22.1 buys 1.05 q of bar for each 1.00 q placed. */
export const PROCURE = 1.05
/** Radius of the pin a main bar is bent round, in bar diameters (the StructurePro model's value). */
export const BEND_RADIUS_D = 4

export type DimKey = 'A' | 'B' | 'C'

export interface DimSpec {
  key: DimKey
  label: string
  hint: string
}

export type ShapeKey = 'straight' | 'L' | 'U' | 'crank' | 'stirrup' | 'square'

export interface ShapeDef {
  key: ShapeKey
  name: string
  dims: DimSpec[]
  note: string
}

export const SHAPES: ShapeDef[] = [
  {
    key: 'straight',
    name: 'Straight bar',
    dims: [{ key: 'A', label: 'Length (mm)', hint: 'The whole length of the bar.' }],
    note: 'A plain bar. It is cut to its length.',
  },
  {
    key: 'L',
    name: 'L-bar: one right-angle bend',
    dims: [
      { key: 'A', label: 'First leg (mm)', hint: 'Out to out, to the outside of the bend.' },
      { key: 'B', label: 'Second leg (mm)', hint: 'Out to out, to the outside of the bend.' },
    ],
    note: 'Two legs at a right angle, such as the starter bar of a column in a footing or the edge bar of a slab.',
  },
  {
    key: 'U',
    name: 'U-bar: two right-angle bends',
    dims: [
      { key: 'A', label: 'First leg (mm)', hint: 'Out to out.' },
      { key: 'B', label: 'Base (mm)', hint: 'Out to out, the length between the two bends.' },
      { key: 'C', label: 'Second leg (mm)', hint: 'Out to out.' },
    ],
    note: 'Three lengths with a right-angle bend between each, a channel or U shape.',
  },
  {
    key: 'crank',
    name: 'Cranked bar: two 45° bends',
    dims: [
      { key: 'A', label: 'Overall length (mm)', hint: 'End to end, measured along the bar’s run.' },
      { key: 'B', label: 'Crank rise (mm)', hint: 'How far the bar steps up or down.' },
    ],
    note: 'A bar that steps up or down at 45°, such as a bar lifted over a support. The slope makes it longer than its run.',
  },
  {
    key: 'stirrup',
    name: 'Rectangular stirrup or tie: 135° hooks',
    dims: [
      { key: 'A', label: 'Width (mm)', hint: 'Out to out of the stirrup, which is the member’s width less the cover on both sides.' },
      { key: 'B', label: 'Depth (mm)', hint: 'Out to out of the stirrup, which is the member’s depth less the cover on both sides.' },
    ],
    note: 'A closed rectangle with a 135° hook at each end of the bar, as IS 13920 asks for a stirrup or tie.',
  },
  {
    key: 'square',
    name: 'Square tie: 135° hooks',
    dims: [{ key: 'A', label: 'Side (mm)', hint: 'Out to out of the tie, which is the column’s side less the cover on both sides.' }],
    note: 'A closed square with a 135° hook at each end, the usual tie of a square column.',
  },
]

export interface BbsResult {
  massPerM: number // kg a metre
  runMm: number // the sum of the lengths as entered (perimeter for a stirrup)
  bendMm: number // taken off for the bends (0 for a stirrup, whose rule has it built in)
  slopeMm: number // added for the crank slope
  hookMm: number // added for hooks and bends of a stirrup, beyond its perimeter
  exactMm: number // the cut length before rounding
  cutMm: number // rounded up to the next 25 mm
  weightPerBar: number // kg
  totalKg: number // all bars
  buyKg: number // all bars, with the procurement allowance
}

/** Deduction for one bend of `deg` degrees round a pin of radius R = 4d, bar dimensions measured out to out. */
export function bendDeduction(deg: number, d: number): number {
  if (deg === 90) return 3 * d // IS 2502 Table V reading: matches the model
  const R = BEND_RADIUS_D * d
  const th = (deg * Math.PI) / 180
  return 2 * (R + d) * Math.tan(th / 2) - (R + d / 2) * th
}

/**
 * Cut length and weight of one bar shape.
 * Checked by hand: stirrup 300 × 200, 8 mm: 2 × 500 + 12 × 8 = 1,096 mm → 1,100 mm; 1.1 m × 8²/162.2 = 0.434 kg.
 * L-bar 1,000 + 500, 12 mm: 1,500 − 36 = 1,464 → 1,475 mm. Crank 3,000 overall, rise 150, 16 mm:
 * 3,000 + 0.414 × 150 − 2 × 0.61 × 16 = 3,042.6 → 3,050 mm.
 */
export function calculate(shape: ShapeKey, d: number, dims: Record<DimKey, number>, count: number): BbsResult {
  const A = dims.A || 0
  const B = dims.B || 0
  const C = dims.C || 0
  let runMm = 0
  let bendMm = 0
  let slopeMm = 0
  let hookMm = 0
  let exactMm = 0

  if (shape === 'straight') {
    runMm = A
    exactMm = A
  } else if (shape === 'L') {
    runMm = A + B
    bendMm = bendDeduction(90, d)
    exactMm = runMm - bendMm
  } else if (shape === 'U') {
    runMm = A + B + C
    bendMm = 2 * bendDeduction(90, d)
    exactMm = runMm - bendMm
  } else if (shape === 'crank') {
    runMm = A
    slopeMm = (Math.SQRT2 - 1) * B
    bendMm = 2 * bendDeduction(45, d)
    exactMm = runMm + slopeMm - bendMm
  } else {
    const a = A
    const b = shape === 'square' ? A : B
    runMm = 2 * (a + b)
    exactMm = stirrupCutLength(a, b, d)
    hookMm = exactMm - runMm
  }

  const cutMm = roundUp25(exactMm)
  const massPerM = barMass(d)
  const weightPerBar = (cutMm / 1000) * massPerM
  const n = Math.max(1, Math.floor(count) || 1)
  const totalKg = weightPerBar * n
  return { massPerM, runMm, bendMm, slopeMm, hookMm, exactMm, cutMm, weightPerBar, totalKg, buyKg: totalKg * PROCURE }
}
