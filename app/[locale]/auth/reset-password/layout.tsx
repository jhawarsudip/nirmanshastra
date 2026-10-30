import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The parent layout supplies the page frame; this one only gives the page its own title.
const metadata: Metadata = {
  title: 'Set a new password | NirmanShastra',
  description: 'Choose a new password for your NirmanShastra account.',
  robots: { index: false, follow: false },
}

// Hindi title and description for this page.
const HI: HiMeta = {
  title: 'नया पासवर्ड सेट कीजिए',
  description: 'अपने NirmanShastra खाते के लिए नया पासवर्ड चुनिए।',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/auth/reset-password', HI)
}

export default async function ResetPasswordLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return children
}
