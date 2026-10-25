/*
  ElectricalPro model: points, circuits, boards, wire, conduit, accessories and earthing for the wiring of a home.

  It works from a few plain answers (how many homes, bedrooms, bathrooms, which rooms have an air conditioner,
  whether there is an inverter or an EV charger) and the floor areas of the project.

  Every figure is one of four kinds, and the report says which:
    Code     read from a standard or a CPWD document (IS 4648 and its BIS draft revision, IS 732, CPWD General
             Specifications for Electrical Works Part I, CPWD Delhi Analysis of Rates for E&M 2016)
    Derived  worked out from a Code figure with arithmetic that is shown
    Assumed  no document fixes it (for example metres from a board to its first point); a stated, editable engineering value
  The research behind each number is in the project file "research-electrical-2026-10-25". Where the sources disagree
  (lighting-circuit limits, where 6 A sockets sit, conduit fill), the choice made here is stated in the report.

  The tables, constants and planning rules this file works from are in rules.ts (and wire.ts for wire sizes); the
  calculation sheet at the end of the paid report (calc.ts) reads the same files and re-works every figure from them.

  The site is quantity-only: nothing here knows a price, a labour rate or a dealer.
*/

import type { BaseInput, Check, Fact, Parsed, QtyLine, Ran, Table, Tile, TradeModel } from '../types'
import { Reader, SQFT_TO_M2, bump, ceilTo, fmt, pieces, rangeText, round } from '../util'
import { CIRCUIT_RULES, conduitFor, earthMm2, incomerA, mainsMm2 } from './wire'
import { buildElectricalCalc } from './calc'
import {
  A_MAX, A_MIN, AREA_KINDS, BAS, CARPET_SHARE, CIRCUIT_COLOURS, COIL_M, COLOUR, COLOUR_ORDER, DAR, ELEC_BANDS, FIXED_M2, MAINS_COLOURS, NAME, PER_M, PHASE_KIND, RULE, RUN, STD, W, WASTE, WATTS,
  accLineKey, addTo, dbLineKey, dedicatedKw, designKw, floorName, rccbA, spread, waysFor, zero,
  type AreaKind, type Cnt, type Kind,
} from './rules'

export interface ElecInput extends BaseInput {
  dwelling: 'house' | 'flats'
  /** flats only: homes on each floor */
  homesPerFloor: number
  /** per home (for a house, the whole house) */
  bedrooms: number
  bathrooms: number
  kitchens: number
  balconies: number
  /** a dining room apart from the kitchen */
  dining: boolean
  pooja: boolean
  /** a wash area or dry balcony with a washing machine point */
  utility: boolean
  /** rooms with an air conditioner, per home */
  acRooms: number
  /** a water heater in every bathroom */
  geyser: boolean
  inverter: boolean
  ev: boolean
  /** parking spaces in the building */
  parking: number
  wiring: 'standard' | 'basic'
  supply: 'auto' | 'single' | 'three'
  storeyM?: number
}

export function parseElec(raw: unknown): Parsed<ElecInput> {
  const r = new Reader(raw)
  const floorAreasSqft = r.floors()
  const { state, city } = r.place()
  const dwelling = r.pick('dwelling', 'Building type', ['house', 'flats'] as const, 'house')
  const homesPerFloor = dwelling === 'flats' ? r.int('homesPerFloor', 'Homes on each floor', 1, 8, 2) : 1
  const bedrooms = r.int('bedrooms', 'Bedrooms', 1, 8, 3)
  const bathrooms = r.int('bathrooms', 'Bathrooms', 1, 10, Math.min(bedrooms, 4))
  const kitchens = r.int('kitchens', 'Kitchens', 1, 3, 1)
  const balconies = r.int('balconies', 'Balconies', 0, 6, 1)
  const dining = r.bool('dining', false)
  const pooja = r.bool('pooja', false)
  const utility = r.bool('utility', true)
  const acRooms = r.int('acRooms', 'Air-conditioned rooms', 0, 10, 1)
  const geyser = r.bool('geyser', true)
  const inverter = r.bool('inverter', false)
  const ev = r.bool('ev', false)
  const parking = r.int('parking', 'Parking spaces', 0, 200, dwelling === 'house' ? 1 : 0)
  const wiring = r.pick('wiring', 'Wiring level', ['standard', 'basic'] as const, 'standard')
  const supply = r.pick('supply', 'Supply', ['auto', 'single', 'three'] as const, 'auto')
  const storeyM = r.optNum('storeyM', 'Floor to floor height', 2.7, 4.0)
  if (r.error) return { ok: false, error: r.error }
  return {
    ok: true,
    input: { floorAreasSqft, state, city, dwelling, homesPerFloor, bedrooms, bathrooms, kitchens, balconies, dining, pooja, utility, acRooms, geyser, inverter, ev, parking, wiring, supply, storeyM },
  }
}


/* ───────────────────────── the model ───────────────────────── */

interface Spec {
  label: string
  floor: number
  mult: number
  builtM2: number
  carpetM2: number
  rooms: Partial<Record<Kind, number>>
  extras: { name: string; n: number; c: Partial<Cnt> }[]
  ac: number
  geysers: number
  washers: number
  dish: number
  pumps: number
  evs: number
  /** the board that takes the incoming supply (a flat's board, or a house's ground-floor board) */
  main: boolean
  /** a board fed from another by a sub-main (a house's upper floors) */
  sub: boolean
  common: boolean
}

