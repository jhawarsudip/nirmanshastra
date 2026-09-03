import type { Metadata } from 'next'

const title = "StructurePro — RCC Structure Cost Calculator | IS 456:2000"
const description = "Calculate exact concrete, steel, and structural costs for your building using IS 456:2000. Get itemised BOQ with material quantities."
const url = '/tools/structopro'

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
}

export default function StructoProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
