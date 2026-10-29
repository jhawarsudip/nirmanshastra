'use client'

import { META_PIXEL_ID, ONCE_STORAGE_KEY, analyticsAllowedOnHost } from './config'
import { currentConsent } from './consent'
import { isDebug, isGaBooted, isPixelBooted } from './vendors'
import type { TrackItem } from './items'

/*
  Every tracked event goes through sendEvent.
    - Declined: nothing is sent and nothing is kept.
    - Not answered yet: the event waits in memory (this page only) and is sent if the visitor accepts, dropped if they decline.
    - Accepted: sent to GA4 and, where the table says so, to the Meta Pixel.
  Money events carry value and currency "INR".

  GA4 event              Pixel event        When
  generate_lead          Lead               an email address is given in any tool
  view_item              ViewContent        a paid tool page opens
  begin_checkout         InitiateCheckout   the pay button is pressed (the order is created)
  purchase               Purchase           payment verified by the server, once per order
  calculator_used        -                  a free calculator produces a result
  sample_report_download -                  the sample PDF is downloaded
  rates_entered          -                  a customer enters their own local rates
*/

type Params = Record<string, unknown>

interface Outgoing {
  ga: { name: string; params: Params }
  pixel?: { name: string; params?: Params; eventId?: string }
  /** an order id or similar: the event is sent once per key, ever, in this browser */
  once?: string
}

const queue: Outgoing[] = []
const QUEUE_MAX = 30

function seen(key: string): boolean {
  try {
    const list = JSON.parse(window.localStorage.getItem(ONCE_STORAGE_KEY) || '[]') as string[]
    return list.includes(key)
  } catch { return false }
}
function remember(key: string) {
  try {
    const list = JSON.parse(window.localStorage.getItem(ONCE_STORAGE_KEY) || '[]') as string[]
    list.push(key)
    window.localStorage.setItem(ONCE_STORAGE_KEY, JSON.stringify(list.slice(-60)))
  } catch { /* storage blocked: the in-page guard below still stops a double send */ }
}
const sentThisPage = new Set<string>()

function deliver(ev: Outgoing) {
  if (ev.once) {
    if (sentThisPage.has(ev.once) || seen(ev.once)) return
    sentThisPage.add(ev.once)
    remember(ev.once)
  }
  try {
    window.gtag?.('event', ev.ga.name, ev.ga.params)
    if (ev.pixel && META_PIXEL_ID && window.fbq) {
      if (ev.pixel.eventId) window.fbq('track', ev.pixel.name, ev.pixel.params ?? {}, { eventID: ev.pixel.eventId })
      else window.fbq('track', ev.pixel.name, ev.pixel.params ?? {})
    }
    if (isDebug()) {
      window.__nsEvents = window.__nsEvents || []
      window.__nsEvents.push({ name: ev.ga.name, params: ev.ga.params, at: Date.now() })
      console.info('[analytics]', ev.ga.name, ev.ga.params, ev.pixel ? `pixel:${ev.pixel.name}` : '')
    }
  } catch { /* analytics must never break the page */ }
}

function sendEvent(ev: Outgoing) {
  if (typeof window === 'undefined') return
  if (!analyticsAllowedOnHost(window.location.hostname)) return
  const consent = currentConsent()
  if (consent === 'denied') return
  if (consent === null || !isGaBooted()) {
    // not answered yet, or accepted a moment ago and the set-up has not run: hold it
    if (queue.length < QUEUE_MAX) queue.push(ev)
    return
  }
  deliver(ev)
}

/** Sent after the visitor accepts and GA4 / the Pixel are set up */
export function flushQueuedEvents() {
  if (!isGaBooted()) return
  // Pixel events wait for the Pixel stub as well when a Pixel ID is set
  if (META_PIXEL_ID && !isPixelBooted()) return
  const pending = queue.splice(0, queue.length)
  for (const ev of pending) deliver(ev)
}

/** Declined: forget whatever was waiting */
export function dropQueuedEvents() {
  queue.length = 0
}

const INR = 'INR'
const itemParams = (item: TrackItem) => ({
  content_ids: [item.item_id],
  content_name: item.item_name,
  content_type: 'product',
  contents: [{ id: item.item_id, quantity: item.quantity, item_price: item.price }],
})

/** An email address was given. `source` is the tool or form it was given in. */
export function trackLead(source: string, method: 'email' = 'email') {
  sendEvent({
    ga: { name: 'generate_lead', params: { lead_source: source, method } },
    pixel: { name: 'Lead', params: { content_name: source } },
  })
}

/** A paid tool page opened */
export function trackViewItem(item: TrackItem) {
  sendEvent({
    ga: { name: 'view_item', params: { currency: INR, value: item.price, items: [item] } },
    pixel: { name: 'ViewContent', params: { value: item.price, currency: INR, ...itemParams(item) } },
  })
}

/** The pay button was pressed and the order exists. `value` is the amount the server will charge. */
export function trackBeginCheckout(item: TrackItem, value: number) {
  sendEvent({
    ga: { name: 'begin_checkout', params: { currency: INR, value, items: [item] } },
    pixel: { name: 'InitiateCheckout', params: { value, currency: INR, num_items: 1, ...itemParams(item) } },
  })
}

/** The server confirmed the payment. Sent once per order id, however often the success path runs. */
export function trackPurchase(orderId: string, item: TrackItem, value: number) {
  if (!orderId) return
  sendEvent({
    ga: { name: 'purchase', params: { transaction_id: orderId, currency: INR, value, items: [item] } },
    pixel: { name: 'Purchase', params: { value, currency: INR, num_items: 1, ...itemParams(item) }, eventId: orderId },
    once: `purchase:${orderId}`,
  })
}

/** A free calculator produced a result */
export function trackCalculatorUsed(calculator: string) {
  sendEvent({ ga: { name: 'calculator_used', params: { calculator_name: calculator } } })
}

/** The sample report PDF was opened or downloaded */
export function trackSampleReportDownload(report: string) {
  sendEvent({ ga: { name: 'sample_report_download', params: { report } } })
}

/** A customer entered their own local rates. `value` is the material cost total in rupees, when there is one. */
export function trackRatesEntered(report: string, fieldsFilled: number, value?: number) {
  sendEvent({
    ga: {
      name: 'rates_entered',
      params: { report, fields_filled: fieldsFilled, ...(typeof value === 'number' && value > 0 ? { currency: INR, value } : {}) },
    },
  })
}
