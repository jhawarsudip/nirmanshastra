'use client'

import { useSyncExternalStore } from 'react'
import { CONSENT_STORAGE_KEY } from './config'

/*
  The visitor's analytics choice (India's DPDP Act: free, specific, informed, and as easy to refuse as to give).
  'granted' = GA4, Clarity and the Pixel may load. 'denied' = none of them load. null = not asked yet, or not answered.
  The choice is kept in this browser only. Nothing is sent to our server.
*/

export type Consent = 'granted' | 'denied' | null

const EVENT_CHANGE = 'ns:consent'
const EVENT_OPEN = 'ns:consent-open'

export function readConsent(): Consent {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as { analytics?: string }
    return v.analytics === 'granted' || v.analytics === 'denied' ? v.analytics : null
  } catch {
    return null
  }
}

export function writeConsent(choice: 'granted' | 'denied'): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ v: 1, analytics: choice, at: new Date().toISOString() }))
  } catch { /* private mode: the choice then lasts until the page reloads, which is the safe direction */ }
  memoryChoice = choice
  window.dispatchEvent(new Event(EVENT_CHANGE))
}

// Used when the browser will not let us write storage: the choice still holds for this page view.
let memoryChoice: Consent = null

/** The choice right now (storage first, then the in-memory fallback) */
export function currentConsent(): Consent {
  return readConsent() ?? memoryChoice
}

function subscribe(cb: () => void): () => void {
  window.addEventListener(EVENT_CHANGE, cb)
  window.addEventListener('storage', cb) // another tab changed it
  return () => {
    window.removeEventListener(EVENT_CHANGE, cb)
    window.removeEventListener('storage', cb)
  }
}

/** undefined while the page is still being prepared in the browser, so the banner never flashes for someone who already chose */
export function useConsent(): Consent | undefined {
  return useSyncExternalStore<Consent | undefined>(subscribe, currentConsent, () => undefined)
}

/** Ask for the choice again (the "Privacy choices" link in the footer) */
export function openConsentBanner(): void {
  window.dispatchEvent(new Event(EVENT_OPEN))
}

export function onOpenConsentBanner(cb: () => void): () => void {
  window.addEventListener(EVENT_OPEN, cb)
  return () => window.removeEventListener(EVENT_OPEN, cb)
}
