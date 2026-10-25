/*
  The Grand Total: the paid quantity reports of ONE building, added into one buying list.

  What it does that five separate reports cannot:
    - adds the cement, sand and stone that several phases each use, so the total to order is in one place;
    - takes out anything two reports both count (the lintels over doors and windows are in the frame and in the walls),
      so nothing is ordered twice;
    - checks that the reports are for the same building (same floors, same area, same state);
    - says which phases are not in the total, so a partial list is never mistaken for the whole building;
    - lays the buying list out in the order the work happens on site.

  Pure functions only: no database, no model coefficients. The server reads each phase's saved report, turns it into a
  PhaseSource (grand-server.ts), and this file merges them. The site is quantity-only: nothing here carries a price.
*/

import type { PaidPayload as FramePaid } from '../structopro-qty/payload'
import type { BandRow, Check, Overlap, QtyLine, Table, Tile } from './types'
import { fmt, round } from './util'

export type PhaseKey = 'structure' | 'masonry' | 'electrical' | 'plumbing' | 'interior'
export type PhaseAppType = 'structopro' | 'masonpro' | 'electropro' | 'plumbpro' | 'interiorpro'
export type HeadKey = 'cement' | 'sand' | 'aggregate' | 'steel' | 'bricks'

export interface PhaseDef {
  key: PhaseKey
  appType: PhaseAppType
  label: string
  /** one or two words, used as a column heading */
  short: string
  stage: string
  covers: string
  when: string
  href: string
}

/** In the order the work happens on site. */
export const PHASES: PhaseDef[] = [
  {
    key: 'structure', appType: 'structopro', label: 'StructurePro', short: 'Frame', stage: 'Phase 1',
    covers: 'Footings, columns, beams, slabs and stairs: concrete, steel and shuttering',
    when: 'First. Excavation and lean concrete, then steel and shuttering, then cement, sand and stone for each pour.',
    href: '/tools/structopro',
  },
  {
    key: 'masonry', appType: 'masonpro', label: 'MasonryPro', short: 'Walls', stage: 'Phase 2',
    covers: 'Bricks or blocks, mortar, lintels and plaster',
    when: 'After the frame has cured. Lintels are cast as the walls reach the height of the openings.',
    href: '/tools/masonpro',
  },
  {
    key: 'electrical', appType: 'electropro', label: 'ElectricalPro', short: 'Wiring', stage: 'Phase 3',
    covers: 'Points, wire, conduit, boards and earthing',
    when: 'Conduit and boxes go in before the slab is poured and as the walls rise. Wire is pulled after plaster.',
    href: '/tools/electropro',
  },
  {
    key: 'plumbing', appType: 'plumbpro', label: 'PlumbingPro', short: 'Plumbing', stage: 'Phase 4',
    covers: 'Pipes, tanks, pump, fittings and fixtures',
    when: 'Sleeves and pipes go in before the slab is poured and into the walls before plaster. Fixtures come last.',
    href: '/tools/plumbpro',
  },
  {
    key: 'interior', appType: 'interiorpro', label: 'InteriorPro', short: 'Finishing', stage: 'Phase 5',
    covers: 'Paint, tiles, ceilings, doors and carpentry',
    when: 'After plaster. Tiles and ceilings first, doors and paint last.',
    href: '/tools/interiorpro',
  },
]

export const phaseByAppType = (a: string): PhaseDef | null => PHASES.find(p => p.appType === a) ?? null
const defOf = (k: PhaseKey): PhaseDef => PHASES.find(p => p.key === k)!
const orderOf = (k: PhaseKey): number => PHASES.findIndex(p => p.key === k)

/* ---- what one phase hands in ------------------------------------------------------------------- */

export interface PhaseSource {
  key: PhaseKey
  estimateId: string
  projectName: string
  state: string
  city: string
  floors: number
  builtUpM2: number
  lines: QtyLine[]
  /** how far off the headline materials can be, from this phase's own report: [low, high] multipliers */
  heads: Partial<Record<HeadKey, [number, number]>>
  /** the widest band of this phase, used where a headline material has no band of its own */
  widest: [number, number]
  assumptions: string[]
  notIncluded: string[]
  sources: string[]
  overlap?: Overlap
}

