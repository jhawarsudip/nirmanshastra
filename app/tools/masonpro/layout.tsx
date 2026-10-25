import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import ToolInfo from '@/components/v2/inner/ToolInfo'
import { toolJsonLd } from '@/lib/seo/schema'

const title = 'MasonryPro: Brick, Block, Mortar and Plaster Quantity Calculator | IS 1200, IS 1077, IS 6041'
const description = 'Work out the bricks or blocks, mortar, cement, sand, plaster and lintels for the walls of your home, measured from your rooms the IS 1200 way. Quantities only. ₹699 per report.'
const url = '/tools/masonpro'

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

export default function MasonryProLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/masonpro')} />
      {children}
      <ToolInfo path="/tools/masonpro" />
    </InnerShell>
  )
}
