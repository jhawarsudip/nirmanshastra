/*
  Server only. Gives a StructurePro estimate its contact (name and email) at the moment the visitor chooses to pay or to
  save the project. Until then the estimate has none: the structure and the free frame preview need no email.
*/

import type { SupabaseClient } from '@supabase/supabase-js'
import { cleanEmail, cleanName, upsertContact } from './contacts'

/**
 * Follow-up emails for a StructurePro contact. Day 0 is left out: its text is "your report is ready", and a contact is
 * made before the person has paid (or when they only save the project). The report-ready email itself goes out at payment.
 */
export const STRUCT_SEQUENCE_DAYS = [7, 45, 75, 120]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type AttachResult =
  | { ok: true; contactId: string; created: boolean }
  | { ok: false; code: number; error: string }

export async function attachContactToEstimate(
  db: SupabaseClient,
  input: { estimateId: unknown; email: unknown; name: unknown },
): Promise<AttachResult> {
  const estimateId = typeof input.estimateId === 'string' && UUID_RE.test(input.estimateId) ? input.estimateId : null
  if (!estimateId) return { ok: false, code: 400, error: 'Your estimate is not saved yet. Please wait a moment and try again.' }
  const name = cleanName(input.name)
  if (!name) return { ok: false, code: 400, error: 'Please enter your name' }
  const email = cleanEmail(input.email)
  if (!email) return { ok: false, code: 400, error: 'Please enter a valid email address' }

  const { data: est, error: estErr } = await db
    .from('estimates')
    .select('id, app_type, status, state, city')
    .eq('id', estimateId)
    .maybeSingle()
  if (estErr) return { ok: false, code: 500, error: 'We could not save your details. Please try again.' }
  if (!est || est.app_type !== 'structopro') return { ok: false, code: 404, error: 'We could not find that estimate. Please run it again.' }
  // A paid report is already tied to the contact it was paid under; it must not be re-pointed.
  if (est.status === 'paid') return { ok: false, code: 409, error: 'This report is already paid for.' }

  const saved = await upsertContact(db, {
    email,
    name,
    city: est.city ?? null,
    state: est.state ?? null,
    source: 'StructoPro',
    status: 'analysed',
    sequence: { type: 'structopro', days: STRUCT_SEQUENCE_DAYS },
  })
  if (!saved.ok) {
    console.error('StructoPro contact: could not save', saved.error)
    return { ok: false, code: 500, error: 'We could not save your details. Please try again.' }
  }

  const { data: linked, error: linkErr } = await db
    .from('estimates')
    .update({ contact_id: saved.id })
    .eq('id', estimateId)
    .neq('status', 'paid')
    .select('id')
  if (linkErr || !linked || linked.length !== 1) {
    console.error('StructoPro contact: could not attach to the estimate', linkErr)
    return { ok: false, code: 500, error: 'We could not save your details. Please try again.' }
  }

  return { ok: true, contactId: saved.id, created: saved.created }
}
