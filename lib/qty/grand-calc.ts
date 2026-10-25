/*
  The calculation sheet of the Grand Total: the last pages of the paid Grand Total report.

  The Grand Total is arithmetic over the buying lines of the phase reports. This sheet shows that arithmetic: which reports
  were added (by report id), the rule by which their lines were merged, the quantities two reports both count (the lintels over
  doors and windows) set side by side and taken out once, the rounding to buying units, how the range beside each big total
  is put together, and the final buying list. It does NOT repeat the working inside a phase: that is in the calculation sheet
  at the end of each phase's own report, which this sheet points to by phase and report id.

  How it is built (rule: derived, never retyped).
    - The merge, the overlap, the sums, the ranges and the rounding are carried out again here, step by step, through the
      Ledger (../calcsheet/ledger.ts), from the SAME phase sources the report was built from (PhaseSource, see grand.ts and
      grand-server.ts). Every step that has a counterpart in the engine (mergeLines in grand.ts) is compared with it.
    - Every figure in the printed report (tiles, the three kinds of table, the merged lines, the bands, the checks on the
      free page) is rebuilt and compared with the report as it was handed in (GrandPaid, GrandFree). One tie row each.
    - If anything disagrees, or anything throws, the builder returns null after console.error-ing the list, and the report
      is printed without a sheet. A sheet that disagrees with the report is never shown.

  SIGNATURE
    buildGrandCalc(srcs, free, paid, opts?)       srcs = the PhaseSource of every phase in the total, as loadPhase() returns them
    buildGrandCalcFromRows(rows, free, paid)      rows = the saved estimate rows of the selected reports (what the report and
                                                  generate-pdf routes already read); loads each phase exactly as the routes do

  Quantities only: no rupee figure, no rate, no labour cost.
*/

import {
  Ledger, num, tie, sheetIsSound,
  type CalcBlock, type CalcLine, type CalcOpts, type CalcSection, type CalcSheet, type CalcTable, type CalcTieRow, type Vars,
} from '../calcsheet'
import {
  PHASES, agreement, mergeLines,
  type GrandFree, type GrandPaid, type HeadKey, type PhaseDef, type PhaseKey, type PhaseSource,
} from './grand'
import { loadPhase, type EstimateRow } from './grand-server'
import { TRADE_META } from './meta'
import { SQFT_TO_M2, fmt, round } from './util'
import type { PaidPayload as FramePaid } from '../structopro-qty/payload'

/* ---- what the caller may add -------------------------------------------------------------------- */

export interface GrandCalcOptions {
  /**
   * The frame (StructurePro) report's paid payload, when the caller has it (the frozen `result_data.paid` of that estimate).
   * With it the sheet also re-derives the frame's buying lines from the frame's own figures and shows the frame's lintel steel
   * beside the walls report's. Without it the sheet states the rounding rule and checks that the frame's lines obey it.
   */
  framePaid?: FramePaid
  /** Filled in when a sheet is returned: how many steps were compared with the engine and how many reconciliation rows there are (for the checking scripts). */
  stats?: { ledgerChecks: number; tieRows: number }
}

/** Loads every selected phase exactly as the report and PDF routes do, then builds the sheet. Null if any phase cannot be read. */
export function buildGrandCalcFromRows(rows: EstimateRow[], free: GrandFree, paid: GrandPaid): CalcSheet | null {
  const srcs: PhaseSource[] = []
  let framePaid: FramePaid | undefined
  for (const r of rows) {
    const loaded = loadPhase(r)
    if (!loaded.ok) {
      console.error(`Grand Total calculation sheet: ${loaded.error}`)
      return null
    }
    srcs.push(loaded.src)
    if (loaded.src.key === 'structure') {
      const p = (r.result_data as { paid?: FramePaid } | null)?.paid
      if (p && p.engine === 'qty-v2') framePaid = p
    }
  }
  return buildGrandCalc(srcs, free, paid, { framePaid })
}

/* ---- small shared things ------------------------------------------------------------------------ */

type P<T> = Partial<Record<PhaseKey, T>>

const defOf = (k: PhaseKey): PhaseDef => PHASES.find(p => p.key === k)!
const orderOf = (k: PhaseKey): number => PHASES.findIndex(p => p.key === k)

/** The code in a phase's report id: NS-<code>-<first 8 of the estimate id>. StructurePro's route writes SP; the trades' codes are in meta.ts. */
const REPORT_CODE: Record<PhaseKey, string> = {
  structure: 'SP',
  masonry: TRADE_META.masonpro.code,
  electrical: TRADE_META.electropro.code,
  plumbing: TRADE_META.plumbpro.code,
  interior: TRADE_META.interiorpro.code,
}
export const phaseReportId = (s: Pick<PhaseSource, 'key' | 'estimateId'>): string => `NS-${REPORT_CODE[s.key]}-${s.estimateId.slice(0, 8).toUpperCase()}`

/* The Grand Total's rounding to a buying unit (grand.ts `tidy`): whole units upwards, volumes to 0.01 m³, areas to 0.1 m². */
const tidyQty = (unit: string, v: number): number => (unit === 'm³' ? round(v, 2) : unit === 'm²' ? round(v, 1) : Math.ceil(v - 1e-9))
const dpOf = (unit: string): number => (unit === 'm³' ? 2 : unit === 'm²' ? 1 : 0)
const ruleOf = (unit: string): string => (unit === 'm³' ? 'to 0.01 m³' : unit === 'm²' ? 'to 0.1 m²' : 'up to a whole number')
/* How the report prints a quantity in its tables (grand.ts `showQty`). */
const showQty = (unit: string, w: number): string => {
  const v = w + 0 // turns -0 into 0
  return unit === 'm³' ? fmt(v, v >= 10 ? 1 : 2) : unit === 'm²' ? fmt(v, v >= 100 ? 0 : 1) : fmt(v, 0)
}

/* Thresholds of the same-building test (grand.ts `agreement` and the check in buildGrand). */
const AREA_REFUSE = 0.1
const AREA_NOTE = 0.02
/* The three lines whose quantities are shown in the big-materials table and not repeated in a phase's own list (grand.ts BULK). */
const BULK = new Set(['cement-bag-50kg', 'sand-m3', 'aggregate-20mm-m3'])

interface HeadDef { tile: string; item: string; unit: string; test: (key: string) => boolean }
const HEADS: Record<HeadKey, HeadDef> = {
  cement: { tile: 'Cement', item: 'Cement', unit: 'bags of 50 kg', test: k => k === 'cement-bag-50kg' },
  steel: { tile: 'Steel bars', item: 'Steel bars, all sizes', unit: 'kg', test: k => k.startsWith('steel-') },
  sand: { tile: 'Sand', item: 'Sand', unit: 'm³', test: k => k === 'sand-m3' },
  bricks: { tile: 'Bricks or blocks', item: 'Bricks or blocks', unit: 'nos', test: k => k.startsWith('masonry-unit-') },
  aggregate: { tile: 'Stone aggregate', item: 'Stone aggregate 20 mm', unit: 'm³', test: k => k === 'aggregate-20mm-m3' },
}
const TILE_ORDER: HeadKey[] = ['cement', 'steel', 'sand', 'bricks', 'aggregate']

/* Which band of a phase's own report feeds which headline material (grand.ts frameHeads and tradeHeads). Used for the note only. */
const BAND_FROM: Record<PhaseKey, Partial<Record<HeadKey, string>>> = {
  structure: { cement: 'cement', sand: 'concrete', aggregate: 'concrete', steel: 'steel' },
  masonry: { cement: 'Cement', sand: 'Sand', aggregate: 'Lintel concrete and steel', steel: 'Lintel concrete and steel', bricks: 'Bricks (or Blocks)' },
  electrical: {},
  plumbing: {},
  interior: { cement: 'Mortar, adhesive and grout', sand: 'Mortar, adhesive and grout' },
}

