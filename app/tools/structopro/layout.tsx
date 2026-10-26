
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import ToolInfo from '@/components/v2/inner/ToolInfo'
import { toolJsonLd } from '@/lib/seo/schema'
import { PRICE } from '@/lib/tool-pricing'

const title = 'StructurePro: Concrete, Steel and Cement Quantity Calculator for RCC Houses | IS 456, IS 1893'
const description = `Work out the concrete, steel, cement, sand, aggregate and shuttering for your RCC frame from a few plain answers, to IS 456, IS 875 and IS 1893. Exact quantities; add your own rates for rupees. ${PRICE.structopro} per report.`
const url = '/tools/structopro'

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

export default function StructoProLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/structopro')} />
      {children}
      {/* The explainer sits full-width under the wizard, so it is placed after <main>'s content by the shell's own wrapper */}
      <ToolInfo path="/tools/structopro" />
    </InnerShell>
  )
}
