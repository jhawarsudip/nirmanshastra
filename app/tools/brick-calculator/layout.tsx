import type { Metadata } from 'next'

const title = 'Brick Calculator — Wall Brick Count & Wastage | IS 1077:1992'
const description =
  'Free brick calculator. Enter wall length, height, thickness (9-inch standard or 4.5-inch partition) and openings to get the wall area, brick count, and a +5–10% wastage allowance — using the IS 1077:1992 / IS 2212:1991 rates of 100 bricks/m² (9") and 50 bricks/m² (4.5") for the standard 190×90×90mm modular brick. Permanently free, no login.'
const url = '/tools/brick-calculator'

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
        alt: 'NirmanShastra — Brick Calculator (IS 1077:1992)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function BrickCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
