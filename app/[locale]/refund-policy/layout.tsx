import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { REFUND_ASK_DAYS, REFUND_FAILED_DELIVERY_HOURS } from '@/lib/policy'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import { crumbs } from '@/lib/i18n/labels/pages-common'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Refund Policy'
const description = `A report that has been delivered is not refundable, and you can look at a real sample first. A report that cannot be delivered within ${REFUND_FAILED_DELIVERY_HOURS} hours of payment because of a fault on our side is refunded in full: email us within ${REFUND_ASK_DAYS} days.`
const url = '/refund-policy'

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

// Hindi title, description and share-image text. The hours and days are the same constants as the English; the brand name stays in Latin letters.
const HI: HiMeta = {
  title: 'रिफ़ंड नीति',
  description: `जो रिपोर्ट पहुँचा दी गई है, वह वापस नहीं होती, और आप ख़रीदने से पहले एक असली नमूना देख सकते हैं। जो रिपोर्ट हमारी ओर की किसी ख़राबी से भुगतान के ${REFUND_FAILED_DELIVERY_HOURS} घंटे के भीतर नहीं पहुँचाई जा सकती, उसका पूरा रिफ़ंड होता है: ${REFUND_ASK_DAYS} दिन के भीतर हमें ईमेल कीजिए।`,
  imageAlt: 'NirmanShastra: भारतीय घरों के लिए सामग्री की मात्राएँ',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/refund-policy', HI)
}

export default async function RefundLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={[breadcrumbSchema(crumbs(asLocale(locale), 'Refund Policy', 'रिफ़ंड नीति', url))]} />
      {children}
    </InnerShell>
  )
}
