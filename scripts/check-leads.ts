/*
  Group 5 check: result before email.
  Covers the pieces that decide whether a visitor's details are kept correctly and nothing is lost:
    - cleaning of email, name and phone number
    - one contact per email and tool, follow-up emails scheduled once
    - a StructurePro estimate gets its contact at pay or save, and a paid estimate is left alone
    - the VastuPro PDF route: asks for an email, returns a real PDF, and still returns it when the database and the mailer are unavailable
    - the follow-up email headings read well with and without a name
  Run: npx tsx --tsconfig tsconfig.json scripts/check-leads.ts
*/

import { NextRequest } from 'next/server'
import { cleanEmail, cleanMobile, cleanName, upsertContact } from '@/lib/contacts'
import { attachContactToEstimate, STRUCT_SEQUENCE_DAYS } from '@/lib/structopro-contact'
import { allow } from '@/lib/throttle'
import { parseVastuPlan } from '@/lib/vastu-plan'
import { getEmailContent } from '@/lib/email-templates'
import { rectangleOutline } from '@/app/[locale]/tools/vastu-pro/vastu-model'
import type { SupabaseClient } from '@supabase/supabase-js'

let failed = 0
let passed = 0
function ok(cond: boolean, what: string) {
  if (cond) { passed++; console.log(`  ok   ${what}`) } else { failed++; console.log(`  FAIL ${what}`) }
}
const eq = (a: unknown, b: unknown, what: string) => ok(JSON.stringify(a) === JSON.stringify(b), `${what}${JSON.stringify(a) === JSON.stringify(b) ? '' : `  (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`}`)

type Row = Record<string, unknown>

/** a tiny in-memory stand-in for the parts of the Supabase client the lead code uses */
function fakeDb(tables: Record<string, Row[]>): SupabaseClient {
  let n = 0
  const from = (t: string) => {
    tables[t] ??= []
    const st = { op: 'select', filters: [] as Array<['eq' | 'neq', string, unknown]>, patch: null as Row | null, rows: null as Row[] | null, sel: false, single: false, maybe: false, lim: Infinity }
    const matches = () => tables[t].filter(r => st.filters.every(([k, c, v]) => (k === 'eq' ? r[c] === v : r[c] !== v)))
    const run = () => {
      if (st.op === 'insert') {
        const made = (st.rows ?? []).map(r => ({ id: `id-${++n}`, created_at: new Date().toISOString(), ...r }))
        tables[t].push(...made)
        return { data: st.sel ? (st.single ? made[0] : made) : null, error: null }
      }
      if (st.op === 'update') {
        const hit = matches()
        for (const r of hit) Object.assign(r, st.patch)
        return { data: st.sel ? hit : null, error: null }
      }
      const hit = matches().slice(0, st.lim)
      if (st.single) return hit[0] ? { data: hit[0], error: null } : { data: null, error: { message: 'no row' } }
      if (st.maybe) return { data: hit[0] ?? null, error: null }
      return { data: hit, error: null }
    }
    const q: Record<string, unknown> = {
      select: () => { st.sel = true; return q },
      insert: (r: Row | Row[]) => { st.op = 'insert'; st.rows = Array.isArray(r) ? r : [r]; return q },
      update: (p: Row) => { st.op = 'update'; st.patch = p; return q },
      eq: (c: string, v: unknown) => { st.filters.push(['eq', c, v]); return q },
      neq: (c: string, v: unknown) => { st.filters.push(['neq', c, v]); return q },
      order: () => q,
      limit: (k: number) => { st.lim = k; return q },
      single: () => { st.single = true; return q },
      maybeSingle: () => { st.maybe = true; return q },
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(run()).then(res, rej),
    }
    return q
  }
  return { from } as unknown as SupabaseClient
}

async function main() {
  console.log('Cleaning what is typed')
  eq(cleanEmail('  Ramesh@Example.COM '), 'ramesh@example.com', 'email is trimmed and lower-cased')
  eq(cleanEmail('not an email'), null, 'a non-email is refused')
  eq(cleanEmail('a@b'), null, 'an address with no dot is refused')
  eq(cleanEmail(42), null, 'a non-string is refused')
  eq(cleanName('  Ramesh   Sharma\u0007 '), 'Ramesh Sharma', 'name is tidied')
  eq(cleanName('<b>x</b>'), 'b x /b', 'angle brackets are removed from a name')
  eq(cleanName('x'.repeat(300)).length, 120, 'a long name is cut to 120')
  eq(cleanMobile('98765 43210'), { ok: true, value: '+919876543210' }, 'ten Indian digits get +91')
  eq(cleanMobile('09876543210'), { ok: true, value: '+919876543210' }, 'a leading 0 is dropped')
  eq(cleanMobile('+91 98765-43210'), { ok: true, value: '+919876543210' }, '+91 with spaces and a dash')
  eq(cleanMobile('+44 7911 123456'), { ok: true, value: '+447911123456' }, 'an international number is kept')
  eq(cleanMobile(''), { ok: true, value: null }, 'empty means left out')
  eq(cleanMobile(undefined), { ok: true, value: null }, 'missing means left out')
  eq(cleanMobile('12345'), { ok: false }, 'too short is refused')
  eq(cleanMobile('abc'), { ok: false }, 'letters are refused')
  eq(cleanMobile('5876543210'), { ok: false }, 'an Indian number starting 5 is refused')

  console.log('One contact per email and tool')
  {
    const t: Record<string, Row[]> = {}
    const db = fakeDb(t)
    const a = await upsertContact(db, { email: 'a@x.in', name: 'Asha', source: 'VastuPro', status: 'downloaded', sequence: { type: 'vastupro' } })
    ok(a.ok && a.created, 'first time: created')
    eq(t.contacts.length, 1, 'one contact row')
    eq(t.email_sequences.map(r => r.day_number), [0, 7, 45, 75, 120], 'all five follow-ups scheduled')
    const b = await upsertContact(db, { email: 'a@x.in', name: 'Other', mobile: '+919876543210', source: 'VastuPro', status: 'downloaded', sequence: { type: 'vastupro' } })
    ok(b.ok && !b.created && a.ok && b.ok && a.id === b.id, 'same email again: same contact, not created')
    eq(t.contacts.length, 1, 'still one contact row')
    eq(t.email_sequences.length, 5, 'follow-ups not scheduled twice')
    eq(t.contacts[0].mobile, '+919876543210', 'a number given later is added')
    eq(t.contacts[0].name, 'Asha', 'an existing name is not overwritten')
    const c = await upsertContact(db, { email: 'a@x.in', source: 'StructoPro', status: 'analysed', sequence: { type: 'structopro', days: STRUCT_SEQUENCE_DAYS } })
    ok(c.ok && c.created, 'same email in another tool is its own contact')
    eq(t.email_sequences.filter(r => r.sequence_type === 'structopro').map(r => r.day_number), [7, 45, 75, 120], 'StructurePro follow-ups skip day 0')
  }

  console.log('A StructurePro estimate gets its contact')
  {
    const uuid = '11111111-2222-3333-4444-555555555555'
    const mk = (status: string, app = 'structopro'): Record<string, Row[]> => ({ estimates: [{ id: uuid, app_type: app, status, state: 'Maharashtra', city: 'Pune', contact_id: null }] as Row[] })
    let t = mk('complete')
    let r = await attachContactToEstimate(fakeDb(t), { estimateId: uuid, email: 'Ramesh@Example.com', name: 'Ramesh Sharma' })
    ok(r.ok, 'saves at pay or save')
    ok(r.ok && t.estimates[0].contact_id === r.contactId, 'the estimate now points at the contact')
    eq(t.contacts?.[0]?.city, 'Pune', 'the contact carries the estimate city')
    eq(t.contacts?.[0]?.email, 'ramesh@example.com', 'the email is stored lower case')
    // a second go with a corrected address re-points the estimate to the other contact, before payment
    r = await attachContactToEstimate(fakeDb(t), { estimateId: uuid, email: 'ramesh.s@example.com', name: 'Ramesh Sharma' })
    ok(r.ok && t.contacts.length === 2, 'a corrected email makes a second contact and re-points the estimate')
    t = mk('paid')
    r = await attachContactToEstimate(fakeDb(t), { estimateId: uuid, email: 'a@b.in', name: 'A' })
    ok(!r.ok && r.code === 409, 'a paid estimate is left alone')
    t = mk('complete', 'masonpro')
    r = await attachContactToEstimate(fakeDb(t), { estimateId: uuid, email: 'a@b.in', name: 'A' })
    ok(!r.ok && r.code === 404, 'only a StructurePro estimate takes it')
    r = await attachContactToEstimate(fakeDb(mk('complete')), { estimateId: 'nope', email: 'a@b.in', name: 'A' })
    ok(!r.ok && r.code === 400, 'a bad estimate id is refused')
    r = await attachContactToEstimate(fakeDb(mk('complete')), { estimateId: uuid, email: 'bad', name: 'A' })
    ok(!r.ok && r.code === 400, 'a bad email is refused')
    r = await attachContactToEstimate(fakeDb(mk('complete')), { estimateId: uuid, email: 'a@b.in', name: '  ' })
    ok(!r.ok && r.code === 400, 'a missing name is refused')
  }

  console.log('Throttle')
  {
    const k = `k-${Math.random()}`
    const results = [1, 2, 3, 4].map(() => allow(k, 3, 1000, 5000))
    eq(results, [true, true, true, false], 'the fourth call inside the window is refused')
    ok(allow(k, 3, 1000, 7000), 'it opens again after the window')
  }

  console.log('The VastuPro plan is checked')
  const house = rectangleOutline(40, 30)
  const plan = { northDeg: 0, house, items: [], doors: [{ id: 'main_door', kind: 'main_door', pt: { x: house[0].x, y: house[0].y } }] }
  ok(parseVastuPlan(plan).ok, 'a normal plan is accepted')
  ok(!parseVastuPlan({ ...plan, doors: [] }).ok, 'a plan with nothing marked is refused')
  ok(!parseVastuPlan({ ...plan, northDeg: 'x' }).ok, 'a bad North is refused')
  ok(!parseVastuPlan({ ...plan, house: house.slice(0, 2) }).ok, 'an outline of two points is refused')

  console.log('The VastuPro PDF route')
  {
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_FROM_EMAIL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const { POST } = await import('@/app/api/vastu-pro/report/route')
    const call = (body: unknown, ip: string) => POST(new NextRequest('http://localhost/api/vastu-pro/report', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify(body) }))
    let res = await call({ ...plan }, '10.0.0.1')
    ok(res.status === 400, 'no email: refused')
    res = await call({ ...plan, email: 'nope' }, '10.0.0.1')
    ok(res.status === 400, 'a bad email: refused')
    res = await call({ ...plan, email: 'a@b.in', doors: [] }, '10.0.0.1')
    ok(res.status === 400, 'an empty plan: refused')
    res = await call({ ...plan, email: 'a@b.in', name: 'Asha', whatsapp: '123' }, '10.0.0.2')
    ok(res.status === 200, 'a good request: 200 even with no database and no mailer (a stray "whatsapp" field is ignored: the form no longer asks for one)')
    ok(res.headers.get('content-type') === 'application/pdf', 'it returns a PDF')
    ok(res.headers.get('x-ns-emailed') === '0', 'and says the email did not go')
    const bytes = new Uint8Array(await res.arrayBuffer())
    ok(new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-' && bytes.length > 10000, `the body is a real PDF (${bytes.length} bytes)`)
  }

  console.log('Follow-up email headings')
  {
    const withName = getEmailContent('vastupro', 0, 'Ramesh Sharma')
    const noName = getEmailContent('vastupro', 0, '')
    ok(!!withName && withName.html.includes('Your Vastu check, Ramesh'), 'with a name: "Your Vastu check, Ramesh"')
    ok(!!noName && noName.html.includes('Your Vastu check</h2>') && !noName.html.includes('undefined'), 'with no name: "Your Vastu check" and nothing dangling')
    ok(!!noName && noName.html.includes('sent in a separate email'), 'the day-0 text says the PDF came in a separate email')
    ok(!!noName && !noName.html.includes('you can download a free PDF'), 'and no longer says the PDF can be downloaded later')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
