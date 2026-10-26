import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { PRICE } from '@/lib/tool-pricing'
import { rozha, mukta } from '@/lib/v2/fonts'
import { NS2_INIT } from '@/lib/v2/init'
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

// Home page metadata per locale. English inherits the root layout's title and
// description; Hindi gets its own. Both declare the hreflang pair (en-IN <-> hi-IN
// plus x-default) so search and AI engines can match the two versions.
const HI_TITLE = 'NirmanShastra — IS कोड से घर की सामग्री की मात्रा का हिसाब'
const HI_DESCRIPTION =
  `अपने घर के लिए कंक्रीट, स्टील, सीमेंट, ईंट, रेत, तार और पाइप की मात्रा IS कोड के अनुसार निकालें, ऑर्डर देने से पहले। ${PRICE.from} से शुरू होने वाली मात्रा रिपोर्ट और मुफ़्त कैलकुलेटर, हिंदी और अंग्रेज़ी में।`

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
          alt: 'NirmanShastra — IS कोड पर आधारित सामग्री की मात्रा का हिसाब',
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
        className={`${rozha.variable} ${mukta.variable}`}
      >
        {children}
      </div>
    </NextIntlClientProvider>
  )
}
