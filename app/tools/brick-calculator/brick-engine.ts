// ─────────────────────────────────────────────────────────────────────────────
// BRICK CALCULATOR — ENGINE
//
// Free, standalone calculator. It turns one wall's length, height, brick and thickness into a brick count, the
// joint mortar, and the cement and sand in that mortar.
//
// ONE SOURCE OF TRUTH: the brick sizes, the 10 mm joint, the units-per-m² formula, the exact joint volume, the
// mortar allowance and the cement-per-m³ figures are all imported from the MasonryPro tables
// (lib/qty/masonry/units.ts). A single wall counted here therefore agrees with the paid report; the paid report
// only adds the room plan, the openings schedule and the plaster.
//
//   units per m² = (t + 10 mm) / ((L + 10) × (W + 10) × (H + 10))      t = wall thickness, brick sizes in metres
//
// Sizes (research-masonry-2026-10-25): modular 190 × 90 × 90 mm (IS 1077:1992 cl 6.1.1), non-modular
// 230 × 110 × 70 mm (IS 1077 cl 6.1.2, IS 12894:2002 cl 5.1.2), and the 230 × 115 × 75 mm red brick that many kilns
// still make, which is not a BIS size. A 10 mm joint is implied by IS 2212:1991 (no bed joint above 12 mm; four
// courses and three joints measure 39 cm for modular brick).
//
// Not from any standard: the breakage allowance (5%, with 10% shown for a wall with a lot of cutting) and the extra
// 25% of joint mortar over the exact joint volume. Both are stated on the page as assumptions.
// ─────────────────────────────────────────────────────────────────────────────

import {
  SYSTEMS,
  unitsPerM2,
  jointMortarPerM2,
  MORTAR_ALLOW,
  CEMENT_KG_PER_M3,
  SAND_M3_PER_M3,
  CEMENT_BAG_KG,
} from '@/lib/qty/masonry/units'

export type BrickKind = 'brick' | 'modular' | 'flyash'
export type WallKind = 'one' | 'half'

export const BRICK_KINDS: BrickKind[] = ['brick', 'modular', 'flyash']
export const WALL_KINDS: WallKind[] = ['one', 'half']

/** Joint thickness, mm. Shown on the page; the model itself holds 0.01 m. */
export const MORTAR_JOINT_MM = 10

/** Breakage and cutting allowance when ordering: the MasonryPro figure, and a higher one for a wall with a lot of cutting. */
export const BREAKAGE_LOW = SYSTEMS.brick.loss
export const BREAKAGE_HIGH = 0.1

export { MORTAR_ALLOW }

export interface BrickSpec {
  kind: BrickKind
  label: string
  size: string
  source: string
  /** actual thickness of a one-brick wall and a half-brick wall, mm */
  oneMm: number
  halfMm: number
}

export const BRICK_SPECS: Record<BrickKind, BrickSpec> = {
  brick: { kind: 'brick', label: SYSTEMS.brick.label, size: SYSTEMS.brick.size, source: SYSTEMS.brick.source, oneMm: Math.round(SYSTEMS.brick.ext * 1000), halfMm: Math.round(SYSTEMS.brick.int * 1000) },
  modular: { kind: 'modular', label: SYSTEMS.modular.label, size: SYSTEMS.modular.size, source: SYSTEMS.modular.source, oneMm: Math.round(SYSTEMS.modular.ext * 1000), halfMm: Math.round(SYSTEMS.modular.int * 1000) },
  flyash: { kind: 'flyash', label: SYSTEMS.flyash.label, size: SYSTEMS.flyash.size, source: SYSTEMS.flyash.source, oneMm: Math.round(SYSTEMS.flyash.ext * 1000), halfMm: Math.round(SYSTEMS.flyash.int * 1000) },
}

/** Mortar mix by wall (cement : sand): the MasonryPro model uses 1:6 for an outer wall and 1:4 for a half-brick wall. Assumed. */
export const MORTAR_MIX: Record<WallKind, number> = { one: 6, half: 4 }

export interface BrickInput {
  lengthM: number // wall length (m)
  heightM: number // wall height (m)
  kind: BrickKind
  wall: WallKind
  openingsAreaM2: number // total area of doors and windows to take out (m²)
}

export interface BrickResult {
  kind: BrickKind
  wall: WallKind
  thicknessMm: number
  perM2: number // bricks in one m² of this wall

  grossAreaM2: number // length × height
  openingsAreaM2: number // taken out (never more than the whole wall)
  netAreaM2: number

  bricks: number // net area × bricks per m², rounded to a whole brick, before breakage
  orderLow: number // + 5%, rounded up
  orderHigh: number // + 10%, rounded up

  mortarM3: number // joint mortar with the allowance
  mix: number // 1 : mix
  cementKg: number
  cementBags: number
  sandM3: number
}

/**
 * Count the bricks in one wall.
 *
 * Checked by hand: red brick, one brick thick, 10 m × 3 m, no openings →
 *   (0.23 + 0.01) / (0.24 × 0.125 × 0.085) = 94.12 bricks per m², × 30 m² = 2,824 bricks.
 */
export function calculate(input: BrickInput): BrickResult {
  const S = SYSTEMS[input.kind]
  const t = input.wall === 'one' ? S.ext : S.int
  const lengthM = Math.max(0, input.lengthM || 0)
  const heightM = Math.max(0, input.heightM || 0)

  const grossAreaM2 = lengthM * heightM
  const openingsAreaM2 = Math.min(grossAreaM2, Math.max(0, input.openingsAreaM2 || 0))
  const netAreaM2 = grossAreaM2 - openingsAreaM2

  const perM2 = unitsPerM2(S, t, false)
  const raw = netAreaM2 * perM2

  const mix = MORTAR_MIX[input.wall]
  const mortarM3 = netAreaM2 * jointMortarPerM2(S, t, false) * MORTAR_ALLOW
  const cementKg = mortarM3 * CEMENT_KG_PER_M3(mix)

  return {
    kind: input.kind,
    wall: input.wall,
    thicknessMm: Math.round(t * 1000),
    perM2,
    grossAreaM2,
    openingsAreaM2,
    netAreaM2,
    bricks: Math.round(raw),
    // the small subtraction stops 3,000 × 1.1 (which floats to 3300.0000000000005) from rounding up to 3,301
    orderLow: Math.ceil(raw * (1 + BREAKAGE_LOW) - 1e-9),
    orderHigh: Math.ceil(raw * (1 + BREAKAGE_HIGH) - 1e-9),
    mortarM3,
    mix,
    cementKg,
    cementBags: cementKg / CEMENT_BAG_KG,
    sandM3: mortarM3 * SAND_M3_PER_M3,
  }
}
