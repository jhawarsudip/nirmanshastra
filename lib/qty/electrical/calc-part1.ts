/* ElectricalPro calculation sheet, sections 1 to 4: the answers, the boards, the points, the load. */

import { num } from '@/lib/calcsheet'
import type { CalcSection, Vars } from '@/lib/calcsheet'
import { SQFT_TO_M2, round } from '../util'
import { REF, block, d0, d1, d2, pl, table, yn, type Ctx } from './calc-ctx'
import { cellNumber } from './calc-rows'
import { LOAD_CATS, type Board } from './derive'
import {
  A_MAX, A_MIN, AREA_KINDS, BAS, CARPET_SHARE, DESIGN, FIXED_M2, NAME, RULE, STD, W, WATTS,
  dedicatedKw, designKw, floorName, spread,
  type Kind,
} from './rules'

export function section1(c: Ctx): CalcSection {
  const { inp, d, L } = c
  const { flats, std, N } = d

  L.input('Building type', flats ? 'Flats' : 'A house', REF.yours, flats ? 'Several homes, each with its own meter and board.' : 'One home across every floor entered.')
  L.value('Floors above ground', N, '', 0, REF.yours)
  if (flats) L.value('Homes on each floor', inp.homesPerFloor, '', 0, REF.yours)
  L.value(flats ? 'Bedrooms in each home' : 'Bedrooms in the house', inp.bedrooms, '', 0, REF.yours)
  L.value(flats ? 'Bathrooms in each home' : 'Bathrooms in the house', inp.bathrooms, '', 0, REF.yours)
  L.value(flats ? 'Kitchens in each home' : 'Kitchens in the house', inp.kitchens, '', 0, REF.yours)
  L.value(flats ? 'Balconies in each home' : 'Balconies in the house', inp.balconies, '', 0, REF.yours)
  L.input('Dining room apart from the kitchen', yn(inp.dining), REF.yours)
  L.input('Pooja room', yn(inp.pooja), REF.yours)
  L.input('Wash area or dry balcony with a washing machine point', yn(inp.utility), REF.yours)
  L.value(flats ? 'Rooms with an air conditioner, in each home' : 'Rooms with an air conditioner', inp.acRooms, '', 0, REF.yours)
  L.input('Water heater in every bathroom', yn(inp.geyser), REF.yours)
  L.input('Inverter for lights and fans', yn(inp.inverter), REF.yours)
  L.input('Charger for an electric vehicle', yn(inp.ev), REF.yours)
  L.value('Parking spaces (as given, or the default)', inp.parking, '', 0, REF.yours, 'The default is one space for a house and none for flats.')
  L.input('Wiring level', std ? 'Standard' : 'Basic', REF.yours, std ? 'Room-wise points of the BIS draft of IS 4648.' : 'The socket schedule of IS 4648:1968.')
  L.input('Supply', inp.supply === 'auto' ? 'Not sure: chosen from the design load' : inp.supply === 'three' ? 'Three-phase' : 'Single-phase', REF.yours)
  L.value('Floor to floor height', d.H, 'm', 2, inp.storeyM === undefined ? `${REF.rule}: used when none is given` : REF.yours)
  L.input('State and city', `${inp.state}${inp.city ? `, ${inp.city}` : ''}`, REF.yours, 'Not used in the wiring count: the points, wire and fittings do not change with the place.')
  const answers = L.take()

  L.calc(`${floorName(0)} in m²`, `A (m²) = A (sq ft) × ${SQFT_TO_M2}`, '{a:2} × {k:8}', { a: inp.floorAreasSqft[0], k: SQFT_TO_M2 }, (v) => v.a * v.k, {
    unit: 'm²', dp: 2, ref: '1 ft = 0.3048 m exactly, so 1 sq ft = 0.09290304 m²', expect: d.builtM2[0],
  })
  const floorsLine = L.take()
  const floorsTable = table(
    flats ? ['Floor', 'Built-up (sq ft)', 'Built-up (m²)', 'Each home (m²)'] : ['Floor', 'Built-up (sq ft)', 'Built-up (m²)'],
    inp.floorAreasSqft.map((a, i) => (flats ? [floorName(i), d2(a), d2(d.builtM2[i]), d2(d.builtM2[i] / d.homesOnFloor)] : [floorName(i), d2(a), d2(d.builtM2[i])])),
    { num: flats ? [1, 2, 3] : [1, 2], note: flats ? 'Flats: the floor area is shared equally between the homes on the floor.' : undefined },
  )

  if (flats) L.calc('Homes in the building', 'homes = homes on each floor × floors', '{h} × {n}', { h: inp.homesPerFloor, n: N }, (v) => v.h * v.n, { dp: 0, ref: REF.rule, expect: d.homes })
  else L.value('Homes in the building', d.homes, '', 0, REF.rule, 'A house is one home, whatever the floors.')
  L.calc('Parking spaces counted', 'spaces = homes if EV charging is asked for and no spaces are given, else the spaces given',
    `EV charging asked for: ${yn(inp.ev)}; spaces given: {given}; homes: {homes}`, { ev: inp.ev ? 1 : 0, given: inp.parking, homes: d.homes },
    (v) => (v.ev === 1 && v.given === 0 ? v.homes : v.given), { dp: 0, ref: REF.assume, expect: d.parking })
  L.calc('Transfer pumps', `pumps = ${RULE.pumpsTwo} if homes ≥ ${RULE.pumpsTwoFromHomes}, else ${RULE.pumpsOne}`, 'homes = {homes}', { homes: d.homes },
    (v) => (v.homes >= RULE.pumpsTwoFromHomes ? RULE.pumpsTwo : RULE.pumpsOne), { dp: 0, ref: `${REF.assume} (one working pump and one standing by)`, expect: d.pumps })
  if (inp.ev) {
    L.calc('EV charger circuits', `circuits = the larger of 1 and up(spaces × ${RULE.evPerSpace}) (one in five spaces)`, 'max(1, up({sp} × {r}))', { sp: d.parking, r: RULE.evPerSpace },
      (v) => Math.max(1, Math.ceil(v.sp * v.r)), { dp: 0, ref: REF.assume, expect: d.evCircuits })
  } else L.input('EV charger circuits', 'None', REF.yours, 'No charger was asked for.')
  L.calc('Air-conditioned rooms counted for each home', `rooms = the smaller of the rooms asked for and (bedrooms + ${RULE.acBeyondBedrooms})`, 'min({ac}, {bd} + {x})',
    { ac: inp.acRooms, bd: inp.bedrooms, x: RULE.acBeyondBedrooms }, (v) => Math.min(v.ac, v.bd + v.x), { dp: 0, ref: `${REF.assume} (the bedrooms and the hall)`, expect: d.acPerHome })
  const derived = L.take()

  const factHomes = c.fact('Homes')
  c.tieNum('Homes in the building', factHomes ? Number(factHomes.v) : NaN, d.homes, 'homes')
  const factAc = c.fact('Air conditioners')
  c.tieNum('Air conditioners in the building', factAc ? Number(factAc.v) : NaN, d.acPerHome * (flats ? d.homes : 1), 'nos')
  const factRooms = c.fact('Rooms counted')
  c.tieNum('Rooms counted', factRooms ? Number(factRooms.v) : NaN, d.roomCount, 'rooms')

  return {
    id: 's1', title: '1. Your answers and the values worked from them',
    intro: 'The answers you gave, and the few figures the model works out from them before it counts anything: how many homes, how many parking spaces, how many pumps, and how many air conditioners each home gets.',
    blocks: [
      block('answers', '1.1 Your answers', answers),
      block('floors', '1.2 Floor areas', floorsLine, floorsTable),
      block('derived', '1.3 Values worked from the answers', derived),
    ],
  }
}

