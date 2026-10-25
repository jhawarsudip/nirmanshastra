/*
  PlumbingPro model: water supply, drainage, tanks, pump, septic or sewer, rainwater, counted fixtures.

  It works from a few plain answers (how many homes, bedrooms, bathrooms, where the water comes from,
  whether there is a sewer, how bad the rain gets) and the floor areas of the project.

  Every figure is one of four kinds, and the report says which:
    Code     read from a standard (IS 1172, 2065, 12183, 1742, 5329, 2470, 15778 or the NBC Part 9 drafts)
    Derived  worked out from a Code figure with arithmetic that is shown
    Assumed  no standard fixes it (for example metres of pipe per tap); a stated, editable engineering value
  The research behind each number is in the project file "research-plumbing-2026-10-25".

  The site is quantity-only: nothing here knows a price, a labour rate or a dealer.
*/

import type { BaseInput, Check, Fact, Parsed, QtyLine, Ran, Table, Tile, TradeModel } from '../types'
import { Reader, SQFT_TO_M2, bump, ceilTo, fmt, interp, pieces, rangeText } from '../util'
import { WATER_DEMAND_LPCD } from './constants'
import { tankPlan, tankSplit } from './tanks'
import { buildPlumbingCalc } from './calc'

export interface PlumbInput extends BaseInput {
  dwelling: 'house' | 'flats'
  /** flats only: homes on each floor */
  homesPerFloor: number
  /** per home (for a house, the whole house) */
  bedrooms: number
  bathrooms: number
  kitchens: number
  /** people per home; left out, it is worked out from the bedrooms */
  persons?: number
  water: 'municipal' | 'borewell' | 'tanker'
  sewer: boolean
  soil: 'good' | 'medium' | 'poor'
  rain: 'heavy' | 'veryheavy' | 'extreme'
  geyser: boolean
  washer: boolean
  gardenTap: boolean
}

export function parsePlumb(raw: unknown): Parsed<PlumbInput> {
  const r = new Reader(raw)
  const floorAreasSqft = r.floors()
  const { state, city } = r.place()
  const dwelling = r.pick('dwelling', 'Building type', ['house', 'flats'] as const, 'house')
  const homesPerFloor = dwelling === 'flats' ? r.int('homesPerFloor', 'Homes on each floor', 1, 8, 2) : 1
  const bedrooms = r.int('bedrooms', 'Bedrooms', 1, 8, 3)
  const bathrooms = r.int('bathrooms', 'Bathrooms', 1, 10, Math.min(bedrooms, 4))
  const kitchens = r.int('kitchens', 'Kitchens', 1, 3, 1)
  const persons = r.optNum('persons', 'People per home', 1, 20)
  const water = r.pick('water', 'Water source', ['municipal', 'borewell', 'tanker'] as const, 'municipal')
  const sewer = r.bool('sewer', true)
  const soil = r.pick('soil', 'Ground', ['good', 'medium', 'poor'] as const, 'medium')
  const rain = r.pick('rain', 'Rainfall', ['heavy', 'veryheavy', 'extreme'] as const, 'heavy')
  const geyser = r.bool('geyser', true)
  const washer = r.bool('washer', true)
  const gardenTap = r.bool('gardenTap', false)
  if (r.error) return { ok: false, error: r.error }
  return {
    ok: true,
    input: { floorAreasSqft, state, city, dwelling, homesPerFloor, bedrooms, bathrooms, kitchens, persons: persons === undefined ? undefined : Math.round(persons), water, sewer, soil, rain, geyser, washer, gardenTap },
  }
}

/* ───────────────────────── tables of figures ───────────────────────── */

export const H_FLOOR = 3.0 // m, floor to floor (Assumed; the project's structure uses 3.0 m)

/** Nominal supply sizes (mm) and the inside diameter of CPVC SDR 11 pipe (IS 15778 Table 2, mid-wall; 65 to 100 Derived at 0.806 x outside diameter). */
export const SUPPLY_DN = [15, 20, 25, 32, 40, 50, 65, 80, 100] as const
export const CPVC_ID_MM: Record<number, number> = { 15: 12.0, 20: 17.7, 25: 22.9, 32: 28.0, 40: 33.2, 50: 43.6, 65: 53.8, 80: 64.0, 100: 84.5 }

/** Simultaneous demand in L/min for a number of water supply fixture units, flush-tank column (NBC Part 9 Section 1 draft, Table 3). */
export const WSFU_FLOW: ReadonlyArray<readonly [number, number]> = [[5, 22.7], [10, 30.3], [20, 53.0], [50, 109.8], [100, 166.5], [200, 246.0], [300, 321.7], [500, 473.1]]

/** Water supply fixture units, private use, flush tank (NBC Part 9 Section 1 draft, Table 2). */
export const WSFU = { bathroom: 5, sink: 2, washer: 4, hoseBib: 2.5, basin: 1.5 }

/** Drainage fixture units (IS 1742:1983 Table 1). */
export const DFU = { bathroom: 6, floorTrap: 1, sink: 2, washer: 3 }

/** Septic tank, liquid volume in m3 for WC-only discharge, desludged every two years (IS 2470 Part 1:1985 Appendix A). */
export const SEPTIC_V: ReadonlyArray<readonly [number, number]> = [[5, 1.18], [10, 2.52], [15, 3.6], [20, 4.55], [50, 12.4], [100, 24.6], [300, 74.4]]

/** Soak pit application rate in litres per m2 per day, by percolation time in minutes per 25 mm (IS 2470 Part 2:1985 Table 2). */
export const SOIL = {
  good: { min: 3, rate: 118, label: 'good (water drains quickly)' },
  medium: { min: 15, rate: 52, label: 'medium' },
  poor: { min: 45, rate: 33, label: 'poor (water drains slowly)' },
} as const

/** Roof area in m2 that one down-pipe drains, by pipe and rainfall intensity (IS 1742:1983 Table 5). */
export const RAIN_INTENSITY = { heavy: 75, veryheavy: 100, extreme: 150 } as const
export const RAIN_LABEL = { heavy: 'about 75 mm in an hour', veryheavy: 'about 100 mm in an hour', extreme: 'about 150 mm in an hour' } as const
export const DOWNPIPE_AREA: Record<number, Record<number, number>> = {
  75: { 75: 27.0, 100: 20.4, 150: 13.6 },
  100: { 75: 57.0, 100: 42.7, 150: 28.5 },
}

export const PUMP_HP = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10] as const

/** Hazen-Williams roughness coefficient for plastic pipe (SP 35 eq. 1). */
export const HAZEN_C = 120

/** Limits on drainage fixture units (IS 1742:1983 Tables 3 and 4): on a floor's branch interval of one stack, on a stack in all, on a 150 mm building drain. */
export const FU_LIMITS = { interval: 90, stack: 500, drain: 700 } as const

/** Pipe is bought in whole lengths of this many metres, with this much cut-off waste (Assumed). */
export const PIECE_M = 3
export const WASTE = 1.05

/** How far off each class of figure is likely to be: multipliers on the figure shown (Assumed). */
export const BANDS = {
  supply: { low: 0.75, high: 1.35 },
  drain: { low: 0.8, high: 1.3 },
  fittings: { low: 0.7, high: 1.4 },
  tanks: { low: 0.9, high: 1.2 },
} as const