export function runElec(inp: ElecInput): Ran {
  const N = inp.floorAreasSqft.length
  const flats = inp.dwelling === 'flats'
  const std = inp.wiring === 'standard'
  const H = inp.storeyM ?? RULE.storeyDefaultM
  const homesOnFloor = flats ? inp.homesPerFloor : 1
  const homes = flats ? inp.homesPerFloor * N : 1
  const builtM2 = inp.floorAreasSqft.map((a) => a * SQFT_TO_M2)
  const T = std ? STD : BAS
  const parking = inp.ev && inp.parking === 0 ? homes : inp.parking
  const pumps = homes >= RULE.pumpsTwoFromHomes ? RULE.pumpsTwo : RULE.pumpsOne
  const evCircuits = inp.ev ? Math.max(1, Math.ceil(parking * RULE.evPerSpace)) : 0

  /* ── what each board serves ── */
  const specs: Spec[] = []
  const acPerHome = Math.min(inp.acRooms, inp.bedrooms + RULE.acBeyondBedrooms)
  const base = (): Spec => ({ label: '', floor: 0, mult: 1, builtM2: 0, carpetM2: 0, rooms: {}, extras: [], ac: 0, geysers: 0, washers: 0, dish: 0, pumps: 0, evs: 0, main: false, sub: false, common: false })
  const stairLights = (floors: number) => ({ name: 'Staircase', n: floors, c: { L: RULE.stairLightsPerFloor * floors } })
  const terraceExtra = () => ({ name: 'Terrace and stair room', n: 1, c: { L: N > 1 ? RULE.terraceLightsMulti : RULE.terraceLightsSingle, S6: RULE.terraceS6 } })
  const gateExtra = () => ({ name: 'Gate and porch', n: 1, c: { L: RULE.gateLights } })
  const parkingExtra = () => (parking > 0 ? [{ name: 'Parking', n: parking, c: { L: Math.max(RULE.parkingLightsMin, Math.ceil(parking * RULE.parkingLightsPerSpace)), S6: RULE.parkingS6 } }] : [])

  if (flats) {
    for (let i = 0; i < N; i++) {
      const s = base()
      s.label = `${floorName(i)} home`
      s.floor = i
      s.mult = homesOnFloor
      s.builtM2 = builtM2[i] / homesOnFloor
      s.carpetM2 = s.builtM2 * CARPET_SHARE
      s.rooms = { hall: 1, dining: inp.dining ? 1 : 0, kitchen: inp.kitchens, bedroom: inp.bedrooms, bath: inp.bathrooms, passage: 1, entrance: 1, balcony: inp.balconies, utility: inp.utility ? 1 : 0, pooja: inp.pooja ? 1 : 0 }
      s.ac = acPerHome
      s.geysers = inp.geyser ? inp.bathrooms : 0
      s.washers = inp.utility ? 1 : 0
      s.dish = inp.utility && std ? 1 : 0
      s.main = true
      specs.push(s)
    }
    const c = base()
    c.label = 'Common board'
    c.floor = 0
    c.builtM2 = Math.max(...builtM2)
    c.extras = [stairLights(N), { name: 'Lift lobby and passages', n: N, c: { L: RULE.liftLobbyLightsPerFloor * N } }, terraceExtra(), gateExtra(), ...parkingExtra()]
    c.pumps = pumps
    c.evs = evCircuits
    c.main = true
    c.common = true
    specs.push(c)
  } else {
    const beds = spread(inp.bedrooms, N)
    const baths = spread(inp.bathrooms, N)
    const kits = spread(inp.kitchens, N)
    const balc = spread(inp.balconies, N)
    let acLeft = acPerHome
    for (let i = 0; i < N; i++) {
      const hall = i === 0 ? 1 : 0
      if (beds[i] + baths[i] + kits[i] + hall === 0) continue
      const s = base()
      s.label = floorName(i)
      s.floor = i
      s.builtM2 = builtM2[i]
      s.carpetM2 = builtM2[i] * CARPET_SHARE
      s.rooms = { hall, dining: i === 0 && inp.dining ? 1 : 0, kitchen: kits[i], bedroom: beds[i], bath: baths[i], passage: 1, entrance: i === 0 ? 1 : 0, balcony: balc[i], utility: i === 0 && inp.utility ? 1 : 0, pooja: i === 0 && inp.pooja ? 1 : 0 }
      const cap = beds[i] + hall
      s.ac = Math.min(acLeft, cap)
      acLeft -= s.ac
      s.geysers = inp.geyser ? baths[i] : 0
      s.washers = i === 0 && inp.utility ? 1 : 0
      s.dish = i === 0 && inp.utility && std ? 1 : 0
      s.main = i === 0
      s.sub = i !== 0
      if (N > 1) s.extras.push({ name: 'Staircase', n: 1, c: { L: RULE.houseStairLights } })
      if (i === 0) {
        s.extras.push(terraceExtra(), gateExtra(), ...parkingExtra())
        s.pumps = pumps
        s.evs = evCircuits
      }
      specs.push(s)
    }
  }

  /* ── accumulators ── */
  const wire = new Map<string, number>() // "size|colour" -> metres before waste
  const cond = new Map<number, number>() // conduit mm -> route metres before waste
  const acc = { bends: 0, couplers: 0, saddles: 0, jbox: 0 }
  const wadd = (size: number, colour: string, m: number) => bump(wire, `${size}|${colour}`, m)
  const cadd = (mm: number, m: number) => bump(cond, mm, m)
  const roomRows = new Map<string, { n: number; c: Cnt }>()
  const circuits = new Map<string, { n: number; rating: string; cable: string; basis: string }>()
  const mcb = new Map<number, number>() // rating -> count of one-pole MCBs
  const dbs = new Map<string, { name: string; kind: string; n: number; ways: number; incomer: string; rccb: string }>()
  const total = zero()
  const tot = { ac: 0, geysers: 0, washers: 0, dish: 0, pumps: 0, evs: 0, circuits: 0, tvM: 0, dataM: 0, inverters: 0, boards: 0, mediaBoxes: 0, meterBoards: 0, modules: 0 }
  const incomers = new Map<string, number>() // "poles|amps" -> count
  const mains: { run: string; cable: string; n: number; each: number; conduit: string }[] = []
  const connected = new Map<string, number>() // category -> kW
  const loadsAdd = (cat: string, kw: number) => bump(connected, cat, kw)

  /** n runs of single-phase cable (live, neutral, earth of one size) over `routeM` metres each. */
  const addRoute = (size: number, routeM: number, n: number, power = true) => {
    if (n <= 0 || routeM <= 0) return
    const m = routeM * n
    for (const col of CIRCUIT_COLOURS) wadd(size, col, m * RUN)
    cadd(conduitFor(size, false), m)
    acc.bends += m * PER_M.bends
    acc.couplers += m * PER_M.couplers
    acc.saddles += m * PER_M.saddles
    if (power) acc.jbox += m * PER_M.jbox
  }
  const addMain = (size: number, routeM: number, n: number, three: boolean) => {
    const m = routeM * n
    for (const col of three ? MAINS_COLOURS.three : MAINS_COLOURS.single) wadd(size, col, m * RUN)
    wadd(earthMm2(size), COLOUR.earth, m * RUN)
    cadd(conduitFor(size, three), m)
    acc.bends += m * PER_M.bends
    acc.couplers += m * PER_M.couplers
    acc.saddles += m * PER_M.saddles
  }
  const circ = (label: string, n: number, rating: string, cable: string, basis: string, mult: number) => {
    if (n <= 0) return
    const e = circuits.get(label)
    if (e) e.n += n * mult
    else circuits.set(label, { n: n * mult, rating, cable, basis })
    tot.circuits += n * mult
  }
  const mcbAdd = (rating: number, n: number) => { if (n > 0) bump(mcb, rating, n) }

  /* design load of the whole consumer (a house) or of one flat, in kW (draft IS 4648 cl 7: not less than 75 W/m² of carpet area) */
  const dedKw = (s: Spec) => dedicatedKw(s)
  const houseCarpet = specs.reduce((a, s) => a + s.carpetM2, 0)
  const houseDed = specs.reduce((a, s) => a + dedKw(s), 0)

  const housePd = flats ? 0 : designKw(houseCarpet, houseDed)
  const pdOf = (s: Spec) => (flats ? (s.common ? designKw(0, dedKw(s)) : designKw(s.carpetM2, dedKw(s))) : housePd)
  const threeOf = (s: Spec) => (s.common || !s.main ? false : inp.supply === 'three' ? true : inp.supply === 'single' ? false : pdOf(s) > RULE.threePhaseAboveKw)
  const threePhase = specs.some((s) => threeOf(s))
  const kwShown = flats ? Math.max(...specs.filter((s) => !s.common).map(pdOf)) : housePd

  /* ── plan each board ── */
  for (const s of specs) {
    const mult = s.mult
    const f = Math.max(0, Math.min(1, (s.builtM2 / SQFT_TO_M2 - RULE.groupAFromSqft) / (RULE.groupBFromSqft - RULE.groupAFromSqft))) // 0 = DAR Group A, 1 = Group B
    const cnt = zero()
    const rows = new Map<string, { n: number; c: Cnt }>()

    // room sizes, shared out of the carpet area
    const areaOf: Partial<Record<AreaKind, number>> = {}
    if (!s.common) {
      const bal = (s.rooms.balcony ?? 0) * FIXED_M2.balcony + (s.rooms.entrance ?? 0) * FIXED_M2.entrance
      let wsum = 0
      for (const k of AREA_KINDS) wsum += (s.rooms[k] ?? 0) * W[k]
      const k0 = wsum > 0 ? Math.max(0, s.carpetM2 - bal) / wsum : 0
      for (const k of AREA_KINDS) areaOf[k] = Math.min(A_MAX[k], Math.max(A_MIN[k], W[k] * k0))
      for (const kind of Object.keys(s.rooms) as Kind[]) {
        const n = s.rooms[kind] ?? 0
        if (n <= 0) continue
        const area = kind === 'entrance' ? FIXED_M2.entrance : kind === 'balcony' ? FIXED_M2.balcony : areaOf[kind as AreaKind]!
        const units = Math.max(1, area / RULE.unitM2)
        const row = T[kind]
        const c = zero()
        for (const x of ['L', 'F', 'S6', 'S16'] as const) c[x] = n * Math.round((row.u[x] ?? 0) * units)
        for (const x of ['X', 'B', 'TV', 'D'] as const) c[x] = n * (row.f[x] ?? 0)
        const label = kind === 'kitchen' && !inp.dining ? 'Kitchen and dining' : NAME[kind]
        rows.set(label, { n, c })
        addTo(cnt, c)
      }
    }
    for (const e of s.extras) {
      const c = zero()
      addTo(c, e.c)
      rows.set(e.name, { n: e.n, c })
      addTo(cnt, c)
    }
    // counts across all copies of this board
    for (const [label, r] of rows) {
      const e = roomRows.get(label)
      const c = zero()
      addTo(c, r.c, mult)
      if (e) { e.n += r.n * mult; addTo(e.c, c) } else roomRows.set(label, { n: r.n * mult, c })
    }
    addTo(total, cnt, mult)
    tot.ac += s.ac * mult; tot.geysers += s.geysers * mult; tot.washers += s.washers * mult; tot.dish += s.dish * mult; tot.pumps += s.pumps; tot.evs += s.evs

    // connected load
    loadsAdd('Lights', (cnt.L * WATTS.L * mult) / 1000)
    loadsAdd('Fans and exhaust fans', ((cnt.F * WATTS.F + cnt.X * WATTS.X) * mult) / 1000)
    loadsAdd('6 A sockets', (cnt.S6 * WATTS.S6 * mult) / 1000)
    loadsAdd('6/16 A sockets', (cnt.S16 * WATTS.S16 * mult) / 1000)
    loadsAdd('Air conditioners', (s.ac * WATTS.ac * mult) / 1000)
    loadsAdd('Water heaters', (s.geysers * WATTS.geyser * mult) / 1000)
    loadsAdd('Washing machine and dishwasher', ((s.washers * WATTS.washer + s.dish * WATTS.dish) * mult) / 1000)
    loadsAdd('Pumps and EV chargers', ((s.pumps * WATTS.pump + s.evs * WATTS.ev) * mult) / 1000)

    // points (DAR item 1.1: live and neutral and earth to every light, fan, exhaust fan and bell point)
    const pts = cnt.L + cnt.F + cnt.X + cnt.B
    const dw = DAR.A.wire + f * (DAR.B.wire - DAR.A.wire)
    const de = DAR.A.earth + f * (DAR.B.earth - DAR.A.earth)
    const dc = DAR.A.conduit + f * (DAR.B.conduit - DAR.A.conduit)
    wadd(RULE.pointMm2, COLOUR.live, pts * dw * mult); wadd(RULE.pointMm2, COLOUR.neutral, pts * dw * mult); wadd(RULE.pointMm2, COLOUR.earth, pts * de * mult)
    cadd(RULE.pointConduitMm, pts * dc * mult)
    acc.bends += pts * mult
    acc.couplers += pts * (DAR.A.couplers + f * (DAR.B.couplers - DAR.A.couplers)) * mult
    acc.saddles += pts * (DAR.A.saddles + f * (DAR.B.saddles - DAR.A.saddles)) * mult
    acc.jbox += pts * mult

    // sockets: a run from the nearest point, in 2.5 mm² on a power circuit (1.5 mm² on the lighting circuit in the Basic level)
    const tap = RULE.tapBaseM + RULE.tapRiseM * f
    const sockSize = std ? RULE.tapMm2.std : RULE.tapMm2.basic
    addRoute(sockSize, tap * cnt.S6 * mult, 1)
    addRoute(RULE.tapMm2.s16, tap * cnt.S16 * mult, 1)

    // TV and data points: a conduit from the board's media box
    const rMedia = RULE.mediaPerSqrtM * Math.sqrt(s.builtM2) + RULE.mediaBaseM
    tot.tvM += cnt.TV * rMedia * mult
    tot.dataM += cnt.D * rMedia * mult
    cadd(RULE.pointConduitMm, (cnt.TV + cnt.D) * rMedia * mult)
    if (cnt.TV + cnt.D > 0) tot.mediaBoxes += mult

    // circuits
    const bathRow = rows.get(NAME.bath)
    const bathPts = std && bathRow ? bathRow.c.L + bathRow.c.X : 0
    const lightPts = pts - bathPts
    const cBath = bathPts > 0 ? Math.ceil(bathPts / RULE.ptsPerBathCkt) : 0
    let cL: number
    if (std) cL = Math.max(lightPts > 0 ? 1 : 0, RULE.minLightCkts - cBath, Math.ceil(lightPts / RULE.ptsPerLightCkt))
    else cL = Math.max(RULE.minLightCkts, Math.ceil((pts + cnt.S6) / RULE.ptsPerLightCktBasic))
    if (s.common) cL = Math.max(cL, Math.ceil(pts / RULE.ptsPerLightCkt), pts > 0 ? 1 : 0)
    const cS6 = std ? Math.ceil(cnt.S6 / RULE.s6PerCkt) : 0
    const cS16 = Math.ceil(cnt.S16 / RULE.s16PerCkt)
    const inv = inp.inverter && s.main && !s.common ? 1 : 0

    const rLight = RULE.routeLight * Math.sqrt(s.builtM2) + RULE.routeBaseM
    const rSock = RULE.routeSock * Math.sqrt(s.builtM2) + RULE.routeBaseM
    const rDed = RULE.routeDed * Math.sqrt(s.builtM2) + RULE.routeBaseM
    const rGround = RULE.routeGround * Math.sqrt(Math.max(...builtM2)) + RULE.routeBaseM + s.floor * H
    circ('Lights and fans', cL, CIRCUIT_RULES.lights.mcb, `${CIRCUIT_RULES.lights.mm2} mm², 2 + earth`, std ? 'Up to 8 points on a circuit (draft IS 4648 cl 6.2.1)' : 'Up to 10 points, with the 5 A sockets, on a circuit (IS 4648:1968 cl 7.2)', mult)
    circ('Bathroom lights and exhaust fans', cBath, CIRCUIT_RULES.lights.mcb, `${CIRCUIT_RULES.lights.mm2} mm², 2 + earth`, 'Bathrooms on a circuit of their own (draft IS 4648 cl 6.2.1)', mult)
    circ('6 A sockets', cS6, CIRCUIT_RULES.sockets6.mcb, `${CIRCUIT_RULES.sockets6.mm2} mm², 2 + earth`, 'Up to 8 sockets on a circuit; the sources disagree on this limit', mult)
    circ('6/16 A sockets', cS16, CIRCUIT_RULES.sockets16.mcb, `${CIRCUIT_RULES.sockets16.mm2} mm², 2 + earth`, 'Two 6/16 A outlets on a circuit (CPWD GS 3.10 iii; draft IS 4648 cl 6.2.2)', mult)
    circ('Air conditioner', s.ac, CIRCUIT_RULES.ac.mcb, `${CIRCUIT_RULES.ac.mm2} mm², 2 + earth`, 'One circuit for each air conditioner (draft IS 4648 cl 6.2.2)', mult)
    circ('Water heater', s.geysers, CIRCUIT_RULES.heater.mcb, `${CIRCUIT_RULES.heater.mm2} mm², 2 + earth`, 'One circuit for each water heater', mult)
    circ('Washing machine and dishwasher', s.washers + s.dish, CIRCUIT_RULES.heater.mcb, `${CIRCUIT_RULES.heater.mm2} mm², 2 + earth`, 'One circuit for each appliance of 2 kW or more', mult)
    circ('Transfer pump', s.pumps, `${RULE.mcb.power} A`, `${RULE.pumpMm2} mm², 2 + earth`, 'One circuit for each pump', 1)
    circ('EV charger', s.evs, `${RULE.mcb.ev} A`, `${RULE.evMm2} mm², 2 + earth`, 'One 7.4 kW charger circuit for each charging point', 1)
    circ('Inverter', inv, `${RULE.mcb.power} A`, `${RULE.inverterMm2} mm², 2 + earth`, 'Inverter input and output, with its own isolator', mult)

    addRoute(CIRCUIT_RULES.lights.mm2, rLight, (cL + cBath) * mult, false)
    addRoute(CIRCUIT_RULES.sockets6.mm2, rSock, (cS6 + cS16) * mult)
    addRoute(CIRCUIT_RULES.ac.mm2, rDed, s.ac * mult)
    addRoute(CIRCUIT_RULES.heater.mm2, rDed, (s.geysers + s.washers + s.dish) * mult)
    addRoute(RULE.pumpMm2, RULE.pumpRouteM, s.pumps)
    addRoute(RULE.evMm2, rGround, s.evs)
    addRoute(RULE.inverterMm2, RULE.inverterRouteM, inv * mult)
    tot.inverters += inv * mult

    const light6 = cL + cBath
    mcbAdd(RULE.mcb.light, light6 * mult)
    mcbAdd(std ? RULE.mcb.sockets6 : RULE.mcb.sockets6Basic, cS6 * mult)
    mcbAdd(RULE.mcb.power, (cS16 + s.geysers + s.washers + s.dish + inv) * mult + s.pumps)
    mcbAdd(RULE.mcb.ac, s.ac * mult)
    mcbAdd(RULE.mcb.ev, s.evs)

    const outgoing = cL + cBath + cS6 + cS16 + s.ac + s.geysers + s.washers + s.dish + inv + s.pumps + s.evs
    const three = threeOf(s)
    const ways = waysFor(outgoing + RULE.spareWays, three)
    const boardPd = s.sub ? Math.max(RULE.subBoardMinKw, housePd * (s.carpetM2 / Math.max(1, houseCarpet))) : pdOf(s)
    const inc = incomerA(boardPd, three)
    const rc = rccbA(inc)
    const kind = three ? PHASE_KIND.three : PHASE_KIND.single
    const key = `${s.label}|${kind}|${ways}`
    const prev = dbs.get(key)
    if (prev) prev.n += mult
    else dbs.set(key, { name: s.label, kind, n: mult, ways, incomer: `${inc} A, ${three ? '4' : '2'}-pole`, rccb: `${rc} A, ${three ? '4' : '2'}-pole, 30 mA` })
    tot.boards += mult
    tot.meterBoards += s.main ? mult : 0

    // mains, rising mains and sub-mains
    if (flats) {
      const size = mainsMm2(boardPd, three)
      const each = (s.common ? RULE.mainsCommonM : RULE.mainsFlatM) + s.floor * H
      addMain(size, each, mult, three)
      mains.push({ run: s.common ? 'Meter board to the common board' : `Meter room to the ${s.label.toLowerCase()} board`, cable: `${three ? '4' : '2'} × ${size} mm² + ${earthMm2(size)} mm² earth`, n: mult, each: round(each, 1), conduit: `${conduitFor(size, three)} mm` })
    } else if (s.main) {
      const size = mainsMm2(housePd, three)
      addMain(size, RULE.mainsHouseM, 1, three)
      mains.push({ run: 'Meter to the main board', cable: `${three ? '4' : '2'} × ${size} mm² + ${earthMm2(size)} mm² earth`, n: 1, each: RULE.mainsHouseM, conduit: `${conduitFor(size, three)} mm` })
    } else {
      const size = Math.max(RULE.subMainMinMm2, mainsMm2(boardPd, false))
      const each = s.floor * H + RULE.subMainExtraM
      addMain(size, each, 1, false)
      mains.push({ run: `Main board to the ${s.label.toLowerCase()} board`, cable: `2 × ${size} mm² + ${earthMm2(size)} mm² earth`, n: 1, each: round(each, 1), conduit: `${conduitFor(size, false)} mm` })
    }
    // incomer, RCCB, spare way
    bump(incomers, `${three ? 4 : 2}|${inc}`, mult)
    tot.modules += (cnt.L + cnt.F + cnt.X + cnt.F + cnt.S6 + cnt.S16 + s.washers + s.dish + cnt.TV + cnt.D + cnt.B + s.ac) * mult
  }

  /* ── earthing ── */
  const electrodes = flats ? RULE.electrodesFlatsBase + Math.floor(homes / RULE.electrodesPerHomes) : threePhase ? RULE.electrodesThreePhase : RULE.electrodesSingle
  const stripM = electrodes * RULE.stripPerElectrodeM

  /* ── accessories ── */
  const L = total.L, F = total.F, X = total.X, B = total.B, S6 = total.S6, S16 = total.S16
  const acc2 = new Map<string, number>()
  const a = (name: string, n: number) => { if (n > 0) bump(acc2, name, n) }
  a('Modular switch, 6 A, one-way (lights, fans, exhaust fans)', L + F + X)
  a('Electronic fan regulator, step type', F)
  a('Modular socket with switch, 6 A, 3-pin', S6)
  a('Modular socket with switch, 6/16 A', S16 + tot.washers + tot.dish)
  a('Socket, 20/25 A, for an air conditioner', tot.ac)
  a('Isolator switch, double-pole, 32 A, with indicator (air conditioner, water heater)', tot.ac + tot.geysers)
  a('Call bell push', B)
  a('Call bell', B)
  a('TV outlet', total.TV)
  a('Data outlet (RJ45)', total.D)
  a('Media box (TV and data cables meet here)', tot.mediaBoxes)
  a('Ceiling rose or connector', L + F + B)
  a('Fan hook and box', F)
  a('Junction box or ceiling box, 20 mm', Math.ceil(acc.jbox))
  const boards = Math.ceil(tot.modules / RULE.modulesPerBox)
  a('Switch box (GI or PVC) with cover plate, about 4 modules each', boards)

  /* ── purchase lengths ── */
  const colourOrder = COLOUR_ORDER
  const wireRows = [...wire.entries()]
    .map(([k, m]) => { const [size, colour] = k.split('|'); return { size: Number(size), colour, m } })
    .sort((x, y) => x.size - y.size || colourOrder.indexOf(x.colour) - colourOrder.indexOf(y.colour))
  const buyWire = (size: number, m: number) => (size <= RULE.coilMaxMm2 ? pieces(m * WASTE, COIL_M) * COIL_M : ceilTo(m * WASTE, RULE.byMetreStepM))
  const wireBuyTotal = wireRows.reduce((s, r) => s + buyWire(r.size, r.m), 0)
  const wireRunTotal = wireRows.reduce((s, r) => s + r.m, 0)
  const condRows = [...cond.entries()].sort((x, y) => x[0] - y[0])
  const condBuy = condRows.reduce((s, [, m]) => s + pieces(m * WASTE, RULE.conduitPieceM) * RULE.conduitPieceM, 0)
  const condRun = condRows.reduce((s, [, m]) => s + m, 0)
  const coaxBuy = total.TV > 0 ? ceilTo(tot.tvM * WASTE, RULE.byMetreStepM) : 0
  const catBuy = total.D > 0 ? ceilTo(tot.dataM * WASTE, RULE.byMetreStepM) : 0

  const points = L + F + X + B
  const sockets = S6 + S16 + tot.washers + tot.dish + tot.ac
  const roomsCounted = [...roomRows.entries()].filter(([name]) => !['Staircase', 'Lift lobby and passages', 'Terrace and stair room', 'Gate and porch', 'Parking'].includes(name))
  const roomCount = roomsCounted.reduce((s, [, r]) => s + r.n, 0)

  /* ───────── free part ───────── */
  const checks: Check[] = [
    { id: 'lightckt', clause: std ? 'Draft IS 4648 cl 6.2.1; CPWD GS 3.10(i)' : 'IS 4648:1968 cl 7.2; CPWD GS 3.10(i)', description: 'Lighting circuits', status: 'pass', detail: std ? 'A lighting circuit carries at most 8 points or 1,000 W, and bathrooms have a circuit of their own. The older standard allows 10 points or 800 W; the stricter limit is used.' : 'A lighting circuit carries at most 10 points, with the 5 A sockets, and 800 W (more with LED or CFL). There are at least two lighting circuits in a home.' },
    { id: 'powerckt', clause: 'CPWD GS 3.10(iii); draft IS 4648 cl 6.2.2', description: 'Power circuits', status: 'pass', detail: 'No power circuit has more than two 16 A outlets, and each air conditioner, water heater and appliance of 2 kW or more has a circuit of its own.' },
    { id: 'conductor', clause: 'CPWD GS 3.12; draft IS 4648 Table 4', description: 'Wire size', status: 'advisory', detail: 'All wire is copper: 1.5 mm² for lights, 2.5 mm² for sockets, 4 mm² for an air conditioner, with an earth wire of the same size in every circuit. CPWD asks for 4 mm² on power wiring in its own works; the draft IS 4648 allows 2.5 mm² on a socket circuit of up to two outlets, and this report follows the draft. For a long run the electrician should check the voltage drop, which this report does not work out.' },
    { id: 'rccb', clause: 'Draft IS 4648 cl 6.2.9', description: 'Shock protection', status: 'pass', detail: 'A 30 mA residual current breaker (RCCB) is counted on every board.' },
    { id: 'load', clause: 'Draft IS 4648 cl 7', description: 'Design load', status: kwShown > 10 && !threePhase ? 'advisory' : 'pass', detail: `The design load is the larger of 75 W for every m² of floor (the minimum in the draft IS 4648) and a share of the big appliances. For yours it is about ${fmt(kwShown, 1)} kW${flats ? ' for each flat' : ''}, so a ${threePhase ? 'three-phase' : 'single-phase'} supply is counted. Your electricity board fixes the sanctioned load and decides single or three phase.` },
    { id: 'earth', clause: 'Draft IS 4648 cl 8; IS 3043', description: 'Earthing', status: 'advisory', detail: `${electrodes} earth ${electrodes === 1 ? 'electrode is' : 'electrodes are'} counted. The number needed depends on the soil, so your electrician must measure the earth resistance after installation.` },
    { id: 'fill', clause: 'CPWD DAR 2016 items 1.7; tender conduit tables', description: 'Conduit size', status: 'advisory', detail: 'Conduit sizes follow the CPWD analysis (three wires of up to 4 mm² in 20 mm). Some tender specifications allow fewer wires in 20 mm, so an electrician may choose the next size up. This changes the conduit price, not the number of metres.' },
  ]
  const warnings: string[] = []
  if (std) warnings.push('The room-by-room points follow the BIS draft revision of IS 4648 (September 2024), which is not yet published. The published standard of 1968 asks for far fewer sockets. Choose Basic if you want that level.')
  warnings.push('Wiring for a lift, a generator, solar panels, a swimming pool or an intercom is not counted.')
  if (flats && N >= 7) warnings.push('Above six floors, separate risers and a fire-rated rising main may be needed (NBC Part 4). This report counts one rising main for each flat.')

  const facts: Fact[] = [
    { k: 'Homes', v: String(homes), note: flats ? `${inp.homesPerFloor} on each floor` : 'One house' },
    { k: 'Rooms counted', v: String(roomCount), note: `${inp.bedrooms} ${inp.bedrooms === 1 ? 'bedroom' : 'bedrooms'}, ${inp.bathrooms} ${inp.bathrooms === 1 ? 'bathroom' : 'bathrooms'}, ${inp.kitchens} ${inp.kitchens === 1 ? 'kitchen' : 'kitchens'}${flats ? ' in each home' : ''}` },
    { k: 'Wiring level', v: std ? 'Standard' : 'Basic', note: std ? 'Room-wise points of the BIS draft IS 4648' : 'The sockets of IS 4648:1968' },
    { k: 'Design load', v: `${fmt(kwShown, 1)} kW`, note: `${flats ? 'For each flat. ' : ''}At least 75 W per m² (draft IS 4648)` },
    { k: 'Supply', v: threePhase ? 'Three-phase' : 'Single-phase', note: inp.supply === 'auto' ? 'Chosen from the design load; your electricity board decides' : 'As you chose' },
    { k: 'Boards', v: flats ? 'One in each flat' : N > 1 ? 'One on every floor' : 'One', note: flats ? 'And a common board' : 'With a 30 mA RCCB on each' },
    { k: 'Air conditioners', v: String(acPerHome * (flats ? homes : 1)), note: acPerHome > 0 ? 'Each on its own circuit' : 'None counted' },
    { k: 'Earthing', v: `${electrodes} ${electrodes === 1 ? 'electrode' : 'electrodes'}`, note: 'Counted for the whole building' },
  ]

  /* ───────── paid part ───────── */
  const tiles: Tile[] = [
    { k: 'Points and sockets', v: fmt(points + sockets), unit: 'counted', range: `${rangeText(points + sockets, ELEC_BANDS.points.low, ELEC_BANDS.points.high)}` },
    { k: 'Copper wire', v: fmt(wireBuyTotal), unit: 'm', range: `${rangeText(wireBuyTotal, ELEC_BANDS.wire.low, ELEC_BANDS.wire.high)} m` },
    { k: 'Conduit', v: fmt(condBuy), unit: 'm', range: `${rangeText(condBuy, ELEC_BANDS.conduit.low, ELEC_BANDS.conduit.high)} m` },
    { k: 'Circuits', v: fmt(tot.circuits), unit: 'on ' + fmt(tot.boards) + (tot.boards === 1 ? ' board' : ' boards'), range: `${rangeText(tot.circuits, ELEC_BANDS.circuits.low, ELEC_BANDS.circuits.high)} circuits` },
  ]

  const pointsRows: (string | number)[][] = [...roomRows.entries()].map(([name, r]) => [name, r.n, r.c.L, r.c.F, r.c.X, r.c.B, r.c.S6, r.c.S16, r.c.TV + r.c.D])
  const pointsFoot: (string | number)[] = ['All rooms and common areas', '', L, F, X, B, S6, S16, total.TV + total.D]
  const dedRows: (string | number)[][] = [
    ['Air conditioner outlets, 20/25 A', tot.ac],
    ['Water heater outlets, 6/16 A', tot.geysers],
    ['Washing machine and dishwasher outlets, 6/16 A', tot.washers + tot.dish],
    ['Pump outlets', tot.pumps],
    ['EV charger points, 32 A', tot.evs],
    ['Inverter connections', tot.inverters],
  ].filter((r) => Number(r[1]) > 0) as (string | number)[][]

  const circuitRows = [...circuits.entries()].map(([name, c]) => [name, round(c.n), c.rating, c.cable, c.basis])
  const dbRows = [...dbs.values()].map((d) => [d.name, d.n, `${d.ways} way, ${d.kind}`, d.incomer, d.rccb])
  const wireRowsOut = wireRows.map((r) => {
    const w = r.m * WASTE
    const buy = buyWire(r.size, r.m)
    return [`${r.size} mm²`, r.colour, fmt(r.m, 0), fmt(w, 0), r.size <= RULE.coilMaxMm2 ? buy / COIL_M : '', r.size <= RULE.coilMaxMm2 ? `${buy} m` : `${buy} m, by the metre`]
  })
  const condRowsOut = condRows.map(([mm, m]) => {
    const w = m * WASTE
    const pc = pieces(w, RULE.conduitPieceM)
    return [`${mm} mm`, fmt(m, 0), fmt(w, 0), pc, `${pc * RULE.conduitPieceM} m`]
  })
  const mainsRows = mains.map((m) => [m.run, m.cable, m.n, fmt(m.each, 1), m.conduit])
  const loadRows = [...connected.entries()].filter(([, kw]) => kw > 0).map(([k, kw]) => [k, fmt(kw, 1)])
  const connectedKw = [...connected.values()].reduce((s, v) => s + v, 0)

  const protRows: (string | number)[][] = []
  for (const [r, n] of [...mcb.entries()].sort((x, y) => x[0] - y[0])) protRows.push([`MCB, ${r} A, one-pole, outgoing`, round(n)])
  for (const [k, n] of [...incomers.entries()].sort()) { const [poles, amps] = k.split('|'); protRows.push([`Incomer MCB, ${poles}-pole, ${amps} A`, n]) }
  protRows.push(['RCCB, 30 mA, one on every board', tot.boards])
  protRows.push(['Meter board for the electricity board’s meter', tot.meterBoards])
  protRows.push([`Earth electrode (GI pipe 40 mm × 4.5 m, or a 600 × 600 mm plate)`, electrodes])
  protRows.push(['GI earth strip, 25 × 5 mm, from each electrode to the board', `${stripM} m`])
  protRows.push(['Earth pit cover and chamber', electrodes])

  const accRows: (string | number)[][] = [...acc2.entries()].map(([k, n]) => [k, n])
  accRows.push(['Conduit bends, 20 mm', Math.ceil(acc.bends)])
  accRows.push(['Conduit couplers', Math.ceil(acc.couplers)])
  accRows.push(['Conduit saddles or clips', Math.ceil(acc.saddles)])
  if (coaxBuy > 0) accRows.push(['TV cable (coaxial), to buy', `${coaxBuy} m`])
  if (catBuy > 0) accRows.push(['Data cable (Cat 6), to buy', `${catBuy} m`])

  const tables: Table[] = [
    { id: 'points', title: 'Points and sockets, room by room', sub: std ? 'Counted from the room-wise tables of the BIS draft IS 4648, in proportion to each room’s size.' : 'Counted from the socket schedule of IS 4648:1968, with lights and fans to match a home of this size.', head: ['Room', 'Number', 'Lights', 'Fans', 'Exhaust', 'Bells', '6 A', '6/16 A', 'TV, data'], num: [1, 2, 3, 4, 5, 6, 7, 8], rows: pointsRows, foot: pointsFoot, note: 'Room sizes are shared out of your floor area, so a larger home gets more points in each room. Lights, fans and sockets rise with the room size (per 12 m²); exhaust fans, bells and TV and data points are counted per room.' },
    { id: 'dedicated', title: 'Outlets with a circuit of their own', head: ['Item', 'Number'], num: [1], rows: dedRows, tight: true },
    { id: 'circuits', title: 'Circuits and breakers', sub: 'Each circuit has its own breaker, and a board has one spare way.', head: ['Circuit', 'Number', 'Breaker', 'Cable', 'Basis'], num: [1], rows: circuitRows, foot: ['All circuits', round(tot.circuits), '', '', ''] },
    { id: 'boards', title: 'Distribution boards', head: ['Board', 'Number', 'Size', 'Incoming breaker', 'Shock protection'], num: [1], rows: dbRows, tight: true, note: 'A board’s size is its outgoing ways, rounded up to the sizes sold: 4, 6, 8, 12, 16, 18, 24 or 32.' },
    { id: 'mains', title: 'Mains, rising mains and sub-mains', sub: 'Cable from the meter to each board, sized by the design load (draft IS 4648 Table 4).', head: ['Run', 'Cable', 'Number', 'Length each (m)', 'Conduit'], num: [2, 3], rows: mainsRows, tight: true },
    { id: 'wire', title: 'Copper wire to buy', sub: `Wire up to 6 mm² is sold in coils of ${COIL_M} m, and larger sizes by the metre. Every figure includes 5% for cutting waste.`, head: ['Size', 'Colour', 'Length needed (m)', 'With 5% waste (m)', 'Coils', 'To buy'], num: [2, 3, 4], rows: wireRowsOut, foot: ['All sizes', '', fmt(wireRunTotal, 0), fmt(wireRunTotal * WASTE, 0), '', `${fmt(wireBuyTotal)} m`], note: 'Red is the live wire, black the neutral and green the earth. A three-phase supply adds yellow and blue lines to the mains only.' },
    { id: 'conduit', title: 'Conduit to buy', sub: 'PVC conduit in 3 m lengths, with 5% for cutting waste.', head: ['Size', 'Run (m)', 'With 5% waste (m)', '3 m lengths', 'To buy'], num: [1, 2, 3], rows: condRowsOut, foot: ['All sizes', fmt(condRun, 0), fmt(condRun * WASTE, 0), condRowsOut.reduce((s, r) => s + Number(r[3]), 0), `${fmt(condBuy)} m`] },
    { id: 'acc', title: 'Switches, sockets, boxes and fittings', head: ['Item', 'Number'], num: [1], rows: accRows, tight: true, note: 'One switch for each point, as the CPWD point rules count it. In practice lights are grouped on one switch, so the real switch count may be lower. Screws, tape and small items are not counted.' },
    { id: 'prot', title: 'Breakers, shock protection and earthing', head: ['Item', 'Number'], num: [1], rows: protRows, tight: true },
    { id: 'load', title: 'Connected load', sub: 'What the points could draw if everything ran at once. It is used to size the supply, not to predict your bill.', head: ['Load', 'kW'], num: [1], rows: loadRows, foot: ['Total connected', fmt(connectedKw, 1)], note: `Design load: ${fmt(kwShown, 1)} kW${flats ? ' for each flat' : ''}, the larger of 75 W per m² of carpet area and 0.6 × the large appliances plus 1.5 kW.` },
  ]

  const lines: QtyLine[] = []
  for (const r of wireRows) {
    lines.push({ key: `wire-cu-${r.size}-${r.colour.toLowerCase()}`, item: `Copper wire ${r.size} mm², ${r.colour.toLowerCase()}`, qty: buyWire(r.size, r.m), unit: 'm', group: 'Electrical', basis: r.size <= RULE.coilMaxMm2 ? `Whole coils of ${COIL_M} m, 5% waste` : 'By the metre, 5% waste' })
  }
  for (const [mm, m] of condRows) lines.push({ key: `conduit-pvc-${mm}`, item: `PVC conduit ${mm} mm`, qty: pieces(m * WASTE, RULE.conduitPieceM) * RULE.conduitPieceM, unit: 'm', group: 'Electrical', basis: 'Whole 3 m lengths, 5% waste' })
  for (const [r, n] of [...mcb.entries()].sort((x, y) => x[0] - y[0])) lines.push({ key: `mcb-${r}a`, item: `MCB ${r} A`, qty: round(n), unit: 'nos', group: 'Electrical', basis: 'One-pole, one for each circuit' })
  for (const [k, n] of incomers) { const [poles, amps] = k.split('|'); lines.push({ key: `mcb-incomer-${poles}p-${amps}a`, item: `Incomer MCB ${poles}-pole ${amps} A`, qty: n, unit: 'nos', group: 'Electrical', basis: 'One at the head of each board' }) }
  lines.push({ key: 'rccb', item: 'RCCB 30 mA', qty: tot.boards, unit: 'nos', group: 'Electrical', basis: 'One on every board' })
  for (const d of dbs.values()) lines.push({ key: dbLineKey(d), item: `Distribution board ${d.ways} way, ${d.kind.startsWith('Three') ? 'three-phase' : 'single-phase'} (${d.name.toLowerCase()})`, qty: d.n, unit: 'nos', group: 'Electrical', basis: 'Outgoing ways, with a spare' })
  lines.push({ key: 'light-points', item: 'Light, fan, exhaust and bell points', qty: points, unit: 'nos', group: 'Electrical', basis: 'Counted room by room' })
  lines.push({ key: 'sockets', item: 'Socket outlets (6 A, 6/16 A, 20/25 A)', qty: sockets, unit: 'nos', group: 'Electrical', basis: 'Counted room by room, with the dedicated outlets' })
  if (electrodes > 0) lines.push({ key: 'earth-electrode', item: 'Earth electrode with pit', qty: electrodes, unit: 'nos', group: 'Electrical', basis: 'One for a single-phase house, two for three-phase or flats' })
  for (const [k, n] of acc2) lines.push({ key: accLineKey(k), item: k, qty: n, unit: 'nos', group: 'Electrical', basis: 'Counted' })

  const assumptions = [
    std
      ? 'Code (draft): lights, fans and sockets for each room follow Tables 2 and 3 of the BIS draft revision of IS 4648 (September 2024). The draft is not published, and a few columns were read by position, so the room-wise counts are a guide. Counts rise with room size, in proportion to each 12 m² (the draft says 10 to 12 m² or part, with no rounding rule).'
      : 'Code: sockets for each room follow the socket schedule of IS 4648:1968 (cl 9.8; where it gives 2 to 3 the larger is used). Lights and fans are set so that an 85 m² home has about 12 lights and 5 fans, the yardstick in the NIMI electrician text. The 5 A sockets sit on the lighting circuits, as the old standard has it.',
    'Code: a point is the whole wire run from the controlling switch to the outlet (CPWD GS 3.4). The wire, conduit, bends, couplers and clips in each point come from CPWD Delhi Analysis of Rates 2016, items 1.1 and 1.7: Group A is 7.5 m of wire and 2.5 m of conduit a point, Group B 10 m and 3.5 m, plus 5%.',
    `Assumed: homes up to 1,000 sq ft use Group A and homes of 2,500 sq ft or more use Group B, with a straight line between. The CPWD documents do not say where one group ends.`,
    'Code: lighting circuits, power circuits and the one-circuit-for-each-big-appliance rule follow CPWD GS 3.10, IS 4648 cl 7 and the draft cl 6.2. Where they differ, the stricter limit is used (8 lighting points, two 16 A outlets).',
    'Assumed: up to 8 six-amp sockets share a circuit. The sources disagree (three sockets in CPWD GS 3.10, no clear limit in the draft), so the figure is a modern-practice value and the circuit count is the least certain part of this report.',
    'Derived: copper wire is 1.01 m for each metre of route (CPWD DAR), with 5% added for cutting waste, and bought in coils of 90 m for sizes up to 6 mm². The 90 m coil is the common pack; no standard fixes it.',
    'Assumed: the run from a board to the first point of a circuit is 0.6 × the side of the home plus 3 m for lights, 0.7 × plus 3 m for sockets and 0.8 × plus 3 m for large appliances. A socket is tapped from the nearest point over 2.5 to 4 m.',
    `Assumed: carpet area is ${round(CARPET_SHARE * 100)}% of built-up area, and room sizes are shared out of it (hall 1.6, bedroom 1.0, kitchen 0.8, bathroom 0.35 parts), held between sensible limits (a bedroom 9.5 to 20 m², a hall 9.5 to 30 m²). Floor area beyond those limits is taken to be rooms you did not list, which are not counted.`,
    'Derived: design load is the larger of 75 W per m² of carpet area (draft IS 4648 cl 7) and 0.6 × the big appliances plus 1.5 kW. No standard gives a diversity factor for homes. Mains cables follow draft Table 4 up to 10 kW; larger sizes are Assumed.',
    'Assumed: single-phase up to a design load of 10 kW and three-phase above it. Your electricity board decides this, and the wire and board sizes change if it differs.',
    `Assumed: ${electrodes} earth ${electrodes === 1 ? 'electrode' : 'electrodes'} for the building and 10 m of earth strip from each. The number of pits depends on the soil.`,
    'Assumed: one 7.4 kW EV charger circuit for every five parking spaces, at least one, when you ask for EV charging. The wire is 6 mm².',
    'Assumed: one switch for each point, one fan hook, one regulator and one ceiling rose for each fan; a switch box holds about four modules.',
  ]
  const notIncluded = [
    'Rooms you did not list, such as a study, a family lounge or a guest room. Add them to the bedroom count if you want them wired.',
    'The electricity meter, the service connection and the board’s own cable up to the meter.',
    'Lifts, generators, solar panels, battery banks, intercoms, CCTV, security alarms and home automation.',
    'Light fittings, fans, air conditioners, water heaters, the inverter and its batteries, and the pumps themselves.',
    'Lightning protection and surge protection devices (IS 2309, IS 732 cl 5.3.5).',
    'Chasing the walls and making good after the wiring.',
    'Screws, tape, glands, lugs, ferrules, cable ties and other small items.',
    'The make, model and finish of any switch, socket or board.',
  ]
  const bands = Object.values(ELEC_BANDS).map((b) => ({ label: b.label, low: b.low, high: b.high }))
  const sources = [
    'CPWD General Specifications for Electrical Works Part I (Internal) 2013, Sections 2 and 3',
    'CPWD Delhi Analysis of Rates for Electrical Works (E&M) 2016, items 1.1 to 1.17',
    'IS 4648:1968 Guide for electrical layout in residential buildings; BIS draft first revision, ETD 20, September 2024',
    'IS 732:1989 Code of practice for electrical wiring installations',
    'IS 3043:2018 Code of practice for earthing (not read in full; earthing counts are Assumed)',
    'NIMI Electrician trade theory, wiring of a dwelling (Table 1, the area yardstick)',
  ]

  return {
    ok: true,
    result: {
      free: {
        engine: 'trade-v1', tool: 'electrical',
        chips: [`${homes} ${homes === 1 ? 'home' : 'homes'}`, `${N} ${N === 1 ? 'floor' : 'floors'}`, std ? 'Standard wiring' : 'Basic wiring'],
        factsTitle: 'Your wiring at a glance',
        facts,
        factsFoot: 'Counted from your answers. How many points, how much wire and conduit, and the boards, breakers and fittings are in the full report.',
        checks, warnings,
      },
      paid: { engine: 'trade-v1', tool: 'electrical', tiles, tables, lines, bands, assumptions, notIncluded, sources },
    },
  }
}

export const electricalModel: TradeModel<ElecInput> = {
  key: 'electrical',
  appType: 'electropro',
  label: 'ElectricalPro',
  code: 'EL',
  parse: parseElec,
  run: runElec,
  calc: buildElectricalCalc,
}