export function section2(c: Ctx): CalcSection {
  const { inp, d, L, nonCommon } = c
  const { flats, N } = d
  const beds = spread(inp.bedrooms, N)
  const baths = spread(inp.bathrooms, N)
  const kits = spread(inp.kitchens, N)
  const balc = spread(inp.balconies, N)

  if (flats) {
    L.say('Flats', 'One board in each home. The homes on a floor are alike, so each floor has one kind of board, repeated once for each home on that floor. A common board takes the stairs, lift lobby, terrace, gate, parking, transfer pumps and EV chargers.', REF.rule)
  } else {
    L.say('A house', 'One board on each floor that has a bedroom, a bathroom, a kitchen or the hall (the hall is on the ground floor). The ground-floor board takes the supply from the meter; each board above is fed from it by a sub-main.', REF.rule)
    L.say('Rooms shared over the floors', `Floor by floor from the ground floor: bedrooms ${beds.join(', ')}; bathrooms ${baths.join(', ')}; kitchens ${kits.join(', ')}; balconies ${balc.join(', ')}. They are shared as evenly as whole numbers allow, the ground floor first. The dining room, pooja room, wash area and entrance are on the ground floor.`, REF.assume)
    L.say('Air conditioners over the floors', `The ${d.acPerHome} air-conditioned ${pl(d.acPerHome, 'room is', 'rooms are')} placed from the ground floor up, at most one for each bedroom and the hall on a floor.`, REF.assume)
  }
  L.say('Carpet area', `Carpet area is ${round(CARPET_SHARE * 100)}% of the built-up area of the board.`, `${REF.assume} (carpet share of built-up area)`)
  const rules = L.take()

  const roleOf = (b: Board) => (b.spec.common ? 'Common areas' : b.spec.sub ? 'Fed from the main board' : 'Takes the supply')
  const boardsTable = table(
    ['Board', 'Copies', 'Built-up each (m²)', 'Carpet each (m²)', 'Role', 'Air con', 'Heaters', 'Washer', 'Dishwasher', 'Pumps', 'EV circuits'],
    d.boards.map((b) => [b.spec.label, d0(b.spec.mult), d2(b.spec.builtM2), b.spec.common ? 'none' : d2(b.spec.carpetM2), roleOf(b), d0(b.spec.ac), d0(b.spec.geysers), d0(b.spec.washers), d0(b.spec.dish), d0(b.spec.pumps), d0(b.spec.evs)]),
    {
      num: [1, 2, 3, 5, 6, 7, 8, 9, 10],
      foot: ['Boards in the building', d0(d.tot.boards), '', '', '', d0(d.tot.ac), d0(d.tot.geysers), d0(d.tot.washers), d0(d.tot.dish), d0(d.tot.pumps), d0(d.tot.evs)],
      note: 'Each row is one copy of the board; the foot adds up all the copies.',
    },
  )
  const sig = (b: Board) => JSON.stringify(b.spec.rooms)
  const groups: { b: Board; k: number }[] = []
  for (const b of nonCommon) {
    const g = groups.find((x) => sig(x.b) === sig(b))
    if (g) g.k += 1
    else groups.push({ b, k: 1 })
  }
  const roomsTable = table(
    ['Board', 'Hall', 'Dining', 'Kitchens', 'Bedrooms', 'Bathrooms', 'Passage', 'Entrance', 'Balconies', 'Wash area', 'Pooja'],
    groups.map(({ b, k }) => {
      const r = b.spec.rooms
      return [`${b.spec.label}${k > 1 ? ` and ${k - 1} more like it` : ''}`, d0(r.hall ?? 0), d0(r.dining ?? 0), d0(r.kitchen ?? 0), d0(r.bedroom ?? 0), d0(r.bath ?? 0), d0(r.passage ?? 0), d0(r.entrance ?? 0), d0(r.balcony ?? 0), d0(r.utility ?? 0), d0(r.pooja ?? 0)]
    }),
    { num: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], note: 'Rooms on one copy of the board. Common areas (stairs, gate, parking and so on) are counted separately.' },
  )
  const unit = c.report.paid.tiles.find((t) => t.k === 'Circuits')?.unit ?? ''
  c.tieNum('Distribution boards in the building', cellNumber(unit.match(/\d[\d,]*/)?.[0]), d.tot.boards, 'boards')

  return {
    id: 's2', title: '2. The boards: what each one serves',
    intro: 'The model splits the building into distribution boards and counts everything board by board. A board is repeated for every home that has the same one.',
    blocks: [
      block('board-rules', '2.1 How the boards are chosen', rules),
      block('boards', '2.2 The boards', undefined, boardsTable),
      block('board-rooms', '2.3 Rooms on each kind of board', undefined, roomsTable),
    ],
  }
}

