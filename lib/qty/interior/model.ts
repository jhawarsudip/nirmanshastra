/*
  InteriorPro model: paint, putty and primer, floor and wall tiles, false ceiling, doors and windows, and the carpentry sheets.

  It starts where MasonryPro stops: the plaster is MasonryPro's, the putty on it is this tool's. It uses the same room plan
  (lib/qty/plan.ts), so the two reports measure the same walls. The room sizes come from a few plain answers; each surface is
  measured from them the way IS 1200 measures it (Part 11 floors, dado and skirting; Part 12 plastering; Part 13 paint), and
  every material follows from the area.

  Every figure is one of four kinds, and the report says which:
    Code      read from a standard or a CPWD document (IS 1200, IS 1003, IS 15622, IS 303; CPWD Delhi Analysis of Rates 2016)
    Maker     from a maker's data sheet (paint spread, putty spread, tile boxes, adhesive coverage)
    Derived   worked out from the above with arithmetic that is shown (tiles per m², grout, board joints, panel areas)
    Assumed   no source fixes it (room sizes, door and window sizes, wastage, kitchen runs, wardrobe sizes); a stated, editable value
  The research behind each number is in the project file "research-interior-2026-10-25".

  The site is quantity-only: nothing here knows a price, a labour rate or a dealer.
*/

import type { BaseInput, Check, Fact, Parsed, QtyLine, Ran, Table, Tile, TradeModel } from '../types'
import { Reader, SQFT_TO_M2, ceilTo, fmt, rangeText, round } from '../util'
import { perim, planFloors } from '../plan'
import {
  ADHESIVE_BAG_KG, BED, CEMENT_BAG_KG, GROUT_WASTE, IN_SYS, PAINT_WASTE, TILES,
  adhesivePerM2, groutPerM2, tileWaste, tilesPerM2,
  type PaintTier, type TileDef,
} from './finish'

export type { PaintTier }
export type ExtTier = 'none' | 'cement' | 'acrylic' | 'textured'
export type FalseCeil = 'none' | 'hall' | 'rooms'
export type TileSize = '600x600' | '800x800' | '600x1200'

export interface InteriorInput extends BaseInput {
  dwelling: 'house' | 'flats'
  /** flats only: homes on each floor */
  homesPerFloor: number
  /** per home (for a house, the whole house) */
  bedrooms: number
  bathrooms: number
  kitchens: number
  balconies: number
  paint: PaintTier
  exterior: ExtTier
  falseCeiling: FalseCeil
  tileSize: TileSize
  tileFix: 'mortar' | 'adhesive'
  lay: 'straight' | 'diagonal'
  /** bathroom wall tiles up to the door height (2.1 m) or half way (1.2 m) */
  bathTile: 'full' | 'half'
  kitchenShape: 'straight' | 'l' | 'u'
  kitchenCabinets: boolean
  wardrobes: 'none' | 'master' | 'all'
  storeyM: number
}

export function parseInterior(raw: unknown): Parsed<InteriorInput> {
  const r = new Reader(raw)
  const floorAreasSqft = r.floors()
  const { state, city } = r.place()
  const dwelling = r.pick('dwelling', 'Building type', ['house', 'flats'] as const, 'house')
  const homesPerFloor = dwelling === 'flats' ? r.int('homesPerFloor', 'Homes on each floor', 1, 8, 2) : 1
  const bedrooms = r.int('bedrooms', 'Bedrooms', 1, 8, 3)
  const bathrooms = r.int('bathrooms', 'Bathrooms', 1, 10, Math.min(bedrooms, 4))
  const kitchens = r.int('kitchens', 'Kitchens', 1, 3, 1)
  const balconies = r.int('balconies', 'Balconies', 0, 6, 1)
  const paint = r.pick('paint', 'Paint inside', ['economy', 'standard', 'premium'] as const, 'standard')
  const exterior = r.pick('exterior', 'Paint outside', ['none', 'cement', 'acrylic', 'textured'] as const, 'acrylic')
  const falseCeiling = r.pick('falseCeiling', 'False ceiling', ['none', 'hall', 'rooms'] as const, 'none')
  const tileSize = r.pick('tileSize', 'Floor tile size', ['600x600', '800x800', '600x1200'] as const, '600x600')
  const tileFix = r.pick('tileFix', 'Tile fixing', ['mortar', 'adhesive'] as const, 'mortar')
  const lay = r.pick('lay', 'Tile laying', ['straight', 'diagonal'] as const, 'straight')
  const bathTile = r.pick('bathTile', 'Bathroom wall tiles', ['full', 'half'] as const, 'full')
  const kitchenShape = r.pick('kitchenShape', 'Kitchen shape', ['straight', 'l', 'u'] as const, 'l')
  const kitchenCabinets = r.bool('kitchenCabinets', false)
  const wardrobes = r.pick('wardrobes', 'Wardrobes', ['none', 'master', 'all'] as const, 'none')
  const storeyM = r.num('storeyM', 'Floor to floor height', 2.7, 4.0, 3.0)
  if (r.error) return { ok: false, error: r.error }
  return {
    ok: true,
    input: { floorAreasSqft, state, city, dwelling, homesPerFloor, bedrooms, bathrooms, kitchens, balconies, paint, exterior, falseCeiling, tileSize, tileFix, lay, bathTile, kitchenShape, kitchenCabinets, wardrobes, storeyM },
  }
}

/* ───────────────────────── tables of figures ───────────────────────── */

/* heights and sizes (Assumed unless stated) */
const SLAB_T = 0.15 // m
const PLINTH_ABOVE = 0.45
const PARAPET_H = 1.0
const PARAPET_T = 0.115
const MUMTY = { perimeter: 12, height: 2.4 }
const BALCONY = { edge: 6.0, area: 4.5 }
const T_EXT = 0.23 // outer wall (m): the room plan needs a wall thickness
const T_INT = 0.115

interface ExSys { label: string; primer?: number; finish: { label: string; v: number; unit: 'kg' | 'L' }; src: string }
const EXT_SYS: Record<Exclude<ExtTier, 'none'>, ExSys> = {
  cement: { label: 'Cement paint, 2 coats', finish: { label: 'Cement paint', v: 0.384, unit: 'kg' }, src: 'CPWD DAR 2016 item 13.44.1 (0.384 kg a m²); IS 2395 (Part 1) says 0.25 to 0.33 kg a m² for two coats' },
  acrylic: { label: 'Smooth acrylic exterior emulsion, 2 coats over exterior primer', primer: 0.095, finish: { label: 'Exterior acrylic emulsion', v: 0.167, unit: 'L' }, src: 'CPWD DAR 2016 item 13.46.1 (0.167 L a m²); primer from the maker sheet, 100 to 120 sq ft a litre' },
  textured: { label: 'Textured exterior finish over exterior primer', primer: 0.095, finish: { label: 'Textured exterior finish', v: 0.328, unit: 'L' }, src: 'CPWD DAR 2016 item 13.45.1 (0.328 L a m²); primer from the maker sheet, 100 to 120 sq ft a litre' },
}

/** Wood and steel: CPWD DAR 2016 items 13.48.2 and 13.50.1: primer 0.075 L, multi-surface paint 0.090 L a m², two coats. */
const WOOD = { primer: 0.075, paint: 0.09 }

const SKIRT_H = 0.10
const SKIRT_LOSS = 1.10
const WP_UPSTAND = 0.30

/** False ceiling, per m² of ceiling, from a public specification for a gypsum ceiling (450 / 1200 / 1200 / 230 mm spacing). */
const FC = {
  boardM2: 2.88, boardWaste: 1.08,
  sectionM: 2.22, channelM: 0.83, cleats: 0.69, fasteners: 0.69, hangers: 0.69, hangerM: 0.45, screws: 9.7, screwPitch: 0.23, wireM: 0.43,
}

