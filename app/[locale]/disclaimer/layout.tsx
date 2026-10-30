import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import { crumbs } from '@/lib/i18n/labels/pages-common'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Disclaimer: Quantities, Not a Structural Design'
const description =
  'NirmanShastra works out material quantities from a few answers. It is not a structural engineering service and sets no prices of its own. Read this before relying on a report.'
const url = '/disclaimer'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra: material quantities for Indian homes' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name stays in Latin letters.
const HI: HiMeta = {
  title: 'अस्वीकरण: मात्राएँ हैं, स्ट्रक्चरल डिज़ाइन नहीं',
  description: 'NirmanShastra कुछ जवाबों से सामग्री की मात्राएँ निकालता है। यह स्ट्रक्चरल इंजीनियरिंग सेवा नहीं है और अपनी ओर से कोई दाम तय नहीं करता। किसी रिपोर्ट पर भरोसा करने से पहले इसे पढ़िए।',
  imageAlt: 'NirmanShastra: भारतीय घरों के लिए सामग्री की मात्राएँ',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/disclaimer', HI)
}

export default async function DisclaimerLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={[breadcrumbSchema(crumbs(asLocale(locale), 'Disclaimer', 'अस्वीकरण', url))]} />
      {children}
    </InnerShell>
  )
}
