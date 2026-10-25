/*
  ElectricalPro: the calculation sheet's own re-working of the model, from the answers alone.

  This file follows the same steps as runElec in model.ts, in the same order, but is written separately: it keeps the
  intermediate figures that the report does not print (room sizes, the Group factor, the route lengths, where each metre
  of wire comes from) and the calculation sheet (calc.ts) prints them and checks the totals against the report. It uses the
  model's own tables and rules (./rules) and the wire rules shared with the free calculator (./wire), and reads nothing
  from the report. If the model changes and this file does not, the totals disagree and the sheet is left out.
*/

import { SQFT_TO_M2, bump, ceilTo, pieces } from '../util'
import type { ElecInput } from './model'
import {
  A_MAX, A_MIN, AREA_KINDS, BAS, CARPET_SHARE, CIRCUIT_COLOURS, COIL_M, COLOUR, COLOUR_ORDER, DAR, FIXED_M2, MAINS_COLOURS, NAME, PER_M, PHASE_KIND, RULE, RUN, STD, W, WASTE, WATTS,
  addTo, dedicatedKw, designKw, floorName, rccbA, spread, waysFor, zero,
  type AreaKind, type Cnt, type Kind,
} from './rules'
import { CIRCUIT_RULES, conduitFor, earthMm2, incomerA, mainsMm2 } from './wire'

export interface Spec {
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
  main: boolean
  sub: boolean
  common: boolean
}

export interface RoomRow {
  label: string
  kind: Kind | null
  n: number
  /** area of one room, m² (null for the fixed-size entrance and balcony, and for common areas) */
  area: number | null
  /** units of RULE.unitM2 in one room */
  units: number | null
  /** all rooms of this kind on one copy of the board */
  c: Cnt
}

export interface MainsRun {
  run: string
  size: number
  three: boolean
  each: number
  n: number
}

export interface Board {
  spec: Spec
  f: number
  sqft: number
  rooms: RoomRow[]
  cnt: Cnt
  pts: number
  bathPts: number
  lightPts: number
  cBath: number
  cL: number
  cS6: number
  cS16: number
  inv: number
  wsum: number
  k0: number
  fixedM2: number
  areaOf: Partial<Record<AreaKind, number>>
  dw: number
  de: number
  dc: number
  dCoupler: number
  dSaddle: number
  tap: number
  rMedia: number
  rLight: number
  rSock: number
  rDed: number
  rGround: number
  outgoing: number
  three: boolean
  ways: number
  /** design load of the consumer this board belongs to (a flat, the common board, or the whole house) */
  pd: number
  /** design load the board's incomer and mains are sized for */
  boardPd: number
  inc: number
  rc: number
  kind: string
  mains: MainsRun
  /** connected load of one copy of the board by category, kW */
  loadKw: Record<string, number>
  modules: number
}

export const LOAD_CATS = [
  'Lights', 'Fans and exhaust fans', '6 A sockets', '6/16 A sockets', 'Air conditioners', 'Water heaters', 'Washing machine and dishwasher', 'Pumps and EV chargers',
] as const

export interface WireC { board: string; src: string; size: number; colour: string; m: number }
export interface CondC { board: string; src: string; mm: number; m: number }

export const SRC = {
  points: 'Points (lights, fans, exhaust fans, bells)',
  taps: 'Socket taps from the nearest point',
  light: 'Lighting circuits',
  sock: 'Socket circuits',
  ac: 'Air conditioner circuits',
  heater: 'Water heater, washer, dishwasher circuits',
  pump: 'Transfer pump circuit',
  ev: 'EV charger circuits',
  inverter: 'Inverter circuits',
  mains: 'Mains, rising mains and sub-mains',
  media: 'TV and data conduit',
} as const

