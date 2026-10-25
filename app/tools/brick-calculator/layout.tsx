import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { toolJsonLd } from '@/lib/seo/schema'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Brick Calculator: bricks and mortar for a wall'
const description =
  'Free brick calculator. Pick the brick (red 230 × 115 × 75 mm, modular 190 × 90 × 90 mm or 230 × 110 × 70 mm), the wall thickness and the openings to get the brick count, the order with breakage, and the joint mortar. IS 1077:1992 and IS 2212:1991. No sign-in.'
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
    title: `${title} | NirmanShastra`,
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Brick Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

export default function BrickCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/brick-calculator')} />
      {children}
    </InnerShell>
  )
}
