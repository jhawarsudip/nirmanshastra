import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { calcJsonLd } from '@/lib/i18n/labels/calc-jsonld'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Earned Value Calculator: SPI, CPI, EAC and TCPI'
const description =
  'Free earned value calculator for a construction project. Enter the budget, planned value, earned value and actual cost to date to get the schedule and cost variances, SPI, CPI, the forecast final cost (EAC), ETC, VAC and TCPI. No sign-in.'
const url = '/tools/earned-value-calculator'

const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url,
    title: `${title} | NirmanShastra`,
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Earned Value Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name, IS numbers and units stay in Latin letters.
const HI: HiMeta = {
  title: 'अर्नड वैल्यू कैलकुलेटर: SPI, CPI, EAC और TCPI',
  description:
    'निर्माण प्रोजेक्ट के लिए निःशुल्क अर्नड वैल्यू कैलकुलेटर। बजट, प्लान्ड वैल्यू, अर्नड वैल्यू और अब तक की असल लागत डालिए और शेड्यूल व लागत के वैरिएंस, SPI, CPI, अनुमानित अंतिम लागत (EAC), ETC, VAC और TCPI पाइए। बिना साइन-इन।',
  imageAlt: 'NirmanShastra अर्नड वैल्यू कैलकुलेटर',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/earned-value-calculator', HI)
}

export default async function EarnedValueCalculatorLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={calcJsonLd('/tools/earned-value-calculator', locale)} />
      {children}
    </InnerShell>
  )
}
