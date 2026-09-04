// ─────────────────────────────────────────────────────────────────────────────
// BRICK CALCULATOR — ENGINE (IS 1077:1992 + IS 2212:1991)
//
// Permanently-free, standalone calculator. It converts a wall's dimensions into
// a brick count for the two common wall thicknesses.
//
// AUTHORITATIVE SOURCE — do not overwrite from any other source:
//
//   The bricks-per-m² figures are IMPORTED from the paid MasonPro engine
//   (app/tools/masonpro/masonpro-engine.ts), which carries the Section 8 LOCKED
//   values, so the two tools can never disagree:
//
//     • 9" standard wall (modular clay brick) — clay_modular_9.unitsPerSqm = 100
//     • 4.5" partition wall (modular clay brick) — clay_4_5.unitsPerSqm     = 50
//
//   Both rest on the standard modular brick 190×90×90mm laid with a 10mm mortar
//   joint (nominal 200×100×100mm unit), IS 1077:1992 + IS 2212:1991. The 4.5"
//   figure was checked in the engine (INTERNAL_WALL_SPECS.clay_4_5), not assumed.
//
// Everything else here (area, opening deductions, wastage) is transparent
// geometry and a standard site allowance — no IS clause is invented.
// ─────────────────────────────────────────────────────────────────────────────

// Bricks per m² — single-source-of-truth import from the paid MasonPro engine.
import { EXTERNAL_WALL_SPECS, INTERNAL_WALL_SPECS } from '../masonpro/masonpro-engine'

// 9" standard wall = 100 bricks/m² · 4.5" partition = 50 bricks/m² (LOCKED).
export const BRICKS_PER_SQM_9IN = EXTERNAL_WALL_SPECS.clay_modular_9.unitsPerSqm
export const BRICKS_PER_SQM_4_5IN = INTERNAL_WALL_SPECS.clay_4_5.unitsPerSqm

// Standard modular brick, IS 1077:1992 (millimetres).
export const BRICK_SIZE_MM = { length: 190, width: 90, height: 90 } as const
export const MORTAR_JOINT_MM = 10 // nominal bed + perpend joint (IS 2212:1991)

// Recommended wastage band for ordering (breakage, cutting, site loss).
export const WASTAGE_LOW = 0.05 // +5%
export const WASTAGE_HIGH = 0.1 // +10%

export type WallThickness = '9in' | '4.5in'

export interface WallThicknessSpec {
  key: WallThickness
  label: string
  bricksPerSqm: number
  isCode: string
  mortarRatio: string
  note: string
}

// Presentation specs — figures pulled from the imported LOCKED specs above.
export const THICKNESS_SPECS: Record<WallThickness, WallThicknessSpec> = {
  '9in': {
    key: '9in',
    label: '9-inch (230mm) — standard load-bearing / external wall',
    bricksPerSqm: BRICKS_PER_SQM_9IN,
    isCode: EXTERNAL_WALL_SPECS.clay_modular_9.isCode,
    mortarRatio: EXTERNAL_WALL_SPECS.clay_modular_9.mortarRatio,
    note: 'A full-brick-thick wall — the usual external and load-bearing wall in Indian homes.',
  },
  '4.5in': {
    key: '4.5in',
    label: '4.5-inch (115mm) — internal partition wall',
    bricksPerSqm: BRICKS_PER_SQM_4_5IN,
    isCode: INTERNAL_WALL_SPECS.clay_4_5.isCode,
    mortarRatio: INTERNAL_WALL_SPECS.clay_4_5.mortarRatio,
    note: 'A half-brick-thick wall — used for non-load-bearing internal partitions.',
  },
}

export const THICKNESS_ORDER: WallThickness[] = ['9in', '4.5in']

export interface BrickInput {
  lengthM: number // wall length (m)
  heightM: number // wall height (m)
  thickness: WallThickness
  openingsAreaM2: number // total area of doors/windows to deduct (m²)
}

export interface BrickResult {
  thickness: WallThickness
  bricksPerSqm: number

  grossAreaM2: number // length × height
  openingsAreaM2: number // deducted area (clamped so net never goes negative)
  netAreaM2: number // grossArea − openings

  bricks: number // net area × bricks/m² (before wastage), rounded to whole
  bricksWith5pct: number // +5% wastage, rounded UP
  bricksWith10pct: number // +10% wastage, rounded UP
}

/**
 * Convert wall dimensions into a brick count.
 *
 * Verified test case (10 m × 3 m, 9-inch, no openings):
 *   gross area = 30 m² · net area = 30 m² · bricks = 30 × 100 = 3000 (before wastage)
 */
export function calculate(input: BrickInput): BrickResult {
  const spec = THICKNESS_SPECS[input.thickness]
  const lengthM = Math.max(0, input.lengthM || 0)
  const heightM = Math.max(0, input.heightM || 0)

  const grossAreaM2 = lengthM * heightM
  // Openings can never remove more than the whole wall.
  const openingsAreaM2 = Math.min(grossAreaM2, Math.max(0, input.openingsAreaM2 || 0))
  const netAreaM2 = grossAreaM2 - openingsAreaM2

  const rawBricks = netAreaM2 * spec.bricksPerSqm
  const bricks = Math.round(rawBricks)
  const bricksWith5pct = Math.ceil(rawBricks * (1 + WASTAGE_LOW))
  const bricksWith10pct = Math.ceil(rawBricks * (1 + WASTAGE_HIGH))

  return {
    thickness: spec.key,
    bricksPerSqm: spec.bricksPerSqm,
    grossAreaM2,
    openingsAreaM2,
    netAreaM2,
    bricks,
    bricksWith5pct,
    bricksWith10pct,
  }
}
