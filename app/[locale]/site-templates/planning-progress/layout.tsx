import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { templateJsonLdFor } from '@/lib/i18n/labels/templates-jsonld'
import { templateHiMeta } from '@/lib/i18n/labels/templates-meta'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

const title =
  'Project Controls Excel: S-Curve & Delays'
const description =
  'A 17-sheet Excel project controls workbook for Indian construction — baseline plan, Gantt, value-weighted S-curve and earned value, cash flow, plus a delay and EOT register with contract classification and notice-deadline tracking. ₹2,299, instant download.'
const url = '/site-templates/planning-progress'

const metadata: Metadata = {
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
        alt: 'NirmanShastra — Construction Project Controls Excel Template (EVM & Delay Register, India Edition)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

// Hindi title, description and share-image text (lib/i18n/labels/templates-meta.ts). The price in the description comes from the catalog.
const HI: HiMeta = templateHiMeta('planning-progress')

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/site-templates/planning-progress', HI)
}

export default async function PlanningProgressLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      <JsonLd data={templateJsonLdFor('/site-templates/planning-progress', locale)} />
      {children}
    </>
  )
}
