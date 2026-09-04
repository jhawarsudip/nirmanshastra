import type { Metadata } from 'next'

const title = 'RA Bill Calculator — Retention, GST & TDS Net Payable | Works Contract'
const description =
  'Free RA bill calculator for Indian works contracts. Enter the gross running-account bill value and get retention held back, GST added, TDS deducted, mobilisation-advance recovery and the final net payable. Net Payable = Gross − Retention − Advance Recovery + GST − TDS. Defaults: 5% retention, 18% GST, 1% TDS (editable) — TDS on the value excluding GST per Section 393(1), Table Sl. No. 6(i) of the Income-tax Act 2025. Ported from NirmanShastra’s Billing & Measurement product. Permanently free, no login.'
const url = '/tools/ra-bill-retention-tds-calculator'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url,
    title: 'RA Bill Calculator — Retention, GST & TDS Net Payable',
    description:
      'Enter a running-account bill value and see retention, GST, TDS, advance recovery and the final net payable. Net Payable = Gross − Retention − Advance Recovery + GST − TDS. Free, no login.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra — RA Bill Retention, GST & TDS Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RA Bill Calculator — Retention, GST & TDS Net Payable',
    description:
      'Gross bill in, net payable out: 5% retention, 18% GST, 1% TDS by default (all editable), plus mobilisation-advance recovery. Works-contract billing, free and no login.',
    images: ['/og-image.png'],
  },
}

export default function RABillCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
