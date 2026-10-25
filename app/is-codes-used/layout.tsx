import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { CODES_BY_TOOL, sourceCounts } from '@/lib/is-codes-data'
import { breadcrumbSchema, isCodesItemList } from '@/lib/seo/schema'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const n = sourceCounts()
const title = 'IS Codes Used: The Indian Standards Behind Every Quantity'
const description = `The ${n.total} sources behind the NirmanShastra quantity models, from IS 456, IS 1786, IS 1893 and IS 13920 for the frame to the codes for walls, wiring, plumbing and finishes. Each entry says what we take from it and where a standard could not be read in full.`
const url = '/is-codes-used'

export const metadata: Metadata = {
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

export default function IsCodesLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={[breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'IS Codes Used', path: url }]), isCodesItemList(CODES_BY_TOOL)]} />
      {children}
    </InnerShell>
  )
}
