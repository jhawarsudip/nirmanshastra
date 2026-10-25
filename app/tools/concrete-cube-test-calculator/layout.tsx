import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { toolJsonLd } from '@/lib/seo/schema'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Concrete Cube Test Calculator: samples and cubes for a pour'
const description =
  'Free concrete cube test calculator. Enter the volume of one grade of concrete to get the least number of samples IS 456:2000 clause 15.2.2 asks for, and the cubes to cast: three a sample, tested at 28 days. Counts "or part thereof" above 50 m³. No sign-in.'
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
    title: `${title} | NirmanShastra`,
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Concrete Cube Test Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

export default function ConcreteCubeTestCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/concrete-cube-test-calculator')} />
      {children}
    </InnerShell>
  )
}
