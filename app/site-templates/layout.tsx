import type { Metadata } from 'next'
import { BUNDLE } from '@/lib/seo/site'

// /site-templates is a client page, so its metadata lives here. Without this the
// index inherited the homepage title, description and og:url. Structured data
// (BreadcrumbList) is rendered by the page itself, NOT here, because a layout
// also wraps every nested template page, each of which carries its own JSON-LD.
// Nested layouts override this metadata, so they are unaffected.
// The root layout's title template appends " | NirmanShastra"; do not repeat the brand here.
const bundle = `₹${(BUNDLE.pricePaise / 100).toLocaleString('en-IN')}`
const title = 'Construction Excel Templates for India: BOQ, Billing, BBS'
const description = `Six Excel toolkits for Indian construction sites: cost estimator and BOQ, site documentation, billing and measurement, bar bending schedule, labour compliance, and planning and delay control. Buy one or all six for ${bundle}. Instant download.`
const url = '/site-templates'

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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra — Excel templates for Indian construction sites',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function SiteTemplatesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
