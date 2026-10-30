import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { calcJsonLd } from '@/lib/i18n/labels/calc-jsonld'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Bar Bending Calculator: cutting length and weight of a bar'
const description =
  'Free bar bending calculator. Choose the shape (straight, L, U, crank, stirrup, square tie), the bar size and the lengths to get the length to cut and the weight, with bends taken off, 135° hooks added and the length rounded up to 25 mm. IS 2502, IS 1786 and IS 13920. No sign-in.'
const url = '/tools/bar-bending-schedule-calculator'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Bar Bending Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name, IS numbers and units stay in Latin letters.
const HI: HiMeta = {
  title: 'बार बेंडिंग कैलकुलेटर: बार की कटिंग लेंथ और वज़न',
  description:
    'निःशुल्क बार बेंडिंग कैलकुलेटर। आकार (सीधा, L, U, क्रैंक, स्टिरप, चौकोर टाई), बार का साइज़ और लंबाइयाँ चुनिए, और काटने की लंबाई व वज़न पाइए: बेंड घटाकर, 135° के हुक जोड़कर और लंबाई 25 mm तक ऊपर गोल करके। IS 2502, IS 1786 और IS 13920। बिना साइन-इन।',
  imageAlt: 'NirmanShastra बार बेंडिंग कैलकुलेटर',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/bar-bending-schedule-calculator', HI)
}

export default async function BarBendingScheduleCalculatorLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={calcJsonLd('/tools/bar-bending-schedule-calculator', locale)} />
      {children}
    </InnerShell>
  )
}
