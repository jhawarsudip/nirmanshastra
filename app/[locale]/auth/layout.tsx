import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import '@/styles/v2/content.css'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// A private page: kept out of search results. The root layout's title template appends " | NirmanShastra".
const metadata: Metadata = {
  title: 'Log in or create an account',
  description: 'Log in to NirmanShastra to see your saved reports, or create an account.',
  robots: { index: false, follow: false },
}

// Hindi title and description for this page. Left empty until the Hindi copy is written; the page then keeps its English text.
const HI: HiMeta = {}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/auth', HI)
}

export default async function AuthLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return <InnerShell locale={asLocale(locale)}>{children}</InnerShell>
}
