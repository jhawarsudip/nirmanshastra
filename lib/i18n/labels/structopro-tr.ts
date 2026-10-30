'use client'

import { useCallback } from 'react'
import { useLocale } from 'next-intl'
import { structTr } from './structopro-server'

/**
 * `const t = useStructTr()` then `t(row.item)`: the Hindi for a string that the StructurePro server sent
 * (report item names, notes, IS-code checks, warnings, errors), or the string itself on an English page or when
 * the dictionary has no entry. The sentences are in structopro-server.ts; town and state names are made
 * Devanagari at the end (structopro-places.ts).
 */
export function useStructTr() {
  const locale = useLocale()
  return useCallback((s: string) => (locale === 'hi' ? structTr(s) : s), [locale])
}
