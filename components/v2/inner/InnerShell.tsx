import { NextIntlClientProvider } from 'next-intl'
import messages from '@/messages/en.json'
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
 * The v2 frame for every inner page (tool wizards, reports).
 * Header and footer are the homepage ones, so the whole site reads as one place.
 * Server component: the footer's translations are handed over as a small slice, not the whole message file.
 * The wizard's own content goes in as children and renders inside <main>.
 */
export default function InnerShell({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={{ footer: messages.footer }}>
      <script dangerouslySetInnerHTML={{ __html: NS2_INIT }} />
      <div className={`ns2 ns-inner ${rozha.variable} ${mukta.variable}`}>
        <HatchDefs />
        <Header locale="en" />
        <div className="ns-cutwipe" aria-hidden="true" />
        <main id="main" className="ns-i">
          {children}
        </main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  )
}