/* doors and windows */
interface Op { name: string; w: number; h: number; des?: string }
const DOOR = {
  main: { name: 'Main door', w: 1.0, h: 2.1, des: '10 DS 21' } as Op,
  room: { name: 'Room door', w: 0.9, h: 2.1, des: '9 DS 21' } as Op,
  bath: { name: 'Bathroom door', w: 0.8, h: 2.1, des: '8 DS 21' } as Op,
  mumty: { name: 'Door of the terrace stair room', w: 0.9, h: 2.1, des: '9 DS 21' } as Op,
}
const GLAZED = {
  balc: { name: 'Balcony door, glazed', w: 1.2, h: 2.1 } as Op,
  winB: { name: 'Bedroom window', w: 1.5, h: 1.2 } as Op,
  winL: { name: 'Living room window', w: 1.8, h: 1.2 } as Op,
  winK: { name: 'Kitchen window', w: 1.2, h: 1.2 } as Op,
  winS: { name: 'Stair window', w: 1.2, h: 1.2 } as Op,
  vent: { name: 'Bathroom ventilator', w: 0.6, h: 0.45 } as Op,
}
const FRAME = { b: 0.10, d: 0.065, horn: 0.10 } // timber door frame section and the horn at each top corner, m (section Assumed)
const GLASS_SHARE = 0.80
const GLASS_WASTE = 1.05
const hingesFor = (w: number) => (w <= 0.9 + 1e-9 ? 3 : 4)

/* carpentry */
const SHEET_M2 = 2.44 * 1.22
const CUT_WASTE = 1.12
const KITCHEN_RUN = { straight: 3.0, l: 4.2, u: 5.4 } as const
const COUNTER_D = 0.60
const BASE = { H: 0.72, D: 0.60 }
const WALL_UNIT = { share: 0.70, H: 0.70, D: 0.35 }
const WARDROBE = { H: 2.1, D: 0.6, master: 2.4, other: 1.8 }
const GRANITE_WASTE = 1.10

/** One cabinet run as panels (m²) and edges (m). Derived: the formula comes from the box geometry. */
interface Cab { carcass: number; shutters: number; back: number; edge: number; leaves: number; hinges: number }
function cabinet(w: number, H: number, D: number, bays: number, fullShelves: number, topBottom: number, hingePerLeaf: number): Cab {
  const verticals = bays + 1
  const carcass = verticals * H * D + (topBottom + fullShelves) * w * D
  const edge = verticals * H + (topBottom + fullShelves) * w + 2 * w + 2 * bays * H
  return { carcass, shutters: w * H, back: w * H, edge, leaves: bays, hinges: bays * hingePerLeaf }
}

function spread(total: number, n: number): number[] {
  const base = Math.floor(total / n)
  const rem = total % n
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0))
}

/* ───────────────────────── the model ───────────────────────── */

