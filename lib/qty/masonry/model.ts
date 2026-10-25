/*
  MasonryPro model: bricks or blocks, joint mortar, plaster, lintels, and the cement and sand under all of it.

  It works from a few plain answers (how many floors and homes, how many bedrooms and bathrooms, which wall material,
  how the outside is plastered) and the floor areas of the project. A room plan is worked out from those answers,
  the walls are measured from it the way IS 1200 measures them, and the units, mortar and plaster follow.

  Every figure is one of four kinds, and the report says which:
    Code     read from a standard (IS 1077, 12894, 2185, 6041, 2572 for sizes and joints; IS 1200 for measurement)
    Derived  worked out from a Code figure with arithmetic that is shown (units per m², joint mortar, cement per m³ of mortar)
    Assumed  no standard fixes it (room sizes, opening sizes, breakage, mortar waste); a stated, editable engineering value
    Practice published by the CPWD (Delhi Analysis of Rates 2014) as the yield of a plaster or concrete item
  The research behind each number is in the project file "research-masonry-2026-10-25".

  The site is quantity-only: nothing here knows a price, a labour rate or a dealer.
*/

import type { BaseInput, Check, Fact, Overlap, Parsed, QtyLine, Ran, Table, Tile, TradeModel } from '../types'
import { Reader, SQFT_TO_M2, bump, ceilTo, fmt, rangeText, round } from '../util'
import { planFloors } from '../plan'
import { buildMasonCalc } from './calc'
import {
  ADHESIVE_BAG_KG, ADHESIVE_KG_PER_M3, CEMENT_BAG_KG, CEMENT_KG_PER_M3, DAR_FACTOR,
  J, MORTAR_ALLOW, SAND_M3_PER_M3, SYSTEMS, jointMortarPerM2, unitsPerM2,
  type MasonSystem, type Sys,
} from './units'

// The brick and block tables and the units-per-m² formulas live in ./units, which the free Brick Calculator and the home
// page's brick lab import. They stay out of this file so that no page loads the whole model (and its calculation sheet).
export * from './units'

export interface MasonInput extends BaseInput {
  dwelling: 'house' | 'flats'
  /** flats only: homes on each floor */
  homesPerFloor: number
  /** per home (for a house, the whole house) */
  bedrooms: number
  bathrooms: number
  kitchens: number
  /** balconies per home (for a house, in all) */
  balconies: number
  system: MasonSystem
  /** AAC and concrete block only: 200 mm outer walls (true) or 150 mm (false) */
  thickOuter: boolean
  /** AAC only */
  aacJoint: 'thin' | 'mortar'
  plasterExt: 'twocoat' | 'single' | 'none'
  plasterCeil: boolean
  /** a staircase room on the terrace */
  mumty: boolean
  /** a masonry parapet round the terrace */
  parapet: boolean
  /** balcony edge is a masonry wall rather than a railing */
  balconyWall: boolean
  /** large sliding doors to the balcony */
  bigDoor: boolean
  storeyM: number
}

export function parseMason(raw: unknown): Parsed<MasonInput> {
  const r = new Reader(raw)
  const floorAreasSqft = r.floors()
  const { state, city } = r.place()
  const dwelling = r.pick('dwelling', 'Building type', ['house', 'flats'] as const, 'house')
  const homesPerFloor = dwelling === 'flats' ? r.int('homesPerFloor', 'Homes on each floor', 1, 8, 2) : 1
  const bedrooms = r.int('bedrooms', 'Bedrooms', 1, 8, 3)
  const bathrooms = r.int('bathrooms', 'Bathrooms', 1, 10, Math.min(bedrooms, 4))
  const kitchens = r.int('kitchens', 'Kitchens', 1, 3, 1)
  const balconies = r.int('balconies', 'Balconies', 0, 6, 1)
  const system = r.pick('system', 'Wall material', ['brick', 'modular', 'flyash', 'aac', 'block'] as const, 'brick')
  const thickOuter = r.bool('thickOuter', true)
  const aacJoint = r.pick('aacJoint', 'Block jointing', ['thin', 'mortar'] as const, 'thin')
  const plasterExt = r.pick('plasterExt', 'Outside plaster', ['twocoat', 'single', 'none'] as const, 'twocoat')
  const plasterCeil = r.bool('plasterCeil', true)
  const mumty = r.bool('mumty', true)
  const parapet = r.bool('parapet', true)
  const balconyWall = r.bool('balconyWall', true)
  const bigDoor = r.bool('bigDoor', false)
  const storeyM = r.num('storeyM', 'Floor to floor height', 2.7, 4.0, 3.0)
  if (r.error) return { ok: false, error: r.error }
  return {
    ok: true,
    input: { floorAreasSqft, state, city, dwelling, homesPerFloor, bedrooms, bathrooms, kitchens, balconies, system, thickOuter, aacJoint, plasterExt, plasterCeil, mumty, parapet, balconyWall, bigDoor, storeyM },
  }
}

/* ───────────────────────── tables of figures ───────────────────────── */


/** Concrete M20 nominal mix 1:1.5:3 per m³ (CPWD DAR 2014 Vol 1 item 4.1.2). */
export const M20 = { cementKg: 400, sandM3: 0.425, stoneM3: 0.85 }

/** CPWD DAR 2014 Vol 2, sub-head 13: mortar per m² for each plaster item (the figure printed per 10 m², divided by 10). */
export interface Layer { t: number; mix: number; mortar: number }
export interface Spec { id: string; label: string; layers: Layer[]; ref: string }
export const SPEC: Record<'inside' | 'ceiling' | 'single' | 'twocoat', Spec> = {
  inside: { id: 'inside', label: '12 mm, 1:6', layers: [{ t: 12, mix: 6, mortar: 0.0144 }], ref: 'DAR item 13.4' },
  ceiling: { id: 'ceiling', label: '6 mm, 1:3', layers: [{ t: 6, mix: 3, mortar: 0.0072 }], ref: 'DAR item 13.16' },
  single: { id: 'single', label: '20 mm, 1:4', layers: [{ t: 20, mix: 4, mortar: 0.0224 }], ref: 'DAR item 13.3' },
  twocoat: { id: 'twocoat', label: '18 mm in two coats (12 mm 1:5, then 6 mm 1:6)', layers: [{ t: 12, mix: 5, mortar: 0.0144 }, { t: 6, mix: 6, mortar: 0.0072 }], ref: 'DAR item 13.11' },
}

/* heights and sizes (Assumed unless stated) */
export const BEAM_D = 0.45 // m, the outer beam under each floor
export const SLAB_T = 0.15 // m
export const WALL_UNDER_BEAMS = 0.3 // m: inner walls meet a slab (0.15) or a beam (0.45); the average is taken off the height
export const PLINTH_H = 0.6 // m of masonry between the plinth beam and the floor: 0.15 below ground, 0.45 above
export const PLINTH_ABOVE = 0.45
export const PARAPET_H = 1.0
/** Thickness of a block parapet or balcony edge wall, m (a brick one is the half-brick width). Assumed. */
export const PARAPET_BLOCK_T = 0.15
export const MUMTY = { perimeter: 12, height: 2.4, area: 9 } // a 3 × 3 m staircase room
export const BALCONY = { edge: 6.0, area: 4.5 } // 3.0 m wide and 1.5 m deep: edge walls on three sides

