import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// A private page: kept out of search results. The root layout's title template appends " | NirmanShastra".
const metadata: Metadata = {
  title: 'My reports',
  description: 'Your saved NirmanShastra quantity reports. Download a paid PDF report again at any time.',
  robots: { index: false, follow: false },
}

// Hindi title and description for this page.
const HI: HiMeta = {
  title: 'मेरी रिपोर्टें',
  description: 'आपकी सहेजी हुई NirmanShastra मात्रा रिपोर्टें। पेड PDF रिपोर्ट आप कभी भी दोबारा डाउनलोड कर सकते हैं।',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/reports', HI)
}

export default async function ReportsLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return <InnerShell locale={asLocale(locale)}>{children}</InnerShell>
}
