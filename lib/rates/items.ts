/*
  The rupee step (SJ, 26 Oct 2026, Group 9): turn a report's quantities into rupees at the rates the CUSTOMER types.

  This file decides WHICH rate boxes a report gets and HOW a line's quantity becomes the quantity the rate is asked in.
  It carries no price. Every rupee on the screen or in a PDF is the customer's own rate times the report's own quantity.

  Rules of the design:
    - One box for one thing you buy. Steel of every diameter is one box; copper wire of every colour is one box per size.
    - A rate is asked in the unit people quote it in: bags of cement, cft of sand and stone, 1,000 bricks, kg of steel, sq ft of tile.
      The report's quantity is converted to that unit here, so the amount is quantity x rate exactly as it reads.
    - A line that is not a thing you buy (shuttering, excavation, wiring points) gets no box, and the table says so.
    - A line this file does not know still gets a box, in its own unit, so a new report line is never silently left out.
    - Pure functions. No database, no network. The same code runs in the browser (the panel) and on the server (the PDF).
*/

import type { QtyLine } from '../qty/types'

/** 1 m³ in cubic feet (the same figure the StructurePro report uses for its sand and stone). */
export const CFT_PER_M3 = 35.3147
/** 1 m² in square feet. */
export const SQFT_PER_M2 = 10.7639

export interface RateItem {
  /** stable id: the key a hint in hints.ts is filed under, and the key a rate is sent under */
  id: string
  label: string
  /** the unit a rate is asked in, as said aloud: bag, cft, kg, 1,000, metre, piece, litre, sq ft ... */
  unit: string
  /** how the rate reads: "per bag", "per 1,000" */
  per: string
  group: string
  /** the quantity in the rate's unit, rounded to the precision it is shown at; this is the number the amount is worked from */
  qty: number
  /** what to show as the quantity: "494 bags", "30,400 bricks" */
  need: string
  /** the report lines this box prices */
  keys: string[]
}

export interface Unpriced {
  key: string
  item: string
  why: string
}

/** Groups in the order the panel lists them. The materials most houses are priced by come first. */
export const GROUP_ORDER = [
  'Cement, sand and stone',
  'Steel',
  'Bricks and blocks',
  'Tiles and stone',
  'Paint',
  'Doors and windows',
  'Electrical',
  'Plumbing',
] as const

type Convert = {
  id: string; label: string; unit: string; per: string; group: string; factor: number
  /** the word after the quantity ("bags"); defaults to the rate's unit */
  needUnit?: (n: number) => string
  /** said before the quantity when the rate's unit is not the unit the report counts in: "458 tiles = " */
  before?: (reportQty: number) => string
}
type Verdict = Convert | { skip: string }

const SKIP_WORK = 'Hire and labour more than a material you buy, so it is not priced here.'
const SKIP_POINTS = 'These are points of wiring. The switches, sockets and boxes you buy for them are listed and priced on their own lines.'
const SKIP_BUILT = 'Built on site or bought as a whole job, so it is not priced by the unit here. Get this one quoted by your contractor.'

const plural = (n: number, one: string, many: string) => (Math.abs(n - 1) < 1e-9 ? one : many)

/** The unit, and how to say it, for a line this file has no rule for. */
function byUnit(unit: string): { unit: string; per: string; many: string } {
  switch (unit) {
    case 'nos': return { unit: 'piece', per: 'per piece', many: 'pieces' }
    case 'pairs': return { unit: 'pair', per: 'per pair', many: 'pairs' }
    case 'm': return { unit: 'metre', per: 'per metre', many: 'metres' }
    case 'kg': return { unit: 'kg', per: 'per kg', many: 'kg' }
    case 'L': return { unit: 'litre', per: 'per litre', many: 'litres' }
    case 'm²': return { unit: 'm²', per: 'per m²', many: 'm²' }
    case 'm³': return { unit: 'm³', per: 'per m³', many: 'm³' }
    case 'bags of 50 kg': return { unit: 'bag', per: 'per bag', many: 'bags' }
    default: return { unit, per: `per ${unit}`, many: unit }
  }
}

