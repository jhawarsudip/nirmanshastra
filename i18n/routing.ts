import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'hi'] as const,
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeDetection: false,
  // The language is the address (/hi/...), never a remembered setting, so no language cookie is set.
  localeCookie: false,
  // Pairing of English and Hindi pages is declared per page in its metadata (lib/i18n/meta.ts), only for pages
  // that really have Hindi text; the automatic Link header would claim a Hindi twin for every page.
  alternateLinks: false,
})

export type Locale = (typeof routing.locales)[number]
