// ─────────────────────────────────────────────────────────────────────────────
// PAINT AND TILE — CALCULATOR ENGINE
//
// Free, standalone calculator: the area of a wall, ceiling or floor, and the finish chosen for it, give the paint, putty
// and primer, or the tiles, grout and fixing, to buy.
//
// ONE SOURCE: every factor comes from lib/qty/interior/finish.ts, the same code the InteriorPro model runs, so this page
// and the paid report give the same quantities for the same surface.
//
//   Paint   spread of each coat system a m² (CPWD DAR 2016 for the primer; makers' data sheets for putty and emulsion),
//           and 5% wastage (an assumption: no sheet gives one).
//   Tiles   tiles a m² from the tile size and a 2 mm joint (3 mm on 300 × 300), wastage of 5 to 15% by tile size and
//           laying (an assumption), grout from the joint geometry with 10% wastage, the mortar bed from the CPWD item
//           text, adhesive from a maker's sheet.
//
// The old version of this page priced seven elements of a house a sq ft from the "Quality Tiers" sheet of an Excel
// product, in rupees. The site gives quantities and not prices, so that page was replaced by this one.
// ─────────────────────────────────────────────────────────────────────────────

import { SQFT_TO_M2 } from '@/lib/qty/util'
import {
  IN_SYS,
  TILES,
  paintQty,
  tileQty,
  type PaintQty,
  type PaintTier,
  type TileFixing,
  type TileQty,
  type TileWhere,
} from '@/lib/qty/interior/finish'

export { IN_SYS, TILES }
export type { PaintQty, PaintTier, TileFixing, TileQty, TileWhere }

export type Unit = 'sqft' | 'm2'
export type Lay = 'straight' | 'diagonal'

export const toM2 = (area: number, unit: Unit) => (unit === 'sqft' ? area * SQFT_TO_M2 : area)

export const TIER_ORDER: PaintTier[] = ['economy', 'standard', 'premium']
export const TIER_NAME: Record<PaintTier, string> = { economy: 'Economy', standard: 'Standard', premium: 'Premium' }

export const TILE_ORDER = ['600x600', '800x800', '600x1200', '300x600', '300x300'] as const
export type TileKey = (typeof TILE_ORDER)[number]

export interface PaintInput {
  area: number
  unit: Unit
  tier: PaintTier
}

export interface PaintResult extends PaintQty {
  m2: number
  /** the same area in each of the three systems, for the side-by-side table */
  all: PaintQty[]
}

export function calculatePaint({ area, unit, tier }: PaintInput): PaintResult {
  const m2 = toM2(Math.max(0, area), unit)
  return { ...paintQty(m2, tier), m2, all: TIER_ORDER.map((t) => paintQty(m2, t)) }
}

export interface TileInput {
  area: number
  unit: Unit
  size: TileKey
  lay: Lay
  /** a bathroom or a small room: more tiles are cut, so more are lost */
  small: boolean
  where: TileWhere
  fixing: TileFixing
}

export interface TileResult extends TileQty {
  m2: number
  /** the same area in each tile size, for the side-by-side table */
  all: TileQty[]
}

export function calculateTiles({ area, unit, size, lay, small, where, fixing }: TileInput): TileResult {
  const m2 = toM2(Math.max(0, area), unit)
  const one = (k: TileKey) => tileQty(m2, TILES[k], lay, small, where, fixing)
  return { ...one(size), m2, all: TILE_ORDER.map(one) }
}
