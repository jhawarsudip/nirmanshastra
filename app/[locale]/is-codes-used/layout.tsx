import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { CODES_BY_TOOL, sourceCounts } from '@/lib/is-codes-data'
import { breadcrumbSchema, isCodesItemList } from '@/lib/seo/schema'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const n = sourceCounts()
const title = 'IS Codes Used: The Indian Standards Behind Every Quantity'
const description = `The ${n.total} sources behind the NirmanShastra quantity models, from IS 456, IS 1786, IS 1893 and IS 13920 for the frame to the codes for walls, wiring, plumbing and finishes. Each entry says what we take from it and where a standard could not be read in full.`
const url = '/is-codes-used'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra: the Indian Standards behind every quantity' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title and description for this page. Left empty until the Hindi copy is written; the page then keeps its English text.
const HI: HiMeta = {}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/is-codes-used', HI)
}

export default async function IsCodesLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={[breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'IS Codes Used', path: url }]), isCodesItemList(CODES_BY_TOOL)]} />
      {children}
    </InnerShell>
  )
}