export const WINDOW_SILL = 0.075 // m, a sill under each window is included with the opening (IS 1200 Part 3 cl 4.1.4 note)
export const lintelDepth = (w: number) => (w <= 1.5 ? 0.15 : 0.2)
export const lintelBearing = (w: number) => Math.max(0.15, w / 10) // IS 1905 cl 5.3.3: at least 9 cm or span/10

export type OpenId = 'main' | 'room' | 'bath' | 'balc' | 'balcL' | 'winB' | 'winL' | 'winK' | 'winS' | 'vent' | 'mumty'
export interface OpenDef { name: string; w: number; h: number; win: boolean }
export const OPEN: Record<OpenId, OpenDef> = {
  main: { name: 'Main door', w: 1.0, h: 2.1, win: false },
  room: { name: 'Room door', w: 0.9, h: 2.1, win: false },
  bath: { name: 'Bathroom door', w: 0.75, h: 2.1, win: false },
  balc: { name: 'Balcony door', w: 1.2, h: 2.1, win: false },
  balcL: { name: 'Large sliding door to the balcony', w: 1.8, h: 2.1, win: false },
  winB: { name: 'Bedroom window', w: 1.5, h: 1.2, win: true },
  winL: { name: 'Living room window', w: 1.8, h: 1.2, win: true },
  winK: { name: 'Kitchen window', w: 1.2, h: 1.2, win: true },
  winS: { name: 'Stair window', w: 1.2, h: 1.2, win: true },
  vent: { name: 'Bathroom ventilator', w: 0.6, h: 0.45, win: true },
  mumty: { name: 'Door of the terrace stair room', w: 0.9, h: 2.1, win: false },
}
export const oArea = (id: OpenId) => OPEN[id].w * OPEN[id].h

/** Steel in every lintel (Assumed): two 10 mm bars below, two 8 mm above, 6 mm stirrups. Masses per metre are IS 1786:2008 Table 1. */
export const LINTEL_STEEL = {
  bottomBars: 2, bottomKgPerM: 0.617,
  topBars: 2, topKgPerM: 0.395, topShort: 0.05,
  stirrupKgPerM: 0.222, stirrupSpacing: 0.15, stirrupMinWidth: 0.05, stirrupCover: 0.05, stirrupHook: 0.1,
}
/** Lintel bar sizes, mm, for the sheet (the engine holds only the masses per metre). */
export const LINTEL_BAR_MM = { bottom: 10, top: 8, stirrup: 6 }

/** How far off each class of figure is likely to be: multipliers on the figure shown. */
export const BANDS = {
  units: { low: 0.82, high: 1.2 },
  cement: { low: 0.8, high: 1.3 },
  sand: { low: 0.8, high: 1.3 },
  plaster: { low: 0.85, high: 1.18 },
  adhesive: { low: 0.75, high: 1.35 },
  lintel: { low: 0.7, high: 1.4 },
}

/**
 * How openings come out of plaster (IS 1200 Part 12 cl 3.8): none up to 0.5 m², one face from 0.5 to 3 m² (an outer wall: half from each face),
 * both faces above 3 m² with the reveals added. The reveal is the wall thickness less a 100 mm door or window frame (Assumed).
 */
export const PLASTER_RULE = { noDeductM2: 0.5, bothFacesM2: 3, halfFace: 0.5, frameM: 0.1 }

/** Limits used by the code checks on the free page. */
export const CHECK_LIMITS = { panelNominalM: 0.2, panelStoreyM: 3.5, partitionSlenderness: 30, parapetSlenderness: 5 }

/** Order sizes: bricks in hundreds, blocks in tens, lintel steel in 5 kg. */
export const unitPack = (kind: 'brick' | 'block') => (kind === 'brick' ? 100 : 10)
export const STEEL_PACK_KG = 5

export type Where = 'ext' | 'int' | 'mumty'

export function spread(total: number, n: number): number[] {
  const base = Math.floor(total / n)
  const rem = total % n
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0))
}


/* ───────────────────────── the model ───────────────────────── */

/** One kind of wall: where it is, how thick and high, and what comes out of it. */
export interface Cls { id: string; name: string; sys: Sys; t: number; thin: boolean; mix: number; len: number; h: number; gross: number; ded: number; rule: string }
export interface UnitRow { cls: Cls; net: number; upm2: number; units: number; withLoss: number; mortar: number; adhesive: number }
export interface PlRow { surface: string; gross: number; ded: number; net: number; spec: Spec }
export interface LintelRow { id: OpenId; n: number; t: number; d: number; L: number; vol: number; steel: number; sills: number }
export interface MatRow { use: string; mix: string; vol: number; cement: number; sand: number; stone: number }

/**
 * Every intermediate figure of a run, for the calculation sheet (lib/qty/masonry/calc.ts). It is filled only when a caller
 * passes one to runMason; the report never carries it, and a run without it is exactly the same run.
 */
export interface MasonTrace {
  S: Sys
  P_S: Sys
  thin: boolean
  tExt: number
  tInt: number
  tPar: number
  tPlinth: number
  H: number
  He: number
  Hi: number
  Hc: number
  N: number
  h: number
  homes: number
  footM2: number[]
  bed: number[]
  bath: number[]
  kit: number[]
  balc: number[]
  balcTotal: number
  plans: ReturnType<typeof planFloors>
  rooms: { bed: number; living: number; kit: number; bath: number }
  sumP: number
  sumInt: number
  sumParty: number
  sumNet: number
  topP: number
  hasMumty: boolean
  mixInt: number
  open: Map<OpenId, { n: number; where: Where }>
  classes: Cls[]
  unitRows: UnitRow[]
  unitTotals: Map<MasonSystem, number>
  mainUnitRaw: number
  mainUnits: number
  intFaces: number
  inInner: number
  reveals: number
  dedInt: number
  dedInSide: number
  dedOutSide: number
  outFace: number
  parapetFaces: number
  balcFaces: number
  ceilArea: number
  plRows: PlRow[]
  plasterTotal: number
  lintelRows: LintelRow[]
  lintelVol: number
  lintelSteel: number
  lintelN: number
  lintelLen: number
  sillLen: number
  sillN: number
  mat: MatRow[]
  cementKg: number
  sandM3: number
  stoneM3: number
  cementBags: number
  adhesiveKg: number
  adhesiveBags: number
  nDoors: number
  nWindows: number
}

