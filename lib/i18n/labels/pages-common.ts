/*
  Hindi pieces that several of the main content pages share (About, FAQ, Glossary, IS Codes Used, Careers, Contact,
  Account, Sign-in, Reports): the breadcrumb names for the structured data, a date writer, and the two short lines
  about the review of the calculations that lib/seo/site.ts holds in English only.

  Hindi house style: see docs/NirmanShastra_Hindi_Guide.md. Nothing here is shown on an English page.
*/
import type { Locale } from '@/lib/i18n/paths'
import { localizePath } from '@/lib/i18n/paths'

export const HOME_HI = 'होम'

/** Breadcrumb for the structured data: "होम" then this page, both with their /hi addresses. */
export function crumbs(locale: Locale, nameEn: string, nameHi: string, path: string): { name: string; path: string }[] {
  return locale === 'hi'
    ? [{ name: HOME_HI, path: localizePath('/', 'hi') }, { name: nameHi, path: localizePath(path, 'hi') }]
    : [{ name: 'Home', path: '/' }, { name: nameEn, path }]
}

export const MONTHS_HI = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'] as const

/** "25 अक्टूबर 2026" from a calendar date (no time zone shift: the date is read as written). */
export function dateHi(y: number, m: number, d: number): string {
  return `${d} ${MONTHS_HI[m - 1]} ${y}`
}

/** "2026-10-25" -> "25 अक्टूबर 2026". */
export function isoDateHi(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return dateHi(y, m, d)
}

/** The Hindi of REVIEW_NOTE (lib/seo/site.ts): same two claims, nothing added. */
export const REVIEW_NOTE_HI =
  'एक सिविल इंजीनियर (B.Tech सिविल, NIT) द्वारा लिखा गया। बजट और मात्रा की जाँच के लिए; स्ट्रक्चरल डिज़ाइन के लिए फिर भी लाइसेंस प्राप्त इंजीनियर चाहिए।'

/** The Hindi of REVIEW_FACT (lib/seo/site.ts). */
export const REVIEW_FACT_HI = 'गणनाओं की किसी स्ट्रक्चरल इंजीनियर से स्वतंत्र समीक्षा नहीं हुई है।'
