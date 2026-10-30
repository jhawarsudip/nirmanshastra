import type { Metadata } from 'next'
import { BUNDLE } from '@/lib/seo/site'
import InnerShell from '@/components/v2/inner/InnerShell'
import '@/styles/v2/results.css'
import '@/styles/v2/content.css'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// /site-templates is a client page, so its metadata lives here. Without this the
// index inherited the homepage title, description and og:url. Structured data
// (BreadcrumbList) is rendered by the page itself, NOT here, because a layout
// also wraps every nested template page, each of which carries its own JSON-LD.
// Nested layouts override this metadata, so they are unaffected.
// A layout that sets its own title replaces the root template for everything under it, so this one carries the template again.
const bundle = `₹${(BUNDLE.pricePaise / 100).toLocaleString('en-IN')}`
const title = 'Construction Excel Templates for India'
const description = `Six Excel toolkits for Indian construction sites: cost estimator and BOQ, site documentation, billing and measurement, bar bending schedule, labour compliance, and planning and delay control. Buy one or all six for ${bundle}. Instant download.`
const url = '/site-templates'

// The six product pages below this layout set a plain title; this template adds the brand to them.
const metadata: Metadata = {
  title: { default: title, template: '%s | NirmanShastra' },
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

// One frame for the index and all six product pages (their own layouts only add titles and structured data).
// Hindi title and description for this page. Left empty until the Hindi copy is written; the page then keeps its English text.
const HI: HiMeta = {}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/site-templates', HI)
}

export default async function SiteTemplatesLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return <InnerShell locale={asLocale(locale)}>{children}</InnerShell>
}
