import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import PaidToolInfo from '@/components/seo/PaidToolInfo'
import { toolJsonLd } from '@/lib/seo/schema'

const title = "Grand Total Report — Complete Construction Cost Summary"
const description = "Merge all 5 construction phases into one Grand Total report. Complete BOQ covering RCC structure, masonry, electrical, plumbing, and interior. ₹999 or free with all 5 paid tools."
const url = '/tools/grand-total'

export const metadata: Metadata = {
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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra — India\u2019s IS-Code Construction Cost Estimator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function GrandTotalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={toolJsonLd('/tools/grand-total')} />
      {children}
      <PaidToolInfo path="/tools/grand-total" />
    </>
  )
}
