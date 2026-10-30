import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { calcJsonLd } from '@/lib/i18n/labels/calc-jsonld'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Concrete Mix Calculator: cement, sand and aggregate'
const description =
  'Free concrete mix calculator. Enter the volume, the grade (M10 to M40) and the site exposure to get the bags of cement, the sand and the coarse aggregate. M20 and below use the CPWD nominal mixes; M25 and above are an IS 10262 working within IS 456 Table 5. No sign-in.'
const url = '/tools/concrete-mix-ratio-calculator'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Concrete Mix Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name, IS numbers and units stay in Latin letters.
const HI: HiMeta = {
  title: 'कंक्रीट मिक्स कैलकुलेटर: सीमेंट, रेत और गिट्टी',
  description:
    'निःशुल्क कंक्रीट मिक्स कैलकुलेटर। मात्रा, ग्रेड (M10 से M40) और साइट का एक्सपोज़र डालिए और सीमेंट के बैग, रेत और मोटी गिट्टी पाइए। M20 और उससे नीचे CPWD के नॉमिनल मिक्स लेते हैं; M25 और उससे ऊपर IS 10262 के अनुसार निकाले गए मिक्स हैं, जो IS 456 की तालिका 5 के भीतर रहते हैं। बिना साइन-इन।',
  imageAlt: 'NirmanShastra कंक्रीट मिक्स कैलकुलेटर',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/concrete-mix-ratio-calculator', HI)
}

export default async function ConcreteMixRatioCalculatorLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={calcJsonLd('/tools/concrete-mix-ratio-calculator', locale)} />
      {children}
    </InnerShell>
  )
}
