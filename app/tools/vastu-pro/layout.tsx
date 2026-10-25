import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { toolJsonLd } from '@/lib/seo/schema'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'VastuPro: free Vastu check of your home plan'
const description =
  'Free Vastu check of a home plan: set where North is, mark your rooms, and get a 16-zone reading of each one, an overall score and a PDF of your findings. Traditional guidance, not an IS code.'
const url = '/tools/vastu-pro'

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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra VastuPro: a free Vastu check of your home plan',
      },
    ],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

export default function VastuProLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/vastu-pro')} />
      {children}
    </InnerShell>
  )
}
