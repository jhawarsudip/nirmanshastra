import type { Metadata } from 'next'

const title = 'Concrete Cube Test Calculator — Samples & Cubes Required | IS 456:2000'
const description =
  'Free concrete cube test calculator. Enter the volume of concrete in a pour and get the minimum number of acceptance samples and total cubes to cast, per IS 456:2000 Cl 15.2.2: 1–5 m³ = 1 sample, 6–15 = 2, 16–30 = 3, 31–50 = 4, and 51 m³+ = 4 plus one more per further 50 m³. Each sample is 6 cubes (3 tested at 7 days, 3 at 28 days per IS 516), and at least one sample must come from every work shift. Permanently free, no login.'
const url = '/tools/concrete-cube-test-calculator'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url,
    title: 'Concrete Cube Test Calculator — Samples & Cubes by Volume',
    description:
      'Enter concrete volume, get the IS 456:2000 Cl 15.2.2 minimum samples and total cubes to cast (6 per sample: 3 at 7 days, 3 at 28 days per IS 516). Free, no login.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra — Concrete Cube Test Calculator (IS 456:2000 Cl 15.2.2)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Concrete Cube Test Calculator — Samples & Cubes | IS 456:2000',
    description:
      'Volume in, sampling out: IS 456:2000 Cl 15.2.2 samples and total cubes (6 per sample, 7-day + 28-day breaks per IS 516). Free, no login.',
    images: ['/og-image.png'],
  },
}

export default function ConcreteCubeTestCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
