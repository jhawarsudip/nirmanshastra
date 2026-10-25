/*
  Interior finishes: the paint systems and the tile, grout and fixing factors. The InteriorPro model (model.ts) and the free
  Paint and Tile calculator both read this file, so the two can never give different quantities for the same surface.

  Where each figure comes from (the research is in the project file "research-interior-2026-10-25"):
    Code     CPWD Delhi Analysis of Rates 2016 (primer 0.070 L a m², exterior paints), IS 15622 (tiles), IS 1200 (measurement)
    Maker    from a maker's data sheet: paint, putty and primer spread; tile boxes; adhesive coverage; grout
    Derived  worked out from the above with arithmetic that is shown: tiles a m², grout a m²
    Assumed  no source fixes it: wastage on paint and tiles, the grout density, the adhesive above 3,600 cm² tiles
  The site is quantity-only: nothing here knows a price.
*/

export type PaintTier = 'economy' | 'standard' | 'premium'

/** Wastage on paint, putty and primer. No maker or CPWD sheet gives one; Assumed. */
export const PAINT_WASTE = 1.05

/**
 * Spread of each coat system, per m² of surface (all coats counted). The source is in the `src` field.
 * CPWD DAR 2016 Vol 2 sub-head 13 gives the exterior and cement-paint coefficients; the interior systems rest on the
 * makers' data sheets (Asian Paints, Nerolac, Berger) since the DAR emulsion items were not readable.
 */
export interface InSys {
  label: string
  putty?: { label: string; kg: number; src: string }
  primer: { l: number; src: string }
  finish: { label: string; l: number; src: string }
  coats: string
}
export const IN_SYS: Record<PaintTier, InSys> = {
  economy: {
    label: 'Economy: acrylic distemper over primer', coats: 'One coat of primer and two coats of distemper',
    primer: { l: 0.070, src: 'CPWD DAR 2016 item 13.42 (0.070 L a m²); maker sheets 0.067 to 0.083' },
    finish: { label: 'Acrylic distemper, 2 coats', l: 0.155, src: 'Maker sheet: 65 to 75 sq ft a litre for two coats (0.14 to 0.17 L a m²)' },
  },
  standard: {
    label: 'Standard: putty, primer and emulsion', coats: 'Cement putty (about 1 mm), one coat of primer, two coats of emulsion',
    putty: { label: 'Wall putty, cement based', kg: 0.60, src: 'Maker sheet: 10 to 15 sq ft a kg for 1.5 mm in two coats, scaled to 1 mm (0.48 to 0.72 kg a m²)' },
    primer: { l: 0.075, src: 'Maker sheet: 130 to 160 sq ft a litre (0.067 to 0.083 L a m²)' },
    finish: { label: 'Interior emulsion, 2 coats', l: 0.090, src: 'Maker sheets: 0.083 to 0.100 L a m² for two coats' },
  },
  premium: {
    label: 'Premium: acrylic putty, primer and luxury emulsion', coats: 'Acrylic putty in two coats, one coat of primer, two coats of luxury emulsion',
    putty: { label: 'Wall putty, acrylic', kg: 0.38, src: 'Maker sheet: 24 to 35 sq ft a kg in two coats (0.31 to 0.45 kg a m²)' },
    primer: { l: 0.075, src: 'Maker sheet: 130 to 160 sq ft a litre (0.067 to 0.083 L a m²)' },
    finish: { label: 'Luxury emulsion, 2 coats', l: 0.138, src: 'Maker sheet: 14.5 m² a litre a coat at 30 microns (0.138 L a m² for two coats)' },
  },
}


/* tiles */
export interface TileDef { key: string; label: string; L: number; W: number; J: number; T: number; pcsBox?: number; m2Box?: number; large: boolean }
export const TILES: Record<string, TileDef> = {
  '600x600': { key: '600x600', label: '600 × 600 mm', L: 0.6, W: 0.6, J: 0.002, T: 0.009, pcsBox: 4, m2Box: 1.44, large: false },
  '800x800': { key: '800x800', label: '800 × 800 mm', L: 0.8, W: 0.8, J: 0.002, T: 0.010, pcsBox: 2, m2Box: 1.28, large: true },
  '600x1200': { key: '600x1200', label: '600 × 1200 mm', L: 0.6, W: 1.2, J: 0.002, T: 0.011, pcsBox: 2, m2Box: 1.44, large: true },
  '300x600': { key: '300x600', label: '300 × 600 mm', L: 0.3, W: 0.6, J: 0.002, T: 0.008, pcsBox: 5, m2Box: 0.9, large: false },
  '300x300': { key: '300x300', label: '300 × 300 mm', L: 0.3, W: 0.3, J: 0.003, T: 0.008, large: false },
}
export const tilesPerM2 = (t: TileDef) => 1 / ((t.L + t.J) * (t.W + t.J))
/** Grout, kg a m²: density × joint length a m² × joint width × tile thickness. Density 1.6 kg a litre is Assumed (1.4 to 1.6). */
export const GROUT_KG_L = 1.6
export const groutPerM2 = (t: TileDef) => GROUT_KG_L * 1000 * (1 / t.L + 1 / t.W) * t.J * t.T
export const GROUT_WASTE = 1.10

