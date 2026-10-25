/*
  Server side of the Grand Total: turns a saved estimate row into a PhaseSource for the merge in grand.ts.
  Only API routes import this file: it reaches the models, and the models carry every coefficient.

  A phase's paid numbers are the ones frozen into its estimate when the customer first opened the report.
  If that never happened (a report paid for but not opened), the model is worked again from the saved answers.
*/

import { runQuantityModel, toPaid, savedInput } from '@/lib/structopro-qty'
import type { PaidPayload as FramePaid } from '@/lib/structopro-qty/payload'
import { modelFor } from './registry'
import { frameHeads, frameLines, frameWidest, phaseByAppType, tradeHeads, widestOf, PHASES, type PhaseSource } from './grand'
import type { TradePaid } from './types'
import { SQFT_TO_M2 } from './util'

export const PHASE_APP_TYPES: string[] = PHASES.map(p => p.appType)

export interface EstimateRow {
  id: string
  app_type: string
  project_name: string | null
  state?: string | null
  city?: string | null
  input_data: unknown
  result_data: unknown
}

export type Loaded = { ok: true; src: PhaseSource } | { ok: false; error: string }

const FRAME_SOURCES = [
  'IS 456:2000 Plain and reinforced concrete: limit state design, cover, detailing, slabs, beams, columns and footings.',
  'IS 875 Parts 1 and 2: dead and imposed loads. IS 1893 Part 1: earthquake forces and zone factors. IS 13920:2016: ductile detailing.',
  'IS 1786:2008: Fe500D bars and mass per metre. IS 10262: concrete mix proportioning. IS 1904: foundations on soil.',
  'CPWD Delhi Analysis of Rates 2014: nominal-mix cement, sand and aggregate for M20 and below, and the 5% steel cutting waste.',
]

type SavedInput = { engine?: string; floorAreasSqft?: unknown; state?: string; city?: string; site?: unknown; wall?: unknown; plotLengthFt?: unknown; plotWidthFt?: unknown; terraceAccess?: unknown }

export function loadPhase(est: EstimateRow): Loaded {
  const def = phaseByAppType(est.app_type)
  if (!def) return { ok: false, error: 'One of the reports is not a quantity report.' }
  const input = est.input_data as SavedInput | null
  const prior = est.result_data as { paid?: unknown } | null
  const stale = `${def.label}: this report was made with an earlier version of the tool. Run it again to include it.`
  const state = (input?.state ?? est.state ?? '').toString().trim()
  const city = (input?.city ?? est.city ?? '').toString().trim()
  const projectName = (est.project_name ?? '').trim() || 'My project'

  if (def.key === 'structure') {
    if (!input || input.engine !== 'qty-v2') return { ok: false, error: stale }
    let paid = prior?.paid as FramePaid | undefined
    if (!paid) {
      const r = runQuantityModel(savedInput(input as unknown as Record<string, unknown>, { state, city }))
      if (!r.ok) return { ok: false, error: `${def.label}: ${r.error}` }
      paid = toPaid(r)
    }
    return {
      ok: true,
      src: {
        key: def.key,
        estimateId: est.id,
        projectName, state, city,
        floors: paid.inputEcho.floors,
        builtUpM2: paid.inputEcho.totalBuiltUpM2,
        lines: frameLines(paid),
        heads: frameHeads(paid.band),
        widest: frameWidest(paid.band),
        assumptions: paid.assumptions,
        notIncluded: paid.notIncluded,
        sources: FRAME_SOURCES,
      },
    }
  }

  const model = modelFor(def.appType)
  if (!model) return { ok: false, error: `${def.label} is not available yet.` }
  if (!input || input.engine !== 'trade-v1') return { ok: false, error: stale }
  const parsed = model.parse(input)
  if (!parsed.ok) return { ok: false, error: `${def.label}: ${parsed.error}` }
  const ran = model.run(parsed.input)
  if (!ran.ok) return { ok: false, error: `${def.label}: ${ran.error}` }
  const paid: TradePaid = (prior?.paid as TradePaid | undefined) ?? ran.result.paid
  const overlap = paid.overlap ?? ran.result.paid.overlap
  const areas = (parsed.input as { floorAreasSqft: number[] }).floorAreasSqft
  return {
    ok: true,
    src: {
      key: def.key,
      estimateId: est.id,
      projectName, state, city,
      floors: areas.length,
      builtUpM2: areas.reduce((s, a) => s + a, 0) * SQFT_TO_M2,
      lines: paid.lines,
      heads: tradeHeads(def.key, paid.bands),
      widest: widestOf(paid.bands),
      assumptions: paid.assumptions,
      notIncluded: paid.notIncluded,
      sources: paid.sources,
      overlap,
    },
  }
}
