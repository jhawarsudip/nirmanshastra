/*
  Complete House Pack: checks the claim rules in lib/pack/server.ts against an in-memory stand-in for the database.
  Run from the repo root:   npx tsx --tsconfig tsconfig.json scripts/check-pack.ts
  Uses the real Grand Total building test and the real trade models; only the database is faked.
*/

import { redeemClaim } from '../lib/pack/server'
import { PACK_CLAIMS_PER_REPORT } from '../lib/tool-pricing'

type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
type Tables = Record<string, Row[]>

class Q {
  private filters: Array<[string, unknown]> = []
  private mode: 'select' | 'update' | 'insert' = 'select'
  private patch: Row = {}
  private wantRows = false
  constructor(private t: Tables, private name: string) {}
  select() { this.wantRows = true; return this }
  eq(col: string, val: unknown) { this.filters.push([col, val]); return this }
  update(p: Row) { this.mode = 'update'; this.patch = p; return this }
  insert(r: Row) { this.mode = 'insert'; this.patch = r; return this }
  private pick(row: Row, col: string) {
    if (col.includes('->>')) { const [c, k] = col.split('->>'); return String(row[c]?.[k]) }
    return row[col]
  }
  private run(): { data: Row[] | null; error: null } {
    const rows = (this.t[this.name] ??= [])
    if (this.mode === 'insert') { rows.push({ ...this.patch }); return { data: null, error: null } }
    const hit = rows.filter(r => this.filters.every(([c, v]) => this.pick(r, c) === v))
    if (this.mode === 'update') { for (const r of hit) Object.assign(r, this.patch); return { data: this.wantRows ? hit : null, error: null } }
    return { data: hit, error: null }
  }
  maybeSingle() { const r = this.run(); return Promise.resolve({ data: r.data?.[0] ?? null, error: null }) }
  single() { return this.maybeSingle() }
  then(res: (v: { data: Row[] | null; error: null }) => unknown) { return Promise.resolve(this.run()).then(res) }
}
const fakeDb = (t: Tables) => ({ from: (n: string) => new Q(t, n) }) as never

let failed = 0
const check = (name: string, cond: boolean, extra = '') => { if (cond) console.log('ok    ' + name); else { failed++; console.error('FAIL  ' + name + (extra ? '  ' + extra : '')) } }

const PACK = '11111111-1111-4111-8111-111111111111'
const trade = (id: string, tool: string, floors: number[], status = 'complete'): Row => ({
  id, app_type: tool, status, project_name: 'My house', state: 'Uttar Pradesh', city: 'Lucknow', contact_id: null,
  input_data: { engine: 'trade-v1', tool, floorAreasSqft: floors, state: 'Uttar Pradesh', city: 'Lucknow' }, result_data: { engine: 'trade-v1', tool },
})
const pack = (status: string, claims: Row = {}): Row => ({ id: PACK, app_type: 'completepack', status, contact_id: null, input_data: {}, result_data: { engine: 'pack-v1', rev: 0, claims } })
const state = (t: Tables) => t.estimates.find(e => e.id === PACK)!.result_data

