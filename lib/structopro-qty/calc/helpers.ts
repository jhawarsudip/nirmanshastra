// Small shared helpers of the StructurePro calculation sheet: number formats, block building, and the choice of the governing beam and column.

import { fixed, num } from '@/lib/calcsheet'
import type { CalcBlock, CalcLine, CalcTable, Ledger } from '@/lib/calcsheet'
import type { Analysis, ColRec, ModelWork } from './ctx'
import type { BeamRec } from '../frame'
import { barMass, roundUp25 } from '../codes'

export const d0 = (v: number) => fixed(v, 0)
export const d1 = (v: number) => fixed(v, 1)
export const d2 = (v: number) => fixed(v, 2)
export const d3 = (v: number) => fixed(v, 3)
export const d4 = (v: number) => fixed(v, 4)
export { fixed, num }

export const yn = (b: boolean) => (b ? 'Yes' : 'No')
export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** The standards named in `ref`, spelt once. */
export const STD = {
  is456: 'IS 456:2000',
  is875_1: 'IS 875 (Part 1):1987',
  is875_2: 'IS 875 (Part 2):1987',
  is875_3: 'IS 875 (Part 3):1987',
  is1893: 'IS 1893 (Part 1):2002',
  is13920: 'IS 13920:1993',
  sp16: 'SP 16:1980',
  is1786: 'IS 1786:2008',
  is2502: 'IS 2502:1963',
  is10262: 'IS 10262:2009',
  is1904: 'IS 1904:1986',
  cpwd: 'CPWD Delhi Analysis of Rates 2014',
  assume: 'NirmanShastra assumption',
  rule: 'Engine rule',
  yours: 'Your answer',
} as const

/**
 * A bar length that is a whole number of 25 mm steps on paper can come out a hair above that in the model's decimal arithmetic.
 * The model then counts the next step. The sheet keeps the model's figure, so the working as printed does not reproduce the result; this says why.
 */
export function stepNote(lengthMm: number): string | undefined {
  const onPaper = Math.round(lengthMm * 1e6) / 1e6
  if (Math.ceil(lengthMm / 25) === Math.ceil(onPaper / 25)) return undefined
  return `The length is ${onPaper.toLocaleString('en-IN')} mm on paper, a whole number of 25 mm steps. The model's decimal arithmetic leaves it a hair above, so it counts the next step (${(Math.ceil(lengthMm / 25) * 25).toLocaleString('en-IN')} mm). That is one step of 25 mm on these bars, kept so that the sheet agrees with the report.`
}

export const table = (head: string[], rows: string[][], o: { foot?: string[]; num?: number[]; note?: string } = {}): CalcTable => ({ head, rows, foot: o.foot, num: o.num, note: o.note })

/** Take the lines written since the last block and make a block of them (with an optional table and notes). */
export function takeBlock(L: Ledger, id: string, title: string, o: { intro?: string; note?: string; table?: CalcTable } = {}): CalcBlock {
  const lines: CalcLine[] = L.take()
  return { id, title, intro: o.intro, lines: lines.length > 0 ? lines : undefined, table: o.table, note: o.note }
}

/** A block that is only a table. */
export const tableBlock = (id: string, title: string, t: CalcTable, o: { intro?: string; note?: string } = {}): CalcBlock => ({ id, title, intro: o.intro, table: t, note: o.note })

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/** Name of storey k (0 = lowest) as the report names it: with an open parking level the lowest storey is the parking level. */
export function storeyName(k: number, stilt: boolean): string {
  if (stilt) return k === 0 ? 'Parking level (open)' : `Floor ${k}`
  return k === 0 ? 'Ground floor' : `Floor ${k}`
}

/** Name of the level of the beams and slab at the top of storey k. */
export function levelName(k: number, F: number, stilt: boolean): string {
  if (k === F - 1) return 'Roof'
  return stilt ? `Level ${k}, top of ${k === 0 ? 'parking' : 'floor ' + k}` : `Level ${k + 1}`
}

export interface BeamPick {
  rec: BeamRec
  k: number
  /** position in the floor's list */
  idx: number
}

const moment = (r: BeamRec) => {
  const d = r.des!.detail
  return Math.max(d.hogL, d.hogR, d.mid)
}

/**
 * The beam that sets the size for its type: the deepest, then the one with the largest design moment, then the lowest level.
 * "Edge" is a beam on the outer wall line of its floor; "inner" is every other beam. These are the two types of the report's beam schedule.
 */
