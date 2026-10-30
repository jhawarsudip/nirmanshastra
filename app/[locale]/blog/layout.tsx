import InnerShell from '@/components/v2/inner/InnerShell'
import { setRequestLocale } from 'next-intl/server'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// Each blog page sets its own metadata; this layout only gives the whole section the v2 frame.
export default async function BlogLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return <InnerShell locale={asLocale(locale)}>{children}</InnerShell>
}