const parseCell = (c: string | number | undefined): number => {
  if (typeof c === 'number') return c
  const t = (c ?? '').trim()
  if (t === '' || t === '–' || t === '-') return 0
  const n = Number(t.replace(/,/g, ''))
  return Number.isFinite(n) ? n : NaN
}
const decimalsOf = (c: string | number | undefined): number => (typeof c === 'string' && c.includes('.') ? c.split('.')[1].length : 0)
const numbersIn = (s: string): number[] => (s.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(x => Number(x.replace(/,/g, '')))
/** The report prints `cell` for the figure `v`: they agree when v rounds to the printed cell. */
const cellAgrees = (cell: string | number | undefined, v: number): boolean => Math.abs(parseCell(cell) - v) <= 0.5 * 10 ** -decimalsOf(cell) + 1e-7

/** v1 + v2 + ... through a Ledger, with an optional name in front of each term. */
function addUp(Lx: Ledger, label: string, xs: number[], o: CalcOpts & { formula?: string; names?: string[] } = {}): number {
  const vars: Vars = {}
  xs.forEach((x, i) => { vars[`x${i}`] = x })
  const dp = o.dp
  const working = xs.map((_, i) => `${o.names ? o.names[i] + ' ' : ''}{x${i}${dp !== undefined ? ':' + dp : ''}}`).join(' + ')
  return Lx.calc(label, o.formula ?? 'sum of the parts', working, vars, v => xs.reduce((s, _x, i) => s + v[`x${i}`], 0), o)
}

const same = (xs: string[]): boolean => new Set(xs.map(x => x.trim().toLowerCase())).size <= 1

/* ---- the builder -------------------------------------------------------------------------------- */

export function buildGrandCalc(input: PhaseSource[], free: GrandFree, paid: GrandPaid, opts: GrandCalcOptions = {}): CalcSheet | null {
  try {
    return build(input, free, paid, opts)
  } catch (e) {
    console.error('Grand Total calculation sheet: could not be built:', e instanceof Error ? e.message : e)
    return null
  }
}

interface RowD {
  id: string
  key: string
  item: string
  unit: string
  group: string
  basis: string
  /** per phase, as the phase's own list gives it */
  before: P<number>
  /** per phase, after the quantities two reports both count are taken out */
  after: P<number>
  total: number
  qty: number
}

interface Cut {
  rowId: string
  phase: PhaseKey
  unit: string
  item: string
  have: number
  frame: number
  cut: number
  left: number
}

function build(input: PhaseSource[], free: GrandFree, paid: GrandPaid, opts: GrandCalcOptions): CalcSheet | null {
  const L = new Ledger() // lines that are printed
  const H = new Ledger() // working that is only tabulated; its comparisons count all the same
  const extra: string[] = []
  const ties: CalcTieRow[] = []
  const bad = (m: string) => { extra.push(m) }

  if (input.length === 0) {
    console.error('Grand Total calculation sheet: no phases given')
    return null
  }
  const srcs = [...input].sort((a, b) => orderOf(a.key) - orderOf(b.key))
  if (new Set(srcs.map(s => s.key)).size !== srcs.length) bad('Two reports are for the same phase: their lines would be added as one phase and counted twice')
  const n = srcs.length
  const eng = mergeLines(srcs)
  const present = new Set(srcs.map(s => s.key))
  const hasFrame = present.has('structure')
  const idOf = (k: PhaseKey) => phaseReportId(srcs.find(s => s.key === k)!)
  const shortOf = (k: PhaseKey) => defOf(k).short
  const frameSrc = srcs.find(s => s.key === 'structure')

  /* ================================================================================================
     2. Adding the lists: the merge by key and unit
     ================================================================================================ */
  const rows: RowD[] = []
  const byId = new Map<string, RowD>()
  const parts = new Map<string, P<number[]>>()
  let lineCount = 0
  for (const s of srcs) {
    for (const l of s.lines) {
      lineCount++
      const id = `${l.key}|${l.unit}`
      let r = byId.get(id)
      if (!r) {
        r = { id, key: l.key, item: l.item, unit: l.unit, group: l.group, basis: l.basis, before: {}, after: {}, total: 0, qty: 0 }
        byId.set(id, r)
        rows.push(r)
        parts.set(id, {})
      }
      const pp = parts.get(id)!
      ;(pp[s.key] ??= []).push(l.qty)
    }
  }
  for (const r of rows) {
    const pp = parts.get(r.id)!
    for (const s of srcs) {
      const xs = pp[s.key]
      if (!xs) continue
      r.before[s.key] = xs.length === 1 ? xs[0] : addUp(H, `${r.item}: ${shortOf(s.key)}`, xs, { dp: 3 })
      r.after[s.key] = r.before[s.key]
    }
  }
  // the same key written with two units never merges: tell the reader if that happened
  const unitsOfKey = new Map<string, Set<string>>()
  for (const r of rows) (unitsOfKey.get(r.key) ?? unitsOfKey.set(r.key, new Set()).get(r.key)!).add(r.unit)
  const splitKeys = [...unitsOfKey.entries()].filter(([, u]) => u.size > 1).map(([k, u]) => `${k} (${[...u].join(' and ')})`)

  H.compare('Items in the merged list', rows.length, eng.rows.size, 0)

  const shared = rows.filter(r => Object.keys(r.before).length > 1)
  const sharedSum = new Map<string, number>()
  const mergeBlocks: CalcBlock[] = []
  {
    L.say('Same item', 'Two lines are the same item when BOTH the key and the unit are the same (for example cement-bag-50kg in bags of 50 kg). Their quantities are added. The same key in two different units is not merged.', 'NirmanShastra rule: merge by key and unit')
    L.say('Name and group', 'The item name, group and "how it is counted" wording are taken from the first phase, in the order of work on site, that has the item.', 'NirmanShastra rule')
    L.say('Order of work', `Frame, walls, wiring, plumbing, finishing. ${n === 5 ? 'All five are in this total.' : `This total has ${n} of the 5.`}`, 'NirmanShastra rule')
    L.value('Lines in the reports added', lineCount, 'lines', 0, 'Phase reports named in section 1')
    L.value('Different items after merging', rows.length, 'items', 0, 'Engine rule: key and unit', `${rows.length - shared.length} items come from one report only and pass through unchanged; ${shared.length} come from more than one report.`)
    if (splitKeys.length > 0) L.say('Same key, different units', `Kept apart: ${splitKeys.join('; ')}.`, 'NirmanShastra rule')
    mergeBlocks.push({ id: 'merge-rule', title: '2.1 The rule', lines: L.take() })

    if (shared.length > 0) {
      const cols = srcs.filter(s => shared.some(r => r.before[s.key] !== undefined))
      const trows: string[][] = []
      for (const r of shared) {
        const vals = cols.map(s => r.before[s.key])
        const sum = addUp(H, `${r.item} before the overlap`, vals.filter((v): v is number => v !== undefined), { dp: 3 })
        sharedSum.set(r.id, sum)
        trows.push([r.item, r.unit, ...vals.map(v => (v === undefined ? '–' : showQty(r.unit, v))), showQty(r.unit, sum)])
      }
      mergeBlocks.push({
        id: 'merge-shared',
        title: '2.2 Items that more than one report supplies, before anything is taken out',
        intro: 'Only these items need adding. Every other item has one source and is carried over as it stands. The last column is the plain sum; the next section takes out what two reports both count.',
        table: {
          head: ['Item', 'Unit', ...cols.map(s => `${defOf(s.key).short} (${idOf(s.key)})`), 'Sum'],
          rows: trows,
          num: cols.map((_, i) => i + 2).concat(cols.length + 2),
          note: 'Each phase has already rounded its own figure up to a whole bag, bar or unit, so the sum is a sum of rounded figures. Quantities are printed to the precision the report uses; the sums are carried at full precision.',
        },
      })
    } else {
      L.say('Items from more than one report', 'None. Every item has one source.')
      mergeBlocks.push({ id: 'merge-shared', title: '2.2 Items that more than one report supplies', lines: L.take() })
    }
  }

  /* ================================================================================================
     3. Counted twice: the overlap
     ================================================================================================ */
  const cuts: Cut[] = []
  const overlapBlocks: CalcBlock[] = []
  const withOverlap = srcs.filter(s => s.key !== 'structure' && s.overlap)
  {
    if (!hasFrame) {
      if (withOverlap.length > 0) {
        L.say('Frame report not in this total', `The ${withOverlap.map(s => defOf(s.key).label).join(' and ')} report counts ${[...new Set(withOverlap.map(s => s.overlap!.label.toLowerCase()))].join(' and ')}, which the frame report also counts. Without the frame report in the total nothing is counted twice, so nothing is taken out and the walls report keeps its own lintel quantities.`, 'NirmanShastra rule: overlap is removed only when the frame is present')
      } else {
        L.say('Nothing counted twice', 'No report in this total lists a quantity that another report also counts.', 'NirmanShastra rule')
      }
      overlapBlocks.push({ id: 'overlap-none', title: '3.1 Quantities two reports both count', lines: L.take() })
    } else if (withOverlap.length === 0) {
      L.say('Nothing counted twice', 'No other report in this total lists a quantity that the frame report also counts, so nothing is taken out.', 'NirmanShastra rule')
      overlapBlocks.push({ id: 'overlap-none', title: '3.1 Quantities two reports both count', lines: L.take() })
    } else {
      for (const s of withOverlap) {
        const ov = s.overlap!
        const d = defOf(s.key)
        const skippedNotes: string[] = []
        const mine: Cut[] = []
        const sbs: string[][] = []
        for (const o of ov.lines) {
          const r = byId.get(`${o.key}|${o.unit}`)
          const have = r?.after[s.key]
          const nm = r ? r.item : o.key
          if (!r || have === undefined) { skippedNotes.push(`${o.key} is not in the ${d.short.toLowerCase()} list: nothing to take out.`); continue }
          if (Math.min(have, o.qty) <= 0) { skippedNotes.push(`${nm}: nothing to take out.`); continue }
          const dp = dpOf(o.unit)
          const dpq = Math.max(dp, 2)
          L.value(`${nm}: in the ${d.short.toLowerCase()} report`, have, o.unit, dp, `${idOf(s.key)}, buying list`)
          L.value(`${nm}: the frame also counts`, o.qty, o.unit, dpq, `${idOf(s.key)}, overlap list "${ov.label}"`, 'The share of this item that is inside the lintels.')
          const engCut = eng.removed.find(x => x.phase === s.key && x.key === o.key && x.unit === o.unit)
          const cut = L.calc(`${nm}: taken out`, 'cut = the smaller of the two figures', 'smaller of {have:3} and {frame:3}', { have, frame: o.qty }, v => Math.min(v.have, v.frame), { unit: o.unit, dp: dpq, ref: 'NirmanShastra rule: take the overlap out once', expect: engCut?.qty })
          if (!engCut) bad(`The engine took nothing out of ${nm} (${d.short}) but the sheet took out ${cut}`)
          const left = L.calc(`${nm}: left for the ${d.short.toLowerCase()} report`, `left = round (in the report − taken out), ${ruleOf(o.unit)}`, 'round ({have:3} − {cut:3})', { have, cut }, v => tidyQty(o.unit, v.have - v.cut), { unit: o.unit, dp, ref: 'NirmanShastra rule: rounded to the buying unit', expect: eng.rows.get(r.id)?.by[s.key], tol: 1e-6 })
          r.after[s.key] = left
          mine.push({ rowId: r.id, phase: s.key, unit: o.unit, item: nm, have, frame: o.qty, cut, left })
          sbs.push([nm, o.unit, showQty(o.unit, have), fmt(o.qty, dpq), fmt(cut, dpq), showQty(o.unit, left)])
        }
        cuts.push(...mine)
        for (const x of skippedNotes) L.say('Not taken out', x)
        const lines = L.take()

        const blk: CalcBlock = {
          id: `overlap-${s.key}`,
          title: `3.${overlapBlocks.length + 1} ${d.label} (${idOf(s.key)}): ${ov.label.toLowerCase()}`,
          intro: `Both the frame report (${frameSrc ? idOf('structure') : 'StructurePro'}) and the ${d.label} report count ${ov.label.toLowerCase()}. Each report is complete on its own, so each shows them. In the Grand Total the frame's figure is kept and the ${d.label} report's share is taken out, so the same concrete and steel are not ordered twice. For each item the two figures are set side by side; the amount taken out is the smaller of the two.`,
        }
        if (sbs.length > 0) {
          blk.table = {
            head: ['Item', 'Unit', `In the ${d.short.toLowerCase()} report`, 'Also counted in the frame', 'Taken out', `Left for ${d.short.toLowerCase()}`],
            rows: sbs,
            num: [2, 3, 4, 5],
          }
        }
        blk.lines = lines
        const fl = opts.framePaid?.secondary.find(i => i.key === 'lintels')
        const steelCut = mine.find(c => c.unit === 'kg' && c.rowId.startsWith('steel-'))
        if (fl && steelCut) {
          blk.note = `For comparison, the frame report's own lintels: ${fl.count} lintels, ${num(fl.concreteM3, 2)} m³ of concrete and ${num(fl.steelKg, 0)} kg of steel (${idOf('structure')}). The ${d.label} report counted ${num(steelCut.frame, 0)} kg of lintel steel. The two reports size the lintels with their own rules, so the figures need not be equal; the frame's are kept.`
        }
        overlapBlocks.push(blk)
      }
    }
  }

  /* the engine's own list of what it took out must be exactly what the sheet took out */
  const engRemoved = eng.removed
  H.compare('Number of quantities taken out', cuts.length, engRemoved.length, 0)

  /* ================================================================================================
     5. The big materials added across phases (needs `after`, so it is built here; printed as section 5)
     ================================================================================================ */
  for (const r of rows) {
    const vals = srcs.map(s => r.after[s.key]).filter((v): v is number => v !== undefined)
    r.total = vals.length === 1 ? vals[0] : addUp(H, `${r.item}: all phases`, vals, { dp: 3 })
    r.qty = tidyQty(r.unit, r.total)
    for (const s of srcs) {
      const e = eng.rows.get(r.id)?.by[s.key]
      if (r.after[s.key] !== undefined || e !== undefined) H.compare(`${r.item}: ${shortOf(s.key)} after the overlap`, r.after[s.key] ?? 0, e ?? 0, undefined, 1e-6)
    }
  }

  const headRows = (h: HeadKey): RowD[] => rows.filter(r => HEADS[h].test(r.key))
  /** what each phase supplies of a headline material, after the overlap, through the Ledger Lx */
  const supply = (Lx: Ledger, h: HeadKey, s: PhaseSource, label: string): number => {
    const xs = headRows(h).map(r => r.after[s.key]).filter((v): v is number => v !== undefined && v > 0)
    if (xs.length === 0) return 0
    if (xs.length === 1) return xs[0]
    return addUp(Lx, label, xs, { dp: HEADS[h].unit === 'm³' ? 2 : 0 })
  }

  const bulkHeads: HeadKey[] = ['cement', 'sand', 'aggregate', 'steel']
  if (present.has('masonry')) bulkHeads.push('bricks')
  const bulkBlocks: CalcBlock[] = []
  const bulkTotal = new Map<HeadKey, number>()
  const bulkSplit = new Map<HeadKey, P<number>>()
  for (const h of bulkHeads) {
    const hd = HEADS[h]
    const split: P<number> = {}
    const names: string[] = []
    const xs: number[] = []
    const dp = hd.unit === 'm³' ? 2 : 0
    for (const s of srcs) {
      const hr = headRows(h).filter(r => (r.after[s.key] ?? 0) > 0)
      if (hr.length === 0) continue
      const q = hr.length === 1 ? hr[0].after[s.key]! : addUp(L, `${hd.item}: ${shortOf(s.key)}, ${hr.length} lines`, hr.map(r => r.after[s.key]!), { dp, unit: hd.unit, note: hr.map(r => r.item).join('; '), ref: 'NirmanShastra rule: lines added across bar sizes' })
      split[s.key] = q
      names.push(shortOf(s.key))
      xs.push(q)
    }
    bulkSplit.set(h, split)
    if (xs.length === 0) { L.take(); continue }
    const engTotal = headRows(h).reduce((a, r) => a + Object.values(eng.rows.get(r.id)?.by ?? {}).reduce<number>((x, v) => x + (v ?? 0), 0), 0)
    const total = xs.length === 1
      ? L.calc(`${hd.item} to order, all phases`, 'total = the one phase that supplies it', `${names[0]} {x0:${dp}}`, { x0: xs[0] }, v => v.x0, { unit: hd.unit, dp, result: true, expect: engTotal, tol: 1e-6, ref: 'NirmanShastra rule: big materials are added across phases' })
      : addUp(L, `${hd.item} to order, all phases`, xs, { names, dp, unit: hd.unit, result: true, expect: engTotal, tol: 1e-6, formula: 'total = sum over the phases', ref: 'NirmanShastra rule: big materials are added across phases' })
    bulkTotal.set(h, total)
    let note: string | undefined
    if (h === 'steel' && present.has('masonry')) {
      note = hasFrame
        ? 'The walls report\'s lintel bars were taken out in section 3, so only the frame\'s bars are counted here.'
        : 'There is no frame report in this total, so the walls report\'s lintel bars are counted here.'
    }
    if (h === 'bricks' && headRows('bricks').filter(r => r.total > 0).length > 1) note = 'The walls report uses more than one kind of unit (for example AAC blocks above the plinth and concrete blocks in it). They are added as pieces although they differ in size.'
    bulkBlocks.push({ id: `bulk-${h}`, title: `5.${bulkBlocks.length + 1} ${hd.item}`, lines: L.take(), note })
  }

  /* ================================================================================================
     6. How far off can it be: the range beside each big total
     ================================================================================================ */
  interface Contribution { phase: PhaseKey; q: number; lo: number; hi: number; own: boolean }
  interface TileD { h: HeadKey; total: number; low: number; high: number; d: number; parts: Contribution[] }
  const tilesD: TileD[] = []
  const rangeBlocks: CalcBlock[] = []
  let cmpRows: string[][] = []
  {
    L.say('What the multipliers are', 'Every phase report carries, for each material it supplies, a low and a high multiplier: the quantity shown is multiplied by them to give the range the real figure is likely to fall in (a band of 0.92 and 1.40 means from 8% below to 40% above). The multipliers are the tool authors\' judgement of how far each class of figure can be off. They are not measured standard deviations or confidence limits.', 'NirmanShastra assumption (phase reports)')
    L.say('How the ranges are added', 'Low end of a total = the sum over the phases of (quantity from that phase × its low multiplier). High end likewise with the high multiplier. The ends are added STRAIGHT, end to end. They are not combined in quadrature (the square root of the sum of squares).', 'Engine rule: ranges added end to end')
    L.say('What straight addition assumes', 'Adding the ends straight is what is right if the phases are all wrong in the same direction at the same time (errors fully correlated, correlation +1). If the errors were independent they would partly cancel and the true spread would be narrower: the comparison table below gives that narrower figure. The phases here share their drivers (the same floor areas, the same plan and the same rules of thumb), so independence is not safe to assume, and straight addition is the cautious choice. It is an upper envelope of the spread, not a statistical interval: the multipliers are judgement ranges, they are not symmetric about the figure shown, and the sheet does not claim any probability for them.', 'JCGM 100:2008 cl. 5.1.2 (independent) and cl. 5.2.2 Note 1 (fully correlated)')
    L.say('Where a phase has no band of its own', 'If a phase report gives no band for a material, the widest band of that report (its lowest low and its highest high) is used.', 'Engine rule')
    rangeBlocks.push({ id: 'range-rule', title: '6.1 The rule', lines: L.take() })
  }
  {
    for (const h of TILE_ORDER) {
      if (tilesD.length === 4) break
      const hd = HEADS[h]
      const d = hd.unit === 'm³' ? 1 : 0
      const partsD: Contribution[] = []
      for (const s of srcs) {
        const q = supply(H, h, s, `${hd.item}: ${shortOf(s.key)}`)
        if (q <= 0) continue
        const own = s.heads[h]
        const [lo, hi] = own ?? s.widest
        partsD.push({ phase: s.key, q, lo, hi, own: !!own })
      }
      if (partsD.length === 0) continue
      // the header comparison in section 5 and the total here must be the same number
      const dpp = d === 0 ? 1 : 2
      const ex = (i: number) => paid.tiles[i]
      const idx = tilesD.length
      const total = addUp(L, `${hd.tile}: total`, partsD.map(c => c.q), { names: partsD.map(c => shortOf(c.phase)), dp: d === 0 ? 0 : 2, unit: hd.unit, formula: 'T = sum of the quantities', result: true, expect: bulkTotal.get(h) })
      const lows: number[] = []
      const highs: number[] = []
      for (const c of partsD) {
        const bandNote = c.own ? `Band from the ${defOf(c.phase).short.toLowerCase()} report${BAND_FROM[c.phase][h] ? ` ("${BAND_FROM[c.phase][h]}")` : ''}` : `No band of its own for this material: the widest band of the ${defOf(c.phase).short.toLowerCase()} report`
        lows.push(L.calc(`${hd.tile} from ${shortOf(c.phase)}: low end`, 'q × low multiplier', `{q:${d === 0 ? 0 : 2}} × {lo}`, { q: c.q, lo: c.lo }, v => v.q * v.lo, { unit: hd.unit, dp: dpp, note: bandNote, ref: 'Engine rule: quantity × band' }))
        highs.push(L.calc(`${hd.tile} from ${shortOf(c.phase)}: high end`, 'q × high multiplier', `{q:${d === 0 ? 0 : 2}} × {hi}`, { q: c.q, hi: c.hi }, v => v.q * v.hi, { unit: hd.unit, dp: dpp, ref: 'Engine rule: quantity × band' }))
      }
      const rep = ex(idx) && ex(idx).range ? ex(idx).range!.split(' to ').map(x => parseCell(x)) : [NaN, NaN]
      const low = addUp(L, `${hd.tile}: range, low end`, lows, { dp: dpp, unit: hd.unit, formula: 'low = Σ (q × low multiplier)', result: true, expect: rep[0], tol: 0.5 * 10 ** -d + 1e-7 })
      const high = addUp(L, `${hd.tile}: range, high end`, highs, { dp: dpp, unit: hd.unit, formula: 'high = Σ (q × high multiplier)', result: true, expect: rep[1], tol: 0.5 * 10 ** -d + 1e-7 })
      rangeBlocks.push({ id: `range-${h}`, title: `6.${rangeBlocks.length + 1} ${hd.tile}`, lines: L.take() })
      tilesD.push({ h, total, low, high, d, parts: partsD })
    }

    // comparison with independent errors
    cmpRows = []
    for (const t of tilesD) {
      const hd = HEADS[t.h]
      const dn = H.calc(`${hd.tile}: downward spread if independent`, 'sqrt of the sum of (q × (1 − low))²', t.parts.map((_c, i) => `({q${i}} × (1 − {lo${i}}))²`).join(' + '), Object.fromEntries(t.parts.flatMap((c, i) => [[`q${i}`, c.q], [`lo${i}`, c.lo]])), v => Math.sqrt(t.parts.reduce((s, _c, i) => s + (v[`q${i}`] * (1 - v[`lo${i}`])) ** 2, 0)))
      const up = H.calc(`${hd.tile}: upward spread if independent`, 'sqrt of the sum of (q × (high − 1))²', t.parts.map((_c, i) => `({q${i}} × ({hi${i}} − 1))²`).join(' + '), Object.fromEntries(t.parts.flatMap((c, i) => [[`q${i}`, c.q], [`hi${i}`, c.hi]])), v => Math.sqrt(t.parts.reduce((s, _c, i) => s + (v[`q${i}`] * (v[`hi${i}`] - 1)) ** 2, 0)))
      const d = t.d
      cmpRows.push([hd.tile, hd.unit, `${fmt(t.total, d)}`, `${fmt(t.low, d)} to ${fmt(t.high, d)}`, `${fmt(t.total - dn, d)} to ${fmt(t.total + up, d)}`, `${round((t.low / t.total) * 100, 0)}% to ${round((t.high / t.total) * 100, 0)}%`])
    }
    if (cmpRows.length > 0) {
      rangeBlocks.push({
        id: 'range-compare',
        title: `6.${rangeBlocks.length + 1} Straight addition against independent errors (for comparison only)`,
        intro: 'The report uses the straight range (first range column). The second range is what the same multipliers would give if the phases\' errors were independent: low = T − √Σ(q × (1 − low multiplier))², high = T + √Σ(q × (high multiplier − 1))². It is shown so that a reader can see how cautious the straight sum is. It is not used anywhere in the report.',
        table: { head: ['Material', 'Unit', 'Total', 'Range in the report (straight)', 'Range if independent', 'Report range as share of total'], rows: cmpRows, num: [2] },
      })
    }
  }
  if (tilesD.length === 0) {
    // no big material at all: the report shows the number of items instead
    const itemCount = rows.filter(r => r.total > 0).length
    L.value('Items to buy', itemCount, 'items', 0, 'Engine rule: shown when no cement, steel, sand, bricks or stone is in the total')
    rangeBlocks.push({ id: 'range-items', title: `6.${rangeBlocks.length + 1} Items to buy`, lines: L.take() })
  }

  // each phase's own widest range, as the report prints it under "How far off can this be"
  const bandRows: string[][] = []
  for (const s of srcs) {
    const pb =H.calc(`${s.key}: % below`, 'round ((1 − low) × 100)', '(1 − {lo}) × 100', { lo: s.widest[0] }, v => round((1 - v.lo) * 100), { dp: 0 })
    const pa = H.calc(`${s.key}: % above`, 'round ((high − 1) × 100)', '({hi} − 1) × 100', { hi: s.widest[1] }, v => round((v.hi - 1) * 100), { dp: 0 })
    bandRows.push([`${defOf(s.key).label} (${idOf(s.key)})`, num(s.widest[0], 2), num(s.widest[1], 2), `${num(pb, 0)}%`, `${num(pa, 0)}%`])
  }
  rangeBlocks.push({
    id: 'range-widest',
    title: `6.${rangeBlocks.length + 1} Each phase's widest range`,
    intro: 'The report also prints, for each phase, the widest range found in that phase\'s own report: the lowest of its low multipliers and the highest of its high multipliers. Percent below = (1 − low) × 100; percent above = (high − 1) × 100, each rounded to a whole number.',
    table: { head: ['Phase', 'Lowest low', 'Highest high', 'Below', 'Above'], rows: bandRows, num: [1, 2, 3, 4] },
  })
  if (opts.framePaid && frameSrc) {
    const b = opts.framePaid.band
    const all = [b.concrete, b.steel, b.cement, b.formwork]
    H.compare('Frame widest low multiplier', Math.min(...all.map(x => x[0])), frameSrc.widest[0], undefined, 1e-9)
    H.compare('Frame widest high multiplier', Math.max(...all.map(x => x[1])), frameSrc.widest[1], undefined, 1e-9)
    const fh = { cement: b.cement, sand: b.concrete, aggregate: b.concrete, steel: b.steel }
    for (const [hk, v] of Object.entries(fh)) {
      const got = frameSrc.heads[hk as HeadKey]
      if (!got || got[0] !== v[0] || got[1] !== v[1]) bad(`The frame's ${hk} band in the sources differs from the frame report's own band`)
    }
  }

  /* ================================================================================================
     4. Buying units and rounding
     ================================================================================================ */
  const unitBlocks: CalcBlock[] = []
  {
    const counts = new Map<string, { units: Set<string>; n: number }>()
    for (const r of rows) {
      if (r.total <= 0) continue
      const rule = ruleOf(r.unit)
      const c = counts.get(rule) ?? { units: new Set<string>(), n: 0 }
      c.units.add(r.unit)
      c.n++
      counts.set(rule, c)
    }
    unitBlocks.push({
      id: 'units-rule',
      title: '4.1 How a total is rounded to a buying unit',
      intro: 'After the lists are added and the overlap is taken out, each total is rounded to the unit it is bought in. Whole things (bags, kilograms, metres, litres, pieces) are rounded UP, because a part-bag cannot be bought. Volumes are kept to 0.01 m³ and areas to 0.1 m². Each phase has already rounded its own figures before they are added, so a total can sit a little above the sum of unrounded figures.',
      table: {
        head: ['Rule', 'Units it applies to', 'Items in this list'],
        rows: [...counts.entries()].map(([rule, c]) => [`Rounded ${rule}`, [...c.units].join(', '), String(c.n)]),
        num: [2],
      },
    })
    L.calc('One square foot in square metres', '1 sq ft = 0.3048 m × 0.3048 m', '0.3048 × 0.3048', {}, () => 0.3048 * 0.3048, { unit: 'm²', dp: 8, expect: SQFT_TO_M2, tol: 1e-12, ref: 'International yard and pound agreement, 1959 (1 ft = 0.3048 m exactly)' })
    L.say('Where it is used', 'The trade reports take their floor areas in square feet and print the built-up area in square metres. The area in the table in section 1 is that figure, so a reader with the plan in square feet can check it as sq ft × 0.09290304.', 'Phase reports')
    unitBlocks.push({ id: 'units-area', title: '4.2 Square feet and square metres', lines: L.take() })

    // the frame's own conversion to buying units
    if (frameSrc) {
      const fl = frameSrc.lines
      const fp = opts.framePaid
      if (fp) {
        const m = fp.materials
        const check = (label: string, key: string, formula: string, working: string, vars: Vars, fn: (v: Vars) => number, unit: string) => {
          const line = fl.find(l => l.key === key)
          if (!line) { bad(`Frame line ${key} is missing`); return }
          L.calc(label, formula, working, vars, fn, { unit, dp: unit === 'm³' ? 1 : 0, expect: line.qty, tol: 1e-9, ref: 'NirmanShastra rule: frame figure rounded to the buying unit' })
        }
        check('Cement', 'cement-bag-50kg', 'bags = round up (cement from the frame report)', 'round up {c:3}', { c: m.cementBags }, v => Math.ceil(v.c - 1e-9), 'bags of 50 kg')
        check('Sand', 'sand-m3', 'sand = rounded to 0.1 m³', 'round {c:3}', { c: m.sandM3 }, v => round(v.c, 1), 'm³')
        check('Stone aggregate 20 mm', 'aggregate-20mm-m3', 'stone = rounded to 0.1 m³', 'round {c:3}', { c: m.aggregateM3 }, v => round(v.c, 1), 'm³')
        for (const sd of fp.steelByDiameter) check(`Fe500D bars, ${sd.phi} mm`, `steel-fe500d-${sd.phi}mm-kg`, 'bars = round up (kg from the frame report)', 'round up {c:3}', { c: sd.kg }, v => Math.ceil(v.c - 1e-9), 'kg')
        check('Binding wire', 'binding-wire-kg', 'wire = round up', 'round up {c:3}', { c: m.bindingWireKg }, v => Math.ceil(v.c - 1e-9), 'kg')
        check('Shuttering, contact area', 'shuttering-m2', 'area = round up to a whole m²', 'round up {c:3}', { c: fp.totals.formworkM2 }, v => Math.ceil(v.c - 1e-9), 'm²')
        check('Excavation for footings and plinth', 'excavation-m3', 'volume = rounded to 0.1 m³', 'round {c:3}', { c: fp.totals.excavationM3 }, v => round(v.c, 1), 'm³')
        if (fl.length !== 6 + fp.steelByDiameter.length) bad(`The frame report holds ${fl.length} lines but ${6 + fp.steelByDiameter.length} were expected from its payload`)
        unitBlocks.push({ id: 'units-frame', title: `4.3 The frame report's figures as buying lines (${idOf('structure')})`, intro: 'The frame report keeps its quantities at full precision. Before they are added to the other phases they are turned into buying lines: cement, bars, binding wire and shuttering are rounded up to whole bags, kilograms and square metres; sand, stone and excavation are rounded to 0.1 m³. Each figure below is worked from the frame report\'s own numbers and compared with the line the Grand Total used.', lines: L.take() })
      } else {
        const rowsU: string[][] = []
        for (const l of fl) {
          const wholeUp = l.unit !== 'm³'
          const okRule = wholeUp ? Math.abs(l.qty - Math.round(l.qty)) < 1e-9 : Math.abs(l.qty * 10 - Math.round(l.qty * 10)) < 1e-7
          H.compare(`Frame line ${l.key} obeys its rounding rule`, okRule ? 1 : 0, 1, 0)
          rowsU.push([l.item, l.unit, wholeUp ? 'Rounded up to a whole number' : 'Rounded to 0.1 m³', showQty(l.unit, l.qty)])
        }
        unitBlocks.push({
          id: 'units-frame',
          title: `4.3 The frame report's figures as buying lines (${idOf('structure')})`,
          intro: 'The frame report keeps its quantities at full precision. Before they are added to the other phases they are turned into buying lines: cement, bars, binding wire and shuttering are rounded up to whole bags, kilograms and square metres; sand, stone and excavation are rounded to 0.1 m³. The lines used are listed with their rule; the frame\'s own working is in its calculation sheet.',
          table: { head: ['Item', 'Unit', 'Rule', 'Quantity used'], rows: rowsU, num: [3] },
        })
      }
    }
  }

  /* ================================================================================================
     7. The final buying list
     ================================================================================================ */
  const listRows: string[][] = []
  const finalRows = rows.filter(r => r.total > 0)
  const engLines = new Map(paid.lines.map(l => [`${l.key}|${l.unit}`, l]))
  for (const r of finalRows) {
    const xs = srcs.map(s => ({ s, v: r.after[s.key] })).filter((x): x is { s: PhaseSource; v: number } => x.v !== undefined && x.v > 0)
    const e = engLines.get(r.id)
    H.calc(`${r.item} in the merged list`, `${ruleOf(r.unit)} of the total`, '{t:3}', { t: r.total }, v => tidyQty(r.unit, v.t), { dp: dpOf(r.unit), expect: e?.qty ?? NaN, tol: 1e-6 })
    if (!e) bad(`${r.item} is not in the report's merged list`)
    else if (e.item !== r.item || e.group !== r.group || e.basis !== r.basis) bad(`${r.item}: name, group or wording differs from the report's merged list`)
    const cut = cuts.find(c => c.rowId === r.id)
    const madeOf = xs.length === 1 && !cut ? `${shortOf(xs[0].s.key)} only` : xs.map(x => `${shortOf(x.s.key)} ${showQty(r.unit, x.v)}`).join(' + ') + (cut ? `; ${fmt(cut.cut, Math.max(dpOf(r.unit), 2))} taken out of ${shortOf(cut.phase)}` : '')
    listRows.push([r.group, r.item, r.unit, showQty(r.unit, r.qty), madeOf])
  }
  H.compare('Items in the report\'s merged list', paid.lines.length, finalRows.length, 0)
  const listBlock: CalcBlock = {
    id: 'final-list',
    title: '7.1 Every item to buy',
    intro: 'One row per item, in the order of work on site. The quantity is the sum over the phases after the overlap is taken out, rounded to the buying unit (section 4). "Made up of" shows the phases it came from and what was taken out. Each quantity was worked as shown in sections 2 to 5 and compared with the report\'s merged list.',
    table: {
      head: ['Group', 'Item', 'Unit', 'Quantity', 'Made up of'],
      rows: listRows,
      num: [3],
      foot: ['Items in the list', '', '', String(finalRows.length), ''],
      note: 'Quantities here are the merged list as data (the full list in the report is split by phase and the big materials are added in one table). Where a quantity is printed to fewer places in the report, the report rounds the same figure for the page.',
    },
  }

  /* ================================================================================================
     1. The reports that were added (built last because it counts items, printed first)
     ================================================================================================ */
  const sec1Blocks: CalcBlock[] = []
  let sbSpread = 0
  let sbFloors = true
  let sbState = true
  let sbCity = true
  let sbStatus: 'pass' | 'advisory' | 'fail' = 'pass'
  const itemsOf = (k: PhaseKey) => rows.filter(r => (r.after[k] ?? 0) > 0).length
  {
    const trows = srcs.map(s => {
      const d = defOf(s.key)
      return [`${d.label} · ${d.short}`, idOf(s.key), s.projectName, String(s.floors), num(s.builtUpM2, 1), String(s.lines.length), String(itemsOf(s.key))]
    })
    sec1Blocks.push({
      id: 'reports',
      title: '1.1 The reports in this total',
      intro: 'Each row is one paid report. The quantities in the Grand Total come from these reports and from nothing else. The working of every figure INSIDE a phase (loads, sizes, bars, joints, pipe runs and so on) is in the calculation sheet at the end of that phase\'s own report, named by its report id. This sheet does not repeat it.',
      table: {
        head: ['Phase', 'Report id', 'Project', 'Floors', 'Built-up area (m²)', 'Lines in its list', 'Items in this total'],
        rows: trows,
        num: [3, 4, 5, 6],
        note: 'Items in this total: the items of the merged list to which the phase contributes a quantity above zero, after the overlap is taken out.',
      },
    })
    const miss = PHASES.filter(p => !present.has(p.key))
    for (const p of miss) L.say(`${p.label} (${p.stage})`, `Not in this total. ${p.covers}. Its quantities are not estimated here, and the total does not update if the report is added later.`, 'NirmanShastra rule')
    if (miss.length === 0) L.say('Phases not in this total', 'None: all five phases are in.')
    sec1Blocks.push({ id: 'missing', title: '1.2 Phases not in this total', lines: L.take() })

    // same building
    const areas = srcs.map(s => s.builtUpM2)
    const av: Vars = Object.fromEntries(areas.map((a, i) => [`a${i}`, a]))
    const list = areas.map((_, i) => `{a${i}:1}`).join(', ')
    L.calc('Average built-up area of the reports', 'A = round (sum of the areas ÷ n)', `round ((${areas.map((_, i) => `{a${i}:1}`).join(' + ')}) ÷ ${n})`, av, v => Math.round(areas.reduce((s, _a, i) => s + v[`a${i}`], 0) / n), { unit: 'm²', dp: 0, ref: 'NirmanShastra rule', result: true, expect: numbersIn(free.chips[2] ?? '')[0] })
    const lo = L.calc('Smallest area', 'Amin', `smallest of (${list})`, av, v => Math.min(...areas.map((_a, i) => v[`a${i}`])), { unit: 'm²', dp: 1 })
    const hi = L.calc('Largest area', 'Amax', `largest of (${list})`, av, v => Math.max(...areas.map((_a, i) => v[`a${i}`])), { unit: 'm²', dp: 1 })
    const dev = L.calc('Spread between the reports', 'spread = (Amax − Amin) ÷ Amin × 100', '({hi:1} − {lo:1}) ÷ {lo:1} × 100', { hi, lo }, v => (v.lo > 0 ? ((v.hi - v.lo) / v.lo) * 100 : 0), { unit: '%', dp: 1, ref: 'NirmanShastra rule: same-building test', expect: agreement(srcs).dev * 100, tol: 1e-6 })
    sbSpread = dev
    sbFloors = new Set(srcs.map(s => s.floors)).size === 1
    sbState = same(srcs.map(s => s.state))
    sbCity = same(srcs.map(s => s.city))
    const within = dev <= AREA_REFUSE * 100 + 1e-9
    L.pick('Same number of floors?', 'every report must have the same', sbFloors ? `Yes (${srcs[0].floors})` : `No (${[...new Set(srcs.map(s => s.floors))].join(', ')})`, 'NirmanShastra rule: same-building test')
    L.pick('Same state?', 'every report must have the same (spelling and capitals ignored)', sbState ? `Yes (${srcs[0].state || 'not given'})` : 'No', 'NirmanShastra rule: same-building test')
    L.pick('Same city?', 'a different or differently written city is only a note', sbCity ? `Yes (${srcs[0].city || 'not given'})` : 'No: noted, not refused', 'NirmanShastra rule: same-building test')
    L.pick('Spread within the limit?', `refused if the spread is above ${num(AREA_REFUSE * 100)}%; a note if above ${num(AREA_NOTE * 100)}%`, !within ? 'No: not the same building' : dev > AREA_NOTE * 100 + 1e-9 ? 'Yes, with a note' : 'Yes', 'NirmanShastra rule: same-building test')
    sbStatus = !(sbFloors && sbState && within) ? 'fail' : dev > AREA_NOTE * 100 + 1e-9 || !sbCity ? 'advisory' : 'pass'
    L.pick('Result of the test', 'pass, pass with a note, or refuse', sbStatus === 'pass' ? 'Pass' : sbStatus === 'advisory' ? 'Pass, with a note' : 'Fail: different buildings', 'NirmanShastra rule: same-building test')
    sec1Blocks.push({
      id: 'same',
      title: '1.3 Are the reports for the same building?',
      intro: 'The floors, the state and the total floor area must agree. The test looks at nothing else: it does not compare room counts, wall materials or storey heights, which each phase takes from its own questions.',
      lines: L.take(),
    })
  }

  /* ================================================================================================
     The reconciliation: every figure in the printed report, rebuilt and compared
     ================================================================================================ */
  // the free page: chips, phases, checks
  const chk = (id: string) => free.checks.find(c => c.id === id)
  {
    ties.push(tie('Phases in this total (results page and report)', free.phases.length, n, 'phases'))
    const missingExpected = PHASES.filter(p => !present.has(p.key)).map(p => p.key)
    ties.push({ item: 'Phases not in this total (results page)', report: free.missing.map(m => m.short).join(', ') || 'none', sheet: missingExpected.map(k => shortOf(k)).join(', ') || 'none', ok: free.missing.length === missingExpected.length && free.missing.every((m, i) => m.key === missingExpected[i]) })
    const floorsChip = numbersIn(free.chips[1] ?? '')[0]
    ties.push(tie('Floors (results page)', floorsChip ?? NaN, srcs[0].floors, 'floors'))
    const areaChip = numbersIn(free.chips[2] ?? '')[0]
    const meanA = Math.round(srcs.reduce((a, s) => a + s.builtUpM2, 0) / n)
    ties.push(tie('Average built-up area (results page)', areaChip ?? NaN, meanA, 'm²'))
    const sbReport = chk('same-building')?.status ?? 'missing'
    ties.push({ item: 'Check: same building in every report', report: sbReport, sheet: sbStatus, ok: sbReport === sbStatus })
    const d = chk('same-building')?.detail ?? ''
    if (sbReport === 'pass') {
      const m = /All (\d+) reports are for (\d+) floors? and about ([\d,]+) m²/.exec(d)
      ties.push({ item: 'Check: reports, floors and area quoted in the sentence', report: m ? `${m[1]} reports · ${m[2]} floors · ${m[3]} m²` : 'not read', sheet: `${n} reports · ${srcs[0].floors} floors · ${fmt(meanA, 0)} m²`, ok: !!m && Number(m[1]) === n && Number(m[2]) === srcs[0].floors && parseCell(m[3]) === meanA })
    }
    if (sbReport === 'advisory') {
      const m = /differ by ([\d.]+)%/.exec(d)
      ties.push(tie('Check: spread of the floor areas', m ? Number(m[1]) : NaN, round(sbSpread, 1), '%', 1))
    }
    const phChk = chk('phases')
    const exPh = missingExpected.length === 0 ? 'pass' : 'advisory'
    ties.push({ item: 'Check: whole building or part of it', report: phChk?.status ?? 'missing', sheet: exPh, ok: phChk?.status === exPh })
    // the lintel check appears when the frame and the walls are both in and something was taken out
    const expectLintel = hasFrame && present.has('masonry') && engRemoved.length > 0
    const lintelChk = chk('lintels')
    ties.push({ item: 'Check: lintels counted once (shown or not)', report: lintelChk ? 'shown' : 'not shown', sheet: expectLintel ? 'shown' : 'not shown', ok: !!lintelChk === expectLintel })
    if (lintelChk && expectLintel) {
      const inside = /share \((.*)\) is taken out/.exec(lintelChk.detail)
      const shown = inside ? numbersIn(inside[1]) : []
      const want = cuts.map(c => showQty(c.unit, c.cut))
      const okAll = shown.length === want.length && want.every((w, i) => cellAgrees(w, shown[i]))
      ties.push({ item: 'Check: quantities taken out for the lintels', report: shown.map(x => num(x)).join(' / ') || 'not read', sheet: want.join(' / '), ok: okAll })
    }
    const wCount = free.warnings.length
    ties.push({ item: 'Warning: phases missing (shown or not)', report: wCount > 0 ? 'shown' : 'not shown', sheet: missingExpected.length > 0 ? 'shown' : 'not shown', ok: (wCount > 0) === (missingExpected.length > 0) })
  }

  // tiles
  {
    const rep = paid.tiles.slice(0, Math.max(paid.tiles.length, 0))
    if (tilesD.length > 0) {
      ties.push(tie('Number of totals in "What to order"', rep.length, tilesD.length, 'totals'))
      tilesD.forEach((t, i) => {
        const r = rep[i]
        const hd = HEADS[t.h]
        if (!r) { bad(`Missing tile ${hd.tile}`); return }
        if (r.k !== hd.tile || r.unit !== hd.unit) bad(`Tile ${i + 1} is "${r.k}" in "${r.unit}" but the sheet has "${hd.tile}" in "${hd.unit}"`)
        ties.push(tie(`${hd.tile}: total to order`, parseCell(r.v), t.total, hd.unit, t.d))
        const [a, b] = (r.range ?? '').split(' to ').map(x => parseCell(x))
        ties.push(tie(`${hd.tile}: range, low end`, a, t.low, hd.unit, t.d))
        ties.push(tie(`${hd.tile}: range, high end`, b, t.high, hd.unit, t.d))
      })
    } else {
      const itemCount = rows.filter(r => r.total > 0).length
      ties.push(tie('Items to buy', parseCell(rep[0]?.v), itemCount, 'items'))
      if (rep.length !== 1 || rep[0].k !== 'Items to buy') bad('The report should show the single "Items to buy" tile when there is no big material')
    }
  }

  // the tables
  {
    const phaseHasList = new Set<PhaseKey>()
    const tb = (id: string) => paid.tables.find(t => t.id === id)
    // what is in this total
    const t1 = tb('phases')
    if (!t1 || t1.rows.length !== n) bad('The "What is in this total" table does not have one row per phase')
    else {
      srcs.forEach((s, i) => {
        const r = t1.rows[i]
        const okRow = parseCell(r[1]) === s.floors && cellAgrees(r[2], Math.round(s.builtUpM2)) && parseCell(r[3]) === itemsOf(s.key) && r[0] === `${defOf(s.key).label} · ${defOf(s.key).short}` && r[4] === defOf(s.key).covers
        ties.push({ item: `${defOf(s.key).short}: floors, area, items (table "What is in this total")`, report: `${r[1]} · ${r[2]} m² · ${r[3]} items`, sheet: `${s.floors} · ${fmt(Math.round(s.builtUpM2), 0)} m² · ${itemsOf(s.key)} items`, ok: okRow })
        const f = free.phases.find(x => x.key === s.key)
        if (!f || f.items !== itemsOf(s.key) || f.floors !== s.floors || f.builtUpM2 !== Math.round(s.builtUpM2)) bad(`Free-page summary of ${s.key} differs from the sheet`)
      })
    }
    // the big materials table
    const bt = tb('bulk')
    const expectBulk = bulkHeads.filter(h => (bulkTotal.get(h) ?? 0) > 0)
    const contrib = srcs.filter(s => bulkHeads.some(h => (bulkSplit.get(h)?.[s.key] ?? 0) > 0))
    if (expectBulk.length === 0) {
      if (bt) bad('The report has a big-materials table but the sheet found no big material')
    } else if (!bt) bad('The report has no big-materials table')
    else {
      if (bt.rows.length !== expectBulk.length) bad('The big-materials table has a different number of rows')
      if (bt.head.length !== 3 + contrib.length) bad('The big-materials table has a different number of phase columns')
      expectBulk.forEach((h, i) => {
        const r = bt.rows[i]
        const hd = HEADS[h]
        if (!r) return
        if (r[0] !== hd.item || r[2] !== hd.unit) bad(`Big-materials row ${i + 1} is "${r[0]}" but the sheet has "${hd.item}"`)
        const total = bulkTotal.get(h)!
        ties.push({ item: `${hd.item}: total (table "The big materials")`, report: `${r[1]} ${r[2]}`, sheet: `${showQty(hd.unit, total)} ${hd.unit}`, ok: cellAgrees(r[1], total) })
        const sp = bulkSplit.get(h) ?? {}
        const okSplit = contrib.every((s, j) => cellAgrees(r[3 + j], sp[s.key] ?? 0))
        ties.push({ item: `${hd.item}: split by phase (${contrib.map(s => defOf(s.key).short).join(' / ')})`, report: contrib.map((_s, j) => String(r[3 + j])).join(' / '), sheet: contrib.map(s => ((sp[s.key] ?? 0) > 0 ? showQty(hd.unit, sp[s.key]!) : '–')).join(' / '), ok: okSplit })
      })
    }
    // one list per phase
    for (const s of srcs) {
      const expect: { item: string; unit: string; basis: string; q: number }[] = []
      for (const l of s.lines) {
        if (BULK.has(l.key)) continue
        const q = byId.get(`${l.key}|${l.unit}`)?.after[s.key] ?? 0
        if (q <= 0) continue
        expect.push({ item: l.item, unit: l.unit, basis: l.basis, q })
      }
      const t = tb(`phase-${s.key}`)
      if (expect.length === 0) {
        if (t) bad(`The report lists ${defOf(s.key).label} but the sheet has nothing to list`)
        continue
      }
      phaseHasList.add(s.key)
      if (!t) { bad(`The report has no list for ${defOf(s.key).label}`); continue }
      let okAll = t.rows.length === expect.length
      if (okAll) expect.forEach((e, i) => { const r = t.rows[i]; if (!(r[0] === e.item && r[2] === e.unit && r[3] === e.basis && cellAgrees(r[1], e.q))) okAll = false })
      ties.push({ item: `${defOf(s.key).short}: its own buying list (every row compared)`, report: `${t.rows.length} rows`, sheet: `${expect.length} rows`, ok: okAll })
    }
    // the order of work
    const ot = tb('order')
    ties.push({ item: 'Order-of-work table (phase and wording)', report: ot ? `${ot.rows.length} phases` : 'missing', sheet: `${n} phases`, ok: !!ot && ot.rows.length === n && srcs.every((s, i) => ot.rows[i][0] === `${defOf(s.key).stage} · ${defOf(s.key).short}` && ot.rows[i][1] === defOf(s.key).when) })
    const wantedIds = ['phases', ...(expectBulk.length > 0 ? ['bulk'] : []), ...srcs.filter(s => phaseHasList.has(s.key)).map(s => `phase-${s.key}`), 'order']
    const gotIds = paid.tables.map(t => t.id)
    ties.push({ item: 'Tables in the report', report: gotIds.length + ' tables', sheet: wantedIds.length + ' tables', ok: wantedIds.length === gotIds.length && wantedIds.every((id, i) => id === gotIds[i]) })
  }

  // the merged lines
  {
    ties.push(tie('Items in the merged list', paid.lines.length, finalRows.length, 'items'))
    const groups = [...new Set(finalRows.map(r => r.group))]
    for (const g of groups) {
      const mine = finalRows.filter(r => r.group === g)
      const theirs = paid.lines.filter(l => l.group === g)
      const okG = mine.length === theirs.length && mine.every(r => { const e = engLines.get(r.id); return !!e && Math.abs(e.qty - r.qty) <= 1e-6 && e.item === r.item })
      ties.push({ item: `Merged list, group "${g}" (every line compared)`, report: `${theirs.length} lines`, sheet: `${mine.length} lines`, ok: okG })
    }
  }

  // the bands
  {
    srcs.forEach((s, i) => {
      const b = paid.bands[i]
      const okB = !!b && b.label.startsWith(defOf(s.key).label) && Math.abs(b.low - s.widest[0]) < 1e-9 && Math.abs(b.high - s.widest[1]) < 1e-9
      ties.push({ item: `${defOf(s.key).short}: its widest range ("How far off can this be")`, report: b ? `${num(b.low, 2)} to ${num(b.high, 2)}` : 'missing', sheet: `${num(s.widest[0], 2)} to ${num(s.widest[1], 2)}`, ok: okB })
    })
    ties.push(tie('Number of ranges listed', paid.bands.length, n, 'phases'))
  }

  // phase notes: each phase's assumptions and exclusions are carried over word for word
  {
    const same2 = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])
    const okNotes = paid.phaseNotes.length === n && srcs.every((s, i) => paid.phaseNotes[i].key === s.key && paid.phaseNotes[i].label === defOf(s.key).label && same2(paid.phaseNotes[i].assumptions, s.assumptions) && same2(paid.phaseNotes[i].notIncluded, s.notIncluded))
    ties.push({ item: 'Assumptions and exclusions of each phase, carried over word for word', report: `${paid.phaseNotes.reduce((a, p) => a + p.assumptions.length + p.notIncluded.length, 0)} notes`, sheet: `${srcs.reduce((a, s) => a + s.assumptions.length + s.notIncluded.length, 0)} notes`, ok: okNotes })
    const srcUnion = Array.from(new Set(srcs.flatMap(s => s.sources)))
    ties.push({ item: 'Standards and sources, joined from the phases', report: `${paid.sources.length} entries`, sheet: `${srcUnion.length} entries`, ok: same2(paid.sources, srcUnion) })
    const missLabels = PHASES.filter(p => !present.has(p.key)).map(p => p.label)
    const missSentence = paid.notIncluded.find(x => x.startsWith('The phases not in this total:'))
    ties.push({ item: 'Not-counted list names the missing phases', report: missSentence ? 'named' : 'not named', sheet: missLabels.length > 0 ? 'named' : 'not named', ok: (!!missSentence === (missLabels.length > 0)) && (!missSentence || missSentence === `The phases not in this total: ${missLabels.join(', ')}.`) })
  }

  /* ================================================================================================
     Assemble
     ================================================================================================ */
  const sections: CalcSection[] = [
    { id: 'reports', title: '1. The reports that were added', intro: 'Which paid reports are in this total, which are not, and whether they describe the same building.', blocks: sec1Blocks },
    { id: 'merge', title: '2. Adding the lists into one', intro: 'Every phase report ends in a list of buying lines. The Grand Total adds those lists item by item.', blocks: mergeBlocks },
    { id: 'overlap', title: '3. Counted twice: taken out once', intro: 'Two reports can count the same thing. On its own each report is complete, so each shows it; in a Grand Total it must be ordered once.', blocks: overlapBlocks },
    { id: 'units', title: '4. Buying units and rounding', blocks: unitBlocks },
    { id: 'bulk', title: '5. The big materials, added across phases', intro: 'Cement, sand and stone are used by more than one phase; steel bars and bricks or blocks are added across their lines. These are the totals shown as the big figures at the top of the report.', blocks: bulkBlocks },
    { id: 'range', title: '6. How far off can it be: the range beside each total', blocks: rangeBlocks },
    { id: 'list', title: '7. The final buying list', blocks: [listBlock] },
  ]

  const allMismatches = [...L.mismatches, ...H.mismatches, ...extra]
  const sheet: CalcSheet = {
    tool: 'Grand Total',
    model: 'grand-v1',
    purpose: `This sheet shows how the Grand Total was made from the ${n === 1 ? 'one report' : `${n} reports`} named in section 1. It shows how their lists were added, which quantities were counted by two reports and taken out once, how the totals were rounded to buying units, how the range beside each big total was built, and the final list. It does not repeat the working inside each phase: that is in the calculation sheet at the end of that phase's own report.`,
    method: [
      'Each phase report is read as a list of buying lines: a key, an item name, a quantity and a unit. The frame report\'s own figures are first turned into buying lines (cement up to whole bags, bars up to whole kilograms, sand and stone to 0.1 m³).',
      'The reports are checked to be for the same building: the same number of floors, the same state, and total floor areas within 10% of each other (within 2% is a clean pass).',
      'Lines with the same key and the same unit are one item and their quantities are added. A key in two different units is never merged.',
      'Where two reports count the same thing (the lintels over doors and windows are in the frame report and in the walls report) and both reports are in the total, the walls report\'s share is taken out and the frame\'s is kept. The amount taken out is the smaller of the two figures.',
      'Each total is then rounded to the unit it is bought in: whole units upwards, volumes to 0.01 m³, areas to 0.1 m².',
      'Cement, sand, stone, steel bars and bricks or blocks are added across the phases to give the big totals at the top of the report.',
      'A range is put beside each big total: each phase\'s quantity is multiplied by that phase\'s own low and high multipliers and the results are added end to end (not in quadrature). Each phase\'s widest range is also shown on its own, as a percentage below and above its figures.',
      'The final list gives every item once, in the order of work on site, with the phases it came from.',
      'Every step above is carried out again in this sheet and compared with the engine, and every figure in the report is compared with its counterpart here; the reconciliation at the end must read the same on both sides.',
    ],
    limits: [
      'The Grand Total adds the reports. It does not recalculate them. Every quantity carries the simplifications of its own phase (room plan, wall and door sizes, wastage, site practice); they are set out in that phase\'s calculation sheet and in the assumptions under "The assumptions in each phase".',
      'The test for "the same building" looks only at the number of floors, the state and the total floor area (within 10%). It does not compare the plan, the number of bedrooms, the wall material or the storey height, so two reports made with different answers to those questions can still be added.',
      'Only the lintels over doors and windows are known to be counted by two reports, and only they are taken out. If other overlaps exist they are not looked for. The frame and the walls report size the lintels by their own rules, so the figure that stays (the frame\'s) can differ from the one taken out.',
      'Each phase rounds its figures up to whole bags, bars and units before they are added, and the total is rounded up again, so the total can sit a little above a single unrounded calculation of the whole building. Cement is rounded up by every phase that supplies it.',
      'The range beside each total adds the phases\' ends straight (as if all were wrong in the same direction at once). That is cautious, not statistical: the multipliers are judgement ranges set by the tool authors, not confidence limits, and no probability goes with them. Section 6 shows the narrower range that independent errors would give.',
      'A partial total (fewer than five phases) is a list for those phases only. Missing phases are not estimated, and the total does not change when a phase is added later: make a new Grand Total.',
      'The total is made from the phase reports as they were when it was made. If a phase report is run again with different answers, this Grand Total does not follow it.',
      'A total of "bricks or blocks" counts pieces. When the walls report uses two kinds (for example AAC blocks above the plinth and concrete blocks in the plinth) the two are added as pieces although they are different sizes.',
      'Quantities only: no price, rate or labour figure. Nothing here is a design, a drawing or a certificate. Final quantities for ordering come from the signed drawings and from the site.',
    ],
    sections,
    tie: ties,
    references: [
      ...srcs.map(s => ({ code: phaseReportId(s), title: `${defOf(s.key).label} quantities report (${defOf(s.key).stage})`, usedFor: `The buying lines, bands and notes added in this total. The working behind them is in the calculation sheet at the end of that report. Project: ${s.projectName}.` })),
      { code: 'JCGM 100:2008', title: 'Evaluation of measurement data: Guide to the expression of uncertainty in measurement (GUM)', usedFor: 'Section 6: cl. 5.1.2 gives the combination for independent inputs (root of the sum of squares); cl. 5.2.2 and its Note 1 give the straight sum for fully correlated inputs. Quoted only to explain the choice; the report\'s ranges are not GUM uncertainties.' },
      { code: 'International yard and pound agreement, 1959', title: '1 yard = 0.9144 m exactly, so 1 ft = 0.3048 m', usedFor: 'Section 4.2: square feet to square metres.' },
    ],
  }

  if (!sheetIsSound(sheet, allMismatches) ) {
    const failed = sheet.tie.filter(t => !t.ok).map(t => `${t.item}: report ${t.report} vs sheet ${t.sheet}`)
    console.error('Grand Total calculation sheet: the sheet does not agree with the report, so it is left out:\n  ' + [...allMismatches, ...failed].join('\n  '))
    return null
  }
  if (opts.stats) {
    opts.stats.ledgerChecks = L.checked.length + H.checked.length
    opts.stats.tieRows = sheet.tie.length
  }
  return sheet
}

/* unused type imports kept explicit for readers of the signatures */
export type { CalcLine, CalcTable }
