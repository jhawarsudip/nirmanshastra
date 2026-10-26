/*
  Checks the analytics rules without a browser: consent gating, the event queue, purchase-once, campaign tags,
  and that every reported price is the price the checkout charges.
  Run:  npx tsx scripts/check-analytics.ts
*/
import assert from 'node:assert/strict'
import { TOOL_PRICE_PAISE, PACK_PRICE_PAISE } from '../lib/tool-pricing'

// ── a tiny fake browser ──────────────────────────────────────────────────────
const store = new Map<string, string>()
const listeners = new Map<string, Set<() => void>>()
const calls: unknown[][] = []
const fb: unknown[][] = []
const win: Record<string, unknown> = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, v) },
    removeItem: (k: string) => { store.delete(k) },
  },
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  location: { search: '', hostname: 'www.nirmanshastra.in', pathname: '/tools/plumbpro' },
  addEventListener: (t: string, cb: () => void) => { (listeners.get(t) ?? listeners.set(t, new Set()).get(t)!).add(cb) },
  removeEventListener: (t: string, cb: () => void) => { listeners.get(t)?.delete(cb) },
  dispatchEvent: (e: { type: string }) => { listeners.get(e.type)?.forEach(cb => cb()); return true },
  gtag: (...a: unknown[]) => { calls.push(a) },
  fbq: (...a: unknown[]) => { fb.push(a) },
}
;(globalThis as unknown as { window: unknown }).window = win

