import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { templateJsonLdFor } from '@/lib/i18n/labels/templates-jsonld'
import { templateHiMeta } from '@/lib/i18n/labels/templates-meta'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

const title =
  'Site Labour Payroll & Compliance Excel'
const description =
  'A 16-sheet Excel labour payroll and compliance workbook for Indian construction — muster roll, wage register, PF/ESI and minimum-wage checks, wage slips and subcontractor compliance holds under India’s four Labour Codes (in force since Nov 2025). ₹1,999, instant download.'
const url = '/site-templates/labour-compliance'

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
        alt: 'NirmanShastra — Construction Labour Payroll & Compliance Excel Template (India Edition)',
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
const HI: HiMeta = templateHiMeta('labour-compliance')

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/site-templates/labour-compliance', HI)
}

export default async function LabourComplianceLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      <JsonLd data={templateJsonLdFor('/site-templates/labour-compliance', locale)} />
      {children}
    </>
  )
}
