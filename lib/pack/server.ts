/*
  Server side of the Complete House Pack. Only API routes import this file.

  A pack is a paid `estimates` row (app_type 'completepack'). Redeeming it unlocks ONE report by marking that report's
  estimate paid, exactly as a verified payment would, and records the claim on the pack. The rules, all checked here
  and never in the browser:
    1. the pack itself must be paid (the Razorpay signature and order binding were checked in /api/payments/verify);
    2. the report must be one of the six the pack holds, and not already paid;
    3. a pack makes at most PACK_CLAIMS_PER_REPORT reports of each kind (one, plus a correction);
    4. a report must describe the same building as the pack's other reports (same floors, same state, floor area
       within 10%), the test the Grand Total already uses. That is what keeps one pack to one house;
    5. two claims made at the same moment cannot both pass: the pack row carries a revision number, and a claim is
       kept only if the revision it read is still the current one.
*/

import { createServiceClient } from '@/lib/supabase/server'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { PACK_APP_TYPE, PACK_CONTAINS, PACK_CLAIMS_PER_REPORT, type PaidAppType } from '@/lib/tool-pricing'
import { disagreement, phaseByAppType, type PhaseSource } from '@/lib/qty/grand'
import { loadPhase } from '@/lib/qty/grand-server'
import { PACK_LABEL, packStatusOf, readPackState, type PackState, type PackStatus } from './shared'

type Db = ReturnType<typeof createServiceClient>

export type PackRow = { id: string; app_type: string; status: string; contact_id: string | null; input_data: unknown; result_data: unknown }

export async function loadPack(db: Db, packId: string): Promise<{ row: PackRow; state: PackState; paid: boolean } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(packId)) return null
  const { data } = await db
    .from('estimates')
    .select('id, app_type, status, contact_id, input_data, result_data')
    .eq('id', packId)
    .maybeSingle()
  if (!data || data.app_type !== PACK_APP_TYPE) return null
  const paid = data.status === 'paid' || (PAYMENT_BYPASS && data.status === 'complete')
  return { row: data as PackRow, state: readPackState(data.result_data), paid }
}

export async function statusOfPack(db: Db, packId: string): Promise<PackStatus | null> {
  const p = await loadPack(db, packId)
  return p ? packStatusOf(p.paid, p.state) : null
}

export type RedeemResult =
  | { ok: true; already: boolean; status: PackStatus }
  | { ok: false; code: number; error: string }

const fail = (code: number, error: string): RedeemResult => ({ ok: false, code, error })

export async function redeemClaim(db: Db, packId: string, estimateId: string): Promise<RedeemResult> {
  const pack = await loadPack(db, packId)
  if (!pack) return fail(404, 'We could not find that pack.')
  if (!pack.paid) return fail(402, 'This pack has not been paid for yet.')

  const { data: est } = await db
    .from('estimates')
    .select('id, app_type, status, project_name, state, city, contact_id, input_data, result_data')
    .eq('id', estimateId)
    .maybeSingle()
  if (!est) return fail(404, 'We could not find that report.')

  const type = est.app_type as PaidAppType
  if (!(PACK_CONTAINS as readonly string[]).includes(type)) return fail(400, 'A pack covers the five reports and the Grand Total.')

  const claimedHere = pack.state.claims[type] ?? []
  // The same report claimed twice (a double click, a reload) is not charged to the pack twice.
  if (claimedHere.includes(est.id)) return { ok: true, already: true, status: packStatusOf(true, pack.state) }
  if (est.status === 'paid') return fail(409, 'This report is already paid for.')
  if (est.status !== 'complete') return fail(409, 'This report is not ready to unlock yet.')
  if (claimedHere.length >= PACK_CLAIMS_PER_REPORT) {
    return fail(409, `Your pack has already made the ${PACK_CLAIMS_PER_REPORT} ${PACK_LABEL[type]} ${PACK_CLAIMS_PER_REPORT === 1 ? 'report' : 'reports'} it includes.`)
  }

  // One house: a report must describe the same building as the pack's other reports.
  if (type !== 'grandtotal' && phaseByAppType(type)) {
    const others: PhaseSource[] = []
    for (const k of PACK_CONTAINS) {
      if (k === type || k === 'grandtotal') continue
      const ids = pack.state.claims[k]
      const latest = ids && ids.length ? ids[ids.length - 1] : null
      if (!latest) continue
      const { data: o } = await db
        .from('estimates')
        .select('id, app_type, project_name, state, city, input_data, result_data')
        .eq('id', latest)
        .maybeSingle()
      if (!o) continue
      const l = loadPhase(o)
      if (l.ok) others.push(l.src)
    }
    if (others.length) {
      const mine = loadPhase(est)
      if (!mine.ok) return fail(422, mine.error)
      const mismatch = disagreement([...others, mine.src])
      if (mismatch) {
        return fail(422, `A pack covers one house, and this report does not match the other reports in your pack. ${mismatch.replace(/ so they cannot be added into one list\./, '.')}`)
      }
    }
  }

  // Keep the claim only if nobody else changed the pack since we read it.
  const next: PackState = {
    ...pack.state,
    rev: pack.state.rev + 1,
    claims: { ...pack.state.claims, [type]: [...claimedHere, est.id] },
  }
  const { data: kept, error: keepErr } = await db
    .from('estimates')
    .update({ result_data: next })
    .eq('id', packId)
    .eq('result_data->>rev', String(pack.state.rev))
    .select('id')
  if (keepErr) {
    console.error('Pack redeem: could not record the claim', keepErr)
    return fail(500, 'We could not unlock the report. Please try again.')
  }
  if (!kept || kept.length !== 1) return fail(409, 'Your pack changed while this was happening. Please press the button once more.')

  // The claim is recorded. Unlock the report the way a verified payment does.
  const undo = async () => {
    await db.from('estimates').update({ result_data: pack.state }).eq('id', packId).eq('result_data->>rev', String(next.rev))
  }
  const { data: flipped, error: upErr } = await db
    .from('estimates')
    .update({ status: 'paid' })
    .eq('id', est.id)
    .eq('status', 'complete')
    .select('id')
  if (upErr || !flipped || flipped.length !== 1) {
    console.error('Pack redeem: could not unlock the report', upErr)
    await undo()
    return fail(500, 'We could not unlock the report. Please try again.')
  }

  // An amount of 0 and an order id that names the pack: the books show a claim, never a sale.
  const { error: payErr } = await db.from('payments').insert({
    estimate_id: est.id,
    razorpay_order_id: `pack:${packId}`,
    razorpay_payment_id: 'pack-claim',
    amount: 0,
    status: 'success',
  })
  if (payErr) console.error('Pack redeem: could not write the claim record', payErr)

  if (est.contact_id) await db.from('contacts').update({ status: 'paid' }).eq('id', est.contact_id)

  return { ok: true, already: false, status: packStatusOf(true, next) }
}
