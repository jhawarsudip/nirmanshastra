/*
  InteriorPro calculation sheet: shared helpers (the context every section reads, and the checks against the report).
  The sections are in calc-plan.ts, calc-tiles.ts, calc-paint.ts, calc-fit.ts and calc-buy.ts; calc.ts puts them together.
*/

import { Ledger, tie, type CalcOpts, type CalcTieRow } from '@/lib/calcsheet'
import type { TradeFree, TradePaid } from '../types'
import type { InteriorInput, interiorWork } from './model'

export type Work = ReturnType<typeof interiorWork>['w']

export interface Ctx {
  inp: InteriorInput
  /** the engine's own working: used only as the figure each step of the sheet is checked against */
  w: Work
  paid: TradePaid
  free: TradeFree
  L: Ledger
  ties: CalcTieRow[]
}

export const REF = {
  plan: 'NirmanShastra assumption (room plan shared with MasonryPro)',
  assume: 'NirmanShastra assumption',
  rule: 'Engine rule',
  derived: 'Derived: arithmetic shown',
  maker: "Makers' data sheets",
  p11: 'IS 1200 (Part 11):1977 (a 2024 revision exists; not checked)',
  p13: 'IS 1200 (Part 13):1994, rules for deduction of openings (a 2024 revision exists; not checked)',
  p13m: 'IS 1200 (Part 13):1994 (a 2024 revision exists; not checked)',
  dar: 'CPWD Delhi Analysis of Rates 2016',
}

export const sum = (a: number[]) => a.reduce((s, x) => s + x, 0)

/** "1 bedroom", "2 bedrooms". */
export const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** The step is checked against the engine's figure to a part in a billion. */
export const X = (v: number): Pick<CalcOpts, 'expect' | 'tol'> => ({ expect: v, tol: Math.max(1e-9, Math.abs(v) * 1e-9) })

/** The first number in a report cell ("1,573", "0.60 kg", 4). NaN when there is none. */
export function cellNum(c: string | number | undefined): number {
  if (typeof c === 'number') return c
  const m = String(c ?? '').match(/-?\d[\d,]*\.?\d*/)
  return m ? Number(m[0].replace(/,/g, '')) : NaN
}
/** Decimals printed in a report cell. */
export function cellDp(c: string | number | undefined): number {
  const m = String(c ?? '').match(/\d\.(\d+)/)
  return m ? m[1].length : 0
}
export const halfUnit = (dp: number) => 0.5 * 10 ** -dp + 1e-9

export function makeCtx(inp: InteriorInput, w: Work, paid: TradePaid, free: TradeFree): Ctx {
  return { inp, w, paid, free, L: new Ledger(), ties: [] }
}

export function miss(c: Ctx, m: string) {
  c.L.mismatches.push(m)
}

/** A row of the reconciliation: the report's figure against the sheet's. */
export function T(c: Ctx, item: string, report: number, sheet: number, unit: string, dp = 0) {
  const t = tie(item, report, sheet, unit, dp)
  c.ties.push(t)
  if (!t.ok) miss(c, `tie ${item}: report ${t.report} vs sheet ${t.sheet}`)
}

/** Two arrays of figures that must agree (the sheet's own rebuild against the engine's). */
export function sameArr(c: Ctx, label: string, sheet: number[], engine: number[]) {
  if (sheet.length !== engine.length) miss(c, `${label}: ${sheet.length} values in the sheet, ${engine.length} in the engine`)
  engine.forEach((e, i) => c.L.compare(`${label}[${i}]`, sheet[i], e, undefined, Math.max(1e-9, Math.abs(e) * 1e-9)))
}

/** A single figure of the sheet against the engine's. */
export function same(c: Ctx, label: string, sheet: number, engine: number) {
  c.L.compare(label, sheet, engine, undefined, Math.max(1e-9, Math.abs(engine) * 1e-9))
}

export function table(c: Ctx, id: string) {
  const t = c.paid.tables.find((x) => x.id === id)
  if (!t) miss(c, `table "${id}" is not in the report`)
  return t
}

type Cell = string | number | null
/**
 * Every number in a report table, rebuilt. `rows` and `foot` hold the sheet's figures column by column; a string is an exact
 * label check, a number is compared to half a unit of the last printed place, null is skipped.
 */
export function cmpTable(c: Ctx, id: string, rows: Cell[][], foot?: Cell[]) {
  const t = table(c, id)
  if (!t) return
  if (t.rows.length !== rows.length) miss(c, `table ${id}: ${t.rows.length} rows in the report, ${rows.length} in the sheet`)
  const one = (what: string, rep: (string | number)[] | undefined, mine: Cell[]) => {
    mine.forEach((e, k) => {
      if (e === null) return
      const cell = rep?.[k]
      if (cell === undefined) { miss(c, `${what} column ${k}: missing in the report`); return }
      if (typeof e === 'string') { if (String(cell) !== e) miss(c, `${what} column ${k}: report "${cell}" vs sheet "${e}"`); return }
      if (!(Math.abs(cellNum(cell) - e) <= halfUnit(cellDp(cell)))) miss(c, `${what} column ${k}: report ${cell} vs sheet ${e}`)
    })
  }
  rows.forEach((r, i) => one(`table ${id} row ${i + 1}`, t.rows[i], r))
  if (foot) { if (!t.foot) miss(c, `table ${id}: no total row in the report`); else one(`table ${id} total`, t.foot, foot) }
  else if (t.foot) miss(c, `table ${id}: the report has a total row the sheet does not`)
}

/** A number in a report table: row r (zero based), column k. NaN when it is not there. */
export function repNum(c: Ctx, id: string, r: number, k: number): number {
  return cellNum(c.paid.tables.find((x) => x.id === id)?.rows[r]?.[k])
}
/** A number in the total row of a report table. */
export function repFoot(c: Ctx, id: string, k: number): number {
  return cellNum(c.paid.tables.find((x) => x.id === id)?.foot?.[k])
}
