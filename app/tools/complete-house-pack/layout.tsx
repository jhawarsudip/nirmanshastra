import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import ToolInfo from '@/components/v2/inner/ToolInfo'
import { toolJsonLd } from '@/lib/seo/schema'
import { PRICE } from '@/lib/tool-pricing'

const title = 'Complete House Pack: All Five Quantity Reports and the Grand Total for One House'
const description = `One purchase for ${PRICE.pack} unlocks StructurePro, MasonryPro, ElectricalPro, PlumbingPro, InteriorPro and the Grand Total buying list for one house. Bought one by one they cost ${PRICE.packSeparate}: you save ${PRICE.packSavings}.`
const url = '/tools/complete-house-pack'

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

export default function CompleteHousePackLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/complete-house-pack')} />
      {children}
      <ToolInfo path="/tools/complete-house-pack" />
    </InnerShell>
  )
}
