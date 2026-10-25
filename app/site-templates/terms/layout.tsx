import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/seo/schema'

// On main the /site-templates layout sets a plain string title, which drops the root title template, so the brand is written out here.
const title = 'Site Templates Terms and Licence | NirmanShastra'
const description =
  'The licence, delivery and refund terms for the NirmanShastra Excel Site Templates: what you may do with the files, 48-hour download links, refunds, free updates and limits of liability.'
const url = '/site-templates/terms'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra: material quantities for Indian homes' }],
  },
  twitter: { card: 'summary_large_image', title, description },
}

export default function SiteTemplatesTermsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Site Templates', path: '/site-templates' },
            { name: 'Terms and Licence', path: url },
          ]),
        ]}
      />
      {children}
    </>
  )
}
