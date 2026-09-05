import type { Metadata } from 'next'

const title =
  'Construction Cost Estimator Excel Template — India BOQ & Bid Calculator | IS-Code Rate Analysis'
const description =
  'A 16-sheet Excel construction cost estimator for Indian homes — build a BOQ from IS-code rate analysis, generate a client quotation, compare up to 3 contractor quotes line by line, and track budget vs actual. ₹2,499, instant download.'
const url = '/site-templates/cost-estimator'

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
        alt: 'NirmanShastra — Construction Cost Estimator Excel Template (India Edition)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function CostEstimatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
