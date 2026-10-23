import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { toolJsonLd } from '@/lib/seo/schema'

// The root layout's title template appends " | NirmanShastra", so the brand is
// not repeated in `title`. Before this file existed the page inherited the home
// page's title and description (a duplicate).
const title = "Compare a Contractor's Quote with IS-Code Rates"
const description =
  "Upload your contractor's quote and see which line items are above IS-code quantities and typical rates. Free."
const url = '/compare-quote'

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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: "NirmanShastra — compare a contractor's quote with IS-code rates",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | NirmanShastra`,
    description,
  },
}

export default function CompareQuoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={toolJsonLd('/compare-quote')} />
      {children}
    </>
  )
}
