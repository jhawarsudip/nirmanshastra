import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import ToolInfo from '@/components/v2/inner/ToolInfo'
import { toolJsonLd } from '@/lib/seo/schema'
import { localizeToolLd } from '@/lib/qty/meta'
import { withHindiFaq } from '@/lib/i18n/labels/calc-jsonld'
import { PRICE } from '@/lib/tool-pricing'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

const title = 'MasonryPro: Brick, Block, Mortar and Plaster Quantity Calculator | IS 1200, IS 1077, IS 6041'
const description = `Work out the bricks or blocks, mortar, cement, sand, plaster and lintels for the walls of your home, measured from your rooms the IS 1200 way. Exact quantities; add your own rates for rupees. ${PRICE.masonpro} per report.`
const url = '/tools/masonpro'

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
  title: 'MasonryPro: ईंट, ब्लॉक, मसाला और प्लास्टर की मात्रा का कैलकुलेटर | IS 1200, IS 1077, IS 6041',
  description: `अपने घर की दीवारों के लिए ईंट या ब्लॉक, मसाला, सीमेंट, रेत, प्लास्टर और लिंटल की मात्रा निकालिए, आपके कमरों से IS 1200 के तरीक़े से नापकर। सटीक मात्राएँ; रुपये के लिए अपने रेट डालिए। प्रति रिपोर्ट ${PRICE.masonpro}।`,
  imageAlt: 'NirmanShastra: भारत में IS-कोड के अनुसार निर्माण की मात्राएँ',
}

const HI_APP_SUMMARY = 'चिनाई की मात्रा की रिपोर्ट: बाहरी और अंदर की दीवारों के लिए ईंट या ब्लॉक की गिनती, मसाले और प्लास्टर की मात्राएँ (सीमेंट और रेत), IS 1077 और IS 2212 के अनुसार।'

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/masonpro', HI)
}

export default async function MasonryProLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={withHindiFaq(localizeToolLd(toolJsonLd('/tools/masonpro'), locale, HI_APP_SUMMARY), '/tools/masonpro', locale)} />
      {children}
      <ToolInfo path="/tools/masonpro" />
    </InnerShell>
  )
}
