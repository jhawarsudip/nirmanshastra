import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { crumbs } from '@/lib/i18n/labels/pages-common'
import { ABOUT_META_HI } from '@/lib/i18n/labels/pages-about'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'About NirmanShastra: Quantities First, Worked Out in the Open'
const description =
  'NirmanShastra works out how much concrete, steel, cement, bricks, wire and pipe a house needs, to the Indian Standards, and sets no prices of its own: you can add your own rates to see the rupees. Built and run by one bootstrapped founder with a B.Tech in Civil Engineering.'
const url = '/about'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra: material quantities for Indian homes, to the Indian Standards' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name and abbreviations stay in Latin letters.
const HI: HiMeta = ABOUT_META_HI

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/about', HI)
}

export default async function AboutLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  const loc = asLocale(locale)
  return (
    <InnerShell locale={loc}>
      <JsonLd data={[breadcrumbSchema(crumbs(loc, 'About', 'हमारे बारे में', url))]} />
      {children}
    </InnerShell>
  )
}
