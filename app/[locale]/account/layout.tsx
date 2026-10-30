import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// A private page: kept out of search results. The root layout's title template appends " | NirmanShastra".
const metadata: Metadata = {
  title: 'Account settings',
  description: 'Manage your NirmanShastra account preferences and data-sharing settings.',
  robots: { index: false, follow: false },
}

// Hindi title and description for this page.
const HI: HiMeta = {
  title: 'खाते की सेटिंग',
  description: 'अपने NirmanShastra खाते की पसंद और डेटा साझा करने की सेटिंग सँभालिए।',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/account', HI)
}

export default async function AccountLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return <InnerShell locale={asLocale(locale)}>{children}</InnerShell>
}
