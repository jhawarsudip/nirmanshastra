/*
  Server only. Cleaning what a visitor types and keeping one contact (lead) per email address and tool.

  Results come before email on VastuPro and StructurePro, so a contact is no longer made on the first screen. It is made
  when the visitor gives an email (to have the PDF sent, to pay, or to save the project). If the same address comes back,
  the row is reused and the follow-up emails are not scheduled a second time.
*/

import type { SupabaseClient } from '@supabase/supabase-js'
import { scheduleEmailSequences } from './email-sequences'

const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/

/** The address in lower case, or null when it is not an email address. */
export function cleanEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const e = v.trim().toLowerCase()
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null
}

/** A name with control characters removed, at most 120 characters; '' when nothing usable. */
export function cleanName(v: unknown): string {
  return typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) : ''
}

/**
 * A phone number as "+<country code><number>".
 * 10 digits starting 6 to 9 are taken as Indian; "0" or "91" in front is understood. ok:true with value null means "left empty".
 */
export function cleanMobile(v: unknown): { ok: true; value: string | null } | { ok: false } {
  if (v === undefined || v === null) return { ok: true, value: null }
  if (typeof v !== 'string') return { ok: false }
  const raw = v.trim()
  if (!raw) return { ok: true, value: null }
  if (!/^[+\d][\d\s\-().]*$/.test(raw)) return { ok: false }
  let d = raw.replace(/\D/g, '')
  if (raw.startsWith('+') || raw.startsWith('00')) {
    if (raw.startsWith('00')) d = d.slice(2)
  } else if (d.length === 11 && d.startsWith('0')) {
    d = `91${d.slice(1)}`
  } else if (d.length === 10) {
    d = `91${d}`
  }
  if (d.startsWith('91') && d.length === 12 && !/^[6-9]/.test(d.slice(2))) return { ok: false }
  if (d.length < 10 || d.length > 15) return { ok: false }
  return { ok: true, value: `+${d}` }
}

export interface ContactArgs {
  email: string
  name?: string
  mobile?: string | null
  city?: string | null
  state?: string | null
  propertyType?: string | null
  plotSize?: string | null
  /** 'VastuPro' | 'StructoPro' (the value the admin dashboard already groups by) */
  source: string
  status: string
  /** the follow-up emails to schedule when the contact is new. Left out, none are scheduled. */
  sequence?: { type: string; days?: number[] }
}

export type ContactResult = { ok: true; id: string; created: boolean } | { ok: false; error: string }

export async function upsertContact(db: SupabaseClient, a: ContactArgs): Promise<ContactResult> {
  const { data: found, error: findErr } = await db
    .from('contacts')
    .select('id, name, mobile, city, state')
    .eq('email', a.email)
    .eq('source', a.source)
    .order('created_at', { ascending: true })
    .limit(1)
  if (findErr) return { ok: false, error: findErr.message }

  const row = found && found[0]
  if (row) {
    const patch: Record<string, string> = {}
    if (a.name && !row.name) patch.name = a.name
    if (a.mobile && a.mobile !== row.mobile) patch.mobile = a.mobile
    if (a.city && !row.city) patch.city = a.city
    if (a.state && !row.state) patch.state = a.state
    if (Object.keys(patch).length > 0) {
      const { error } = await db.from('contacts').update(patch).eq('id', row.id)
      if (error) console.error('upsertContact: update failed', error)
    }
    return { ok: true, id: row.id as string, created: false }
  }

  const { data: made, error: insErr } = await db
    .from('contacts')
    .insert({
      name: a.name || null,
      mobile: a.mobile ?? null,
      email: a.email,
      city: a.city ?? null,
      state: a.state ?? null,
      property_type: a.propertyType ?? null,
      plot_size: a.plotSize ?? null,
      source: a.source,
      status: a.status,
    })
    .select('id')
    .single()
  if (insErr || !made) return { ok: false, error: insErr?.message ?? 'insert failed' }

  if (a.sequence) await scheduleEmailSequences(made.id as string, a.sequence.type, db, a.sequence.days)
  return { ok: true, id: made.id as string, created: true }
}
