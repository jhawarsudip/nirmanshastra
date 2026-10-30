import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { calcJsonLd } from '@/lib/i18n/labels/calc-jsonld'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Concrete Cube Test Calculator: samples and cubes for a pour'
const description =
  'Free concrete cube test calculator. Enter the volume of one grade of concrete to get the least number of samples IS 456:2000 clause 15.2.2 asks for, and the cubes to cast: three a sample, tested at 28 days. Counts "or part thereof" above 50 m³. No sign-in.'
const url = '/tools/concrete-cube-test-calculator'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Concrete Cube Test Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name, IS numbers and units stay in Latin letters.
const HI: HiMeta = {
  title: 'कंक्रीट क्यूब टेस्ट कैलकुलेटर: एक ढलाई के लिए सैंपल और क्यूब',
  description:
    'निःशुल्क कंक्रीट क्यूब टेस्ट कैलकुलेटर। एक ग्रेड के कंक्रीट की मात्रा डालिए और IS 456:2000 के क्लॉज़ 15.2.2 के अनुसार कम से कम सैंपल और ढालने के क्यूब पाइए: हर सैंपल के तीन, 28 दिन पर जाँचे जाते हैं। 50 m³ से ऊपर "या उसका हिस्सा" भी गिना जाता है। बिना साइन-इन।',
  imageAlt: 'NirmanShastra कंक्रीट क्यूब टेस्ट कैलकुलेटर',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/concrete-cube-test-calculator', HI)
}

export default async function ConcreteCubeTestCalculatorLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={calcJsonLd('/tools/concrete-cube-test-calculator', locale)} />
      {children}
    </InnerShell>
  )
}
