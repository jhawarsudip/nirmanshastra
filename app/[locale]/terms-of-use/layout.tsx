import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import { crumbs } from '@/lib/i18n/labels/pages-common'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Terms of Use'
const description =
  'The terms for using NirmanShastra: what the quantity tools and reports are and are not, payment and refunds, accounts, acceptable use, liability and governing law.'
const url = '/terms-of-use'

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
const HI: HiMeta = {
  title: 'उपयोग की शर्तें',
  description: 'NirmanShastra के उपयोग की शर्तें: मात्रा के टूल और रिपोर्टें क्या हैं और क्या नहीं, भुगतान और रिफ़ंड, खाते, स्वीकार्य उपयोग, दायित्व और लागू क़ानून।',
  imageAlt: 'NirmanShastra: भारतीय घरों के लिए सामग्री की मात्राएँ',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/terms-of-use', HI)
}

export default async function TermsLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={[breadcrumbSchema(crumbs(asLocale(locale), 'Terms of Use', 'उपयोग की शर्तें', url))]} />
      {children}
    </InnerShell>
  )
}
