import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import ToolInfo from '@/components/v2/inner/ToolInfo'
import { toolJsonLd } from '@/lib/seo/schema'
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

// Hindi title and description for this page. Left empty until the Hindi copy is written; the page then keeps its English text.
const HI: HiMeta = {}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/plumbpro', HI)
}

export default async function PlumbProLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={toolJsonLd('/tools/plumbpro')} />
      {children}
      <ToolInfo path="/tools/plumbpro" />
    </InnerShell>
  )
}
