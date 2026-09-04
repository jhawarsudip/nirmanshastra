// ─────────────────────────────────────────────────────────────────────────────
// BAR BENDING SCHEDULE — CUTTING LENGTH ENGINE (IS 2502:1963)
//
// Permanently-free, standalone calculator. This engine is NOT related to the
// paid "Bar Bending Schedule" Excel toolkit sold on /site-templates — that is a
// separate spreadsheet product. Every constant below is the verified IS 2502
// ground truth used by the real product.
//
//   Unit weight            = d² / 162           (kg per metre, d in mm)
//   Bend deduction         45° = 1d · 90° = 2d · 135° = 3d   (per bend, subtracted)
//   Hook allowance / hook  = max(9d, 75mm)
//   Crank addition (45°)   = 0.42 × crank depth
//   Closed link perimeter  rectangular = 2(A+B) · square = 4A
//
//   Cutting length = Σ straight segments (or closed-link perimeter)
//                    + hook allowance total
//                    − bend deduction total
//                    + crank addition
//   Weight (kg)    = cutting length (m) × unit weight (kg/m)
// ─────────────────────────────────────────────────────────────────────────────

export type DimKey = 'A' | 'B' | 'C' | 'crankDepth'

export interface DimSpec {
  key: DimKey
  label: string
  hint: string
}

export interface ShapeDef {
  code: string
  name: string
  /** Dimension inputs this shape needs, in display order. */
  dims: DimSpec[]
  /** Straight length (or closed-link perimeter) in mm from the dimensions. */
  straight: (d: Record<DimKey, number>) => number
  /** How the straight length is described, for the breakdown row. */
  straightLabel: (d: Record<DimKey, number>) => string
  bends: { deg45: number; deg90: number; deg135: number }
  hooks: number
  hasCrank: boolean
  closedLink: boolean
  note: string
}

const A: DimSpec = { key: 'A', label: 'A', hint: 'First leg / dimension (mm)' }
const B: DimSpec = { key: 'B', label: 'B', hint: 'Second leg / dimension (mm)' }
const C: DimSpec = { key: 'C', label: 'C', hint: 'Third leg / dimension (mm)' }
const CRANK: DimSpec = { key: 'crankDepth', label: 'Crank depth', hint: 'Vertical offset of the crank (mm)' }

