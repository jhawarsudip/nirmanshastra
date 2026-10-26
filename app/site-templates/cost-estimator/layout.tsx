import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { templateJsonLd } from '@/lib/seo/schema'

const title =
  'Construction Cost Estimator Excel Template'
const description =
  'An Excel construction cost estimator for contractors. Price a house from IS-code quantities using your own rates, make a client quotation, and compare up to 3 quotes. ₹2,499, instant download.'
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
  return (
    <>
      <JsonLd data={templateJsonLd('/site-templates/cost-estimator')} />
      {children}
    </>
  )
}
