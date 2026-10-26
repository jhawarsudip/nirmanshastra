import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import ToolInfo from '@/components/v2/inner/ToolInfo'
import { toolJsonLd } from '@/lib/seo/schema'
import { PRICE } from '@/lib/tool-pricing'

const title = 'InteriorPro: Finishing Quantity Calculator for Homes | Paint, Tiles, Doors, False Ceiling | IS 1200, IS 15622'
const description = `Count the paint, putty and primer, floor and wall tiles, doors and windows, false ceiling and plywood for your home, area by area. Exact quantities; add your own rates for rupees. ${PRICE.interiorpro} per report.`
const url = '/tools/interiorpro'

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

export default function InteriorProLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/interiorpro')} />
      {children}
      <ToolInfo path="/tools/interiorpro" />
    </InnerShell>
  )
}
