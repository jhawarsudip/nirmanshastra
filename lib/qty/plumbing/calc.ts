/*
  PlumbingPro calculation sheet: the last pages of the paid report.

  It re-derives every figure in the report from the same answers, step by step, with the Ledger, which carries out each
  sum itself so the working printed and the result printed cannot disagree. The constants, tables and helpers are the
  model's own (exported from model.ts, constants.ts and tanks.ts); nothing is retyped here. Each step is checked against the
  figure the model produced for the same step (the trace handed back by runPlumb), and every tile, table total and buy-list
  line is compared with the report as printed. If anything disagrees, the sheet is not made (null) and the reasons go to the
  console, so the report is printed without a sheet rather than with working that does not match.

  Quantity-only: no rupee figure, no rate. Where the model uses a planning rule that no standard fixes, the line says so.
*/

import { Ledger, sheetIsSound, tie, type CalcBlock, type CalcOpts, type CalcReference, type CalcSection, type CalcSheet, type CalcTable, type CalcTieRow, type Vars } from '@/lib/calcsheet'
import type { Table, TradeResult } from '../types'
import { SQFT_TO_M2, bump, ceilTo, fmt, interp, pieces, rangeText } from '../util'
import { STANDARD_TANK_SIZES, WATER_DEMAND_LPCD } from './constants'
import { SUMP_STEP_L, tankPlan, tankSplit } from './tanks'
import {
  BANDS, CPVC_ID_MM, DFU, DOWNPIPE_AREA, FU_LIMITS, H_FLOOR, HAZEN_C, PIECE_M, PUMP_HP, RAIN_INTENSITY, RAIN_LABEL, RULES, SEPTIC_V, SOIL,
  SUPPLY_DN, WASTE, WSFU, WSFU_FLOW, capLpm, floorName, flowFor, headLoss, runPlumb, sizeFor, spread,
  type PlumbInput, type PlumbTrace,
} from './model'

/** Where each step comes from. A clause number marked "not re-read" in the references table is a pointer taken from the research notes, not a quotation. */
const REF = {
  answer: 'Your answer',
  rule: 'NirmanShastra assumption',
  eng: 'Engine rule',
  lpcd: 'IS 1172:1993 cl 4.1 and its Note',
  people: 'NBC 2016 Part 9 Sec 1 (BIS draft, Nov 2024)',
  storage: 'NBC 2016 Part 9 Sec 1 cl 4.4.10 (BIS draft)',
  wsfu: 'NBC 2016 Part 9 Sec 1 Table 2 (BIS draft)',
  flow: 'NBC 2016 Part 9 Sec 1 Table 3 (BIS draft)',
  vel: 'NBC 2016 Part 9 Sec 1 cl 4.8.6 (BIS draft)',
  bore: 'IS 15778:2007 Table 2 (65 to 100 mm derived)',
  hw: 'SP 35:1987 eq. 1 (Hazen-Williams)',
  dfu: 'IS 1742:1983 Table 1',
  loads: 'IS 1742:1983 Tables 3 and 4',
  vent: 'IS 5329:1983 cl 6.1.1 (single stack without a vent)',
  stackTop: 'IS 5329:1983 cl 6.8.4 (stack above the roof)',
  septicVol: 'IS 2470 (Part 1):1985 Appendix A, tank dimensions (Tables 5 and 6)',
  septicDim: 'IS 2470 (Part 1):1985 cl 3.4.5 and 3.4.8',
  soak: 'IS 2470 (Part 2):1985 Table 2 (rate of application)',
  rain: 'IS 1742:1983 Table 5, cl 4.10.3.8',
  chamber: 'IS 1742:1983; IS 4111 (Part 1):1986 (chambers)',
} as const

const SOURCE_NAME = { municipal: 'Municipal supply', borewell: 'Borewell', tanker: 'Tanker' } as const

/** Every number inside a cell of the report, with thousands separators removed. */
const cellNums = (c: unknown): number[] =>
  typeof c === 'number' ? [c] : [...String(c ?? '').replace(/,/g, '').matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]))

export function buildPlumbingCalc(input: PlumbInput, report: TradeResult): CalcSheet | null {
  try {
    return build(input, report)
  } catch (e) {
    console.error('PlumbingPro calculation sheet could not be built:', e)
    return null
  }
}

