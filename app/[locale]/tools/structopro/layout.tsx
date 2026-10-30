
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import ToolInfo from '@/components/v2/inner/ToolInfo'
import { toolJsonLd } from '@/lib/seo/schema'
import { PRICE } from '@/lib/tool-pricing'
import { withHindiFaq } from '@/lib/i18n/labels/calc-jsonld'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

const title = 'StructurePro: Concrete, Steel and Cement Quantity Calculator for RCC Houses | IS 456, IS 1893'
const description = `Work out the concrete, steel, cement, sand, aggregate and shuttering for your RCC frame from a few plain answers, to IS 456, IS 875 and IS 1893. Exact quantities; add your own rates for rupees. ${PRICE.structopro} per report.`
const url = '/tools/structopro'

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

// Hindi title, description and share-image text for this page.
const HI: HiMeta = {
  title: 'StructurePro: RCC घर के लिए कंक्रीट, स्टील और सीमेंट की मात्रा का कैलकुलेटर | IS 456, IS 1893',
  description: `कुछ सीधे सवालों के जवाब से अपने RCC ढाँचे का कंक्रीट, स्टील, सीमेंट, रेत, गिट्टी और शटरिंग निकालिए, IS 456, IS 875 और IS 1893 के अनुसार। सटीक मात्राएँ; रुपये के लिए अपने रेट डालिए। प्रति रिपोर्ट ${PRICE.structopro}।`,
  imageAlt: 'NirmanShastra: भारत में IS-कोड के अनुसार निर्माण की मात्राएँ',
}

const HI_APP_SUMMARY =
  'RCC ढाँचे की मात्रा की रिपोर्ट: फुटिंग, कॉलम, बीम, स्लैब और सीढ़ी के लिए कंक्रीट, स्टील (सरिये के व्यास के हिसाब से), सीमेंट, रेत, गिट्टी और शटरिंग, कुछ सीधे सवालों के जवाब से IS 456, IS 875, IS 1893 और IS 13920 के अनुसार निकाली गई।'

/** The structured data of this page, with the names in Hindi on /hi (the builders in lib/seo are English only). */
function jsonLdFor(locale: string) {
  const data = toolJsonLd('/tools/structopro')
  if (locale !== 'hi') return data
  return data.map(node => {
    if (node['@type'] === 'BreadcrumbList' && Array.isArray(node.itemListElement)) {
      return { ...node, itemListElement: node.itemListElement.map((it: { name?: string }) => (it.name === 'Home' ? { ...it, name: 'होम' } : it)) }
    }
    if (node['@type'] === 'SoftwareApplication') return { ...node, description: HI_APP_SUMMARY, inLanguage: 'hi-IN' }
    return node
  })
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/structopro', HI)
}

export default async function StructoProLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={withHindiFaq(jsonLdFor(locale), '/tools/structopro', locale)} />
      {children}
      {/* The explainer sits full-width under the wizard, so it is placed after <main>'s content by the shell's own wrapper */}
      <ToolInfo path="/tools/structopro" />
    </InnerShell>
  )
}
