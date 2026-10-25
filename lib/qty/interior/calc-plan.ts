/*
  InteriorPro calculation sheet, part 1: the answers, the room plan and the openings that are counted from it.
*/

import type { CalcBlock, CalcSection, CalcTable } from '@/lib/calcsheet'
import { M2_TO_SQFT, SQFT_TO_M2, fmt } from '../util'
import { CORE_M2, floorName, perim, planFloors } from '../plan'
import { TILES } from './finish'
import { ASPECT, DOOR, EXT_SYS, GLAZED, SLAB_T, T_EXT, T_INT, spread, type InteriorInput } from './model'
import { IN_SYS } from './finish'
import { REF, X, same, sameArr, type Ctx } from './calc-kit'

/*
  The room plan lives in lib/qty/plan.ts and is shared with MasonryPro. Its weights are written inline there, not exported,
  so they are written again here. Every figure they give is checked against planFloors() to a part in a billion, so if
  plan.ts changes and this list does not, the sheet is left out of the report instead of printing a wrong working.
*/
const PLAN = {
  perimFactor: 4.082,
  bed: 1.0, kit: 0.75, bath: 0.33,
  livGround: { base: 1.3, perBed: 0.3 },
  pass: { base: 0.45, perRoom: 0.08 },
  minNetShare: 0.6,
  coreShare: 0.1,
  aspectOfFloor: 1.5,
}

export interface Agg {
  nBed: number; aBed: number; pBed: number; nLiv: number; aLiv: number; pLiv: number
  nKit: number; aKit: number; pKit: number; nBath: number; aBath: number; pBath: number
  aPass: number; pPass: number; aCore: number; pCore: number
}
export interface Open { main: number; room: number; bath: number; mumty: number; balc: number; winB: number; winL: number; winK: number; winS: number; vent: number }

