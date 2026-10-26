import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import ToolInfo from '@/components/v2/inner/ToolInfo'
import { toolJsonLd } from '@/lib/seo/schema'
import { PRICE } from '@/lib/tool-pricing'

const title = 'Grand Total: One Buying List for Your Whole House | Frame, Walls, Wiring, Plumbing, Finishing'
const description = `Add your paid StructurePro, MasonryPro, ElectricalPro, PlumbingPro and InteriorPro reports into one list of what to buy, with cement, sand and stone added across phases and nothing counted twice. Quantities only. ${PRICE.grandtotal}.`
const url = '/tools/grand-total'

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

export default function GrandTotalLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/grand-total')} />
      {children}
      <ToolInfo path="/tools/grand-total" />
    </InnerShell>
  )
}
