import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = "Check a Contractor's Quantities: Concrete, Steel, Cement, Shuttering"
const description =
  "Before you compare prices, compare what each price counts. Ask for four quantities, then see whether each is close to, common for, or above what the Indian Standards need for your RCC frame. Quantities only."
const url = '/compare-quote'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: "NirmanShastra: check a contractor's quantities against the Indian Standards" }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title and description for this page. Left empty until the Hindi copy is written; the page then keeps its English text.
const HI: HiMeta = {}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/compare-quote', HI)
}

export default async function CompareQuoteLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={[breadcrumbSchema([{ name: 'Home', path: '/' }, { name: "Check a contractor's quantities", path: url }])]} />
      {children}
    </InnerShell>
  )
}
