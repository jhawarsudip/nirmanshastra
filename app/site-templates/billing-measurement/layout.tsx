import type { Metadata } from 'next'

const title =
  'Construction Billing & Measurement Excel Template — IS 1200, CPWD, Section 393 | India Edition'
const description =
  'A 9-sheet Excel billing and measurement workbook for Indian construction — measurement book, IS 1200 deductions, abstract against BOQ, and RA bills with retention, TDS (Section 393) and GST, tracked to close. ₹1,499, instant download.'
const url = '/site-templates/billing-measurement'

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
        alt: 'NirmanShastra — Construction Billing & Measurement Excel Template (India Edition)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function BillingMeasurementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
