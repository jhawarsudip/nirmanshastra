import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { breadcrumbSchema } from '@/lib/seo/schema'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'About NirmanShastra: Quantities First, Worked Out in the Open'
const description =
  'NirmanShastra works out how much concrete, steel, cement, bricks, wire and pipe a house needs, to the Indian Standards, and sets no prices of its own: you can add your own rates to see the rupees. Built and run by one bootstrapped founder with a B.Tech in Civil Engineering.'
const url = '/about'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra: material quantities for Indian homes, to the Indian Standards' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={[breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'About', path: url }])]} />
      {children}
    </InnerShell>
  )
}
