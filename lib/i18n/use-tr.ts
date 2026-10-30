'use client'

import { useCallback } from 'react'
import { useLocale } from 'next-intl'
import { tr, type Dict } from './tr'

/**
 * `const t = useTr(DICT_A, DICT_B)` then `t('Cement (OPC 43)')`: the Hindi for a server-sent English label,
 * or the label itself when the page is English or the dictionaries have no entry. See lib/i18n/tr.ts.
 */
export function useTr(...dicts: Dict[]) {
  const locale = useLocale()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((s: string) => tr(locale, s, ...dicts), [locale, ...dicts])
}