const BULK = new Set(['cement-bag-50kg', 'sand-m3', 'aggregate-20mm-m3'])
const isSteel = (k: string) => k.startsWith('steel-')
const isUnit = (k: string) => k.startsWith('masonry-unit-')

/** The frame's saved report as buying lines. Cement, sand and stone carry the site wastage the frame report already allows for. */
export function frameLines(p: FramePaid): QtyLine[] {
  const m = p.materials
  const out: QtyLine[] = [
    { key: 'cement-bag-50kg', item: 'Cement', qty: Math.ceil(m.cementBags - 1e-9), unit: 'bags of 50 kg', group: 'Concrete', basis: 'Footings, columns, beams, slabs and stairs, with site wastage' },
    { key: 'sand-m3', item: 'Sand', qty: round(m.sandM3, 1), unit: 'm³', group: 'Concrete', basis: 'Concrete in the frame, with site wastage' },
    { key: 'aggregate-20mm-m3', item: 'Stone aggregate 20 mm', qty: round(m.aggregateM3, 1), unit: 'm³', group: 'Concrete', basis: 'Concrete in the frame, with site wastage' },
  ]
  for (const s of p.steelByDiameter) {
    out.push({ key: `steel-fe500d-${s.phi}mm-kg`, item: `Fe500D bars, ${s.phi} mm`, qty: Math.ceil(s.kg - 1e-9), unit: 'kg', group: 'Steel', basis: 'Cut, bent and lapped, with the buying allowance' })
  }
  out.push({ key: 'binding-wire-kg', item: 'Binding wire', qty: Math.ceil(m.bindingWireKg - 1e-9), unit: 'kg', group: 'Steel', basis: 'Tying the bars' })
  out.push({ key: 'shuttering-m2', item: 'Shuttering, contact area', qty: Math.ceil(p.totals.formworkM2 - 1e-9), unit: 'm²', group: 'Shuttering and earthwork', basis: 'Sides and soffits of every member' })
  out.push({ key: 'excavation-m3', item: 'Excavation for footings and plinth', qty: round(p.totals.excavationM3, 1), unit: 'm³', group: 'Shuttering and earthwork', basis: 'Pits to the founding depth' })
  return out
}

export function frameHeads(b: FramePaid['band']): Partial<Record<HeadKey, [number, number]>> {
  return { cement: b.cement, sand: b.concrete, aggregate: b.concrete, steel: b.steel }
}

export function frameWidest(b: FramePaid['band']): [number, number] {
  const all = [b.concrete, b.steel, b.cement, b.formwork]
  return [Math.min(...all.map(x => x[0])), Math.max(...all.map(x => x[1]))]
}

/** The bands of a trade report, matched to the headline materials by their labels. */
export function tradeHeads(key: PhaseKey, bands: BandRow[]): Partial<Record<HeadKey, [number, number]>> {
  const f = (label: string): [number, number] | undefined => {
    const b = bands.find(x => x.label === label)
    return b ? [b.low, b.high] : undefined
  }
  const out: Partial<Record<HeadKey, [number, number]>> = {}
  const put = (h: HeadKey, v: [number, number] | undefined) => { if (v) out[h] = v }
  if (key === 'masonry') {
    put('cement', f('Cement'))
    put('sand', f('Sand'))
    put('aggregate', f('Lintel concrete and steel'))
    put('steel', f('Lintel concrete and steel'))
    put('bricks', f('Bricks') ?? f('Blocks'))
  } else if (key === 'interior') {
    put('cement', f('Mortar, adhesive and grout'))
    put('sand', f('Mortar, adhesive and grout'))
  }
  return out
}

export function widestOf(bands: BandRow[]): [number, number] {
  if (bands.length === 0) return [1, 1]
  return [Math.min(...bands.map(b => b.low)), Math.max(...bands.map(b => b.high))]
}

/* ---- what the Grand Total hands back ----------------------------------------------------------- */

export interface PhaseSummary {
  key: PhaseKey
  label: string
  short: string
  stage: string
  covers: string
  projectName: string
  where: string
  floors: number
  builtUpM2: number
  items: number
}

export interface MissingPhase { key: PhaseKey; label: string; short: string; covers: string; href: string }

