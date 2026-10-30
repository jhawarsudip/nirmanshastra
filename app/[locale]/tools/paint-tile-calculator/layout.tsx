import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { calcJsonLd } from '@/lib/i18n/labels/calc-jsonld'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Paint and Tile Calculator: paint, putty, tiles and grout'
const description =
  'Free paint and tile calculator. Enter the area and the finish to get the paint, putty and primer, or the tiles, boxes, grout and fixing to buy, with a wastage allowance and the three paint systems or five tile sizes side by side. Factors from CPWD and the makers’ sheets. No sign-in.'
const url = '/tools/paint-tile-calculator'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Paint and Tile Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name, IS numbers and units stay in Latin letters.
const HI: HiMeta = {
  title: 'पेंट और टाइल कैलकुलेटर: पेंट, पुट्टी, टाइलें और ग्राउट',
  description:
    'निःशुल्क पेंट और टाइल कैलकुलेटर। एरिया और फ़िनिश डालिए और ख़रीदने के लिए पेंट, पुट्टी और प्राइमर, या टाइलें, बॉक्स, ग्राउट और फ़िक्सिंग पाइए, टूट-फूट की छूट के साथ और तीन पेंट सिस्टम या पाँच टाइल साइज़ साथ-साथ। फ़ैक्टर CPWD और निर्माताओं की शीट से। बिना साइन-इन।',
  imageAlt: 'NirmanShastra पेंट और टाइल कैलकुलेटर',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/paint-tile-calculator', HI)
}

export default async function PaintTileCalculatorLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={calcJsonLd('/tools/paint-tile-calculator', locale)} />
      {children}
    </InnerShell>
  )
}
