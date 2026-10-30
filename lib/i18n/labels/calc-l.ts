'use client'

import { useLocale } from 'next-intl'

/**
 * For the free calculator pages: `const { hi, L } = useL()` then `L('English text', 'हिंदी पाठ')`.
 * The English and the Hindi sit side by side, so the two cannot drift. English pages never see the Hindi
 * (it is only chosen when the page language is Hindi). Numbers are formatted by the page itself, with Latin digits.
 */
export function useL() {
  const hi = useLocale() === 'hi'
  return { hi, L: (en: string, h: string) => (hi ? h : en) }
}
