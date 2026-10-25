import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { toolJsonLd } from '@/lib/seo/schema'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Concrete Mix Calculator: cement, sand and aggregate'
const description =
  'Free concrete mix calculator. Enter the volume, the grade (M10 to M40) and the site exposure to get the bags of cement, the sand and the coarse aggregate. M20 and below use the CPWD nominal mixes; M25 and above are an IS 10262 working within IS 456 Table 5. No sign-in.'
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
    title: `${title} | NirmanShastra`,
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Concrete Mix Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

export default function ConcreteMixRatioCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/concrete-mix-ratio-calculator')} />
      {children}
    </InnerShell>
  )
}