export function section3(c: Ctx): CalcSection {
  const { d, L, repB: b0, repName, roomName } = c
  const { flats, std } = d
  const s0 = b0.spec
  const T = std ? STD : BAS
  const kinds0 = AREA_KINDS.filter((k) => (s0.rooms[k] ?? 0) > 0)

  L.input('Board worked here', repName, REF.rule, 'The board with the most points. Every other board is worked the same way; the tables below give them all.')
  if (flats) {
    L.calc('Built-up area of one home', 'A (home) = A (floor) ÷ homes on the floor', '{a:2} ÷ {h}', { a: d.builtM2[s0.floor], h: d.homesOnFloor }, (v) => v.a / v.h, { unit: 'm²', dp: 2, ref: REF.rule, expect: s0.builtM2 })
  } else L.value('Built-up area of this floor', s0.builtM2, 'm²', 2, REF.yours)
  L.calc('Carpet area', `carpet = built-up area × ${CARPET_SHARE}`, '{a:2} × {k}', { a: s0.builtM2, k: CARPET_SHARE }, (v) => v.a * v.k, { unit: 'm²', dp: 2, ref: `${REF.assume} (carpet share of built-up area)`, expect: s0.carpetM2 })
  L.calc('Area of the balconies and the entrance (fixed sizes)', `fixed = balconies × ${FIXED_M2.balcony} + entrance × ${FIXED_M2.entrance}`, '{nb} × {ab} + {ne} × {ae}',
    { nb: s0.rooms.balcony ?? 0, ab: FIXED_M2.balcony, ne: s0.rooms.entrance ?? 0, ae: FIXED_M2.entrance }, (v) => v.nb * v.ab + v.ne * v.ae, { unit: 'm²', dp: 2, ref: REF.assume, expect: b0.fixedM2 })
  const wv: Vars = {}
  const wparts = kinds0.map((k, i) => { wv[`n${i}`] = s0.rooms[k] ?? 0; wv[`w${i}`] = W[k]; return `{n${i}} × {w${i}}` })
  L.calc('Total weight of the rooms to be sized', 'weight = Σ (number of rooms × the weight of that room)', wparts.join(' + '), wv,
    (v) => kinds0.reduce((s, _k, i) => s + v[`n${i}`] * v[`w${i}`], 0), { dp: 2, ref: `${REF.assume} (room weights, table 3.1)`, expect: b0.wsum })
  L.calc('Area for each unit of weight', 'k = (carpet − fixed rooms) ÷ weight, never below 0', 'max(0, {c:2} − {f:2}) ÷ {w:2}', { c: s0.carpetM2, f: b0.fixedM2, w: b0.wsum },
    (v) => (v.w > 0 ? Math.max(0, v.c - v.f) / v.w : 0), { unit: 'm² per unit', dp: 3, ref: REF.assume, expect: b0.k0 })
  const exKind: Kind | undefined = kinds0.includes('bedroom') ? 'bedroom' : kinds0[0]
  if (exKind) {
    const n = s0.rooms[exKind] ?? 0
    const rr = b0.rooms.find((r) => r.kind === exKind)!
    const nm = roomName(exKind).toLowerCase()
    L.calc(`Area of one ${nm}`, 'area = k × weight, held between the smallest and the largest area', 'min({mx}, max({mn}, {k:3} × {w}))', { mx: A_MAX[exKind as keyof typeof A_MAX], mn: A_MIN[exKind as keyof typeof A_MIN], k: b0.k0, w: W[exKind as keyof typeof W] },
      (v) => Math.min(v.mx, Math.max(v.mn, v.k * v.w)), { unit: 'm²', dp: 2, ref: `${REF.assume} (limits, table 3.1)`, expect: rr.area ?? 0 })
    L.calc('Units of floor area in one room', `units = the larger of 1 and area ÷ ${RULE.unitM2} m²`, 'max(1, {a:2} ÷ {u})', { a: rr.area ?? 0, u: RULE.unitM2 }, (v) => Math.max(1, v.a / v.u),
      { dp: 4, ref: `${std ? REF.draftT23 : 'IS 4648:1968 and the NIMI yardstick'}: points rise with each ${RULE.unitM2} m² or part`, expect: rr.units ?? 0 })
    for (const x of ['L', 'F', 'S6', 'S16'] as const) {
      const rate = T[exKind].u[x] ?? 0
      if (rate <= 0) continue
      const lab = { L: 'Lights', F: 'Fans', S6: '6 A sockets', S16: '6/16 A sockets' }[x]
      L.calc(`${lab} in all ${n} ${pl(n, nm, `${nm}s`)}`, 'points = rooms × round(points for each unit × units)', '{n} × round({r} × {u:4})', { n, r: rate, u: rr.units ?? 0 },
        (v) => v.n * Math.round(v.r * v.u), { dp: 0, ref: std ? REF.draftT23 : x === 'S6' || x === 'S16' ? REF.old1968 : 'Model value chosen to match the NIMI yardstick', expect: rr.c[x] })
    }
    for (const x of ['X', 'B', 'TV', 'D'] as const) {
      const rate = T[exKind].f[x] ?? 0
      if (rate <= 0) continue
      const lab = { X: 'Exhaust fans', B: 'Call bells', TV: 'TV points', D: 'Data points' }[x]
      L.calc(`${lab} in all ${n} ${pl(n, nm, `${nm}s`)}`, 'points = rooms × points in one room', '{n} × {r}', { n, r: rate }, (v) => v.n * v.r, { dp: 0, ref: std ? REF.draftT23 : REF.old1968, expect: rr.c[x] })
    }
  }
  const example = L.take()

  const weights = table(
    ['Room', 'Weight', 'Smallest (m²)', 'Largest (m²)'],
    [
      ...AREA_KINDS.map((k) => [NAME[k], num(W[k]), num(A_MIN[k]), num(A_MAX[k])]),
      ['Balcony (fixed size)', '', num(FIXED_M2.balcony), num(FIXED_M2.balcony)],
      ['Entrance (fixed size)', '', num(FIXED_M2.entrance), num(FIXED_M2.entrance)],
    ],
    { num: [1, 2, 3], note: `Room sizes are not asked. They are shared out of the carpet area in proportion to these weights and held between these limits. Floor area beyond the limits is taken to be rooms that were not listed, which are not counted. Source: ${REF.assume}.` },
  )
  const rates = table(
    ['Room', 'Lights', 'Fans', '6 A', '6/16 A', 'Exhaust', 'Bells', 'TV', 'Data'],
    (Object.keys(T) as Kind[]).map((k) => [NAME[k], d0(T[k].u.L ?? 0), d0(T[k].u.F ?? 0), d0(T[k].u.S6 ?? 0), d0(T[k].u.S16 ?? 0), d0(T[k].f.X ?? 0), d0(T[k].f.B ?? 0), d0(T[k].f.TV ?? 0), d0(T[k].f.D ?? 0)]),
    {
      num: [1, 2, 3, 4, 5, 6, 7, 8],
      note: std
        ? `Standard level: ${REF.draftT23}. Lights, fans and the two socket columns are for each ${RULE.unitM2} m² of the room; exhaust fans, bells, TV and data points are for each room. The draft is not yet a published standard and a few columns were read by position, so these rows are a guide.`
        : `Basic level: the socket schedule of IS 4648:1968 (cl 9.8; where it gives two to three, the larger is used), with lights and fans chosen so that an 85 m² home has about 12 lights and 5 fans (the NIMI electrician text, which is a yardstick and not a standard). Lights, fans and the two socket columns are for each ${RULE.unitM2} m² of the room; the rest are for each room.`,
    },
  )
  const fixedArea = (r: { kind: Kind | null; area: number | null }) => (r.kind === 'entrance' || r.kind === 'balcony' ? FIXED_M2[r.kind] : r.area)
  const rooms = table(
    ['Room', 'Number', 'Area of one (m²)', 'Units', 'Lights', 'Fans', 'Exhaust', 'Bells', '6 A', '6/16 A', 'TV', 'Data'],
    b0.rooms.map((r) => {
      const a = fixedArea(r)
      return [r.label, d0(r.n), a === null ? '' : d2(a), r.units === null ? '' : d2(r.units), d0(r.c.L), d0(r.c.F), d0(r.c.X), d0(r.c.B), d0(r.c.S6), d0(r.c.S16), d0(r.c.TV), d0(r.c.D)]
    }),
    {
      num: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      foot: ['One copy of this board', '', '', '', d0(b0.cnt.L), d0(b0.cnt.F), d0(b0.cnt.X), d0(b0.cnt.B), d0(b0.cnt.S6), d0(b0.cnt.S16), d0(b0.cnt.TV), d0(b0.cnt.D)],
      note: 'The figures on the right are all the rooms of that kind on one copy of the board. Common areas have fixed counts set by the model, not by area.',
    },
  )
  const perBoard = table(
    ['Board', 'Copies', 'Lights', 'Fans', 'Exhaust', 'Bells', '6 A', '6/16 A', 'TV', 'Data'],
    d.boards.map((b) => [b.spec.label, d0(b.spec.mult), d0(b.cnt.L), d0(b.cnt.F), d0(b.cnt.X), d0(b.cnt.B), d0(b.cnt.S6), d0(b.cnt.S16), d0(b.cnt.TV), d0(b.cnt.D)]),
    {
      num: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      foot: ['Whole building (× copies)', '', d0(d.total.L), d0(d.total.F), d0(d.total.X), d0(d.total.B), d0(d.total.S6), d0(d.total.S16), d0(d.total.TV), d0(d.total.D)],
      note: 'Each board row is for one copy. The foot multiplies by the copies and adds up; the report gives the same totals room by room.',
    },
  )

  const foot = c.reportTable('points')?.foot ?? []
  const names = ['lights', 'ceiling fans', 'exhaust fans', 'call bells', '6 A sockets', '6/16 A sockets', 'TV and data points']
  const mine = [d.total.L, d.total.F, d.total.X, d.total.B, d.total.S6, d.total.S16, d.total.TV + d.total.D]
  names.forEach((nm, i) => c.tieNum(`Points table, all rooms: ${nm}`, cellNumber(foot[i + 2]), mine[i], 'nos'))
  c.tieNum('Points and sockets (total under "What to order")', cellNumber(c.report.paid.tiles.find((t) => t.k === 'Points and sockets')?.v), d.points + d.sockets, 'counted')

  L.calc('Air conditioner outlets', 'Σ over boards (air conditioners on a board × copies)', '{a}', { a: c.sumM((b) => b.spec.ac) }, (v) => v.a, { dp: 0, ref: REF.rule, expect: d.tot.ac })
  L.calc('Water heater outlets', 'Σ over boards (heaters × copies); one in every bathroom if asked for', '{a}', { a: c.sumM((b) => b.spec.geysers) }, (v) => v.a, { dp: 0, ref: REF.rule, expect: d.tot.geysers })
  L.calc('Washing machine and dishwasher outlets', 'washers + dishwashers (the dishwasher only at the Standard level)', '{w} + {x}', { w: c.sumM((b) => b.spec.washers), x: c.sumM((b) => b.spec.dish) }, (v) => v.w + v.x, { dp: 0, ref: REF.rule, expect: d.tot.washers + d.tot.dish })
  L.calc('Pump outlets', 'pumps worked out in section 1', '{p}', { p: d.pumps }, (v) => (d.tot.pumps > 0 ? v.p : 0), { dp: 0, ref: REF.assume, expect: d.tot.pumps })
  L.calc('EV charger points', 'EV circuits worked out in section 1', '{p}', { p: d.evCircuits }, (v) => v.p, { dp: 0, ref: REF.assume, expect: d.tot.evs })
  L.calc('Inverter connections', 'one for each home whose board takes the supply, if an inverter is asked for', '{p}', { p: d.tot.inverters }, (v) => v.p, { dp: 0, ref: REF.assume, expect: d.tot.inverters })
  const ded = L.take()
  const dedRows: [string, number][] = [['Air conditioner outlets, 20/25 A', d.tot.ac], ['Water heater outlets, 6/16 A', d.tot.geysers], ['Washing machine and dishwasher outlets, 6/16 A', d.tot.washers + d.tot.dish], ['Pump outlets', d.tot.pumps], ['EV charger points, 32 A', d.tot.evs], ['Inverter connections', d.tot.inverters]]
  for (const [label, n] of dedRows) if (n > 0) c.tieNum(`Outlets with a circuit of their own: ${label.toLowerCase()}`, c.rowNum('dedicated', label), n, 'nos')

  return {
    id: 's3', title: '3. Points and sockets, room by room and board by board',
    intro: 'Room sizes are not asked, so the model shares the carpet area of a board among its rooms and gives each room its lights, fans and sockets for its size. One board is worked in full below; the tables give the rest.',
    blocks: [
      block('weights', '3.1 Room weights and size limits', undefined, weights),
      block('rates', `3.2 Points the model gives each room (${std ? 'Standard' : 'Basic'} level)`, undefined, rates),
      block('points-ex', `3.3 Worked example: ${repName}`, example),
      block('points-rooms', '3.4 Every room on that board', undefined, rooms),
      block('points-boards', '3.5 Points on every board', undefined, perBoard),
      block('points-ded', '3.6 Outlets with a circuit of their own', ded),
    ],
  }
}

