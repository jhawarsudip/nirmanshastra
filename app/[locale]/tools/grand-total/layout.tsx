import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import ToolInfo from '@/components/v2/inner/ToolInfo'
import { toolJsonLd } from '@/lib/seo/schema'
import { PRICE } from '@/lib/tool-pricing'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

const title = 'Grand Total: One Buying List for Your Whole House | Frame, Walls, Wiring, Plumbing, Finishing'
const description = `Add your paid StructurePro, MasonryPro, ElectricalPro, PlumbingPro and InteriorPro reports into one list of what to buy, with cement, sand and stone added across phases and nothing counted twice. Exact quantities; add your own rates for rupees. ${PRICE.grandtotal}.`
const url = '/tools/grand-total'

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
  return localizeMetadata(metadata, asLocale(locale), '/tools/grand-total', HI)
}

export default async function GrandTotalLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={toolJsonLd('/tools/grand-total')} />
      {children}
      <ToolInfo path="/tools/grand-total" />
    </InnerShell>
  )
}
