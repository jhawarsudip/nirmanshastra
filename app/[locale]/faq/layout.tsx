import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'FAQ: how the quantities are worked out'
const description =
  'Answers about NirmanShastra: what the quantity reports contain, what is free, how the numbers are worked out from Indian Standards, what is left out, and how payment and refunds work.'
const url = '/faq'

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

// Hindi title and description for this page. Left empty until the Hindi copy is written; the page then keeps its English text.
const HI: HiMeta = {}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/faq', HI)
}

export default async function FAQLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return <InnerShell locale={asLocale(locale)}>{children}</InnerShell>
}
