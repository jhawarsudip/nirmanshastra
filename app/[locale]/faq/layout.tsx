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

// Hindi title, description and share-image text. The brand name and IS numbers stay in Latin letters.
const HI: HiMeta = {
  title: 'FAQ: मात्राएँ कैसे निकाली जाती हैं',
  description:
    'NirmanShastra के बारे में जवाब: मात्रा रिपोर्टों में क्या होता है, क्या मुफ़्त है, मात्राएँ भारतीय मानकों से कैसे निकलती हैं, क्या छोड़ा गया है, और भुगतान व रिफ़ंड कैसे काम करते हैं।',
  imageAlt: 'NirmanShastra: भारतीय घरों के लिए सामग्री की मात्राएँ',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/faq', HI)
}

export default async function FAQLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return <InnerShell locale={asLocale(locale)}>{children}</InnerShell>
}