/** Wastage on tiles. Mapei advises 5 to 10% on grout; the tile figures are Assumed (5% straight, 10% diagonal, large format or small rooms). */
export function tileWaste(t: TileDef, lay: 'straight' | 'diagonal', small: boolean): number {
  if (small) return 0.10
  if (lay === 'diagonal') return t.large ? 0.15 : 0.10
  return t.large ? 0.10 : 0.05
}

/** Mortar under tiles: the CPWD item text as quoted in public tenders, with the cement worked from the DAR yield. */
export const BED = {
  floor: { cementKg: 11.0, sandM3: 0.022 },
  wall: { cementKg: 9.2, sandM3: 0.0125 },
}
export const CEMENT_BAG_KG = 50
/** Tile adhesive, kg a m²: maker sheet, 6 mm notch up to 900 cm² tiles, 12 mm notch up to 3,600 cm². Above that Assumed. */
export const adhesivePerM2 = (t: TileDef) => {
  const a = t.L * t.W
  return a <= 0.09 + 1e-9 ? 5.25 : a <= 0.36 + 1e-9 ? 10.5 : 12.0
}
export const ADHESIVE_BAG_KG = 20


/* ───────────────────────── what a surface needs ───────────────────────── */

export interface PaintQty {
  tier: PaintTier
  system: InSys
  /** wall putty, kg (none for the economy system) */
  puttyKg: number
  primerL: number
  finishL: number
}

/** Putty, primer and paint for `m2` square metres of wall or ceiling, with wastage. */
export function paintQty(m2: number, tier: PaintTier): PaintQty {
  const sys = IN_SYS[tier]
  return {
    tier,
    system: sys,
    puttyKg: sys.putty ? m2 * sys.putty.kg * PAINT_WASTE : 0,
    primerL: m2 * sys.primer.l * PAINT_WASTE,
    finishL: m2 * sys.finish.l * PAINT_WASTE,
  }
}

export type TileWhere = 'floor' | 'wall'
export type TileFixing = 'mortar' | 'adhesive'

export interface TileQty {
  tile: TileDef
  netM2: number
  /** wastage as a fraction: 0.05 is 5% */
  waste: number
  buyM2: number
  perM2: number
  pcs: number
  /** null for a size the model does not list in boxes */
  boxes: number | null
  groutKg: number
  /** mortar bed under the tiles */
  cementKg: number
  cementBags: number
  sandM3: number
  /** tile adhesive */
  adhesiveKg: number
  adhesiveBags: number
}

/** Tiles, grout and fixing for `netM2` square metres, the way the InteriorPro model counts them. */
export function tileQty(netM2: number, tile: TileDef, lay: 'straight' | 'diagonal', small: boolean, where: TileWhere, fixing: TileFixing): TileQty {
  const waste = tileWaste(tile, lay, small)
  const buyM2 = netM2 * (1 + waste)
  const perM2 = tilesPerM2(tile)
  const pcs = Math.ceil(buyM2 * perM2 - 1e-9)
  const boxes = tile.pcsBox ? Math.ceil(pcs / tile.pcsBox - 1e-9) : null
  const bed = BED[where]
  const cementKg = fixing === 'mortar' ? netM2 * bed.cementKg : 0
  const adhesiveKg = fixing === 'adhesive' ? netM2 * adhesivePerM2(tile) : 0
  return {
    tile,
    netM2,
    waste,
    buyM2,
    perM2,
    pcs,
    boxes,
    groutKg: netM2 * groutPerM2(tile) * GROUT_WASTE,
    cementKg,
    cementBags: Math.ceil(cementKg / CEMENT_BAG_KG - 1e-9),
    sandM3: fixing === 'mortar' ? netM2 * bed.sandM3 : 0,
    adhesiveKg,
    adhesiveBags: Math.ceil(adhesiveKg / ADHESIVE_BAG_KG - 1e-9),
  }
}
