import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import ToolInfo from '@/components/v2/inner/ToolInfo'
import { toolJsonLd } from '@/lib/seo/schema'

const title = 'PlumbingPro: Plumbing Quantity Calculator | IS 1172, IS 1742, IS 2470'
const description = 'Work out the pipe lengths, tank sizes, pump, drains, septic tank and every fitting to buy for your home, to the Indian Standards. Quantities only. ₹499 per report.'
const url = '/tools/plumbpro'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra: India’s IS-code construction quantities' }],
  },
  twitter: { card: 'summary_large_image', title, description },
}

export default function PlumbProLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/plumbpro')} />
      {children}
      <ToolInfo path="/tools/plumbpro" />
    </InnerShell>
  )
}