export interface GrandFree {
  engine: 'grand-v1'
  chips: string[]
  phases: PhaseSummary[]
  missing: MissingPhase[]
  checks: Check[]
  warnings: string[]
}

export interface PhaseNote { key: PhaseKey; label: string; assumptions: string[]; notIncluded: string[] }

export interface GrandPaid {
  engine: 'grand-v1'
  tiles: Tile[]
  tables: Table[]
  /** the merged buying list, one line per item (after the overlap is taken out) */
  lines: QtyLine[]
  bands: BandRow[]
  assumptions: string[]
  notIncluded: string[]
  sources: string[]
  phaseNotes: PhaseNote[]
}

/* ---- the merge --------------------------------------------------------------------------------- */

interface Row {
  key: string
  item: string
  unit: string
  group: string
  basis: string
  by: Partial<Record<PhaseKey, number>>
}

interface Removed { phase: PhaseKey; label: string; key: string; unit: string; qty: number }

/** Whole units round up, volumes and areas keep their decimals. */
function tidy(unit: string, v: number): number {
  if (unit === 'm³') return round(v, 2)
  if (unit === 'm²') return round(v, 1)
  return Math.ceil(v - 1e-9)
}
const showQty = (unit: string, v: number): string => (unit === 'm³' ? fmt(v, v >= 10 ? 1 : 2) : unit === 'm²' ? fmt(v, v >= 100 ? 0 : 1) : fmt(v, 0))

function sumBy(r: Row): number {
  return Object.values(r.by).reduce<number>((s, v) => s + (v ?? 0), 0)
}

export interface Merged {
  rows: Map<string, Row>
  removed: Removed[]
}

export function mergeLines(srcs: PhaseSource[]): Merged {
  const rows = new Map<string, Row>()
  for (const s of srcs) {
    for (const l of s.lines) {
      const id = `${l.key}|${l.unit}`
      const row = rows.get(id)
      if (row) row.by[s.key] = (row.by[s.key] ?? 0) + l.qty
      else rows.set(id, { key: l.key, item: l.item, unit: l.unit, group: l.group, basis: l.basis, by: { [s.key]: l.qty } })
    }
  }
  const removed: Removed[] = []
  const hasFrame = srcs.some(s => s.key === 'structure')
  if (hasFrame) {
    for (const s of srcs) {
      if (!s.overlap || s.key === 'structure') continue
      for (const o of s.overlap.lines) {
        const row = rows.get(`${o.key}|${o.unit}`)
        const have = row?.by[s.key]
        if (!row || have === undefined) continue
        const cut = Math.min(have, o.qty)
        if (cut <= 0) continue
        row.by[s.key] = tidy(row.unit, have - cut)
        removed.push({ phase: s.key, label: s.overlap.label, key: o.key, unit: o.unit, qty: cut })
      }
    }
  }
  return { rows, removed }
}

const HEAD_TITLE: Record<HeadKey, { k: string; item: string; unit: string }> = {
  cement: { k: 'Cement', item: 'Cement', unit: 'bags of 50 kg' },
  steel: { k: 'Steel bars', item: 'Steel bars, all sizes', unit: 'kg' },
  sand: { k: 'Sand', item: 'Sand', unit: 'm³' },
  bricks: { k: 'Bricks or blocks', item: 'Bricks or blocks', unit: 'nos' },
  aggregate: { k: 'Stone aggregate', item: 'Stone aggregate 20 mm', unit: 'm³' },
}

function headRows(rows: Map<string, Row>, h: HeadKey): Row[] {
  const out: Row[] = []
  for (const r of rows.values()) {
    const hit =
      h === 'cement' ? r.key === 'cement-bag-50kg'
      : h === 'sand' ? r.key === 'sand-m3'
      : h === 'aggregate' ? r.key === 'aggregate-20mm-m3'
      : h === 'steel' ? isSteel(r.key)
      : isUnit(r.key)
    if (hit) out.push(r)
  }
  return out
}

const where = (city: string, state: string) => [city, state].filter(Boolean).join(', ')
const same = (xs: string[]) => new Set(xs.map(x => x.trim().toLowerCase())).size <= 1

