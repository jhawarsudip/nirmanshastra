import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { toolJsonLd } from '@/lib/seo/schema'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Bar Bending Calculator: cutting length and weight of a bar'
const description =
  'Free bar bending calculator. Choose the shape (straight, L, U, crank, stirrup, square tie), the bar size and the lengths to get the length to cut and the weight, with bends taken off, 135° hooks added and the length rounded up to 25 mm. IS 2502, IS 1786 and IS 13920. No sign-in.'
const url = '/tools/bar-bending-schedule-calculator'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Bar Bending Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

export default function BarBendingScheduleCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={toolJsonLd('/tools/bar-bending-schedule-calculator')} />
      {children}
    </InnerShell>
  )
}
