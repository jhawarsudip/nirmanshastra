import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { toolJsonLd } from '@/lib/seo/schema'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Earned Value Calculator: SPI, CPI, EAC and TCPI'
const description =
  'Free earned value calculator for a construction project. Enter the budget, planned value, earned value and actual cost to date to get the schedule and cost variances, SPI, CPI, the forecast final cost (EAC), ETC, VAC and TCPI. No sign-in.'
const url = '/tools/earned-value-calculator'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Earned Value Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

export default function EarnedValueCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/earned-value-calculator')} />
      {children}
    </InnerShell>
  )
}
