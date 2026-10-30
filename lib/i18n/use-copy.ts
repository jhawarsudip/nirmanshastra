'use client'

import { useLocale } from 'next-intl'
import { pickLocale, type Copy } from './copy'

/** Client-side counterpart of `COPY[locale]`: the copy for the language the visitor is reading. */
export function useCopy<T>(copy: Copy<T>): T {
  return pickLocale(copy, useLocale())
}
