import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { rozha, mukta } from '@/lib/v2/fonts'
import { NS2_INIT } from '@/lib/v2/init'
import HtmlLang from '@/components/i18n/HtmlLang'
import '@/styles/v2/base.css'
import '@/styles/v2/chrome.css'
import '@/styles/v2/sections.css'
import '@/styles/v2/labs.css'
import '@/styles/v2/calc.css'
import '@/styles/v2/plain.css'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  // Tell next-intl the language of this request up front: without it every page below would be
  // rendered per request (reading headers) instead of being built once per language.
  setRequestLocale(locale)
  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider messages={messages}>
      <script dangerouslySetInnerHTML={{ __html: NS2_INIT }} />
      {locale === 'hi' ? <script dangerouslySetInnerHTML={{ __html: "document.documentElement.lang='hi'" }} /> : null}
      <HtmlLang locale={locale} />
      {/* Wrapper applies Devanagari font stack automatically for Hindi locale.
          <html lang> starts as "en" in the root layout (it sits above the locale
          segment); HtmlLang and the inline script above bring it to "hi", and this wrapper
          declares the language for the content itself. */}
      <div
        lang={locale === 'hi' ? 'hi' : undefined}
        className={`${rozha.variable} ${mukta.variable}`}
      >
        {children}
      </div>
    </NextIntlClientProvider>
  )
}
