import type { Metadata } from 'next'

const title = 'Concrete Mix Ratio Calculator — Cement, Sand & Aggregate | IS 456:2000'
const description =
  'Free concrete mix ratio calculator. Enter the concrete volume and grade (M20 = 1:1.5:3, M25 = 1:1:2) to get cement bags, sand, and aggregate in cft and m³ — using the locked IS 456:2000 per-cubic-metre quantities. M30 and above are flagged as design mixes per IS 456. Permanently free, no login.'
const url = '/tools/concrete-mix-ratio-calculator'

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
        alt: 'NirmanShastra — Concrete Mix Ratio Calculator (IS 456:2000)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function ConcreteMixRatioCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