/** The building the reports describe: the first source, plus how far the others agree. */
export function agreement(srcs: PhaseSource[]) {
  const areas = srcs.map(s => s.builtUpM2)
  const lo = Math.min(...areas)
  const hi = Math.max(...areas)
  const dev = lo > 0 ? (hi - lo) / lo : 0
  const sameFloors = new Set(srcs.map(s => s.floors)).size === 1
  const sameState = same(srcs.map(s => s.state))
  const sameCity = same(srcs.map(s => s.city))
  return { dev, sameFloors, sameState, sameCity, ok: sameFloors && sameState && dev <= 0.1 }
}

export const AREA_TOLERANCE_NOTE = 'The floor areas in the reports differ by more than 10%, so they are not for the same building.'

/** Turns a failed agreement into the sentence shown to the visitor, or null when the reports agree. */
export function disagreement(srcs: PhaseSource[]): string | null {
  const a = agreement(srcs)
  if (!a.sameFloors) return 'These reports were made for buildings with a different number of floors, so they cannot be added into one list.'
  if (!a.sameState) return 'These reports were made for different states, so they cannot be added into one list.'
  if (a.dev > 0.1) return AREA_TOLERANCE_NOTE + ' Run each phase for the same project and floor areas, then try again.'
  return null
}

export function buildGrand(input: PhaseSource[]): { free: GrandFree; paid: GrandPaid } {
  const srcs = [...input].sort((a, b) => orderOf(a.key) - orderOf(b.key))
  const first = srcs[0]
  const { rows, removed } = mergeLines(srcs)
  const present = new Set(srcs.map(s => s.key))
  const missing: MissingPhase[] = PHASES.filter(p => !present.has(p.key)).map(p => ({ key: p.key, label: p.label, short: p.short, covers: p.covers, href: p.href }))
  const ag = agreement(srcs)

  const area = Math.round(srcs.reduce((s, x) => s + x.builtUpM2, 0) / srcs.length)
  const placeText = where(first.city, first.state)

  /* ---- the free part: who is in, and whether they agree ---- */
  const phases: PhaseSummary[] = srcs.map(s => {
    const d = defOf(s.key)
    const items = [...rows.values()].filter(r => (r.by[s.key] ?? 0) > 0).length
    return { key: s.key, label: d.label, short: d.short, stage: d.stage, covers: d.covers, projectName: s.projectName, where: where(s.city, s.state), floors: s.floors, builtUpM2: Math.round(s.builtUpM2), items }
  })

  const checks: Check[] = []
  checks.push({
    id: 'same-building',
    clause: 'The reports agree with each other',
    description: 'Same building in every report',
    status: !ag.ok ? 'fail' : ag.dev > 0.02 || !ag.sameCity ? 'advisory' : 'pass',
    detail: !ag.ok
      ? (disagreement(srcs) ?? '')
      : ag.dev > 0.02 || !ag.sameCity
        ? `The reports are close but not identical: floor areas differ by ${round(ag.dev * 100, 1)}%${ag.sameCity ? '' : ' and the city is written differently'}. The list below adds them as they are.`
        : `All ${srcs.length} reports are for ${first.floors} ${first.floors === 1 ? 'floor' : 'floors'} and about ${fmt(area, 0)} m² built-up${placeText ? ` in ${placeText}` : ''}.`,
  })
  checks.push({
    id: 'phases',
    clause: 'Whole building or part of it',
    description: 'Phases in this total',
    status: missing.length === 0 ? 'pass' : 'advisory',
    detail: missing.length === 0
      ? 'All five phases are in this total: frame, walls, wiring, plumbing and finishing.'
      : `Not in this total: ${missing.map(m => `${m.label} (${m.covers.toLowerCase()})`).join('; ')}. The list is for the phases you have, not for the whole building. It does not update when you add a phase later.`,
  })
  if (present.has('structure') && present.has('masonry') && removed.length > 0) {
    const bits = removed.map(r => `${showQty(r.unit, r.qty)} ${r.unit === 'bags of 50 kg' ? 'bags of cement' : r.unit === 'kg' ? 'kg of steel' : r.unit === 'm³' ? `m³ of ${r.key.startsWith('sand') ? 'sand' : 'stone'}` : r.unit}`)
    checks.push({
      id: 'lintels',
      clause: 'Counted once',
      description: 'Lintels over doors and windows',
      status: 'pass',
      detail: `The frame report already counts the lintels, and so does the walls report. The walls report's share (${bits.join(', ')}) is taken out of this list so the same concrete and steel are not ordered twice.`,
    })
  }

  const warnings: string[] = []
  if (missing.length > 0) warnings.push(`This total covers ${srcs.length} of the 5 phases. It does not update if you add a phase later.`)

  const free: GrandFree = {
    engine: 'grand-v1',
    chips: [`${srcs.length} of 5 phases`, `${first.floors} ${first.floors === 1 ? 'floor' : 'floors'}`, `${fmt(area, 0)} m² built-up`],
    phases, missing, checks, warnings,
  }

  /* ---- the paid part ---- */
  const tiles: Tile[] = []
  const order: HeadKey[] = ['cement', 'steel', 'sand', 'bricks', 'aggregate']
  for (const h of order) {
    if (tiles.length === 4) break
    const hrows = headRows(rows, h)
    let total = 0
    let low = 0
    let high = 0
    for (const r of hrows) {
      for (const s of srcs) {
        const q = r.by[s.key] ?? 0
        if (q <= 0) continue
        const [lo, hi] = s.heads[h] ?? s.widest
        total += q
        low += q * lo
        high += q * hi
      }
    }
    if (total <= 0) continue
    const t = HEAD_TITLE[h]
    const d = t.unit === 'm³' ? 1 : 0
    tiles.push({ k: t.k, v: fmt(total, d), unit: t.unit === 'nos' ? 'nos' : t.unit, range: `${fmt(low, d)} to ${fmt(high, d)}` })
  }
  const itemCount = [...rows.values()].filter(r => sumBy(r) > 0).length
  if (tiles.length === 0) tiles.push({ k: 'Items to buy', v: fmt(itemCount, 0), unit: 'items' })

  const tables: Table[] = []

  tables.push({
    id: 'phases',
    title: 'What is in this total',
    sub: 'Each row is one paid report. The quantities below come from these reports and nothing else.',
    head: ['Phase', 'Floors', 'Built-up area (m²)', 'Items', 'What it covers'],
    num: [1, 2, 3],
    rows: phases.map(p => [`${p.label} · ${p.short}`, p.floors, fmt(p.builtUpM2, 0), p.items, p.covers]),
  })

  // the big materials, added across phases
  const bulkHeads: HeadKey[] = ['cement', 'sand', 'aggregate', 'steel']
  if (present.has('masonry')) bulkHeads.push('bricks')
  const contrib = srcs.filter(s => bulkHeads.some(h => headRows(rows, h).some(r => (r.by[s.key] ?? 0) > 0)))
  const bulkRows: (string | number)[][] = []
  for (const h of bulkHeads) {
    const hrows = headRows(rows, h)
    const t = HEAD_TITLE[h]
    const split: string[] = []
    let total = 0
    for (const s of contrib) {
      const q = hrows.reduce((a, r) => a + (r.by[s.key] ?? 0), 0)
      total += q
      split.push(q > 0 ? showQty(t.unit, q) : '–')
    }
    if (total <= 0) continue
    // the figure to order comes first, so a narrow screen shows it before the split by phase
    bulkRows.push([t.item, showQty(t.unit, total), t.unit, ...split])
  }
  if (bulkRows.length > 0) {
    tables.push({
      id: 'bulk',
      title: 'The big materials, added across phases',
      sub: 'Cement, sand and stone are used by more than one phase. Here they are added into one figure to order.',
      head: ['Material', 'Total', 'Unit', ...contrib.map(s => defOf(s.key).short)],
      num: [1, ...contrib.map((_, i) => i + 3)],
      rows: bulkRows,
      note: 'Each phase rounds its own figures up to whole bags, bars and units, so the total can sit a little above the sum of unrounded figures. Steel is the sum of every bar size in the frame (and the lintel bars when no frame report is in the total).',
    })
  }

  // one buying list per phase, everything except the shared bulk (which is above)
  for (const s of srcs) {
    const d = defOf(s.key)
    const lines = s.lines.filter(l => !BULK.has(l.key))
    const outRows: (string | number)[][] = []
    for (const l of lines) {
      const row = rows.get(`${l.key}|${l.unit}`)
      const q = row?.by[s.key] ?? 0
      if (q <= 0) continue
      outRows.push([l.item, showQty(l.unit, q), l.unit, l.basis])
    }
    if (outRows.length === 0) continue
    tables.push({
      id: `phase-${s.key}`,
      title: `${d.short}: ${d.label}`,
      sub: `${d.stage}. ${d.covers}.`,
      head: ['Item', 'Quantity', 'Unit', 'How it is counted'],
      num: [1],
      rows: outRows,
    })
  }

  tables.push({
    id: 'order',
    title: 'When you need each phase',
    sub: 'Follow the order the work follows on site, so material is not sitting on site (or running out) at the wrong time.',
    head: ['Phase', 'When'],
    rows: srcs.map(s => [`${defOf(s.key).stage} · ${defOf(s.key).short}`, defOf(s.key).when]),
  })

  // the merged lines, for anyone who wants the whole list as data
  const lines: QtyLine[] = []
  for (const r of rows.values()) {
    const total = sumBy(r)
    if (total <= 0) continue
    lines.push({ key: r.key, item: r.item, qty: tidy(r.unit, total), unit: r.unit, group: r.group, basis: r.basis })
  }

  const bands: BandRow[] = srcs.map(s => ({ label: `${defOf(s.key).label}: the widest range in that report`, low: s.widest[0], high: s.widest[1] }))

  const assumptions = [
    'Every figure comes from the paid report of its phase, as the customer received it. The Grand Total adds those reports; it does not recalculate them.',
    'Quantities are added by item. Cement, sand and stone from different phases go into one figure; every other item stays under its own phase.',
    'Where two reports count the same thing, it is counted once. The lintels over doors and windows are counted in the frame, so the walls report’s lintel concrete and steel are taken out when both are present.',
    'The ranges beside the big totals add each phase’s own range for that material. The phases are separate estimates, so they can be off in the same direction, and the combined range is never narrower than the widest of them.',
    'The assumptions behind every phase are listed under “The assumptions in each phase” below. Where a phase assumes a room size, a door size or a wastage, that assumption is in the total.',
  ]

  const notIncluded = [
    'Labour, contractors, equipment hire and transport. The site counts quantities only.',
    'Anything a phase report lists as not counted (listed under each phase).',
    ...(missing.length > 0 ? [`The phases not in this total: ${missing.map(m => m.label).join(', ')}.`] : []),
    'Site-specific items no questionnaire can see: a basement, a lift, a swimming pool, a compound wall, landscaping and soil treatment beyond what a phase lists.',
  ]

  const sources = [
    ...Array.from(new Set(srcs.flatMap(s => s.sources))),
  ]

  const phaseNotes: PhaseNote[] = srcs.map(s => ({ key: s.key, label: defOf(s.key).label, assumptions: s.assumptions, notIncluded: s.notIncluded }))

  return { free, paid: { engine: 'grand-v1', tiles, tables, lines, bands, assumptions, notIncluded, sources, phaseNotes } }
}

/* ---- names and wording for the page, the PDF and the email -------------------------------------- */

export const GRAND_META = {
  label: 'Grand Total',
  heading: 'Grand Total quantities',
  tag: 'GRAND TOTAL',
  code: 'GT',
  eyebrow: 'All phases · one buying list',
  blurb: 'Your frame, walls, wiring, plumbing and finishing reports added into one list of what to buy, with cement, sand and stone added across phases and nothing counted twice.',
  includes: [
    'One list of what to buy, in the order the work happens on site',
    'Cement, sand and stone added across every phase',
    'Anything two reports both count (the lintels) taken out, so it is ordered once',
    'A check that the reports are for the same building, and which phases are missing',
    'The assumptions behind every phase, and what is not counted',
    'A PDF you can hand to your contractor',
  ],
  next: { href: '/reports', name: 'Your reports', text: 'Every report you have bought stays on your account, and in the email we sent you.' },
  busy: { title: 'Adding your reports together…', text: 'Merging the phases and checking that nothing is counted twice. This takes a few seconds.' },
}
