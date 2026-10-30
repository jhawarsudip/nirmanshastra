import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { crumbs } from '@/lib/i18n/labels/pages-common'
import { CAREERS_META_HI } from '@/lib/i18n/labels/pages-about'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Careers: NirmanShastra Is Not Hiring'
const description =
  'NirmanShastra is a one-person, bootstrapped company and has no open roles. If you build software, write about construction, or work on site, and want to help, you can still write in.'
const url = '/careers'

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
const HI: HiMeta = CAREERS_META_HI

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/careers', HI)
}

export default async function CareersLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  const loc = asLocale(locale)
  return (
    <InnerShell locale={loc}>
      <JsonLd data={[breadcrumbSchema(crumbs(loc, 'Careers', 'करियर', url))]} />
      {children}
    </InnerShell>
  )
}
