import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { REFUND_ASK_DAYS, REFUND_FAILED_DELIVERY_HOURS } from '@/lib/policy'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Refund Policy'
const description = `A report that has been delivered is not refundable, and you can look at a real sample first. A report that cannot be delivered within ${REFUND_FAILED_DELIVERY_HOURS} hours of payment because of a fault on our side is refunded in full: email us within ${REFUND_ASK_DAYS} days.`
const url = '/refund-policy'

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

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={[breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Refund Policy', path: url }])]} />
      {children}
    </InnerShell>
  )
}
