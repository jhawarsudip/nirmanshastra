import type { Metadata } from 'next'

const title = 'Water Tank Size Calculator — Free Storage Sizing Tool | IS 1172:1993'
const description =
  'Free water tank size calculator. Enter occupants, water source, and days of storage to get daily demand, required storage, and the nearest standard tank size — using the IS 1172:1993 per-capita demand (135 / 150 LPCD) and 2/3-day storage rule. Permanently free, no login.'
const url = '/tools/water-tank-size-calculator'

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
        alt: 'NirmanShastra — Water Tank Size Calculator (IS 1172:1993)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function WaterTankSizeCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
