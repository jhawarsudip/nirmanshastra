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

const title = 'PlumbingPro: Plumbing Quantity Calculator | IS 1172, IS 1742, IS 2470'
const description = `Work out the pipe lengths, tank sizes, pump, drains, septic tank and every fitting to buy for your home, to the Indian Standards. Exact quantities; add your own rates for rupees. ${PRICE.plumbpro} per report.`
const url = '/tools/plumbpro'

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
  title: 'PlumbingPro: प्लंबिंग की मात्रा का कैलकुलेटर | IS 1172, IS 1742, IS 2470',
  description: `अपने घर के लिए पाइप की लंबाई, टंकी का साइज़, पंप, नालियाँ, सेप्टिक टैंक और ख़रीदने की हर फ़िटिंग निकालिए, भारतीय मानकों के अनुसार। सटीक मात्राएँ; रुपये के लिए अपने रेट डालिए। प्रति रिपोर्ट ${PRICE.plumbpro}।`,
  imageAlt: 'NirmanShastra: भारत में IS-कोड के अनुसार निर्माण की मात्राएँ',
}

const HI_APP_SUMMARY = 'प्लंबिंग की मात्रा की रिपोर्ट: साइज़ के हिसाब से पाइप की लंबाई, फ़िटिंग, टंकी के साइज़, पंप का साइज़ और फ़िक्सचर की गिनती, IS 1172:1993 के अनुसार।'

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/plumbpro', HI)
}

export default async function PlumbProLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={withHindiFaq(localizeToolLd(toolJsonLd('/tools/plumbpro'), locale, HI_APP_SUMMARY), '/tools/plumbpro', locale)} />
      {children}
      <ToolInfo path="/tools/plumbpro" />
    </InnerShell>
  )
}
