'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import type { Dict } from './tr'
import { trQty } from './qty-tr'
import type { TradeSlug } from '@/lib/qty/meta'
import { QTY_COMMON } from './labels/qty-common'
import { QTY_ERRORS } from './labels/qty-errors'
import { QTY_SUMMARY } from './labels/qty-summary'

/*
  Hindi for the words the SERVER sends to the trade tools' pages (item names, table headings, notes, warnings, errors).
  `const t = useQtyTr('masonpro')` then `t(row.item)`; English pages return the string untouched and load nothing.

  The shared dictionary (units, groups, the rupee panel, error messages) is always there. Each tool's own dictionary is large
  and only a Hindi visitor of that tool needs it, so it is fetched as a separate chunk the first time a Hindi page asks for it
  (the wizard asks as soon as it opens, long before the results screen). Until it arrives a string simply shows in English.
  'all' loads the four (the Grand Total adds every trade together); 'none' is the shared dictionary only.
*/

const LOAD: Record<TradeSlug, () => Promise<Dict>> = {
  masonpro: () => import('./labels/qty-masonry').then(m => m.QTY_MASONRY),
  electropro: () => import('./labels/qty-electrical').then(m => m.QTY_ELECTRICAL),
  plumbpro: () => import('./labels/qty-plumbing').then(m => m.QTY_PLUMBING),
  interiorpro: () => import('./labels/qty-interior').then(m => m.QTY_INTERIOR),
}
/** A bare numeric range ("154 to 251") has no words to look up; only the joining word changes. */
const RANGE = /^([\d.,]+) to ([\d.,]+)$/

const ALL: TradeSlug[] = ['masonpro', 'electropro', 'plumbpro', 'interiorpro']

const loaded = new Map<TradeSlug, Dict>()
/** One merged dictionary per combination, so lookups try every exact entry before any pattern. */
const merged = new Map<string, Dict>()

function dictFor(slugs: TradeSlug[]): Dict {
  const have = slugs.filter(s => loaded.has(s))
  const key = have.join('+')
  const known = merged.get(key)
  if (known) return known
  const made: Dict = Object.assign({}, QTY_SUMMARY, QTY_ERRORS, QTY_COMMON, ...have.map(s => loaded.get(s)!))
  merged.set(key, made)
  return made
}

export function useQtyTr(which: TradeSlug | 'all' | 'none') {
  const locale = useLocale()
  const [version, setVersion] = useState(0)
  const slugs = which === 'all' ? ALL : which === 'none' ? [] : [which]

  useEffect(() => {
    if (locale !== 'hi') return
    const need = (which === 'all' ? ALL : which === 'none' ? [] : [which]).filter(s => !loaded.has(s))
    if (need.length === 0) return
    let live = true
    Promise.all(need.map(s => LOAD[s]().then(d => { loaded.set(s, d) }))).then(() => { if (live) setVersion(v => v + 1) }).catch(() => {})
    return () => { live = false }
  }, [locale, which])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((s: string) => {
    if (locale !== 'hi' || !s) return s
    const r = RANGE.exec(s)
    return r ? `${r[1]} से ${r[2]}` : trQty(s, dictFor(slugs))
  }, [locale, which, version])
}