export const SHAPES: ShapeDef[] = [
  {
    code: '00',
    name: 'Straight bar',
    dims: [A],
    straight: (d) => d.A,
    straightLabel: (d) => `A = ${d.A}`,
    bends: { deg45: 0, deg90: 0, deg135: 0 },
    hooks: 0,
    hasCrank: false,
    closedLink: false,
    note: 'A plain bar. Cutting length equals its length — no bends, no hooks.',
  },
  {
    code: '01',
    name: 'L-bar, one 90° bend',
    dims: [A, B],
    straight: (d) => d.A + d.B,
    straightLabel: (d) => `A + B = ${d.A} + ${d.B}`,
    bends: { deg45: 0, deg90: 1, deg135: 0 },
    hooks: 0,
    hasCrank: false,
    closedLink: false,
    note: 'Two legs meeting at one 90° bend.',
  },
  {
    code: '02',
    name: 'U-bar, two 90° bends',
    dims: [A, B, C],
    straight: (d) => d.A + d.B + d.C,
    straightLabel: (d) => `A + B + C = ${d.A} + ${d.B} + ${d.C}`,
    bends: { deg45: 0, deg90: 2, deg135: 0 },
    hooks: 0,
    hasCrank: false,
    closedLink: false,
    note: 'Three legs, two 90° bends — a U or channel profile.',
  },
  {
    code: '03',
    name: 'L-bar with hook',
    dims: [A, B],
    straight: (d) => d.A + d.B,
    straightLabel: (d) => `A + B = ${d.A} + ${d.B}`,
    bends: { deg45: 0, deg90: 1, deg135: 0 },
    hooks: 1,
    hasCrank: false,
    closedLink: false,
    note: 'An L-bar with a single anchorage hook at the free end.',
  },
  {
    code: '04',
    name: 'Straight bar, both ends hooked',
    dims: [A],
    straight: (d) => d.A,
    straightLabel: (d) => `A = ${d.A}`,
    bends: { deg45: 0, deg90: 0, deg135: 0 },
    hooks: 2,
    hasCrank: false,
    closedLink: false,
    note: 'A straight bar carrying a standard hook at each end.',
  },
  {
    code: '05',
    name: 'Cranked bar, 45° crank',
    dims: [A, B, C, CRANK],
    straight: (d) => d.A + d.B + d.C,
    straightLabel: (d) => `A + B + C = ${d.A} + ${d.B} + ${d.C}`,
    bends: { deg45: 2, deg90: 0, deg135: 0 },
    hooks: 0,
    hasCrank: true,
    closedLink: false,
    note: 'A bar cranked at 45° to shift level (typical top bar at a support). Adds 0.42 × crank depth for the inclined portion.',
  },
  {
    code: '06',
    name: 'Cranked bar with hooks',
    dims: [A, B, C, CRANK],
    straight: (d) => d.A + d.B + d.C,
    straightLabel: (d) => `A + B + C = ${d.A} + ${d.B} + ${d.C}`,
    bends: { deg45: 2, deg90: 0, deg135: 0 },
    hooks: 2,
    hasCrank: true,
    closedLink: false,
    note: 'As the 45° cranked bar, plus an anchorage hook at each end.',
  },
  {
    code: '07',
    name: 'Rectangular stirrup, 90° hook',
    dims: [A, B],
    straight: (d) => 2 * (d.A + d.B),
    straightLabel: (d) => `2 × (A + B) = 2 × (${d.A} + ${d.B})`,
    bends: { deg45: 0, deg90: 3, deg135: 2 },
    hooks: 2,
    hasCrank: false,
    closedLink: true,
    note: 'A closed rectangular tie. Perimeter 2(A+B), three 90° corner bends plus two 135° hook bends.',
  },
  {
    code: '08',
    name: 'Rectangular stirrup, 135° seismic hook',
    dims: [A, B],
    straight: (d) => 2 * (d.A + d.B),
    straightLabel: (d) => `2 × (A + B) = 2 × (${d.A} + ${d.B})`,
    bends: { deg45: 0, deg90: 3, deg135: 2 },
    hooks: 2,
    hasCrank: false,
    closedLink: true,
    note: 'Same geometry as the rectangular stirrup, detailed with 135° seismic hooks per IS 13920:2016 for Zone III–V.',
  },
  {
    code: '09',
    name: 'Square stirrup',
    dims: [A],
    straight: (d) => 4 * d.A,
    straightLabel: (d) => `4 × A = 4 × ${d.A}`,
    bends: { deg45: 0, deg90: 3, deg135: 2 },
    hooks: 2,
    hasCrank: false,
    closedLink: true,
    note: 'A closed square tie. Perimeter 4A, three 90° corners plus two 135° hooks.',
  },
  {
    code: '10',
    name: 'Diamond / rhombus stirrup',
    dims: [A, B],
    straight: (d) => 2 * (d.A + d.B),
    straightLabel: (d) => `2 × (A + B) = 2 × (${d.A} + ${d.B})`,
    bends: { deg45: 0, deg90: 3, deg135: 2 },
    hooks: 2,
    hasCrank: false,
    closedLink: true,
    note: 'A closed diamond tie, often an inner link in a column cage. Perimeter 2(A+B).',
  },
  {
    code: '11',
    name: 'Triangular stirrup',
    dims: [A, B],
    straight: (d) => 2 * d.A + d.B,
    straightLabel: (d) => `2 × A + B = 2 × ${d.A} + ${d.B}`,
    bends: { deg45: 0, deg90: 1, deg135: 2 },
    hooks: 2,
    hasCrank: false,
    closedLink: true,
    note: 'A closed triangular link. Two equal sides A and a base B, with 135° hooks.',
  },
  {
    code: '12',
    name: 'Circular ring',
    dims: [{ key: 'A', label: 'A', hint: 'Enter 3.1416 × ring diameter (mm)' }],
    straight: (d) => d.A,
    straightLabel: (d) => `A (= π × ring dia) = ${d.A}`,
    bends: { deg45: 0, deg90: 0, deg135: 2 },
    hooks: 2,
    hasCrank: false,
    closedLink: true,
    note: 'A helical / circular ring. Enter A as 3.1416 × ring diameter; two 135° hooks close the ring.',
  },
]

export const STANDARD_DIAMETERS = [6, 8, 10, 12, 16, 20, 25, 32] as const

export interface BbsResult {
  unitWeight: number       // kg/m
  straight: number         // mm
  hookTotal: number        // mm
  bendDeduction: number    // mm
  crankAddition: number    // mm
  cuttingLength: number    // mm, per bar (exact)
  weightPerBar: number     // kg, per bar (exact)
  totalWeight: number      // kg, all bars (exact)
}

export function hookAllowancePerHook(diameter: number): number {
  return Math.max(9 * diameter, 75)
}

export function calculate(
  shape: ShapeDef,
  diameter: number,
  dims: Record<DimKey, number>,
  quantity: number,
): BbsResult {
  const unitWeight = (diameter * diameter) / 162

  const straight = shape.straight(dims)

  const hookTotal = shape.hooks * hookAllowancePerHook(diameter)

  const bendDeduction =
    shape.bends.deg45 * (1 * diameter) +
    shape.bends.deg90 * (2 * diameter) +
    shape.bends.deg135 * (3 * diameter)

  const crankAddition = shape.hasCrank ? 0.42 * (dims.crankDepth || 0) : 0

  const cuttingLength = straight + hookTotal - bendDeduction + crankAddition

  const weightPerBar = (cuttingLength / 1000) * unitWeight
  const totalWeight = weightPerBar * quantity

  return {
    unitWeight,
    straight,
    hookTotal,
    bendDeduction,
    crankAddition,
    cuttingLength,
    weightPerBar,
    totalWeight,
  }
}

/** Round to `figs` significant figures (used for kg weights on the drawing). */
export function toSigFigs(n: number, figs: number): number {
  if (n === 0) return 0
  const d = Math.ceil(Math.log10(Math.abs(n)))
  const power = figs - d
  const mag = Math.pow(10, power)
  return Math.round(n * mag) / mag
}
