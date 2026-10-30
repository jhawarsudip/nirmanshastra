import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, localizePath, type LocaleParams } from '@/lib/i18n/paths'
import { HOME_HI } from '@/lib/i18n/labels/pages-common'

// The parent layout's title template appends " | NirmanShastra", so the brand is not repeated here.
const title = 'Site Templates Terms and Licence'
const description =
  'The licence, delivery and refund terms for the NirmanShastra Excel Site Templates: what you may do with the files, 48-hour download links, refunds, free updates and limits of liability.'
const url = '/site-templates/terms'

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

// Hindi title, description and share-image text. The brand name stays in Latin letters; the 48 hours are the English figure.
const HI: HiMeta = {
  title: 'साइट टेम्पलेट की शर्तें और लाइसेंस',
  description: 'NirmanShastra के Excel साइट टेम्पलेट की लाइसेंस, डिलीवरी और रिफ़ंड की शर्तें: फ़ाइलों के साथ आप क्या कर सकते हैं, 48 घंटे के डाउनलोड लिंक, रिफ़ंड, मुफ़्त अपडेट और दायित्व की सीमाएँ।',
  imageAlt: 'NirmanShastra: भारतीय घरों के लिए सामग्री की मात्राएँ',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/site-templates/terms', HI)
}

export default async function SiteTemplatesTermsLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  const hi = asLocale(locale) === 'hi'
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(
            hi
              ? [
                  { name: HOME_HI, path: localizePath('/', 'hi') },
                  { name: 'साइट टेम्पलेट', path: localizePath('/site-templates', 'hi') },
                  { name: 'शर्तें और लाइसेंस', path: localizePath(url, 'hi') },
                ]
              : [
                  { name: 'Home', path: '/' },
                  { name: 'Site Templates', path: '/site-templates' },
                  { name: 'Terms and Licence', path: url },
                ],
          ),
        ]}
      />
      {children}
    </>
  )
}
