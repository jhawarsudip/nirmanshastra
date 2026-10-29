'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CLARITY_PROJECT_ID, GA_MEASUREMENT_ID, META_PIXEL_ID, analyticsAllowedOnHost } from '@/lib/analytics/config'
import { useConsent } from '@/lib/analytics/consent'
import { captureAttribution, flushAttribution } from '@/lib/analytics/attribution'
import { bootClarity, bootGa, bootPixel, initConsentDefaults, pixelPageView, readDebugFlag, revokeAll } from '@/lib/analytics/vendors'
import { dropQueuedEvents, flushQueuedEvents, trackSampleReportDownload } from '@/lib/analytics/events'
import ConsentBanner from './ConsentBanner'


/*
  The one place analytics is switched on. It renders the consent banner, and renders the GA4, Meta Pixel and Clarity
  scripts only when the visitor has accepted. Until then no request goes to Google, Meta or Microsoft.
  Mounted once, in app/layout.tsx.
*/
export default function Analytics() {
  const consent = useConsent()
  const pathname = usePathname()
  const [allowed, setAllowed] = useState(false)
  const everGranted = useRef(false)
  const firstPath = useRef(true)

  // once in the browser: preview hosts opt out, ?ns_debug=1 for GA4 DebugView, and the campaign tags of this visit
  useEffect(() => {
    setAllowed(analyticsAllowedOnHost(window.location.hostname))
    readDebugFlag()
    captureAttribution()
  }, [])

  // GA4 Consent Mode: everything starts denied on every page, whatever the visitor later chooses
  useEffect(() => { if (allowed) initConsentDefaults() }, [allowed])

  // follow the visitor's choice
  useEffect(() => {
    if (!allowed || consent === undefined) return
    if (consent === 'granted') {
      everGranted.current = true
      flushAttribution()
      bootGa()
      bootPixel()
      bootClarity() // masks every input first, then the Clarity tag is requested by the <Script> below
      flushQueuedEvents()
    } else if (consent === 'denied') {
      dropQueuedEvents()
      if (everGranted.current) {
        // withdrawn after the scripts were loaded: tell them, clear their cookies and reload without them
        revokeAll()
        window.location.reload()
      }
    }
  }, [consent, allowed])

  // the Meta Pixel does not follow single-page navigation by itself
  useEffect(() => {
    if (firstPath.current) { firstPath.current = false; return }
    if (consent === 'granted') pixelPageView()
  }, [pathname, consent])

  // the sample report link is tracked wherever it is on the site
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as Element | null)?.closest?.('a, [data-ns-event]') as HTMLElement | null
      if (!el) return
      const where = el.closest('[data-ns-where]')?.getAttribute('data-ns-where') || 'page'
      const named = el.getAttribute('data-ns-event')
      if (named === 'sample_report_download') { trackSampleReportDownload(el.getAttribute('data-ns-label') || 'sample'); return }
      if (!(el instanceof HTMLAnchorElement)) return
      try {
        const url = new URL(el.href, window.location.href)
        if (url.origin === window.location.origin && /\/samples?[-/].*\.pdf$/i.test(url.pathname)) trackSampleReportDownload(url.pathname.split('/').pop() || 'sample')
      } catch { /* a malformed href is not ours to track */ }
    }
    document.addEventListener('click', onClick, true)
    document.addEventListener('auxclick', onClick, true) // middle-click opens in a new tab too
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('auxclick', onClick, true)
    }
  }, [])

  return (
    <>
      {allowed && <ConsentBanner />}
      {allowed && consent === 'granted' && (
        <>
          {GA_MEASUREMENT_ID && (
            <Script id="ns-gtag" src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`} strategy="afterInteractive" />
          )}
          {META_PIXEL_ID && (
            <Script id="ns-fbevents" src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />
          )}
          {CLARITY_PROJECT_ID && (
            <Script id="ns-clarity" src={`https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_PROJECT_ID)}`} strategy="afterInteractive" />
          )}
        </>
      )}
    </>
  )
}
