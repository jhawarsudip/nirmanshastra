import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

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
      {/* Wrapper applies Devanagari font stack automatically for Hindi locale.
          <html lang> is fixed to "en" in the root layout (it sits above the locale
          segment), so the Hindi page declares its language on this wrapper. */}
      <div
        lang={locale === 'hi' ? 'hi' : undefined}
        className={locale === 'hi' ? 'devanagari-locale' : undefined}
      >
        {children}
      </div>
    </NextIntlClientProvider>
  )
}