export function section4(c: Ctx): CalcSection {
  const { d, L, nonCommon } = c
  const { flats } = d
  const catKw = (i: number) => d.connected.get(LOAD_CATS[i]) ?? 0
  const rptKw = (i: number) => c.rowNum('load', LOAD_CATS[i])
  const tolKw = 0.05 + 1e-9
  const kk = { dp: 2, unit: 'kW', result: true, tol: tolKw } as const
  L.calc(LOAD_CATS[0], 'kW = light points × W for each ÷ 1000', '{n} × {w} ÷ 1000', { n: d.total.L, w: WATTS.L }, (v) => (v.n * v.w) / 1000, { ...kk, ref: `${REF.draftT5}: ${WATTS.L} W a light point`, expect: rptKw(0) })
  L.calc(LOAD_CATS[1], 'kW = (fans × W + exhaust fans × W) ÷ 1000', '({f} × {wf} + {x} × {wx}) ÷ 1000', { f: d.total.F, wf: WATTS.F, x: d.total.X, wx: WATTS.X }, (v) => (v.f * v.wf + v.x * v.wx) / 1000, { ...kk, ref: `${REF.draftT5}: ${WATTS.F} W a fan point; the exhaust fan is taken at the same`, expect: rptKw(1) })
  L.calc(LOAD_CATS[2], 'kW = 6 A sockets × W for each ÷ 1000', '{n} × {w} ÷ 1000', { n: d.total.S6, w: WATTS.S6 }, (v) => (v.n * v.w) / 1000, { ...kk, ref: `${REF.draftT5}: ${WATTS.S6} W a 6 A outlet`, expect: rptKw(2) })
  L.calc(LOAD_CATS[3], 'kW = 6/16 A sockets × W for each ÷ 1000', '{n} × {w} ÷ 1000', { n: d.total.S16, w: WATTS.S16 }, (v) => (v.n * v.w) / 1000, { ...kk, ref: `${REF.gs39}: ${WATTS.S16} W`, expect: rptKw(3) })
  L.calc(LOAD_CATS[4], 'kW = air conditioners × W each ÷ 1000', '{n} × {w} ÷ 1000', { n: d.tot.ac, w: WATTS.ac }, (v) => (v.n * v.w) / 1000, { ...kk, ref: REF.draftT6, expect: rptKw(4) })
  L.calc(LOAD_CATS[5], 'kW = water heaters × W each ÷ 1000', '{n} × {w} ÷ 1000', { n: d.tot.geysers, w: WATTS.geyser }, (v) => (v.n * v.w) / 1000, { ...kk, ref: REF.draftT6, expect: rptKw(5) })
  L.calc(LOAD_CATS[6], 'kW = (washing machines × W + dishwashers × W) ÷ 1000', '({a} × {wa} + {b} × {wb}) ÷ 1000', { a: d.tot.washers, wa: WATTS.washer, b: d.tot.dish, wb: WATTS.dish }, (v) => (v.a * v.wa + v.b * v.wb) / 1000, { ...kk, ref: REF.draftT6, expect: rptKw(6) })
  L.calc(LOAD_CATS[7], 'kW = (pumps × W + EV chargers × W) ÷ 1000', '({a} × {wa} + {b} × {wb}) ÷ 1000', { a: d.tot.pumps, wa: WATTS.pump, b: d.tot.evs, wb: WATTS.ev }, (v) => (v.a * v.wa + v.b * v.wb) / 1000, { ...kk, ref: `${REF.assume}: the pump and the 7.4 kW charger are the model's own values`, expect: rptKw(7) })
  const cv: Vars = {}
  LOAD_CATS.forEach((_c, i) => { cv[`c${i}`] = catKw(i) })
  const reportTotal = cellNumber(c.reportTable('load')?.foot?.[1])
  const connTotal = L.calc('Total connected load', 'connected load = the sum of the eight lines above', LOAD_CATS.map((_c, i) => `{c${i}:2}`).join(' + '), cv, (v) => LOAD_CATS.reduce((s, _c, i) => s + v[`c${i}`], 0),
    { unit: 'kW', dp: 2, ref: 'What the points could draw if everything ran at once', result: true, tol: tolKw, expect: reportTotal })
  const conn = L.take()
  c.tieNum('Connected load, total', reportTotal, connTotal, 'kW', 1)

  const loadByBoard = table(
    ['Board', 'Copies', 'Lights', 'Fans', '6 A', '6/16 A', 'Air con', 'Heaters', 'Washer, dishwasher', 'Pumps, EV', 'One copy'],
    d.boards.map((b) => [b.spec.label, d0(b.spec.mult), ...LOAD_CATS.map((x) => d2(b.loadKw[x])), d2(LOAD_CATS.reduce((s, x) => s + b.loadKw[x], 0))]),
    { num: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], foot: ['Whole building (× copies)', '', ...LOAD_CATS.map((_x, i) => d2(catKw(i))), d2(d.connectedKw)], note: 'kW. Each row is for one copy of the board; the foot multiplies by the copies and adds up.' },
  )

  /* design load */
  const gov = flats ? nonCommon.reduce((a, b) => (b.pd > a.pd ? b : a), nonCommon[0]) : nonCommon[0]
  const sp = gov.spec
  const carpet = flats ? sp.carpetM2 : d.houseCarpet
  L.input('Consumer worked here', flats ? `${sp.label} (the home with the largest design load)` : 'The whole house', REF.rule)
  if (flats) L.value('Carpet area of the home', carpet, 'm²', 2, REF.rule)
  else {
    const cs = d.specs.map((s) => s.carpetM2)
    L.calc('Carpet area of the house', 'carpet area = the sum of the carpet areas of the floors', cs.map((_x, i) => `{c${i}:2}`).join(' + '), Object.fromEntries(cs.map((x, i) => [`c${i}`, x])),
      (v) => Object.values(v).reduce((s, x) => s + x, 0), { unit: 'm²', dp: 2, ref: REF.rule, expect: d.houseCarpet })
  }
  const dv: Vars = flats
    ? { ac: sp.ac, wac: WATTS.ac, g: sp.geysers, wg: WATTS.geyser, w: sp.washers, ww: WATTS.washer, di: sp.dish, wd: WATTS.dish, p: sp.pumps, wp: WATTS.pump, e: sp.evs, we: WATTS.ev }
    : { ac: d.tot.ac, wac: WATTS.ac, g: d.tot.geysers, wg: WATTS.geyser, w: d.tot.washers, ww: WATTS.washer, di: d.tot.dish, wd: WATTS.dish, p: d.tot.pumps, wp: WATTS.pump, e: d.tot.evs, we: WATTS.ev }
  const ded = L.calc('Large appliances with a circuit of their own', 'kW = (A/C × W + heaters × W + washer × W + dishwasher × W + pumps × W + EV × W) ÷ 1000',
    '({ac} × {wac} + {g} × {wg} + {w} × {ww} + {di} × {wd} + {p} × {wp} + {e} × {we}) ÷ 1000', dv,
    (v) => (v.ac * v.wac + v.g * v.wg + v.w * v.ww + v.di * v.wd + v.p * v.wp + v.e * v.we) / 1000, { unit: 'kW', dp: 2, ref: REF.draftT6, expect: flats ? dedicatedKw(sp) : d.houseDed })
  const byArea = L.calc('Least design load, by floor area', 'kW = W for each m² of carpet area × carpet area ÷ 1', '{w:3} × {c:2}', { w: DESIGN.wPerM2Carpet, c: carpet }, (v) => v.w * v.c,
    { unit: 'kW', dp: 2, ref: `${REF.draftC7}: not less than ${DESIGN.wPerM2Carpet * 1000} W for each m² of carpet area`, expect: DESIGN.wPerM2Carpet * carpet })
  const byDed = L.calc('Design load from the large appliances', 'kW = share of the large appliances × their kW + base load', '{s} × {a:2} + {b}', { s: DESIGN.applianceShare, a: ded, b: DESIGN.baseKw }, (v) => v.s * v.a + v.b,
    { unit: 'kW', dp: 2, ref: `${REF.assume}: the share and the base load are the tool's own; no standard gives a diversity factor for homes`, expect: designKw(0, ded) })
  L.calc('Design load (maximum demand)', 'design load = the larger of the two', 'max({a:2}, {b:2})', { a: byArea, b: byDed }, (v) => Math.max(v.a, v.b),
    { unit: 'kW', dp: 2, ref: REF.draftC7, expect: gov.pd, result: true })
  const design = L.take()
  const dfact = c.fact('Design load')
  c.tieText('Design load shown in the report', dfact?.v ?? '', `${d1(d.kwShown)} kW`)

  const phaseText = (three: boolean) => (three ? 'Three-phase' : 'Single-phase')
  const designRows = flats
    ? d.boards.map((b) => {
        const carp = b.spec.common ? 0 : b.spec.carpetM2
        const dd = dedicatedKw(b.spec)
        return [b.spec.label, d0(b.spec.mult), d2(carp), d2(dd), d2(DESIGN.wPerM2Carpet * carp), d2(DESIGN.applianceShare * dd + DESIGN.baseKw), d2(b.pd), phaseText(b.three)]
      })
    : [['The whole house', '1', d2(d.houseCarpet), d2(d.houseDed), d2(DESIGN.wPerM2Carpet * d.houseCarpet), d2(DESIGN.applianceShare * d.houseDed + DESIGN.baseKw), d2(d.housePd), phaseText(d.boards[0].three)]]
  const designTable = table(
    ['Consumer', 'Copies', 'Carpet (m²)', 'Large appliances (kW)', 'By area (kW)', 'By appliances (kW)', 'Design load (kW)', 'Supply'],
    designRows,
    { num: [1, 2, 3, 4, 5, 6], note: flats ? 'The common board has no carpet area, so its design load comes from the pumps and EV chargers alone. A board that is not the one taking the supply is always single-phase.' : 'The whole house has one design load. Each board on an upper floor takes a share of it (section 7).' },
  )

  const t10 = RULE.threePhaseAboveKw
  L.pick('Supply taken', `three-phase if you chose it, or if the design load is above ${t10} kW; single-phase if you chose that`,
    d.threePhase ? 'Three-phase' : 'Single-phase', `${REF.assume}: your electricity board decides this`,
    c.inp.supply === 'auto' ? `Chosen from the design load: the largest is ${d1(d.kwShown)} kW.` : 'As you chose.')
  const phase = L.take()
  c.tieText('Supply shown in the report', c.fact('Supply')?.v ?? '', d.threePhase ? 'Three-phase' : 'Single-phase')

  return {
    id: 's4', title: '4. Connected load, diversity and design load',
    intro: 'Connected load is what every point could draw if all ran at once; it sizes nothing by itself. The design load (maximum demand) is what the supply, the incomer and the mains are sized for. The model allows for diversity only through the 0.6 share it takes of the large appliances.',
    blocks: [
      block('load-conn', '4.1 Connected load', conn),
      block('load-board', '4.2 Connected load board by board', undefined, loadByBoard),
      block('load-design', '4.3 Design load: worked example', design),
      block('load-design-all', '4.4 Design load of every consumer', undefined, designTable),
      block('load-phase', '4.5 Single-phase or three-phase', phase),
    ],
  }
}

