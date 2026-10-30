import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { templateJsonLdFor } from '@/lib/i18n/labels/templates-jsonld'
import { templateHiMeta } from '@/lib/i18n/labels/templates-meta'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

const title =
  'Bar Bending Schedule Excel (IS 2502)'
const description =
  'A 12-sheet Excel bar bending schedule template for India — shape library, cutting-length calculator with bend deductions and hook allowances per IS 2502, lap and development lengths, cutting optimiser and steel order note. ₹2,099, instant download.'
const url = '/site-templates/bar-bending-schedule'

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
        alt: 'NirmanShastra — Bar Bending Schedule Excel Template (India Edition, IS 2502)',
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
const HI: HiMeta = templateHiMeta('bar-bending-schedule')

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/site-templates/bar-bending-schedule', HI)
}

export default async function BarBendingScheduleLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      <JsonLd data={templateJsonLdFor('/site-templates/bar-bending-schedule', locale)} />
      {children}
    </>
  )
}