export function derive(inp: ElecInput) {
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
  const acPerHome = Math.min(inp.acRooms, inp.bedrooms + RULE.acBeyondBedrooms)

  /* ── what each board serves ── */
  const specs: Spec[] = []
  const base = (): Spec => ({ label: '', floor: 0, mult: 1, builtM2: 0, carpetM2: 0, rooms: {}, extras: [], ac: 0, geysers: 0, washers: 0, dish: 0, pumps: 0, evs: 0, main: false, sub: false, common: false })
  const stairLights = (floors: number) => ({ name: 'Staircase', n: floors, c: { L: RULE.stairLightsPerFloor * floors } })
  const terraceExtra = () => ({ name: 'Terrace and stair room', n: 1, c: { L: N > 1 ? RULE.terraceLightsMulti : RULE.terraceLightsSingle, S6: RULE.terraceS6 } })
  const gateExtra = () => ({ name: 'Gate and porch', n: 1, c: { L: RULE.gateLights } })
  const parkingExtra = () => (parking > 0 ? [{ name: 'Parking', n: parking, c: { L: Math.max(RULE.parkingLightsMin, Math.ceil(parking * RULE.parkingLightsPerSpace)), S6: RULE.parkingS6 } }] : [])

  const beds = flats ? [] : spread(inp.bedrooms, N)
  const baths = flats ? [] : spread(inp.bathrooms, N)
  const kits = flats ? [] : spread(inp.kitchens, N)
  const balc = flats ? [] : spread(inp.balconies, N)

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

  /* ── accumulators, in the order the model fills them ── */
  const wireC: WireC[] = []
  const condC: CondC[] = []
  const acc = { bends: 0, couplers: 0, saddles: 0, jbox: 0 }
  const accBy = new Map<string, { bends: number; couplers: number; saddles: number; jbox: number }>()
  const accAdd = (src: string, k: 'bends' | 'couplers' | 'saddles' | 'jbox', v: number) => {
    acc[k] += v
    let e = accBy.get(src)
    if (!e) { e = { bends: 0, couplers: 0, saddles: 0, jbox: 0 }; accBy.set(src, e) }
    e[k] += v
  }
  const roomRows = new Map<string, { n: number; c: Cnt }>()
  const circuits = new Map<string, { n: number; rating: string; cable: string }>()
  const mcb = new Map<number, number>()
  const dbs = new Map<string, { name: string; kind: string; n: number; ways: number; incomer: string; rccb: string }>()
  const total = zero()
  const tot = { ac: 0, geysers: 0, washers: 0, dish: 0, pumps: 0, evs: 0, circuits: 0, tvM: 0, dataM: 0, inverters: 0, boards: 0, mediaBoxes: 0, meterBoards: 0, modules: 0 }
  const incomers = new Map<string, number>()
  const connected = new Map<string, number>()

  let cur = ''
  const wadd = (src: string, size: number, colour: string, m: number) => { wireC.push({ board: cur, src, size, colour, m }) }
  const cadd = (src: string, mm: number, m: number) => { condC.push({ board: cur, src, mm, m }) }
  const addRoute = (src: string, size: number, routeM: number, n: number, power = true) => {
    if (n <= 0 || routeM <= 0) return
    const m = routeM * n
    for (const col of CIRCUIT_COLOURS) wadd(src, size, col, m * RUN)
    cadd(src, conduitFor(size, false), m)
    accAdd(src, 'bends', m * PER_M.bends)
    accAdd(src, 'couplers', m * PER_M.couplers)
    accAdd(src, 'saddles', m * PER_M.saddles)
    if (power) accAdd(src, 'jbox', m * PER_M.jbox)
  }
  const addMain = (size: number, routeM: number, n: number, three: boolean) => {
    const m = routeM * n
    for (const col of three ? MAINS_COLOURS.three : MAINS_COLOURS.single) wadd(SRC.mains, size, col, m * RUN)
    wadd(SRC.mains, earthMm2(size), COLOUR.earth, m * RUN)
    cadd(SRC.mains, conduitFor(size, three), m)
    accAdd(SRC.mains, 'bends', m * PER_M.bends)
    accAdd(SRC.mains, 'couplers', m * PER_M.couplers)
    accAdd(SRC.mains, 'saddles', m * PER_M.saddles)
  }
  const circ = (label: string, n: number, rating: string, cable: string, mult: number) => {
    if (n <= 0) return
    const e = circuits.get(label)
    if (e) e.n += n * mult
    else circuits.set(label, { n: n * mult, rating, cable })
    tot.circuits += n * mult
  }
  const mcbAdd = (rating: number, n: number) => { if (n > 0) bump(mcb, rating, n) }
  const loadsAdd = (cat: string, kw: number) => bump(connected, cat, kw)

  const dedKw = (s: Spec) => dedicatedKw(s)
  const houseCarpet = specs.reduce((a, s) => a + s.carpetM2, 0)
  const houseDed = specs.reduce((a, s) => a + dedKw(s), 0)
  const housePd = flats ? 0 : designKw(houseCarpet, houseDed)
  const pdOf = (s: Spec) => (flats ? (s.common ? designKw(0, dedKw(s)) : designKw(s.carpetM2, dedKw(s))) : housePd)
  const threeOf = (s: Spec) => (s.common || !s.main ? false : inp.supply === 'three' ? true : inp.supply === 'single' ? false : pdOf(s) > RULE.threePhaseAboveKw)
  const threePhase = specs.some((s) => threeOf(s))
  const kwShown = flats ? Math.max(...specs.filter((s) => !s.common).map(pdOf)) : housePd

  const boards: Board[] = []
  for (const s of specs) {
    cur = s.label
    const mult = s.mult
    const sqft = s.builtM2 / SQFT_TO_M2
    const f = Math.max(0, Math.min(1, (sqft - RULE.groupAFromSqft) / (RULE.groupBFromSqft - RULE.groupAFromSqft)))
    const cnt = zero()
    const rooms: RoomRow[] = []
    const areaOf: Partial<Record<AreaKind, number>> = {}
    let wsum = 0
    let k0 = 0
    let fixedM2 = 0

    if (!s.common) {
      fixedM2 = (s.rooms.balcony ?? 0) * FIXED_M2.balcony + (s.rooms.entrance ?? 0) * FIXED_M2.entrance
      for (const k of AREA_KINDS) wsum += (s.rooms[k] ?? 0) * W[k]
      k0 = wsum > 0 ? Math.max(0, s.carpetM2 - fixedM2) / wsum : 0
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
        rooms.push({ label, kind, n, area: kind === 'entrance' || kind === 'balcony' ? null : area, units, c })
        addTo(cnt, c)
      }
    }
    for (const e of s.extras) {
      const c = zero()
      addTo(c, e.c)
      rooms.push({ label: e.name, kind: null, n: e.n, area: null, units: null, c })
      addTo(cnt, c)
    }
    for (const r of rooms) {
      const e = roomRows.get(r.label)
      const c = zero()
      addTo(c, r.c, mult)
      if (e) { e.n += r.n * mult; addTo(e.c, c) } else roomRows.set(r.label, { n: r.n * mult, c })
    }
    addTo(total, cnt, mult)
    tot.ac += s.ac * mult; tot.geysers += s.geysers * mult; tot.washers += s.washers * mult; tot.dish += s.dish * mult; tot.pumps += s.pumps; tot.evs += s.evs

    // connected load
    const kwL = (cnt.L * WATTS.L * mult) / 1000
    const kwF = ((cnt.F * WATTS.F + cnt.X * WATTS.X) * mult) / 1000
    const kwS6 = (cnt.S6 * WATTS.S6 * mult) / 1000
    const kwS16 = (cnt.S16 * WATTS.S16 * mult) / 1000
    const kwAc = (s.ac * WATTS.ac * mult) / 1000
    const kwGey = (s.geysers * WATTS.geyser * mult) / 1000
    const kwWd = ((s.washers * WATTS.washer + s.dish * WATTS.dish) * mult) / 1000
    const kwPe = ((s.pumps * WATTS.pump + s.evs * WATTS.ev) * mult) / 1000
    ;[kwL, kwF, kwS6, kwS16, kwAc, kwGey, kwWd, kwPe].forEach((kw, i) => loadsAdd(LOAD_CATS[i], kw))
    const loadKw: Record<string, number> = {}
    ;[kwL, kwF, kwS6, kwS16, kwAc, kwGey, kwWd, kwPe].forEach((kw, i) => { loadKw[LOAD_CATS[i]] = kw / mult })

    // points
    const pts = cnt.L + cnt.F + cnt.X + cnt.B
    const dw = DAR.A.wire + f * (DAR.B.wire - DAR.A.wire)
    const de = DAR.A.earth + f * (DAR.B.earth - DAR.A.earth)
    const dc = DAR.A.conduit + f * (DAR.B.conduit - DAR.A.conduit)
    const dCoupler = DAR.A.couplers + f * (DAR.B.couplers - DAR.A.couplers)
    const dSaddle = DAR.A.saddles + f * (DAR.B.saddles - DAR.A.saddles)
    wadd(SRC.points, RULE.pointMm2, COLOUR.live, pts * dw * mult); wadd(SRC.points, RULE.pointMm2, COLOUR.neutral, pts * dw * mult); wadd(SRC.points, RULE.pointMm2, COLOUR.earth, pts * de * mult)
    cadd(SRC.points, RULE.pointConduitMm, pts * dc * mult)
    accAdd(SRC.points, 'bends', pts * mult)
    accAdd(SRC.points, 'couplers', pts * dCoupler * mult)
    accAdd(SRC.points, 'saddles', pts * dSaddle * mult)
    accAdd(SRC.points, 'jbox', pts * mult)

    // sockets
    const tap = RULE.tapBaseM + RULE.tapRiseM * f
    const sockSize = std ? RULE.tapMm2.std : RULE.tapMm2.basic
    addRoute(SRC.taps, sockSize, tap * cnt.S6 * mult, 1)
    addRoute(SRC.taps, RULE.tapMm2.s16, tap * cnt.S16 * mult, 1)

    // TV and data
    const rMedia = RULE.mediaPerSqrtM * Math.sqrt(s.builtM2) + RULE.mediaBaseM
    tot.tvM += cnt.TV * rMedia * mult
    tot.dataM += cnt.D * rMedia * mult
    cadd(SRC.media, RULE.pointConduitMm, (cnt.TV + cnt.D) * rMedia * mult)
    if (cnt.TV + cnt.D > 0) tot.mediaBoxes += mult

    // circuits
    const bathRow = rooms.find((r) => r.label === NAME.bath)
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
    circ('Lights and fans', cL, CIRCUIT_RULES.lights.mcb, `${CIRCUIT_RULES.lights.mm2} mm², 2 + earth`, mult)
    circ('Bathroom lights and exhaust fans', cBath, CIRCUIT_RULES.lights.mcb, `${CIRCUIT_RULES.lights.mm2} mm², 2 + earth`, mult)
    circ('6 A sockets', cS6, CIRCUIT_RULES.sockets6.mcb, `${CIRCUIT_RULES.sockets6.mm2} mm², 2 + earth`, mult)
    circ('6/16 A sockets', cS16, CIRCUIT_RULES.sockets16.mcb, `${CIRCUIT_RULES.sockets16.mm2} mm², 2 + earth`, mult)
    circ('Air conditioner', s.ac, CIRCUIT_RULES.ac.mcb, `${CIRCUIT_RULES.ac.mm2} mm², 2 + earth`, mult)
    circ('Water heater', s.geysers, CIRCUIT_RULES.heater.mcb, `${CIRCUIT_RULES.heater.mm2} mm², 2 + earth`, mult)
    circ('Washing machine and dishwasher', s.washers + s.dish, CIRCUIT_RULES.heater.mcb, `${CIRCUIT_RULES.heater.mm2} mm², 2 + earth`, mult)
    circ('Transfer pump', s.pumps, `${RULE.mcb.power} A`, `${RULE.pumpMm2} mm², 2 + earth`, 1)
    circ('EV charger', s.evs, `${RULE.mcb.ev} A`, `${RULE.evMm2} mm², 2 + earth`, 1)
    circ('Inverter', inv, `${RULE.mcb.power} A`, `${RULE.inverterMm2} mm², 2 + earth`, mult)

    addRoute(SRC.light, CIRCUIT_RULES.lights.mm2, rLight, (cL + cBath) * mult, false)
    addRoute(SRC.sock, CIRCUIT_RULES.sockets6.mm2, rSock, (cS6 + cS16) * mult)
    addRoute(SRC.ac, CIRCUIT_RULES.ac.mm2, rDed, s.ac * mult)
    addRoute(SRC.heater, CIRCUIT_RULES.heater.mm2, rDed, (s.geysers + s.washers + s.dish) * mult)
    addRoute(SRC.pump, RULE.pumpMm2, RULE.pumpRouteM, s.pumps)
    addRoute(SRC.ev, RULE.evMm2, rGround, s.evs)
    addRoute(SRC.inverter, RULE.inverterMm2, RULE.inverterRouteM, inv * mult)
    tot.inverters += inv * mult

    mcbAdd(RULE.mcb.light, (cL + cBath) * mult)
    mcbAdd(std ? RULE.mcb.sockets6 : RULE.mcb.sockets6Basic, cS6 * mult)
    mcbAdd(RULE.mcb.power, (cS16 + s.geysers + s.washers + s.dish + inv) * mult + s.pumps)
    mcbAdd(RULE.mcb.ac, s.ac * mult)
    mcbAdd(RULE.mcb.ev, s.evs)

    const outgoing = cL + cBath + cS6 + cS16 + s.ac + s.geysers + s.washers + s.dish + inv + s.pumps + s.evs
    const three = threeOf(s)
    const ways = waysFor(outgoing + RULE.spareWays, three)
    const pd = pdOf(s)
    const boardPd = s.sub ? Math.max(RULE.subBoardMinKw, housePd * (s.carpetM2 / Math.max(1, houseCarpet))) : pd
    const inc = incomerA(boardPd, three)
    const rc = rccbA(inc)
    const kind = three ? PHASE_KIND.three : PHASE_KIND.single
    const key = `${s.label}|${kind}|${ways}`
    const prev = dbs.get(key)
    if (prev) prev.n += mult
    else dbs.set(key, { name: s.label, kind, n: mult, ways, incomer: `${inc} A, ${three ? '4' : '2'}-pole`, rccb: `${rc} A, ${three ? '4' : '2'}-pole, 30 mA` })
    tot.boards += mult
    tot.meterBoards += s.main ? mult : 0

    // mains
    let mains: MainsRun
    if (flats) {
      const size = mainsMm2(boardPd, three)
      const each = (s.common ? RULE.mainsCommonM : RULE.mainsFlatM) + s.floor * H
      addMain(size, each, mult, three)
      mains = { run: s.common ? 'Meter board to the common board' : `Meter room to the ${s.label.toLowerCase()} board`, size, three, each, n: mult }
    } else if (s.main) {
      const size = mainsMm2(housePd, three)
      addMain(size, RULE.mainsHouseM, 1, three)
      mains = { run: 'Meter to the main board', size, three, each: RULE.mainsHouseM, n: 1 }
    } else {
      const size = Math.max(RULE.subMainMinMm2, mainsMm2(boardPd, false))
      const each = s.floor * H + RULE.subMainExtraM
      addMain(size, each, 1, false)
      mains = { run: `Main board to the ${s.label.toLowerCase()} board`, size, three: false, each, n: 1 }
    }
    bump(incomers, `${three ? 4 : 2}|${inc}`, mult)
    const modules = cnt.L + cnt.F + cnt.X + cnt.F + cnt.S6 + cnt.S16 + s.washers + s.dish + cnt.TV + cnt.D + cnt.B + s.ac
    tot.modules += modules * mult

    boards.push({
      spec: s, f, sqft, rooms, cnt, pts, bathPts, lightPts, cBath, cL, cS6, cS16, inv, wsum, k0, fixedM2, areaOf,
      dw, de, dc, dCoupler, dSaddle, tap, rMedia, rLight, rSock, rDed, rGround, outgoing, three, ways, pd, boardPd, inc, rc, kind, mains, loadKw, modules,
    })
  }

  /* ── earthing ── */
  const electrodes = flats ? RULE.electrodesFlatsBase + Math.floor(homes / RULE.electrodesPerHomes) : threePhase ? RULE.electrodesThreePhase : RULE.electrodesSingle
  const stripM = electrodes * RULE.stripPerElectrodeM

  /* ── what the totals are ── */
  const wire = new Map<string, number>()
  for (const w of wireC) bump(wire, `${w.size}|${w.colour}`, w.m)
  const cond = new Map<number, number>()
  for (const c of condC) bump(cond, c.mm, c.m)

  const wireRows = [...wire.entries()]
    .map(([k, m]) => { const [size, colour] = k.split('|'); return { size: Number(size), colour, m } })
    .sort((x, y) => x.size - y.size || COLOUR_ORDER.indexOf(x.colour) - COLOUR_ORDER.indexOf(y.colour))
  const buyWire = (size: number, m: number) => (size <= RULE.coilMaxMm2 ? pieces(m * WASTE, COIL_M) * COIL_M : ceilTo(m * WASTE, RULE.byMetreStepM))
  const wireBuyTotal = wireRows.reduce((s, r) => s + buyWire(r.size, r.m), 0)
  const wireRunTotal = wireRows.reduce((s, r) => s + r.m, 0)
  const condRows = [...cond.entries()].sort((x, y) => x[0] - y[0])
  const condBuy = condRows.reduce((s, [, m]) => s + pieces(m * WASTE, RULE.conduitPieceM) * RULE.conduitPieceM, 0)
  const condRun = condRows.reduce((s, [, m]) => s + m, 0)
  const coaxBuy = total.TV > 0 ? ceilTo(tot.tvM * WASTE, RULE.byMetreStepM) : 0
  const catBuy = total.D > 0 ? ceilTo(tot.dataM * WASTE, RULE.byMetreStepM) : 0

  const connectedKw = [...connected.values()].reduce((s, v) => s + v, 0)
  const points = total.L + total.F + total.X + total.B
  const sockets = total.S6 + total.S16 + tot.washers + tot.dish + tot.ac
  const roomCount = [...roomRows.entries()]
    .filter(([name]) => !['Staircase', 'Lift lobby and passages', 'Terrace and stair room', 'Gate and porch', 'Parking'].includes(name))
    .reduce((s, [, r]) => s + r.n, 0)

  return {
    N, flats, std, H, homesOnFloor, homes, builtM2, parking, pumps, evCircuits, acPerHome,
    specs, boards, houseCarpet, houseDed, housePd, threePhase, kwShown,
    wireC, condC, acc, accBy, roomRows, circuits, mcb, dbs, total, tot, incomers, connected, connectedKw,
    electrodes, stripM, wire, cond, wireRows, wireBuyTotal, wireRunTotal, condRows, condBuy, condRun, coaxBuy, catBuy, buyWire,
    points, sockets, roomCount,
  }
}

export type Derived = ReturnType<typeof derive>
