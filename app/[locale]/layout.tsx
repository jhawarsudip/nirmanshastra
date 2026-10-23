import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Big_Shoulders, Instrument_Sans, Hind } from 'next/font/google'
import '@/styles/v2/base.css'
import '@/styles/v2/chrome.css'
import '@/styles/v2/sections.css'
import '@/styles/v2/labs.css'

// v2 fonts load only for the homepage routes (this layout wraps / and /hi only).
// Google renamed 'Big Shoulders Display' to the variable 'Big Shoulders'; the opsz axis gives the Display cut at large sizes.
const bigShoulders = Big_Shoulders({ subsets: ['latin'], axes: ['opsz'], variable: '--font-bsd', display: 'swap' })
const instrumentSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-isans', display: 'swap' })
// Hind is static; keep it off the English page's preload list (the browser fetches it on demand via unicode-range).
const hind = Hind({ subsets: ['devanagari', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-hind', display: 'swap', preload: false })

// Runs before first paint: theme (day/night), Calm, and the once-per-session plumb-line load.
const NS2_INIT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('ns2-theme');if(!t){t='light'}d.setAttribute('data-ns-theme',t);var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;var c=localStorage.getItem('ns2-calm');if(c==='1'||(c===null&&rm)){d.setAttribute('data-calm','1')}if(rm||c==='1'||sessionStorage.getItem('ns2-plumb')){d.setAttribute('data-plumb','skip')}else{sessionStorage.setItem('ns2-plumb','1')}}catch(e){}})();`

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

// Home page metadata per locale. English inherits the root layout's title and
// description; Hindi gets its own. Both declare the hreflang pair (en-IN <-> hi-IN
// plus x-default) so search and AI engines can match the two versions.
const HI_TITLE = 'NirmanShastra — IS कोड से घर की निर्माण लागत और सामग्री का अनुमान'
const HI_DESCRIPTION =
  'अपने घर के लिए IS कोड के अनुसार सामग्री की मात्रा और निर्माण लागत (BOQ) निकालें, और पैसे देने से पहले ठेकेदार का कोटेशन जाँचें। 10 मुफ़्त कैलकुलेटर और ₹499 से शुरू होने वाली BOQ रिपोर्ट, हिंदी और अंग्रेज़ी में।'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const languages = { 'en-IN': '/', 'hi-IN': '/hi', 'x-default': '/' }

  if (locale !== 'hi') {
    return { alternates: { canonical: '/', languages } }
  }

  return {
    // absolute: do not let the root template append the brand a second time
    title: { absolute: HI_TITLE },
    description: HI_DESCRIPTION,
    alternates: { canonical: '/hi', languages },
    openGraph: {
      type: 'website',
      locale: 'hi_IN',
      alternateLocale: ['en_IN'],
      siteName: 'NirmanShastra',
      url: '/hi',
      title: HI_TITLE,
      description: HI_DESCRIPTION,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'NirmanShastra — IS कोड पर आधारित निर्माण लागत का अनुमान',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: HI_TITLE,
      description: HI_DESCRIPTION,
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <script dangerouslySetInnerHTML={{ __html: NS2_INIT }} />
      {/* Wrapper applies Devanagari font stack automatically for Hindi locale.
          <html lang> is fixed to "en" in the root layout (it sits above the locale
          segment), so the Hindi page declares its language on this wrapper. */}
      <div
        lang={locale === 'hi' ? 'hi' : undefined}
        className={`${bigShoulders.variable} ${instrumentSans.variable} ${hind.variable}`}
      >
        {children}
      </div>
    </NextIntlClientProvider>
  )
}
