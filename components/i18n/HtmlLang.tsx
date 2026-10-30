'use client'

import { useEffect } from 'react'

/**
 * `<html lang>` sits in the root layout, above the language segment, so it cannot know the page language without making
 * every page dynamic. The Hindi content already sits in a lang="hi" wrapper (app/[locale]/layout.tsx); this keeps the
 * <html> tag in step as well, on first load (the inline script next to it runs before paint) and when the visitor
 * switches language inside the app without a full page load.
 */
export default function HtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale === 'hi' ? 'hi' : 'en'
  }, [locale])
  return null
}