function classify(l: QtyLine): Verdict {
  const k = l.key
  // not things you buy
  if (k === 'shuttering-m2' || k === 'excavation-m3') return { skip: SKIP_WORK }
  if (k === 'light-points' || k === 'sockets') return { skip: SKIP_POINTS }
  if (k === 'chamber' || k === 'tank-ugt') return { skip: SKIP_BUILT }

  if (k === 'cement-bag-50kg') return { id: 'cement', label: 'Cement (50 kg bags)', unit: 'bag', per: 'per bag', group: 'Cement, sand and stone', factor: 1, needUnit: n => plural(n, 'bag', 'bags') }
  if (k === 'sand-m3') return { id: 'sand', label: 'Sand', unit: 'cft', per: 'per cft', group: 'Cement, sand and stone', factor: CFT_PER_M3 }
  if (k === 'aggregate-20mm-m3') return { id: 'aggregate', label: 'Stone aggregate 20 mm', unit: 'cft', per: 'per cft', group: 'Cement, sand and stone', factor: CFT_PER_M3 }
  if (/^steel-fe500d-\d+mm-kg$/.test(k) || k === 'steel-lintel-kg') return { id: 'steel', label: 'Steel bars (one rate for every diameter)', unit: 'kg', per: 'per kg', group: 'Steel', factor: 1 }
  if (k === 'binding-wire-kg') return { id: 'binding-wire', label: 'Binding wire', unit: 'kg', per: 'per kg', group: 'Steel', factor: 1 }

  let m = /^masonry-unit-(brick|modular|flyash)$/.exec(k)
  if (m) return { id: m[1] === 'brick' ? 'brick' : `${m[1]}-brick`, label: l.item, unit: '1,000', per: 'per 1,000', group: 'Bricks and blocks', factor: 1 / 1000, needUnit: () => 'bricks' }
  m = /^masonry-unit-(aac|block)$/.exec(k)
  if (m) return { id: m[1] === 'aac' ? 'aac-block' : 'concrete-block', label: l.item, unit: 'block', per: 'per block', group: 'Bricks and blocks', factor: 1, needUnit: n => plural(n, 'block', 'blocks') }

  m = /^wire-cu-([\d.]+)-/.exec(k)
  if (m) return { id: `wire-${m[1]}`, label: `Copper wire ${m[1]} mm² (every colour)`, unit: 'metre', per: 'per metre', group: 'Electrical', factor: 1, needUnit: () => 'm' }

  m = /^tile-(\d+)x(\d+)-nos$/.exec(k)
  if (m) return { id: `tile-${m[1]}x${m[2]}`, label: l.item, unit: 'sq ft', per: 'per sq ft', group: 'Tiles and stone', factor: (Number(m[1]) * Number(m[2]) / 1e6) * SQFT_PER_M2, before: n => `${n.toLocaleString('en-IN')} tiles = ` }
  if (k === 'granite-slab-sqm' || k === 'glass-5mm-sqm' || k === 'waterproofing-sqm') {
    return { id: k.replace(/-sqm$/, ''), label: l.item, unit: 'sq ft', per: 'per sq ft', group: k === 'granite-slab-sqm' ? 'Tiles and stone' : k === 'glass-5mm-sqm' ? 'Doors and windows' : 'Paint', factor: SQFT_PER_M2 }
  }
  if (k === 'door-frame-timber-m3') return { id: 'door-frame-timber', label: l.item, unit: 'cft', per: 'per cft', group: 'Doors and windows', factor: CFT_PER_M3 }
  if (k === 'tank-oht') return { id: 'tank-oht', label: 'Overhead tank (rate for each litre it holds)', unit: 'litre', per: 'per litre of capacity', group: 'Plumbing', factor: 1, needUnit: () => 'L' }

  const u = byUnit(l.unit)
  const group = /^(wall-putty|primer|emulsion|paint|enamel)/.test(k) ? 'Paint'
    : /^aac-adhesive/.test(k) ? 'Bricks and blocks'
    : /^(tile|granite|threshold)/.test(k) ? 'Tiles and stone'
    : /^door-|^glass-|^window-/.test(k) ? 'Doors and windows'
    : /^(wire|conduit|mcb|rccb|db-|elec-|earth)/.test(k) ? 'Electrical'
    : /^(pipe|pump|wc|basin|tank)/.test(k) ? 'Plumbing'
    : l.group
  return { id: k, label: l.item, unit: u.unit, per: u.per, group, factor: 1, needUnit: n => (n === 1 ? u.unit : u.many) }
}

/** How many decimals a quantity is shown (and billed) at: whole numbers when large, more places when small. */
export function shownPlaces(n: number): number {
  const a = Math.abs(n)
  return a >= 100 ? 0 : a >= 10 ? 1 : 2
}
/** A quantity rounded to the places it is shown at. The amount is worked from this, so quantity x rate = amount exactly as printed. */
export function roundShown(n: number): number {
  const d = shownPlaces(n)
  const p = 10 ** d
  return Math.round(n * p) / p
}
export const fmtQty = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: shownPlaces(n) })

/** The boxes a report gets, in the order the panel shows them, and the lines that get none. */
export function rateItems(lines: QtyLine[]): { items: RateItem[]; unpriced: Unpriced[] } {
  const acc = new Map<string, { c: Convert; raw: number; reportQty: number; keys: string[] }>()
  const unpriced: Unpriced[] = []
  for (const l of lines) {
    if (!(l.qty > 0)) continue
    const v = classify(l)
    if ('skip' in v) { unpriced.push({ key: l.key, item: l.item, why: v.skip }); continue }
    const got = acc.get(v.id)
    if (got) { got.raw += l.qty * v.factor; got.reportQty += l.qty; got.keys.push(l.key) } else acc.set(v.id, { c: v, raw: l.qty * v.factor, reportQty: l.qty, keys: [l.key] })
  }
  const rank = (g: string) => { const i = (GROUP_ORDER as readonly string[]).indexOf(g); return i < 0 ? GROUP_ORDER.length : i }
  const items = [...acc.values()].map(({ c, raw, reportQty, keys }): RateItem => {
    const qty = roundShown(raw)
    // a brick count is said in bricks, not in thousands: the rate is per 1,000, the quantity you read is the count
    const say = c.unit === '1,000'
      ? `${fmtQty(Math.round(raw * 1000))} ${c.needUnit?.(raw) ?? ''}`.trim()
      : `${c.before ? c.before(reportQty) : ''}${fmtQty(qty)} ${c.needUnit ? c.needUnit(qty) : c.unit}`
    return { id: c.id, label: c.label, unit: c.unit, per: c.per, group: c.group, qty: c.unit === '1,000' ? Math.round(raw * 1000) / 1000 : qty, need: say, keys }
  })
  // stable: by group order, keeping the report's own order inside a group
  const order = new Map(items.map((it, i) => [it.id, i]))
  items.sort((a, b) => rank(a.group) - rank(b.group) || (order.get(a.id)! - order.get(b.id)!))
  return { items, unpriced }
}
