import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import { GLOSSARY_TERM_COUNT } from '@/lib/seo/glossary'
import { GLOSSARY_META_HI } from '@/lib/i18n/labels/pages-glossary'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = `Construction Glossary: ${GLOSSARY_TERM_COUNT} Terms from BOQ to TMT`
const description =
  'Plain-English definitions of BOQ, M20, IS 456, TMT, BBS, RA bill, retention, LPCD, RCCB, earned value and more, with the IS code and the number each one uses.'
const url = '/glossary'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra construction glossary' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name, IS numbers and abbreviations stay in Latin letters.
const HI: HiMeta = GLOSSARY_META_HI

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/glossary', HI)
}

export default async function GlossaryLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return <InnerShell locale={asLocale(locale)}>{children}</InnerShell>
}
