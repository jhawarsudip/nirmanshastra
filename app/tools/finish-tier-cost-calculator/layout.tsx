import type { Metadata } from 'next'

const title = 'Finish-Tier Cost Difference Calculator — Basic vs Standard vs Premium vs Luxury'
const description =
  'Free finish-tier cost calculator for Indian homes. Enter built-up area and pick any two quality tiers (Basic / Standard / Premium / Luxury) to see the per-element and total cost difference — structure, flooring, doors & windows, electrical, plumbing, painting, false ceiling & joinery, plus kitchen per running foot. It shows why the structural frame barely moves between tiers while finishes multiply. Indicative Tier-2 city rates ported from NirmanShastra’s Residential Construction Cost Estimator. Permanently free, no login.'
const url = '/tools/finish-tier-cost-calculator'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url,
    title: 'Finish-Tier Cost Difference Calculator — Basic vs Standard vs Premium vs Luxury',
    description:
      'Pick two finish tiers and a built-up area to see the per-element and total cost difference. Structure barely moves between tiers; finishes multiply. Indicative Tier-2 city rates, free, no login.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra — Finish-Tier Cost Difference Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Finish-Tier Cost Difference Calculator — Basic · Standard · Premium · Luxury',
    description:
      'Area in, tier A vs tier B out: per-element and total cost delta across structure, flooring, doors, electrical, plumbing, painting, joinery and kitchen. Free, no login.',
    images: ['/og-image.png'],
  },
}

export default function FinishTierCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