async function main() {
  // 1. an unpaid pack unlocks nothing
  {
    const t: Tables = { estimates: [pack('complete'), trade('p1', 'plumbpro', [1000, 1000])], payments: [], contacts: [] }
    const r = await redeemClaim(fakeDb(t), PACK, 'p1')
    check('unpaid pack: refused (402)', !r.ok && r.code === 402)
    check('unpaid pack: report stays locked', t.estimates[1].status === 'complete')
  }

  // 2. a paid pack unlocks a report, writes a zero-amount claim record, counts the claim
  const t: Tables = {
    estimates: [pack('paid'), trade('p1', 'plumbpro', [1000, 1000]), trade('p2', 'plumbpro', [1000, 1000]), trade('p3', 'plumbpro', [1000, 1000]),
      trade('m3', 'masonpro', [1000, 1000, 1000]), trade('m2', 'masonpro', [1000, 1000]), trade('e1', 'electropro', [1000, 1000]), trade('e2', 'electropro', [1000, 1000]),
      trade('paidalready', 'interiorpro', [1000, 1000], 'paid'), { ...trade('v1', 'vastupro', [1000]), app_type: 'vastupro' }],
    payments: [], contacts: [],
  }
  const db = fakeDb(t)
  const est = (id: string) => t.estimates.find(e => e.id === id)!

  let r = await redeemClaim(db, PACK, 'p1')
  check('paid pack: first report unlocks', r.ok === true && !r.already)
  check('paid pack: the report is now paid', est('p1').status === 'paid')
  check('paid pack: one zero-amount claim record, no sale', t.payments.length === 1 && t.payments[0].amount === 0 && t.payments[0].status === 'success' && String(t.payments[0].razorpay_order_id).startsWith('pack:'))
  check('paid pack: the claim is recorded', JSON.stringify(state(t).claims.plumbpro) === JSON.stringify(['p1']) && state(t).rev === 1)

  // 3. pressing the button twice does not use a second claim
  r = await redeemClaim(db, PACK, 'p1')
  check('same report again: no second claim', r.ok === true && r.already === true && t.payments.length === 1 && state(t).claims.plumbpro.length === 1)

  // 4. one correction is allowed, then the limit holds
  r = await redeemClaim(db, PACK, 'p2')
  check(`second report of a kind is allowed (limit ${PACK_CLAIMS_PER_REPORT})`, PACK_CLAIMS_PER_REPORT < 2 ? !r.ok : r.ok === true)
  r = await redeemClaim(db, PACK, 'p3')
  check('one more than the limit: refused (409)', !r.ok && r.code === 409 && est('p3').status === 'complete')

  // 5. one house: a report for a different building is refused, and nothing is spent
  const before = JSON.stringify(state(t))
  r = await redeemClaim(db, PACK, 'm3')
  check('three floors against two: refused (422)', !r.ok && r.code === 422, JSON.stringify(r))
  check('refused claim: report still locked, pack unchanged', est('m3').status === 'complete' && JSON.stringify(state(t)) === before)
  r = await redeemClaim(db, PACK, 'm2')
  check('same building: unlocks', r.ok === true && est('m2').status === 'paid')

  // 6. things a pack must not unlock
  r = await redeemClaim(db, PACK, 'paidalready')
  check('a report already paid for: refused (409)', !r.ok && r.code === 409)
  r = await redeemClaim(db, PACK, 'v1')
  check('a free tool (VastuPro): refused (400)', !r.ok && r.code === 400)
  r = await redeemClaim(db, PACK, 'no-such-estimate')
  check('unknown estimate: refused (404)', !r.ok && r.code === 404)
  r = await redeemClaim(db, '22222222-2222-4222-8222-222222222222', 'e1')
  check('unknown pack: refused (404)', !r.ok && r.code === 404)
  r = await redeemClaim(db, 'p1', 'e1')
  check('a report id used as a pack id: refused', !r.ok)

  // 7. two claims at the same moment cannot both pass the limit
  {
    const t2: Tables = {
      estimates: [pack('paid', { electropro: ['x'] }), trade('e1', 'electropro', [1000, 1000]), trade('e2', 'electropro', [1000, 1000]), trade('x', 'electropro', [1000, 1000], 'paid')],
      payments: [], contacts: [],
    }
    if (PACK_CLAIMS_PER_REPORT === 2) {
      const d2 = fakeDb(t2)
      const [a, b] = await Promise.all([redeemClaim(d2, PACK, 'e1'), redeemClaim(d2, PACK, 'e2')])
      const wins = [a, b].filter(x => x.ok).length
      const paidNow = t2.estimates.filter(e => ['e1', 'e2'].includes(e.id) && e.status === 'paid').length
      check('two claims at once, one left: exactly one passes', wins === 1 && paidNow === 1 && t2.estimates[0].result_data.claims.electropro.length === 2, `wins=${wins} paid=${paidNow}`)
    }
  }

  if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1) }
  console.log('\nAll pack checks passed')
}
main().catch(e => { console.error(e); process.exit(1) })
