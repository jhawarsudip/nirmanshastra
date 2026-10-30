import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { templateJsonLd } from '@/lib/seo/schema'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

const title =
  'Billing & Measurement Excel (IS 1200)'
const description =
  'A 9-sheet Excel billing and measurement workbook for Indian construction — measurement book, IS 1200 deductions, abstract against BOQ, and RA bills with retention, TDS (Section 393) and GST, tracked to close. ₹2,299, instant download.'
const url = '/site-templates/billing-measurement'

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
        alt: 'NirmanShastra — Construction Billing & Measurement Excel Template (India Edition)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

// Hindi title and description for this page. Left empty until the Hindi copy is written; the page then keeps its English text.
const HI: HiMeta = {}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/site-templates/billing-measurement', HI)
}

export default async function BillingMeasurementLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      <JsonLd data={templateJsonLd('/site-templates/billing-measurement')} />
      {children}
    </>
  )
}