/**
 * The planning rules the model applies where no standard fixes a figure (all Assumed; the report says so).
 * They sit here, not in the middle of the sums, so that the calculation sheet reads the very numbers the model used.
 */
export const RULES = {
  /** people in a home = bedrooms + this (NBC Part 9 draft relation, the larger of two readings) */
  extraPeople: 3,
  /** supply pipe: velocity limit in m/s (NBC Part 9 Section 1 draft 4.7.6) and the smallest size for a home header or riser, mm */
  vSupply: 2.4,
  minHeaderDn: 20,
  /** the header from the riser to the wet rooms of a home: this x the side of the home, plus this many metres for each bathroom after the first */
  headerSide: 0.6,
  headerExtraBath: 2.5,
  /** the 20 mm feed into each bathroom (m each) and into the kitchen (m) */
  feedDn: 20,
  feedPerBathM: 3.0,
  feedKitchenM: 3.0,
  /** 15 mm pipe to each outlet: outlets of a bathroom (WC cistern, basin, shower, health faucet) at pointM each, a geyser inlet, a kitchen, a washer, the balcony tap, the dining basin */
  pointDn: 15,
  pointsPerBath: 4,
  pointM: 3.0,
  geyserInletM: 2.0,
  kitchenPointM: 6.0,
  washerPointM: 5.0,
  balconyPointM: 5.0,
  diningPointM: 3.0,
  /** hot water: two outlets in each bathroom with a geyser, pointM-style runs of hotPointM each */
  hotPointsPerBath: 2,
  hotPointM: 3.0,
  /** riser top: outlet stand-off at the overhead tank, the run across the terrace, the terrace tap feed, the garden tap feed (m) */
  standoffM: 1.5,
  terraceRunM: 4.0,
  terraceTapM: 5.0,
  gardenTapM: 10.0,
  /** pump: peak hour demand = this x the day's demand spread over this many hours; the tank is refilled in this many minutes */
  peakFactor: 1.5,
  peakHours: 12,
  fillMinutes: 30,
  /** pump lift above the terrace: tank stand, water depth in the tank, depth of the water below ground (m) */
  tankStandM: 1.0,
  waterDepthM: 1.0,
  belowGroundM: 2.0,
  /** delivery pipe: velocity limit (m/s), smallest size (mm), extra length beyond the lift (m), allowance for fittings, residual head at the tank (m) */
  vDelivery: 2.0,
  minDeliveryDn: 25,
  deliveryExtraM: 10,
  fittingsFactor: 1.3,
  residualHeadM: 3.0,
  /** below the first row of the flow table, the flow falls in proportion to the units, but not below this share of the first row */
  smallFlowShare: 0.5,
  /** pump power = flow (L/min) x head (m) / (hpFactor x efficiency); 1 metric HP = 4,500 kgf m per minute */
  hpFactor: 4500,
  pumpEff: 0.5,
  /** two or more homes get this many pumps (one working, one standby); fewer get one */
  homesForStandby: 2,
  pumpsWithStandby: 2,
  /** suction pipe per pump (m); water main to the underground tank (mm, m); tanker filling pipe (mm, m) */
  suctionM: 3.0,
  mainDn: 25,
  mainM: 12,
  tankerDn: 50,
  tankerM: 8,
  /** drainage: WCs one soil stack takes on a floor; vent pipes from this many floors; stack foot below the slab and top above the roof (m) */
  wcPerStack: 2,
  ventFromFloors: 6,
  stackFootM: 1.0,
  stackAboveRoofM: 1.5,
  /** uPVC SWR sizes (mm): soil stack and WC branch; waste stack and shower branch; vent, kitchen and overflow pipes; basin waste; the larger building drain */
  soilDn: 110,
  wasteDn: 75,
  smallDn: 50,
  basinDn: 40,
  bigDrainDn: 160,
  /** drain branches (m each) */
  wcBranchM: 1.5,
  bathBranchM: 2.5,
  basinWasteM: 1.2,
  kitchenWasteM: 3.0,
  washerWasteM: 2.0,
  balconyWasteM: 2.5,
  tankOverflowM: 6.0,
  /** building drain: 110 mm up to this many fixture units, then 160 mm; run = stack foot to chamber (m) per stack plus the run to the plot edge (m); a chamber every this many metres */
  drain110MaxFu: 180,
  stackToChamberM: 4.0,
  plotEdgeM: 8.0,
  chamberEveryM: 30,
  /** the pipe from the last chamber to the soak pit or the public sewer (m) */
  connectionM: 6.0,
  /** waste water leaving the home per person per day (L) */
  effluentLpcd: 108,
  /** septic tank: the table is read for between these numbers of users; a day's detention of the other waste water per person (m3); least volume (m3); one tank takes this many users */
  septicMinUsers: 5,
  septicMaxUsers: 300,
  septicOtherM3: 0.063,
  septicMinM3: 1.0,
  septicUsersEach: 100,
  /** liquid depth (m) by volume of one tank: up to septicV1 m3, up to septicV2 m3, above */
  septicV1: 2.5,
  septicD1: 1.0,
  septicV2: 6,
  septicD2: 1.3,
  septicD3: 1.5,
  /** plan: length = this x width at the start; width is at least septicMinB (m); length at least this x width; sizes rounded up to dimStep (m); free-board (m); two chambers above this volume (m3) */
  septicLtoB: 3,
  septicMinB: 0.75,
  septicMinLtoB: 2,
  dimStep: 0.05,
  freeboardM: 0.3,
  twoChamberAboveM3: 2.0,
  /** digging: working space round the tank (m, in length and in width), extra depth below the liquid level (m) */
  tankWorkM: 1.0,
  tankDigExtraM: 0.6,
  /** soak pit: diameter (m), deepest wall counted (m), shallowest pit (m), depth below the inlet pipe (m), working space round the lining (m) */
  pitDia: 1.5,
  pitMaxDepthM: 3.0,
  pitMinDepthM: 1.0,
  pitBelowPipeM: 0.15,
  pitWorkM: 0.3,
  /** rain: fewest down-pipes; the most 75 mm pipes before 100 mm is used; length of a down-pipe beyond the building height (m) */
  minDownpipes: 2,
  maxDownpipes75: 4,
  downpipeExtraM: 0.5,
  /** fittings: elbows at the pump and tanks; ball valves and unions at each tank; isolation valves and unions at each pump; clamp spacing on supply pipe and on drain pipe (m) */
  pumpTankElbows: 8,
  valvesPerTank: 2,
  unionsPerTank: 2,
  isolationPerPump: 2,
  unionsPerPump: 2,
  clampEveryM: 1.0,
  dclampEveryM: 1.5,
} as const

export const floorName = (i: number) => ['Ground floor', 'First floor', 'Second floor', 'Third floor', 'Fourth floor', 'Fifth floor', 'Sixth floor', 'Seventh floor', 'Eighth floor', 'Ninth floor'][i] ?? `Floor ${i}`

/* ───────────────────────── small calculations ───────────────────────── */

export const capLpm = (dn: number, v: number) => (Math.PI / 4) * (CPVC_ID_MM[dn] / 1000) ** 2 * v * 60000