export function runMason(inp: MasonInput, trace?: MasonTrace): Ran {
  const N = inp.floorAreasSqft.length
  const flats = inp.dwelling === 'flats'
  const h = flats ? inp.homesPerFloor : 1
  const S = SYSTEMS[inp.system]
  const thin = inp.system === 'aac' && inp.aacJoint === 'thin'
  const tExt = S.kind === 'brick' ? S.ext : inp.thickOuter ? S.ext : (S.extThin as number)
  const tInt = S.int
  const tPar = S.kind === 'brick' ? S.int : PARAPET_BLOCK_T
  // AAC is not used below the plinth: it takes up water. Concrete blocks are used there.
  const P_S = inp.system === 'aac' ? SYSTEMS.block : S
  const tPlinth = P_S.kind === 'brick' ? P_S.ext : inp.thickOuter ? P_S.ext : (P_S.extThin as number)

  const H = inp.storeyM
  const He = H - BEAM_D // outer wall, between the plinth or floor and the beam above
  const Hi = H - WALL_UNDER_BEAMS // inner wall
  const Hc = H - SLAB_T // clear height for plaster, floor to the underside of the slab

  const footM2 = inp.floorAreasSqft.map((a) => a * SQFT_TO_M2)

  // what each floor holds
  const bed = flats ? Array(N).fill(inp.bedrooms) : spread(inp.bedrooms, N)
  const bath = flats ? Array(N).fill(inp.bathrooms) : spread(inp.bathrooms, N)
  const kit = flats ? Array(N).fill(inp.kitchens) : spread(inp.kitchens, N)
  const balc: number[] = flats ? Array(N).fill(h * inp.balconies) : N === 1 ? [inp.balconies] : [0, ...spread(inp.balconies, N - 1)]

  // ── the room plan and the walls, floor by floor (the plan is shared with InteriorPro: lib/qty/plan.ts)
  const plans = planFloors({ footM2, flats, h, bed, bath, kit, tExt, tInt })
  const rooms = { bed: 0, living: 0, kit: 0, bath: 0 }
  for (let i = 0; i < N; i++) {
    const nHome = flats ? h : 1
    rooms.bed += nHome * bed[i]
    rooms.living += nHome
    rooms.kit += nHome * kit[i]
    rooms.bath += nHome * bath[i]
  }
  const sumP = plans.reduce((s, p) => s + p.P, 0)
  const sumInt = plans.reduce((s, p) => s + p.Lint, 0)
  const sumParty = plans.reduce((s, p) => s + p.Lparty, 0)
  const sumNet = plans.reduce((s, p) => s + p.net, 0)

  // ── the openings, floor by floor
  const open = new Map<OpenId, { n: number; where: Where }>()
  const addO = (id: OpenId, n: number, where: Where) => {
    if (n <= 0) return
    const cur = open.get(id)
    if (cur) cur.n += n
    else open.set(id, { n, where })
  }
  for (let i = 0; i < N; i++) {
    const nHome = flats ? h : 1
    const bT = nHome * bed[i], baT = nHome * bath[i], kT = nHome * kit[i]
    const livT = nHome
    addO('room', bT + kT, 'int')
    addO('bath', baT, 'int')
    addO('vent', baT, 'ext')
    addO('winB', bT, 'ext')
    addO('winK', kT, 'ext')
    addO('winL', livT * (flats || i === 0 ? 2 : 1), 'ext')
    if (flats) addO('main', h, 'int')
    else if (i === 0) addO('main', 1, 'ext')
    if (N >= 2) addO('winS', 1, 'ext')
    addO(inp.bigDoor ? 'balcL' : 'balc', balc[i], 'ext')
  }
  const hasMumty = inp.mumty && N >= 2
  if (hasMumty) addO('mumty', 1, 'mumty')

  // ── wall classes
  const classes: Cls[] = []
  const wallArea = (len: number, ht: number) => len * ht
  const dedFor = (where: Where) => {
    let d = 0
    for (const [id, o] of open) {
      if (o.where !== where) continue
      const def = OPEN[id]
      d += o.n * def.w * (def.h + lintelDepth(def.w) + (def.win ? WINDOW_SILL : 0))
    }
    return d
  }
  const mixInt = S.kind === 'brick' && tInt <= 0.115 ? 4 : 6
  classes.push({ id: 'ext', name: 'Outer walls', sys: S, t: tExt, thin, mix: 6, len: sumP, h: He, gross: wallArea(sumP, He), ded: dedFor('ext'), rule: 'Plinth beam or floor to the beam above' })
  classes.push({ id: 'int', name: 'Inner walls', sys: S, t: tInt, thin, mix: mixInt, len: sumInt, h: Hi, gross: wallArea(sumInt, Hi), ded: dedFor('int'), rule: 'Floor to the slab or beam above, taken as the average' })
  if (flats && sumParty > 0) classes.push({ id: 'party', name: 'Walls between flats', sys: S, t: tExt, thin, mix: 6, len: sumParty, h: Hi, gross: wallArea(sumParty, Hi), ded: 0, rule: 'As inner walls, at the outer wall thickness' })
  classes.push({ id: 'plinth', name: 'Plinth wall', sys: P_S, t: tPlinth, thin: false, mix: 6, len: plans[0].P, h: PLINTH_H, gross: wallArea(plans[0].P, PLINTH_H), ded: 0, rule: 'Plinth beam to the ground floor level' + (inp.system === 'aac' ? '; concrete block, because AAC must not stand in damp ground' : '') })
  const topP = plans[N - 1].P
  if (inp.parapet) classes.push({ id: 'parapet', name: 'Terrace parapet', sys: S, t: tPar, thin, mix: 4, len: topP, h: PARAPET_H, gross: wallArea(topP, PARAPET_H), ded: 0, rule: 'All round the terrace' })
  const balcTotal = balc.reduce((s, x) => s + x, 0)
  if (inp.balconyWall && balcTotal > 0) classes.push({ id: 'balcwall', name: 'Balcony edge walls', sys: S, t: tPar, thin, mix: 4, len: balcTotal * BALCONY.edge, h: PARAPET_H, gross: wallArea(balcTotal * BALCONY.edge, PARAPET_H), ded: 0, rule: `${BALCONY.edge} m round each balcony (3.0 m wide, 1.5 m deep)` })
  if (hasMumty) classes.push({ id: 'mumty', name: 'Terrace stair room', sys: S, t: tExt, thin, mix: 6, len: MUMTY.perimeter, h: MUMTY.height, gross: wallArea(MUMTY.perimeter, MUMTY.height), ded: dedFor('mumty'), rule: 'A 3 × 3 m room, 2.4 m high' })

  // ── units, mortar and adhesive by class
  const unitRows: UnitRow[] = classes.map((c) => {
    const net = Math.max(0, c.gross - c.ded)
    const upm2 = unitsPerM2(c.sys, c.t, c.thin)
    const units = net * upm2
    const loss = c.sys.loss
    const mortar = net * jointMortarPerM2(c.sys, c.t, c.thin) * MORTAR_ALLOW
    const adhesive = c.thin ? net * c.t * ADHESIVE_KG_PER_M3 : 0
    return { cls: c, net, upm2, units, withLoss: units * (1 + loss), mortar, adhesive }
  })
  const unitTotals = new Map<MasonSystem, number>()
  for (const u of unitRows) bump(unitTotals, u.cls.sys.key, u.withLoss)

  // ── plaster, measured as IS 1200 Part 12 measures it
  // Openings up to 0.5 m² are not deducted. From 0.5 to 3 m², one face is deducted (an outer wall: half from each face).
  // Over 3 m², both faces are deducted and the reveals are added.
  let intFaces = 0 // both faces of every inner wall, and the inside of the outer walls
  intFaces += 2 * sumInt * Hc + 2 * sumParty * Hc
  let dedInt = 0
  let dedOutSide = 0
  let dedInSide = 0
  let reveals = 0
  for (const [id, o] of open) {
    const def = OPEN[id]
    const a = oArea(id)
    if (o.where === 'int') {
      if (a > PLASTER_RULE.bothFacesM2) dedInt += 2 * o.n * a
      else if (a > PLASTER_RULE.noDeductM2) dedInt += o.n * a
    } else {
      if (a > PLASTER_RULE.bothFacesM2) { dedInSide += o.n * a; dedOutSide += o.n * a; reveals += o.n * (def.w + 2 * def.h) * Math.max(0, tExt - PLASTER_RULE.frameM) }
      else if (a > PLASTER_RULE.noDeductM2) { dedInSide += o.n * a * PLASTER_RULE.halfFace; dedOutSide += o.n * a * PLASTER_RULE.halfFace }
    }
  }
  const inInner = sumP * Hc + (hasMumty ? MUMTY.perimeter * MUMTY.height : 0)
  const outFace = plans.reduce((s, p) => s + p.P * H, 0) + plans[0].P * PLINTH_ABOVE + (hasMumty ? MUMTY.perimeter * (MUMTY.height + SLAB_T) : 0)
  const parapetFaces = inp.parapet ? topP * (2 * PARAPET_H + tPar) : 0
  const balcFaces = inp.balconyWall && balcTotal > 0 ? balcTotal * BALCONY.edge * (2 * PARAPET_H + tPar) : 0
  const ceilArea = inp.plasterCeil ? sumNet + balcTotal * BALCONY.area + (hasMumty ? MUMTY.area : 0) : 0

  const plRows: PlRow[] = []
  plRows.push({ surface: 'Inner walls, both faces, and the inside of the outer walls', gross: intFaces + inInner + reveals, ded: dedInt + dedInSide, net: Math.max(0, intFaces + inInner + reveals - dedInt - dedInSide), spec: SPEC.inside })
  if (inp.plasterCeil && ceilArea > 0) plRows.push({ surface: 'Ceilings, with the balcony undersides', gross: ceilArea, ded: 0, net: ceilArea, spec: SPEC.ceiling })
  if (inp.plasterExt !== 'none') {
    const extSpec = inp.plasterExt === 'single' ? SPEC.single : SPEC.twocoat
    plRows.push({ surface: 'Outside of the building, from ground to terrace', gross: outFace, ded: dedOutSide, net: Math.max(0, outFace - dedOutSide), spec: extSpec })
    if (parapetFaces > 0) plRows.push({ surface: 'Terrace parapet, both faces and the top', gross: parapetFaces, ded: 0, net: parapetFaces, spec: extSpec })
    if (balcFaces > 0) plRows.push({ surface: 'Balcony edge walls, both faces and the top', gross: balcFaces, ded: 0, net: balcFaces, spec: extSpec })
  }
  const plasterTotal = plRows.reduce((s, r) => s + r.net, 0)

  // ── lintels and sills
  const lintelRows: LintelRow[] = []
  for (const [id, o] of open) {
    const def = OPEN[id]
    const t = o.where === 'int' ? tInt : tExt
    const d = lintelDepth(def.w)
    const L = def.w + 2 * lintelBearing(def.w)
    const vol = L * t * d
    // two bars of 10 mm at the bottom, two of 8 mm at the top, 6 mm stirrups at 150 mm (Assumed)
    const LS = LINTEL_STEEL
    const nStir = Math.ceil(L / LS.stirrupSpacing) + 1
    const stirLen = 2 * (Math.max(LS.stirrupMinWidth, t - LS.stirrupCover) + (d - LS.stirrupCover)) + LS.stirrupHook
    const steel = LS.bottomBars * L * LS.bottomKgPerM + LS.topBars * (L - LS.topShort) * LS.topKgPerM + nStir * stirLen * LS.stirrupKgPerM
    lintelRows.push({ id, n: o.n, t, d, L, vol, steel, sills: def.win ? o.n : 0 })
  }
  const lintelVol = lintelRows.reduce((s, r) => s + r.n * r.vol, 0)
  const lintelSteel = lintelRows.reduce((s, r) => s + r.n * r.steel, 0)
  const lintelN = lintelRows.reduce((s, r) => s + r.n, 0)
  const lintelLen = lintelRows.reduce((s, r) => s + r.n * r.L, 0)
  const sillLen = lintelRows.reduce((s, r) => s + r.sills * (OPEN[r.id].w + 0.15), 0)
  const sillN = lintelRows.reduce((s, r) => s + r.sills, 0)

  // ── cement and sand, by use
  const mat: MatRow[] = []
  const addMat = (use: string, mixLabel: string, vol: number, cementKg: number, sandM3: number, stoneM3 = 0) => {
    if (vol > 0) mat.push({ use, mix: mixLabel, vol, cement: cementKg, sand: sandM3, stone: stoneM3 })
  }
  for (const u of unitRows) {
    if (u.mortar > 0) addMat(`Joints: ${u.cls.name.toLowerCase()}`, `1:${u.cls.mix}`, u.mortar, u.mortar * CEMENT_KG_PER_M3(u.cls.mix), u.mortar * SAND_M3_PER_M3)
  }
  for (const r of plRows) {
    for (const l of r.spec.layers) {
      const m = r.net * l.mortar
      addMat(`Plaster: ${r.surface.split(',')[0].toLowerCase()}${r.spec.layers.length > 1 ? ` (${l.t} mm coat)` : ''}`, `1:${l.mix}`, m, m * CEMENT_KG_PER_M3(l.mix), m * SAND_M3_PER_M3)
    }
  }
  addMat('Lintels (M20 concrete)', '1:1.5:3', lintelVol, lintelVol * M20.cementKg, lintelVol * M20.sandM3, lintelVol * M20.stoneM3)
  const cementKg = mat.reduce((s, r) => s + r.cement, 0)
  const sandM3 = mat.reduce((s, r) => s + r.sand, 0)
  const stoneM3 = mat.reduce((s, r) => s + r.stone, 0)
  const cementBags = Math.ceil(cementKg / CEMENT_BAG_KG)
  const adhesiveKg = unitRows.reduce((s, u) => s + u.adhesive, 0)
  const adhesiveBags = Math.ceil(adhesiveKg / ADHESIVE_BAG_KG)

  // opening counts for the free part
  const nDoors = [...open.entries()].filter(([id]) => !OPEN[id].win).reduce((s, [, o]) => s + o.n, 0)
  const nWindows = [...open.entries()].filter(([id]) => OPEN[id].win).reduce((s, [, o]) => s + o.n, 0)

  // ───────── free part ─────────
  const homes = flats ? h * N : 1
  const nomExt = S.kind === 'brick' ? tExt + J : tExt
  const checks: Check[] = []
  checks.push({
    id: 'panel', clause: S.kind === 'brick' ? 'IS 4326:1993 cl 8.2.3 (note)' : inp.system === 'aac' ? 'IS 6041:1985 cl 4.2.1' : 'IS 2572:2005 cl 7.2.1.2',
    description: 'Outer wall thickness in a framed building',
    status: nomExt >= CHECK_LIMITS.panelNominalM - 1e-9 && H <= CHECK_LIMITS.panelStoreyM ? 'pass' : 'advisory',
    detail: nomExt >= CHECK_LIMITS.panelNominalM - 1e-9
      ? `Your outer wall is ${round(tExt * 1000)} mm. Infill walls of at least 200 mm in storeys up to 3.5 m high need no separate panel check.${H > CHECK_LIMITS.panelStoreyM ? ` Your storey is ${fmt(H, 2)} m, so ask your engineer to check the panels.` : ''}`
      : `Your outer wall is ${round(tExt * 1000)} mm. Blocks of 150 mm are allowed in a frame only if the wall is braced and reinforced, so ask your engineer to confirm before you choose this.`,
  })
  checks.push({
    id: 'partition', clause: 'IS 1905:1987 Appendix D-3.1(b)', description: 'Inner walls: height against thickness',
    status: Hi <= CHECK_LIMITS.partitionSlenderness * tInt + 1e-9 ? 'pass' : 'advisory',
    detail: `An inner wall held at its ends and at the top may be up to 30 times its thickness high: ${fmt(CHECK_LIMITS.partitionSlenderness * tInt, 2)} m for ${round(tInt * 1000)} mm. Yours is about ${fmt(Hi, 2)} m high.${Hi <= CHECK_LIMITS.partitionSlenderness * tInt + 1e-9 ? '' : ' It needs a stiffening band at mid-height, which is not counted here.'}`,
  })
  const parapetOk = PARAPET_H <= CHECK_LIMITS.parapetSlenderness * tPar + 1e-9
  if (inp.parapet || (inp.balconyWall && balcTotal > 0)) {
    checks.push({
      id: 'parapet', clause: 'IS 6041:1985 cl 4.3; IS 2572:2005 cl 7.2.2', description: 'Parapet height against thickness',
      status: parapetOk ? 'pass' : 'advisory',
      detail: `A parapet unbraced for more than 3 m may be at most 5 times its thickness high: ${fmt(CHECK_LIMITS.parapetSlenderness * tPar, 2)} m for ${round(tPar * 1000)} mm. Your parapet is ${fmt(PARAPET_H, 1)} m, so ${parapetOk ? 'it stands within the limit' : 'it needs stiffening columns at 3 m or less. They are not counted here. The same limit is used for brick as a guide'}.`,
    })
  }
  checks.push({
    id: 'mortar', clause: 'IS 2250:1981 cl 7.1; IS 4326:1993 cl 8.1.2', description: 'Mortar mix',
    status: 'pass',
    detail: thin
      ? 'AAC is laid in thin-bed adhesive; the plinth, which is concrete block, uses 1:6 cement mortar. Parapets use 1:4 where IS 2250 asks for a richer mortar for parapets taller than three times their thickness.'
      : `Outer walls use 1:6 cement mortar and inner walls 1:${mixInt}. Parapets use 1:4, because IS 2250 asks for a richer mortar for parapets taller than three times their thickness. The standard’s own table of mixes could not be read, so the ratios follow IS 4326 and CPWD practice.`,
  })
  if (inp.plasterExt !== 'none') {
    const single = inp.plasterExt === 'single'
    checks.push({
      id: 'plaster', clause: 'IS 2402:1963 cl 6.13', description: 'Outside plaster thickness',
      status: single ? 'advisory' : inp.system === 'aac' ? 'advisory' : 'pass',
      detail: single
        ? 'IS 2402 allows a single outside coat of 6 to 18 mm. A 20 mm single coat is the usual CPWD item, but it is above that limit; the two-coat 18 mm plaster is within it.'
        : inp.system === 'aac'
          ? 'Two coats of 12 mm and 6 mm are within IS 2402 (undercoat up to 12 mm, finish 3 to 8 mm). Where rain is heavy, IS 6041 cl 12.1.3 asks for a 15 mm backing coat on AAC; if that is you, add about a quarter to the plaster mortar.'
          : 'Two coats, 12 mm and then 6 mm, are within IS 2402 (undercoat up to 12 mm, finish 3 to 8 mm).',
    })
  }
  checks.push({
    id: 'inside', clause: 'IS 6041 cl 12.2; IS 2572 cl 12.2', description: 'Inside plaster thickness', status: 'pass',
    detail: 'A single inside coat of 12 mm is within the 6 to 12 mm the block standards allow.',
  })
  checks.push({
    id: 'deduct', clause: 'IS 1200 (Part 3):1976 cl 4.1.4', description: 'Openings in masonry',
    status: 'pass',
    detail: `${nDoors} doors and ${nWindows} windows and ventilators are taken out of the walls, each with its lintel and sill, because every one is over 0.1 m². Plaster is measured to IS 1200 (Part 12): no deduction up to 0.5 m², one face from 0.5 to 3 m², both faces and the reveals added above 3 m².`,
  })
  checks.push({
    id: 'frame', clause: 'IS 4326:1993 cl 8.2.6', description: 'Walls tied to the frame', status: 'advisory',
    detail: 'Infill walls must be bonded to the beams and columns by mortar or by dowels. Dowel bars, ties and any bands in tall walls are your engineer’s call and are not counted here.',
  })

  const warnings: string[] = []
  if (inp.system === 'brick') warnings.push('Red bricks are not made to one size across India. The count here is for 230 × 115 × 75 mm; if your kiln’s brick is larger or smaller, the count changes in the ratio of the volumes. Measure a few bricks before you order.')
  if (inp.system === 'aac') warnings.push('AAC takes up water, so it must not stand in damp ground or in a wet area without a waterproof course. This report builds the plinth in concrete block.')
  if (thin && tInt < 0.1) warnings.push('Thin-bed jointing needs blocks cut to a true size. Your supplier’s product sheet gives the adhesive coverage; this report uses an average.')
  if (S.kind === 'brick' && tInt <= 0.09 + 1e-9) warnings.push('A 90 mm partition is thin. It needs care in laying and a stiffening band if it is long.')
  if (inp.mumty && N < 2) warnings.push('A single-storey building has no stair to the terrace, so no stair room is counted.')
  if (N >= 7) warnings.push('Above six floors, walls on the upper floors may have to be lighter or thinner than on the lower ones. Ask your engineer, then rerun with the lighter material.')

  const facts: Fact[] = [
    { k: 'Walls', v: S.label, note: S.size },
    { k: 'Outer wall', v: `${round(tExt * 1000)} mm`, note: S.kind === 'brick' ? 'One brick' : 'Block, laid flat in a frame' },
    { k: 'Inner walls', v: `${round(tInt * 1000)} mm`, note: S.kind === 'brick' ? 'Half brick' : 'Block partition' },
    { k: 'Floors', v: String(N), note: `${round((H) * 100) / 100} m floor to floor` },
    { k: 'Homes', v: String(homes), note: flats ? `${h} on each floor` : 'One house' },
    { k: 'Rooms counted', v: String(rooms.bed + rooms.living + rooms.kit + rooms.bath), note: `${rooms.bed} ${rooms.bed === 1 ? 'bedroom' : 'bedrooms'}, ${rooms.bath} ${rooms.bath === 1 ? 'bathroom' : 'bathrooms'}, ${rooms.kit} ${rooms.kit === 1 ? 'kitchen' : 'kitchens'}, ${rooms.living} living ${rooms.living === 1 ? 'room' : 'rooms'}` },
    { k: 'Doors', v: String(nDoors), note: 'Counted from the rooms' },
    { k: 'Windows', v: String(nWindows), note: 'With bathroom ventilators' },
    { k: 'Plaster', v: inp.plasterExt === 'none' ? 'Inside only' : 'Inside and outside', note: inp.plasterExt === 'single' ? 'Outside 20 mm, one coat' : inp.plasterExt === 'twocoat' ? 'Outside 18 mm, two coats' : 'Walls left bare outside' },
  ]

  // ───────── paid part ─────────
  const sysUnits = [...unitTotals.entries()]
  const mainUnitRaw = unitTotals.get(S.key) ?? 0
  const unitRoundTo = unitPack(S.kind)
  const mainUnits = ceilTo(mainUnitRaw, unitRoundTo)
  const tiles: Tile[] = [
    { k: S.kind === 'brick' ? 'Bricks' : 'Blocks', v: fmt(mainUnits), unit: S.kind === 'brick' ? 'nos' : 'nos', range: `${rangeText(mainUnits, BANDS.units.low, BANDS.units.high)} nos` },
    { k: 'Cement', v: fmt(cementBags), unit: 'bags of 50 kg', range: `${rangeText(cementBags, BANDS.cement.low, BANDS.cement.high)} bags` },
    { k: 'Sand', v: fmt(sandM3, 1), unit: 'm³', range: `${rangeText(sandM3, BANDS.sand.low, BANDS.sand.high, 1)} m³` },
    thin
      ? { k: 'Block adhesive', v: fmt(adhesiveBags), unit: 'bags of 40 kg', range: `${rangeText(adhesiveBags, BANDS.adhesive.low, BANDS.adhesive.high)} bags` }
      : { k: 'Plaster', v: fmt(plasterTotal), unit: 'm²', range: `${rangeText(plasterTotal, BANDS.plaster.low, BANDS.plaster.high)} m²` },
  ]

  const wallRows: (string | number)[][] = classes.map((c) => [c.name, fmt(c.len, 1), fmt(c.h, 2), round(c.t * 1000), fmt(c.gross, 1), fmt(c.ded, 1), fmt(Math.max(0, c.gross - c.ded), 1)])
  const wallFoot: (string | number)[] = ['All walls', fmt(classes.reduce((s, c) => s + c.len, 0), 1), '', '', fmt(classes.reduce((s, c) => s + c.gross, 0), 1), fmt(classes.reduce((s, c) => s + c.ded, 0), 1), fmt(unitRows.reduce((s, u) => s + u.net, 0), 1)]

  const openRows: (string | number)[][] = [...open.entries()].map(([id, o]) => {
    const def = OPEN[id]
    const a = oArea(id)
    const rule = a <= PLASTER_RULE.noDeductM2 ? 'Not deducted from plaster' : a <= PLASTER_RULE.bothFacesM2 ? 'Deducted once from plaster' : 'Both faces deducted, reveals added'
    return [def.name, `${fmt(def.w, 2)} × ${fmt(def.h, 2)}`, o.n, fmt(a, 2), fmt(o.n * def.w * (def.h + lintelDepth(def.w) + (def.win ? WINDOW_SILL : 0)), 1), rule]
  })

  const unitRowsOut: (string | number)[][] = unitRows.map((u) => {
    const base = [u.cls.name, fmt(u.net, 1), fmt(u.upm2, 1), fmt(u.units), fmt(u.withLoss), u.cls.thin ? '—' : fmt(u.mortar, 2), u.cls.thin ? 'Adhesive' : `1:${u.cls.mix}`]
    return base
  })
  const unitFoot: (string | number)[] = ['All walls', fmt(unitRows.reduce((s, u) => s + u.net, 0), 1), '', fmt(unitRows.reduce((s, u) => s + u.units, 0)), fmt(unitRows.reduce((s, u) => s + u.withLoss, 0)), fmt(unitRows.reduce((s, u) => s + u.mortar, 0), 2), '']

  const plRowsOut: (string | number)[][] = plRows.map((r) => [r.surface, fmt(r.gross, 1), fmt(r.ded, 1), fmt(r.net, 1), r.spec.label, fmt(r.spec.layers.reduce((s, l) => s + l.mortar, 0) * r.net, 2)])
  const plFoot: (string | number)[] = ['All plaster', fmt(plRows.reduce((s, r) => s + r.gross, 0), 1), fmt(plRows.reduce((s, r) => s + r.ded, 0), 1), fmt(plasterTotal, 1), '', fmt(plRows.reduce((s, r) => s + r.net * r.spec.layers.reduce((q, l) => q + l.mortar, 0), 0), 2)]

  const lintelRowsOut: (string | number)[][] = lintelRows.map((r) => [OPEN[r.id].name, r.n, fmt(r.L, 2), `${round(r.t * 1000)} × ${round(r.d * 1000)}`, fmt(r.n * r.vol, 3), fmt(r.n * r.steel, 1)])
  const lintelFoot: (string | number)[] = ['All lintels', lintelN, fmt(lintelLen, 1), '', fmt(lintelVol, 2), fmt(lintelSteel, 1)]

  const matRows: (string | number)[][] = mat.map((m) => [m.use, m.mix, fmt(m.vol, 2), fmt(m.cement), fmt(m.sand, 2), m.stone > 0 ? fmt(m.stone, 2) : '—'])
  const matFoot: (string | number)[] = ['Everything', '', fmt(mat.reduce((s, m) => s + m.vol, 0), 2), fmt(cementKg), fmt(sandM3, 2), fmt(stoneM3, 2)]

  const floorRows: (string | number)[][] = plans.map((p, i) => {
    const nh = flats ? h : 1
    return [p.name, fmt(p.P, 1), fmt(p.Lint, 1), flats ? fmt(p.Lparty, 1) : '—', fmt(p.net, 1), `${bed[i] * nh} bed, ${nh} living, ${kit[i] * nh} kitchen, ${bath[i] * nh} bath`]
  })

  const tables: Table[] = [
    {
      id: 'walls', title: 'Walls, measured', sub: 'Each kind of wall, summed over all floors. Openings come out with their lintels and sills, as IS 1200 (Part 3) measures them.',
      head: ['Wall', 'Length (m)', 'Height (m)', 'Thickness (mm)', 'Gross (m²)', 'Openings out (m²)', 'Net (m²)'], num: [1, 2, 3, 4, 5, 6], rows: wallRows, foot: wallFoot,
      note: `Outer walls stand between the floor and the beam above (${fmt(He, 2)} m). Inner walls are ${fmt(Hi, 2)} m, the average where they meet a slab or a beam.`,
    },
    {
      id: 'floors', title: 'How the walls were measured, floor by floor', sub: 'The room plan is worked out from your answers: room sizes follow the bedrooms, bathrooms and kitchens, and every wall between two rooms is counted once.',
      head: ['Floor', 'Outer wall (m)', 'Inner walls (m)', 'Walls between flats (m)', 'Floor area inside the walls (m²)', 'Rooms counted'], num: [1, 2, 3, 4], rows: floorRows,
      note: 'Outer wall length is 4.08 × the square root of the floor area, which is a plan of 1 to 1.5. If your plot is long and thin, the outer walls will be longer and the report will under-count.',
    },
    {
      id: 'open', title: 'Doors, windows and ventilators', sub: 'Counted from the rooms. Sizes are the usual ones; no standard fixes them.',
      head: ['Opening', 'Size (m)', 'Number', 'Each (m²)', 'Out of masonry (m²)', 'Plaster rule (IS 1200 Part 12)'], num: [2, 3, 4], rows: openRows, tight: true,
    },
    {
      id: 'units', title: `${S.kind === 'brick' ? 'Bricks' : 'Blocks'} and joint mortar`,
      sub: thin ? 'AAC is laid in thin-bed adhesive; the adhesive is counted by weight below.' : `Joint mortar is the exact volume of the joints plus ${round((MORTAR_ALLOW - 1) * 100)}% for uneven units and waste.`,
      head: ['Wall', 'Net area (m²)', `${S.kind === 'brick' ? 'Bricks' : 'Blocks'} per m²`, 'Number', `With ${round(S.loss * 100)}% breakage`, 'Joint mortar (m³)', 'Mix'], num: [1, 2, 3, 4, 5], rows: unitRowsOut, foot: unitFoot,
      note: `${S.label}, ${S.size}, joints of ${thin ? '3 mm' : '10 mm'}. ${S.source}.${inp.system === 'aac' ? ' The plinth is concrete block, 400 × 200 mm.' : ''}`,
    },
  ]
  if (thin) {
    tables.push({
      id: 'adh', title: 'Block adhesive', head: ['Item', 'Weight (kg)', 'Bags of 40 kg'], num: [1, 2],
      rows: [['Thin-bed adhesive for AAC', fmt(adhesiveKg), adhesiveBags]],
      note: `About ${ADHESIVE_KG_PER_M3} kg for every m³ of wall (a 3 mm joint, with some waste). The makers’ own coverage works out between 24 and 40 kg per m³; follow your product’s sheet when you order.`,
    })
  }
  tables.push({
    id: 'plaster', title: 'Plaster', sub: 'Measured to IS 1200 (Part 12). Mortar per m² is the CPWD Delhi Analysis of Rates yield for each item.',
    head: ['Surface', 'Measured (m²)', 'Out (m²)', 'Plaster (m²)', 'Coat and mix', 'Mortar (m³)'], num: [1, 2, 3, 5], rows: plRowsOut, foot: plFoot,
    note: 'Inside and outside plaster of columns and beams is counted in the full wall height. Plaster on the underside of the roof slab is not counted if you chose to leave ceilings out.',
  })
  tables.push({
    id: 'lintels', title: 'Lintels and sills', sub: 'One lintel over every opening, resting at least 0.15 m (or a tenth of the span) on each side, in M20 concrete.',
    head: ['Opening', 'Number', 'Length each (m)', 'Section (mm)', 'Concrete (m³)', 'Steel (kg)'], num: [1, 2, 4, 5], rows: lintelRowsOut, foot: lintelFoot,
    note: `Sills: ${sillN} under the windows and ventilators, ${fmt(sillLen, 1)} m in all, 75 mm longer than the opening on each side. The sill material (stone, tile or concrete) is your choice and is not counted. Steel is two 10 mm bars below, two 8 mm above and 6 mm stirrups at 150 mm.`,
  })
  tables.push({
    id: 'mat', title: 'Cement and sand, use by use', sub: 'Every mortar and the lintel concrete, added up.',
    head: ['Use', 'Mix', 'Volume (m³)', 'Cement (kg)', 'Sand (m³)', 'Stone (m³)'], num: [2, 3, 4, 5], rows: matRows, foot: matFoot,
    note: `Cement for each mix is 1,440 kg ÷ the sand part, plus ${round((DAR_FACTOR - 1) * 1000) / 10}% (that is how many bags the CPWD Delhi Analysis of Rates 2014 counts for 1:3 plaster: 513 kg a m³ against 480). Sand is ${DAR_FACTOR} m³ for each m³ of mortar. Stone is 20 mm.`,
  })

  const lines: QtyLine[] = []
  for (const [k, n] of sysUnits) {
    const sd = SYSTEMS[k]
    lines.push({ key: `masonry-unit-${k}`, item: `${sd.label} ${sd.size}`, qty: ceilTo(n, unitPack(sd.kind)), unit: 'nos', group: 'Masonry', basis: `${sd.unitsLabel}, with ${round(sd.loss * 100)}% breakage` })
  }
  if (thin) lines.push({ key: 'aac-adhesive-kg', item: 'AAC thin-bed adhesive', qty: ceilTo(adhesiveKg, ADHESIVE_BAG_KG), unit: 'kg', group: 'Masonry', basis: `Bags of ${ADHESIVE_BAG_KG} kg` })
  lines.push({ key: 'cement-bag-50kg', item: 'Cement', qty: cementBags, unit: 'bags of 50 kg', group: 'Cement and sand', basis: 'Joints, plaster and lintels' })
  lines.push({ key: 'sand-m3', item: 'Sand', qty: round(sandM3, 1), unit: 'm³', group: 'Cement and sand', basis: 'Joints, plaster and lintels' })
  if (stoneM3 > 0) lines.push({ key: 'aggregate-20mm-m3', item: 'Stone aggregate 20 mm', qty: round(stoneM3, 2), unit: 'm³', group: 'Cement and sand', basis: 'Lintel concrete' })
  if (lintelSteel > 0) lines.push({ key: 'steel-lintel-kg', item: 'Steel for lintels (10, 8 and 6 mm)', qty: ceilTo(lintelSteel, STEEL_PACK_KG), unit: 'kg', group: 'Steel', basis: 'Bars and stirrups' })

  const assumptions = [
    `Code: ${S.label} of ${S.size} (${S.source}); joints of ${thin ? '3 mm adhesive (maker’s figure)' : '10 mm (IS 6041 cl 7.1, IS 2572 cl 11.1.4)'}. Walls are measured and openings deducted to IS 1200 (Part 3) and (Part 12).`,
    `Derived: units per m² = the nominal thickness over the pitch of the unit in all three directions, so a one-brick wall of this brick holds ${fmt(unitsPerM2(SYSTEMS[inp.system], SYSTEMS[inp.system].kind === 'brick' ? SYSTEMS[inp.system].ext : tExt, thin), 1)} units a m². Joint mortar is the true volume of the joints, not the nominal one, which would run about a quarter high.`,
    `Practice: plaster mortar per m² is the CPWD Delhi Analysis of Rates 2014 yield for each item (12 mm, 6 mm, 18 mm in two coats, 20 mm). Cement per m³ of mortar is calibrated to the CPWD figure of 513 kg for 1:3 and carried to the other mixes in the same ratio. The CPWD volume 1 yields for brickwork were not available to cross-check, so the masonry figures are the less certain ones.`,
    `Assumed: the room plan. A bedroom is one share of the floor, a living room 1.3 shares plus 0.3 for each bedroom, a kitchen 0.75, a bathroom 0.33 and the passages about half a share; rooms are 1 to 1.3 in plan and passages 1 to 4. Walls between rooms are counted once.`,
    `Assumed: outer wall length 4.08 × √(floor area), a plan of 1 to 1.5. Outer walls ${fmt(He, 2)} m high (floor to beam, ${fmt(BEAM_D, 2)} m deep), inner walls ${fmt(Hi, 2)} m. Floor to floor height ${fmt(H, 2)} m${inp.storeyM === 3.0 ? ', which matches the structure report' : ''}.`,
    `Assumed: door and window sizes in the schedule, one window in each bedroom and kitchen, two in a ground floor living room, a ventilator in each bathroom, a stair window on every floor above one storey.`,
    `Assumed: lintels ${fmt(0.15, 2)} m deep up to a 1.5 m span and 0.20 m above, resting 0.15 m or a tenth of the span on each side; the steel in them is two 10 mm bars, two 8 mm bars and 6 mm stirrups.`,
    `Assumed: ${round(S.loss * 100)}% breakage and cutting waste on ${S.unitsLabel}; ${round((MORTAR_ALLOW - 1) * 100)}% extra joint mortar. No standard gives either figure.`,
    `Assumed: plinth masonry ${fmt(PLINTH_H, 1)} m high; parapet and balcony edge walls ${fmt(PARAPET_H, 1)} m high; a terrace stair room of 3 × 3 m and 2.4 m high; balconies 3.0 × 1.5 m with walls on three sides.`,
    `Assumed: plaster of columns, beams and slab edges is measured with the wall at full height, so no separate plaster for them is counted; the ceiling plaster area is the floor area inside the walls.`,
    'The free Brick Calculator uses the same brick sizes and joints as this report, for the one wall you describe. This report works from your rooms, so it also carries the room plan, the openings and the plaster, and its totals will not match a single wall.',
  ]
  const notIncluded = [
    'Dowel bars, ties, and any horizontal bands in tall walls (IS 4326 cl 8.2.6). Your engineer decides these.',
    'Stiffening columns and copings on parapets, and the stair, balcony and terrace slabs themselves (these are in the structure report).',
    'The compound wall, the steps of the staircase, chajjas, sunshades and the walls of tanks, septic tanks and chambers.',
    'Plinth protection, damp-proof course, waterproofing and terrace screed.',
    'Door and window frames, shutters, glass and grills (in InteriorPro).',
    'Putty, primer and paint, tiles and floors (in InteriorPro).',
    'Neat cement coats, textured finishes, rough cast and pebble dash.',
    'Scaffolding, curing water and the carriage of materials.',
  ]
  // StructurePro also counts the lintels over doors and windows. The Grand Total takes these quantities out once, when both reports are present.
  const overlap: Overlap | undefined = lintelVol > 0
    ? {
        with: 'structure',
        label: 'Lintels over doors and windows',
        lines: [
          { key: 'cement-bag-50kg', unit: 'bags of 50 kg', qty: (lintelVol * M20.cementKg) / CEMENT_BAG_KG },
          { key: 'sand-m3', unit: 'm³', qty: lintelVol * M20.sandM3 },
          ...(stoneM3 > 0 ? [{ key: 'aggregate-20mm-m3', unit: 'm³', qty: lintelVol * M20.stoneM3 }] : []),
          ...(lintelSteel > 0 ? [{ key: 'steel-lintel-kg', unit: 'kg', qty: ceilTo(lintelSteel, STEEL_PACK_KG) }] : []),
        ],
      }
    : undefined

  const bands = [
    { label: S.kind === 'brick' ? 'Bricks' : 'Blocks', low: BANDS.units.low, high: BANDS.units.high },
    { label: 'Cement', low: BANDS.cement.low, high: BANDS.cement.high },
    { label: 'Sand', low: BANDS.sand.low, high: BANDS.sand.high },
    { label: 'Plaster area', low: BANDS.plaster.low, high: BANDS.plaster.high },
    { label: 'Lintel concrete and steel', low: BANDS.lintel.low, high: BANDS.lintel.high },
  ]
  const sources = [
    'IS 1077:1992 Common burnt clay building bricks; IS 12894:2002 Fly ash lime bricks; IS 2212:1991 Brickwork',
    'IS 2185 (Part 1 to 3) Concrete masonry units; IS 6041:1985 AAC masonry; IS 2572:2005 Concrete masonry construction',
    'IS 1200 (Part 3):1976 and (Part 12):1976 Methods of measurement; IS 2250:1981 Masonry mortars; IS 2402:1963 External rendering',
    'IS 4326:1993 Earthquake-resistant construction; IS 1905:1987 Masonry; IS 3362:1977 Natural ventilation',
    'CPWD Delhi Analysis of Rates 2014, Volume 1 (concrete, mortar) and Volume 2 (plaster)',
  ]

  if (trace) {
    Object.assign(trace, {
      S, P_S, thin, tExt, tInt, tPar, tPlinth, H, He, Hi, Hc, N, h, homes, footM2, bed, bath, kit, balc, balcTotal, plans, rooms,
      sumP, sumInt, sumParty, sumNet, topP, hasMumty, mixInt, open, classes, unitRows, unitTotals, mainUnitRaw, mainUnits,
      intFaces, inInner, reveals, dedInt, dedInSide, dedOutSide, outFace, parapetFaces, balcFaces, ceilArea, plRows, plasterTotal,
      lintelRows, lintelVol, lintelSteel, lintelN, lintelLen, sillLen, sillN, mat, cementKg, sandM3, stoneM3, cementBags,
      adhesiveKg, adhesiveBags, nDoors, nWindows,
    })
  }

  return {
    ok: true,
    result: {
      free: {
        engine: 'trade-v1', tool: 'masonry',
        chips: [`${N} ${N === 1 ? 'floor' : 'floors'}`, S.label, `${nDoors + nWindows} openings`],
        factsTitle: 'Your walls at a glance',
        facts,
        factsFoot: 'Counted from your answers. How many bricks or blocks, how much mortar, cement, sand and plaster, and every lintel, are in the full report.',
        checks, warnings,
      },
      paid: { engine: 'trade-v1', tool: 'masonry', tiles, tables, lines, bands, assumptions, notIncluded, sources, overlap },
    },
  }
}

export const masonryModel: TradeModel<MasonInput> = {
  key: 'masonry',
  appType: 'masonpro',
  label: 'MasonryPro',
  code: 'MA',
  parse: parseMason,
  run: (input) => runMason(input),
  calc: buildMasonCalc,
}