export function answersAndPlan(c: Ctx) {
  const { inp, w, L } = c
  const N = inp.floorAreasSqft.length
  const flats = inp.dwelling === 'flats'
  const h = flats ? inp.homesPerFloor : 1
  const H = inp.storeyM

  /* ── 1. the answers ── */
  const exLabel = inp.exterior === 'none' ? 'Not painted' : EXT_SYS[inp.exterior].label
  const answers: CalcTable = {
    head: ['Question', 'Your answer'],
    rows: [
      ['Building', flats ? `Flats, ${h} on each floor` : 'A house'],
      ['Floors', N === 1 ? 'Ground floor only' : `Ground floor and ${N - 1} above`],
      ['Built-up area of each floor', inp.floorAreasSqft.map((a) => fmt(a)).join(', ') + ' sq ft'],
      [flats ? 'Bedrooms in each flat' : 'Bedrooms in the house', String(inp.bedrooms)],
      [flats ? 'Bathrooms in each flat' : 'Bathrooms in the house', String(inp.bathrooms)],
      [flats ? 'Kitchens in each flat' : 'Kitchens in the house', String(inp.kitchens)],
      [flats ? 'Balconies in each flat' : 'Balconies in the house', String(inp.balconies)],
      ['Floor to floor height', `${fmt(H, 2)} m`],
      ['Paint inside', IN_SYS[inp.paint].label],
      ['Paint outside', exLabel],
      ['False ceiling', { none: 'None', hall: 'Living rooms', rooms: 'Living rooms and bedrooms' }[inp.falseCeiling]],
      ['Floor tile', `${TILES[inp.tileSize].label}, laid ${inp.lay}, fixed with ${inp.tileFix === 'mortar' ? 'a mortar bed' : 'adhesive'}`],
      ['Bathroom wall tiles', inp.bathTile === 'full' ? 'To the door height' : 'Half way up'],
      ['Kitchen', `${{ straight: 'Straight run', l: 'L shape', u: 'U shape' }[inp.kitchenShape]}, ${inp.kitchenCabinets ? 'with cabinets' : 'counter only'}`],
      ['Built-in wardrobes', { none: 'None', master: 'Master bedroom', all: 'Every bedroom' }[inp.wardrobes]],
      ['State and city', [inp.city, inp.state].filter(Boolean).join(', ')],
    ],
    note: 'The state and the city are printed on the report. No quantity in this tool depends on them.',
  }
  const b1: CalcBlock = { id: 'answers', title: 'Your answers', table: answers }

  /* heights and units */
  L.value('Floor to floor height', H, 'm', 2, 'Your answer')
  L.value('Thickness of a floor slab', SLAB_T, 'm', 2, REF.assume, 'Taken for every floor and for the terrace slab')
  const Hc = L.calc('Clear height of a room', 'Hc = H − slab', '{H:2} − {t:2}', { H, t: SLAB_T }, (v) => v.H - v.t,
    { unit: 'm', dp: 2, ref: REF.rule, note: 'Floor to the underside of the slab above. Wall paint and plaster use this height.', ...X(w.Hc) })
  L.value('Square feet to square metres', SQFT_TO_M2, 'm² per sq ft', 8, 'Definition: 1 ft = 0.3048 m, so 1 sq ft = 0.3048 × 0.3048 m²')
  const b2: CalcBlock = { id: 'heights', title: 'Heights and units', lines: L.take() }

  /* how the rooms are spread over the floors */
  const footM2 = inp.floorAreasSqft.map((a) => a * SQFT_TO_M2)
  const bed: number[] = flats ? Array(N).fill(inp.bedrooms) : spread(inp.bedrooms, N)
  const bath: number[] = flats ? Array(N).fill(inp.bathrooms) : spread(inp.bathrooms, N)
  const kit: number[] = flats ? Array(N).fill(inp.kitchens) : spread(inp.kitchens, N)
  const balc: number[] = flats ? Array(N).fill(h * inp.balconies) : N === 1 ? [inp.balconies] : [0, ...spread(inp.balconies, N - 1)]
  sameArr(c, 'floor area m²', footM2, w.footM2)
  sameArr(c, 'bedrooms by floor', bed, w.bed)
  sameArr(c, 'bathrooms by floor', bath, w.bath)
  sameArr(c, 'kitchens by floor', kit, w.kit)
  sameArr(c, 'balconies by floor', balc, w.balc)
  const floors: CalcTable = {
    head: ['Floor', 'Built-up (sq ft)', 'Built-up (m²)', 'Homes', flats ? 'Bedrooms in each flat' : 'Bedrooms', flats ? 'Bathrooms in each flat' : 'Bathrooms', flats ? 'Kitchens in each flat' : 'Kitchens', 'Balconies on the floor'],
    num: [1, 2, 3, 4, 5, 6, 7],
    rows: inp.floorAreasSqft.map((a, i) => [floorName(i), fmt(a), fmt(footM2[i], 2), String(flats ? h : 1), String(bed[i]), String(bath[i]), String(kit[i]), String(balc[i])]),
    note: flats
      ? 'In flats, every floor has the same homes and each home has the rooms you gave.'
      : 'In a house the bedrooms, bathrooms and kitchens are spread over the floors as evenly as possible, the extra ones going to the lower floors. Balconies go on the floors above the ground floor.',
  }
  const b3: CalcBlock = { id: 'floors', title: 'Floor areas and rooms on each floor', intro: `Area in m² = area in sq ft × ${SQFT_TO_M2}.`, table: floors }

  /* ── 2. the room plan ── */
  const plans = planFloors({ footM2, flats, h, bed, bath, kit, tExt: T_EXT, tInt: T_INT })
  plans.forEach((p, i) => {
    const e = w.plans[i]
    same(c, `plan ${i} outer wall`, p.P, e.P); same(c, `plan ${i} net`, p.net, e.net); same(c, `plan ${i} inner wall`, p.Lint, e.Lint)
    same(c, `plan ${i} bedroom`, p.areas.bed, e.areas.bed); same(c, `plan ${i} living`, p.areas.living, e.areas.living)
    same(c, `plan ${i} kitchen`, p.areas.kit, e.areas.kit); same(c, `plan ${i} bathroom`, p.areas.bath, e.areas.bath)
    same(c, `plan ${i} passages`, p.areas.pass, e.areas.pass); same(c, `plan ${i} lobby`, p.core, e.core)
  })

  // worked example: the ground floor
  const p0 = plans[0]
  const A0 = footM2[0]
  const nh = p0.homes
  const bI = bed[0], baI = bath[0], kI = kit[0]
  const P0 = L.calc('Outer wall, all round the floor', 'P = 4.082 × √A', '{k} × √{A:2}', { k: PLAN.perimFactor, A: A0 }, (v) => v.k * Math.sqrt(v.A),
    { unit: 'm', dp: 2, ref: REF.plan, note: 'The wall round a plan whose sides are in the ratio 1 to 1.5 is 2 × (1 + 1.5) ÷ √1.5 = 4.0825 √A. InteriorPro uses 4.082.', ...X(p0.P) })
  L.input('Rooms in one home on this floor', `${bI} bedrooms, ${baI} bathrooms, ${kI} kitchens, 1 living room`, REF.plan)
  const wLiv = L.calc('Weight of the living room', 'wL = 1.3 + 0.3 × bedrooms', '{a} + {b} × {n}', { a: PLAN.livGround.base, b: PLAN.livGround.perBed, n: bI }, (v) => v.a + v.b * v.n,
    { dp: 2, ref: REF.plan, note: 'Ground floor and flats. On the upper floors of a house the weight is 0.9 + 0.2 × bedrooms.' })
  const wPass = L.calc('Weight of the passages', 'wP = 0.45 + 0.08 × (bedrooms + bathrooms + kitchens)', '{a} + {b} × ({x} + {y} + {z})', { a: PLAN.pass.base, b: PLAN.pass.perRoom, x: bI, y: baI, z: kI }, (v) => v.a + v.b * (v.x + v.y + v.z),
    { dp: 2, ref: REF.plan })
  const wSum = L.calc('Total weight of one home', 'Σw = bedrooms × 1.0 + wL + kitchens × 0.75 + bathrooms × 0.33 + wP',
    '{x} × {wb} + {wl:2} + {z} × {wk} + {y} × {wa} + {wp:2}', { x: bI, wb: PLAN.bed, wl: wLiv, z: kI, wk: PLAN.kit, y: baI, wa: PLAN.bath, wp: wPass },
    (v) => v.x * v.wb + v.wl + v.z * v.wk + v.y * v.wa + v.wp, { dp: 3, ref: REF.plan })
  let core = 0
  let Lparty = 0
  if (flats) {
    core = L.calc('Common stair and lobby', 'lobby = smaller of 15 m² and 0.1 × A', 'smaller of {m} and {s} × {A:2}', { m: CORE_M2, s: PLAN.coreShare, A: A0 }, (v) => Math.min(v.m, v.s * v.A),
      { unit: 'm²', dp: 2, ref: REF.plan, ...X(p0.core) })
    Lparty = L.calc('Walls between flats', 'Lp = (flats − 1) × √(A ÷ 1.5)', '({h} − 1) × √({A:2} ÷ {r})', { h, A: A0, r: PLAN.aspectOfFloor }, (v) => (v.h - 1) * Math.sqrt(v.A / v.r),
      { unit: 'm', dp: 2, ref: REF.plan, ...X(p0.Lparty) })
  }
  L.value('Inner walls, as found by the plan', p0.Lint, 'm', 2, REF.plan,
    'Inner wall = (the wall round all the rooms − the outer wall) ÷ 2, less the walls between flats. Room sizes depend on it and it depends on room sizes, so the plan repeats the working four times, starting from a floor area of 0.88 A.')
  const net = L.calc('Floor area inside the walls', 'net = A − P × 0.23 − Lint × 0.115 − Lp × 0.23 (not less than 0.6 A)', 'A − {P:2} × {te} − {Li:2} × {ti} − {Lp:2} × {te}',
    { A: A0, P: P0, te: T_EXT, ti: T_INT, Li: p0.Lint, Lp: Lparty, m: PLAN.minNetShare }, (v) => Math.max(v.m * v.A, v.A - v.P * v.te - v.Li * v.ti - v.Lp * v.te),
    { unit: 'm²', dp: 2, ref: REF.plan, note: 'Walls are taken as 230 mm outside and 115 mm inside.', ...X(p0.net) })
  const u = L.calc('Floor area for one unit of weight', 'u = (net − lobby) ÷ homes ÷ Σw', '({net:2} − {core:2}) ÷ {nh} ÷ {ws:3}', { net, core, nh, ws: wSum }, (v) => (v.net - v.core) / v.nh / v.ws,
    { unit: 'm²', dp: 3, ref: REF.plan, ...X(p0.areas.bed / PLAN.bed) })
  L.calc('One bedroom', 'a = u × 1.0', '{u:3} × {w}', { u, w: PLAN.bed }, (v) => v.u * v.w, { unit: 'm²', dp: 2, ref: REF.plan, ...X(p0.areas.bed) })
  L.calc('The living room', 'a = u × wL', '{u:3} × {w:2}', { u, w: wLiv }, (v) => v.u * v.w, { unit: 'm²', dp: 2, ref: REF.plan, ...X(p0.areas.living) })
  L.calc('One kitchen', 'a = u × 0.75', '{u:3} × {w}', { u, w: PLAN.kit }, (v) => v.u * v.w, { unit: 'm²', dp: 2, ref: REF.plan, ...X(p0.areas.kit) })
  L.calc('One bathroom', 'a = u × 0.33', '{u:3} × {w}', { u, w: PLAN.bath }, (v) => v.u * v.w, { unit: 'm²', dp: 2, ref: REF.plan, ...X(p0.areas.bath) })
  L.calc('The passages, all together', 'a = u × wP', '{u:3} × {w:2}', { u, w: wPass }, (v) => v.u * v.w, { unit: 'm²', dp: 2, ref: REF.plan, ...X(p0.areas.pass) })
  const b4: CalcBlock = {
    id: 'plan-example', title: `Room plan, worked for the ${floorName(0).toLowerCase()} (${fmt(A0, 1)} m²)`,
    intro: 'No drawing is read. Each floor is shared out among its rooms in proportion to a weight for each kind of room. These weights are the tool\'s own assumption, the same ones MasonryPro uses, so both reports measure the same walls.',
    lines: L.take(),
  }

  const planTable: CalcTable = {
    head: ['Floor', 'Outer wall (m)', 'Inside area (m²)', 'Bedroom (m²)', 'Living room (m²)', 'Kitchen (m²)', 'Bathroom (m²)', 'Passages (m²)', 'Lobby (m²)'],
    num: [1, 2, 3, 4, 5, 6, 7, 8],
    rows: plans.map((p) => [p.name, fmt(p.P, 2), fmt(p.net, 2), fmt(p.areas.bed, 2), fmt(p.areas.living, 2), fmt(p.areas.kit, 2), fmt(p.areas.bath, 2), fmt(p.areas.pass, 2), p.core > 0 ? fmt(p.core, 2) : '–']),
    note: 'Room areas are for one room of each kind; passages are all the passages of one home; the lobby is the common stair and lift lobby of a block of flats.',
  }
  const b5: CalcBlock = { id: 'plan-all', title: 'Room plan, every floor', table: planTable }

  /* rooms, their walls, and the totals */
  const agg: Agg = { nBed: 0, aBed: 0, pBed: 0, nLiv: 0, aLiv: 0, pLiv: 0, nKit: 0, aKit: 0, pKit: 0, nBath: 0, aBath: 0, pBath: 0, aPass: 0, pPass: 0, aCore: 0, pCore: 0 }
  const roomRows: string[][] = []
  const add = (floor: string, kind: string, n: number, a: number, aspect: number) => {
    const per = perim(a, aspect)
    roomRows.push([floor, kind, fmt(n), fmt(a, 2), fmt(per, 2), fmt(n * a, 2), fmt(n * per, 2)])
  }
  for (let i = 0; i < N; i++) {
    const p = plans[i]
    const n = p.homes
    const bn = n * bed[i], ban = n * bath[i], kn = n * kit[i]
    agg.nBed += bn; agg.aBed += bn * p.areas.bed; agg.pBed += bn * perim(p.areas.bed, ASPECT.room)
    agg.nLiv += n; agg.aLiv += n * p.areas.living; agg.pLiv += n * perim(p.areas.living, ASPECT.room)
    agg.nKit += kn; agg.aKit += kn * p.areas.kit; agg.pKit += kn * perim(p.areas.kit, ASPECT.room)
    agg.nBath += ban; agg.aBath += ban * p.areas.bath; agg.pBath += ban * perim(p.areas.bath, ASPECT.room)
    agg.aPass += n * p.areas.pass; agg.pPass += n * perim(p.areas.pass, ASPECT.pass)
    if (p.core > 0) { agg.aCore += p.core; agg.pCore += perim(p.core, ASPECT.core) }
    add(p.name, 'Bedrooms', bn, p.areas.bed, ASPECT.room)
    add(p.name, 'Living rooms', n, p.areas.living, ASPECT.room)
    add(p.name, 'Kitchens', kn, p.areas.kit, ASPECT.room)
    add(p.name, 'Bathrooms', ban, p.areas.bath, ASPECT.room)
    add(p.name, 'Passages', n, p.areas.pass, ASPECT.pass)
    if (p.core > 0) add(p.name, 'Stair lobby', 1, p.core, ASPECT.core)
  }
  ;(Object.keys(agg) as (keyof Agg)[]).forEach((k) => same(c, `rooms total ${k}`, agg[k], w.agg[k]))

  // one bedroom, start to finish
  const a1 = p0.areas.bed
  L.value('Floor area of the bedroom', a1, 'm²', 2, REF.plan, 'From the room plan above')
  const per1 = L.calc('Wall round the bedroom', 'p = 2 (1 + r) ÷ √r × √a', '2 × (1 + {r}) ÷ √{r} × √{a:2}', { r: ASPECT.room, a: a1 }, (v) => (2 * (1 + v.r)) / Math.sqrt(v.r) * Math.sqrt(v.a),
    { unit: 'm', dp: 2, ref: REF.plan, note: `Each room is taken as a rectangle whose long side is ${ASPECT.room} times the short side.`, ...X(perim(a1, ASPECT.room)) })
  const wall1 = L.calc('Wall, floor to slab', 'p × Hc', '{p:2} × {Hc:2}', { p: per1, Hc }, (v) => v.p * v.Hc, { unit: 'm²', dp: 2, ref: REF.p13m })
  const door1 = L.calc('Door taken out (once)', 'width × height', '{w} × {h}', { w: DOOR.room.w, h: DOOR.room.h }, (v) => v.w * v.h, { unit: 'm²', dp: 2, ref: REF.p13, note: 'A door of 0.5 to 3 m² between two painted rooms is taken out once.' })
  const win1 = L.calc('Window taken out (half)', '0.5 × width × height', '0.5 × {w} × {h}', { w: GLAZED.winB.w, h: GLAZED.winB.h }, (v) => 0.5 * v.w * v.h, { unit: 'm²', dp: 2, ref: REF.p13, note: 'Half comes off the inside and half off the outside, because the finish differs.' })
  const paint1 = L.calc('Wall to be painted', 'wall − door − window', '{a:2} − {b:2} − {c:2}', { a: wall1, b: door1, c: win1 }, (v) => v.a - v.b - v.c, { unit: 'm²', dp: 2 })
  L.calc('Ceiling to be painted', 'ceiling = floor area', '{a:2}', { a: a1 }, (v) => v.a, { unit: 'm²', dp: 2, ref: REF.p13m })
  L.calc('Floor to be tiled', 'floor = floor area', '{a:2}', { a: a1 }, (v) => v.a, { unit: 'm²', dp: 2, ref: REF.p11, note: 'Measured before the skirting goes on.' })
  const skirt1 = L.calc('Skirting round the bedroom', 'p − 2 door widths', '{p:2} − 2 × {w}', { p: per1, w: DOOR.room.w }, (v) => v.p - 2 * v.w, { unit: 'm', dp: 2, ref: REF.p11, note: 'Taken out twice because the skirting is broken on both sides of the door (the bedroom and the room it opens into).' })
  L.calc('Tile for the skirting', 'length × height × 1.10', '{l:2} × 0.10 × 1.10', { l: skirt1 }, (v) => v.l * 0.1 * 1.1, { unit: 'm²', dp: 3, ref: REF.rule, note: 'The skirting is cut from the floor tile: 100 mm high, 10% extra for cutting.' })
  void paint1
  const b6: CalcBlock = {
    id: 'bedroom', title: `One bedroom, measured as an example (${floorName(0).toLowerCase()})`,
    intro: 'The report adds up every room in the building the same way, so this one room shows the whole method. The totals below are what the report uses.',
    lines: L.take(),
  }
  const roomTable: CalcTable = {
    head: ['Floor', 'Room', 'Number', 'Area of one (m²)', 'Wall round one (m)', 'Total area (m²)', 'Total wall (m)'],
    num: [2, 3, 4, 5, 6], rows: roomRows,
    note: `Wall round one room = 2 (1 + r) ÷ √r × √area, with r = ${ASPECT.room} for bedrooms, living rooms, kitchens and bathrooms, ${ASPECT.pass} for the passages and ${ASPECT.core} for the lobby.`,
  }
  const b7: CalcBlock = { id: 'rooms', title: 'Rooms and their walls, every floor', table: roomTable }
  const totals: CalcTable = {
    head: ['Room', 'Number', 'Floor area (m²)', 'Wall length (m)'], num: [1, 2, 3],
    rows: [
      ['Bedrooms', fmt(agg.nBed), fmt(agg.aBed, 2), fmt(agg.pBed, 2)],
      ['Living rooms', fmt(agg.nLiv), fmt(agg.aLiv, 2), fmt(agg.pLiv, 2)],
      ['Kitchens', fmt(agg.nKit), fmt(agg.aKit, 2), fmt(agg.pKit, 2)],
      ['Bathrooms', fmt(agg.nBath), fmt(agg.aBath, 2), fmt(agg.pBath, 2)],
      ['Passages', '–', fmt(agg.aPass, 2), fmt(agg.pPass, 2)],
      ['Stair lobbies', '–', fmt(agg.aCore, 2), fmt(agg.pCore, 2)],
    ],
    note: 'Each total is the sum of that room in the table above, over every floor and every home.',
  }
  const b8: CalcBlock = { id: 'room-totals', title: 'Room totals, whole building', table: totals }

  /* ── 3. openings counted from the rooms ── */
  const open: Open = { main: 0, room: 0, bath: 0, mumty: 0, balc: 0, winB: 0, winL: 0, winK: 0, winS: 0, vent: 0 }
  for (let i = 0; i < N; i++) {
    const n = plans[i].homes
    const bn = n * bed[i], ban = n * bath[i], kn = n * kit[i]
    open.room += bn + kn
    open.bath += ban
    open.vent += ban
    open.winB += bn
    open.winK += kn
    open.winL += n * (flats || i === 0 ? 2 : 1)
    open.main += flats ? h : i === 0 ? 1 : 0
    if (N >= 2) open.winS += 1
    open.balc += balc[i]
  }
  const hasMumty = N >= 2
  if (hasMumty) open.mumty = 1
  ;(Object.keys(open) as (keyof Open)[]).forEach((k) => same(c, `openings ${k}`, open[k], w.open[k]))
  const balcTotal = balc.reduce((s, x) => s + x, 0)
  same(c, 'balconies in all', balcTotal, w.balcTotal)
  const sz = (o: { w: number; h: number }) => `${fmt(o.w, 2)} × ${fmt(o.h, 2)}`
  const ar = (o: { w: number; h: number }) => fmt(o.w * o.h, 2)
  const rows3: [string, { w: number; h: number }, string, number][] = [
    ['Main door', DOOR.main, flats ? 'One to each flat' : 'One, on the ground floor', open.main],
    ['Room door', DOOR.room, 'One to each bedroom and each kitchen', open.room],
    ['Bathroom door', DOOR.bath, 'One to each bathroom', open.bath],
    ['Door of the terrace stair room', DOOR.mumty, 'One, if the building has two floors or more', open.mumty],
    ['Balcony door, glazed', GLAZED.balc, 'One to each balcony', open.balc],
    ['Bedroom window', GLAZED.winB, 'One to each bedroom', open.winB],
    ['Living room window', GLAZED.winL, 'Two to a living room on the ground floor or in a flat, one on the upper floors of a house', open.winL],
    ['Kitchen window', GLAZED.winK, 'One to each kitchen', open.winK],
    ['Stair window', GLAZED.winS, 'One on each floor, if the building has two floors or more', open.winS],
    ['Bathroom ventilator', GLAZED.vent, 'One to each bathroom', open.vent],
  ]
  const openTable: CalcTable = {
    head: ['Opening', 'Size (m)', 'Area of one (m²)', 'How many are counted', 'Number'], num: [1, 2, 4],
    rows: rows3.map(([n, o, rule, k]) => [n, sz(o), ar(o), rule, fmt(k)]),
    note: 'Sizes and counts are the tool\'s own assumption (no standard fixes a window), except that the door sizes follow the designations of IS 1003 (Part 1):2003 Table 3. Area of one = width × height.',
  }
  const b9: CalcBlock = { id: 'openings', title: 'Doors and windows counted from the rooms', table: openTable }

  const sections: CalcSection[] = [
    { id: 's1', title: '1. Your answers and the building', blocks: [b1, b2, b3] },
    { id: 's2', title: '2. The room plan', intro: 'Rooms are not measured from a drawing. The plan below is what the tool assumes, and everything after it follows from it.', blocks: [b4, b5, b6, b7, b8] },
    { id: 's3', title: '3. Openings', blocks: [b9] },
  ]
  void M2_TO_SQFT
  return { sections, N, flats, h, H, Hc, footM2, bed, bath, kit, balc, plans, agg, open, balcTotal, hasMumty }
}
export type PlanOut = ReturnType<typeof answersAndPlan>
export type { InteriorInput }