/** Smallest supply size whose bore carries the flow at the velocity limit (2.4 m/s NBC draft 4.7.6). */
export function sizeFor(flowLpm: number, vmax: number, min = 15): number {
  for (const dn of SUPPLY_DN) if (dn >= min && capLpm(dn, vmax) >= flowLpm) return dn
  return 100
}

export const flowFor = (wsfu: number) => (wsfu < WSFU_FLOW[0][0] ? WSFU_FLOW[0][1] * Math.max(RULES.smallFlowShare, wsfu / WSFU_FLOW[0][0]) : interp(WSFU_FLOW, wsfu, true))

/** Hazen-Williams head loss in metres of water (SP 35 eq. 1, C = 120 for plastic pipe). */
export function headLoss(lengthM: number, qLps: number, dn: number, c = HAZEN_C): number {
  const q = qLps / 1000
  const d = CPVC_ID_MM[dn] / 1000
  return (10.67 * lengthM * q ** 1.852) / (c ** 1.852 * d ** 4.87)
}

export function spread(total: number, n: number): number[] {
  const base = Math.floor(total / n)
  const rem = total % n
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0))
}

/* ───────────────────────── the model ───────────────────────── */

/**
 * The in-between figures of one run, handed back when a trace object is passed to runPlumb.
 * The calculation sheet checks its own working against these. They are not part of the result, never stored and never sent.
 */
export interface PlumbTrace {
  N: number
  flats: boolean
  homesOnFloor: number
  homes: number
  perHome: number
  people: number
  lpcd: number
  demandL: number
  ugtL: number
  ohtL: number
  ugt: { each: number; count: number; kind: string } | null
  oht: { each: number; count: number; kind: string }
  tankCount: number
  footM2: number[]
  bath: number[]
  kit: number[]
  wsfuHome: number[]
  wsfuCarried: number[]
  riserDn: number[]
  headerDn: number[]
  wc: number
  basins: number
  showers: number
  health: number
  sinks: number
  washers: number
  balconyTaps: number
  geysers: number
  floorTraps: number
  terraceTaps: number
  gardenTaps: number
  coldOutlets: number
  hotOutlets: number
  runs: { use: 'cold' | 'hot'; dn: number; m: number }[]
  qLpm: number
  staticM: number
  deliveryDn: number
  deliveryLen: number
  frictionM: number
  headM: number
  hpRaw: number
  hp: number
  pumps: number
  soilStacks: number
  wasteStacks: number
  stackH: number
  ventStacks: number
  fuTotal: number
  drainDn: number
  drainRun: number
  chambers: number
  effluentL: number
  septic: { vM3: number; lM: number; bM: number; dM: number; chambers: number; count: number; excavM3: number } | null
  pit: { count: number; dia: number; depthM: number; areaM2: number; excavM3: number } | null
  roofM2: number
  iMM: number
  dpDn: number
  dpN: number
  dpLen: number
  dpBuy: number
  fit: [string, number][]
  exposedM: number
  clamps: number
  dfit: [string, number][]
  dclamps: number
  stackJunctions: number
  supplyLines: [number, number][]
  supplyM: number
  supplyBuyM: number
  drainLines: [number, number][]
  drainM: number
  drainBuyM: number
  lines: { key: string; qty: number }[]
}

