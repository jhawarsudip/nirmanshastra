// StructurePro calculation sheet: the assembler.
//
//   buildStructoCalc(input, report) runs the quantity model again on the same input, works every section of the sheet through the Ledger
//   (each step checked against the model's own figure), sets every figure the report prints beside the same figure worked here,
//   and returns the sheet, or null if anything disagrees or cannot be built. It never throws.
//
// The sections run in this order because a later section reads the figures an earlier one worked out (figs.ts).

import type { CalcSection, CalcSheet } from '@/lib/calcsheet'
import { Ledger, sheetIsSound } from '@/lib/calcsheet'
import type { QtyInput } from '../types'
import type { PaidPayload } from '../payload'
import { runQuantityModelDetailed } from '../model'
import { savedInput } from '../input'
import type { CalcCtx } from './ctx'
import { designSections } from './design'
import { foundationSection } from './foundation'
import { floorsSection } from './floors'
import { smallSection } from './small'
import { takeoffSection } from './takeoff'
import { quantitiesSection } from './quantities'
import { materialsSection } from './materials'
import { reportSection } from './report'
import { reportTies } from './ties'
import { LIMITS, METHOD, PURPOSE, REFERENCES } from './text'

export interface StructoCalcRun {
  sheet: CalcSheet
  mismatches: string[]
  /** how many comparisons with the model were made while building the sheet */
  checked: number
}

/** Build the sheet and report what disagreed, without deciding. `buildStructoCalc` is this plus the decision. Throws if the model cannot run the input. */
export function makeStructoSheet(input: QtyInput, report: PaidPayload): StructoCalcRun {
  const run = runQuantityModelDetailed(savedInput(input as unknown as Record<string, unknown>))
  if (!run.result.ok || !run.work) throw new Error(run.result.ok ? 'the quantity model gave no working' : run.result.error)
  const L = new Ledger()
  const c: CalcCtx = { L, input: run.work.input, result: run.result, work: run.work }
  const sections: CalcSection[] = [
    ...designSections(c),
    foundationSection(c),
    floorsSection(c),
    smallSection(c),
    takeoffSection(c),
    quantitiesSection(c),
    materialsSection(c),
    reportSection(c),
  ]
  const tie = reportTies(c, report)
  const sheet: CalcSheet = { tool: 'StructurePro', model: report.engine, purpose: PURPOSE, method: METHOD, limits: LIMITS, sections, tie, references: REFERENCES }
  return { sheet, mismatches: L.mismatches, checked: L.checked.length }
}

/** The sheet for the report, or null (after writing why to the console) if it cannot be made to agree with the report. Never throws. */
export function buildStructoCalc(input: QtyInput, report: PaidPayload): CalcSheet | null {
  try {
    const { sheet, mismatches } = makeStructoSheet(input, report)
    if (!sheetIsSound(sheet, mismatches)) {
      const bad = [...mismatches, ...sheet.tie.filter((t) => !t.ok).map((t) => `${t.item}: report ${t.report} vs sheet ${t.sheet}`)]
      console.error(`StructurePro calculation sheet left out: ${bad.length} figure(s) disagree with the report.\n  ${bad.slice(0, 40).join('\n  ')}`)
      return null
    }
    return sheet
  } catch (e) {
    console.error('StructurePro calculation sheet left out:', e)
    return null
  }
}