function build(input: PlumbInput, report: TradeResult): CalcSheet | null {
  const R = RULES
  const T = {} as PlumbTrace
  const ran = runPlumb(input, T)
  if (!ran.ok) {
    console.error('PlumbingPro calculation sheet: the model refused the answers:', ran.error)
    return null
  }
  const paid = report.paid
  const free = report.free
  const L = new Ledger()
  const ties: CalcTieRow[] = []

  /* ───────────── reading the report as printed ───────────── */
  const tileOf = (k: string) => {
    const t = paid.tiles.find((x) => x.k === k)
    if (!t) throw new Error(`the report has no "${k}" tile`)
    return t
  }
  const tableOf = (id: string): Table => {
    const t = paid.tables.find((x) => x.id === id)
    if (!t) throw new Error(`the report has no "${id}" table`)
    return t
  }
  const rowOf = (t: Table, first: string) => {
    const r = t.rows.find((x) => String(x[0]) === first)
    if (!r) throw new Error(`the "${t.id}" table has no row "${first}"`)
    return r
  }
  const hasRow = (t: Table, first: string) => t.rows.some((x) => String(x[0]) === first)
  const factOf = (k: string) => {
    const f = free.facts.find((x) => x.k === k)
    if (!f) throw new Error(`the report has no "${k}" fact`)
    return f
  }
  const addTie = (item: string, reportV: number, sheetV: number, unit: string, dp = 0) => {
    const row = tie(item, reportV, sheetV, unit, dp)
    ties.push(row)
    if (!row.ok) L.mismatches.push(`${item}: report ${row.report} vs sheet ${row.sheet}`)
  }
  /** A comparison with the report that does not need its own line in the reconciliation. */
  const same = (label: string, sheetV: number, reportV: number, dp?: number) => L.compare(`${label} (against the report)`, sheetV, reportV, dp)

  /* ───────────── small writers ───────────── */
  const sumOf = (label: string, formula: string, xs: number[], o: CalcOpts = {}, dpEach?: number): number => {
    const vars: Vars = {}
    xs.forEach((x, i) => { vars[`x${i}`] = x })
    const working = xs.length ? xs.map((_, i) => `{x${i}${dpEach !== undefined ? `:${dpEach}` : ''}}`).join(' + ') : '0'
    return L.calc(label, formula, working, vars, (v) => xs.reduce((s, _x, i) => s + v[`x${i}`], 0), o)
  }
  const maxOf = (label: string, formula: string, xs: number[], o: CalcOpts = {}, dpEach?: number): number => {
    const vars: Vars = {}
    xs.forEach((x, i) => { vars[`x${i}`] = x })
    const working = 'largest of ' + xs.map((_, i) => `{x${i}${dpEach !== undefined ? `:${dpEach}` : ''}}`).join(', ')
    return L.calc(label, formula, working, vars, (v) => Math.max(...xs.map((_x, i) => v[`x${i}`])), o)
  }
  /** Reads a table by straight-line interpolation, the way interp() does, and shows the two rows it used. */
  const interpLine = (label: string, pts: ReadonlyArray<readonly [number, number]>, x: number, extend: boolean, o: CalcOpts): number => {
    const n = pts.length
    const want = interp(pts, x, extend)
    if (x <= pts[0][0]) {
      return L.calc(label, 'y = first row of the table', '{x} is at or below the first row ({x0}), so y = {y0}', { x, x0: pts[0][0], y0: pts[0][1] }, (v) => v.y0, { ...o, expect: want })
    }
    if (x >= pts[n - 1][0]) {
      if (!extend) {
        return L.calc(label, 'y = last row of the table', '{x} is at or above the last row ({x1}), so y = {y1}', { x, x1: pts[n - 1][0], y1: pts[n - 1][1] }, (v) => v.y1, { ...o, expect: want })
      }
      const [x0, y0] = pts[n - 2]
      const [x1, y1] = pts[n - 1]
      return L.calc(label, 'y = y1 + (x − x1) × (y1 − y0) ÷ (x1 − x0)', '{y1} + ({x} − {x1}) × ({y1} − {y0}) ÷ ({x1} − {x0})', { x, x0, y0, x1, y1 }, (v) => v.y1 + ((v.x - v.x1) * (v.y1 - v.y0)) / (v.x1 - v.x0), { ...o, note: [o.note, 'Beyond the last row of the table the last slope is carried on.'].filter(Boolean).join(' '), expect: want })
    }
    let i = 1
    while (x > pts[i][0]) i++
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    return L.calc(label, 'y = y0 + (x − x0) × (y1 − y0) ÷ (x1 − x0)', '{y0} + ({x} − {x0}) × ({y1} − {y0}) ÷ ({x1} − {x0})', { x, x0, y0, x1, y1 }, (v) => v.y0 + ((v.x - v.x0) * (v.y1 - v.y0)) / (v.x1 - v.x0), { ...o, expect: want })
  }
  /** The simultaneous flow (L/min) for a number of fixture units, as flowFor() reads it. */
  const flowLine = (label: string, u: number, o: CalcOpts): number => {
    const [x0, y0] = WSFU_FLOW[0]
    if (u < x0) {
      return L.calc(label, 'Q = Q1 × the larger of (s, u ÷ x1), below the first row', '{y0} × the larger of ({s}, {u} ÷ {x0})', { y0, s: R.smallFlowShare, u, x0 }, (v) => v.y0 * Math.max(v.s, v.u / v.x0), { ...o, unit: 'L/min', ref: o.ref ?? REF.flow, expect: flowFor(u) })
    }
    return interpLine(label, WSFU_FLOW, u, true, { ...o, unit: 'L/min', ref: o.ref ?? REF.flow })
  }
  /** The smallest size from a minimum up whose bore carries the flow at the velocity limit. */
  const sizeLine = (label: string, flow: number, vmax: number, min: number, o: CalcOpts = {}): number => {
    const dn = sizeFor(flow, vmax, min)
    const cap = capLpm(dn, vmax)
    const note = cap >= flow
      ? `A ${dn} mm pipe carries ${fmt(cap, 1)} L/min at ${vmax} m/s (table in 4.1).`
      : `WARNING: even ${dn} mm carries only ${fmt(cap, 1)} L/min at ${vmax} m/s, less than the ${fmt(flow, 1)} L/min asked of it. No size in the list is big enough, so the model uses ${dn} mm. The real pipe has to be larger, or run in parallel, and the velocity in it is above the limit.`
    const draftLimit = vmax >= R.vSupply
    const note2 = draftLimit ? note : `${note} ${vmax} m/s is a NirmanShastra assumption, lower than the ${R.vSupply} m/s maximum in the NBC draft (cl 4.8.6).`
    return L.calc(label, 'smallest size, not under the minimum, whose capacity at the velocity limit is at least Q; the largest size if none is',
      'from {min} mm up: capacity at {v} m/s must be at least {q:2} L/min', { min, v: vmax, q: flow }, (x) => sizeFor(x.q, x.v, x.min),
      { unit: 'mm', ref: draftLimit ? REF.vel : REF.rule, note: note2, ...o, expect: dn })
  }
  type LooseTable = Omit<CalcTable, 'rows' | 'foot'> & { rows: (string | number)[][]; foot?: (string | number)[] }
  const closeBlock = (id: string, title: string, extra: { intro?: string; table?: LooseTable; note?: string } = {}): CalcBlock => {
    const { table, ...rest } = extra
    const lines = L.take()
    const block: CalcBlock = { id, title, ...rest }
    if (lines.length) block.lines = lines
    if (table) block.table = { ...table, rows: table.rows.map((r) => r.map(String)), foot: table.foot?.map(String) }
    return block
  }
  const yn = (b: boolean) => (b ? 'Yes' : 'No')

  /* ───────────── what the answers give (mirrors the model's own bookkeeping) ───────────── */
  const N = input.floorAreasSqft.length
  const flats = input.dwelling === 'flats'
  const homesOnFloor = flats ? input.homesPerFloor : 1
  const bath: number[] = flats ? Array(N).fill(input.homesPerFloor * input.bathrooms) : spread(input.bathrooms, N)
  const kit: number[] = flats ? Array(N).fill(input.homesPerFloor * input.kitchens) : spread(input.kitchens, N)
  const bathPerHome = (i: number) => (flats ? input.bathrooms : bath[i])
  const kitPerHome = (i: number) => (flats ? input.kitchens : kit[i])
  const washerOn = (i: number) => input.washer && (flats || i === 0)
  const dining = (i: number) => input.bedrooms >= 2 && (flats || i === 0)
  const footM2 = input.floorAreasSqft.map((a) => a * SQFT_TO_M2)
  const fx = input.floorAreasSqft.map((_, i) => {
    const b = bathPerHome(i)
    const k = kitPerHome(i)
    const w = washerOn(i) ? 1 : 0
    const d = dining(i) ? 1 : 0
    return {
      b, k, w, d,
      wc: b * homesOnFloor, basins: (b + d) * homesOnFloor, sinks: k * homesOnFloor, washers: w * homesOnFloor, balcony: homesOnFloor,
      geysers: input.geyser ? b * homesOnFloor : 0, traps: (b + k + 1 + w) * homesOnFloor,
      units: b * WSFU.bathroom + k * WSFU.sink + w * WSFU.washer + WSFU.hoseBib + d * WSFU.basin,
    }
  })
  for (let i = 0; i < N; i++) {
    L.compare(`Bathrooms on ${floorName(i)}`, bath[i], T.bath[i])
    L.compare(`Kitchens on ${floorName(i)}`, kit[i], T.kit[i])
    L.compare(`Fixture units of a home on ${floorName(i)}`, fx[i].units, T.wsfuHome[i])
  }
  const terraceTaps = T.terraceTaps
  const gardenTaps = input.gardenTap ? 1 : 0
  const sections: CalcSection[] = []

  /* ═════════════ 1. answers, floors, people, fixtures ═════════════ */
  const b1: CalcBlock[] = []

  L.input('Building type', flats ? 'Flats' : 'A house', REF.answer)
  if (flats) L.value('Homes on each floor', input.homesPerFloor, '', 0, REF.answer)
  L.value(flats ? 'Bedrooms in each home' : 'Bedrooms in the house', input.bedrooms, '', 0, REF.answer)
  L.value(flats ? 'Bathrooms with a WC in each home' : 'Bathrooms with a WC in the house', input.bathrooms, '', 0, REF.answer)
  L.value(flats ? 'Kitchens in each home' : 'Kitchens in the house', input.kitchens, '', 0, REF.answer)
  L.input('People in each home', input.persons === undefined ? 'Not given' : String(input.persons), REF.answer, input.persons === undefined ? 'Bedrooms plus three is used (1.3).' : 'Replaces the bedrooms-plus-three rule.')
  L.input('Water source', SOURCE_NAME[input.water], REF.answer)
  L.input('Public sewer at the plot', input.sewer ? 'Yes' : 'No: septic tank and soak pit', REF.answer)
  if (!input.sewer) L.input('Ground for the soak pit', SOIL[input.soil].label, REF.answer)
  L.input('Rain in the heaviest hour', RAIN_LABEL[input.rain], REF.answer)
  L.input('Hot water (geysers) in the bathrooms', yn(input.geyser), REF.answer)
  L.input('Washing machine point in every home', yn(input.washer), REF.answer)
  L.input('Tap in the garden or parking', yn(input.gardenTap), REF.answer)
  L.input('State and city', `${input.state}${input.city ? ', ' + input.city : ''}`, REF.answer, 'Printed on the report; no figure on this sheet depends on it.')
  b1.push(closeBlock('answers', '1.1 Your answers'))

  // floors and roof
  L.value('Floors above ground', N, '', 0, REF.answer)
  L.value('Square feet to square metres', SQFT_TO_M2, 'm² per sq ft', 8, 'Conversion (1 ft = 0.3048 m)')
  const gBig = footM2.indexOf(Math.max(...footM2))
  L.calc(`Area of the largest floor (${floorName(gBig)})`, 'A = a × k', '{a:1} × {k:8}', { a: input.floorAreasSqft[gBig], k: SQFT_TO_M2 }, (v) => v.a * v.k, { unit: 'm²', expect: T.footM2[gBig] })
  const roofM2 = maxOf('Roof area', 'roof = the largest floor area', footM2, { unit: 'm²', ref: REF.rule, note: 'The model takes the roof as equal to the largest floor. No terrace slope, parapet or setback is drawn.', expect: T.roofM2 }, 1)
  b1.push(closeBlock('floors', '1.2 Floors and roof area', {
    table: {
      head: ['Floor', 'Built-up area (sq ft)', 'Area (m²)'],
      rows: input.floorAreasSqft.map((a, i) => [floorName(i), fmt(a, 0), fmt(footM2[i], 1)]),
      foot: ['Roof (largest floor)', fmt(Math.max(...input.floorAreasSqft), 0), fmt(roofM2, 1)],
      num: [1, 2],
    },
  }))

  // homes and people
  const homes = L.calc('Homes in the building', flats ? 'homes = homes per floor × floors' : 'a house is one home', flats ? '{h} × {N}' : '{h}', { h: flats ? input.homesPerFloor : 1, N }, (v) => (flats ? v.h * v.N : v.h), { result: true, expect: T.homes })
  const perHome = input.persons !== undefined
    ? L.value('People in each home (as you told us)', input.persons, '', 0, REF.answer)
    : L.calc('People in each home', 'persons = bedrooms + 3', '{b} + {e}', { b: input.bedrooms, e: R.extraPeople }, (v) => v.b + v.e, { ref: REF.people, note: 'The NBC draft gives this relation in two readings that differ by one person; the model takes the larger, so tanks lean generous.', expect: T.perHome })
  const people = L.calc('People counted', 'people = people per home × homes', '{p} × {h}', { p: perHome, h: homes }, (v) => v.p * v.h, { result: true, expect: T.people })
  b1.push(closeBlock('people', '1.3 Homes and people'))

  // what each floor holds
  L.say('How bathrooms and kitchens are placed', flats
    ? 'In flats every home has the bathrooms and kitchens you gave, so a floor holds the homes on the floor times those numbers.'
    : 'The bathrooms and kitchens of a house are spread over the floors as evenly as possible, ground floor first: each floor gets the whole-number share and the first few floors get one extra.', REF.eng)
  L.say('Washing machine and dining basin', 'A washing machine point is counted in every flat, and on the ground floor of a house. A dining wash basin is counted in every home with two or more bedrooms, in the same places.', REF.rule)
  b1.push(closeBlock('contents', '1.4 What each floor holds', {
    table: {
      head: ['Floor', 'Homes on the floor', 'Bathrooms in each home', 'Bathrooms on the floor', 'Kitchens in each home', 'Kitchens on the floor', 'Washing machine point', 'Dining basin'],
      rows: fx.map((f, i) => [floorName(i), homesOnFloor, f.b, bath[i], f.k, kit[i], f.w, f.d]),
      num: [1, 2, 3, 4, 5, 6, 7],
      note: 'In a house the "homes on the floor" column is 1 because each floor is counted as one unit; the bathrooms and kitchens in each home are then those of that floor.',
    },
  }))

  // fixtures counted
  const e0 = 0
  L.say(`Counting on ${floorName(e0)} (worked example)`, 'Each count is the number in one home times the homes on the floor. The same rule is applied to every floor in the table below.', REF.eng)
  L.calc('WCs, showers and health faucets', 'n = bathrooms × homes on the floor', '{b} × {h}', { b: fx[e0].b, h: homesOnFloor }, (v) => v.b * v.h, { unit: 'each', expect: fx[e0].wc, ref: REF.eng, note: 'One WC with flush tank, one shower with mixer and one health faucet in each bathroom.' })
  L.calc('Wash basins', 'n = (bathrooms + dining basin) × homes', '({b} + {d}) × {h}', { b: fx[e0].b, d: fx[e0].d, h: homesOnFloor }, (v) => (v.b + v.d) * v.h, { unit: 'nos', expect: fx[e0].basins, ref: REF.eng })
  L.calc('Kitchen sinks', 'n = kitchens × homes', '{k} × {h}', { k: fx[e0].k, h: homesOnFloor }, (v) => v.k * v.h, { unit: 'nos', expect: fx[e0].sinks, ref: REF.eng })
  L.calc('Floor traps', 'n = (bathrooms + kitchens + 1 balcony + washer) × homes', '({b} + {k} + 1 + {w}) × {h}', { b: fx[e0].b, k: fx[e0].k, w: fx[e0].w, h: homesOnFloor }, (v) => (v.b + v.k + 1 + v.w) * v.h, { unit: 'nos', expect: fx[e0].traps, ref: REF.eng, note: 'The washer standpipe has its own trap.' })
  const wc = sumOf('Water closets in all', 'WC = Σ over floors', fx.map((f) => f.wc), { unit: 'nos', result: true, ref: REF.eng, expect: T.wc })
  const showers = sumOf('Showers with mixer in all', 'one per bathroom', fx.map((f) => f.wc), { unit: 'nos', result: true, ref: REF.eng, expect: T.showers })
  const health = sumOf('Health faucets in all', 'one per bathroom', fx.map((f) => f.wc), { unit: 'nos', result: true, ref: REF.eng, expect: T.health })
  const basins = sumOf('Wash basins in all', 'Σ over floors', fx.map((f) => f.basins), { unit: 'nos', result: true, ref: REF.eng, expect: T.basins })
  const sinks = sumOf('Kitchen sinks in all', 'Σ over floors', fx.map((f) => f.sinks), { unit: 'nos', result: true, ref: REF.eng, expect: T.sinks })
  const washers = sumOf('Washing machine points in all', 'Σ over floors', fx.map((f) => f.washers), { unit: 'nos', result: true, ref: REF.eng, expect: T.washers })
  const balconyTaps = sumOf('Balcony or utility taps in all', 'one per home on every floor', fx.map((f) => f.balcony), { unit: 'nos', result: true, ref: REF.eng, expect: T.balconyTaps })
  const geysers = input.geyser ? sumOf('Geyser points in all', 'one per bathroom', fx.map((f) => f.geysers), { unit: 'nos', result: true, ref: REF.eng, expect: T.geysers }) : 0
  const floorTraps = sumOf('Floor traps in all', 'Σ over floors', fx.map((f) => f.traps), { unit: 'nos', result: true, ref: REF.eng, expect: T.floorTraps })
  L.value('Terrace tap', terraceTaps, 'no.', 0, REF.rule, 'One tap on the terrace, always.')
  L.value('Garden tap', gardenTaps, 'no.', 0, REF.answer)
  b1.push(closeBlock('fixtures', '1.5 Fixtures counted', {
    table: {
      head: ['Floor', 'WC, shower, health faucet', 'Wash basins', 'Kitchen sinks', 'Washing machine points', 'Balcony taps', 'Geysers', 'Floor traps'],
      rows: fx.map((f, i) => [floorName(i), f.wc, f.basins, f.sinks, f.washers, f.balcony, f.geysers, f.traps]),
      foot: ['All floors', wc, basins, sinks, washers, balconyTaps, geysers, floorTraps].map(String),
      num: [1, 2, 3, 4, 5, 6, 7],
    },
  }))
  sections.push({ id: 'answers', title: '1. Your answers and what follows from them', intro: 'The report starts from a few plain answers and the floor areas. This section turns them into the homes, the people, the roof area and the fixtures that every later step uses.', blocks: b1 })

  addTie('Homes', cellNums(factOf('Homes').v)[0], homes, '')
  addTie('People counted', cellNums(factOf('People counted').v)[0], people, '')
  addTie('Bathrooms and WCs', cellNums(factOf('Bathrooms and WCs').v)[0], wc, '')

  /* ═════════════ 2. daily water ═════════════ */
  const lpcd = input.water === 'borewell' ? WATER_DEMAND_LPCD.borewell : WATER_DEMAND_LPCD.municipal
  L.value('Litres per person per day', lpcd, 'L', 0, REF.lpcd, input.water === 'borewell'
    ? 'IS 1172 cl 4.1 gives 150 to 200 L a head for towns of over a lakh people and does not fix demand by water source. The model takes the lowest figure of that range, 150 L, for a house on its own borewell: a choice of the model.'
    : 'IS 1172 cl 4.1 gives 150 to 200 L a head for towns of over a lakh people. The 135 L here is the figure its Note allows for lower-income housing. It is the lower of the figures the sources give, and the model uses it for every home on a piped or tanker supply, so a town of over a lakh people may need 150 L or more.')
  const demandL = L.calc('Water used in a day', 'D = people × litres per person per day', '{p} × {q}', { p: people, q: lpcd }, (v) => v.p * v.q, { unit: 'L', result: true, ref: REF.lpcd, expect: T.demandL })
  sections.push({
    id: 'demand', title: '2. Daily water demand',
    intro: 'Everything downstream (tanks, pump flow, waste water) rests on how much water the people use in a day.',
    blocks: [closeBlock('demand', '2.1 Water used in a day')],
  })
  addTie('Water used a day', cellNums(factOf('Water used a day').v)[0], demandL, 'L')

  /* ═════════════ 3. tanks ═════════════ */
  const split1 = tankSplit(input.water, 1)
  let ugtNeed = 0
  if (input.water !== 'borewell') {
    ugtNeed = L.calc('Underground tank: water to hold', 'UGT = ku × D', '{D} × {f:3}', { D: demandL, f: split1.ugtL }, (v) => tankSplit(input.water, v.D).ugtL, { unit: 'L', ref: REF.storage, note: input.water === 'municipal' ? 'Two-thirds of a day underground when the supply is piped (note c).' : 'A day and a half underground when water comes by tanker. The draft clause is unclear about which tank holds which part, so this split is reconstructed.', expect: T.ugtL })
  } else {
    L.say('Underground tank', 'None. A borewell fills the overhead tank on demand.', REF.storage)
  }
  const ohtNeed = L.calc('Overhead tank: water to hold', 'OHT = ko × D', '{D} × {f:3}', { D: demandL, f: tankSplit(input.water, 1).ohtL }, (v) => tankSplit(input.water, v.D).ohtL, { unit: 'L', ref: REF.storage, note: input.water === 'borewell' ? 'The draft allows one-third to one-half of a day for a borewell (note a); the half is used.' : 'One-third of a day overhead.', expect: T.ohtL })
  const b3a = closeBlock('split', '3.1 How the day\'s water is shared between the tanks')

  const largestTank = STANDARD_TANK_SIZES[STANDARD_TANK_SIZES.length - 1]
  L.input('Tank sizes sold (litres)', STANDARD_TANK_SIZES.join(', '), REF.rule, 'The common ready-made sizes; no standard lists them. A larger need is shown as equal tanks, or as a built sump underground.')
  const tankLines = (name: string, need: number, underground: boolean, plan: { each: number; count: number; kind: string }) => {
    let each: number
    let count = 1
    if (need <= largestTank) {
      each = L.calc(`${name}: size sold`, 'smallest size sold that is at least the need', 'first size in the list that is at least {n:0} L', { n: need }, (v) => tankPlan(v.n, underground).each, { unit: 'L', ref: REF.rule, expect: plan.each })
    } else if (underground) {
      each = L.calc(`${name}: built sump volume`, 'V = need rounded up to the next step', 'next multiple of {s} L at or above {n:0} L', { n: need, s: SUMP_STEP_L }, (v) => ceilTo(v.n, v.s), { unit: 'L', ref: REF.rule, note: `${plan.kind}. Above the largest ready tank an underground tank is built, in steps of ${SUMP_STEP_L} L.`, expect: plan.each })
    } else {
      count = L.calc(`${name}: number of equal tanks`, 'n = ceil(need ÷ largest size sold)', 'ceil({n:0} ÷ {m})', { n: need, m: largestTank }, (v) => Math.ceil(v.n / v.m), { ref: REF.rule, expect: plan.count })
      const per = L.calc(`${name}: water in each tank`, 'per tank = need ÷ n', '{n:0} ÷ {c}', { n: need, c: count }, (v) => v.n / v.c, { unit: 'L' })
      each = L.calc(`${name}: size sold for each`, 'smallest size sold that is at least the share', 'first size in the list that is at least {p:0} L', { p: per }, (v) => STANDARD_TANK_SIZES.find((s) => v.p <= s) ?? largestTank, { unit: 'L', ref: REF.rule, expect: plan.each })
    }
    return L.calc(`${name}: capacity bought`, 'size × number', '{e} × {c}', { e: each, c: count }, (v) => v.e * v.c, { unit: 'L', result: true, note: plan.kind, expect: plan.each * plan.count })
  }
  const ugtPlan = input.water !== 'borewell' ? tankPlan(ugtNeed, true) : null
  const ohtPlan = tankPlan(ohtNeed, false)
  const ugtL = ugtPlan ? tankLines('Underground tank', ugtNeed, true, ugtPlan) : 0
  const ohtL = tankLines('Overhead tank', ohtNeed, false, ohtPlan)
  const tankTotalL = L.calc('Tanks: total capacity bought', 'UGT + OHT', '{u} + {o}', { u: ugtL, o: ohtL }, (v) => v.u + v.o, { unit: 'L', result: true, expect: (T.ugt ? T.ugt.each * T.ugt.count : 0) + T.oht.each * T.oht.count })
  const tankCount = L.calc('Tanks in all (for float valves, valves and overflow pipes)', 'number of UGT + number of OHT', '{u} + {o}', { u: ugtPlan ? ugtPlan.count : 0, o: ohtPlan.count }, (v) => v.u + v.o, { expect: T.tankCount })
  const b3b = closeBlock('tank-size', '3.2 Rounding up to tanks that are sold')
  sections.push({
    id: 'tanks', title: '3. Underground and overhead tanks',
    intro: 'The day\'s water is split between an underground and an overhead tank according to the water source, then each part is rounded up to a tank that is sold. Fire-fighting reserve is not counted; it is a matter for NBC Part 4.',
    blocks: [b3a, b3b],
  })
  {
    const tt = tableOf('tanks')
    if (ugtPlan) {
      const r = rowOf(tt, 'Underground tank')
      addTie('Underground tank: size', cellNums(r[1])[0], ugtPlan.each, 'L')
      addTie('Underground tank: number', cellNums(r[2])[0], ugtPlan.count, '')
      addTie('Underground tank: litres needed', cellNums(r[4])[0], Math.round(ugtNeed), 'L')
    } else if (hasRow(tt, 'Underground tank')) L.mismatches.push('the report has an underground tank but the sheet has none')
    const r = rowOf(tt, 'Overhead tank')
    addTie('Overhead tank: size', cellNums(r[1])[0], ohtPlan.each, 'L')
    addTie('Overhead tank: number', cellNums(r[2])[0], ohtPlan.count, '')
    addTie('Overhead tank: litres needed', cellNums(r[4])[0], Math.round(ohtNeed), 'L')
    addTie('Tanks, total capacity (headline figure)', cellNums(tileOf('Tanks').v)[0], tankTotalL, 'L')
  }

  /* ═════════════ 4. supply pipe sizing ═════════════ */
  L.value('Velocity limit in supply pipe', R.vSupply, 'm/s', 1, REF.vel, 'The most the NBC draft allows for the velocity of the water in a supply pipe.')
  L.calc('Capacity of a 20 mm pipe (worked example)', 'Q = (π ÷ 4) × d² × v × 60,000', '(π ÷ 4) × ({d:1} ÷ 1000)² × {v} × 60,000', { d: CPVC_ID_MM[20], v: R.vSupply }, (x) => (Math.PI / 4) * (x.d / 1000) ** 2 * x.v * 60000, { unit: 'L/min', ref: REF.bore, note: 'd is the inside diameter in mm; 60,000 turns m³/s into L/min.', expect: capLpm(20, R.vSupply) })
  const b4a = closeBlock('bore', '4.1 Pipe bore and what each size carries', {
    table: {
      head: ['Nominal size (mm)', 'Inside diameter (mm)', `Carries at ${R.vSupply} m/s (L/min)`, `Carries at ${R.vDelivery} m/s (L/min)`],
      rows: SUPPLY_DN.map((dn) => [String(dn), fmt(CPVC_ID_MM[dn], 1), fmt(capLpm(dn, R.vSupply), 1), fmt(capLpm(dn, R.vDelivery), 1)]),
      num: [0, 1, 2, 3],
      note: `CPVC SDR 11 pipe. Sizes 65 to 100 mm take the inside diameter as 0.806 times the outside diameter (derived). The model uses CPVC bores for all supply sizes. The ${R.vSupply} m/s column is the maximum in the NBC draft (cl 4.8.6) and is used for the home headers and risers. The ${R.vDelivery} m/s column is used for the delivery pipe only; ${R.vDelivery} m/s is a NirmanShastra assumption, lower than the draft maximum.`,
    },
  })

  L.value('Fixture units: bathroom (WC, basin, shower)', WSFU.bathroom, 'units', 1, REF.wsfu, 'Private use, flush tank.')
  L.value('Fixture units: kitchen sink', WSFU.sink, 'units', 1, REF.wsfu)
  L.value('Fixture units: washing machine', WSFU.washer, 'units', 1, REF.wsfu)
  L.value('Fixture units: balcony or terrace tap (hose bib)', WSFU.hoseBib, 'units', 1, REF.wsfu)
  L.value('Fixture units: dining wash basin', WSFU.basin, 'units', 1, REF.wsfu)
  const b4b = closeBlock('wsfu', '4.2 Water supply fixture units', {
    intro: 'Each fixture is given a number of fixture units. The flow that a set of units draws at the same moment is read from NBC Part 9 Table 3 (flush-tank column) and is much less than the sum of every tap running together.',
    table: {
      head: ['Fixture units', 'Simultaneous flow (L/min)'],
      rows: WSFU_FLOW.map(([u, q]) => [fmt(u, 0), fmt(q, 1)]),
      num: [0, 1],
      note: 'Below the first row the flow falls in proportion to the units but not below the share shown in the working. Above the last row the last slope is carried on.',
    },
  })

  // per-floor sizes
  const wsfuHome = fx.map((f) => f.units)
  const wsfuCarried: number[] = new Array(N).fill(0)
  {
    let acc = 0
    for (let i = 0; i < N; i++) {
      acc += wsfuHome[i] * homesOnFloor + (i === 0 ? WSFU.hoseBib * gardenTaps : 0)
      wsfuCarried[i] = acc + (i === N - 1 ? WSFU.hoseBib * terraceTaps : 0)
    }
  }
  const headerDn = wsfuHome.map((u) => sizeFor(flowFor(u), R.vSupply, R.minHeaderDn))
  const riserDn = wsfuCarried.map((u) => sizeFor(flowFor(u), R.vSupply, R.minHeaderDn))
  for (let i = 0; i < N; i++) {
    L.compare(`Carried units, ${floorName(i)}`, wsfuCarried[i], T.wsfuCarried[i])
    L.compare(`Header size, ${floorName(i)}`, headerDn[i], T.headerDn[i])
    L.compare(`Riser size, ${floorName(i)}`, riserDn[i], T.riserDn[i])
  }
  const gH = wsfuHome.indexOf(Math.max(...wsfuHome))
  const top = N - 1
  L.say(`Worked example 1: the header of one home on ${floorName(gH)}`, 'This is the floor whose home draws the most. The header is the pipe from the riser into the home.', REF.eng)
  const uH = L.calc('Fixture units of one home', 'u = b × Ub + k × Uk + w × Uw + Uh + d × Ud', '{b} × {Ub} + {k} × {Uk} + {w} × {Uw} + {Uh} + {d} × {Ud}',
    { b: fx[gH].b, Ub: WSFU.bathroom, k: fx[gH].k, Uk: WSFU.sink, w: fx[gH].w, Uw: WSFU.washer, Uh: WSFU.hoseBib, d: fx[gH].d, Ud: WSFU.basin },
    (v) => v.b * v.Ub + v.k * v.Uk + v.w * v.Uw + v.Uh + v.d * v.Ud, { unit: 'units', ref: REF.wsfu, note: 'b bathrooms, k kitchens, w washing machine, one balcony tap (Uh), d dining basin.', expect: wsfuHome[gH] })
  const qH = flowLine('Flow drawn at the same time by one home', uH, { expect: undefined })
  sizeLine('Header size', qH, R.vSupply, R.minHeaderDn, { result: true, expect: headerDn[gH] })

  L.say(`Worked example 2: the riser at the top (${floorName(top)})`, 'Water comes down from the overhead tank, so the riser at a floor carries that floor and every floor below it. The top segment carries the whole building, the terrace tap and the garden tap.', REF.eng)
  const carriedTerms = fx.map((f, i) => wsfuHome[i] * homesOnFloor + (i === 0 ? WSFU.hoseBib * gardenTaps : 0))
  carriedTerms.push(WSFU.hoseBib * terraceTaps)
  const uTop = sumOf('Fixture units carried by the top of the riser', 'Σ (units of a home × homes) over the floors + garden tap + terrace tap', carriedTerms, { unit: 'units', ref: REF.wsfu, expect: wsfuCarried[top] }, 1)
  const qTop = flowLine('Flow drawn at the same time by the whole building', uTop, {})
  sizeLine('Top riser size', qTop, R.vSupply, R.minHeaderDn, { result: true, expect: riserDn[top] })
  const b4c = closeBlock('size-examples', '4.3 Header and riser: worked examples')

  const floorSizeRows = fx.map((f, i) => [
    floorName(i), f.b, f.k, f.w, f.d, fmt(wsfuHome[i], 1), fmt(flowFor(wsfuHome[i]), 1), `${headerDn[i]} mm${capLpm(headerDn[i], R.vSupply) < flowFor(wsfuHome[i]) ? '*' : ''}`,
    fmt(wsfuCarried[i], 1), fmt(flowFor(wsfuCarried[i]), 1), `${riserDn[i]} mm${capLpm(riserDn[i], R.vSupply) < flowFor(wsfuCarried[i]) ? '*' : ''}`,
  ])
  const undersized = floorSizeRows.some((r) => String(r[7]).endsWith('*') || String(r[10]).endsWith('*'))
  const b4d = closeBlock('size-floors', '4.4 Header and riser size, floor by floor', {
    table: {
      head: ['Floor', 'Bathrooms', 'Kitchens', 'Washer', 'Dining basin', 'Units, one home', 'Flow (L/min)', 'Header', 'Units carried by riser', 'Flow (L/min)', 'Riser'],
      rows: floorSizeRows,
      num: [1, 2, 3, 4, 5, 6, 8, 9],
      note: 'Bathrooms and kitchens are those of one home on the floor. The riser narrows towards the ground because less water has to pass.' + (undersized ? ' * marks a pipe that is the largest size in the list but still carries less than the flow at the velocity limit: the real pipe has to be larger or run in parallel.' : ''),
    },
  })
  {
    const ft = tableOf('floors')
    for (let i = 0; i < N; i++) {
      const r = rowOf(ft, floorName(i))
      same(`${floorName(i)}: bathrooms`, bath[i], cellNums(r[1])[0])
      same(`${floorName(i)}: kitchens`, kit[i], cellNums(r[2])[0])
      same(`${floorName(i)}: demand carried`, wsfuCarried[i], cellNums(r[3])[0], 1)
      same(`${floorName(i)}: riser size`, riserDn[i], cellNums(r[4])[0])
    }
  }
  sections.push({
    id: 'sizing', title: '4. Supply pipe sizing',
    intro: 'The supply pipe is CPVC (IS 15778). The size of each home header and of the riser at each floor is the smallest size whose bore carries the simultaneous flow at the velocity limit.',
    blocks: [b4a, b4b, b4c, b4d],
  })

  /* ═════════════ 5. delivery pipe and transfer pump ═════════════ */
  const hasPump = input.water !== 'borewell'
  const peakQ = L.calc('Flow to meet the peak hour', 'Q1 = peak factor × D ÷ (hours × 60)', '{f} × {D:0} ÷ ({h} × 60)', { f: R.peakFactor, D: demandL, h: R.peakHours }, (v) => (v.f * v.D) / (v.h * 60), { unit: 'L/min', ref: REF.rule, note: 'Peak hour taken as one and a half times the day\'s demand spread evenly over the hours of use. The factor 1.5 is a NirmanShastra choice; the NBC draft mentions a peak factor of 2 to 3.' })
  const fillQ = L.calc('Flow to refill the overhead tank', 'Q2 = tank capacity bought ÷ fill time', '{c:0} ÷ {t}', { c: ohtPlan.each * ohtPlan.count, t: R.fillMinutes }, (v) => v.c / v.t, { unit: 'L/min', ref: REF.rule, note: 'The pump is assumed to refill the whole overhead tank in this many minutes.' })
  const qLpm = maxOf('Pump flow', 'Q = the larger of Q1 and Q2', [peakQ, fillQ], { unit: 'L/min', result: hasPump, ref: REF.rule, note: fillQ >= peakQ ? 'Refilling the tank is the larger flow here, so the peak-hour factor does not change the pump.' : 'The peak-hour flow is the larger here, so the peak-hour factor does set the pump flow.', expect: T.qLpm }, 1)
  const staticM = L.calc('Climb from the water level to the top of the overhead tank', 'Hs = floors × floor height + tank stand + water depth + depth of the water below ground', '{N} × {h} + {s} + {d} + {g}', { N, h: H_FLOOR, s: R.tankStandM, d: R.waterDepthM, g: R.belowGroundM }, (v) => v.N * v.h + v.s + v.d + v.g, { unit: 'm', ref: REF.rule, expect: T.staticM })
  L.value('Velocity limit in delivery pipe', R.vDelivery, 'm/s', 1, REF.rule, `A NirmanShastra assumption, lower than the ${R.vSupply} m/s maximum in the NBC draft (cl 4.8.6).`)
  const deliveryDn = sizeLine('Delivery pipe size', qLpm, R.vDelivery, R.minDeliveryDn, { unit: 'mm', expect: T.deliveryDn })
  const deliveryLen = L.calc('Delivery pipe length', 'L = Hs + extra run', '{h:1} + {e}', { h: staticM, e: R.deliveryExtraM }, (v) => v.h + v.e, { unit: 'm', ref: REF.rule, expect: T.deliveryLen })
  const frictionM = L.calc('Friction loss in the delivery pipe', 'hf = 10.67 × Le × (Q ÷ 1000)^1.852 ÷ (C^1.852 × (d ÷ 1000)^4.87)',
    '10.67 × {Le:1} × ({Q:3} ÷ 1000)^1.852 ÷ ({C}^1.852 × ({d:1} ÷ 1000)^4.87)',
    { Le: deliveryLen * R.fittingsFactor, Q: qLpm / 60, C: HAZEN_C, d: CPVC_ID_MM[deliveryDn] },
    (v) => headLoss(v.Le, v.Q, deliveryDn, v.C), { unit: 'm', ref: REF.hw, note: `Le is the pipe length times ${R.fittingsFactor} for fittings, in m. Q is the pump flow in L/s (L/min ÷ 60) and d the inside diameter in mm; the formula divides each by 1000 to get m³/s and m. C = ${HAZEN_C} is the model's value for plastic pipe.`, expect: T.frictionM })
  const headM = L.calc('Total head the pump works against', 'H = Hs + hf + residual head at the tank', '{s:1} + {f:2} + {r}', { s: staticM, f: frictionM, r: R.residualHeadM }, (v) => v.s + v.f + v.r, { unit: 'm', result: hasPump, ref: REF.rule, expect: T.headM })
  const hpRaw = L.calc('Power needed', 'P = Q × H ÷ (4,500 × efficiency)', '{Q:1} × {H:1} ÷ ({k} × {e})', { Q: qLpm, H: headM, k: R.hpFactor, e: R.pumpEff }, (v) => (v.Q * v.H) / (v.k * v.e), { unit: 'HP', ref: REF.rule, note: 'Metric horsepower: 1 HP is 4,500 kgf·m a minute, and 1 L of water weighs 1 kgf. Pump efficiency is assumed.', expect: T.hpRaw })
  const hp = L.calc('Pump size sold', 'next size up from the list', 'first size in the list that is at least {p:2} HP', { p: hpRaw }, (v) => PUMP_HP.find((h) => v.p <= h) ?? PUMP_HP[PUMP_HP.length - 1], { unit: 'HP', result: hasPump, ref: REF.rule, note: `Sizes listed: ${PUMP_HP.join(', ')} HP.`, expect: T.hp })
  if (hpRaw > PUMP_HP[PUMP_HP.length - 1]) {
    L.say('Warning: power above the largest size listed', `The power needed is more than the largest pump size in the list, so the model shows that largest size. The real pump for this building has to be selected from a maker's curve for the flow and head above; do not read the size above as sufficient.`, REF.rule)
  }
  const pumps = L.calc('Number of transfer pumps', 'two for two or more homes (one working, one standby), else one; none for a borewell', input.water === 'borewell' ? 'borewell: the tank is filled by the borewell pump' : 'homes in the building: {h}; two pumps from {m} homes', { h: homes, m: R.homesForStandby }, (v) => (input.water === 'borewell' ? 0 : v.h >= v.m ? R.pumpsWithStandby : 1), { result: hasPump, ref: REF.rule, note: 'Two pumps, one working and one standby, for two or more homes is a NirmanShastra assumption. The NBC draft mentions standby pumps only for pressurised systems, so a standby pump is not claimed here as a code requirement.', expect: T.pumps })
  if (input.water === 'borewell') {
    L.say('Borewell', 'The borewell pump depends on the depth of water and is not sized here. The flow, head and power above only size the delivery pipe to the overhead tank; they are not a pump selection.', REF.rule)
  }
  const b5 = closeBlock('pump', '5.1 Pump flow, head and power')
  sections.push({
    id: 'pump', title: '5. Delivery pipe and transfer pump',
    intro: input.water === 'borewell'
      ? 'With a borewell there is no transfer pump in the report, but the line that carries the water up to the overhead tank is still sized and measured.'
      : 'The transfer pump lifts water from the underground tank to the overhead tank. Its flow, head and power are found as below and rounded up to a size sold.',
    blocks: [b5],
  })
  {
    const tt = tableOf('tanks')
    if (pumps > 0) {
      const r = rowOf(tt, 'Transfer pump')
      addTie('Pump: size', cellNums(r[1])[0], hp, 'HP', 2)
      addTie('Pump: number', cellNums(r[2])[0], pumps, '')
      addTie('Pump: flow', cellNums(r[4])[0], qLpm, 'L/min')
      addTie('Pump: head', cellNums(r[4])[1], headM, 'm', 1)
      const t = tileOf('Transfer pump')
      addTie('Transfer pump, size (headline figure)', cellNums(t.v)[0], hp, 'HP', 2)
      addTie('Transfer pump, number (headline figure)', cellNums(t.unit.replace('HP', ''))[0] ?? 1, pumps, '')
    } else if (hasRow(tt, 'Transfer pump')) L.mismatches.push('the report has a transfer pump but the sheet has none')
  }

  /* ═════════════ 6. supply pipe lengths and purchase ═════════════ */
  type Reg = { cat: string; dn: number; m: number }
  const sreg: Reg[] = []
  const sadd = (cat: string, dn: number, m: number) => { if (m > 0) sreg.push({ cat, dn, m }) }
  const ph = (i: number) => {
    const { b, k, w, d } = fx[i]
    const s = Math.sqrt(footM2[i] / homesOnFloor)
    return {
      s,
      hdr: R.headerSide * s + R.headerExtraBath * Math.max(0, b - 1),
      feed: b * R.feedPerBathM + (k > 0 ? R.feedKitchenM : 0),
      pts: b * R.pointsPerBath * R.pointM + (input.geyser ? b * R.geyserInletM : 0) + k * R.kitchenPointM + (w ? R.washerPointM : 0) + R.balconyPointM + (d ? R.diningPointM : 0),
      hot: input.geyser ? b * R.hotPointsPerBath * R.hotPointM : 0,
      coldPts: b * R.pointsPerBath + k + w + 1 + d,
      hotPts: input.geyser ? b * R.hotPointsPerBath : 0,
    }
  }
  const gE = gH
  const fe = fx[gE]
  const pe = ph(gE)
  L.say(`Worked example: pipe inside one home on ${floorName(gE)}`, 'Pipe lengths inside a home are not drawn: they follow from the size of the home and the number of bathrooms, kitchens and outlets. These are planning rules, not code values, and they are the least certain part of the report.', REF.rule)
  L.calc('Side of the home', 's = √(floor area ÷ homes on the floor)', '√({A:1} ÷ {h})', { A: footM2[gE], h: homesOnFloor }, (v) => Math.sqrt(v.A / v.h), { unit: 'm', ref: REF.rule, note: 'The home is taken as a square.', expect: pe.s })
  L.calc(`Header of one home: riser to the wet rooms (${headerDn[gE]} mm)`, 'Lh = a × s + c × max(0, b − 1)', '{a} × {s:2} + {c} × max(0, {b} − 1)', { a: R.headerSide, s: pe.s, c: R.headerExtraBath, b: fe.b }, (v) => v.a * v.s + v.c * Math.max(0, v.b - 1), { unit: 'm', ref: REF.rule, note: 'a is the share of the side of the home; c is the extra run for each bathroom after the first.', expect: pe.hdr })
  L.calc(`Feed of one home into the bathrooms and the kitchen (${R.feedDn} mm)`, 'Lf = b × Fb + Fk (if there is a kitchen)', '{b} × {Fb} + {Fk}', { b: fe.b, Fb: R.feedPerBathM, Fk: fe.k > 0 ? R.feedKitchenM : 0 }, (v) => v.b * v.Fb + v.Fk, { unit: 'm', ref: REF.rule, expect: pe.feed })
  L.calc(`Pipe to the cold outlets of one home (${R.pointDn} mm)`, 'Lc = b × n × p + b × g + k × pk + w × pw + pb + d × pd',
    '{b} × {n} × {p} + {b} × {g} + {k} × {pk} + {w} × {pw} + {pb} + {d} × {pd}',
    { b: fe.b, n: R.pointsPerBath, p: R.pointM, g: input.geyser ? R.geyserInletM : 0, k: fe.k, pk: R.kitchenPointM, w: fe.w, pw: R.washerPointM, pb: R.balconyPointM, d: fe.d, pd: R.diningPointM },
    (v) => v.b * v.n * v.p + v.b * v.g + v.k * v.pk + v.w * v.pw + v.pb + v.d * v.pd, { unit: 'm', ref: REF.rule, note: 'Per bathroom: WC cistern, basin, shower and health faucet (n outlets of p m each) and a geyser inlet (g m). Then the kitchen, the washer, the balcony tap and the dining basin.', expect: pe.pts })
  if (input.geyser) {
    L.calc(`Pipe to the hot outlets of one home (${R.pointDn} mm)`, 'Lhot = b × nh × ph', '{b} × {n} × {p}', { b: fe.b, n: R.hotPointsPerBath, p: R.hotPointM }, (v) => v.b * v.n * v.p, { unit: 'm', ref: REF.rule, note: 'Two hot outlets in each bathroom that has a geyser. Kitchen hot water is cold-only in this count.', expect: pe.hot })
  }
  const b6a = closeBlock('home-pipe', '6.1 Pipe inside a home')
  const b6b = closeBlock('home-pipe-floors', '6.2 Pipe inside one home, floor by floor', {
    table: {
      head: ['Floor', 'Homes on the floor', 'Side of home (m)', 'Header size', 'Header (m)', `Feed ${R.feedDn} mm (m)`, `Cold outlets ${R.pointDn} mm (m)`, `Hot outlets ${R.pointDn} mm (m)`],
      rows: fx.map((_f, i) => { const p = ph(i); return [floorName(i), homesOnFloor, fmt(p.s, 2), `${headerDn[i]} mm`, fmt(p.hdr, 2), fmt(p.feed, 2), fmt(p.pts, 2), fmt(p.hot, 2)] }),
      num: [1, 2, 4, 5, 6, 7],
      note: 'Metres for one home. The register below multiplies by the homes on the floor.',
    },
  })

  // the register of supply runs, in the order the model adds them
  for (let i = 0; i < N; i++) {
    const p = ph(i)
    for (let h = 0; h < homesOnFloor; h++) {
      sadd('hdr', headerDn[i], p.hdr)
      sadd('feed', R.feedDn, p.feed)
      sadd('pts', R.pointDn, p.pts)
      if (input.geyser) sadd('hot', R.pointDn, p.hot)
    }
  }
  L.say('Other supply runs', 'The riser, the terrace and garden taps, the delivery and suction pipes and the main are measured next. Each is a planning length.', REF.rule)
  const riserSeg = L.calc('Riser: one segment of floor height for each floor', 'segment = floor height', '{h}', { h: H_FLOOR }, (v) => v.h, { unit: 'm', ref: REF.rule, note: 'Each segment takes the size found for that floor in 4.4.' })
  for (let i = 0; i < N; i++) sadd('riser', riserDn[i], riserSeg)
  const standoff = L.calc(`Riser top: stand-off at the overhead tank and run across the terrace (${riserDn[top]} mm)`, 'L = stand-off + terrace run', '{a} + {b}', { a: R.standoffM, b: R.terraceRunM }, (v) => v.a + v.b, { unit: 'm', ref: REF.rule })
  sadd('riser', riserDn[top], standoff)
  const terraceFeed = L.calc(`Terrace tap feed (${R.feedDn} mm)`, 'L = feed × number of terrace taps', '{m} × {n}', { m: R.terraceTapM, n: terraceTaps }, (v) => v.m * v.n, { unit: 'm', ref: REF.rule })
  sadd('tap', R.feedDn, terraceFeed)
  if (gardenTaps) {
    const gardenFeed = L.calc(`Garden tap feed (${R.feedDn} mm)`, 'L = garden tap run', '{m}', { m: R.gardenTapM }, (v) => v.m, { unit: 'm', ref: REF.rule })
    sadd('tap', R.feedDn, gardenFeed)
  }
  sadd('deliv', deliveryDn, deliveryLen)
  L.say(`Delivery pipe (${deliveryDn} mm)`, `The delivery length of ${fmt(deliveryLen, 1)} m was found in section 5.`, REF.rule)
  let suctionDn = 0
  if (input.water !== 'borewell') {
    suctionDn = L.calc('Suction pipe size', 'one size larger than the delivery pipe', 'one size above {d} mm in the list of sizes', { d: deliveryDn }, (v) => Math.min(100, SUPPLY_DN[Math.min(SUPPLY_DN.length - 1, SUPPLY_DN.indexOf(v.d as typeof SUPPLY_DN[number]) + 1)]), { unit: 'mm', ref: REF.rule })
    const suctionM = L.calc(`Suction pipe length (${suctionDn} mm)`, 'L = length per pump × pumps', '{m} × {p}', { m: R.suctionM, p: pumps }, (v) => v.m * v.p, { unit: 'm', ref: REF.rule })
    sadd('suct', suctionDn, suctionM)
  }
  if (input.water === 'municipal') {
    const mainM = L.calc(`Water main to the underground tank (${R.mainDn} mm)`, 'L = planning length', '{m}', { m: R.mainM }, (v) => v.m, { unit: 'm', ref: REF.rule, note: 'The real length depends on where the main is; your local body fixes the point.' })
    sadd('main', R.mainDn, mainM)
  }
  if (input.water === 'tanker') {
    const fillM = L.calc(`Tanker filling pipe from the road (${R.tankerDn} mm)`, 'L = planning length', '{m}', { m: R.tankerM }, (v) => v.m, { unit: 'm', ref: REF.rule })
    sadd('main', R.tankerDn, fillM)
  }
  const b6c = closeBlock('other-runs', '6.3 Riser, taps, delivery, suction and main')

  // totals by size, in the model's own order, and by source of length
  const sByDn = new Map<number, number>()
  for (const r of sreg) bump(sByDn, r.dn, r.m)
  const supplyLines = [...sByDn.entries()].sort((a, b) => a[0] - b[0])
  const sCats: [string, string][] = [['hdr', 'Home header'], ['feed', 'Feed'], ['pts', 'Cold outlets'], ['hot', 'Hot outlets'], ['riser', 'Riser'], ['tap', 'Terrace and garden taps'], ['deliv', 'Delivery'], ['suct', 'Suction'], ['main', 'Main or filling']]
  const sCell = (cat: string, dn: number) => sreg.filter((r) => r.cat === cat && r.dn === dn).reduce((s, r) => s + r.m, 0)
  const usedCats = sCats.filter(([c]) => sreg.some((r) => r.cat === c))
  const supplyTotals: [number, number][] = []
  for (const [dn] of supplyLines) {
    const parts = usedCats.map(([c]) => sCell(c, dn)).filter((m) => m > 0)
    const eng = T.supplyLines.find(([d]) => d === dn)
    if (!eng) { L.mismatches.push(`supply pipe ${dn} mm is not in the model's list`); continue }
    const m = sumOf(`${dn} mm supply pipe: run`, 'Σ of the runs of this size', parts, { unit: 'm', expect: eng[1] }, 1)
    supplyTotals.push([dn, m])
  }
  if (supplyTotals.length !== T.supplyLines.length) L.mismatches.push(`supply pipe sizes: sheet ${supplyTotals.length} vs model ${T.supplyLines.length}`)
  const supplyM = sumOf('All sizes: run', 'Σ over the sizes', supplyTotals.map(([, m]) => m), { unit: 'm', expect: T.supplyM }, 1)
  const b6d = closeBlock('supply-reg', '6.4 Metres of supply pipe by size and by where it is used', {
    table: {
      head: ['Size', ...usedCats.map(([, n]) => n), 'Total (m)'],
      rows: supplyTotals.map(([dn, m]) => [`${dn} mm`, ...usedCats.map(([c]) => { const x = sCell(c, dn); return x > 0 ? fmt(x, 1) : '' }), fmt(m, 1)]),
      foot: ['All sizes', ...usedCats.map(([c]) => fmt(sreg.filter((r) => r.cat === c).reduce((s, r) => s + r.m, 0), 1)), fmt(supplyM, 1)],
      num: usedCats.map((_c, i) => i + 1).concat([usedCats.length + 1]),
    },
  })

  // purchase
  const big = supplyTotals.reduce((a, b) => (b[1] > a[1] ? b : a))
  const wasteM = L.calc(`${big[0]} mm: run with cutting waste (worked example)`, 'Lw = L × (1 + waste)', '{m:2} × {w}', { m: big[1], w: WASTE }, (v) => v.m * v.w, { unit: 'm', ref: REF.rule, note: 'Cutting waste of 5% on all pipe.' })
  const bigPieces = L.calc(`${big[0]} mm: whole ${PIECE_M} m lengths`, 'n = ceil(Lw ÷ length)', 'ceil({w:2} ÷ {p})', { w: wasteM, p: PIECE_M }, (v) => pieces(v.w, v.p), { ref: REF.rule, note: 'CPVC pipe is sold in 3, 5 or 6 m lengths (IS 15778); the model counts 3 m lengths.' })
  L.calc(`${big[0]} mm: to buy`, 'n × length', '{n} × {p}', { n: bigPieces, p: PIECE_M }, (v) => v.n * v.p, { unit: 'm', result: true })
  const sRows = supplyTotals.map(([dn, m]) => { const w = m * WASTE; const pc = pieces(w, PIECE_M); return { dn, m, w, pc, buy: pc * PIECE_M } })
  const supplyWaste = sumOf('All sizes: with cutting waste', 'Σ (run × (1 + waste))', sRows.map((r) => r.w), { unit: 'm' }, 1)
  const supplyPieces = sumOf('All sizes: 3 m lengths', 'Σ n', sRows.map((r) => r.pc), { result: true })
  const supplyBuyM = L.calc('All sizes: supply pipe to buy', 'Σ n × length', '{n} × {p}', { n: supplyPieces, p: PIECE_M }, (v) => v.n * v.p, { unit: 'm', result: true, expect: T.supplyBuyM })
  const b6e = closeBlock('supply-buy', '6.5 Supply pipe to buy, in whole 3 m lengths', {
    table: {
      head: ['Size', 'Run (m)', 'With cutting waste (m)', '3 m lengths', 'To buy'],
      rows: sRows.map((r) => [`${r.dn} mm`, fmt(r.m, 1), fmt(r.w, 1), r.pc, `${r.buy} m`]),
      foot: ['All sizes', fmt(supplyM, 1), fmt(supplyWaste, 1), String(supplyPieces), `${supplyBuyM} m`],
      num: [1, 2, 3, 4],
      note: 'If the plumber prefers uPVC for cold water (6 m lengths) or PPR, the metres stay the same and the number of lengths changes.',
    },
  })
  sections.push({
    id: 'supply', title: '6. Supply pipe: lengths and what to buy',
    intro: 'No drawing is used. Lengths follow from planning rules for the size of each home and the number of outlets; they are added by pipe size, 5% is added for cutting, and the total is rounded up to whole 3 m lengths.',
    blocks: [b6a, b6b, b6c, b6d, b6e],
  })
  {
    const st = tableOf('supply')
    for (const r of sRows) {
      const rr = rowOf(st, `${r.dn} mm`)
      same(`Supply ${r.dn} mm: run`, r.m, cellNums(rr[1])[0], 1)
      same(`Supply ${r.dn} mm: with waste`, r.w, cellNums(rr[2])[0], 1)
      same(`Supply ${r.dn} mm: lengths`, r.pc, cellNums(rr[3])[0])
      same(`Supply ${r.dn} mm: to buy`, r.buy, cellNums(rr[4])[0])
    }
    if (st.rows.length !== sRows.length) L.mismatches.push(`supply table rows: report ${st.rows.length} vs sheet ${sRows.length}`)
    const foot = st.foot ?? []
    addTie('Supply pipe: run, all sizes', cellNums(foot[1])[0], supplyM, 'm', 1)
    addTie('Supply pipe: with cutting waste', cellNums(foot[2])[0], supplyWaste, 'm', 1)
    addTie('Supply pipe: 3 m lengths', cellNums(foot[3])[0], supplyPieces, '')
    addTie('Supply pipe: to buy', cellNums(foot[4])[0], supplyBuyM, 'm')
    addTie('Water supply pipe to buy (headline figure)', cellNums(tileOf('Water supply pipe').v)[0], supplyBuyM, 'm')
  }

  /* ═════════════ 7. drainage ═════════════ */
  const floorStacks = bath.map((b) => Math.ceil(b / R.wcPerStack))
  L.say('Soil stacks', `The model counts one soil stack for every ${R.wcPerStack} WCs on a floor, so the stacks needed are the most WCs on any floor divided by ${R.wcPerStack}, rounded up, and at least one. The figure of ${R.wcPerStack} WCs to a stack is a NirmanShastra assumption; it is not a fixture-unit rule of IS 5329.`, REF.rule)
  const soilStacks = maxOf('Soil stacks', 'n = largest of 1 and ceil(WCs on a floor ÷ WCs per stack) over the floors', [1, ...floorStacks], { result: true, ref: REF.rule, expect: T.soilStacks })
  const wasteStacks = maxOf('Waste stacks', 'n = largest of 1 and the kitchens on a floor', [1, ...kit], { ref: REF.rule, note: 'One waste stack for each kitchen on the floor with the most kitchens.', expect: T.wasteStacks })
  const stackH = L.calc('Height of a stack', 'H = floors × floor height + foot below the slab + top above the roof', '{N} × {h} + {f} + {t}', { N, h: H_FLOOR, f: R.stackFootM, t: R.stackAboveRoofM }, (v) => v.N * v.h + v.f + v.t, { unit: 'm', ref: REF.stackTop, note: 'The stack goes above the roof to vent; the foot is taken below the slab. Both lengths are planning lengths.', expect: T.stackH })
  const ventStacks = L.calc('Vent stacks', 'one beside each soil stack from this many floors up', 'floors in the building: {N}; a vent stack from {v} floors up', { N, v: R.ventFromFloors }, (v) => (v.N >= v.v ? soilStacks : 0), { ref: REF.vent, note: `The research notes give IS 5329 as allowing a single stack without a vent up to five storeys, so the model adds a vent stack from ${R.ventFromFloors} floors up.`, expect: T.ventStacks })
  const b7a = closeBlock('stacks', '7.1 Stacks', {
    table: {
      head: ['Floor', 'Bathrooms on the floor', 'Stacks needed', 'Kitchens on the floor'],
      rows: bath.map((b, i) => [floorName(i), b, floorStacks[i], kit[i]]),
      num: [1, 2, 3],
    },
  })

  const dreg: Reg[] = []
  const dadd = (cat: string, dn: number, m: number) => { dreg.push({ cat, dn, m }) }
  const sSoil = L.calc(`Soil stacks (${R.soilDn} mm)`, 'L = stacks × H', '{n} × {h:1}', { n: soilStacks, h: stackH }, (v) => v.n * v.h, { unit: 'm', ref: REF.rule })
  dadd('stack', R.soilDn, sSoil)
  const sWaste = L.calc(`Waste stacks (${R.wasteDn} mm)`, 'L = stacks × H', '{n} × {h:1}', { n: wasteStacks, h: stackH }, (v) => v.n * v.h, { unit: 'm', ref: REF.rule })
  dadd('stack', R.wasteDn, sWaste)
  if (ventStacks) {
    const sVent = L.calc(`Vent stacks (${R.smallDn} mm)`, 'L = stacks × (floors × floor height + top above the roof)', '{n} × ({N} × {h} + {t})', { n: ventStacks, N, h: H_FLOOR, t: R.stackAboveRoofM }, (v) => v.n * (v.N * v.h + v.t), { unit: 'm', ref: REF.rule })
    dadd('stack', R.smallDn, sVent)
  }
  const bathrooms = wc
  const kitchensN = sinks
  const bWc = L.calc(`WC branches (${R.soilDn} mm)`, 'L = WCs × branch length', '{n} × {m}', { n: bathrooms, m: R.wcBranchM }, (v) => v.n * v.m, { unit: 'm', ref: REF.rule })
  dadd('branch', R.soilDn, bWc)
  const bBath = L.calc(`Shower and floor-trap branches (${R.wasteDn} mm)`, 'L = bathrooms × branch length', '{n} × {m}', { n: bathrooms, m: R.bathBranchM }, (v) => v.n * v.m, { unit: 'm', ref: REF.rule })
  dadd('branch', R.wasteDn, bBath)
  const bBasin = L.calc(`Basin waste (${R.basinDn} mm)`, 'L = basins × waste length', '{n} × {m}', { n: basins, m: R.basinWasteM }, (v) => v.n * v.m, { unit: 'm', ref: REF.rule })
  dadd('branch', R.basinDn, bBasin)
  const bKit = L.calc(`Kitchen, washer and balcony waste (${R.smallDn} mm)`, 'L = kitchens × Lk + washers × Lw + balcony taps × Lb', '{k} × {Lk} + {w} × {Lw} + {b} × {Lb}', { k: kitchensN, Lk: R.kitchenWasteM, w: washers, Lw: R.washerWasteM, b: balconyTaps, Lb: R.balconyWasteM }, (v) => v.k * v.Lk + v.w * v.Lw + v.b * v.Lb, { unit: 'm', ref: REF.rule })
  dadd('branch', R.smallDn, bKit)
  const bOver = L.calc(`Overflow and scour pipes at the tanks (${R.smallDn} mm)`, 'L = tanks × length', '{n} × {m}', { n: tankCount, m: R.tankOverflowM }, (v) => v.n * v.m, { unit: 'm', ref: REF.rule })
  dadd('overflow', R.smallDn, bOver)
  const b7b = closeBlock('drain-branches', '7.2 Stacks and branches')

  const dfuBath = DFU.bathroom + DFU.floorTrap
  const fuTotal = L.calc('Drainage fixture units on the building drain', 'FU = WCs × (Ub + Ut) + kitchens × (Us + Ut) + washers × Uw + balcony traps × Ut',
    '{wc} × ({Ub} + {Ut}) + {k} × ({Us} + {Ut}) + {w} × {Uw} + {b} × {Ut}',
    { wc: bathrooms, Ub: DFU.bathroom, Ut: DFU.floorTrap, k: kitchensN, Us: DFU.sink, w: washers, Uw: DFU.washer, b: balconyTaps },
    (v) => v.wc * (v.Ub + v.Ut) + v.k * (v.Us + v.Ut) + v.w * v.Uw + v.b * v.Ut, { unit: 'units', ref: REF.dfu, note: 'Ub: bathroom group with a flush-tank WC; Ut: floor trap; Us: kitchen sink; Uw: washing machine. IS 1742 Table 1 lists no washing machine; the model uses the combination sink-and-tray value. The dining wash basin is not counted: the model gives it no drainage fixture units (a simplification in the engine).', expect: T.fuTotal })
  const drainDn = L.calc('Building drain size', 'smaller size up to its limit, else the next size', '{fu:0} units against a limit of {lim} units for {a} mm', { fu: fuTotal, lim: R.drain110MaxFu, a: R.soilDn }, (v) => (v.fu <= v.lim ? R.soilDn : R.bigDrainDn), { unit: 'mm', ref: REF.loads, note: 'At a fall of 1 in 100 a 100 mm drain takes 180 units and a 150 mm drain 700 units. The model buys SWR in 110 and 160 mm and uses the 100 mm and 150 mm values for them.', expect: T.drainDn })
  const perInterval = Math.max(...bath.map((b) => Math.ceil(b / soilStacks))) * dfuBath
  const stackTotal = (bathrooms * dfuBath) / soilStacks
  L.calc('Load on one soil stack at a floor', 'FU = WCs per stack at a floor × (Ub + Ut)', '{n} × ({Ub} + {Ut})', { n: Math.max(...bath.map((b) => Math.ceil(b / soilStacks))), Ub: DFU.bathroom, Ut: DFU.floorTrap }, (v) => v.n * (v.Ub + v.Ut), { unit: 'units', ref: REF.loads, note: `Limit ${FU_LIMITS.interval} units for one floor of a stack: ${perInterval <= FU_LIMITS.interval ? 'within the limit' : 'OVER THE LIMIT'}.` })
  L.calc('Load on one soil stack in all', 'FU = WCs × (Ub + Ut) ÷ soil stacks', '{wc} × ({Ub} + {Ut}) ÷ {s}', { wc: bathrooms, Ub: DFU.bathroom, Ut: DFU.floorTrap, s: soilStacks }, (v) => (v.wc * (v.Ub + v.Ut)) / v.s, { unit: 'units', ref: REF.loads, note: `Limit ${FU_LIMITS.stack} units on a stack, the one figure the model uses for every building height: ${stackTotal <= FU_LIMITS.stack ? 'within the limit' : 'OVER THE LIMIT'}. The building drain is checked against ${FU_LIMITS.drain} units, the most that the largest drain size in the list takes (160 mm, read as the 150 mm value); the size chosen above is the smallest that carries the load: ${fuTotal <= FU_LIMITS.drain ? 'within the limit' : 'OVER THE LIMIT'}.` })
  const drainRun = L.calc('Building drain length', 'L = stacks × run from stack foot to chamber + run to the plot edge', '({s} + {w}) × {a} + {e}', { s: soilStacks, w: wasteStacks, a: R.stackToChamberM, e: R.plotEdgeM }, (v) => (v.s + v.w) * v.a + v.e, { unit: 'm', ref: REF.rule, expect: T.drainRun })
  dadd('drain', drainDn, drainRun)
  const chambers = L.calc('Inspection chambers', 'n = stacks + 1 at the outlet + floor(drain length ÷ spacing)', '{s} + {w} + 1 + floor({r:1} ÷ {c})', { s: soilStacks, w: wasteStacks, r: drainRun, c: R.chamberEveryM }, (v) => v.s + v.w + 1 + Math.floor(v.r / v.c), { result: true, ref: REF.chamber, note: 'IS 1742 requires a chamber where a drain changes direction, gradient or size; the 30 m spacing and the count at each stack foot are planning rules.', expect: T.chambers })
  const b7c = closeBlock('drain-load', '7.3 Load on the stacks, the building drain and the chambers')
  sections.push({
    id: 'drainage', title: '7. Drainage',
    intro: 'Soil and waste stacks, the branches to each fixture, the building drain and the inspection chambers. Two loads are checked against the fixture-unit limits of IS 1742: the load on one soil stack (at a floor and in all) and the load on the building drain, which also sets the drain size. The waste stack, the branches and the vent stacks are not load-checked.',
    blocks: [b7a, b7b, b7c],
  })

  {
    addTie('Soil stacks', cellNums(factOf('Soil stacks').v)[0], soilStacks, '')
    const dl = free.checks.find((c) => c.id === 'drainload')?.detail ?? ''
    const carries = /carries ([\d,.]+) fixture units/.exec(dl)
    const takes = /yours takes ([\d,.]+) and ([\d,.]+)/.exec(dl)
    if (!carries || !takes) L.mismatches.push('the drain-load check in the report could not be read')
    else {
      const n = (x: string) => Number(x.replace(/,/g, ''))
      addTie('Drain load: fixture units on the building drain', n(carries[1]), fuTotal, 'units')
      addTie('Drain load: one soil stack, one floor', n(takes[1]), perInterval, 'units')
      addTie('Drain load: one soil stack, in all', n(takes[2]), stackTotal, 'units')
    }
  }

  /* ═════════════ 8. septic tank and soak pit, or the sewer ═════════════ */
  const users = people
  const b8: CalcBlock[] = []
  let septicVol = 0
  let septicOut: { count: number; vM3: number; l: number; b: number; dM: number; chambers: number; exc: number } | null = null
  let pitOut: { count: number; dia: number; depth: number; area: number; exc: number } | null = null
  let effluentL = 0
  if (!input.sewer) {
    effluentL = L.calc('Waste water leaving the homes in a day', 'E = people × litres per person', '{p} × {e}', { p: users, e: R.effluentLpcd }, (v) => v.p * v.e, { unit: 'L', result: true, ref: REF.rule, note: 'The model takes 108 L a day of the water used as waste water, whatever the water source.', expect: T.effluentL })
    const uRead = L.calc('Users read from the table', 'between the table\'s fewest and most users', 'between {lo} and {hi}; people served: {u}', { lo: R.septicMinUsers, hi: R.septicMaxUsers, u: users }, (v) => Math.max(v.lo, Math.min(v.hi, v.u)), { ref: REF.septicVol, note: 'A number of users below the first row of the table is read as the first row, and a number above the last row as the last row. What lies beyond the table is the model\'s own extension (see the warning below when it applies).' })
    if (users > R.septicMaxUsers) {
      L.say('Warning: more people than the table covers', `The IS 2470 table stops at ${R.septicMaxUsers} users. For a larger number the model reads the last row and then adds a day's detention of the other waste water for every person. The volume above the table is the tool's own extension, not a table value, and is likely to be too small. A building of this size needs a designed treatment plant or a sewer.`, REF.rule)
    }
    const vTable = interpLine('Tank volume from the table (WC discharge only)', SEPTIC_V, uRead, false, { unit: 'm³', ref: REF.septicVol, note: 'IS 2470 Part 1 Appendix A (Tables 5 and 6) gives the tank dimensions for a number of users, for desludging every two years and the discharge of water closets only. It prints dimensions, not volumes: the volume here is the model\'s own length × width × liquid depth from those dimensions.' })
    const vComb = L.calc('Volume with the other waste water', 'V = larger of (least volume, table volume + people × allowance)', 'larger of {m} and {t:2} + {p} × {a}', { m: R.septicMinM3, t: vTable, p: users, a: R.septicOtherM3 }, (v) => Math.max(v.m, v.t + v.p * v.a), { unit: 'm³', ref: REF.rule, note: 'The table counts WC discharge only; the addition of a day\'s detention of the other waste water is the model\'s own. The 1,000 litre minimum is IS 2470 Part 1 cl 3.4.5.1.' })
    const count = L.calc('Number of septic tanks', 'one tank for up to this many people, else equal tanks', 'people: {p}; one tank takes up to {m} people', { p: users, m: R.septicUsersEach }, (v) => (v.p > v.m ? Math.ceil(v.p / v.m) : 1), { ref: REF.rule, note: `One tank for up to ${R.septicUsersEach} people and equal tanks above that is the model's rule, not a rule of the standard.`, expect: T.septic!.count })
    const v1 = L.calc('Liquid volume of one tank', 'v = V ÷ n', '{V:2} ÷ {n}', { V: vComb, n: count }, (v) => v.V / v.n, { unit: 'm³' })
    const d = L.calc('Liquid depth', 'depth by the size of the tank', '{v:2} m³ against {v1} and {v2}', { v: v1, v1: R.septicV1, v2: R.septicV2 }, (v) => (v.v <= R.septicV1 ? R.septicD1 : v.v <= R.septicV2 ? R.septicD2 : R.septicD3), { unit: 'm', ref: REF.septicDim, note: `Depth ${R.septicD1} m up to ${R.septicV1} m³, ${R.septicD2} m up to ${R.septicV2} m³, then ${R.septicD3} m. The least liquid depth in IS 2470 is 1 m.` })
    const bw = L.calc('Width', 'b = roundup(max(least width, √(v ÷ (d × length-to-width))), step)', 'roundup(max({m}, √({v:2} ÷ ({d} × {r}))), {s})', { m: R.septicMinB, v: v1, d, r: R.septicLtoB, s: R.dimStep }, (v) => ceilTo(Math.max(v.m, Math.sqrt(v.v / (v.d * v.r))), v.s), { unit: 'm', ref: REF.septicDim, note: 'Least width 750 mm (cl 3.4.5.1). The first try is a length of three times the width.', expect: T.septic!.bM })
    const lg = L.calc('Length', 'l = max(roundup(v ÷ (d × b), step), shortest allowed × b)', 'max(roundup({v:2} ÷ ({d} × {b:2}), {s}), {r} × {b:2})', { v: v1, d, b: bw, s: R.dimStep, r: R.septicMinLtoB }, (v) => Math.max(ceilTo(v.v / (v.d * v.b), v.s), v.r * v.b), { unit: 'm', ref: REF.septicDim, note: 'Length 2 to 4 times the width (cl 3.4.5.2).', expect: T.septic!.lM })
    const dIn = L.calc('Depth inside', 'D = liquid depth + free board', '{d} + {f}', { d, f: R.freeboardM }, (v) => v.d + v.f, { unit: 'm', ref: REF.septicDim, note: 'Free board 300 mm (cl 3.4.8).', expect: T.septic!.dM })
    const chs = L.calc('Chambers', 'two above a volume, else one', '{v:2} m³ against {m} m³', { v: v1, m: R.twoChamberAboveM3 }, (v) => (v.v > v.m ? 2 : 1), { note: 'Two chambers, the first twice the second, when the tank is large.', ref: REF.rule, expect: T.septic!.chambers })
    septicVol = L.calc('Septic tank liquid volume, all tanks', 'V = v × n', '{v:2} × {n}', { v: v1, n: count }, (v) => v.v * v.n, { unit: 'm³', result: true, expect: T.septic!.vM3 })
    const exc = L.calc('Digging for the tank', 'X = n × (l + w) × (b + w) × (d + e)', '{n} × ({l:2} + {w}) × ({b:2} + {w}) × ({d} + {e})', { n: count, l: lg, w: R.tankWorkM, b: bw, d, e: R.tankDigExtraM }, (v) => v.n * (v.l + v.w) * (v.b + v.w) * (v.d + v.e), { unit: 'm³', result: true, ref: REF.rule, note: 'Working space round the tank in length and in width, and extra depth below the liquid level.', expect: T.septic!.excavM3 })
    septicOut = { count, vM3: septicVol, l: lg, b: bw, dM: dIn, chambers: chs, exc }
    b8.push(closeBlock('septic', '8.1 Septic tank'))

    const rate = SOIL[input.soil].rate
    L.value('Rate of application of the ground', rate, 'L/m²/day', 0, REF.soak, `Ground: ${SOIL[input.soil].label}. The table is read at ${SOIL[input.soil].min} minutes for the water to fall 25 mm (the figure chosen for this class of ground).`)
    const area = L.calc('Wall area needed', 'A = E ÷ rate', '{E:0} ÷ {r}', { E: effluentL, r: rate }, (v) => v.E / v.r, { unit: 'm²', result: true, ref: REF.soak, expect: T.pit!.areaM2 })
    const nPits = L.calc('Number of soak pits', 'n = ceil(A ÷ (π × d × deepest wall counted))', 'ceil({A:1} ÷ (π × {d} × {h}))', { A: area, d: R.pitDia, h: R.pitMaxDepthM }, (v) => Math.max(1, Math.ceil(v.A / (Math.PI * v.d * v.h))), { result: true, ref: REF.rule, note: `Pit diameter ${R.pitDia} m; no more than ${R.pitMaxDepthM} m of wall is counted in one pit.`, expect: T.pit!.count })
    const eff = L.calc('Wall depth needed in each pit', 'h = A ÷ (n × π × d)', '{A:1} ÷ ({n} × π × {d})', { A: area, n: nPits, d: R.pitDia }, (v) => v.A / (v.n * Math.PI * v.d), { unit: 'm' })
    const depth = L.calc('Depth of each pit below the inlet pipe', 'D = larger of (least depth, h) + depth below the pipe', 'larger of {m} and {h:2}, plus {p}', { m: R.pitMinDepthM, h: eff, p: R.pitBelowPipeM }, (v) => Math.max(v.m, v.h) + v.p, { unit: 'm', result: true, ref: REF.rule, expect: T.pit!.depthM })
    const excP = L.calc('Digging for the pits', 'X = n × π × (d ÷ 2 + w)² × D', '{n} × π × ({d} ÷ 2 + {w})² × {D:2}', { n: nPits, d: R.pitDia, w: R.pitWorkM, D: depth }, (v) => v.n * Math.PI * (v.d / 2 + v.w) ** 2 * v.D, { unit: 'm³', ref: REF.rule, note: 'Working space beyond the lining.', expect: T.pit!.excavM3 })
    const excAll = L.calc('Digging for the tank and the pits', 'X = tank + pits', '{a:1} + {b:1}', { a: exc, b: excP }, (v) => v.a + v.b, { unit: 'm³', result: true })
    L.calc(`Pipe from the tank to the soak pit (${R.soilDn} mm)`, 'L = planning length', '{m}', { m: R.connectionM }, (v) => v.m, { unit: 'm', ref: REF.rule })
    dadd('connection', R.soilDn, R.connectionM)
    pitOut = { count: nPits, dia: R.pitDia, depth, area, exc: excAll }
    L.say('Ground', input.soil === 'poor' ? 'Slow-draining ground is not suitable for a soak pit (IS 2470 Part 2: slower than 30 minutes for the water to fall 25 mm). The pit is sized from the slowest rate in the table, so the quantity is a floor and not a promise. A percolation test or a sewer connection is needed.' : 'The rate of application depends on the ground you chose. Only a percolation test on the plot gives the true figure.', REF.soak)
    b8.push(closeBlock('soak', '8.2 Soak pit'))
  } else {
    L.calc(`Connection from the last chamber to the public sewer (${R.soilDn} mm)`, 'L = planning length', '{m}', { m: R.connectionM }, (v) => v.m, { unit: 'm', ref: REF.rule, note: 'The real length depends on where the sewer is; your local body fixes the point of connection.' })
    dadd('connection', R.soilDn, R.connectionM)
    b8.push(closeBlock('sewer', '8.1 Sewer connection'))
  }
  sections.push({
    id: 'disposal', title: input.sewer ? '8. Sewer connection' : '8. Septic tank and soak pit',
    intro: input.sewer
      ? 'A public sewer runs past the plot, so the waste connects to it and no septic tank or soak pit is counted.'
      : 'With no sewer, the waste goes to a septic tank and then to a soak pit on the plot (IS 2470). From the standard come the tank dimensions for a number of users, the least sizes and the rate at which ground takes water; the volumes, the number of tanks and pits and their sizes are worked out by the model from the people served and the ground you chose.',
    blocks: b8,
  })
  if (septicOut && pitOut) {
    const sp = tableOf('septic')
    const st = rowOf(sp, 'Septic tank')
    const sn = cellNums(st[2])
    addTie('Septic tank: number', cellNums(st[1])[0], septicOut.count, '')
    addTie('Septic tank: length inside', sn[0], septicOut.l, 'm', 2)
    addTie('Septic tank: width inside', sn[1], septicOut.b, 'm', 2)
    addTie('Septic tank: depth inside', sn[2], septicOut.dM, 'm', 2)
    if (String(st[2]).includes('two chambers') !== (septicOut.chambers === 2)) L.mismatches.push('septic tank chambers differ from the report')
    addTie('Septic tank: liquid volume', cellNums(st[3])[0], septicOut.vM3, 'm³', 1)
    const sk = rowOf(sp, 'Soak pit')
    const kn = cellNums(sk[2])
    const kb = cellNums(sk[3])
    addTie('Soak pit: number', cellNums(sk[1])[0], pitOut.count, '')
    addTie('Soak pit: diameter', kn[0], pitOut.dia, 'm', 1)
    addTie('Soak pit: depth', kn[1], pitOut.depth, 'm', 1)
    addTie('Soak pit: waste water a day', kb[0], effluentL, 'L')
    addTie('Soak pit: wall area', kb[1], pitOut.area, 'm²', 1)
    addTie('Soak pit: rate of application', kb[2], SOIL[input.soil].rate, 'L/m²/day')
    const dg = rowOf(sp, 'Digging for the tank and pit')
    addTie('Digging for the tank and pit', cellNums(dg[2])[0], pitOut.exc, 'm³', 1)
  } else {
    const sw = tableOf('sewer')
    const r = sw.rows[0]
    const rn = cellNums(r[2])
    addTie('Sewer connection: pipe size', rn[0], R.soilDn, 'mm')
    addTie('Sewer connection: length', rn[1], R.connectionM, 'm')
  }

  /* ═════════════ 9. rain-water down-pipes ═════════════ */
  L.value('Rain in the heaviest hour', RAIN_INTENSITY[input.rain], 'mm per hour', 0, REF.answer, `${RAIN_LABEL[input.rain]}. IS 1742 gives no rainfall for each town, so this is the figure you chose.`)
  const a75 = DOWNPIPE_AREA[75][RAIN_INTENSITY[input.rain]]
  const a100 = DOWNPIPE_AREA[100][RAIN_INTENSITY[input.rain]]
  L.value('Roof drained by one 75 mm pipe', a75, 'm²', 1, REF.rain)
  L.value('Roof drained by one 100 mm pipe', a100, 'm²', 1, REF.rain)
  const n75 = L.calc('75 mm pipes needed', 'n = ceil(roof ÷ area drained by one pipe), at least the fewest allowed', 'larger of {m} and ceil({R:1} ÷ {a})', { m: R.minDownpipes, R: roofM2, a: a75 }, (v) => Math.max(v.m, Math.ceil(v.R / v.a)), { ref: REF.rain })
  const dpDn = L.calc('Down-pipe size', 'use 100 mm when 75 mm pipes would be more than the limit', '75 mm pipes needed: {n}; most allowed before 100 mm is used: {m}', { n: n75, m: R.maxDownpipes75 }, (v) => (v.n > v.m ? 100 : 75), { unit: 'mm', ref: REF.rule, note: 'The model moves to 100 mm pipes when more than four 75 mm pipes would be needed.', expect: T.dpDn })
  const dpN = L.calc('Number of down-pipes', 'n = ceil(roof ÷ area drained by one pipe of the chosen size), at least the fewest allowed', 'larger of {m} and ceil({R:1} ÷ {a})', { m: R.minDownpipes, R: roofM2, a: dpDn === 100 ? a100 : a75 }, (v) => Math.max(v.m, Math.ceil(v.R / v.a)), { result: true, ref: REF.rain, expect: T.dpN })
  const dpBuy = L.calc('Pipe size bought', 'uPVC SWR is sold in 75 and 110 mm; 110 mm drains at least what 100 mm does', 'a {d} mm design pipe is bought as {b} mm', { d: dpDn, b: dpDn === 100 ? 110 : 75 }, (v) => (v.d === 100 ? 110 : 75), { unit: 'mm', result: true, ref: REF.rule, expect: T.dpBuy })
  const dpEach = L.calc('Length of each down-pipe', 'L = floors × floor height + extra', '{N} × {h} + {e}', { N, h: H_FLOOR, e: R.downpipeExtraM }, (v) => v.N * v.h + v.e, { unit: 'm', result: true, ref: REF.rule })
  const dpLen = L.calc('Down-pipe length in all', 'L = n × length of each', '{n} × {l:1}', { n: dpN, l: dpEach }, (v) => v.n * v.l, { unit: 'm', ref: REF.rule, expect: T.dpLen })
  dadd('rain', dpBuy, dpLen)
  const b9a = closeBlock('rain', '9.1 Down-pipes for the roof')
  const b9b = closeBlock('rain-table', '9.2 Roof area one down-pipe drains', {
    table: {
      head: ['Rain (mm per hour)', '75 mm pipe (m²)', '100 mm pipe (m²)'],
      rows: (Object.values(RAIN_INTENSITY) as number[]).map((i) => [String(i), fmt(DOWNPIPE_AREA[75][i], 1), fmt(DOWNPIPE_AREA[100][i], 1)]),
      num: [0, 1, 2],
      note: 'The extract of IS 1742 Table 5 that the model uses.',
    },
  })
  sections.push({
    id: 'rain', title: '9. Rain-water down-pipes',
    intro: 'The roof is taken as the largest floor. The number of down-pipes follows from the rain you chose and the area one pipe drains; gutters, terrace slopes and storage are not designed.',
    blocks: [b9a, b9b],
  })
  {
    const rt = tableOf('rain')
    const r = rowOf(rt, 'Down-pipes')
    const sz = cellNums(r[2])
    const bs = cellNums(r[3])
    addTie('Down-pipes: number', cellNums(r[1])[0], dpN, '')
    addTie('Down-pipes: size', sz[0], dpBuy, 'mm')
    addTie('Down-pipes: length of each', sz[1], dpEach, 'm', 1)
    addTie('Down-pipes: roof area', bs[0], roofM2, 'm²')
    addTie('Down-pipes: rain in the heaviest hour', bs[1], RAIN_INTENSITY[input.rain], 'mm')
    addTie('Down-pipes: size of design pipe', bs[2], dpDn, 'mm')
    addTie('Down-pipes: area one pipe drains', bs[3], dpDn === 100 ? a100 : a75, 'm²', 1)
    addTie('Rain-water down-pipes (summary line)', cellNums(factOf('Rain water').v)[0], dpN, '')
  }

  /* ═════════════ 10. drain and rain pipe: lengths and purchase ═════════════ */
  const dByDn = new Map<number, number>()
  for (const r of dreg) bump(dByDn, r.dn, r.m)
  const drainLines = [...dByDn.entries()].sort((a, b) => a[0] - b[0])
  const dCats: [string, string][] = [['stack', 'Stacks'], ['branch', 'Branches'], ['overflow', 'Tank overflow'], ['drain', 'Building drain'], ['connection', 'Pipe to sewer or pit'], ['rain', 'Rain down-pipes']]
  const dCell = (cat: string, dn: number) => dreg.filter((r) => r.cat === cat && r.dn === dn).reduce((s, r) => s + r.m, 0)
  const dUsed = dCats.filter(([c]) => dreg.some((r) => r.cat === c))
  const drainTotals: [number, number][] = []
  for (const [dn] of drainLines) {
    const parts = dUsed.map(([c]) => dCell(c, dn)).filter((m) => m > 0)
    const eng = T.drainLines.find(([d]) => d === dn)
    if (!eng) { L.mismatches.push(`drain pipe ${dn} mm is not in the model's list`); continue }
    drainTotals.push([dn, sumOf(`${dn} mm drain or rain pipe: run`, 'Σ of the runs of this size', parts, { unit: 'm', expect: eng[1] }, 1)])
  }
  if (drainTotals.length !== T.drainLines.length) L.mismatches.push(`drain pipe sizes: sheet ${drainTotals.length} vs model ${T.drainLines.length}`)
  const drainM = sumOf('All sizes: run', 'Σ over the sizes', drainTotals.map(([, m]) => m), { unit: 'm', expect: T.drainM }, 1)
  const b10a = closeBlock('drain-reg', '10.1 Metres of drain and rain pipe by size and by where it is used', {
    table: {
      head: ['Size', ...dUsed.map(([, n]) => n), 'Total (m)'],
      rows: drainTotals.map(([dn, m]) => [`${dn} mm`, ...dUsed.map(([c]) => { const x = dCell(c, dn); return x > 0 ? fmt(x, 1) : '' }), fmt(m, 1)]),
      foot: ['All sizes', ...dUsed.map(([c]) => fmt(dreg.filter((r) => r.cat === c).reduce((s, r) => s + r.m, 0), 1)), fmt(drainM, 1)],
      num: dUsed.map((_c, i) => i + 1).concat([dUsed.length + 1]),
      note: 'The 110 mm size includes the soil stacks, the WC branches, the pipe to the soak pit or sewer and, when the down-pipes are bought as 110 mm, the down-pipes.',
    },
  })
  const dBig = drainTotals.reduce((a, b) => (b[1] > a[1] ? b : a))
  const dW = L.calc(`${dBig[0]} mm: run with cutting waste (worked example)`, 'Lw = L × (1 + waste)', '{m:2} × {w}', { m: dBig[1], w: WASTE }, (v) => v.m * v.w, { unit: 'm', ref: REF.rule, note: 'SWR pipe is sold in 3 m lengths.' })
  const dP = L.calc(`${dBig[0]} mm: whole ${PIECE_M} m lengths`, 'n = ceil(Lw ÷ length)', 'ceil({w:2} ÷ {p})', { w: dW, p: PIECE_M }, (v) => pieces(v.w, v.p), { ref: REF.rule })
  L.calc(`${dBig[0]} mm: to buy`, 'n × length', '{n} × {p}', { n: dP, p: PIECE_M }, (v) => v.n * v.p, { unit: 'm', result: true })
  const dRows = drainTotals.map(([dn, m]) => { const w = m * WASTE; const pc = pieces(w, PIECE_M); return { dn, m, w, pc, buy: pc * PIECE_M } })
  const drainWaste = sumOf('All sizes: with cutting waste', 'Σ (run × (1 + waste))', dRows.map((r) => r.w), { unit: 'm' }, 1)
  const drainPieces = sumOf('All sizes: 3 m lengths', 'Σ n', dRows.map((r) => r.pc), { result: true })
  const drainBuyM = L.calc('All sizes: drain and rain pipe to buy', 'Σ n × length', '{n} × {p}', { n: drainPieces, p: PIECE_M }, (v) => v.n * v.p, { unit: 'm', result: true, expect: T.drainBuyM })
  const b10b = closeBlock('drain-buy', '10.2 Drain and rain pipe to buy, in whole 3 m lengths', {
    table: {
      head: ['Size', 'Run (m)', 'With cutting waste (m)', '3 m lengths', 'To buy'],
      rows: dRows.map((r) => [`${r.dn} mm`, fmt(r.m, 1), fmt(r.w, 1), r.pc, `${r.buy} m`]),
      foot: ['All sizes', fmt(drainM, 1), fmt(drainWaste, 1), String(drainPieces), `${drainBuyM} m`],
      num: [1, 2, 3, 4],
    },
  })
  sections.push({
    id: 'drain-buy', title: '10. Drain and rain pipe: lengths and what to buy',
    intro: 'The runs found in sections 7 to 9 are added by pipe size, 5% is added for cutting, and the total is rounded up to whole 3 m lengths.',
    blocks: [b10a, b10b],
  })
  {
    const dt = tableOf('drain')
    for (const r of dRows) {
      const rr = rowOf(dt, `${r.dn} mm`)
      same(`Drain ${r.dn} mm: run`, r.m, cellNums(rr[1])[0], 1)
      same(`Drain ${r.dn} mm: with waste`, r.w, cellNums(rr[2])[0], 1)
      same(`Drain ${r.dn} mm: lengths`, r.pc, cellNums(rr[3])[0])
      same(`Drain ${r.dn} mm: to buy`, r.buy, cellNums(rr[4])[0])
    }
    if (dt.rows.length !== dRows.length) L.mismatches.push(`drain table rows: report ${dt.rows.length} vs sheet ${dRows.length}`)
    const foot = dt.foot ?? []
    addTie('Drain and rain pipe: run, all sizes', cellNums(foot[1])[0], drainM, 'm', 1)
    addTie('Drain and rain pipe: with cutting waste', cellNums(foot[2])[0], drainWaste, 'm', 1)
    addTie('Drain and rain pipe: 3 m lengths', cellNums(foot[3])[0], drainPieces, '')
    addTie('Drain and rain pipe: to buy', cellNums(foot[4])[0], drainBuyM, 'm')
    addTie('Drain and rain pipe to buy (headline figure)', cellNums(tileOf('Drain and rain pipe').v)[0], drainBuyM, 'm')
  }

  /* ═════════════ 11. fittings, valves, traps and fixtures ═════════════ */
  const fitSheet = new Map<string, number>()
  const traceFit = new Map(T.fit)
  const fl = (name: string, formula: string, working: string, vars: Vars, fn: (v: Vars) => number, o: CalcOpts = {}) => {
    const n = L.calc(name, formula, working, vars, fn, { unit: 'nos', dp: 0, ref: REF.eng, ...o })
    if (!traceFit.has(name)) L.mismatches.push(`fitting "${name}" is not in the model's list`)
    else L.compare(`${name}: number`, n, traceFit.get(name)!)
    bump(fitSheet, name, n)
    return n
  }
  const coldOutletsF = fx.map((_f, i) => ph(i).coldPts * homesOnFloor)
  const hotOutletsF = fx.map((_f, i) => ph(i).hotPts * homesOnFloor)
  const coldOutlets = sumOf('Cold outlets in all', 'Σ over floors of (outlets in a home × homes)', coldOutletsF, { ref: REF.eng, expect: T.coldOutlets })
  const hotOutlets = sumOf('Hot outlets in all', 'Σ over floors of (hot outlets in a home × homes)', hotOutletsF, { ref: REF.eng, expect: T.hotOutlets })
  L.say('Outlets in a home', `Cold outlets in one home: bathrooms × ${R.pointsPerBath} (WC cistern, basin, shower, health faucet) + kitchens + washer + balcony tap + dining basin. Hot outlets: bathrooms × ${R.hotPointsPerBath} when there are geysers.`, REF.eng)
  const outlets = L.calc('Outlets, cold and hot', 'outlets = cold + hot', '{c} + {h}', { c: coldOutlets, h: hotOutlets }, (v) => v.c + v.h, { ref: REF.eng })
  fl('Elbow 90°, 15 mm', 'one at every outlet', '{o}', { o: outlets }, (v) => v.o, { ref: REF.rule })
  fl('Reducing tee, 20 × 15 mm', 'one at every outlet', '{o}', { o: outlets }, (v) => v.o, { ref: REF.rule })
  fl('Female threaded adaptor or brass elbow, 15 mm', 'one at every outlet', '{o}', { o: outlets }, (v) => v.o, { ref: REF.rule })
  fl('Ball valve, 20 mm (one at each bathroom)', 'one per bathroom', '{b}', { b: bathrooms }, (v) => v.b, { ref: REF.rule })
  if (geysers) fl('Union, 15 mm (geyser connection)', 'one per geyser', '{g}', { g: geysers }, (v) => v.g, { ref: REF.rule })
  const entry = new Map<string, number[]>()
  const addEntry = (name: string, i: number) => { const a = entry.get(name) ?? []; a.push(i); entry.set(name, a) }
  for (let i = 0; i < N; i++) {
    addEntry(`Ball valve, ${headerDn[i]} mm (home entry)`, i)
    addEntry(`Union, ${headerDn[i]} mm (home entry)`, i)
    addEntry(riserDn[i] === headerDn[i] ? `Tee, ${riserDn[i]} mm (riser take-off)` : `Reducing tee, ${riserDn[i]} × ${headerDn[i]} mm (riser take-off)`, i)
  }
  for (const [name, floors] of entry) fl(name, 'one per home on the floors of this header size', floors.map((_f, k) => `{x${k}}`).join(' + '), Object.fromEntries(floors.map((i, k) => [`x${k}`, homesOnFloor])), (v) => floors.reduce((s, _i, k) => s + v[`x${k}`], 0), { ref: REF.rule })
  for (let i = 1; i < N; i++) {
    if (riserDn[i] !== riserDn[i - 1]) fl(`Reducer, ${riserDn[i - 1]} × ${riserDn[i]} mm (riser)`, 'one where the riser changes size', 'riser changes from {a} mm to {b} mm', { a: riserDn[i - 1], b: riserDn[i] }, (v) => (v.a !== v.b ? 1 : 0), { ref: REF.rule })
  }
  fl(`Elbow 90°, ${deliveryDn} mm (pump and tank connections)`, 'a set number at the pump and tanks', '{n}', { n: R.pumpTankElbows }, (v) => v.n, { ref: REF.rule })
  fl('Float valve (one for each tank)', 'one per tank', '{t}', { t: tankCount }, (v) => v.t, { ref: REF.rule })
  fl(`Ball valve, ${deliveryDn} mm (tank inlet and outlet)`, 'tanks × valves per tank', '{t} × {n}', { t: tankCount, n: R.valvesPerTank }, (v) => v.t * v.n, { ref: REF.rule })
  fl(`Union, ${deliveryDn} mm (tank connections)`, 'tanks × unions per tank', '{t} × {n}', { t: tankCount, n: R.unionsPerTank }, (v) => v.t * v.n, { ref: REF.rule })
  if (pumps > 0) {
    fl(`Foot valve, ${deliveryDn} mm`, 'one per pump', '{p}', { p: pumps }, (v) => v.p, { ref: REF.rule })
    fl(`Non-return valve, ${deliveryDn} mm`, 'one per pump', '{p}', { p: pumps }, (v) => v.p, { ref: REF.rule })
    fl(`Gate or ball valve, ${deliveryDn} mm (pump isolation)`, 'pumps × valves per pump', '{p} × {n}', { p: pumps, n: R.isolationPerPump }, (v) => v.p * v.n, { ref: REF.rule })
    fl(`Union, ${deliveryDn} mm (pump)`, 'pumps × unions per pump', '{p} × {n}', { p: pumps, n: R.unionsPerPump }, (v) => v.p * v.n, { ref: REF.rule })
  }
  const exposedM = L.calc('Exposed supply pipe that needs clamps', 'riser + stand-off and terrace run + delivery pipe', '{N} × {h} + ({a} + {b}) + {d:1}', { N, h: H_FLOOR, a: R.standoffM, b: R.terraceRunM, d: deliveryLen }, (v) => v.N * v.h + (v.a + v.b) + v.d, { unit: 'm', ref: REF.rule, note: 'Pipes inside walls are chased in and need no clamps.', expect: T.exposedM })
  const clamps = L.calc('Pipe clamps on exposed supply pipe', 'n = ceil(exposed length ÷ spacing)', 'ceil({e:1} ÷ {s})', { e: exposedM, s: R.clampEveryM }, (v) => Math.ceil(v.e / v.s), { unit: 'nos', result: true, ref: REF.rule, expect: T.clamps })
  const fitTotal = [...fitSheet.values()].reduce((s, n) => s + n, 0)
  const b11a = closeBlock('fit', '11.1 Supply fittings and valves', { note: 'Counts per outlet and per piece of equipment are planning rules; the fittings are the least certain part of the report.' })

  // drainage fittings
  const dfitSheet = new Map<string, number>()
  const traceDfit = new Map(T.dfit)
  const dfl = (name: string, formula: string, working: string, vars: Vars, fn: (v: Vars) => number, o: CalcOpts = {}) => {
    const n = L.calc(name, formula, working, vars, fn, { unit: 'nos', dp: 0, ref: REF.rule, ...o })
    if (!traceDfit.has(name)) L.mismatches.push(`drainage fitting "${name}" is not in the model's list`)
    else L.compare(`${name}: number`, n, traceDfit.get(name)!)
    bump(dfitSheet, name, n)
    return n
  }
  dfl('Long-radius bend, 110 mm (WC branch)', 'one per WC', '{b}', { b: bathrooms }, (v) => v.b)
  const jWc = dfl('Branch junction, 110 × 110 mm (WC to stack)', 'one per WC', '{b}', { b: bathrooms }, (v) => v.b)
  const jBath = dfl('Branch junction, 110 × 75 mm (bathroom waste to stack)', 'one per bathroom', '{b}', { b: bathrooms }, (v) => v.b)
  dfl('Bend, 75 mm (floor-trap branch)', 'one per bathroom', '{b}', { b: bathrooms }, (v) => v.b)
  dfl('Floor trap, 50 mm seal, 75 mm outlet', 'floor traps counted in 1.5', '{t}', { t: floorTraps }, (v) => v.t, { ref: REF.dfu })
  dfl('P-trap or bottle trap, 40 mm (basin)', 'one per wash basin', '{b}', { b: basins }, (v) => v.b)
  dfl('Sink trap, 40 mm', 'one per kitchen sink', '{s}', { s: sinks }, (v) => v.s)
  const jKit = dfl('Branch junction, 75 × 50 mm (kitchen to waste stack)', 'kitchen sinks + washing machine points', '{k} + {w}', { k: kitchensN, w: washers }, (v) => v.k + v.w)
  dfl('Large-radius bend, 110 mm (stack foot)', 'one per soil stack', '{s}', { s: soilStacks }, (v) => v.s)
  dfl('Large-radius bend, 75 mm (waste stack foot)', 'one per waste stack', '{s}', { s: wasteStacks }, (v) => v.s)
  dfl('Cowl, 110 mm', 'one per soil stack', '{s}', { s: soilStacks }, (v) => v.s)
  dfl('Cowl, 75 mm', 'one per waste stack', '{s}', { s: wasteStacks }, (v) => v.s)
  if (ventStacks) dfl('Vent connection and cowl, 50 mm', 'one per vent stack', '{s}', { s: ventStacks }, (v) => v.s, { ref: REF.rule })
  dfl(`Terrace outlet with grating, ${dpBuy} mm`, 'one per down-pipe', '{n}', { n: dpN }, (v) => v.n)
  dfl(`Bend, ${dpBuy} mm (down-pipe)`, 'two per down-pipe', '{n} × 2', { n: dpN }, (v) => v.n * 2)
  dfl(`Shoe, ${dpBuy} mm (down-pipe foot)`, 'one per down-pipe', '{n}', { n: dpN }, (v) => v.n)
  dfl('Inspection chamber with cover (0.8 × 0.8 m, up to 1 m deep)', 'chambers counted in 7.3', '{c}', { c: chambers }, (v) => v.c, { ref: REF.chamber })
  const dclamps = L.calc('Pipe clamps on stacks and down-pipes', 'n = ceil(stacks × H ÷ spacing + down-pipe length ÷ spacing)', 'ceil(({s} + {w} + {v}) × {h:1} ÷ {c} + {d:1} ÷ {c})', { s: soilStacks, w: wasteStacks, v: ventStacks, h: stackH, c: R.dclampEveryM, d: dpLen }, (v) => Math.ceil(((v.s + v.w + v.v) * v.h) / v.c + v.d / v.c), { unit: 'nos', result: true, ref: REF.rule, expect: T.dclamps })
  const stackJunctions = sumOf('Stack junctions: the three branch-junction lines above, added', 'Σ of the three branch-junction lines', [jWc, jBath, jKit], { expect: T.stackJunctions, note: 'These junctions are already part of the items counted in the table; the report repeats their sum in the note under the table, so they are not an extra item.' })
  const dfitTotal = [...dfitSheet.values()].reduce((s, n) => s + n, 0)
  const b11b = closeBlock('dfit', '11.2 Drainage fittings, traps and chambers', { note: 'Chambers are counted, not built: bricks, mortar and covers are in MasonryPro and the structure.' })
  sections.push({
    id: 'fittings', title: '11. Fittings, valves, traps and fixtures',
    intro: 'Fittings are counted per outlet and per piece of equipment with fixed planning rules. The fixtures themselves (WCs, basins, showers, sinks and taps) were counted in section 1.5; the report lists them with the floor traps and the geyser points.',
    blocks: [b11a, b11b],
  })
  {
    const ft = tableOf('fit')
    const rows = ft.rows.filter((r) => !String(r[0]).startsWith('Pipe clamps'))
    for (const r of rows) {
      const name = String(r[0])
      if (!fitSheet.has(name)) L.mismatches.push(`the report lists "${name}", which the sheet does not count`)
      else same(`${name}`, fitSheet.get(name)!, cellNums(r[1])[0])
    }
    if (rows.length !== fitSheet.size) L.mismatches.push(`supply fittings: report ${rows.length} lines vs sheet ${fitSheet.size}`)
    const cl = ft.rows.find((r) => String(r[0]).startsWith('Pipe clamps'))
    if (!cl) L.mismatches.push('the report has no clamps line')
    else addTie('Supply pipe clamps', cellNums(cl[1])[0], clamps, '')
    addTie('Supply fittings and valves: items in all', rows.reduce((s, r) => s + cellNums(r[1])[0], 0), fitTotal, '')

    const dt = tableOf('dfit')
    const drows = dt.rows.filter((r) => !String(r[0]).startsWith('Pipe clamps'))
    for (const r of drows) {
      const name = String(r[0])
      if (!dfitSheet.has(name)) L.mismatches.push(`the report lists "${name}", which the sheet does not count`)
      else same(`${name}`, dfitSheet.get(name)!, cellNums(r[1])[0])
    }
    if (drows.length !== dfitSheet.size) L.mismatches.push(`drainage fittings: report ${drows.length} lines vs sheet ${dfitSheet.size}`)
    const dcl = dt.rows.find((r) => String(r[0]).startsWith('Pipe clamps'))
    if (!dcl) L.mismatches.push('the report has no drainage clamps line')
    else addTie('Drainage pipe clamps', cellNums(dcl[1])[0], dclamps, '')
    addTie('Drainage fittings: items in all', drows.reduce((s, r) => s + cellNums(r[1])[0], 0), dfitTotal, '')
    if (!String(dt.note ?? '').includes(`Stack junctions: ${stackJunctions}`)) L.mismatches.push('stack junctions in the report note differ from the sheet')

    // fixtures table
    const fxt = tableOf('fix')
    const fixWant: [string, number][] = ([
      ['Water closet with flush tank', wc], ['Wash basin with tap', basins], ['Shower with mixer', showers], ['Health faucet', health], ['Kitchen sink with tap', sinks],
      ['Washing machine point', washers], ['Balcony or utility tap', balconyTaps], ['Terrace tap', terraceTaps], ['Garden tap', gardenTaps], ['Geyser point', geysers], ['Floor traps', floorTraps],
    ] as [string, number][]).filter(([, n]) => n > 0)
    for (const [name, n] of fixWant) same(name, n, cellNums(rowOf(fxt, name)[1])[0])
    if (fxt.rows.length !== fixWant.length) L.mismatches.push(`fixtures: report ${fxt.rows.length} lines vs sheet ${fixWant.length}`)
    addTie('Fixtures and taps: items in all', fxt.rows.reduce((s, r) => s + cellNums(r[1])[0], 0), fixWant.reduce((s, [, n]) => s + n, 0), '')
  }

  /* ═════════════ 12. the buy list and the main totals ═════════════ */
  const want: { key: string; item: string; qty: number; unit: string }[] = []
  for (const r of sRows) want.push({ key: `pipe-cpvc-${r.dn}`, item: `CPVC pipe ${r.dn} mm`, qty: r.buy, unit: 'm' })
  for (const r of dRows) want.push({ key: `pipe-swr-${r.dn}`, item: `uPVC SWR pipe ${r.dn} mm`, qty: r.buy, unit: 'm' })
  if (ugtPlan) want.push({ key: 'tank-ugt', item: 'Underground tank', qty: ugtL, unit: 'L' })
  want.push({ key: 'tank-oht', item: 'Overhead tank', qty: ohtL, unit: 'L' })
  if (pumps > 0) want.push({ key: 'pump', item: `Transfer pump ${hp} HP`, qty: pumps, unit: 'nos' })
  want.push({ key: 'wc', item: 'Water closets', qty: wc, unit: 'nos' })
  want.push({ key: 'basin', item: 'Wash basins', qty: basins, unit: 'nos' })
  want.push({ key: 'chamber', item: 'Inspection chambers', qty: chambers, unit: 'nos' })
  for (const q of want) {
    const e = T.lines.find((l) => l.key === q.key)
    if (!e) L.mismatches.push(`buy-list line ${q.key} is not in the model's list`)
    else L.compare(`Buy list: ${q.item}`, q.qty, e.qty)
  }
  if (want.length !== T.lines.length) L.mismatches.push(`buy list: sheet ${want.length} lines vs model ${T.lines.length}`)
  const b12a = closeBlock('buy', '12.1 The buy list', {
    intro: 'Each line of the buy list is a figure already found above: pipe to buy from sections 6 and 10, tanks from section 3, the pump from section 5, and the counts from sections 1, 7 and 11. The Grand Total adds these lines across the trades by their key.',
    table: {
      head: ['Item', 'Quantity', 'Unit', 'Found in'],
      rows: want.map((q) => [q.item, fmt(q.qty, 0), q.unit, q.key.startsWith('pipe-cpvc') ? 'Section 6.5' : q.key.startsWith('pipe-swr') ? 'Section 10.2' : q.key.startsWith('tank') ? 'Section 3.2' : q.key === 'pump' ? 'Section 5' : q.key === 'chamber' ? 'Section 7.3' : 'Section 1.5']),
      num: [1],
    },
  })
  sections.push({ id: 'buy', title: '12. The buy list', blocks: [b12a] })
  if (paid.lines.length !== want.length) L.mismatches.push(`buy list: report ${paid.lines.length} lines vs sheet ${want.length}`)
  for (const q of want) {
    const rl = paid.lines.find((l) => l.key === q.key)
    if (!rl) { L.mismatches.push(`the report has no buy-list line ${q.key}`); continue }
    addTie(`Buy list: ${q.item}`, rl.qty, q.qty, q.unit)
    if (rl.item !== q.item || rl.unit !== q.unit) L.mismatches.push(`buy-list line ${q.key}: the report says "${rl.item}" in ${rl.unit}, the sheet "${q.item}" in ${q.unit}`)
  }
  if (pumps === 0) {
    const fixCount = wc + basins + showers + health + sinks + washers + balconyTaps + terraceTaps + gardenTaps
    addTie('Fixtures and taps counted (headline figure)', cellNums(tileOf('Fixtures and taps').v)[0], fixCount, '')
  }

  /* ═════════════ 13. how far off ═════════════ */
  const tileBands: [string, string, { low: number; high: number }, number, string][] = [
    ['Water supply pipe', 'Water supply pipe', BANDS.supply, supplyBuyM, 'm'],
    ['Drain and rain pipe', 'Drain and rain pipe', BANDS.drain, drainBuyM, 'm'],
    ['Tanks', 'Tanks and pump', BANDS.tanks, tankTotalL, 'L'],
  ]
  for (const [tk, bl, band, fig, unit] of tileBands) {
    const lo = L.calc(`${tk}: low end of the range`, 'low = figure × low multiplier', '{f:0} × {k}', { f: fig, k: band.low }, (v) => v.f * v.k, { unit, ref: REF.rule })
    const hi = L.calc(`${tk}: high end of the range`, 'high = figure × high multiplier', '{f:0} × {k}', { f: fig, k: band.high }, (v) => v.f * v.k, { unit, ref: REF.rule })
    const tl = tileOf(tk)
    const rn = cellNums(tl.range)
    addTie(`${tk}: range in the report, low end`, rn[0], lo, unit)
    addTie(`${tk}: range in the report, high end`, rn[1], hi, unit)
    const rb = paid.bands.find((b) => b.label === bl)
    if (!rb) L.mismatches.push(`the report has no band "${bl}"`)
    else { L.compare(`Band ${bl}: low multiplier`, band.low, rb.low); L.compare(`Band ${bl}: high multiplier`, band.high, rb.high) }
    if (tl.range !== `${rangeText(fig, band.low, band.high)} ${unit}`) L.mismatches.push(`range text of "${tk}" differs: "${tl.range}"`)
  }
  {
    const rb = paid.bands.find((b) => b.label === 'Fittings and valves')
    if (!rb) L.mismatches.push('the report has no band "Fittings and valves"')
    else { L.compare('Band fittings and valves: low multiplier', BANDS.fittings.low, rb.low); L.compare('Band fittings and valves: high multiplier', BANDS.fittings.high, rb.high) }
    if (paid.bands.length !== 4) L.mismatches.push(`bands: report ${paid.bands.length} vs sheet 4`)
  }
  const b13 = closeBlock('bands', '13.1 How far off the figures can be', {
    table: {
      head: ['Figure', 'Low multiplier', 'High multiplier', 'Why it is wide'],
      rows: [
        ['Water supply pipe', fmt(BANDS.supply.low, 2), fmt(BANDS.supply.high, 2), 'Lengths follow planning rules for the size of each home, not a drawing.'],
        ['Drain and rain pipe', fmt(BANDS.drain.low, 2), fmt(BANDS.drain.high, 2), 'Stack and branch lengths and the run to the plot edge are planning lengths.'],
        ['Fittings and valves', fmt(BANDS.fittings.low, 2), fmt(BANDS.fittings.high, 2), 'Counts per outlet are planning rules; a plumber\'s layout can differ.'],
        ['Tanks and pump', fmt(BANDS.tanks.low, 2), fmt(BANDS.tanks.high, 2), 'Tank sizes are rounded to sizes sold; the pump depends on the actual layout and maker.'],
      ],
      num: [1, 2],
      note: 'The range printed under each total in the report is the figure times these two multipliers. The multipliers are the model\'s own judgement of how far a quantity worked out without drawings can be from what is finally bought; they are not a statistical result.',
    },
  })
  sections.push({ id: 'bands', title: '13. Uncertainty bands', intro: 'The ranges printed under the totals in the report are the figure times a low and a high multiplier. They are the model\'s own judgement, not a statistical result.', blocks: [b13] })

  /* ───────────── the sheet ───────────── */
  const NOT_REREAD = 'Clause numbers as given in the tool\'s research notes; not re-read against the published text.'
  const refs: CalcReference[] = [
    { code: 'IS 1172:1993', title: 'Code of Basic Requirements for Water Supply, Drainage and Sanitation', usedFor: 'Litres per person per day (cl 4.1 and its Note). Table 1 of the standard is for buildings other than residences and is not used. The 135 L used is the lower of the figures the sources give; see the limits.' },
    { code: 'NBC 2016 Part 9, Sections 1 and 2', title: 'Plumbing Services, read from the BIS preliminary drafts of November 2024', usedFor: 'People per home, split of stored water (cl 4.4.10), fixture units (Table 2), simultaneous flow (Table 3) and the 2.4 m/s velocity limit (cl 4.8.6). Draft text, not the published code. The 2 m/s for the delivery pipe, the peak factor of 1.5 and the standby pump are not from the draft; they are NirmanShastra assumptions.' },
    { code: 'IS 12183 (Part 1):1987', title: 'Code of Practice for Plumbing in Multistoreyed Buildings: Water Supply', usedFor: 'Named in the notes to the NBC draft storage clause. No figure on this sheet is taken from it directly. ' + NOT_REREAD },
    { code: 'IS 2065:1983', title: 'Code of Practice for Water Supply in Buildings', usedFor: 'Named in the notes to the NBC draft storage clause. No figure on this sheet is taken from it directly. ' + NOT_REREAD },
    { code: 'SP 35:1987', title: 'Handbook on Water Supply and Drainage', usedFor: 'The Hazen-Williams friction formula (eq. 1) for the delivery pipe, with C = 120 for plastic pipe. ' + NOT_REREAD },
    { code: 'IS 15778:2007', title: 'CPVC Pipes for Potable Hot and Cold Water Distribution: Specification', usedFor: 'Bore of CPVC pipe by size, and the lengths pipe is sold in.' },
    { code: 'IS 1742:1983', title: 'Code of Practice for Building Drainage', usedFor: 'Drainage fixture units (Table 1), limits on stacks and drains (Tables 3 and 4), rain-water pipes (Table 5, cl 4.10.3.8), inspection chambers. ' + NOT_REREAD },
    { code: 'IS 5329:1983', title: 'Code of Practice for Sanitary Pipe Work above Ground for Buildings', usedFor: 'Named for a single soil stack without a vent up to five storeys (cl 6.1.1) and a stack that runs above the roof (cl 6.8.4). The count of one stack for every two WCs on a floor is not from this standard. ' + NOT_REREAD },
    { code: 'IS 2470 (Part 1):1985', title: 'Code of Practice for Installation of Septic Tanks: Design Criteria and Construction', usedFor: 'Tank dimensions for the people served (Appendix A, Tables 5 and 6), least capacity and width (cl 3.4.5.1), length to width, free board (cl 3.4.8). The standard prints dimensions, not volumes: the volumes are the model\'s own length × width × depth.' },
    { code: 'IS 2470 (Part 2):1985', title: 'Code of Practice for Installation of Septic Tanks: Secondary Treatment and Disposal of Effluent', usedFor: 'Rate of application of effluent to the ground for the soak pit (Table 2: 118, 52 and 33 L/m²/day for water falling 25 mm in 3, 15 and 45 minutes); ground that is too slow.' },
    { code: 'IS 4111 (Part 1):1986', title: 'Code of Practice for Ancillary Structures in Sewerage System: Manholes', usedFor: 'Named for inspection chambers. ' + NOT_REREAD },
  ]

  const unitsNote = `Pipe is bought in whole ${PIECE_M} m lengths with ${Math.round((WASTE - 1) * 100)}% added for cutting.`
  const sheet: CalcSheet = {
    tool: 'PlumbingPro',
    model: paid.engine,
    purpose: 'This sheet shows how every figure in the PlumbingPro report was worked out: how many people the water is planned for, how big the tanks and the transfer pump are, how the pipes were sized and measured, how the septic tank and soak pit (or the sewer connection) and the rain-water down-pipes were found, and how the buy list was added up. It is written so that a plumbing engineer, a bank\'s engineer or a contractor can check the formulas and the arithmetic. It is a planning-level quantity estimate, not a plumbing design or a drawing.',
    method: [
      'Your answers and the floor areas are read. The model works out the homes, the people (bedrooms plus three in each home unless you gave the number), the roof area and the fixtures on every floor.',
      'Daily water is the people times the litres per person per day from IS 1172 (the model uses 135 L, the lower of the figures the sources give, or 150 L for a house on its own borewell).',
      'The day\'s water is split between an underground and an overhead tank by the NBC Part 9 storage rule for the water source, and each part is rounded up to a tank size that is sold.',
      'Each fixture is given water supply fixture units (NBC Part 9 draft). The units on a floor give the flow drawn at the same moment, and the smallest CPVC size that carries it at the velocity limit is chosen for each home header and for the riser at each floor.',
      'The transfer pump is sized for the larger of the peak-hour demand and refilling the overhead tank in 30 minutes; the head is the climb plus pipe friction (Hazen-Williams) plus a residual head; the power is flow times head over 4,500 times the efficiency, rounded up to a pump size sold.',
      'Supply pipe lengths are built from planning rules (the size of the home, bathrooms, kitchens and outlets), added by pipe size, and rounded up to whole lengths after cutting waste.',
      'Soil and waste stacks, branches and the building drain are measured with planning rules; the load on a soil stack and on the building drain is checked against IS 1742, and the building drain size is chosen from the drainage fixture units.',
      'With no sewer, the septic tank is worked out from the IS 2470 tank dimensions for the people served and the soak pit is sized from the rate for the ground you chose; with a sewer, a connection length is counted.',
      'Rain-water down-pipes are found from the roof area, the rain you chose and the area one pipe drains (IS 1742 Table 5).',
      'Fittings, valves, traps and clamps are counted per outlet and per piece of equipment with fixed rules.',
      'The buy list collects the pipe, the tanks, the pump and the main fixture counts, and the uncertainty multipliers give the ranges printed under the totals.',
      'Every total in the report is rebuilt from this working and compared with the report in the reconciliation at the end.',
    ],
    limits: [
      `This is a planning-level quantity model, not a plumbing design. It does not draw the layout, route any pipe or size the branch pipes one by one. Pressure at the fixtures (the residual head) is not checked: header and riser sizes come from the velocity limit alone, so friction and fitting losses along them are not part of the sizing, and fittings enter only as ${Math.round((R.fittingsFactor - 1) * 100)}% extra length on the delivery pipe when the pump head is worked out. Pipe lengths come from planning rules for the size of the home and the number of outlets, so the supply and drain pipe totals can be 25% to 35% off a real layout (section 13).`,
      `Several of the code figures are read from the BIS preliminary drafts of NBC 2016 Part 9 (November 2024), not from the published code: people per home, the storage split, fixture units, the flow table and the ${R.vSupply} m/s velocity limit. A signing engineer should check them against the published edition. The ${R.vDelivery} m/s used for the delivery pipe and the peak-hour factor of ${R.peakFactor} (the draft mentions 2 to 3) are NirmanShastra assumptions.`,
      'Water demand is 135 L a head (150 L for a borewell house). 135 L is the lower of the figures the sources give: IS 1172 cl 4.1 gives 150 to 200 L for towns of over a lakh people, and its Note allows 135 L for lower-income housing. A town above a lakh may need 150 L or more, which would raise the tanks, the pump flow and the waste water.',
      `Tank sizes are rounded to common ready-made sizes (a market practice, not a standard). Fire-fighting storage and a fire pump are not counted (NBC Part 4). Above six floors a booster or zoned supply may be needed; the sheet counts one riser and one overhead tank. ${unitsNote} If uPVC or PPR is used for cold water, or the plumber cuts differently, the metres stay and the number of lengths changes. Make, model and finish of fixtures are not specified. Nothing here is a price or a rate, and what is not counted (the borewell, solar hot water, meters, filters, fire-fighting, the building of tanks and chambers) is listed in the report.`,
      'The pump is sized by a simple formula (flow, head, an assumed efficiency of 0.5) and rounded up to a size sold. It does not read a maker\'s curve, check suction lift or the electrical supply, and the model shows no more than the largest size in its list even if the power needed is higher. Supply pipes stop at 100 mm in the same way: for a very large building the flow can be more than a 100 mm pipe carries at the velocity limit. The sheet marks both cases. Two pumps, one working and one standby, for two or more homes is a NirmanShastra assumption and not a code requirement (the NBC draft mentions standby pumps only for pressurised systems). A borewell pump is not sized.',
      'Drain loads are checked, not designed. Against the limits of IS 1742 the model checks the load on one soil stack (at a floor and in all) and the load on the building drain, which also sets the drain size; the waste stack, the branches and the vent stacks are not load-checked. The stack limit is one figure for every building height, which may be looser than the standard\'s table for a low building, and the 110 and 160 mm drains use the limits of 100 and 150 mm bores. The dining wash basin is left out of the drainage fixture units (a simplification in the engine), and the washing machine value of 3 units is not in Table 1 of IS 1742. Gradients, invert levels and the layout of the chambers are not designed.',
      'The septic tank dimensions for the people served come from IS 2470 Part 1 Appendix A, and the soak pit rates from IS 2470 Part 2 Table 2. The standard prints dimensions, not volumes: the volumes in the table are the model\'s own length × width × depth. The day\'s detention added for the other waste water, equal tanks above 100 people and any volume above the table\'s last row (300 users) are also the model\'s own working or extension. Waste water is taken as 108 L a head whatever the water source. The soak pit uses the rate for the class of ground you chose, not a percolation test; poor ground is flagged as unsuitable. Neither is designed structurally: walls, slabs, covers and linings are not counted.',
      'The rain you choose, not the rainfall of your town, sets the number of down-pipes, because IS 1742 gives no figure for each town. The roof is taken as the largest floor; gutters, terrace slopes and rain-water storage are not designed.',
      'Where the SOURCE column gives a clause number for a standard marked "not re-read against the published text" in the references, treat it as a pointer to check, not as a quotation.',
      'Each NirmanShastra tool lays out the rooms by its own rule, so a room\'s area or count in this report can differ from the same room in another NirmanShastra report.',
    ],
    sections,
    tie: ties,
    references: refs,
  }

  if (!sheetIsSound(sheet, L.mismatches)) {
    console.error('PlumbingPro calculation sheet does not agree with the report:', [...L.mismatches, ...ties.filter((t) => !t.ok).map((t) => `tie ${t.item}: ${t.report} vs ${t.sheet}`)])
    return null
  }
  return sheet
}

