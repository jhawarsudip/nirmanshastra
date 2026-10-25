/*
  ElectricalPro calculation sheet: what the section builders share. A context holds the answers, the sheet's own
  re-working of the model (derive.ts), the report to be tied to, the Ledger that does the arithmetic, and the helpers
  that tie a figure of the sheet to the same figure in the report.
*/

import { Ledger, fixed, tie } from '@/lib/calcsheet'
import type { CalcBlock, CalcLine, CalcTable, CalcTieRow } from '@/lib/calcsheet'
import type { Fact, Table, TradeResult } from '../types'
import { cellNumber } from './calc-rows'
import { derive, type Board, type Derived } from './derive'
import type { ElecInput } from './model'
import { NAME, type Cnt, type Kind } from './rules'

export const d0 = (v: number) => fixed(v, 0)
export const d1 = (v: number) => fixed(v, 1)
export const d2 = (v: number) => fixed(v, 2)
export const d3 = (v: number) => fixed(v, 3)
export const yn = (b: boolean) => (b ? 'Yes' : 'No')
export const pl = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** A unit that agrees with the number in front of it: "1 home", "2 homes". Units not listed are left as they are (m, kW, mm). */
const SINGULAR: Record<string, string> = { homes: 'home', boards: 'board', circuits: 'circuit', rooms: 'room', nos: 'no.', ways: 'way', electrodes: 'electrode' }
export const unitFor = (n: number, unit: string) => (n === 1 ? SINGULAR[unit] ?? unit : unit)

export const table = (head: string[], rows: string[][], o: { foot?: string[]; num?: number[]; note?: string } = {}): CalcTable => ({ head, rows, foot: o.foot, num: o.num, note: o.note })
export const block = (id: string, title: string, lines: CalcLine[] | undefined, tbl?: CalcTable, o: { intro?: string; note?: string } = {}): CalcBlock => ({
  id, title, intro: o.intro, lines: lines && lines.length > 0 ? lines : undefined, table: tbl, note: o.note,
})

/** Where a step comes from. Only clauses the model itself cites; where the model gives a document without a clause, no clause is added. */
export const REF = {
  draft: 'BIS draft of IS 4648, first revision (ETD 20, September 2024)',
  draftT23: 'Draft IS 4648 Tables 2 and 3 (room-wise points)',
  draftT4: 'Draft IS 4648 Table 4 (wire sizes)',
  draftT5: 'Draft IS 4648 Table 5 (load per point)',
  draftT6: 'Draft IS 4648 Table 6 (appliance loads)',
  draftC621: 'Draft IS 4648 cl 6.2.1 note (8 points; CPWD GS 3.10(i) allows 10 points or 800 W)',
  draftC622: 'Draft IS 4648 cl 6.2.2; CPWD GS 3.10(iii)',
  draftC628: 'Draft IS 4648 cl 6.2.8 (breaker ratings)',
  draftC629: 'Draft IS 4648 cl 6.2.9 (a 30 mA residual current device on every installation)',
  draftC7: 'Draft IS 4648 cl 7 (design load)',
  draftC8: 'Draft IS 4648 cl 8 (earth conductor)',
  old1968: 'IS 4648:1968 cl 9.8 (sockets)',
  old1968c72: 'IS 4648:1968 cl 7.2; CPWD GS 3.10(i)',
  gs34: 'CPWD GS 3.4 (what a point is)',
  gs39: 'CPWD GS 3.9 (16 A socket)',
  dar11: 'CPWD DAR 2016 item 1.1',
  dar17: 'CPWD DAR 2016 item 1.7',
  dar15: 'CPWD DAR 2016 items 1.5 and 1.7',
  dar: 'NirmanShastra assumption (the tool names CPWD DAR 2016 for this; the item is not known)',
  gs35: 'Earth: draft IS 4648 cl 8 (green-yellow). Line and neutral colours: NirmanShastra assumption (the usual colours)',
  is3043: 'IS 3043:2018 (earthing, named as the topic only; no clause given)',
  assume: 'NirmanShastra assumption',
  rule: 'Engine rule',
  yours: 'Your answer',
  tender: 'Tender board schedules (a secondary source, not a standard)',
} as const

export interface Ctx {
  inp: ElecInput
  report: TradeResult
  d: Derived
  L: Ledger
  ties: CalcTieRow[]
  bad: string[]
  tieNum(item: string, reportValue: number, sheetValue: number, unit: string, dp?: number): void
  tieText(item: string, reportValue: string, sheetValue: string): void
  reportTable(id: string): Table | undefined
  /** a number printed in a row of the report's table, 0 when the report has no such row */
  rowNum(id: string, label: string, col?: number): number
  fact(k: string): Fact | undefined
  /** sum over boards of f(board) × copies */
  sumM(f: (b: Board) => number): number
  wireOf(board: string, src: string, size?: number, colour?: string): number
  condOf(board: string, src: string): number
  nonCommon: Board[]
  common: Board | undefined
  /** the board with the most points: the one worked in full */
  repB: Board
  repName: string
  roomName(k: Kind): string
  pointsOf(c: Cnt): number
}

export function makeCtx(inp: ElecInput, report: TradeResult): Ctx {
  const d = derive(inp)
  const L = new Ledger()
  const bad = L.mismatches
  const ties: CalcTieRow[] = []
  const rp = report.paid
  const reportTable = (id: string) => rp.tables.find((t) => t.id === id)
  const nonCommon = d.boards.filter((b) => !b.spec.common)
  const pointsOf = (c: Cnt) => c.L + c.F + c.X + c.B + c.S6 + c.S16
  const repB = nonCommon.reduce((a, b) => (pointsOf(b.cnt) > pointsOf(a.cnt) ? b : a), nonCommon[0])
  return {
    inp, report, d, L, ties, bad,
    tieNum(item, reportValue, sheetValue, unit, dp = 0) {
      const u = reportValue === 1 && sheetValue === 1 ? unitFor(1, unit) : unit
      const t = tie(item, reportValue, sheetValue, u, dp)
      ties.push(t)
      if (!t.ok) bad.push(`${item}: report ${reportValue} vs sheet ${sheetValue}`)
    },
    tieText(item, reportValue, sheetValue) {
      const ok = reportValue === sheetValue
      ties.push({ item, report: reportValue, sheet: sheetValue, ok })
      if (!ok) bad.push(`${item}: report "${reportValue}" vs sheet "${sheetValue}"`)
    },
    reportTable,
    rowNum(id, label, col = 1) {
      const r = reportTable(id)?.rows.find((x) => String(x[0]) === label)
      return r ? cellNumber(r[col]) : 0
    },
    fact: (k) => report.free.facts.find((f) => f.k === k),
    sumM: (f) => d.boards.reduce((s, b) => s + f(b) * b.spec.mult, 0),
    wireOf: (board, src, size, colour) =>
      d.wireC.filter((w) => w.board === board && w.src === src && (size === undefined || w.size === size) && (colour === undefined || w.colour === colour)).reduce((s, w) => s + w.m, 0),
    condOf: (board, src) => d.condC.filter((x) => x.board === board && x.src === src).reduce((s, x) => s + x.m, 0),
    nonCommon,
    common: d.boards.find((b) => b.spec.common),
    repB,
    repName: `${repB.spec.label}${repB.spec.mult > 1 ? ` (one of ${repB.spec.mult} like it)` : ''}`,
    roomName: (k) => (k === 'kitchen' && !inp.dining ? 'Kitchen and dining' : NAME[k]),
    pointsOf,
  }
}
