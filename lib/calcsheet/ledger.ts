/*
  The Ledger writes a calculation sheet one line at a time and does the arithmetic itself.

    const wu = L.calc('Factored load on the slab', 'wu = 1.5 (g + q)', '1.5 × ({g} + {q})', { g, q }, v => 1.5 * (v.g + v.q),
                      { unit: 'kN/m²', dp: 2, ref: 'IS 456:2000 cl. 18.2.3', expect: engine.wu })

  The "working" text is made by putting the numbers into the template, and the result is made by running the function on
  the same numbers, so what is printed on the page is always what was calculated. `expect` is the figure the engine
  produced for the same step; if the two differ, the Ledger records a mismatch, and the report leaves the sheet out
  rather than print working that does not agree with the quantities.

  Intermediate values are carried at full precision and shown rounded. The working is then checked the way a reader
  would check it: the printed numbers are put back into the same function, and if that does not give the printed result
  the working is printed with one more decimal place, up to four more, until it does. So "1.34 + 2.14 = 3.5" is never
  printed as "1.3 + 2.1 = 3.5".
*/

import type { CalcLine } from './types'

export type Vars = Record<string, number>

/** Indian digit grouping with a fixed number of decimals. */
export function fixed(v: number, dp: number): string {
  const s = v.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })
  return s === '-0' ? '0' : s
}

/** A readable default: whole numbers stay whole, small numbers keep three decimals, trailing zeros dropped. */
export function num(v: number, dp?: number): string {
  if (!Number.isFinite(v)) return 'n/a'
  if (dp !== undefined) return fixed(v, dp)
  if (Number.isInteger(v)) return fixed(v, 0)
  const a = Math.abs(v)
  const d = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 2 : 3
  const s = fixed(v, d)
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}

export interface CalcOpts {
  unit?: string
  /** decimals of the printed result (also the tolerance when `expect` is given: half a unit of the last place) */
  dp?: number
  ref?: string
  note?: string
  /** the figure the engine produced for this same step */
  expect?: number
  /** override the tolerance (absolute) */
  tol?: number
  /** this figure appears in the report: marks the line as a result */
  result?: boolean
}

/** How many decimals `num` prints for a value when no number of decimals is given. */
function autoDp(v: number): number {
  if (Number.isInteger(v)) return 0
  const a = Math.abs(v)
  return a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 2 : 3
}

/** `num` with `extra` more decimals than it would normally print (a whole number stays whole). */
function numMore(v: number, dp: number | undefined, extra: number): string {
  if (extra === 0) return num(v, dp)
  if (!Number.isFinite(v)) return 'n/a'
  if (dp !== undefined) return fixed(v, dp + extra)
  if (Number.isInteger(v)) return fixed(v, 0)
  const s = fixed(v, autoDp(v) + extra)
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}

const PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)(?::(\d+))?\}/g

/** Puts {name} or {name:dp} from vars into a template. An unknown name is a programming error and throws. */
export function fill(template: string, vars: Vars, extra = 0): string {
  return template.replace(PLACEHOLDER, (_m, name: string, dp?: string) => {
    if (!(name in vars)) throw new Error(`calcsheet: "${name}" is not given for the working "${template}"`)
    return numMore(vars[name], dp === undefined ? undefined : Number(dp), extra)
  })
}

/** The values as they print in the working with `extra` more decimals: what a reader would key in. */
function printedVars(template: string, vars: Vars, extra: number): Vars {
  const out: Vars = { ...vars }
  const best: Record<string, number> = {}
  for (const m of template.matchAll(PLACEHOLDER)) {
    const name = m[1]
    const dp = m[2] === undefined ? undefined : Number(m[2])
    const txt = numMore(vars[name], dp, extra)
    const shown = Number(txt.replace(/,/g, ''))
    const digits = (txt.split('.')[1] ?? '').length
    if (Number.isFinite(shown) && digits >= (best[name] ?? -1)) { best[name] = digits; out[name] = shown }
  }
  return out
}

/** The working as printed: with as many extra decimals as it takes for the printed numbers to give the printed result. */
function workingThatRekeys(template: string, vars: Vars, fn: (v: Vars) => number, shown: string, dp: number | undefined): string {
  for (let extra = 0; extra <= 4; extra++) {
    let ok = false
    try {
      const again = fn(printedVars(template, vars, extra))
      ok = Number.isFinite(again) && num(again, dp) === shown
    } catch { ok = false }
    if (ok || extra === 4) return fill(template, vars, extra)
  }
  return fill(template, vars)
}

export class Ledger {
  private buf: CalcLine[] = []
  readonly mismatches: string[] = []
  /** every figure that was checked against the engine, for the reconciliation */
  readonly checked: { label: string; sheet: number; engine: number }[] = []

  /** A fact that was given or chosen: an answer, a constant, a table value. */
  input(label: string, value: string, ref?: string, note?: string): void {
    this.buf.push({ label, result: value, ref, note, kind: 'input' })
  }

  /** An input that is a number. */
  value(label: string, v: number, unit: string, dp?: number, ref?: string, note?: string): number {
    this.buf.push({ label, result: `${num(v, dp)}${unit ? ' ' + unit : ''}`, ref, note, kind: 'input' })
    return v
  }

  /** A sum. Returns the full-precision result for the next step to use. */
  calc(label: string, formula: string, working: string, vars: Vars, fn: (v: Vars) => number, o: CalcOpts = {}): number {
    const value = fn(vars)
    if (!Number.isFinite(value)) throw new Error(`calcsheet: "${label}" did not give a finite number`)
    this.buf.push({
      label,
      formula,
      working: workingThatRekeys(working, vars, fn, num(value, o.dp), o.dp),
      result: `${num(value, o.dp)}${o.unit ? ' ' + o.unit : ''}`,
      ref: o.ref,
      note: o.note,
      kind: o.result ? 'result' : 'step',
    })
    if (o.expect !== undefined) this.compare(label, value, o.expect, o.dp, o.tol)
    return value
  }

  /** A step that is a choice or a look-up rather than a sum: "Grade of concrete: M25 (Table 5 minimum for moderate exposure)". */
  pick(label: string, formula: string, result: string, ref?: string, note?: string): void {
    this.buf.push({ label, formula, result, ref, note, kind: 'step' })
  }

  /** A sentence in the working. */
  say(label: string, text: string, ref?: string): void {
    this.buf.push({ label, note: text, ref, kind: 'text' })
  }

  /** Compare a figure the sheet rebuilt with the engine's own. Within half a unit of the last printed place, or `tol`. */
  compare(label: string, sheet: number, engine: number, dp?: number, tol?: number): boolean {
    const t = tol ?? (dp !== undefined ? 0.5 * 10 ** -dp + 1e-9 : Math.max(1e-6, Math.abs(engine) * 1e-6))
    this.checked.push({ label, sheet, engine })
    const ok = Math.abs(sheet - engine) <= t
    if (!ok) this.mismatches.push(`${label}: sheet ${sheet} vs engine ${engine}`)
    return ok
  }

  /** The lines written so far, which are then cleared: one call per block. */
  take(): CalcLine[] {
    const out = this.buf
    this.buf = []
    return out
  }
}
