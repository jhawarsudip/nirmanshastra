export * from './types'
export { Ledger, fill, fixed, num, type CalcOpts, type Vars } from './ledger'

import type { CalcSheet, CalcTieRow } from './types'
import { num } from './ledger'

/** A row of the reconciliation: the figure printed in the report beside the same figure rebuilt in the sheet. */
export function tie(item: string, report: number, sheet: number, unit: string, dp = 0): CalcTieRow {
  const t = 0.5 * 10 ** -dp + 1e-9
  return { item, report: `${num(report, dp)} ${unit}`, sheet: `${num(sheet, dp)} ${unit}`, ok: Math.abs(report - sheet) <= t }
}

/** True when the sheet agrees with the report everywhere: no engine mismatch and every tie row ok. */
export function sheetIsSound(sheet: CalcSheet, mismatches: string[]): boolean {
  return mismatches.length === 0 && sheet.tie.length > 0 && sheet.tie.every(t => t.ok)
}