export function governingBeams(a: Analysis): { edge?: BeamPick; inner?: BeamPick } {
  const best: { edge?: BeamPick; inner?: BeamPick } = {}
  a.beams.forEach((list, k) => {
    list.forEach((rec, idx) => {
      if (!rec.des) return
      const key = rec.perimeter ? 'edge' : 'inner'
      const cur = best[key]
      if (!cur) {
        best[key] = { rec, k, idx }
        return
      }
      const dc = cur.rec.des!.D
      const dn = rec.des.D
      if (dn > dc || (dn === dc && moment(rec) > moment(cur.rec) + 1e-9)) best[key] = { rec, k, idx }
    })
  })
  return best
}

export interface ColPick {
  col: ColRec
  /** index in analysis.cols */
  idx: number
}

/** The column that sets the size for its storey and type: the largest section, then the most steel, then the heaviest load. */
export function governingColumns(a: Analysis): Map<string, ColPick> {
  const out = new Map<string, ColPick>()
  a.cols.forEach((col, idx) => {
    const key = `${col.k}|${col.type}`
    const cur = out.get(key)
    const area = col.des.b * col.des.D
    if (!cur) {
      out.set(key, { col, idx })
      return
    }
    const ca = cur.col.des.b * cur.col.des.D
    if (area > ca || (area === ca && (col.des.cfg.ast > cur.col.des.cfg.ast || (col.des.cfg.ast === cur.col.des.cfg.ast && col.Pu > cur.col.Pu + 1e-9)))) out.set(key, { col, idx })
  })
  return out
}

export const TYPE_ORDER: Array<'corner' | 'edge' | 'interior'> = ['corner', 'edge', 'interior']

/** `expect` and a tolerance for a step the sheet does with the same arithmetic as the engine: agreement to floating-point noise only. */
export const ex = (engine: number, rel = 1e-9): { expect: number; tol: number } => ({ expect: engine, tol: Math.max(1e-9, Math.abs(engine) * rel) })

/** Compare one figure the sheet rebuilt with the engine's and write no line. Returns true when they agree to floating-point noise. */
export function check(L: Ledger, label: string, sheet: number, engine: number, rel = 1e-9): boolean {
  return L.compare(label, sheet, engine, undefined, Math.max(1e-9, Math.abs(engine) * rel))
}

export function workOf(w: ModelWork) {
  return { a: w.analysis, ctx: w.ctx, plan: w.plan }
}

/** Weight of `n` bars of diameter `phi` (mm) cut to `lenMm`: the length is taken up to the next 25 mm and the mass per metre is φ² ÷ 162.2 (the steel record's own rule). */
export const barKg = (phi: number, lenMm: number, n: number): number => barMass(phi) * (roundUp25(lenMm) / 1000) * n

export const sumOf = (xs: number[]): number => xs.reduce((s, v) => s + v, 0)

/** Group `items` by `key`, keeping the order in which each key first appears. */
export function groupBy<T>(items: T[], key: (t: T) => string): Array<{ key: string; items: T[] }> {
  const out = new Map<string, T[]>()
  for (const it of items) {
    const k = key(it)
    const cur = out.get(k)
    if (cur) cur.push(it)
    else out.set(k, [it])
  }
  return [...out.entries()].map(([k, v]) => ({ key: k, items: v }))
}

/** Letters for marks: 0 -> A, 1 -> B, ... 26 -> AA. */
export function mark(i: number): string {
  let s = ''
  let n = i
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}

/** A bar line worked through the Ledger: n bars of φ cut to `lenMm` (taken up to the next 25 mm) at φ² ÷ 162.2 kg per metre. Returns kg. */
export function barLine(L: Ledger, label: string, phi: number, lenMm: number, n: number, o: { ref?: string; note?: string; expect?: number; result?: boolean } = {}): number {
  return L.calc(label, 'n × φ² ÷ 162.2 × L', '{n} × ({p}² ÷ 162.2) × {l} ÷ 1000', { n, p: phi, l: roundUp25(lenMm) }, (v) => v.n * ((v.p * v.p) / 162.2) * (v.l / 1000), {
    unit: 'kg',
    dp: 1,
    ref: o.ref ?? STD.rule,
    note: o.note,
    result: o.result,
    ...(o.expect !== undefined ? ex(o.expect) : {}),
  })
}

/** A figure an earlier section rebuilt and compared with the report, by the label of that comparison. The latest one with the label is used. */
export function rebuilt(L: Ledger, label: string): number {
  for (let i = L.checked.length - 1; i >= 0; i--) if (L.checked[i].label === label) return L.checked[i].sheet
  throw new Error(`calcsheet: the figure "${label}" was not rebuilt by any section`)
}

/** The numbers written in a sentence, as they are printed ("1,250" is 1250). Used to tie a sentence of the report to the same sentence of the model's own run. */
export function figuresOf(s: string): string[] {
  return (s.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) ?? []).map((t) => t.replace(/,/g, ''))
}

/** A sentence with its spacing evened out, for comparing wording. */
export const squash = (s: string): string => s.replace(/\s+/g, ' ').trim()
