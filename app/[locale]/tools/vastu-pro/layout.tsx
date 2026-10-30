import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { vastuJsonLd } from '@/lib/i18n/labels/vastu-jsonld'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'VastuPro: free Vastu check of your home plan'
const description =
  'Free Vastu reading of a home plan: draw the outline of your house, set North, mark the doors and rooms, and see how the old texts and today’s teachers read each one, with where every rule comes from. Traditional guidance, not an IS code.'
const url = '/tools/vastu-pro'

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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra VastuPro: a free Vastu check of your home plan',
      },
    ],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name and IS-code mention stay in Latin letters.
const HI: HiMeta = {
  title: 'VastuPro: अपने घर के नक्शे की निःशुल्क वास्तु जाँच',
  description:
    'घर के नक्शे की निःशुल्क वास्तु रीडिंग: अपने घर की आउटलाइन बनाइए, उत्तर तय कीजिए, दरवाज़े और कमरे चिह्नित कीजिए, और देखिए कि पुराने ग्रंथ और आज के वास्तु शिक्षक हर एक को कैसे पढ़ते हैं, हर नियम कहाँ से आता है यह बताते हुए। पारंपरिक मार्गदर्शन, IS कोड नहीं।',
  imageAlt: 'NirmanShastra VastuPro: आपके घर के नक्शे की निःशुल्क वास्तु जाँच',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/vastu-pro', HI)
}

export default async function VastuProLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={vastuJsonLd(locale)} />
      {children}
    </InnerShell>
  )
}
