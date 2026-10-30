import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { calcJsonLd } from '@/lib/i18n/labels/calc-jsonld'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'RA Bill Calculator: retention, GST and TDS net payable'
const description =
  'Free RA bill calculator for a works contract. Enter the gross running bill to see the retention held back, the GST added, the TDS deducted, any advance recovered and the net payable. TDS is worked on the value without GST. No sign-in.'
const url = '/tools/ra-bill-retention-tds-calculator'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra RA Bill Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name, IS numbers and units stay in Latin letters.
const HI: HiMeta = {
  title: 'आरए बिल कैलकुलेटर: रिटेंशन, GST और TDS के बाद नेट देय',
  description:
    'वर्क्स कॉन्ट्रैक्ट के लिए निःशुल्क आरए बिल कैलकुलेटर। ग्रॉस रनिंग बिल डालिए और रोकी गई रिटेंशन, जुड़ा GST, कटा TDS, वापस ली गई एडवांस और नेट देय रक़म देखिए। TDS GST के बिना की रक़म पर निकाला जाता है। बिना साइन-इन।',
  imageAlt: 'NirmanShastra आरए बिल कैलकुलेटर',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/ra-bill-retention-tds-calculator', HI)
}

export default async function RABillCalculatorLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={calcJsonLd('/tools/ra-bill-retention-tds-calculator', locale)} />
      {children}
    </InnerShell>
  )
}