export function runInterior(inp: InteriorInput): Ran {
  const N = inp.floorAreasSqft.length
  const flats = inp.dwelling === 'flats'
  const h = flats ? inp.homesPerFloor : 1
  const H = inp.storeyM
  const Hc = H - SLAB_T // clear height for plaster and paint: floor to the underside of the slab
  const footM2 = inp.floorAreasSqft.map((a) => a * SQFT_TO_M2)

  const bed: number[] = flats ? Array(N).fill(inp.bedrooms) : spread(inp.bedrooms, N)
  const bath: number[] = flats ? Array(N).fill(inp.bathrooms) : spread(inp.bathrooms, N)
  const kit: number[] = flats ? Array(N).fill(inp.kitchens) : spread(inp.kitchens, N)
  const balc: number[] = flats ? Array(N).fill(h * inp.balconies) : N === 1 ? [inp.balconies] : [0, ...spread(inp.balconies, N - 1)]
  const plans = planFloors({ footM2, flats, h, bed, bath, kit, tExt: T_EXT, tInt: T_INT })

  // ── rooms and openings, added up over every floor and home
  const agg = { nBed: 0, aBed: 0, pBed: 0, nLiv: 0, aLiv: 0, pLiv: 0, nKit: 0, aKit: 0, pKit: 0, nBath: 0, aBath: 0, pBath: 0, aPass: 0, pPass: 0, aCore: 0, pCore: 0 }
  const open = { main: 0, room: 0, bath: 0, mumty: 0, balc: 0, winB: 0, winL: 0, winK: 0, winS: 0, vent: 0 }
  let homes = 0
  for (let i = 0; i < N; i++) {
    const p = plans[i]
    const nh = p.homes
    const bI = nh * bed[i], baI = nh * bath[i], kI = nh * kit[i]
    agg.nBed += bI; agg.aBed += bI * p.areas.bed; agg.pBed += bI * perim(p.areas.bed, 1.3)
    agg.nLiv += nh; agg.aLiv += nh * p.areas.living; agg.pLiv += nh * perim(p.areas.living, 1.3)
    agg.nKit += kI; agg.aKit += kI * p.areas.kit; agg.pKit += kI * perim(p.areas.kit, 1.3)
    agg.nBath += baI; agg.aBath += baI * p.areas.bath; agg.pBath += baI * perim(p.areas.bath, 1.3)
    agg.aPass += nh * p.areas.pass; agg.pPass += nh * perim(p.areas.pass, 4)
    if (p.core > 0) { agg.aCore += p.core; agg.pCore += perim(p.core, 1.5) }
    open.room += bI + kI
    open.bath += baI
    open.vent += baI
    open.winB += bI
    open.winK += kI
    open.winL += nh * (flats || i === 0 ? 2 : 1)
    open.main += flats ? h : i === 0 ? 1 : 0
    if (N >= 2) open.winS += 1
    open.balc += balc[i]
    homes += nh
  }
  const hasMumty = N >= 2
  if (hasMumty) open.mumty = 1
  const balcTotal = balc.reduce((s, x) => s + x, 0)
  const area = (o: Op) => o.w * o.h

  // ── paint area, measured as IS 1200 Part 13 measures it
  // Openings up to 0.5 m² are not taken out. From 0.5 to 3 m², one face is taken out: a door between two painted rooms once
  // in all, a window or an outer door half from each face, because the finish differs inside and outside.
  const dado = inp.bathTile === 'full' ? 2.1 : 1.2
  const run = KITCHEN_RUN[inp.kitchenShape]
  const SPLASH_H = 0.6
  const kitSplash = agg.nKit * run * SPLASH_H
  const bathWallTile = Math.max(0, agg.pBath * dado - open.bath * DOOR.bath.w * Math.min(2.1, dado))
  const bathAbove = agg.pBath * (Hc - dado)
  const bathAboveDed = open.bath * DOOR.bath.w * Math.max(0, 2.1 - dado)
  const bathPaint = Math.max(0, bathAbove - bathAboveDed)

  const wallsGross = (agg.pBed + agg.pLiv + agg.pKit + agg.pPass + agg.pCore) * Hc
  const dedRoomDoors = open.room * area(DOOR.room)
  const dedMain = open.main * area(DOOR.main) * (flats ? 1 : 0.5)
  const dedWin = 0.5 * (open.winB * area(GLAZED.winB) + open.winL * area(GLAZED.winL) + open.winK * area(GLAZED.winK) + open.winS * area(GLAZED.winS) + open.balc * area(GLAZED.balc))
  const wallsDed = dedRoomDoors + dedMain + dedWin + kitSplash
  const wallsNet = Math.max(0, wallsGross - wallsDed)
  const wallPaint = wallsNet + bathPaint
  const roomsArea = agg.aBed + agg.aLiv + agg.aKit + agg.aBath + agg.aPass + agg.aCore
  const ceilPaint = roomsArea
  const interiorPaint = wallPaint + ceilPaint

  // outside: the outer faces from the plinth to the terrace, the parapet, the balcony edges and the balcony undersides
  const topP = plans[N - 1].P
  const outFace = plans.reduce((s, p) => s + p.P * H, 0) + plans[0].P * PLINTH_ABOVE + (hasMumty ? MUMTY.perimeter * (MUMTY.height + SLAB_T) : 0)
  const parapetFaces = topP * (2 * PARAPET_H + PARAPET_T)
  const balcFaces = balcTotal * BALCONY.edge * (2 * PARAPET_H + PARAPET_T)
  const balcUnder = balcTotal * BALCONY.area
  const extDed = 0.5 * (open.winB * area(GLAZED.winB) + open.winL * area(GLAZED.winL) + open.winK * area(GLAZED.winK) + open.winS * area(GLAZED.winS) + open.balc * area(GLAZED.balc) + (flats ? 0 : open.main * area(DOOR.main)))
  const extGross = outFace + parapetFaces + balcFaces + balcUnder
  const extPaint = inp.exterior === 'none' ? 0 : Math.max(0, extGross - extDed)

  // doors painted on both faces
  const nDoors = open.main + open.room + open.bath + open.mumty
  const leafArea = open.main * area(DOOR.main) + open.room * area(DOOR.room) + open.bath * area(DOOR.bath) + open.mumty * area(DOOR.mumty)
  const doorSurf = 2 * leafArea

  // ── putty, primer and paint
  const sys = IN_SYS[inp.paint]
  const puttyKg = sys.putty ? interiorPaint * sys.putty.kg * PAINT_WASTE : 0
  const primerL = interiorPaint * sys.primer.l * PAINT_WASTE
  const finishL = interiorPaint * sys.finish.l * PAINT_WASTE
  const ex = inp.exterior === 'none' ? null : EXT_SYS[inp.exterior]
  const exPrimerL = ex && ex.primer ? extPaint * ex.primer * PAINT_WASTE : 0
  const exFinish = ex ? extPaint * ex.finish.v * PAINT_WASTE : 0
  const woodPrimerL = doorSurf * WOOD.primer * PAINT_WASTE
  const enamelL = doorSurf * WOOD.paint * PAINT_WASTE

  // ── tiles
  const mainT = TILES[inp.tileSize]
  const T300 = TILES['300x300']
  const T3060 = TILES['300x600']
  const floorMain = agg.aBed + agg.aLiv + agg.aKit + agg.aPass + agg.aCore
  const skirtRM = Math.max(
    0,
    agg.pBed + agg.pLiv + agg.pPass + agg.pCore -
      (2 * agg.nBed * DOOR.room.w + agg.nKit * DOOR.room.w + open.bath * DOOR.bath.w + open.main * DOOR.main.w + open.balc * GLAZED.balc.w),
  )
  const skirtArea = skirtRM * SKIRT_H * SKIRT_LOSS
  const balcFloor = balcTotal * BALCONY.area

  interface TileUse { use: string; t: TileDef; net: number; waste: number; buy: number; pcs: number }
  const mkUse = (use: string, t: TileDef, net: number, small: boolean): TileUse => {
    const waste = tileWaste(t, inp.lay, small)
    const buy = net * (1 + waste)
    return { use, t, net, waste, buy, pcs: Math.ceil(buy * tilesPerM2(t) - 1e-9) }
  }
  const tileUses: TileUse[] = [
    mkUse('Floors of living rooms, bedrooms, kitchens and passages, with skirting', mainT, floorMain + skirtArea, false),
    mkUse('Bathroom floors', T300, agg.aBath, true),
    ...(balcFloor > 0 ? [mkUse('Balcony floors', T300, balcFloor, true)] : []),
    mkUse(`Bathroom walls, to ${inp.bathTile === 'full' ? 'the door height' : 'half height'}`, T3060, bathWallTile, true),
    mkUse('Kitchen wall above the counter', T3060, kitSplash, true),
  ].filter((u) => u.net > 1e-9)
  const bySize = new Map<string, { t: TileDef; net: number; buy: number }>()
  for (const u of tileUses) {
    const c = bySize.get(u.t.key) ?? { t: u.t, net: 0, buy: 0 }
    c.net += u.net
    c.buy += u.buy
    bySize.set(u.t.key, c)
  }
  const sizeRows = [...bySize.values()].map((c) => {
    const pcs = Math.ceil(c.buy * tilesPerM2(c.t) - 1e-9)
    const boxes = c.t.pcsBox ? Math.ceil(pcs / c.t.pcsBox - 1e-9) : null
    return { ...c, pcs, boxes }
  })
  const tileBuyTotal = sizeRows.reduce((s, r) => s + r.buy, 0)

  // fixing: mortar bed and slurry, or adhesive; and grout
  const floorFix = floorMain + agg.aBath + balcFloor
  const wallFix = bathWallTile + kitSplash + skirtArea
  const bedCementKg = inp.tileFix === 'mortar' ? floorFix * BED.floor.cementKg + wallFix * BED.wall.cementKg : 0
  const bedSandM3 = inp.tileFix === 'mortar' ? floorFix * BED.floor.sandM3 + wallFix * BED.wall.sandM3 : 0
  const bedCementBags = Math.ceil(bedCementKg / CEMENT_BAG_KG - 1e-9)
  const adhesiveKg = inp.tileFix === 'adhesive' ? tileUses.reduce((s, u) => s + u.net * adhesivePerM2(u.t), 0) : 0
  const adhesiveBags = Math.ceil(adhesiveKg / ADHESIVE_BAG_KG - 1e-9)
  const groutBySize = [...bySize.values()].map((c) => ({ t: c.t, kg: c.net * groutPerM2(c.t) * GROUT_WASTE }))
  const groutKg = groutBySize.reduce((s, g) => s + g.kg, 0)

  // wet areas
  const wpArea = agg.aBath + agg.pBath * WP_UPSTAND
  const thresholdRM = open.bath * DOOR.bath.w + open.main * DOOR.main.w + open.balc * GLAZED.balc.w
  const thresholdN = open.bath + open.main + open.balc
  const counterArea = agg.nKit * run * COUNTER_D
  const counterEdge = agg.nKit * run

  // ── false ceiling
  const fcArea = inp.falseCeiling === 'none' ? 0 : inp.falseCeiling === 'hall' ? agg.aLiv : agg.aLiv + agg.aBed
  const fcPerim = inp.falseCeiling === 'none' ? 0 : inp.falseCeiling === 'hall' ? agg.pLiv : agg.pLiv + agg.pBed
  const fc = {
    boards: Math.ceil((fcArea * FC.boardWaste) / FC.boardM2 - 1e-9),
    sectionM: fcArea * FC.sectionM,
    channelM: fcArea * FC.channelM,
    cleats: Math.ceil(fcArea * FC.cleats - 1e-9),
    fasteners: Math.ceil(fcArea * FC.fasteners - 1e-9),
    hangers: Math.ceil(fcArea * FC.hangers - 1e-9),
    hangerM: fcArea * FC.hangers * FC.hangerM,
    screws: Math.ceil(fcArea * FC.screws + fcPerim / FC.screwPitch - 1e-9),
    wireM: fcArea * FC.wireM,
    perimM: fcPerim,
  }

  // ── doors and windows
  const frameVol = (o: Op) => (2 * o.h + o.w + 2 * FRAME.horn) * FRAME.b * FRAME.d
  interface DoorRow { op: Op; n: number; leaf: number; frame: number; hinges: number }
  const doorRows: DoorRow[] = ([['main', open.main], ['room', open.room], ['bath', open.bath], ['mumty', open.mumty]] as const)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => ({ op: DOOR[k], n, leaf: n * area(DOOR[k]), frame: n * frameVol(DOOR[k]), hinges: n * hingesFor(DOOR[k].w) }))
  const frameTotal = doorRows.reduce((s, r) => s + r.frame, 0)
  const doorHinges = doorRows.reduce((s, r) => s + r.hinges, 0)
  const locks = open.main + agg.nBed
  const bolts = 2 * open.main + open.bath

  interface GlRow { id: keyof typeof GLAZED; op: Op; n: number; glass: number; sections: number }
  const panes = (o: Op) => (o.w <= 0.9 ? 1 : 2)
  const glRows: GlRow[] = (Object.keys(GLAZED) as (keyof typeof GLAZED)[])
    .map((id) => ({ id, n: open[id] }))
    .filter((x) => x.n > 0)
    .map(({ id, n }) => {
      const o = GLAZED[id]
      const frame = 2 * (o.w + o.h)
      const sash = id === 'vent' ? 0 : panes(o) * 2 * (o.h - 0.1 + o.w / panes(o))
      return { id, op: o, n, glass: n * area(o) * GLASS_SHARE * GLASS_WASTE, sections: n * (frame + sash) }
    })
  const glassTotal = glRows.reduce((s, r) => s + r.glass, 0)
  const sectionTotal = glRows.reduce((s, r) => s + r.sections, 0)
  const nGlazed = glRows.reduce((s, r) => s + r.n, 0)

  // ── carpentry
  const dwellings = flats ? h * N : 1 // one master bedroom to a flat, one to a house
  const masterN = inp.wardrobes === 'none' ? 0 : Math.min(dwellings, agg.nBed)
  const otherN = inp.wardrobes === 'all' ? Math.max(0, agg.nBed - dwellings) : 0
  interface CabRow { item: string; n: number; w: number; cab: Cab }
  const cabs: CabRow[] = []
  const wardrobe = (w: number) => cabinet(w, WARDROBE.H, WARDROBE.D, Math.ceil(w / 0.9 - 1e-9), 2, 2, 4)
  if (masterN > 0) cabs.push({ item: 'Wardrobe, master bedroom', n: masterN, w: WARDROBE.master, cab: wardrobe(WARDROBE.master) })
  if (otherN > 0) cabs.push({ item: 'Wardrobe, other bedroom', n: otherN, w: WARDROBE.other, cab: wardrobe(WARDROBE.other) })
  if (inp.kitchenCabinets && agg.nKit > 0) {
    const wRun = run * WALL_UNIT.share
    cabs.push({ item: 'Kitchen, units below the counter', n: agg.nKit, w: run, cab: cabinet(run, BASE.H, BASE.D, Math.ceil(run / 0.6 - 1e-9), 1, 1, 2) })
    cabs.push({ item: 'Kitchen, units on the wall', n: agg.nKit, w: wRun, cab: cabinet(wRun, WALL_UNIT.H, WALL_UNIT.D, Math.ceil(wRun / 0.6 - 1e-9), 1, 2, 2) })
  }
  const sum = (f: (c: CabRow) => number) => cabs.reduce((s, c) => s + c.n * f(c), 0)
  const ply19 = sum((c) => c.cab.carcass + c.cab.shutters)
  const ply8 = sum((c) => c.cab.back)
  const laminate = 2 * ply19
  const edgeBand = sum((c) => c.cab.edge)
  const cabHinges = sum((c) => c.cab.hinges)
  const cabHandles = sum((c) => c.cab.leaves)
  const sheets = (m2: number) => Math.ceil((m2 * CUT_WASTE) / SHEET_M2 - 1e-9)
  const hasCarpentry = cabs.length > 0

  // ───────── free part ─────────
  const nWindows = nGlazed - open.balc
  const tierName = { economy: 'Economy', standard: 'Standard', premium: 'Premium' }[inp.paint]
  const avgKit = agg.nKit > 0 ? agg.aKit / agg.nKit : 0
  const avgBath = agg.nBath > 0 ? agg.aBath / agg.nBath : 0
  const avgBed = agg.nBed > 0 ? agg.aBed / agg.nBed : 0
  const avgLiv = agg.nLiv > 0 ? agg.aLiv / agg.nLiv : 0
  const livWinPer = agg.nLiv > 0 ? open.winL / agg.nLiv : 1
  const bedRatio = avgBed > 0 ? area(GLAZED.winB) / avgBed : 1
  const livRatio = avgLiv > 0 ? (livWinPer * area(GLAZED.winL)) / avgLiv : 1
  const kitchenOk = avgKit >= 5.0 - 1e-9
  const bathOk = avgBath >= 2.8 - 1e-9

  const checks: Check[] = []
  checks.push({
    id: 'tile-class', clause: 'IS 15622:2006 cl 4.1', description: 'Tile type for floors and walls', status: 'pass',
    detail: 'Floor tiles in bathrooms, balconies and kitchens should be of water absorption group BIa (up to 0.08%), which means vitrified or porcelain tiles. Glazed ceramic tiles are for walls. This report counts the sizes you chose; the group is your choice at the shop.',
  })
  checks.push({
    id: 'measure', clause: 'IS 1200 (Part 11):1977, (Part 12):1976, (Part 13):1994', description: 'How the surfaces are measured', status: 'pass',
    detail: 'Floors are measured before the skirting and dado go on. Openings up to 0.5 m² are not taken out of paint or plaster; from 0.5 to 3 m², one face is taken out. Doors, windows and glazed balcony doors are taken out on that rule, and the skirting is measured in running metres after the door widths.',
  })
  checks.push({
    id: 'rooms-min', clause: 'NBC 2016 Part 3 (read in a summary; the code itself was not read)', description: 'Kitchen and bathroom sizes',
    status: kitchenOk && bathOk ? 'pass' : 'advisory',
    detail: `The rooms in this report are sized from your floor area. The kitchen works out near ${fmt(avgKit, 1)} m² against a minimum of 5.0 m² (1.8 m wide), and a bathroom with a WC near ${fmt(avgBath, 1)} m² against 2.8 m².${kitchenOk && bathOk ? '' : ' One of them is under the minimum, so your real plan needs a check against your local rules.'}`,
  })
  checks.push({
    id: 'door-size', clause: 'IS 1003 (Part 1):2003 cl 7.2 and Table 3', description: 'Door sizes',
    status: 'pass',
    detail: `Doors are sized to the standard designations: ${DOOR.main.des} for the main door (1.0 m), ${DOOR.room.des} for rooms and the kitchen (0.9 m) and ${DOOR.bath.des} for bathrooms (0.8 m), all 2.1 m high. The number in the name times 100 mm is the opening width.`,
  })
  checks.push({
    id: 'light', clause: 'NBC 2016 Part 8 (read in a summary; the code itself was not read)', description: 'Window size against room size',
    status: bedRatio >= 0.10 - 1e-9 && livRatio >= 0.10 - 1e-9 ? 'pass' : 'advisory',
    detail: `A habitable room needs windows of at least a tenth of its floor area. The bedroom window counted is ${fmt(area(GLAZED.winB), 1)} m² for a room of about ${fmt(avgBed, 1)} m² (${fmt(bedRatio * 100)}%) and the living room has ${fmt(livWinPer * area(GLAZED.winL), 1)} m² of window for about ${fmt(avgLiv, 1)} m² (${fmt(livRatio * 100)}%).${bedRatio >= 0.1 && livRatio >= 0.1 ? '' : ' One falls short, so ask for a larger window.'}`,
  })
  checks.push({
    id: 'wet', clause: 'IS 3067:1988 (scope: basements and roofs)', description: 'Waterproofing in bathrooms', status: 'advisory',
    detail: 'No Indian Standard read here gives the coverage of a bathroom waterproofing coat; IS 3067 covers basements and roofs. This report counts the area to coat (the floor and 0.30 m up the walls) and the corner fillet, and leaves the coverage to the product’s data sheet. Test it by ponding water for 24 hours before the tiles go on.',
  })
  if (inp.exterior === 'cement') {
    checks.push({
      id: 'coats', clause: 'IS 2395 (Part 1):1994 cl B-2.5.4', description: 'Coats of cement paint', status: 'pass',
      detail: 'Cement paint goes on in at least two coats, with at least 24 hours between them, and each coat is cured by sprinkling water. Two coats are counted.',
    })
  } else {
    checks.push({
      id: 'coats', clause: 'IS 2395 (Part 1):1994', description: 'Coats of paint', status: 'pass',
      detail: `IS 2395 gives no single number of coats for emulsion or distemper, so the coats counted follow the makers' data sheets: ${sys.coats.toLowerCase()}.`,
    })
  }
  if (hasCarpentry) {
    checks.push({
      id: 'ply', clause: 'IS 303:2024 cl 8.1 and 8.2', description: 'Plywood sizes', status: 'pass',
      detail: 'Plywood comes in sheets of 2440 × 1220 mm (and four smaller sizes) in thicknesses of 3 to 25 mm. Panels here are 19 mm for the carcass and shutters and 8 mm for the back, counted in sheets of 2440 × 1220 mm.',
    })
  }

  const warnings: string[] = []
  if (inp.tileFix === 'adhesive') warnings.push('Tile adhesive needs a level, cured floor. A levelling screed under it is not counted here. Check the maker’s sheet: the adhesive weight here follows one maker’s coverage and others differ.')
  if (inp.falseCeiling !== 'none') warnings.push('A false ceiling lowers the room by the depth of the framing, about 0.3 m here. Ask your architect for the clear height your local rules need before you fix it.')
  if (inp.lay === 'diagonal') warnings.push('Diagonal laying takes more tile for cutting at the edges. This report allows 10% (15% for large tiles) instead of 5% (10%).')
  if (inp.exterior === 'textured') warnings.push('A textured finish takes more material on a rough wall than on a smooth one. IS 1200 (Part 13) adds a percentage for uneven surfaces; ask the applicator how rough yours will be.')
  if (!kitchenOk || !bathOk) warnings.push('With this floor area the kitchen or the bathroom works out smaller than the usual minimum. The tiles, paint and carpentry here follow those sizes, so measure your real rooms and compare.')

  const homesNote = flats ? `${h * N} flats` : 'One house'
  const facts: Fact[] = [
    { k: 'Rooms counted', v: String(agg.nBed + agg.nLiv + agg.nKit + agg.nBath), note: `${agg.nBed} ${agg.nBed === 1 ? 'bedroom' : 'bedrooms'}, ${agg.nBath} ${agg.nBath === 1 ? 'bathroom' : 'bathrooms'}, ${agg.nKit} ${agg.nKit === 1 ? 'kitchen' : 'kitchens'}, ${agg.nLiv} living ${agg.nLiv === 1 ? 'room' : 'rooms'}` },
    { k: 'Building', v: homesNote, note: `${N} ${N === 1 ? 'floor' : 'floors'}, ${fmt(H, 2)} m floor to floor` },
    { k: 'Paint inside', v: tierName, note: sys.coats },
    { k: 'Paint outside', v: inp.exterior === 'none' ? 'Not painted' : { cement: 'Cement paint', acrylic: 'Acrylic emulsion', textured: 'Textured finish' }[inp.exterior], note: ex ? ex.label : 'Left for later' },
    { k: 'Floor tiles', v: mainT.label, note: `${inp.lay === 'diagonal' ? 'Laid diagonally' : 'Laid straight'}, fixed with ${inp.tileFix === 'mortar' ? 'a mortar bed' : 'adhesive'}` },
    { k: 'Bathroom walls', v: inp.bathTile === 'full' ? 'Tiled to the door height' : 'Tiled half way up', note: '300 × 600 mm wall tiles' },
    { k: 'False ceiling', v: inp.falseCeiling === 'none' ? 'None' : inp.falseCeiling === 'hall' ? 'Living rooms' : 'Living rooms and bedrooms', note: 'Gypsum board on a steel frame' },
    { k: 'Kitchen', v: { straight: 'Straight run', l: 'L shape', u: 'U shape' }[inp.kitchenShape], note: inp.kitchenCabinets ? 'With cabinets' : 'Counter only' },
    { k: 'Wardrobes', v: inp.wardrobes === 'none' ? 'None' : inp.wardrobes === 'master' ? 'Master bedroom' : 'Every bedroom', note: 'Built in, plywood and laminate' },
  ]

  // ───────── paid part ─────────
  const sheetsPly19 = hasCarpentry ? sheets(ply19) : 0
  const sheetsPly8 = hasCarpentry ? sheets(ply8) : 0
  const sheetsLam = hasCarpentry ? sheets(laminate) : 0
  const paintedTotal = interiorPaint + extPaint
  const t4: Tile = hasCarpentry
    ? { k: 'Plywood', v: fmt(sheetsPly19 + sheetsPly8), unit: 'sheets', range: `${rangeText(sheetsPly19 + sheetsPly8, 0.7, 1.4)} sheets` }
    : fcArea > 0
      ? { k: 'False ceiling', v: fmt(fcArea), unit: 'm²', range: `${rangeText(fcArea, 0.85, 1.2)} m²` }
      : { k: 'Window glass', v: fmt(glassTotal), unit: 'm²', range: `${rangeText(glassTotal, 0.8, 1.3)} m²` }
  const tiles: Tile[] = [
    { k: 'Painted area', v: fmt(paintedTotal), unit: 'm²', range: `${rangeText(paintedTotal, 0.85, 1.2)} m²` },
    { k: 'Tiles', v: fmt(tileBuyTotal), unit: 'm²', range: `${rangeText(tileBuyTotal, 0.9, 1.15)} m²` },
    { k: 'Doors and windows', v: fmt(nDoors + nGlazed), unit: 'nos', range: `${rangeText(nDoors + nGlazed, 0.85, 1.25)} nos` },
    t4,
  ]

  const m2 = (v: number) => fmt(v, 1)
  const areaRows: (string | number)[][] = [
    ['Walls in rooms and passages', m2(wallsGross), m2(wallsDed), m2(wallsNet), 'Paint; doors out once, windows half; the wall above the kitchen counter is tiled'],
    ['Bathroom walls above the tiles', m2(bathAbove), m2(bathAboveDed), m2(bathPaint), `Paint above the ${fmt(dado, 1)} m tiling`],
    ['Ceilings, inside', m2(roomsArea), '0.0', m2(roomsArea), 'Slab or board, painted either way'],
    ...(inp.exterior === 'none' ? [] : [['Outside of the building', m2(extGross), m2(extDed), m2(extPaint), 'Walls, parapet, balcony edges and undersides; openings half from each face']]),
    ['Doors, both faces', m2(doorSurf), '0.0', m2(doorSurf), 'Shutters of timber; frames are counted with them'],
    ['Bathroom wall tiles', m2(agg.pBath * dado), m2(agg.pBath * dado - bathWallTile), m2(bathWallTile), 'Door opening taken out'],
    ['Kitchen wall above the counter, tiles', m2(kitSplash), '0.0', m2(kitSplash), `${fmt(run, 1)} m run, ${fmt(SPLASH_H, 1)} m high`],
    ['Floors to be tiled', m2(floorMain + agg.aBath + balcFloor), '0.0', m2(floorMain + agg.aBath + balcFloor), 'Measured before the skirting goes on (IS 1200 Part 11)'],
  ]

  const paintRows: (string | number)[][] = []
  if (sys.putty) paintRows.push([sys.putty.label, m2(interiorPaint), `${fmt(sys.putty.kg, 2)} kg`, fmt(puttyKg), 'kg'])
  paintRows.push([`Primer, inside`, m2(interiorPaint), `${fmt(sys.primer.l, 3)} L`, fmt(primerL), 'L'])
  paintRows.push([sys.finish.label, m2(interiorPaint), `${fmt(sys.finish.l, 3)} L`, fmt(finishL), 'L'])
  if (ex) {
    if (ex.primer) paintRows.push(['Primer, outside', m2(extPaint), `${fmt(ex.primer, 3)} L`, fmt(exPrimerL), 'L'])
    paintRows.push([ex.finish.label, m2(extPaint), `${fmt(ex.finish.v, 3)} ${ex.finish.unit}`, fmt(exFinish), ex.finish.unit])
  }
  paintRows.push(['Primer, doors', m2(doorSurf), `${fmt(WOOD.primer, 3)} L`, fmt(woodPrimerL), 'L'])
  paintRows.push(['Enamel or multi-surface paint, doors', m2(doorSurf), `${fmt(WOOD.paint, 3)} L`, fmt(enamelL), 'L'])

  const useRows: (string | number)[][] = tileUses.map((u) => [u.use, u.t.label, m2(u.net), `${round(u.waste * 100)}%`, m2(u.buy), fmt(u.pcs)])
  const tileBuyRows: (string | number)[][] = sizeRows.map((r) => [r.t.label, m2(r.buy), fmt(r.pcs), r.t.pcsBox ? `${r.t.pcsBox} pieces, ${fmt(r.t.m2Box ?? 0, 2)} m²` : 'Not in the data read', r.boxes === null ? '—' : fmt(r.boxes)])

  const fixRows: (string | number)[][] = []
  if (inp.tileFix === 'mortar') {
    fixRows.push(['Cement for the bed and the slurry', fmt(bedCementKg), 'kg', `${fmt(bedCementBags)} bags of ${CEMENT_BAG_KG} kg`])
    fixRows.push(['Sand for the bed', fmt(bedSandM3, 2), 'm³', 'Coarse sand'])
  } else {
    fixRows.push(['Tile adhesive', fmt(adhesiveKg), 'kg', `${fmt(adhesiveBags)} bags of ${ADHESIVE_BAG_KG} kg`])
  }
  fixRows.push(['Grout', fmt(groutKg), 'kg', 'Net area of every tile, with 10% extra'])
  fixRows.push(['Skirting', fmt(skirtRM, 1), 'm', `${round(SKIRT_H * 1000)} mm high, cut from the floor tile, with ${round((SKIRT_LOSS - 1) * 100)}% for cutting`])
  fixRows.push(['Waterproofing coat in bathrooms', m2(wpArea), 'm²', `Floor and ${fmt(WP_UPSTAND, 2)} m up the walls; at least 2 coats`])
  fixRows.push(['Corner fillet and glass-fibre mesh', fmt(agg.pBath, 1), 'm', '50 × 50 mm fillet; 150 mm mesh over it'])

  const stoneRows: (string | number)[][] = [
    ['Door thresholds', fmt(thresholdN), 'nos', `${fmt(thresholdRM, 1)} m, one at each bathroom, main and balcony door`],
  ]
  if (agg.nKit > 0) {
    stoneRows.push(['Kitchen counter, granite', m2(counterArea * GRANITE_WASTE), 'm²', `${fmt(counterArea, 1)} m² with 10% for cutting and the sink; ${fmt(COUNTER_D, 1)} m deep`])
    stoneRows.push(['Counter edge, moulded', fmt(counterEdge, 1), 'm', 'Front edge of the counter'])
  }

  const doorRowsOut: (string | number)[][] = doorRows.map((r) => [r.op.name, `${fmt(r.op.w, 2)} × ${fmt(r.op.h, 2)}`, r.op.des ?? '', r.n, fmt(r.leaf, 1), fmt(r.frame, 3), r.hinges])
  const doorFoot: (string | number)[] = ['All doors', '', '', nDoors, fmt(leafArea, 1), fmt(frameTotal, 3), doorHinges]
  const glRowsOut: (string | number)[][] = glRows.map((r) => [r.op.name, `${fmt(r.op.w, 2)} × ${fmt(r.op.h, 2)}`, r.n, fmt(r.glass, 1), fmt(r.sections, 1)])
  const glFoot: (string | number)[] = ['All windows and glazed doors', '', nGlazed, fmt(glassTotal, 1), fmt(sectionTotal, 1)]
  const hwRows: (string | number)[][] = [
    ['Door hinges', doorHinges, '3 for a shutter up to 0.9 m wide, 4 above (IS 1003 cl 8.2)'],
    ['Lock sets', locks, 'One for the main door and for every bedroom'],
    ['Tower bolts', bolts, 'Two on the main door, one on each bathroom door'],
    ['Handle pairs', nDoors, 'One for every door'],
    ['Door stoppers', nDoors, 'One for every door'],
  ]

  const cabRows: (string | number)[][] = cabs.map((c) => [c.item, c.n, fmt(c.w, 2), fmt(c.n * (c.cab.carcass + c.cab.shutters), 1), fmt(c.n * c.cab.back, 1), fmt(c.n * c.cab.edge, 1), c.n * c.cab.hinges])
  const sheetRows: (string | number)[][] = [
    ['Plywood, 19 mm (carcass, shelves and shutters)', m2(ply19), sheetsPly19],
    ['Plywood, 8 mm (backs)', m2(ply8), sheetsPly8],
    ['Laminate, 1 mm and its balancing sheet inside', m2(laminate), sheetsLam],
  ]

  const tables: Table[] = [
    {
      id: 'areas', title: 'Surfaces, measured', sub: 'Every area comes from the room plan, measured as IS 1200 measures it. Walls are the clear height of the room, floor to the underside of the slab.',
      head: ['Surface', 'Measured (m²)', 'Taken out (m²)', 'Net (m²)', 'Basis'], num: [1, 2, 3], rows: areaRows,
      note: `Clear height is ${fmt(Hc, 2)} m (${fmt(H, 2)} m floor to floor less a ${fmt(SLAB_T, 2)} m slab). Rooms are the same ones MasonryPro uses, so the two reports measure the same walls.`,
    },
    {
      id: 'paint', title: 'Putty, primer and paint', sub: `${sys.label}.${ex ? ` Outside: ${ex.label.toLowerCase()}.` : ''} Quantities include ${round((PAINT_WASTE - 1) * 100)}% for wastage.`,
      head: ['Item', 'Area (m²)', 'Spread, all coats, a m²', 'Quantity', 'Unit'], num: [1, 3], rows: paintRows,
      note: 'Spread is for the coats named, on a plastered surface. Buy paint in the pack sizes you like and round up; keep a litre or two for touching up. ' + (ex ? ex.src + '. ' : '') + `The spread for the inside comes from the makers' data sheets; ${sys.finish.src}.`,
    },
    {
      id: 'tile-use', title: 'Tiles, use by use', sub: 'Pieces are one over the pitch of the tile in both directions, joint included, on the area to buy.',
      head: ['Use', 'Tile', 'Net area (m²)', 'Extra', 'To buy (m²)', 'Pieces'], num: [2, 3, 4, 5], rows: useRows,
      note: `Floor tile is ${mainT.label}, laid ${inp.lay}. Extra is for breakage and cutting: 5% straight, 10% diagonal, and 10% for large tiles or small rooms. No standard fixes these; they are Assumed.`,
    },
    {
      id: 'tile-buy', title: 'Tiles to order', sub: 'The sizes added up, with the boxes where the maker’s box is known.',
      head: ['Tile', 'To buy (m²)', 'Pieces', 'In a box', 'Boxes'], num: [1, 2, 4], rows: tileBuyRows,
      note: 'Box sizes are from one maker’s data sheet for each size and will differ with the maker. For a tile not in the data read, order by the piece.',
    },
    {
      id: 'fix', title: `Fixing the tiles, grout, skirting and wet areas`, sub: inp.tileFix === 'mortar' ? 'A 20 mm bed of 1:4 mortar on floors and 12 mm of 1:3 on walls, with a cement slurry under each (CPWD item text).' : 'Adhesive in a 6 mm or 12 mm notch, by the size of the tile.',
      head: ['Item', 'Quantity', 'Unit', 'Basis'], num: [1], rows: fixRows,
      note: `Grout is the density of 1.6 kg a litre times the joint length, width and tile thickness (a ${mainT.label} tile gives ${fmt(groutPerM2(mainT), 2)} kg a m²). Skirting runs round the living rooms, bedrooms and passages less the door widths.`,
    },
    {
      id: 'stone', title: 'Stone', sub: 'Thresholds and the kitchen counter.', head: ['Item', 'Quantity', 'Unit', 'Basis'], num: [1], rows: stoneRows,
    },
  ]
  if (fcArea > 0) {
    tables.push({
      id: 'fc', title: 'False ceiling', sub: `${m2(fcArea)} m² of gypsum board on a steel frame, in ${inp.falseCeiling === 'hall' ? 'the living rooms' : 'the living rooms and bedrooms'}.`,
      head: ['Item', 'Quantity', 'Unit', 'Basis'], num: [1],
      rows: [
        ['Gypsum board, 12.5 mm', fmt(fc.boards), 'sheets', `2400 × 1200 mm (${FC.boardM2} m²), with ${round((FC.boardWaste - 1) * 100)}% for cutting`],
        ['Ceiling sections, 0.5 mm', fmt(fc.sectionM), 'm', `${FC.sectionM} m a m², at 450 mm centres`],
        ['Intermediate channel, GI', fmt(fc.channelM), 'm', `${FC.channelM} m a m², at 1200 mm centres`],
        ['Perimeter channel', fmt(fc.perimM), 'm', 'All round each room'],
        ['Cleats', fmt(fc.cleats), 'nos', `${FC.cleats} a m²`],
        ['Dash fasteners and bolts', fmt(fc.fasteners), 'nos', `${FC.fasteners} a m²`],
        ['Hangers', fmt(fc.hangers), 'nos', `${FC.hangers} a m², each ${fmt(FC.hangerM, 2)} m long (${fmt(fc.hangerM)} m in all)`],
        ['Drywall screws, 3.5 × 25 mm', fmt(fc.screws), 'nos', `${FC.screws} a m² plus one every ${round(FC.screwPitch * 1000)} mm round the edge`],
        ['Binding wire, 2.64 mm', fmt(fc.wireM), 'm', `${FC.wireM} m a m², 230 mm at each junction`],
      ],
      note: 'The spacing and counts follow a public CPWD-pattern specification for a gypsum ceiling. Jointing tape and compound, cove lights and any access panels are not counted.',
    })
  }
  tables.push({
    id: 'doors', title: 'Doors', sub: 'Counted from the rooms. Shutters and frames of timber; frames are 100 × 65 mm with a 100 mm horn at each top corner.',
    head: ['Door', 'Size (m)', 'Shutter, IS 1003', 'Number', 'Shutters (m²)', 'Frame timber (m³)', 'Hinges'], num: [3, 4, 5, 6], rows: doorRowsOut, foot: doorFoot,
    note: 'Frame timber is the length of the two sides and the top, with the horns, times the section. The section is Assumed; IS 4021, which fixes frame sections, could not be read.',
  })
  tables.push({
    id: 'glazed', title: 'Windows, ventilators and glazed doors', sub: 'Sizes are the usual ones; no standard fixes them. Sections are the frame and the sashes, in aluminium or uPVC as you choose.',
    head: ['Opening', 'Size (m)', 'Number', 'Glass (m²)', 'Sections (m)'], num: [2, 3, 4], rows: glRowsOut, foot: glFoot,
    note: `Glass is ${round(GLASS_SHARE * 100)}% of the opening, 4 to 5.5 mm, with ${round((GLASS_WASTE - 1) * 100)}% for cutting. Sashes are two to a window wider than 0.9 m; a ventilator is a fixed louvre. Grills, nets and the sill are not counted.`,
  })
  tables.push({
    id: 'hw', title: 'Door hardware', sub: 'Counted on the rule of one set to a door. Hinges follow IS 1003; the rest is Assumed.', head: ['Item', 'Number', 'Basis'], num: [1], rows: hwRows, tight: true,
  })
  if (hasCarpentry) {
    tables.push({
      id: 'carp', title: 'Wardrobes and kitchen units', sub: 'Each unit is described as panels: the sides and shelves, the shutters and the back. Wardrobes are 2.1 m high and 0.6 m deep; units below the counter are 0.72 m high; units on the wall 0.35 m deep.',
      head: ['Item', 'Number', 'Width (m)', '19 mm panels (m²)', '8 mm back (m²)', 'Edge band (m)', 'Hinges'], num: [1, 2, 3, 4, 5, 6], rows: cabRows,
      note: 'Panel areas are worked out from the box geometry (sides, top, bottom, shelves, shutters). No source gives sheets a running metre, so these are Derived, not Code.',
    })
    tables.push({
      id: 'sheets', title: 'Plywood and laminate to order', sub: `Sheets of 2440 × 1220 mm (${fmt(SHEET_M2, 2)} m²), with ${round((CUT_WASTE - 1) * 100)}% for cutting.`,
      head: ['Material', 'Panel area (m²)', 'Sheets'], num: [1, 2], rows: sheetRows,
      note: `Laminate goes on both faces of every 19 mm panel: 1 mm outside and a balancing sheet inside. Edge band is ${fmt(edgeBand, 1)} m, hinges ${fmt(cabHinges)}, handles ${fmt(cabHandles)}. Drawers, channels, baskets and locks are not counted.`,
    })
  }

  // ── lines the Grand Total adds up
  const lines: QtyLine[] = []
  const L = (key: string, item: string, qty: number, unit: string, group: string, basis: string) => {
    if (qty > 0) lines.push({ key, item, qty, unit, group, basis })
  }
  if (sys.putty) L('wall-putty-kg', sys.putty.label, ceilTo(puttyKg, 5), 'kg', 'Paint', 'Inside walls and ceilings')
  L('primer-interior-l', 'Primer, inside', Math.ceil(primerL - 1e-9), 'L', 'Paint', 'Inside walls and ceilings')
  L(inp.paint === 'economy' ? 'distemper-interior-l' : 'emulsion-interior-l', sys.finish.label, Math.ceil(finishL - 1e-9), 'L', 'Paint', 'Inside walls and ceilings')
  if (ex) {
    L('primer-exterior-l', 'Primer, outside', Math.ceil(exPrimerL - 1e-9), 'L', 'Paint', 'Outside walls')
    L(ex.finish.unit === 'kg' ? 'cement-paint-kg' : 'paint-exterior-l', ex.finish.label, Math.ceil(exFinish - 1e-9), ex.finish.unit, 'Paint', 'Outside walls')
  }
  L('primer-wood-l', 'Primer for doors', Math.ceil(woodPrimerL - 1e-9), 'L', 'Paint', 'Doors, both faces')
  L('enamel-wood-l', 'Enamel for doors', Math.ceil(enamelL - 1e-9), 'L', 'Paint', 'Doors, both faces')
  for (const r of sizeRows) L(`tile-${r.t.key}-nos`, `Tile ${r.t.label}`, r.pcs, 'nos', 'Tiles', `${m2(r.buy)} m² with breakage`)
  if (inp.tileFix === 'mortar') {
    L('cement-bag-50kg', 'Cement', bedCementBags, 'bags of 50 kg', 'Cement and sand', 'Tile bed and slurry')
    L('sand-m3', 'Sand', round(bedSandM3, 1), 'm³', 'Cement and sand', 'Tile bed')
  } else {
    L('tile-adhesive-kg', 'Tile adhesive', adhesiveBags * ADHESIVE_BAG_KG, 'kg', 'Tiles', `Bags of ${ADHESIVE_BAG_KG} kg`)
  }
  L('tile-grout-kg', 'Tile grout', Math.ceil(groutKg - 1e-9), 'kg', 'Tiles', 'All tile joints')
  L('waterproofing-sqm', 'Waterproofing coat, bathrooms', round(wpArea, 1), 'm²', 'Waterproofing', 'Floor and 0.30 m up the walls')
  if (agg.nKit > 0) {
    L('granite-slab-sqm', 'Kitchen counter, granite', round(counterArea * GRANITE_WASTE, 1), 'm²', 'Stone', 'With 10% for cutting')
    L('granite-edge-m', 'Counter edge, moulded', round(counterEdge, 1), 'm', 'Stone', 'Front edge')
  }
  L('threshold-m', 'Door thresholds', round(thresholdRM, 1), 'm', 'Stone', `${thresholdN} thresholds`)
  if (fcArea > 0) {
    L('gypsum-board-2400x1200-nos', 'Gypsum board 12.5 mm, 2400 × 1200 mm', fc.boards, 'nos', 'False ceiling', 'With 8% for cutting')
    L('fc-section-m', 'Ceiling sections 0.5 mm', Math.ceil(fc.sectionM - 1e-9), 'm', 'False ceiling', 'At 450 mm centres')
    L('fc-channel-m', 'Intermediate channel, GI', Math.ceil(fc.channelM - 1e-9), 'm', 'False ceiling', 'At 1200 mm centres')
    L('fc-perimeter-m', 'Perimeter channel', Math.ceil(fc.perimM - 1e-9), 'm', 'False ceiling', 'All round each room')
    L('fc-cleat-nos', 'Cleats', fc.cleats, 'nos', 'False ceiling', 'About 0.69 a m²')
    L('fc-fastener-nos', 'Dash fasteners and bolts', fc.fasteners, 'nos', 'False ceiling', 'About 0.69 a m²')
    L('fc-hanger-nos', 'Hangers', fc.hangers, 'nos', 'False ceiling', 'About 0.69 a m²')
    L('fc-screw-nos', 'Drywall screws 3.5 × 25 mm', fc.screws, 'nos', 'False ceiling', 'On sections and edges')
    L('fc-wire-m', 'Binding wire 2.64 mm', Math.ceil(fc.wireM - 1e-9), 'm', 'False ceiling', 'At each junction')
  }
  for (const r of doorRows) L(`door-${r.op === DOOR.main ? 'main' : r.op === DOOR.room ? 'room' : r.op === DOOR.bath ? 'bath' : 'stair'}-nos`, `${r.op.name}, ${r.op.des}`, r.n, 'nos', 'Doors and windows', 'Shutter and frame')
  L('door-frame-timber-m3', 'Door frame timber', round(frameTotal, 2), 'm³', 'Doors and windows', '100 × 65 mm section')
  L('door-hinge-nos', 'Door hinges', doorHinges, 'nos', 'Doors and windows', 'By the width of the shutter')
  L('door-lock-nos', 'Lock sets', locks, 'nos', 'Doors and windows', 'Main door and bedrooms')
  L('door-bolt-nos', 'Tower bolts', bolts, 'nos', 'Doors and windows', 'Main and bathroom doors')
  L('door-handle-nos', 'Handle pairs', nDoors, 'pairs', 'Doors and windows', 'One for every door')
  L('door-stopper-nos', 'Door stoppers', nDoors, 'nos', 'Doors and windows', 'One for every door')
  L('glass-5mm-sqm', 'Window glass, 4 to 5.5 mm', round(glassTotal, 1), 'm²', 'Doors and windows', 'With 5% for cutting')
  L('window-section-m', 'Window and sash sections', Math.ceil(sectionTotal - 1e-9), 'm', 'Doors and windows', 'Aluminium or uPVC')
  if (hasCarpentry) {
    L('ply-19mm-sheet', 'Plywood 19 mm, 2440 × 1220 mm', sheetsPly19, 'sheets', 'Carpentry', 'Carcass, shelves and shutters')
    L('ply-8mm-sheet', 'Plywood 8 mm, 2440 × 1220 mm', sheetsPly8, 'sheets', 'Carpentry', 'Backs')
    L('laminate-sheet', 'Laminate 1 mm, 2440 × 1220 mm', sheetsLam, 'sheets', 'Carpentry', 'Both faces')
    L('edge-band-m', 'Edge band', Math.ceil(edgeBand - 1e-9), 'm', 'Carpentry', 'Exposed edges')
    L('cabinet-hinge-nos', 'Cabinet hinges', cabHinges, 'nos', 'Carpentry', 'By the shutter')
    L('cabinet-handle-nos', 'Cabinet handles', cabHandles, 'nos', 'Carpentry', 'One for every shutter')
  }

  const assumptions = [
    `Code: surfaces are measured to IS 1200 (Part 11) floors, dado and skirting, (Part 12) plaster and (Part 13) paint: openings to 0.5 m² are not taken out, from 0.5 to 3 m² one face is. Door shutters are the standard sizes of IS 1003 (Part 1). Plywood sheets are IS 303.`,
    `Practice: the exterior paint spread is the CPWD Delhi Analysis of Rates 2016 coefficient (cement paint 0.384 kg, smooth acrylic 0.167 L, textured 0.328 L a m²) and the door paint is 0.075 L of primer and 0.090 L of paint a m². The DAR's exterior primer is 0.22 kg a m² in 2016 and 0.09 L in a later schedule; the maker's sheet (0.09 to 0.108 L) agrees with the later figure, so 0.095 L is used.`,
    `Maker: the inside spread (putty, primer, emulsion, distemper) is from the data sheets of Asian Paints, Nerolac and Berger, because the DAR emulsion items could not be read. These vary widely between brands (an emulsion is 0.063 to 0.138 L a m² for two coats), so the range around the paint figure is wide.`,
    `Derived: tiles a m² is one over (length + joint) times (width + joint). Grout is 1.6 kg a litre times the joint length, width and tile thickness. Panel areas for wardrobes and kitchen units are worked out from the box geometry. Board joint and hanger counts for the false ceiling follow the spacing of a public gypsum specification.`,
    `Assumed: the room plan (shared with MasonryPro): a bedroom is one share of the floor, a living room 1.3 shares plus 0.3 for each bedroom, a kitchen 0.75, a bathroom 0.33, and the passages about half a share. Walls are taken as 230 mm outside and 115 mm inside.`,
    `Assumed: clear height ${fmt(Hc, 2)} m. Bathroom wall tiles stop at ${fmt(dado, 1)} m. The wall above the kitchen counter is tiled 0.6 m high. Kitchen runs are ${KITCHEN_RUN.straight} m straight, ${KITCHEN_RUN.l} m in an L and ${KITCHEN_RUN.u} m in a U; wardrobes are 2.4 m (master) and 1.8 m (others).`,
    `Assumed: wastage of 5% on paint, putty and primer; 5% to 15% on tiles by the layout and the size; 10% on grout; 8% on gypsum board; 12% on plywood and laminate; 10% on granite; 5% on glass. No standard or maker gives these.`,
    `Assumed: door and window sizes and counts: a window in every bedroom and kitchen, two in a living room on the ground floor or in a flat, a ventilator in each bathroom, a stair window for each storey in a building of two floors or more, a glazed door to each balcony, and a stair room on the terrace of any building of two floors or more.`,
    `Assumed: the false ceiling hangers are ${fmt(FC.hangerM, 2)} m long, and the cove, if any, is not counted.`,
    `Assumed: the tile bed (mortar or adhesive) covers every tiled area, with the floor bed at 11.0 kg of cement and 0.022 m³ of sand a m² and the wall bed at 9.2 kg and 0.0125 m³ a m². These come from CPWD item text quoted in public tenders; the DAR flooring pages could not be read.`,
    'The plaster underneath, the cement and sand for it, and the walls are in MasonryPro. Putty starts where the plaster ends.',
  ]
  const notIncluded = [
    'Plaster, and the cement and sand for it (these are in MasonryPro).',
    'The flooring screed under tile adhesive, stairs (treads, risers and landings), and the terrace and parapet finish.',
    'Marble, granite, wood and laminate flooring apart from the thresholds and counter. No source read gives their quantities.',
    'Sanitary fittings, taps and bathroom accessories (these are in PlumbingPro) and the lights and fans (in ElectricalPro).',
    'Jointing tape and compound for the false ceiling, cove lighting, access panels, curtain boxes and any bulkhead.',
    'Drawers, channels, baskets, pull-outs, locks, handles on drawers, mirrors and shelf pins; loft cabinets above 2.1 m.',
    'Window grills, mosquito nets, sills, curtains and blinds, and timber windows.',
    'Inside of the terrace stair room, the compound wall and gate, and polishing of timber.',
    'Scaffolding, masking, putty sanding, curing water and the carriage of materials.',
  ]
  const bands = [
    { label: 'Painted area', low: 0.85, high: 1.2 },
    { label: 'Putty, primer and paint', low: 0.7, high: 1.35 },
    { label: 'Tiles', low: 0.9, high: 1.15 },
    { label: 'Mortar, adhesive and grout', low: 0.65, high: 1.3 },
    { label: 'False ceiling', low: 0.85, high: 1.2 },
    { label: 'Doors and windows', low: 0.85, high: 1.25 },
    { label: 'Plywood and laminate', low: 0.7, high: 1.4 },
  ]
  const sources = [
    'IS 1200 (Part 11):1977, (Part 12):1976, (Part 13):1994 Methods of measurement of building and civil engineering works',
    'IS 15622:2006 Pressed ceramic tiles; IS 2395 (Part 1):1994 Painting practice; IS 3067:1988 Damp-proofing and waterproofing',
    'IS 1003 (Part 1):2003 Timber panelled and glazed shutters; IS 2202 (Part 2):1983 Flush door shutters; IS 303:2024 Plywood',
    'CPWD Delhi Analysis of Rates 2016, Volume 2 sub-head 13 (finishing: plaster, paint, primers) and Volume 1 materials list',
    'Data sheets of paint, putty, adhesive, grout and tile makers (Asian Paints, Nerolac, Berger, Sika, Laticrete, Mapei, Kajaria); public CPWD-pattern tender documents for gypsum ceilings and tile beds',
  ]

  return {
    ok: true,
    result: {
      free: {
        engine: 'trade-v1', tool: 'interior',
        chips: [`${N} ${N === 1 ? 'floor' : 'floors'}`, `${tierName} paint`, mainT.label],
        factsTitle: 'Your finishing at a glance',
        facts,
        factsFoot: 'Counted from your answers. How much paint, putty, tile, board, timber and plywood you need is in the full report.',
        checks, warnings,
      },
      paid: { engine: 'trade-v1', tool: 'interior', tiles, tables, lines, bands, assumptions, notIncluded, sources },
    },
  }
}

export const interiorModel: TradeModel<InteriorInput> = {
  key: 'interior',
  appType: 'interiorpro',
  label: 'InteriorPro',
  code: 'IN',
  parse: parseInterior,
  run: runInterior,
}
