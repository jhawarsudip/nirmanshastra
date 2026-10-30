import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { crumbs } from '@/lib/i18n/labels/pages-common'
import { CONTACT_META_HI } from '@/lib/i18n/labels/pages-about'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Contact NirmanShastra'
const description =
  'Questions about a quantity report, a standard it cites, or a payment? Write to NirmanShastra. We answer within 24 to 48 hours on business days.'
const url = '/contact'

const metadata: Metadata = {
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

// Hindi title, description and share-image text. The brand name stays in Latin letters.
const HI: HiMeta = CONTACT_META_HI

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/contact', HI)
}

export default async function ContactLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  const loc = asLocale(locale)
  return (
    <InnerShell locale={loc}>
      <JsonLd data={[breadcrumbSchema(crumbs(loc, 'Contact', 'संपर्क', url))]} />
      {children}
    </InnerShell>
  )
}
