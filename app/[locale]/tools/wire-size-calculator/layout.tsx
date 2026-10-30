import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { calcJsonLd } from '@/lib/i18n/labels/calc-jsonld'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Wire Size Calculator: least copper wire for each circuit'
const description =
  'Free wire size calculator for a home. Pick the circuit, or enter the load for the supply from the meter, to get the least copper wire in mm², the breaker, the cable set and the conduit. Sizes from the CPWD specification and the BIS draft IS 4648. No sign-in.'
const url = '/tools/wire-size-calculator'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Wire Size Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name, IS numbers and units stay in Latin letters.
const HI: HiMeta = {
  title: 'वायर साइज़ कैलकुलेटर: हर सर्किट के लिए सबसे कम तांबे का तार',
  description:
    'घर के लिए निःशुल्क वायर साइज़ कैलकुलेटर। सर्किट चुनिए, या मीटर से आने वाली सप्लाई के लिए लोड डालिए, और तांबे का सबसे कम तार mm² में, ब्रेकर, केबल सेट और कंड्यूट पाइए। साइज़ CPWD विनिर्देश और BIS के मसौदे IS 4648 से। बिना साइन-इन।',
  imageAlt: 'NirmanShastra वायर साइज़ कैलकुलेटर',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/wire-size-calculator', HI)
}

export default async function WireSizeCalculatorLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={calcJsonLd('/tools/wire-size-calculator', locale)} />
      {children}
    </InnerShell>
  )
}
