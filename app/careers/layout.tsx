import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { breadcrumbSchema } from '@/lib/seo/schema'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Careers: NirmanShastra Is Not Hiring'
const description =
  'NirmanShastra is a one-person, bootstrapped company and has no open roles. If you build software, write about construction, or work on site, and want to help, you can still write in.'
const url = '/careers'

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

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return (
    <InnerShell>
      <JsonLd data={[breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Careers', path: url }])]} />
      {children}
    </InnerShell>
  )
}
