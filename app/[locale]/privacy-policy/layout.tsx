import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import { crumbs } from '@/lib/i18n/labels/pages-common'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Privacy Policy'
const description =
  'What personal data NirmanShastra collects, how it is used, who it is shared with, how long it is kept, and your rights under Indian law.'
const url = '/privacy-policy'

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
  title: 'गोपनीयता नीति',
  description: 'NirmanShastra कौन-सा व्यक्तिगत डेटा इकट्ठा करता है, उसका उपयोग कैसे होता है, वह किसके साथ साझा होता है, कितने समय तक रखा जाता है, और भारतीय क़ानून के तहत आपके अधिकार।',
  imageAlt: 'NirmanShastra: भारतीय घरों के लिए सामग्री की मात्राएँ',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/privacy-policy', HI)
}

export default async function PrivacyLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={[breadcrumbSchema(crumbs(asLocale(locale), 'Privacy Policy', 'गोपनीयता नीति', url))]} />
      {children}
    </InnerShell>
  )
}
