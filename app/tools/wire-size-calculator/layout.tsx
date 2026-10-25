import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { toolJsonLd } from '@/lib/seo/schema'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Wire Size Calculator: least copper wire for each circuit'
const description =
  'Free wire size calculator for a home. Pick the circuit, or enter the load for the supply from the meter, to get the least copper wire in mm², the breaker, the cable set and the conduit. Sizes from the CPWD specification and the BIS draft IS 4648. No sign-in.'
const url = '/tools/wire-size-calculator'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Wire Size Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

export default function WireSizeCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/wire-size-calculator')} />
      {children}
    </InnerShell>
  )
}