async function main() {
  const { sanitizeAttribution } = await import('../lib/analytics/attribution-server')
  const { itemFor } = await import('../lib/analytics/items')
  const { priceForAppType, TOOL_PRICE_PAISE, PACK_PRICE_PAISE } = await import('../lib/tool-pricing')
  const consent = await import('../lib/analytics/consent')
  const vendors = await import('../lib/analytics/vendors')
  const ev = await import('../lib/analytics/events')
  const attr = await import('../lib/analytics/attribution')
  const checkout = await import('../lib/analytics/checkout')
  const cfg = await import('../lib/analytics/config')
  let n = 0
  const ok = (name: string, fn: () => void) => { fn(); n++; console.log('  ok  ' + name) }
  const eventNames = () => calls.filter(c => c[0] === 'event').map(c => c[1])

  // ── config ────────────────────────────────────────────────────────────────
  ok('GA4, Clarity and the Pixel carry the values SJ gave', () => {
    assert.equal(cfg.GA_MEASUREMENT_ID, 'G-67WK10W3P7')
    assert.equal(cfg.CLARITY_PROJECT_ID, 'z3qrtyg6lj')
    assert.equal(cfg.META_PIXEL_ID, '1344616013322611')
    assert.equal(cfg.analyticsAllowedOnHost('www.nirmanshastra.in'), true)
    assert.equal(cfg.analyticsAllowedOnHost('localhost'), true)
    assert.equal(cfg.analyticsAllowedOnHost('nirmanshastra-git-x-team.vercel.app'), false)
  })

  // ── campaign tags, server side ────────────────────────────────────────────
  ok('server keeps only the three tags, as short plain text', () => {
    const a = sanitizeAttribution({ utm_source: ' instagram ', utm_medium: 'reel<script>', utm_campaign: 'x'.repeat(200), evil: 'drop', utm_term: 'drop' })
    assert.deepEqual(Object.keys(a).sort(), ['utm_campaign', 'utm_medium', 'utm_source'])
    assert.equal(a.utm_source, 'instagram')
    assert.equal(a.utm_medium, 'reelscript')
    assert.equal(a.utm_campaign!.length, 80)
    assert.deepEqual(sanitizeAttribution(null), {})
    assert.deepEqual(sanitizeAttribution('x'), {})
    assert.deepEqual(sanitizeAttribution({ utm_source: 5, utm_medium: {}, utm_campaign: [] }), {})
  })

  // ── what is reported equals what is charged ───────────────────────────────
  ok('every reported price is the checkout price', () => {
    for (const k of Object.keys(TOOL_PRICE_PAISE)) {
      const it = itemFor(k)!
      assert.equal(it.price, priceForAppType(k)! / 100, k)
      assert.equal(it.quantity, 1)
    }
    assert.equal(itemFor('completepack')!.price, PACK_PRICE_PAISE / 100)
    assert.equal(itemFor('vastupro'), null)
    assert.equal(itemFor('toString'), null)
    assert.equal(itemFor(''), null)
  })

  // ── before the visitor answers ────────────────────────────────────────────
  ok('nothing is sent while consent is unanswered, and the event waits', () => {
    ev.trackViewItem(itemFor('plumbpro')!)
    assert.deepEqual(eventNames(), [])
  })

  ok('campaign tags are held in memory, not stored, before consent', () => {
    ;(win.location as { search: string }).search = '?utm_source=instagram&utm_medium=reel&utm_campaign=oct_quote'
    attr.captureAttribution()
    assert.equal(store.has(cfg.ATTRIBUTION_STORAGE_KEY), false)
    assert.deepEqual(attr.getAttribution(), {}) // not sent with an order either
  })

  // ── accepted ──────────────────────────────────────────────────────────────
  ok('accept: defaults denied first, then granted, then the queued event is sent', () => {
    vendors.initConsentDefaults()
    const def = calls.find(c => c[0] === 'consent' && c[1] === 'default')!
    assert.deepEqual(def[2], { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
    consent.writeConsent('granted')
    attr.flushAttribution()
    vendors.bootGa(); vendors.bootPixel()
    const upd = calls.findIndex(c => c[0] === 'consent' && c[1] === 'update')
    assert.ok(upd > calls.indexOf(def), 'update comes after default')
    assert.deepEqual(calls[upd][2], { analytics_storage: 'granted', ad_storage: 'granted' })
    assert.ok(calls.some(c => c[0] === 'config' && c[1] === 'G-67WK10W3P7'))
    assert.deepEqual(eventNames(), []) // still held until the flush
    ev.flushQueuedEvents()
    assert.deepEqual(eventNames(), ['view_item'])
    const v = calls.find(c => c[1] === 'view_item')![2] as { currency: string; value: number }
    assert.equal(v.currency, 'INR')
    assert.equal(v.value, 999)
    assert.ok(fb.some(c => c[0] === 'init' && c[1] === '1344616013322611'))
    assert.ok(fb.some(c => c[0] === 'track' && c[1] === 'ViewContent'))
  })

  ok('campaign tags move to storage after accept and travel with the order', () => {
    assert.deepEqual(attr.getAttribution(), { utm_source: 'instagram', utm_medium: 'reel', utm_campaign: 'oct_quote' })
  })

  ok('first visit wins: a later tagged visit does not replace the tags', () => {
    ;(win.location as { search: string }).search = '?utm_source=facebook&utm_medium=ad&utm_campaign=other'
    attr.captureAttribution()
    assert.equal(attr.getAttribution().utm_source, 'instagram')
  })

  ok('begin_checkout and purchase carry the amount the server charged, with INR and the order id', () => {
    checkout.orderCreated({ orderId: 'order_A1', amount: TOOL_PRICE_PAISE.structopro, product: 'structopro' })
    const bc = calls.filter(c => c[1] === 'begin_checkout').pop()![2] as { value: number; currency: string; items: { item_id: string; price: number }[] }
    assert.equal(bc.value, TOOL_PRICE_PAISE.structopro / 100); assert.equal(bc.currency, 'INR'); assert.equal(bc.items[0].item_id, 'structopro'); assert.equal(bc.items[0].price, TOOL_PRICE_PAISE.structopro / 100)
    checkout.paymentVerified('order_A1')
    const p = calls.filter(c => c[1] === 'purchase').pop()![2] as { transaction_id: string; value: number; currency: string }
    assert.equal(p.transaction_id, 'order_A1'); assert.equal(p.value, TOOL_PRICE_PAISE.structopro / 100); assert.equal(p.currency, 'INR')
    const px = fb.filter(c => c[1] === 'Purchase').pop()!
    assert.equal((px[3] as { eventID: string }).eventID, 'order_A1')
  })

  ok('purchase fires once per order, however often the success path runs', () => {
    const before = calls.filter(c => c[1] === 'purchase').length
    checkout.paymentVerified('order_A1'); checkout.paymentVerified('order_A1')
    assert.equal(calls.filter(c => c[1] === 'purchase').length, before)
    checkout.orderCreated({ orderId: 'order_B2', amount: PACK_PRICE_PAISE, product: 'completepack' })
    checkout.paymentVerified('order_B2')
    assert.equal(calls.filter(c => c[1] === 'purchase').length, before + 1)
    const p = calls.filter(c => c[1] === 'purchase').pop()![2] as { value: number }
    assert.equal(p.value, PACK_PRICE_PAISE / 100)
  })

  ok('a reload does not send the same purchase again (remembered in the browser)', () => {
    // a fresh page would have an empty in-page guard; the stored list still blocks it
    const key = 'purchase:order_A1'
    assert.ok(String(store.get(cfg.ONCE_STORAGE_KEY)).includes(key))
  })

  ok('unknown or free products report nothing', () => {
    const before = calls.length
    checkout.orderCreated({ orderId: 'order_C3', amount: TOOL_PRICE_PAISE.grandtotal, product: 'vastupro' })
    checkout.orderCreated({ orderId: 'order_D4', amount: 0, product: 'plumbpro' })
    assert.equal(calls.length, before)
  })

  ok('the other events carry the right names and fields', () => {
    ev.trackLead('plumbpro', 'email')
    ev.trackCalculatorUsed('brick-calculator')
    ev.trackSampleReportDownload('structurepro-sample')
    ev.trackWhatsAppClick('footer')
    ev.trackRatesEntered('plumbpro', 4, 18250)
    const names = eventNames()
    for (const e of ['generate_lead', 'calculator_used', 'sample_report_download', 'whatsapp_click', 'rates_entered']) assert.ok(names.includes(e), e)
    const r = calls.filter(c => c[1] === 'rates_entered').pop()![2] as { currency: string; value: number }
    assert.equal(r.currency, 'INR'); assert.equal(r.value, 18250)
    assert.ok(fb.some(c => c[1] === 'Lead'))
    // calculator, sample, whatsapp and rates events are GA4-only
    for (const e of ['calculator_used', 'sample_report_download', 'whatsapp_click', 'rates_entered']) assert.ok(!fb.some(c => c[1] === e), e)
  })

  // ── declined ──────────────────────────────────────────────────────────────
  ok('decline: queued events are dropped and later events are not sent', () => {
    consent.writeConsent('denied')
    ev.dropQueuedEvents()
    const before = calls.length
    ev.trackLead('plumbpro'); ev.trackViewItem(itemFor('plumbpro')!)
    assert.equal(calls.length, before)
    assert.deepEqual(attr.getAttribution(), {}) // declined: no tags sent with an order
  })

  ok('preview hosts never send', () => {
    consent.writeConsent('granted')
    ;(win.location as { hostname: string }).hostname = 'nirmanshastra-abc.vercel.app'
    const before = calls.length
    ev.trackLead('plumbpro')
    assert.equal(calls.length, before)
  })

  console.log(`\n${n} analytics checks passed`)
}
main().catch(e => { console.error(e); process.exit(1) })
