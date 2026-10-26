'use client'

import { ATTRIBUTION_STORAGE_KEY, ATTRIBUTION_WINDOW_DAYS, UTM_REQUIRES_CONSENT } from './config'
import { readConsent } from './consent'

/*
  Which reel, ad or link brought a visitor. First visit wins: the tags from the first tagged visit are kept
  for ATTRIBUTION_WINDOW_DAYS and travel with the order (see /api/payments/create-order).
*/

export interface Attribution {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

const KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const

interface Stored extends Attribution { at: string }

// Held in memory until the visitor accepts, so a tagged first page is not lost while the banner is still open.
let pending: Attribution | null = null

function clean(v: string | null): string | undefined {
  if (!v) return undefined
  const s = v.trim().replace(/[\u0000-\u001f<>]/g, '').slice(0, 80)
  return s || undefined
}

function fromUrl(): Attribution | null {
  try {
    const q = new URLSearchParams(window.location.search)
    const out: Attribution = {}
    for (const k of KEYS) { const v = clean(q.get(k)); if (v) out[k] = v }
    return Object.keys(out).length ? out : null
  } catch { return null }
}

function readStored(): Stored | null {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Stored
    const ageDays = (Date.now() - Date.parse(s.at)) / 86_400_000
    if (!(ageDays >= 0 && ageDays <= ATTRIBUTION_WINDOW_DAYS)) return null
    return s
  } catch { return null }
}

function mayStore(): boolean {
  return !UTM_REQUIRES_CONSENT || readConsent() === 'granted'
}

function store(a: Attribution) {
  try {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify({ ...a, at: new Date().toISOString() } satisfies Stored))
  } catch { /* storage blocked: the tags stay in memory for this visit */ }
}

/** Call on every page load. Keeps the first tagged visit. */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return
  const found = fromUrl()
  if (found && !readStored()) {
    if (mayStore()) store(found)
    else pending = found
  }
  flushAttribution()
}

/** Called after the visitor accepts: moves tags held in memory into storage */
export function flushAttribution(): void {
  if (typeof window === 'undefined' || !pending || !mayStore()) return
  if (!readStored()) store(pending)
  pending = null
}

/** The tags to send with an order. Empty when the visitor declined (unless UTM_REQUIRES_CONSENT is false). */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {}
  const s = mayStore() ? readStored() : null
  const src = s ?? (mayStore() ? pending : null)
  if (!src) return {}
  const out: Attribution = {}
  for (const k of KEYS) if (src[k]) out[k] = src[k]
  return out
}
