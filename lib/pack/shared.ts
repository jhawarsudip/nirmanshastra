/*
  The Complete House Pack: what the browser and the server both need to know.
  The price and the claim limit live in lib/tool-pricing.ts; nothing here types a rupee figure.

  How a pack is stored: one row in `estimates` with app_type 'completepack'. It is paid through the same Razorpay order,
  signature check and estimate binding as a single report. Its `result_data` holds the claims:
    { engine: 'pack-v1', rev: <number>, claims: { structopro: [estimateId, ...], ... } }
  A claim unlocks one report of the pack's house (see lib/pack/server.ts).
*/

import { PACK_CONTAINS, PACK_CLAIMS_PER_REPORT, type PaidAppType } from '../tool-pricing'

export const PACK_STORAGE_KEY = 'ns_pack_id'

export type PackClaims = Partial<Record<PaidAppType, string[]>>

export interface PackState {
  engine: 'pack-v1'
  /** bumped on every change, so two claims made at the same moment cannot both pass the limit */
  rev: number
  claims: PackClaims
  /** set once the confirmation email has been sent */
  emailSentAt?: string
}

/** What the browser is told about a pack: counts only, never the ids of the reports inside it. */
export interface PackStatus {
  paid: boolean
  /** reports of each kind the pack can still unlock */
  remaining: Record<PaidAppType, number>
  /** reports of each kind already unlocked */
  used: Record<PaidAppType, number>
  perReport: number
}

export const PACK_LABEL: Record<PaidAppType, string> = {
  structopro: 'StructurePro',
  masonpro: 'MasonryPro',
  electropro: 'ElectricalPro',
  plumbpro: 'PlumbingPro',
  interiorpro: 'InteriorPro',
  grandtotal: 'Grand Total',
}

export const PACK_TOOL_PATH: Record<PaidAppType, string> = {
  structopro: '/tools/structopro',
  masonpro: '/tools/masonpro',
  electropro: '/tools/electropro',
  plumbpro: '/tools/plumbpro',
  interiorpro: '/tools/interiorpro',
  grandtotal: '/tools/grand-total',
}

export function readPackState(raw: unknown): PackState {
  const r = (raw ?? {}) as Partial<PackState>
  const claims: PackClaims = {}
  for (const k of PACK_CONTAINS) {
    const v = r.claims?.[k]
    if (Array.isArray(v)) claims[k] = v.filter((x): x is string => typeof x === 'string')
  }
  return {
    engine: 'pack-v1',
    rev: typeof r.rev === 'number' ? r.rev : 0,
    claims,
    ...(typeof r.emailSentAt === 'string' ? { emailSentAt: r.emailSentAt } : {}),
  }
}

export function packStatusOf(paid: boolean, state: PackState): PackStatus {
  const used = {} as Record<PaidAppType, number>
  const remaining = {} as Record<PaidAppType, number>
  for (const k of PACK_CONTAINS) {
    used[k] = state.claims[k]?.length ?? 0
    remaining[k] = Math.max(0, PACK_CLAIMS_PER_REPORT - used[k])
  }
  return { paid, remaining, used, perReport: PACK_CLAIMS_PER_REPORT }
}
