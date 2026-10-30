import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { calcJsonLd } from '@/lib/i18n/labels/calc-jsonld'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Water Tank Size Calculator: underground and overhead tanks'
const description =
  'Free water tank size calculator. Enter the number of people and where the water comes from (piped, borewell or tanker) to get the day’s water use and the underground and overhead tank sizes, rounded up to ready-made sizes. IS 1172:1993 and the NBC Part 9 storage split. No sign-in.'
const url = '/tools/water-tank-size-calculator'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Water Tank Size Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name, IS numbers and units stay in Latin letters.
const HI: HiMeta = {
  title: 'वॉटर टैंक साइज़ कैलकुलेटर: अंडरग्राउंड और ओवरहेड टंकी',
  description:
    'निःशुल्क वॉटर टैंक साइज़ कैलकुलेटर। लोगों की गिनती और पानी कहाँ से आता है (पाइप से, बोरवेल या टैंकर) डालिए और दिन की पानी की खपत व अंडरग्राउंड तथा ओवरहेड टंकी के साइज़ पाइए, बाज़ार में मिलने वाले साइज़ तक ऊपर गोल करके। IS 1172:1993 और NBC भाग 9 का स्टोरेज बँटवारा। बिना साइन-इन।',
  imageAlt: 'NirmanShastra वॉटर टैंक साइज़ कैलकुलेटर',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/water-tank-size-calculator', HI)
}

export default async function WaterTankSizeCalculatorLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={calcJsonLd('/tools/water-tank-size-calculator', locale)} />
      {children}
    </InnerShell>
  )
}
