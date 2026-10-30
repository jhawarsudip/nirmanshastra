import type { Locale } from './paths'

/**
 * Two-language copy.
 *
 * Write the English object, then the Hindi object typed as the English one's shape, so a missing or
 * misspelled key is a compile error and the two languages can never drift apart:
 *
 *   const en = { title: 'Brick Calculator', note: 'No sign-in.' }
 *   const hi: typeof en = { title: 'ईंट कैलकुलेटर', note: 'साइन-इन की ज़रूरत नहीं।' }
 *   export const COPY = { en, hi }
 *
 * then `COPY[locale].title` on the server, or `useCopy(COPY).title` in a client component.
 *
 * Hindi house style (SJ, 30 Oct 2026): Devanagari, with everyday site words left as people say them
 * (cement, steel, slab, beam, column, footing, plinth, brick, sand, tile, paint...). Numbers stay in
 * Latin digits (1, 2, 3), money stays ₹, and IS-code names/numbers, formulas and units are untouched.
 */
export type Copy<T> = Record<Locale, T>

export function pickLocale<T>(copy: Copy<T>, locale: string): T {
  return locale === 'hi' ? copy.hi : copy.en
}
