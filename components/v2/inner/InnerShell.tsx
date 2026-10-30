import { NextIntlClientProvider } from 'next-intl'
import en from '@/messages/en.json'
import hi from '@/messages/hi.json'
import type { Locale } from '@/lib/i18n/paths'
import { rozha, mukta } from '@/lib/v2/fonts'
import { NS2_INIT } from '@/lib/v2/init'
import { HatchDefs } from '../Icons'
import Header from '../Header'
import Footer from '../sections/Footer'
import '@/styles/v2/base.css'
import '@/styles/v2/chrome.css'
import '@/styles/v2/sections.css'
import '@/styles/v2/inner.css'

/**
 * The v2 frame for every inner page (tool wizards, reports, articles).
 * Header and footer are the homepage ones, so the whole site reads as one place.
 * Server component: the footer's translations are handed over as a small slice, not the whole message file.
 * The page's own content goes in as children and renders inside <main>.
 *
 * `locale` is the language of the page being rendered. Every layout under app/[locale] passes its own;
 * only the root 404 (outside the language prefix) leaves it out and gets English.
 */
export default function InnerShell({ children, locale = 'en' }: { children: React.ReactNode; locale?: Locale }) {
  const messages = locale === 'hi' ? hi : en
  return (
    <NextIntlClientProvider locale={locale} messages={{ footer: messages.footer }}>
      <script dangerouslySetInnerHTML={{ __html: NS2_INIT }} />
      <div className={`ns2 ns-inner ${rozha.variable} ${mukta.variable}`}>
        <HatchDefs />
        <Header locale={locale} />
        <div className="ns-cutwipe" aria-hidden="true" />
        <main id="main" className="ns-i">
          {children}
        </main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  )
}