export function runPlumb(inp: PlumbInput, trace?: PlumbTrace): Ran {
  const N = inp.floorAreasSqft.length
  const flats = inp.dwelling === 'flats'
  const homesOnFloor = flats ? inp.homesPerFloor : 1
  const homes = flats ? inp.homesPerFloor * N : 1

  // what each floor holds
  const bath = flats ? Array(N).fill(inp.homesPerFloor * inp.bathrooms) : spread(inp.bathrooms, N)
  const kit = flats ? Array(N).fill(inp.homesPerFloor * inp.kitchens) : spread(inp.kitchens, N)
  const bathPerHome = (i: number) => (flats ? inp.bathrooms : bath[i])
  const kitPerHome = (i: number) => (flats ? inp.kitchens : kit[i])
  const washerOn = (i: number) => inp.washer && (flats || i === 0)
  const diningBasin = (i: number) => inp.bedrooms >= 2 && (flats || i === 0)
  const footM2 = inp.floorAreasSqft.map((a) => a * SQFT_TO_M2)

  // people and daily water
  const perHome = inp.persons ?? inp.bedrooms + RULES.extraPeople
  const people = perHome * homes
  const lpcd = inp.water === 'borewell' ? WATER_DEMAND_LPCD.borewell : WATER_DEMAND_LPCD.municipal
  const demandL = people * lpcd

  // ── tanks
  const { ugtL, ohtL } = tankSplit(inp.water, demandL)
  const ugt = ugtL > 0 ? tankPlan(ugtL, true) : null
  const oht = tankPlan(ohtL, false)
  const tankCount = (ugt ? ugt.count : 0) + oht.count

  // ── fixtures counted
  let wc = 0, basins = 0, showers = 0, health = 0, sinks = 0, washers = 0, balconyTaps = 0, geysers = 0, floorTraps = 0
  const wsfuHome: number[] = []
  for (let i = 0; i < N; i++) {
    const b = bathPerHome(i), k = kitPerHome(i)
    const w = washerOn(i) ? 1 : 0
    const d = diningBasin(i) ? 1 : 0
    wsfuHome.push(b * WSFU.bathroom + k * WSFU.sink + w * WSFU.washer + WSFU.hoseBib + d * WSFU.basin)
    wc += b * homesOnFloor; showers += b * homesOnFloor; health += b * homesOnFloor
    basins += (b + d) * homesOnFloor
    sinks += k * homesOnFloor; washers += w * homesOnFloor; balconyTaps += homesOnFloor
    if (inp.geyser) geysers += b * homesOnFloor
    floorTraps += (b + k + 1 + w) * homesOnFloor // bathroom, kitchen, balcony (and washer standpipe trap)
  }
  const terraceTaps = 1
  const gardenTaps = inp.gardenTap ? 1 : 0

  // ── supply pipe runs. Each run is metres of a size, tagged cold or hot.
  type Run = { use: 'cold' | 'hot'; dn: number; m: number }
  const runs: Run[] = []
  const add = (use: Run['use'], dn: number, m: number) => { if (m > 0) runs.push({ use, dn, m }) }
  let coldOutlets = 0, hotOutlets = 0
  const floorRows: (string | number)[][] = []
  // Water comes down from the overhead tank, so the riser at a floor carries that floor and every floor below it.
  // The terrace tap hangs off the top of the riser; the garden tap is at the bottom.
  const wsfuCarried: number[] = new Array(N).fill(0)
  let acc = 0
  for (let i = 0; i < N; i++) {
    acc += wsfuHome[i] * homesOnFloor + (i === 0 ? WSFU.hoseBib * gardenTaps : 0)
    wsfuCarried[i] = acc + (i === N - 1 ? WSFU.hoseBib * terraceTaps : 0)
  }
  const riserDn: number[] = []
  for (let i = 0; i < N; i++) riserDn.push(sizeFor(flowFor(wsfuCarried[i]), RULES.vSupply, RULES.minHeaderDn))

  const headerDn: number[] = []
  for (let i = 0; i < N; i++) {
    const b = bathPerHome(i), k = kitPerHome(i)
    const s = Math.sqrt(footM2[i] / homesOnFloor)
    const hdn = sizeFor(flowFor(wsfuHome[i]), RULES.vSupply, RULES.minHeaderDn)
    headerDn.push(hdn)
    for (let h = 0; h < homesOnFloor; h++) {
      add('cold', hdn, RULES.headerSide * s + RULES.headerExtraBath * Math.max(0, b - 1)) // from the riser to the wet rooms
      add('cold', RULES.feedDn, b * RULES.feedPerBathM + (k > 0 ? RULES.feedKitchenM : 0)) // feed into each bathroom and the kitchen
      // outlets, cold side: WC cistern, basin, shower, health faucet, each 3 m; geyser inlet 2 m
      const coldPts = b * RULES.pointsPerBath + k + (washerOn(i) ? 1 : 0) + 1 + (diningBasin(i) ? 1 : 0)
      add('cold', RULES.pointDn, b * RULES.pointsPerBath * RULES.pointM + (inp.geyser ? b * RULES.geyserInletM : 0) + k * RULES.kitchenPointM + (washerOn(i) ? RULES.washerPointM : 0) + RULES.balconyPointM + (diningBasin(i) ? RULES.diningPointM : 0))
      coldOutlets += coldPts
      if (inp.geyser) { add('hot', RULES.pointDn, b * RULES.hotPointsPerBath * RULES.hotPointM); hotOutlets += b * RULES.hotPointsPerBath }
    }
    floorRows.push([floorName(i), bath[i], kit[i], fmt(wsfuCarried[i], 1), `${riserDn[i]} mm`])
  }
  // risers: one segment of floor height per floor, sized for what is below the segment's top
  for (let i = 0; i < N; i++) add('cold', riserDn[i], H_FLOOR)
  add('cold', riserDn[N - 1], RULES.standoffM + RULES.terraceRunM) // outlet stand-off at the overhead tank and the run across the terrace
  add('cold', RULES.feedDn, RULES.terraceTapM * terraceTaps) // terrace tap
  if (gardenTaps) add('cold', RULES.feedDn, RULES.gardenTapM)

  // ── pump and delivery to the overhead tank
  const qLpm = Math.max((RULES.peakFactor * demandL) / (RULES.peakHours * 60), (oht.each * oht.count) / RULES.fillMinutes)
  const staticM = N * H_FLOOR + RULES.tankStandM + RULES.waterDepthM + RULES.belowGroundM // up to the terrace, tank stand, water depth, water level below ground
  const deliveryDn = sizeFor(qLpm, RULES.vDelivery, RULES.minDeliveryDn)
  const deliveryLen = staticM + RULES.deliveryExtraM
  const frictionM = headLoss(deliveryLen * RULES.fittingsFactor, qLpm / 60, deliveryDn)
  const headM = staticM + frictionM + RULES.residualHeadM
  const hpRaw = (qLpm * headM) / (RULES.hpFactor * RULES.pumpEff)
  const hp = PUMP_HP.find((h) => hpRaw <= h) ?? 10
  const pumps = inp.water === 'borewell' ? 0 : homes >= RULES.homesForStandby ? RULES.pumpsWithStandby : 1
  add('cold', deliveryDn, deliveryLen) // delivery to the overhead tank (the borewell's own line when there is no underground tank)
  if (inp.water !== 'borewell') add('cold', Math.min(100, SUPPLY_DN[Math.min(SUPPLY_DN.length - 1, SUPPLY_DN.indexOf(deliveryDn as typeof SUPPLY_DN[number]) + 1)]), RULES.suctionM * pumps) // suction, one size larger
  if (inp.water === 'municipal') add('cold', RULES.mainDn, RULES.mainM) // from the water main to the underground tank
  if (inp.water === 'tanker') add('cold', RULES.tankerDn, RULES.tankerM) // filling pipe from the road

  // ── drainage
  const soilStacks = Math.max(1, ...bath.map((b) => Math.ceil(b / RULES.wcPerStack)))
  const wasteStacks = Math.max(1, ...kit)
  const stackH = N * H_FLOOR + RULES.stackFootM + RULES.stackAboveRoofM // foot below the slab, 1.5 m above the roof (IS 5329 cl 6.8.4)
  const ventStacks = N >= RULES.ventFromFloors ? soilStacks : 0
  const dRuns = new Map<number, number>() // SWR size -> metres
  const dAdd = (dn: number, m: number) => bump(dRuns, dn, m)
  dAdd(RULES.soilDn, soilStacks * stackH)
  dAdd(RULES.wasteDn, wasteStacks * stackH)
  if (ventStacks) dAdd(RULES.smallDn, ventStacks * (N * H_FLOOR + RULES.stackAboveRoofM))
  // branches
  const bathrooms = wc
  const kitchensN = sinks
  dAdd(RULES.soilDn, bathrooms * RULES.wcBranchM) // WC branch
  dAdd(RULES.wasteDn, bathrooms * RULES.bathBranchM) // shower and floor trap branch
  dAdd(RULES.basinDn, basins * RULES.basinWasteM) // basin waste
  dAdd(RULES.smallDn, kitchensN * RULES.kitchenWasteM + washers * RULES.washerWasteM + balconyTaps * RULES.balconyWasteM)
  // overflow and scour at each tank
  dAdd(RULES.smallDn, tankCount * RULES.tankOverflowM)

  // loads and the building drain
  const fuTotal = bathrooms * (DFU.bathroom + DFU.floorTrap) + kitchensN * (DFU.sink + DFU.floorTrap) + washers * DFU.washer + balconyTaps * DFU.floorTrap
  const drainDn = fuTotal <= RULES.drain110MaxFu ? RULES.soilDn : RULES.bigDrainDn
  const drainRun = (soilStacks + wasteStacks) * RULES.stackToChamberM + RULES.plotEdgeM
  dAdd(drainDn, drainRun)
  const chambers = soilStacks + wasteStacks + 1 + Math.floor(drainRun / RULES.chamberEveryM)

  // ── disposal
  const users = people
  const effluentL = users * RULES.effluentLpcd
  let septic: null | { vM3: number; lM: number; bM: number; dM: number; chambers: number; count: number; excavM3: number } = null
  let pit: null | { count: number; dia: number; depthM: number; areaM2: number; excavM3: number } = null
  if (!inp.sewer) {
    const vTable = interp(SEPTIC_V, Math.max(RULES.septicMinUsers, Math.min(RULES.septicMaxUsers, users)), false)
    const vComb = Math.max(RULES.septicMinM3, vTable + users * RULES.septicOtherM3)
    const count = users > RULES.septicUsersEach ? Math.ceil(users / RULES.septicUsersEach) : 1
    const v = vComb / count
    const d = v <= RULES.septicV1 ? RULES.septicD1 : v <= RULES.septicV2 ? RULES.septicD2 : RULES.septicD3
    const b = ceilTo(Math.max(RULES.septicMinB, Math.sqrt(v / (d * RULES.septicLtoB))), RULES.dimStep)
    const l = Math.max(ceilTo(v / (d * b), RULES.dimStep), RULES.septicMinLtoB * b)
    septic = { vM3: v * count, lM: l, bM: b, dM: d + RULES.freeboardM, chambers: v > RULES.twoChamberAboveM3 ? 2 : 1, count, excavM3: count * (l + RULES.tankWorkM) * (b + RULES.tankWorkM) * (d + RULES.tankDigExtraM) }
    const area = effluentL / SOIL[inp.soil].rate
    const dia = RULES.pitDia
    const nPits = Math.max(1, Math.ceil(area / (Math.PI * dia * RULES.pitMaxDepthM)))
    const eff = area / (nPits * Math.PI * dia)
    const depth = Math.max(RULES.pitMinDepthM, eff) + RULES.pitBelowPipeM
    pit = { count: nPits, dia, depthM: depth, areaM2: area, excavM3: nPits * Math.PI * (dia / 2 + RULES.pitWorkM) ** 2 * depth }
    dAdd(RULES.soilDn, RULES.connectionM) // tank to soak pit
  } else {
    dAdd(RULES.soilDn, RULES.connectionM) // connection to the public sewer
  }

  // ── rainwater
  const roofM2 = Math.max(...footM2)
  const iMM = RAIN_INTENSITY[inp.rain]
  let dpDn = 75
  let dpN = Math.max(RULES.minDownpipes, Math.ceil(roofM2 / DOWNPIPE_AREA[75][iMM]))
  if (dpN > RULES.maxDownpipes75) { dpDn = 100; dpN = Math.max(RULES.minDownpipes, Math.ceil(roofM2 / DOWNPIPE_AREA[100][iMM])) }
  const dpLen = dpN * (N * H_FLOOR + RULES.downpipeExtraM)
  const dpBuy = dpDn === 100 ? 110 : 75 // uPVC SWR is sold as 75 and 110 mm; 110 mm drains at least what 100 mm does
  dAdd(dpBuy, dpLen)

  // ── fittings and valves (counts per outlet and per piece of equipment; the per-point counts are Assumed)
  const fit = new Map<string, number>()
  const f = (name: string, n: number) => bump(fit, name, n)
  const outlets = coldOutlets + hotOutlets
  f('Elbow 90°, 15 mm', outlets)
  f('Reducing tee, 20 × 15 mm', outlets)
  f('Female threaded adaptor or brass elbow, 15 mm', outlets)
  f('Ball valve, 20 mm (one at each bathroom)', bathrooms)
  if (geysers) f('Union, 15 mm (geyser connection)', geysers)
  for (let i = 0; i < N; i++) {
    for (let h = 0; h < homesOnFloor; h++) {
      f(`Ball valve, ${headerDn[i]} mm (home entry)`, 1)
      f(`Union, ${headerDn[i]} mm (home entry)`, 1)
      f(riserDn[i] === headerDn[i] ? `Tee, ${riserDn[i]} mm (riser take-off)` : `Reducing tee, ${riserDn[i]} × ${headerDn[i]} mm (riser take-off)`, 1)
    }
  }
  for (let i = 1; i < N; i++) if (riserDn[i] !== riserDn[i - 1]) f(`Reducer, ${riserDn[i - 1]} × ${riserDn[i]} mm (riser)`, 1)
  f(`Elbow 90°, ${deliveryDn} mm (pump and tank connections)`, RULES.pumpTankElbows)
  f('Float valve (one for each tank)', tankCount)
  f(`Ball valve, ${deliveryDn} mm (tank inlet and outlet)`, tankCount * RULES.valvesPerTank)
  f(`Union, ${deliveryDn} mm (tank connections)`, tankCount * RULES.unionsPerTank)
  if (pumps > 0) {
    f(`Foot valve, ${deliveryDn} mm`, pumps)
    f(`Non-return valve, ${deliveryDn} mm`, pumps)
    f(`Gate or ball valve, ${deliveryDn} mm (pump isolation)`, pumps * RULES.isolationPerPump)
    f(`Union, ${deliveryDn} mm (pump)`, pumps * RULES.unionsPerPump)
  }
  // clamps on exposed pipe only (risers, terrace, delivery); concealed branches in walls are not clamped
  const exposedM = N * H_FLOOR + (RULES.standoffM + RULES.terraceRunM) + deliveryLen
  const clamps = Math.ceil(exposedM / RULES.clampEveryM)

  // drainage fittings
  const dfit = new Map<string, number>()
  const df = (name: string, n: number) => bump(dfit, name, n)
  df('Long-radius bend, 110 mm (WC branch)', bathrooms)
  df('Branch junction, 110 × 110 mm (WC to stack)', bathrooms)
  df('Branch junction, 110 × 75 mm (bathroom waste to stack)', bathrooms)
  df('Bend, 75 mm (floor-trap branch)', bathrooms)
  df('Floor trap, 50 mm seal, 75 mm outlet', floorTraps)
  df('P-trap or bottle trap, 40 mm (basin)', basins)
  df('Sink trap, 40 mm', sinks)
  df('Branch junction, 75 × 50 mm (kitchen to waste stack)', kitchensN + washers)
  df('Large-radius bend, 110 mm (stack foot)', soilStacks)
  df('Large-radius bend, 75 mm (waste stack foot)', wasteStacks)
  df('Cowl, 110 mm', soilStacks)
  df('Cowl, 75 mm', wasteStacks)
  if (ventStacks) df('Vent connection and cowl, 50 mm', ventStacks)
  df(`Terrace outlet with grating, ${dpBuy} mm`, dpN)
  df(`Bend, ${dpBuy} mm (down-pipe)`, dpN * 2)
  df(`Shoe, ${dpBuy} mm (down-pipe foot)`, dpN)
  df('Inspection chamber with cover (0.8 × 0.8 m, up to 1 m deep)', chambers)
  const stackJunctions = bathrooms * 2 + kitchensN + washers
  const dclamps = Math.ceil((soilStacks + wasteStacks + ventStacks) * stackH / RULES.dclampEveryM + dpLen / RULES.dclampEveryM)

  // ── purchase lengths: add 5 per cent, round up to whole pieces
  const supply = new Map<number, number>()
  for (const r of runs) bump(supply, r.dn, r.m)
  const supplyLines = [...supply.entries()].sort((a, b) => a[0] - b[0])
  const supplyM = supplyLines.reduce((s, [, m]) => s + m, 0)
  const supplyBuyM = supplyLines.reduce((s, [, m]) => s + pieces(m * WASTE, PIECE_M) * PIECE_M, 0)
  const drainLines = [...dRuns.entries()].sort((a, b) => a[0] - b[0])
  const drainM = drainLines.reduce((s, [, m]) => s + m, 0)
  const drainBuyM = drainLines.reduce((s, [, m]) => s + pieces(m * WASTE, PIECE_M) * PIECE_M, 0)

  // ───────── free part ─────────
  const sizeNote = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
  const fuStackPerInterval = Math.max(...bath.map((b) => Math.ceil(b / soilStacks))) * (DFU.bathroom + DFU.floorTrap)
  const stackTotalFu = (bathrooms * (DFU.bathroom + DFU.floorTrap)) / soilStacks
  const checks: Check[] = [
    { id: 'demand', clause: 'IS 1172:1993 cl 4.1', description: 'Water use per person', status: 'pass', detail: `${lpcd} litres per person per day is used (${inp.water === 'borewell' ? 'own source, borewell' : 'piped supply, full flushing'}). ${people} people give ${fmt(demandL)} litres a day.` },
    { id: 'storage', clause: 'NBC Part 9 Sec 1 cl 4.4.10', description: 'Storage', status: 'pass', detail: inp.water === 'borewell' ? 'A borewell fills the overhead tank on demand, so one overhead tank holds half a day’s water.' : inp.water === 'tanker' ? 'Tanker water arrives in lots, so the underground tank holds a day and a half and the overhead tank a third of a day.' : 'With an underground and an overhead tank, the underground holds two-thirds of a day’s water and the overhead one-third.' },
    { id: 'fixtures', clause: 'NBC Part 9 Sec 2 cl 4.2', description: 'Fixtures in every home', status: 'pass', detail: 'Each home has at least one WC, one kitchen sink and one bathing place.' },
    { id: 'stack', clause: 'IS 5329:1983 cl 6.1.1', description: 'Soil stack', status: N >= 6 ? 'advisory' : 'pass', detail: N >= 6 ? `A single 100 mm stack without vents is allowed up to five storeys. At ${N} floors, a vent stack runs beside each soil stack, so ${soilStacks} vent ${soilStacks === 1 ? 'pipe is' : 'pipes are'} counted.` : `A single 100 mm stack without a vent pipe is allowed up to five storeys and two WCs on a floor. You have ${N} ${N === 1 ? 'floor' : 'floors'}, so ${soilStacks} stack${soilStacks === 1 ? '' : 's'} carry the WCs.` },
    { id: 'drainload', clause: 'IS 1742:1983 Tables 3 and 4', description: 'Drain loads', status: fuStackPerInterval <= FU_LIMITS.interval && stackTotalFu <= FU_LIMITS.stack && fuTotal <= FU_LIMITS.drain ? 'pass' : 'fail', detail: `The building drain carries ${fmt(fuTotal)} fixture units, so a ${drainDn} mm drain at 1 in 100 is enough (limit 180 for 110 mm). One stack takes up to 90 units in a floor and 500 in all; yours takes ${fmt(fuStackPerInterval)} and ${fmt(stackTotalFu)}.` },
    { id: 'rain', clause: 'IS 1742:1983 cl 4.10.3.8', description: 'Rain water', status: 'advisory', detail: `For rain of ${RAIN_LABEL[inp.rain]}, a ${fmt(roofM2)} m² roof needs ${dpN} down-pipes of ${dpBuy} mm. IS 1742 gives no rainfall for each town, so the rain figure is the one you chose.` },
  ]
  if (!inp.sewer) {
    checks.push({ id: 'septic', clause: 'IS 2470 (Part 1) 1985 cl 3.4', description: 'Septic tank', status: users > 20 ? 'advisory' : 'pass', detail: `With no sewer, a septic tank for ${users} people holds about ${fmt(septic!.vM3, 1)} m³, with a soak pit after it. ${users > 20 ? 'For this many people, check with your local body first: a sewer or a small treatment plant is usually the better answer.' : ''}`.trim() })
  }
  const warnings: string[] = []
  if (!inp.sewer && inp.soil === 'poor') warnings.push('Slow-draining ground is not suitable for a soak pit (IS 2470 Part 2 Table 2: slower than 30 minutes per 25 mm). The pit is sized from the slowest rate in the table so the quantity is a floor, not a promise; ask your engineer for a percolation test or choose a sewer connection.')
  if (!inp.sewer && users > 30) warnings.push('A septic tank with a soak pit is rarely practical for this many people. Ask your local body whether a sewer connection or a treatment plant is available.')
  if (inp.water === 'borewell') warnings.push('The borewell pump depends on how deep the water is and is not sized here. Ask your borewell contractor.')
  if (N >= 7) warnings.push('Above six floors, a pressure-boosting or zoned supply may be needed (NBC Part 9). This report counts one riser and one overhead tank.')

  const facts: Fact[] = [
    { k: 'Homes', v: String(homes), note: flats ? `${inp.homesPerFloor} on each floor` : 'One house' },
    { k: 'People counted', v: String(people), note: inp.persons ? 'As you told us' : `${perHome} in each home (bedrooms plus three)` },
    { k: 'Water used a day', v: `${fmt(demandL)} L`, note: `${lpcd} litres per person (IS 1172)` },
    { k: 'Water supply', v: inp.water === 'municipal' ? 'Piped supply' : inp.water === 'borewell' ? 'Borewell' : 'Tanker', note: inp.water === 'borewell' ? 'Overhead tank only' : 'Underground and overhead tanks' },
    { k: 'Bathrooms and WCs', v: String(bathrooms), note: `${sizeNote(kitchensN, 'kitchen', 'kitchens')} in all` },
    { k: 'Soil stacks', v: String(soilStacks), note: N >= 6 ? 'With vent pipes' : 'No vent pipe needed' },
    { k: 'Waste', v: inp.sewer ? 'To the sewer' : 'Septic tank and soak pit' },
    { k: 'Rain water', v: `${dpN} down-pipes`, note: `${dpBuy} mm each` },
  ]

  // ───────── paid part ─────────
  const tiles: Tile[] = [
    { k: 'Water supply pipe', v: fmt(supplyBuyM), unit: 'm', range: `${rangeText(supplyBuyM, BANDS.supply.low, BANDS.supply.high)} m` },
    { k: 'Drain and rain pipe', v: fmt(drainBuyM), unit: 'm', range: `${rangeText(drainBuyM, BANDS.drain.low, BANDS.drain.high)} m` },
    { k: 'Tanks', v: fmt((ugt ? ugt.each * ugt.count : 0) + oht.each * oht.count), unit: 'litres', range: `${rangeText((ugt ? ugt.each * ugt.count : 0) + oht.each * oht.count, BANDS.tanks.low, BANDS.tanks.high)} L` },
    pumps > 0
      ? { k: 'Transfer pump', v: `${hp}`, unit: pumps > 1 ? 'HP × 2' : 'HP' }
      : { k: 'Fixtures and taps', v: fmt(wc + basins + showers + health + sinks + washers + balconyTaps + terraceTaps + gardenTaps), unit: 'counted' },
  ]

  const tanksRows: (string | number)[][] = []
  if (ugt) tanksRows.push(['Underground tank', fmt(ugt.each), ugt.count, ugt.kind, `${fmt(Math.round(ugtL))} L needed`])
  tanksRows.push(['Overhead tank', fmt(oht.each), oht.count, oht.kind, `${fmt(Math.round(ohtL))} L needed`])
  if (pumps > 0) tanksRows.push(['Transfer pump', `${hp} HP`, pumps, pumps > 1 ? 'one working, one standby (IS 12183 cl 9.1)' : 'a standby is advised (IS 12183 cl 9.1)', `${fmt(qLpm, 0)} L/min against ${fmt(headM, 1)} m`])

  const matLabel = (dn: number) => `${dn} mm`
  const supplyRows = supplyLines.map(([dn, m]) => {
    const withWaste = m * WASTE
    const pc = pieces(withWaste, PIECE_M)
    return [matLabel(dn), fmt(m, 1), fmt(withWaste, 1), pc, `${pc * PIECE_M} m`]
  })
  const drainRows = drainLines.map(([dn, m]) => {
    const withWaste = m * WASTE
    const pc = pieces(withWaste, PIECE_M)
    return [matLabel(dn), fmt(m, 1), fmt(withWaste, 1), pc, `${pc * PIECE_M} m`]
  })
  const sumPieces = (rows: (string | number)[][]) => rows.reduce((s, r) => s + Number(r[3]), 0)

  const fixtureRows: (string | number)[][] = [
    ['Water closet with flush tank', wc],
    ['Wash basin with tap', basins],
    ['Shower with mixer', showers],
    ['Health faucet', health],
    ['Kitchen sink with tap', sinks],
    ['Washing machine point', washers],
    ['Balcony or utility tap', balconyTaps],
    ['Terrace tap', terraceTaps],
    ['Garden tap', gardenTaps],
    ['Geyser point', geysers],
    ['Floor traps', floorTraps],
  ].filter((r) => Number(r[1]) > 0) as (string | number)[][]

  const fitRows = [...fit.entries()].map(([k, n]) => [k, n])
  const dfitRows = [...dfit.entries()].map(([k, n]) => [k, n])

  const tables: Table[] = [
    { id: 'tanks', title: 'Tanks and pump', sub: 'Sized to the NBC storage split for your water source. Round-up sizes are the ones sold in India.', head: ['Item', 'Size', 'Number', 'Kind', 'Basis'], num: [1, 2], rows: tanksRows, note: `Pump head is the climb to the terrace plus pipe friction (Hazen-Williams) plus 3 m of residual; power = flow × head ÷ (4,500 × 0.5), rounded up to a pump size sold. Delivery pipe: ${deliveryDn} mm.` },
    { id: 'supply', title: 'Water supply pipe (CPVC, IS 15778)', sub: 'Runs worked out floor by floor from your plan. The last column is what to buy, in whole 3 m lengths.', head: ['Size', 'Run (m)', 'With 5% cutting waste (m)', '3 m lengths', 'To buy'], num: [1, 2, 3, 4], rows: supplyRows, foot: ['All sizes', fmt(supplyM, 1), fmt(supplyM * WASTE, 1), sumPieces(supplyRows), `${sumPieces(supplyRows) * PIECE_M} m`], note: 'If your plumber prefers uPVC for cold water (6 m lengths) or PPR, the metres stay the same and the number of lengths changes.' },
    { id: 'floors', title: 'Supply riser, floor by floor', sub: 'Water comes down from the overhead tank, so each floor’s riser is sized for the water used on that floor and every floor below it. The pipe narrows towards the ground.', head: ['Floor', 'Bathrooms', 'Kitchens', 'Demand carried here (fixture units)', 'Riser size'], num: [1, 2, 3], rows: floorRows, note: 'Fixture units follow NBC Part 9 Section 1 Table 2. The flow for those units is read from Table 3 and the smallest pipe that carries it at 2.4 m/s is chosen.' },
    { id: 'fit', title: 'Supply fittings and valves', sub: 'Counted per tap and per piece of equipment.', head: ['Item', 'Number'], num: [1], rows: [...fitRows, [`Pipe clamps on exposed pipe (about 1 per metre)`, clamps]], tight: true, note: 'Pipes inside walls are chased in and need no clamps. Only risers, the terrace and the pump line are clamped.' },
    { id: 'fix', title: 'Fixtures and taps counted', head: ['Item', 'Number'], num: [1], rows: fixtureRows, tight: true, note: 'Counted, not specified: the make, finish and model are yours to choose.' },
    { id: 'drain', title: 'Drain and rain pipe (uPVC SWR)', sub: `Soil, waste and vent stacks, branches, the building drain (${drainDn} mm) and down-pipes, in whole 3 m lengths.`, head: ['Size', 'Run (m)', 'With 5% cutting waste (m)', '3 m lengths', 'To buy'], num: [1, 2, 3, 4], rows: drainRows, foot: ['All sizes', fmt(drainM, 1), fmt(drainM * WASTE, 1), sumPieces(drainRows), `${sumPieces(drainRows) * PIECE_M} m`] },
    { id: 'dfit', title: 'Drainage fittings, traps and chambers', head: ['Item', 'Number'], num: [1], rows: [...dfitRows, ['Pipe clamps on stacks and down-pipes (about 1 per 1.5 m)', dclamps]], tight: true, note: `Stack junctions: ${stackJunctions}. Chambers are counted, not built: bricks, mortar and covers are in MasonryPro and the structure.` },
  ]

  if (!inp.sewer && septic && pit) {
    tables.push({
      id: 'septic', title: 'Septic tank and soak pit', sub: 'No sewer is available, so the waste is treated on the plot.',
      head: ['Item', 'Number', 'Size', 'Basis'], num: [1],
      rows: [
        ['Septic tank', septic.count, `${fmt(septic.lM, 2)} × ${fmt(septic.bM, 2)} × ${fmt(septic.dM, 2)} m inside, ${septic.chambers === 2 ? 'two chambers (first twice the second)' : 'one chamber'}`, `${fmt(septic.vM3, 1)} m³ of liquid for ${users} people (IS 2470 Part 1 Appendix A, plus a day’s detention of the other waste water)`],
        ['Soak pit', pit.count, `${fmt(pit.dia, 1)} m across, ${fmt(pit.depthM, 1)} m below the pipe`, `${fmt(effluentL)} L a day over ${fmt(pit.areaM2, 1)} m² of wall at ${SOIL[inp.soil].rate} L/m²/day (IS 2470 Part 2 Table 2, ground ${SOIL[inp.soil].label})`],
        ['Digging for the tank and pit', 1, `${fmt(septic.excavM3 + pit.excavM3, 1)} m³`, 'Tank with 0.5 m working space all round; pit 0.3 m beyond the lining'],
      ],
      note: 'Walls, roof slab and covers of the tank and the lining of the pit are not counted here.',
    })
  } else {
    tables.push({ id: 'sewer', title: 'Sewer connection', head: ['Item', 'Number', 'Size', 'Basis'], num: [1], rows: [['Connection from the last chamber to the public sewer', 1, '110 mm, about 6 m', 'The length depends on where the sewer is; your local body fixes the point of connection']] })
  }
  tables.push({ id: 'rain', title: 'Rain-water down-pipes', head: ['Item', 'Number', 'Size', 'Basis'], num: [1], rows: [['Down-pipes', dpN, `${dpBuy} mm uPVC, ${fmt(N * H_FLOOR + 0.5, 1)} m each`, `${fmt(roofM2)} m² of roof, rain ${RAIN_LABEL[inp.rain]}; a ${dpDn} mm pipe drains ${DOWNPIPE_AREA[dpDn][iMM]} m² (IS 1742 Table 5)`]] })

  const lines: QtyLine[] = []
  for (const [dn, m] of supplyLines) lines.push({ key: `pipe-cpvc-${dn}`, item: `CPVC pipe ${dn} mm`, qty: pieces(m * WASTE, PIECE_M) * PIECE_M, unit: 'm', group: 'Plumbing', basis: 'Whole 3 m lengths, 5% cutting waste' })
  for (const [dn, m] of drainLines) lines.push({ key: `pipe-swr-${dn}`, item: `uPVC SWR pipe ${dn} mm`, qty: pieces(m * WASTE, PIECE_M) * PIECE_M, unit: 'm', group: 'Plumbing', basis: 'Whole 3 m lengths, 5% cutting waste' })
  if (ugt) lines.push({ key: 'tank-ugt', item: 'Underground tank', qty: ugt.each * ugt.count, unit: 'L', group: 'Plumbing', basis: ugt.kind })
  lines.push({ key: 'tank-oht', item: 'Overhead tank', qty: oht.each * oht.count, unit: 'L', group: 'Plumbing', basis: oht.kind })
  if (pumps > 0) lines.push({ key: 'pump', item: `Transfer pump ${hp} HP`, qty: pumps, unit: 'nos', group: 'Plumbing', basis: 'One working, one standby for two or more homes' })
  lines.push({ key: 'wc', item: 'Water closets', qty: wc, unit: 'nos', group: 'Plumbing', basis: 'One per bathroom' })
  lines.push({ key: 'basin', item: 'Wash basins', qty: basins, unit: 'nos', group: 'Plumbing', basis: 'One per bathroom, one at the dining area' })
  lines.push({ key: 'chamber', item: 'Inspection chambers', qty: chambers, unit: 'nos', group: 'Plumbing', basis: 'At each stack foot, at the outlet, and every 30 m' })

  const assumptions = [
    `Code: ${lpcd} litres per person a day (IS 1172:1993). Tanks follow the NBC Part 9 Section 1 split of ${inp.water === 'borewell' ? 'half a day in one overhead tank' : inp.water === 'tanker' ? 'a day and a half underground and a third of a day overhead' : 'two-thirds of a day underground and one-third overhead'}.`,
    'Code: fixture units, simultaneous demand, 2.4 m/s velocity limit (NBC Part 9 Section 1 draft); drain loads, stack and drain limits (IS 1742); venting above five storeys (IS 5329); septic tank and soak pit tables (IS 2470); down-pipe areas (IS 1742 Table 5).',
    `Derived: people per home = bedrooms plus three${inp.persons ? ' (you gave the number, which replaces this)' : ''}. The NBC draft gives this relation in two readings that differ by one person; the larger is used, so tanks lean generous.`,
    'Assumed: floor to floor height of 3.0 m; 3 m of pipe from the header to each tap; 0.6 × the side of the home for the header run from the riser; 4 m from the stack foot to its chamber and 8 m to the plot edge. No standard fixes these, so the report treats them as the least certain part and the range below is wide.',
    'Assumed: bathrooms are stacked one above another and share a wet wall, kitchens likewise.',
    'Assumed: one washing machine point per home, one balcony tap per home on every floor, one terrace tap, and one wash basin at the dining area for homes with two or more bedrooms.',
    'Assumed: a transfer pump fills the overhead tank in 30 minutes, at a pump efficiency of 0.5, over the climb plus 10 m of pipe and 30% extra length for fittings.',
    `Assumed: roof area equals your largest floor. Rain of ${RAIN_LABEL[inp.rain]}, because the standard gives no figure for each town.`,
    'Assumed: tank sizes are rounded up to 500, 1,000, 1,500, 2,000, 3,000 or 5,000 litres, which are the common ready-made sizes (no standard lists them). A larger need is shown as equal tanks, or a built sump underground.',
    'Assumed: 5% cutting waste on all pipe, and whole lengths of 3 m (CPVC, IS 15778 allows 3, 5 or 6 m; SWR pipe is sold in 3 m lengths).',
  ]
  const notIncluded = [
    'Building the underground tank, the septic tank, the soak pit and the inspection chambers (concrete, bricks, plaster, covers).',
    'The borewell, its submersible pump and the cable to it.',
    'Hot-water solar systems, water meters, water softeners and filters.',
    'Fire-fighting water and pipework (NBC Part 4).',
    'Make, model or finish of any fixture or tap.',
    'Excavation and refilling for drains and pipes in the ground, except the tank and pit digging shown.',
    'Kitchen hot water, which is cold-only in this count.',
  ]
  const bands = [
    { label: 'Water supply pipe', low: BANDS.supply.low, high: BANDS.supply.high },
    { label: 'Drain and rain pipe', low: BANDS.drain.low, high: BANDS.drain.high },
    { label: 'Fittings and valves', low: BANDS.fittings.low, high: BANDS.fittings.high },
    { label: 'Tanks and pump', low: BANDS.tanks.low, high: BANDS.tanks.high },
  ]
  const sources = [
    'IS 1172:1993 Basic requirements for water supply, drainage and sanitation',
    'IS 2065:1983 Water supply in buildings; IS 12183 (Part 1):1987 Water storage and pumping',
    'IS 1742:1983 Building drainage; IS 5329:1983 Sanitary pipework above ground',
    'IS 2470 (Part 1 and 2):1985 Septic tanks and soak pits; IS 4111 (Part 1):1986 Manholes',
    'IS 15778:2007 CPVC pipes; IS 4985:2000 uPVC pressure pipes; SP 35:1987 Water supply and drainage handbook',
    'NBC 2016 Part 9 Section 1 and Section 2, read from the BIS preliminary drafts of November 2024',
  ]

  if (trace) {
    Object.assign(trace, {
      N, flats, homesOnFloor, homes, perHome, people, lpcd, demandL, ugtL, ohtL, ugt, oht, tankCount,
      footM2, bath, kit, wsfuHome, wsfuCarried, riserDn, headerDn,
      wc, basins, showers, health, sinks, washers, balconyTaps, geysers, floorTraps, terraceTaps, gardenTaps, coldOutlets, hotOutlets,
      runs, qLpm, staticM, deliveryDn, deliveryLen, frictionM, headM, hpRaw, hp, pumps,
      soilStacks, wasteStacks, stackH, ventStacks, fuTotal, drainDn, drainRun, chambers, effluentL, septic, pit,
      roofM2, iMM, dpDn, dpN, dpLen, dpBuy,
      fit: [...fit.entries()], exposedM, clamps, dfit: [...dfit.entries()], dclamps, stackJunctions,
      supplyLines, supplyM, supplyBuyM, drainLines, drainM, drainBuyM,
      lines: lines.map((l) => ({ key: l.key, qty: l.qty })),
    })
  }

  return {
    ok: true,
    result: {
      free: {
        engine: 'trade-v1', tool: 'plumbing',
        chips: [`${homes} ${homes === 1 ? 'home' : 'homes'}`, `${people} people`, `${N} ${N === 1 ? 'floor' : 'floors'}`],
        factsTitle: 'Your water and drainage at a glance',
        facts,
        factsFoot: 'Counted from your answers. How much pipe, how many fittings, which tank sizes and what pump are in the full report.',
        checks, warnings,
      },
      paid: { engine: 'trade-v1', tool: 'plumbing', tiles, tables, lines, bands, assumptions, notIncluded, sources },
    },
  }
}

export const plumbingModel: TradeModel<PlumbInput> = {
  key: 'plumbing',
  appType: 'plumbpro',
  label: 'PlumbingPro',
  code: 'PL',
  parse: parsePlumb,
  run: (input) => runPlumb(input),
  calc: (input, report) => buildPlumbingCalc(input, report),
}

