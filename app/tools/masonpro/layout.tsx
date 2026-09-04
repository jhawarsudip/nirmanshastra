import type { Metadata } from 'next'

const title = "MasonryPro — Brickwork & Masonry Cost Calculator | IS 1077:1992"
const description = "Calculate exact brick counts, mortar quantities, and plastering costs for 8 wall types. IS 1077:1992 verified. Get itemised masonry BOQ for your home."
const url = '/tools/masonpro'

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

export default function MasonryProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
