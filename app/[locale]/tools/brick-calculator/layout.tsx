import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { calcJsonLd } from '@/lib/i18n/labels/calc-jsonld'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Brick Calculator: bricks and mortar for a wall'
const description =
  'Free brick calculator. Pick the brick (red 230 × 115 × 75 mm, modular 190 × 90 × 90 mm or 230 × 110 × 70 mm), the wall thickness and the openings to get the brick count, the order with breakage, and the joint mortar. IS 1077:1992 and IS 2212:1991. No sign-in.'
const url = '/tools/brick-calculator'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Brick Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name, IS numbers and units stay in Latin letters.
const HI: HiMeta = {
  title: 'ईंट कैलकुलेटर: दीवार की ईंटें और मसाला',
  description:
    'निःशुल्क ईंट कैलकुलेटर। ईंट (लाल 230 × 115 × 75 mm, मॉड्यूलर 190 × 90 × 90 mm या 230 × 110 × 70 mm), दीवार की मोटाई और खुले हिस्से चुनिए, और ईंटों की गिनती, टूट-फूट के साथ मँगवाने की संख्या और जोड़ का मसाला पाइए। IS 1077:1992 और IS 2212:1991। बिना साइन-इन।',
  imageAlt: 'NirmanShastra ईंट कैलकुलेटर',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/brick-calculator', HI)
}

export default async function BrickCalculatorLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={calcJsonLd('/tools/brick-calculator', locale)} />
      {children}
    </InnerShell>
  )
}
