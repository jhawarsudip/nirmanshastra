'use client'

import { CLARITY_PROJECT_ID, GA_MEASUREMENT_ID, META_PIXEL_ID } from './config'

/*
  The small set-up calls for GA4, the Meta Pixel and Clarity. The scripts themselves (gtag.js, fbevents.js and the
  Clarity tag) are added by <Script strategy="afterInteractive"> in components/analytics/Analytics.tsx, and only
  after the visitor accepts. The functions here only prepare the queues those scripts read when they arrive.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: any
    _fbq?: any
    clarity?: any
    __nsConsentDefault?: boolean
    __nsEvents?: { name: string; params: unknown; at: number }[]
    [key: `ga-disable-${string}`]: boolean | undefined
  }
}

let gaBooted = false
let pixelBooted = false
let clarityBooted = false
let maskObserver: MutationObserver | null = null

export function isGaBooted() { return gaBooted }
export function isPixelBooted() { return pixelBooted }

function ensureGtag(): (...args: unknown[]) => void {
  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    // Google's own stub: it must push the `arguments` object, not an array
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
  }
  return window.gtag
}

/**
 * GA4 Consent Mode: analytics_storage and ad_storage start as denied on every page.
 * This only prepares the queue. gtag.js is not requested until the visitor accepts.
 */
export function initConsentDefaults(): void {
  if (window.__nsConsentDefault) return
  const gtag = ensureGtag()
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  window.__nsConsentDefault = true
}

export function isDebug(): boolean {
  try { return window.sessionStorage.getItem('ns_debug') === '1' } catch { return false }
}

/** ?ns_debug=1 turns on GA4 DebugView for this browser tab, and ?ns_debug=0 turns it off */
export function readDebugFlag(): void {
  try {
    const v = new URLSearchParams(window.location.search).get('ns_debug')
    if (v === '1') window.sessionStorage.setItem('ns_debug', '1')
    if (v === '0') window.sessionStorage.removeItem('ns_debug')
  } catch { /* ignore */ }
}

/** After Accept: tell Google the visitor agreed, then start the GA4 queue. */
export function bootGa(): void {
  if (gaBooted || !GA_MEASUREMENT_ID) return
  initConsentDefaults()
  const gtag = ensureGtag()
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = false
  gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'granted' })
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID, isDebug() ? { debug_mode: true } : {})
  gaBooted = true
}

/** After Accept, and only when a Pixel ID is set. Returns false when there is no Pixel to load. */
export function bootPixel(): boolean {
  if (!META_PIXEL_ID) return false
  if (pixelBooted) return true
  if (!window.fbq) {
    // Meta's own stub: calls wait in fbq.queue until fbevents.js arrives
    const n: any = (window.fbq = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args)
      else n.queue.push(args)
    })
    if (!window._fbq) window._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
  }
  window.fbq('init', META_PIXEL_ID)
  window.fbq('track', 'PageView')
  pixelBooted = true
  return true
}

/** The Pixel does not follow single-page navigation by itself */
export function pixelPageView(): void {
  if (pixelBooted && window.fbq) window.fbq('track', 'PageView')
}

/** Every input, textarea and select is marked so Clarity never records what is typed into it. */
function startInputMasking(): void {
  if (maskObserver) return
  const SEL = 'input, textarea, select, [contenteditable="true"]'
  const mark = (el: Element) => el.setAttribute('data-clarity-mask', 'True')
  const markWithin = (root: ParentNode) => root.querySelectorAll(SEL).forEach(mark)
  markWithin(document)
  maskObserver = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return
        const el = n as Element
        if (el.matches(SEL)) mark(el)
        markWithin(el)
      })
    }
  })
  maskObserver.observe(document.documentElement, { childList: true, subtree: true })
}

/** After Accept. Inputs are masked before the Clarity tag is requested. */
export function bootClarity(): void {
  if (clarityBooted || !CLARITY_PROJECT_ID) return
  startInputMasking()
  if (!window.clarity) {
    window.clarity = function (...args: unknown[]) {
      ;(window.clarity.q = window.clarity.q || []).push(args)
    }
  }
  window.clarity('consentv2', { ad_Storage: 'granted', analytics_Storage: 'granted' })
  clarityBooted = true
}

/** Withdrawal: tell each service, remove the cookies they set on this site, and let the page reload without them */
export function revokeAll(): void {
  try {
    if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
    if (GA_MEASUREMENT_ID) window[`ga-disable-${GA_MEASUREMENT_ID}`] = true
    if (window.fbq) window.fbq('consent', 'revoke')
    if (window.clarity) window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' })
  } catch { /* ignore */ }
  const names = ['_ga', '_gid', '_gat', '_fbp', '_fbc', '_clck', '_clsk', 'CLID', 'ANONCHK', 'MR', 'MUID', 'SM']
  const all = document.cookie.split(';').map(c => c.split('=')[0].trim())
  for (const n of all) {
    if (names.includes(n) || n.startsWith('_ga_')) {
      const host = window.location.hostname
      const parts = host.split('.')
      const domains = [host, '.' + host, parts.length > 2 ? '.' + parts.slice(-2).join('.') : '']
      for (const d of domains) document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ''}`
    }
  }
}
