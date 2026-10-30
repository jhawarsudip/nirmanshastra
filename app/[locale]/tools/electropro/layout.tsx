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

const title = 'ElectricalPro: Wiring Quantity Calculator for Homes | Points, Wire, Conduit, DB | IS 4648, IS 732:2019'
const description = `Count the light, fan and socket points, wire by size and colour, conduit, distribution boards, MCBs and earthing for your home, room by room. Exact quantities; add your own rates for rupees. ${PRICE.electropro} per report.`
const url = '/tools/electropro'

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
  title: 'ElectricalPro: घरों की वायरिंग की मात्रा का कैलकुलेटर | पॉइंट, तार, कंड्यूट, DB | IS 4648, IS 732:2019',
  description: `अपने घर के लिए कमरा-दर-कमरा लाइट, पंखे और सॉकेट के पॉइंट, साइज़ और रंग के हिसाब से तार, कंड्यूट, डिस्ट्रिब्यूशन बोर्ड, MCB और अर्थिंग गिनिए। सटीक मात्राएँ; रुपये के लिए अपने रेट डालिए। प्रति रिपोर्ट ${PRICE.electropro}।`,
  imageAlt: 'NirmanShastra: भारत में IS-कोड के अनुसार निर्माण की मात्राएँ',
}

const HI_APP_SUMMARY = 'घर की वायरिंग के लिए पॉइंट, सर्किट, बोर्ड, साइज़ और रंग के हिसाब से तार, कंड्यूट और फ़िटिंग, CPWD की स्पेसिफ़िकेशन और IS 4648 के BIS ड्राफ़्ट से।'

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/electropro', HI)
}

export default async function ElectroProLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={localizeToolLd(toolJsonLd('/tools/electropro'), locale, HI_APP_SUMMARY)} />
      {children}
      <ToolInfo path="/tools/electropro" />
    </InnerShell>
  )
}
