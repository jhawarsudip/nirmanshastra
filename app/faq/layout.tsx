import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'FAQ: how the quantities are worked out'
const description =
  'Answers about NirmanShastra: what the quantity reports contain, what is free, how the numbers are worked out from Indian Standards, what is left out, and how payment and refunds work.'
const url = '/faq'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra: material quantities for Indian homes' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <InnerShell>{children}</InnerShell>
}
