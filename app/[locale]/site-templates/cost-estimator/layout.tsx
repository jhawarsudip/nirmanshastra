import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { templateJsonLd } from '@/lib/seo/schema'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

const title =
  'Construction Cost Estimator Excel Template'
const description =
  'An Excel construction cost estimator for contractors. Price a house from IS-code quantities using your own rates, make a client quotation, and compare up to 3 quotes. ₹2,499, instant download.'
const url = '/site-templates/cost-estimator'

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
        alt: 'NirmanShastra — Construction Cost Estimator Excel Template (India Edition)',
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
  return localizeMetadata(metadata, asLocale(locale), '/site-templates/cost-estimator', HI)
}

export default async function CostEstimatorLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      <JsonLd data={templateJsonLd('/site-templates/cost-estimator')} />
      {children}
    </>
  )
}
