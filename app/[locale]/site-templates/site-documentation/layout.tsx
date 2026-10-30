import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { templateJsonLd } from '@/lib/seo/schema'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

const title =
  'Site Documentation Pack: RFI, NCR, Tests'
const description =
  'A 14-sheet Excel site documentation pack for Indian projects — drawing register, RFI register, NCR and test registers, procurement log, daily site log and snag list. The contemporaneous record that holds up in a dispute. ₹1,699, instant download.'
const url = '/site-templates/site-documentation'

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
        alt: 'NirmanShastra — Construction Site Documentation Pack (India Edition)',
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
  return localizeMetadata(metadata, asLocale(locale), '/site-templates/site-documentation', HI)
}

export default async function SiteDocumentationLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      <JsonLd data={templateJsonLd('/site-templates/site-documentation')} />
      {children}
    </>
  )
}
