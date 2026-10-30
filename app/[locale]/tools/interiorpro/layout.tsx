import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import ToolInfo from '@/components/v2/inner/ToolInfo'
import { toolJsonLd } from '@/lib/seo/schema'
import { localizeToolLd } from '@/lib/qty/meta'
import { PRICE } from '@/lib/tool-pricing'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

const title = 'InteriorPro: Finishing Quantity Calculator for Homes | Paint, Tiles, Doors, False Ceiling | IS 1200, IS 15622'
const description = `Count the paint, putty and primer, floor and wall tiles, doors and windows, false ceiling and plywood for your home, area by area. Exact quantities; add your own rates for rupees. ${PRICE.interiorpro} per report.`
const url = '/tools/interiorpro'

const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url,
    title,
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra: India’s IS-code construction quantities' }],
  },
  twitter: { card: 'summary_large_image', title, description },
}

// Hindi title, description and share-image text. The brand and tool names, IS numbers and units stay in Latin letters.
const HI: HiMeta = {
  title: 'InteriorPro: घरों की फ़िनिशिंग की मात्रा का कैलकुलेटर | पेंट, टाइल, दरवाज़े, फ़ॉल्स सीलिंग | IS 1200, IS 15622',
  description: `अपने घर के लिए हिस्से-दर-हिस्से पेंट, पुट्टी और प्राइमर, फ़र्श और दीवार की टाइल, दरवाज़े-खिड़कियाँ, फ़ॉल्स सीलिंग और प्लाईवुड गिनिए। सटीक मात्राएँ; रुपये के लिए अपने रेट डालिए। प्रति रिपोर्ट ${PRICE.interiorpro}।`,
  imageAlt: 'NirmanShastra: भारत में IS-कोड के अनुसार निर्माण की मात्राएँ',
}

const HI_APP_SUMMARY = 'इंटीरियर की मात्रा की रिपोर्ट: कमरा-दर-कमरा फ़र्श, पेंट, फ़ॉल्स सीलिंग और रसोई की मात्राएँ, बर्बादी समेत।'

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/interiorpro', HI)
}

export default async function InteriorProLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={localizeToolLd(toolJsonLd('/tools/interiorpro'), locale, HI_APP_SUMMARY)} />
      {children}
      <ToolInfo path="/tools/interiorpro" />
    </InnerShell>
  )
}
